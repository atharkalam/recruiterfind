import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApifyClient } from 'apify-client';
import Anthropic from '@anthropic-ai/sdk';
import type { RecruiterResult } from '@/types';
import { scoreHiringActivity, DEFAULT_EMAIL_PROMPT } from '@/lib/pipeline-helpers';

type EnrichRequest = {
  results: RecruiterResult[];
  orderId: string | null;
  user_name: string;
  user_title: string;
  company: string;
};

export async function POST(req: NextRequest) {
  try {
    const devBypass = process.env.DEV_BYPASS_AUTH === 'true';
    const body: EnrichRequest = await req.json();
    const { results, orderId, user_name, user_title, company } = body;

    if (!results?.length) {
      return NextResponse.json({ results: [] });
    }

    let apifyKey: string | undefined;
    let anthropicKey: string | undefined;
    let openaiKey: string | undefined;
    let googleKey: string | undefined;
    let customEmailPrompt: string | undefined;
    let userResume: string = '';

    if (devBypass) {
      apifyKey     = process.env.APIFY_API_KEY;
      anthropicKey = process.env.ANTHROPIC_API_KEY;
      openaiKey    = process.env.OPENAI_API_KEY;
      googleKey    = process.env.GOOGLE_AI_STUDIO_KEY;
      userResume   = process.env.USER_RESUME ?? '';
    } else {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const { data: config } = await supabase
        .from('configurations')
        .select('apify_api_key, anthropic_api_key, openai_api_key, google_ai_studio_key, custom_email_prompt, user_resume')
        .eq('user_id', user.id)
        .single();

      apifyKey          = config?.apify_api_key;
      anthropicKey      = config?.anthropic_api_key;
      openaiKey         = config?.openai_api_key;
      googleKey         = config?.google_ai_studio_key;
      customEmailPrompt = config?.custom_email_prompt ?? undefined;
      userResume        = config?.user_resume ?? '';
    }

    // Work on a shallow copy so callers' arrays aren't mutated
    const enriched: RecruiterResult[] = results.map(r => ({ ...r }));

    // ── Stage 2: LinkedIn posts + hiring-activity scores ──────────────────
    if (apifyKey) {
      try {
        const apify = new ApifyClient({ token: apifyKey });
        const recruiterUrls = enriched.map(r => r.linkedin_url).filter(Boolean);

        const postsRun = await apify.actor('harvestapi/linkedin-profile-posts').call(
          { profileUrls: recruiterUrls, maxPostCount: 3 },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { timeoutSecs: 45 } as any
        );

        const { items: postItems } = await apify.dataset(postsRun.defaultDatasetId).listItems({
          limit: recruiterUrls.length * 3,
        });

        type PostData = { text: string; date: string };
        const postsByProfile = new Map<string, PostData>();

        for (const post of postItems as Array<Record<string, unknown>>) {
          const author   = post.author   as Record<string, unknown> | undefined;
          const postedAt = post.postedAt as Record<string, unknown> | undefined;
          const publicId = String(author?.publicIdentifier ?? '');
          const content  = String(post.content ?? '');
          const date     = String(postedAt?.date ?? '');
          if (!publicId || !content || !date) continue;
          if (!postsByProfile.has(publicId)) {
            postsByProfile.set(publicId, { text: content, date });
          }
        }

        for (const r of enriched) {
          const publicId = r.linkedin_url.split('/in/')[1]?.replace(/\/$/, '') ?? '';
          const postData = postsByProfile.get(publicId);
          r.hiring_score   = scoreHiringActivity(postData?.text ?? null, postData?.date ?? null);
          r.last_post_text = postData?.text ?? null;
          r.last_post_date = postData?.date ?? null;
        }

        // Re-sort: hiring score descending, then verified email first
        enriched.sort((a, b) => {
          if (b.hiring_score !== a.hiring_score) return b.hiring_score - a.hiring_score;
          if (a.email && !b.email) return -1;
          if (!a.email && b.email) return 1;
          return 0;
        });

      } catch (stage2Err) {
        console.error('Stage 2 posts fetch failed (non-fatal):',
          stage2Err instanceof Error ? stage2Err.message : stage2Err);
      }
    }

    // ── Stage 4: AI cold-email drafts ─────────────────────────────────────
    async function callAI(prompt: string): Promise<string> {
      if (anthropicKey) {
        const anthropic = new Anthropic({ apiKey: anthropicKey });
        const msg = await anthropic.messages.create({
          model: 'claude-haiku-5-5',
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }],
        });
        return msg.content[0].type === 'text' ? msg.content[0].text : '';
      }
      if (openaiKey) {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 300, messages: [{ role: 'user', content: prompt }] }),
        });
        const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        return json.choices?.[0]?.message?.content ?? '';
      }
      if (googleKey) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${googleKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        );
        const json = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        return json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      }
      return '';
    }

    // Retry once on empty/failed AI response to handle transient rate limits
    async function callAIWithRetry(prompt: string): Promise<string> {
      try {
        const result = await callAI(prompt);
        if (result) return result;
        await new Promise(res => setTimeout(res, 600));
        return await callAI(prompt);
      } catch {
        await new Promise(res => setTimeout(res, 600));
        try { return await callAI(prompt); } catch { return ''; }
      }
    }

    const aiAvailable = !!(anthropicKey || openaiKey || googleKey);
    if (aiAvailable && user_name) {
      const effectivePrompt = customEmailPrompt ?? DEFAULT_EMAIL_PROMPT;
      const topN = enriched.slice(0, Math.min(10, enriched.length));

      await Promise.allSettled(topN.map(async (r) => {
        const recruiterPostLine = r.last_post_text
          ? `They recently posted: "${r.last_post_text.slice(0, 120)}". `
          : '';
        const userBackgroundLine = userResume
          ? `Here is the sender's background and experience:\n${userResume.slice(0, 800)}\n\n`
          : `The sender is a ${user_title ?? 'professional'} seeking opportunities at ${company}.\n\n`;

        const filled = effectivePrompt
          .replace('{{user_name}}', user_name)
          .replace('{{user_title}}', user_title ?? '')
          .replace('{{company}}', company)
          .replace('{{recruiter_name}}', r.name)
          .replace('{{recruiter_title}}', r.title)
          .replace('{{recruiter_post}}', r.last_post_text ?? '')
          .replace('{{recruiter_post_line}}', recruiterPostLine)
          .replace('{{user_resume}}', userBackgroundLine);

        const draft = await callAIWithRetry(filled);
        r.email_draft = draft || null;
      }));
    }

    // ── Persist final results ─────────────────────────────────────────────
    if (!devBypass && orderId) {
      const supabase = await createClient();
      await supabase.from('orders').update({
        status: 'completed',
        actual_count: enriched.length,
        results: enriched as unknown as Record<string, unknown>[],
        error: null,
      }).eq('id', orderId);
    }

    return NextResponse.json({ results: enriched });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
