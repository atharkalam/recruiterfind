export const HIRING_KEYWORDS = [
  'hiring', "we're hiring", 'now hiring', 'job opening', 'open role',
  'open position', 'apply now', 'join our team', 'looking for', 'seeking',
  'recruiting for', 'talent', 'opportunity', 'head count', 'headcount',
];

export const NOISE_KEYWORDS = [
  'congratulations', 'promoted', 'joined', 'welcome', 'excited to announce',
  'thrilled to share', 'shout out', 'celebrating',
];

export function scoreHiringActivity(postText: string | null, postDate: string | null): number {
  if (!postText || !postDate) return 0;
  const text = postText.toLowerCase();
  const hasHiringSignal = HIRING_KEYWORDS.some(k => text.includes(k));
  const hasNoise = NOISE_KEYWORDS.some(k => text.includes(k));
  if (!hasHiringSignal || hasNoise) return 0;
  const daysSincePost = Math.floor(
    (Date.now() - new Date(postDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSincePost <= 7) return 100;
  if (daysSincePost <= 30) return 85;
  if (daysSincePost <= 90) return 60;
  return 20;
}

export function extractStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return String(o.defaultLocalizedName ?? o.name ?? o.displayName ?? o.text ?? o.city ?? '');
  }
  return '';
}

export function isRecruiterTitle(title: string): boolean {
  const t = title.toLowerCase();
  return (
    t.includes('recruiter') ||
    t.includes('recruiting') ||
    t.includes('recruitment') ||
    t.includes('talent acquisition') ||
    t.includes('talent partner') ||
    t.includes('sourcer') ||
    t.includes('sourcing') ||
    t.includes('hr partner') ||
    t.includes('hr manager') ||
    t.includes('human resources') ||
    t.includes('people partner') ||
    t.includes('people operations') ||
    t.includes('staffing')
  );
}

export const DEFAULT_EMAIL_PROMPT =
  `Write a short, natural cold outreach message (3-4 sentences max) from {{user_name}}, ` +
  `a {{user_title}}, to {{recruiter_name}} who is {{recruiter_title}} at {{company}}. ` +
  `{{recruiter_post_line}}` +
  `{{user_resume}}` +
  `Identify the single most relevant skill or experience from the sender's background above ` +
  `that connects to what this recruiter might be looking for. Mention only that one thing. ` +
  `Ask if they'd be open to a quick chat. ` +
  `Do not use hollow openers like "Hope this finds you well." Keep it direct and human. ` +
  `Return only the message text, no subject line.`;
