# RecruiterFind — Project Update & Continuity Log

Last updated: 2026-11-12

---

## What This App Does

**RecruiterFind** is a LinkedIn recruiter discovery SaaS. A user enters a company name + country, and the app finds recruiters/talent acquisition professionals at that company and returns their name, verified title, LinkedIn URL, and email (if scraped). The output is a CSV download.

The core value: job seekers can find the specific recruiter at a company who is actively hiring, without manually searching LinkedIn.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Auth | Supabase (email/password) |
| Database | Supabase Postgres |
| Scraping | Apify (free tier) |
| AI email drafts | Anthropic Claude Haiku |
| Styling | Inline styles (no Tailwind — Turbopack + JIT had CSS generation issues) |

**Design tokens** used throughout all pages:
```
ACCENT   = #e8533a
LIGHT_BG = #f7f8fc
BORDER   = #e5e7eb
TEXT     = #111827
MUTED    = #6b7280
NAV_BG   = #0d0f1c
```
Fonts: `Space Grotesk` (headings), `Inter` (body).

---

## Project Structure

```
src/
  app/
    (marketing)/landing/   — public landing page
    (auth)/login/          — login page
    (auth)/signup/         — signup page
    (app)/scrapper/        — main scraper UI (protected)
    (app)/orders/          — order history (protected)
    (app)/configuration/   — API key settings (protected)
    api/scrape/route.ts    — the scraping API endpoint
    api/auth/              — Supabase auth helpers
  lib/
    supabase/              — server + client Supabase helpers
    utils.ts               — resultsToCSV(), formatDate()
  types/index.ts           — ScrapeRequest, RecruiterResult types
  proxy.ts                 — renamed from middleware.ts; handles auth gating
```

---

## Dev Setup

### Running locally

```bash
npm run dev
# Server at http://localhost:3000
```

### Environment variables (`.env.local`)

```
# Skip Supabase auth entirely in dev — use this to test the scraper
DEV_BYPASS_AUTH=true

# Required when DEV_BYPASS_AUTH=true
APIFY_API_KEY=apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional — only needed for AI email draft generation
ANTHROPIC_API_KEY=...

# Required for production (Supabase)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Dev bypass explained

When `DEV_BYPASS_AUTH=true`:
- `src/proxy.ts` skips the Supabase session check and lets all requests through
- `src/app/api/scrape/route.ts` skips user auth, skips order DB writes, reads API keys from env vars directly
- Results are returned directly in the HTTP response — no DB storage
- `orderId` in the response will be `null`

Without bypass: users must be logged in, keys come from their `configurations` table row, and orders are written to the `orders` table.

---

## Supabase Schema (key tables)

### `configurations`
Stores per-user API keys and settings.
```sql
user_id           uuid (FK → auth.users)
apify_api_key     text
anthropic_api_key text
custom_email_prompt text   -- template with {{user_name}}, {{recruiter_name}}, etc.
```

### `orders`
One row per scrape job.
```sql
id              uuid
user_id         uuid
company         text
country         text
requested_count int
actual_count    int
status          text  -- 'processing' | 'completed' | 'failed'
results         jsonb -- array of RecruiterResult
query_text      text
role_type       text
activity_window int
user_name       text
user_title      text
error           text
created_at      timestamptz
```

---

## The Scraping Pipeline (Current Working State)

### Stage 1 — Google Search (the discovery step)

**Apify actor:** `apify/google-search-scraper`

**What it does:** Runs a Google search for `site:linkedin.com/in recruiter OR "talent acquisition" OR sourcer "Company" Country`. Google's index of LinkedIn public profile pages includes the page title, which is always in the format:

```
"Brad Fuellenbach - Technical Recruiter at Apple | LinkedIn"
```

This gives us the person's **name + verified job title** without requiring LinkedIn authentication or a paid plan.

**Key implementation detail:** The actor returns **one dataset item per search page** (not one item per result). Each page item has an `organicResults` array nested inside it. The route flattens this:

```typescript
const { items: pageItems } = await apify.dataset(searchRun.defaultDatasetId).listItems();
const googleResults = (pageItems as Array<Record<string, unknown>>)
  .flatMap(page => (page.organicResults as Array<Record<string, unknown>>) ?? []);
```

**Input format:**
```typescript
await apify.actor('apify/google-search-scraper').call({
  queries: googleQuery,       // string (not array)
  resultsPerPage: fetchCount, // max 100
  maxPagesPerQuery: Math.ceil(fetchCount / 10),
  languageCode: 'en',
  countryCode: 'us',
});
```

**fetchCount** is capped at 20 results (2 Google pages, ~34 seconds). This keeps the response within Next.js's ~90s route timeout. Google returns ~90% genuine recruiters for this query, so 20 raw results reliably yields 10 unique verified recruiters after filtering + deduplication.

**Title parsing:** Each Google result title is parsed with:
```typescript
const cleaned = rawTitle.replace(/\s*[\|]\s*LinkedIn\s*$/i, '').trim();
const sep = cleaned.match(/^(.+?)\s*[-–—]\s*(.+)$/);
const name = sep ? sep[1].trim() : cleaned;
const headline = sep ? sep[2].trim() : '';
```

### Stage 2 — Hiring Activity Enrichment (SKIPPED on free tier)

Would use `socialdataapi/linkedin-posts-scraper` per LinkedIn URL to get recent posts and score hiring activity. Skipped because: requires a paid Apify plan to run many actors in parallel efficiently, and adds ~30s per profile. All `hiring_score` values are currently 0.

**On a paid plan:** iterate over Stage 1 results, fetch each profile's recent posts, run them through `scoreHiringActivity()` (already implemented in route.ts), and re-sort.

### Stage 3 — Filter + Rank

```typescript
function isRecruiterTitle(title: string): boolean {
  const t = title.toLowerCase();
  return (
    t.includes('recruiter') || t.includes('recruiting') || t.includes('recruitment') ||
    t.includes('talent acquisition') || t.includes('talent partner') ||
    t.includes('sourcer') || t.includes('sourcing') ||
    t.includes('hr partner') || t.includes('hr manager') ||
    t.includes('human resources') || t.includes('people partner') ||
    t.includes('people operations') || t.includes('staffing')
  );
}
```

Sorted by: hiring score (desc) → has email (email-holders first) → original order.
Deduplicated by LinkedIn URL.

### Stage 4 — AI Email Drafts (optional)

If `ANTHROPIC_API_KEY` is set and `user_name` was sent in the request body, generates a personalised outreach email draft per recruiter using `claude-haiku-5-5`. Uses `custom_email_prompt` template from the user's `configurations` row. Only runs for recruiters who have a known scraped email (doesn't guess emails).

---

## What Was Tried and Why It Failed

### `socialdataapi/linkedin-company-employees-scraper` (first approach)
- Returns company employee list from LinkedIn
- **Problem:** Free Apify plan locks it to `profileScraperMode: 'short'` → `headline: null` for ~90% of profiles
- Without headlines, `isRecruiterTitle()` filters everything out
- Verdict: **useless for recruiter title verification on the free tier**

### `data_forge_org/linkedin-scraper` (enrichment attempt)
- Tried as a Stage 2 enrichment to get job titles from individual LinkedIn URLs
- **Problem:** Returns profile data but `experiences[0]` has only `company_name`, `company_logo_url`, `location` — **no `title` field at all**
- Verdict: **does not return job titles, dropped entirely**

### `curious_coder/linkedin-people-search-scraper`
- LinkedIn people search scraper
- **Problem:** Requires a valid LinkedIn session cookie as input (`Field input.cookie is required`)
- We don't have a LinkedIn cookie
- Verdict: **requires auth we don't have**

### `apify/google-search-scraper` (current working approach)
- **Fixed bug:** Route was treating page-level items as individual results instead of unwrapping `organicResults` → 0 results every time
- **Also fixed:** `isRecruiterTitle` was missing `"recruitment"` (caught `"recruiting"` but not `"recruitment"`, e.g. "University Recruitment @ Apple")
- **Also fixed:** `fetchCount` was set to `requested_count * 3` → up to 3 Google pages → ~50s, hitting Next.js timeout. Capped at 20 (2 pages, ~34s).

---

## Emails — Current State

**No email guessing.** The `email` field is only populated if the scraper returns a real scraped email. Google search results do not include emails. Apify's free tier employee scraper does not expose emails either.

To get real emails on a paid plan, options are:
1. `socialdataapi/linkedin-profiles-scraper` with full profile mode — sometimes exposes contact info if the user made it public
2. `Hunter.io` API — finds professional emails by name + company domain
3. `Apollo.io` API — similar to Hunter, with higher hit rates

The `extractStr()` and email handling in route.ts is already set up to use real scraped emails if they appear — just no source returns them currently.

---

## CSV Output

The scrapper page (`src/app/scrapper/page.tsx`) auto-downloads a CSV when results arrive:

```typescript
if (data.results?.length) {
  const csv  = resultsToCSV(data.results);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `recruiters-${form.company}-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
```

`resultsToCSV()` is in `src/lib/utils.ts`.

---

## Known Limitations / What's Not Done Yet

1. **Supabase credentials not wired** — `.env.local` only has `DEV_BYPASS_AUTH=true`. Real `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` need to be added before the app works for real users.

2. **No email source** — Emails are always blank until a paid email enrichment API (Hunter, Apollo, etc.) is wired into Stage 2 or Stage 4.

3. **Hiring score always 0** — Stage 2 (LinkedIn post scraping per profile) is skipped on the free Apify plan. On a paid plan: add a loop after Stage 1 that calls `socialdataapi/linkedin-posts-scraper` for each profile URL.

4. **Location field shows Google snippet** — The `location` field on results currently contains the first 100 chars of the Google search description snippet (e.g., "Technical Recruiter at Apple · Experience: Apple..."). Not a real city/region. Getting a real location would require a full profile scrape.

5. **Profile images are null** — Google search doesn't return profile photos. Would need a full profile scrape.

6. **`orders/page.tsx` works visually** but order status will always show "processing" in dev bypass mode since nothing writes to the DB.

7. **Stripe / billing not implemented** — There is no payment layer yet. The app currently has no access control beyond Supabase auth login.

---

## Files Most Likely to Need Changes

| File | Why |
|------|-----|
| `src/app/api/scrape/route.ts` | Core pipeline — if adding email APIs, hiring score enrichment, or new data sources |
| `src/app/scrapper/page.tsx` | The search form UI |
| `src/app/orders/page.tsx` | Order history display |
| `src/lib/utils.ts` | `resultsToCSV()` column changes |
| `src/types/index.ts` | `RecruiterResult` shape changes |
| `.env.local` | Add Supabase keys, email API keys |
