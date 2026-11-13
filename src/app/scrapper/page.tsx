'use client';

import { useState } from 'react';
import { resultsToCSV, getHiringScoreLabel } from '@/lib/utils';
import type { RecruiterResult, ScrapeRequest } from '@/types';
import {
  Search, Loader2, Download, Mail, MapPin,
  TrendingUp, AlertCircle, CheckCircle2, Clock,
  Building2, ChevronDown, User, Copy, Check,
} from 'lucide-react';

// ── design tokens ────────────────────────────────────────────
const ACCENT   = '#e8533a';
const LIGHT_BG = '#f7f8fc';
const BORDER   = '#e5e7eb';
const TEXT      = '#111827';
const MUTED     = '#6b7280';

// ── types ────────────────────────────────────────────────────
type StageStatus = 'pending' | 'running' | 'done' | 'error';
type Stage = { id: string; label: string; status: StageStatus };

const ACTIVITY_OPTS = [
  { value: '7d',  label: 'Last 7 days'  },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'any', label: 'Any time'     },
];

const ROLE_OPTS = [
  'Software Engineer','Product Manager','Data Scientist',
  'Designer','Marketing','Sales','Operations','Finance','General / Any role',
];

const LOCATION_OPTS: { group: string; options: string[] }[] = [
  {
    group: 'Tech Hubs — US',
    options: [
      'San Francisco Bay Area',
      'New York City',
      'Seattle, WA',
      'Austin, TX',
      'Boston, MA',
      'Los Angeles, CA',
      'Chicago, IL',
      'Denver, CO',
      'Atlanta, GA',
      'Miami, FL',
      'Washington DC',
      'San Diego, CA',
      'Portland, OR',
      'Raleigh, NC',
    ],
  },
  {
    group: 'Tech Hubs — International',
    options: [
      'London, UK',
      'Toronto, Canada',
      'Sydney, Australia',
      'Berlin, Germany',
      'Singapore',
      'Bangalore, India',
      'Amsterdam, Netherlands',
      'Dublin, Ireland',
      'Paris, France',
      'Stockholm, Sweden',
      'Tel Aviv, Israel',
      'Dubai, UAE',
    ],
  },
  {
    group: 'US States',
    options: [
      'California',
      'New York',
      'Texas',
      'Washington',
      'Massachusetts',
      'Illinois',
      'Florida',
      'Colorado',
      'Georgia',
      'Oregon',
      'Virginia',
      'Pennsylvania',
      'North Carolina',
      'Arizona',
      'Ohio',
    ],
  },
  {
    group: 'Countries',
    options: [
      'United States',
      'United Kingdom',
      'Canada',
      'Australia',
      'Germany',
      'India',
      'Singapore',
      'Netherlands',
      'Ireland',
      'France',
      'Sweden',
      'Israel',
      'UAE',
      'Remote / Anywhere',
    ],
  },
];

const INIT_STAGES: Stage[] = [
  { id: 'parse',    label: 'Parsing query',                  status: 'pending' },
  { id: 'discover', label: 'Discovering recruiter profiles', status: 'pending' },
  { id: 'activity', label: 'Analyzing hiring activity',      status: 'pending' },
  { id: 'emails',   label: 'Generating cold email drafts',   status: 'pending' },
];

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── component ────────────────────────────────────────────────
export default function ScrapperPage() {
  const [form, setForm] = useState<ScrapeRequest>({
    company: '', country: 'United States', requested_count: 50,
    role_type: 'Software Engineer', activity_window: '30d',
    user_name: '', user_title: '', user_email_domain: '',
  });
  const [stages, setStages]     = useState<Stage[]>(INIT_STAGES);
  const [results, setResults]   = useState<RecruiterResult[] | null>(null);
  const [loading, setLoading]   = useState(false);   // phase 1 (scrape) in progress
  const [enriching, setEnriching] = useState(false); // phase 2 (enrich) in progress
  const [error, setError]       = useState('');
  const [orderId, setOrderId]   = useState<string | null>(null);

  const isRunning = loading || enriching;

  function bump(id: string, status: StageStatus) {
    setStages(p => p.map(s => s.id === id ? { ...s, status } : s));
  }

  function triggerCSVDownload(data: RecruiterResult[]) {
    const csv  = resultsToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `recruiters-${form.company}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResults(null);
    setOrderId(null);
    setStages(INIT_STAGES.map(s => ({ ...s, status: 'pending' })));
    setLoading(true);
    setEnriching(false);

    try {
      // ── Phase 1: discover ──────────────────────────────────
      bump('parse', 'running');
      await delay(400);
      bump('parse', 'done');
      bump('discover', 'running');

      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      bump('discover', 'done');

      const scrapeData = await scrapeRes.json();
      if (!scrapeRes.ok) throw new Error(scrapeData.error || 'Scrape failed');

      // Show recruiter profiles immediately — scores + emails arrive in phase 2
      setResults(scrapeData.results);
      setOrderId(scrapeData.orderId);
      setLoading(false);

      if (!scrapeData.results?.length) return;

      // ── Phase 2: enrich (LinkedIn posts + AI emails) ───────
      bump('activity', 'running');
      setEnriching(true);

      try {
        const enrichRes = await fetch('/api/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            results:    scrapeData.results,
            orderId:    scrapeData.orderId,
            user_name:  form.user_name,
            user_title: form.user_title,
            company:    form.company,
          }),
        });

        bump('activity', 'done');
        bump('emails', 'running');

        if (enrichRes.ok) {
          const enrichData = await enrichRes.json();
          setResults(enrichData.results);
          bump('emails', 'done');
          if (enrichData.results?.length) {
            triggerCSVDownload(enrichData.results);
          }
        } else {
          bump('emails', 'error');
          // Keep phase 1 results — enrichment failed but profiles are still useful
        }
      } catch {
        bump('activity', 'error');
        // Non-fatal: phase 1 results remain displayed
      } finally {
        setEnriching(false);
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      setStages(p => p.map(s => s.status === 'running' ? { ...s, status: 'error' } : s));
      setLoading(false);
      setEnriching(false);
    }
  }

  function downloadCSV() {
    if (!results) return;
    triggerCSVDownload(results);
  }

  const hasStarted = stages.some(s => s.status !== 'pending');

  return (
    <div style={{ minHeight: '100vh', background: LIGHT_BG, paddingTop: 60 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: TEXT, margin: 0, letterSpacing: -0.5 }}>Find recruiters</h1>
          <p style={{ fontSize: 14, color: MUTED, margin: 0, marginTop: 6 }}>
            Enter a company name and get verified recruiter contacts ranked by hiring activity.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, alignItems: 'start' }}>

          {/* ── Left: form ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}` }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: TEXT, margin: 0 }}>Search parameters</h2>
                <p style={{ fontSize: 12, color: MUTED, margin: 0, marginTop: 4 }}>Target company and search settings</p>
              </div>
              <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                <Field label="Company *">
                  <div style={{ position: 'relative' }}>
                    <Building2 style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#9ca3af' }} />
                    <input style={inputStyle({ paddingLeft: 34 })} placeholder="e.g. Microsoft" value={form.company}
                      onChange={e => setForm(f => ({ ...f, company: e.target.value }))} required />
                  </div>
                </Field>

                <Field label="Location">
                  <SelectField value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))}>
                    {LOCATION_OPTS.map(group => (
                      <optgroup key={group.group} label={group.group}>
                        {group.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </optgroup>
                    ))}
                  </SelectField>
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="No. of recruiters">
                    <input style={inputStyle()} type="number" min={1} max={100} value={form.requested_count}
                      onChange={e => setForm(f => ({ ...f, requested_count: parseInt(e.target.value) || 50 }))} />
                  </Field>
                  <Field label="Activity window">
                    <SelectField value={form.activity_window} onChange={v => setForm(f => ({ ...f, activity_window: v as ScrapeRequest['activity_window'] }))}>
                      {ACTIVITY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </SelectField>
                  </Field>
                </div>

                <Field label="Role you're targeting">
                  <SelectField value={form.role_type} onChange={v => setForm(f => ({ ...f, role_type: v }))}>
                    {ROLE_OPTS.map(r => <option key={r} value={r}>{r}</option>)}
                  </SelectField>
                </Field>

                <div style={{ paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 1, margin: 0, marginBottom: 12 }}>
                    Your profile (for email templates)
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Field label="Your name">
                      <div style={{ position: 'relative' }}>
                        <User style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#9ca3af' }} />
                        <input style={inputStyle({ paddingLeft: 34 })} placeholder="Alex Johnson" value={form.user_name}
                          onChange={e => setForm(f => ({ ...f, user_name: e.target.value }))} />
                      </div>
                    </Field>
                    <Field label="Your current title">
                      <input style={inputStyle()} placeholder="Senior Software Engineer" value={form.user_title}
                        onChange={e => setForm(f => ({ ...f, user_title: e.target.value }))} />
                    </Field>
                  </div>
                </div>

                <button type="submit" disabled={isRunning || !form.company} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '12px 20px', borderRadius: 10, border: 'none',
                  cursor: isRunning || !form.company ? 'not-allowed' : 'pointer',
                  background: isRunning || !form.company ? '#d1d5db' : ACCENT,
                  color: '#fff', fontWeight: 700, fontSize: 14, transition: 'background .15s',
                }}>
                  {isRunning
                    ? <><Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> Running pipeline…</>
                    : <><Search style={{ width: 15, height: 15 }} /> Find recruiters</>}
                </button>
              </form>
            </div>

            {/* Pipeline status */}
            {hasStarted && (
              <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${BORDER}`, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <TrendingUp style={{ width: 15, height: 15, color: ACCENT }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Pipeline status</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stages.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <StageIcon status={s.status} />
                      <span style={{
                        fontSize: 13,
                        color: s.status === 'done' ? TEXT : s.status === 'running' ? ACCENT : s.status === 'error' ? '#ef4444' : '#9ca3af',
                        fontWeight: s.status === 'running' ? 600 : 400,
                      }}>{s.label}</span>
                    </div>
                  ))}
                </div>
                {enriching && (
                  <p style={{ fontSize: 11, color: MUTED, margin: 0, marginTop: 14, lineHeight: 1.5 }}>
                    Recruiter profiles are shown below. Scores and email drafts are loading…
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Right: results ── */}
          <div>
            {error && (
              <div style={{ display: 'flex', gap: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
                <AlertCircle style={{ width: 16, height: 16, color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', margin: 0 }}>Pipeline error</p>
                  <p style={{ fontSize: 12, color: '#b91c1c', margin: 0, marginTop: 2 }}>{error}</p>
                </div>
              </div>
            )}

            {!results && !loading && !error && (
              <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${BORDER}`, minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 48 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: LIGHT_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Search style={{ width: 22, height: 22, color: '#d1d5db' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: MUTED, margin: 0 }}>No results yet</p>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, marginTop: 4 }}>Fill in the form and click "Find recruiters" to start.</p>
              </div>
            )}

            {loading && !results && (
              <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${BORDER}`, minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 style={{ width: 32, height: 32, color: ACCENT, animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: TEXT, margin: 0 }}>Discovering recruiters…</p>
                <p style={{ fontSize: 13, color: MUTED, margin: 0, marginTop: 4 }}>Searching Google + parsing LinkedIn profiles</p>
              </div>
            )}

            {results && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: 0 }}>
                        {results.length} recruiter{results.length !== 1 ? 's' : ''} found
                      </h2>
                      {enriching && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: ACCENT, fontWeight: 600 }}>
                          <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
                          Enriching…
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: MUTED, margin: 0, marginTop: 3 }}>
                      {form.company} · {form.country}
                      {enriching ? ' · fetching hiring scores + emails' : ' · ranked by hiring activity'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {orderId && (
                      <button onClick={() => window.location.href = '/orders'} style={outlineBtn}>View orders</button>
                    )}
                    <button onClick={downloadCSV} style={primaryBtn}>
                      <Download style={{ width: 14, height: 14 }} /> Export CSV
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {results.map((r, i) => <RecruiterCard key={r.id || i} recruiter={r} rank={i + 1} enriching={enriching} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── sub-components ───────────────────────────────────────────
function StageIcon({ status }: { status: StageStatus }) {
  if (status === 'done')    return <CheckCircle2 style={{ width: 15, height: 15, color: '#10b981', flexShrink: 0 }} />;
  if (status === 'running') return <Loader2 style={{ width: 15, height: 15, color: ACCENT, flexShrink: 0, animation: 'spin 1s linear infinite' }} />;
  if (status === 'error')   return <AlertCircle style={{ width: 15, height: 15, color: '#ef4444', flexShrink: 0 }} />;
  return <Clock style={{ width: 15, height: 15, color: '#d1d5db', flexShrink: 0 }} />;
}

function RecruiterCard({ recruiter: r, rank, enriching }: { recruiter: RecruiterResult; rank: number; enriching: boolean }) {
  const { label, color } = getHiringScoreLabel(r.hiring_score);
  const [postOpen,  setPostOpen]  = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);
  const [copied,    setCopied]    = useState(false);

  const isAnalyzing  = enriching && r.hiring_score === 0 && !r.last_post_text;
  const isGenerating = enriching && !r.email_draft;

  function copyDraft() {
    if (!r.email_draft) return;
    navigator.clipboard.writeText(r.email_draft).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${BORDER}`, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(232,83,58,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: ACCENT, flexShrink: 0 }}>
            {r.name?.[0] ?? '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{r.name}</span>
              <span style={{ fontSize: 11, color: '#d1d5db' }}>#{rank}</span>
            </div>
            <p style={{ fontSize: 12, color: MUTED, margin: 0, marginTop: 1 }}>{r.title}</p>
            {r.location && (
              <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                <MapPin style={{ width: 11, height: 11 }} />{r.location}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          {isAnalyzing ? (
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: '#f3f4f6', color: MUTED, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Loader2 style={{ width: 10, height: 10, animation: 'spin 1s linear infinite' }} />
              Analyzing…
            </span>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, ...scoreStyle(color) }}>{label}</span>
          )}
          {r.email && (
            <span style={{ fontSize: 11, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Mail style={{ width: 11, height: 11 }} />{r.email}
            </span>
          )}
        </div>
      </div>

      {/* Action row */}
      <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {r.last_post_text && (
          <button onClick={() => setPostOpen(!postOpen)} style={{ fontSize: 12, color: MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {postOpen ? 'Hide hiring post' : 'View hiring post'}
          </button>
        )}
        {isGenerating ? (
          <span style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Loader2 style={{ width: 11, height: 11, animation: 'spin 1s linear infinite' }} />
            Generating email…
          </span>
        ) : r.email_draft ? (
          <button onClick={() => setDraftOpen(!draftOpen)} style={{ fontSize: 12, color: ACCENT, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {draftOpen ? 'Hide cold email' : 'View cold email ✦'}
          </button>
        ) : null}
        {r.linkedin_url && (
          <a href={r.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: ACCENT, textDecoration: 'none' }}>
            LinkedIn →
          </a>
        )}
      </div>

      {postOpen && r.last_post_text && (
        <p style={{ margin: 0, marginTop: 8, fontSize: 12, color: MUTED, background: LIGHT_BG, borderRadius: 8, padding: '10px 12px', lineHeight: 1.6 }}>
          {r.last_post_text}
        </p>
      )}

      {draftOpen && r.email_draft && (
        <div style={{ marginTop: 8, background: LIGHT_BG, borderRadius: 8, padding: '12px 14px', position: 'relative' }}>
          <p style={{ margin: 0, fontSize: 13, color: TEXT, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {r.email_draft}
          </p>
          <button onClick={copyDraft} style={{
            position: 'absolute', top: 10, right: 10,
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 600,
            color: copied ? '#059669' : MUTED,
            background: '#fff', border: `1px solid ${BORDER}`,
            borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
          }}>
            {copied
              ? <><Check style={{ width: 11, height: 11 }} /> Copied</>
              : <><Copy style={{ width: 11, height: 11 }} /> Copy</>}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>
      {children}
    </div>
  );
}

function SelectField({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle({ appearance: 'none', paddingRight: 32 } as React.CSSProperties)}>
        {children}
      </select>
      <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9ca3af', pointerEvents: 'none' }} />
    </div>
  );
}

// ── style helpers ────────────────────────────────────────────
function inputStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    width: '100%', height: 38, borderRadius: 8, border: `1px solid ${BORDER}`,
    background: '#fff', padding: '0 12px', fontSize: 13, color: TEXT,
    outline: 'none', boxSizing: 'border-box', ...extra,
  };
}

function scoreStyle(color: string): React.CSSProperties {
  if (color.includes('emerald')) return { background: '#d1fae5', color: '#065f46' };
  if (color.includes('blue'))    return { background: '#dbeafe', color: '#1e40af' };
  if (color.includes('violet'))  return { background: '#ede9fe', color: '#5b21b6' };
  if (color.includes('amber'))   return { background: '#fef3c7', color: '#92400e' };
  return { background: '#f3f4f6', color: '#4b5563' };
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 16px', borderRadius: 8, border: 'none',
  background: ACCENT, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
};

const outlineBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 16px', borderRadius: 8, border: `1px solid ${BORDER}`,
  background: '#fff', color: TEXT, fontWeight: 600, fontSize: 13, cursor: 'pointer',
};
