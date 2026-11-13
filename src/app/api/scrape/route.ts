import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApifyClient } from 'apify-client';
import type { ScrapeRequest, RecruiterResult } from '@/types';
import { extractStr, isRecruiterTitle } from '@/lib/pipeline-helpers';

export async function POST(req: NextRequest) {
  try {
    const devBypass = process.env.DEV_BYPASS_AUTH === 'true';

    let apifyKey: string | undefined;
    let orderId: string | null = null;

    const body: ScrapeRequest = await req.json();
    const { company, country, requested_count, role_type, activity_window } = body;

    if (!company) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    if (devBypass) {
      apifyKey = process.env.APIFY_API_KEY;
    } else {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: config } = await supabase
        .from('configurations')
        .select('apify_api_key')
        .eq('user_id', user.id)
        .single();

      apifyKey = config?.apify_api_key;

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          company,
          country,
          requested_count,
          actual_count: 0,
          status: 'processing',
          query_text: `${company} recruiters in ${country}`,
          role_type,
          activity_window,
          user_name: body.user_name,
          user_title: body.user_title,
          user_email_domain: body.user_email_domain,
        })
        .select('id')
        .single();

      if (orderErr || !order) {
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
      }

      orderId = order.id;
    }

    if (!apifyKey) {
      return NextResponse.json(
        { error: 'Apify API key not configured. Add APIFY_API_KEY to .env.local (dev) or go to Configuration.' },
        { status: 400 }
      );
    }

    // Fetch 1.5× the requested count to have enough after filtering, capped at 20
    const fetchCount = Math.min(Math.ceil(requested_count * 1.5) + 5, 20);
    let results: RecruiterResult[] = [];

    try {
      const apify = new ApifyClient({ token: apifyKey });

      // Stage 1: Google search for LinkedIn recruiter profiles.
      // site:linkedin.com/in returns profiles with real headlines in page titles —
      // no LinkedIn auth required, works on the free Apify tier.
      const googleQuery = `site:linkedin.com/in recruiter OR "talent acquisition" OR sourcer "${company}" ${country}`;

      const searchRun = await apify.actor('apify/google-search-scraper').call({
        queries: googleQuery,
        resultsPerPage: Math.min(fetchCount, 100),
        maxPagesPerQuery: Math.ceil(fetchCount / 10),
        languageCode: 'en',
        countryCode: 'us',
      });

      const { items: pageItems } = await apify.dataset(searchRun.defaultDatasetId).listItems();
      const googleResults = (pageItems as Array<Record<string, unknown>>)
        .flatMap(page => (page.organicResults as Array<Record<string, unknown>>) ?? []);

      const searchResults = googleResults
        .filter(g => {
          const url = String(g.url ?? '');
          return url.includes('linkedin.com/in/') && !url.includes('/in/search');
        })
        .map(g => {
          const rawTitle = String(g.title ?? '');
          const cleaned = rawTitle.replace(/\s*[\|]\s*LinkedIn\s*$/i, '').trim();
          const sep = cleaned.match(/^(.+?)\s*[-–—]\s*(.+)$/);
          const name = sep ? sep[1].trim() : cleaned;
          const headline = sep ? sep[2].trim() : '';
          const url = String(g.url ?? '').split('?')[0].replace(/\/$/, '');
          const parts = name.split(' ');
          return {
            fullName: name,
            firstName: parts[0] ?? '',
            lastName: parts.slice(1).join(' '),
            headline,
            linkedinUrl: url,
            location: String(g.description ?? '').slice(0, 100),
            emails: null,
            email: null,
            profilePicture: null,
          } as Record<string, unknown>;
        }) as Array<Record<string, unknown>>;

      // Stage 3: Filter to recruiters, deduplicate, return base profiles.
      // Scores and email drafts are added by /api/enrich in the second call.
      const filtered: RecruiterResult[] = searchResults
        .map((r, i) => {
          const url = String(r.linkedinUrl ?? r.profileUrl ?? r.url ?? '');
          const resolvedTitle = String(r.headline ?? r.title ?? '').trim();
          const emailsArr = Array.isArray(r.emails) ? (r.emails as string[]) : [];
          const knownEmail = (emailsArr[0] ?? String(r.email ?? '').trim()) || null;
          const emailConfidence: 'verified' | null = knownEmail ? 'verified' : null;
          const profileImage = typeof r.profilePicture === 'string'
            ? r.profilePicture || null
            : ((r.profilePicture as Record<string, unknown>)?.url as string ?? null);

          return {
            id: String(r.id ?? r.publicIdentifier ?? i),
            name: String(r.firstName
              ? `${r.firstName} ${r.lastName ?? ''}`.trim()
              : (r.fullName ?? r.name ?? 'Unknown')),
            title: resolvedTitle,
            company,
            location: extractStr(r.location ?? r.locationName ?? r.geoLocation ?? ''),
            linkedin_url: url,
            email: knownEmail,
            email_confidence: emailConfidence,
            hiring_score: 0,
            last_post_date: null,
            last_post_text: null,
            profile_image: profileImage,
            email_draft: null,
          };
        })
        .filter(r => r.title && isRecruiterTitle(r.title));

      // Sort by email availability first; hiring scores come after enrichment
      filtered.sort((a, b) => {
        if (a.email && !b.email) return -1;
        if (!a.email && b.email) return 1;
        return a.name.localeCompare(b.name);
      });

      // Deduplicate by LinkedIn URL
      const seen = new Set<string>();
      results = filtered.filter(r => {
        if (!r.linkedin_url || seen.has(r.linkedin_url)) return false;
        seen.add(r.linkedin_url);
        return true;
      }).slice(0, requested_count);

    } catch (pipelineErr) {
      const errMsg = pipelineErr instanceof Error ? pipelineErr.message : 'Pipeline failed';
      if (!devBypass && orderId) {
        const supabase = await createClient();
        await supabase.from('orders').update({ status: 'failed', error: errMsg }).eq('id', orderId);
      }
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    // Persist partial results so the order survives even if enrichment never runs
    if (!devBypass && orderId) {
      const supabase = await createClient();
      await supabase.from('orders').update({
        actual_count: results.length,
        results: results as unknown as Record<string, unknown>[],
      }).eq('id', orderId);
    }

    return NextResponse.json({ results, orderId });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
