'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Eye, EyeOff, CheckCircle2, Save, Key, MessageSquare, FileText } from 'lucide-react';

const ACCENT   = '#e8533a';
const LIGHT_BG = '#f7f8fc';
const BORDER   = '#e5e7eb';
const TEXT      = '#111827';
const MUTED     = '#6b7280';

const DEFAULT_PROMPT = `You are helping {{user_name}}, a {{user_title}}, write a short cold email to a recruiter at {{company}}.

The recruiter's name is {{recruiter_name}} and their title is {{recruiter_title}}.
{{#if recruiter_post}}They recently posted: "{{recruiter_post}}"{{/if}}

The sender's background:
{{user_resume}}

Write a 3-sentence email:
1. If they recently posted about hiring, mention that briefly. Otherwise skip this.
2. Pick the single most relevant skill or experience from the background above that connects to what this recruiter might be hiring for.
3. Clear call to action — ask if they have a few minutes to connect.

Keep it under 100 words. No subject line. First person. If the background doesn't directly match the recruiter's post, find the nearest credible angle rather than forcing a fit.`;

export default function ConfigurationPage() {
  const [config, setConfig] = useState({
    anthropic_api_key: '',
    apify_api_key: '',
    openai_api_key: '',
    google_ai_studio_key: '',
    custom_email_prompt: DEFAULT_PROMPT,
    user_resume: '',
  });
  const [show,   setShow]   = useState({ anthropic:false, apify:false, openai:false, google:false });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from('configurations').select('*').eq('user_id', user.id).single();
      if (data) setConfig({
        anthropic_api_key:    data.anthropic_api_key    ?? '',
        apify_api_key:        data.apify_api_key        ?? '',
        openai_api_key:       data.openai_api_key       ?? '',
        google_ai_studio_key: data.google_ai_studio_key ?? '',
        custom_email_prompt:  data.custom_email_prompt  ?? DEFAULT_PROMPT,
        user_resume:          data.user_resume          ?? '',
      });
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setSaving(false); return; }
    const { error } = await supabase.from('configurations').upsert(
      { user_id: user.id, ...config, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    if (error) setError(error.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background: LIGHT_BG, paddingTop:60, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Loader2 style={{ width:24, height:24, color:'#9ca3af', animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background: LIGHT_BG, paddingTop:60 }}>
      <div style={{ maxWidth:720, margin:'0 auto', padding:'40px 24px' }}>

        {/* Page header */}
        <div style={{ marginBottom:32 }}>
          <h1 style={{ fontSize:28, fontWeight:800, color: TEXT, margin:0, letterSpacing:-0.5 }}>Configuration</h1>
          <p style={{ fontSize:14, color: MUTED, margin:0, marginTop:6 }}>
            Add your API keys and customize the email generation prompt.
          </p>
        </div>

        <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* API Keys card */}
          <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${BORDER}` }}>
            <div style={{ padding:'20px 24px', borderBottom:`1px solid ${BORDER}`, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:'rgba(232,83,58,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Key style={{ width:16, height:16, color: ACCENT }} />
              </div>
              <div>
                <h2 style={{ fontSize:15, fontWeight:700, color: TEXT, margin:0 }}>API Keys</h2>
                <p style={{ fontSize:12, color: MUTED, margin:0, marginTop:1 }}>
                  Keys are stored in your account and never shared.
                </p>
              </div>
            </div>
            <div style={{ padding:'24px', display:'flex', flexDirection:'column', gap:20 }}>
              <ApiKeyField
                id="apify" label="Apify API Key" required
                hint="Required for LinkedIn scraping. Get it at apify.com → Account → Integrations."
                value={config.apify_api_key} show={show.apify}
                onChange={v => setConfig(c=>({...c, apify_api_key:v}))}
                onToggle={() => setShow(s=>({...s, apify:!s.apify}))}
              />
              <ApiKeyField
                id="anthropic" label="Anthropic API Key"
                hint="Used for query parsing and email generation. Get it at console.anthropic.com."
                value={config.anthropic_api_key} show={show.anthropic}
                onChange={v => setConfig(c=>({...c, anthropic_api_key:v}))}
                onToggle={() => setShow(s=>({...s, anthropic:!s.anthropic}))}
              />
              <ApiKeyField
                id="openai" label="OpenAI API Key"
                hint="Alternative to Anthropic for email generation (preference: Anthropic → OpenAI → Google). Get it at platform.openai.com."
                value={config.openai_api_key} show={show.openai}
                onChange={v => setConfig(c=>({...c, openai_api_key:v}))}
                onToggle={() => setShow(s=>({...s, openai:!s.openai}))}
              />
              <ApiKeyField
                id="google" label="Google AI Studio Key"
                hint="Fallback for email generation. Get it at aistudio.google.com → Get API key."
                value={config.google_ai_studio_key} show={show.google}
                onChange={v => setConfig(c=>({...c, google_ai_studio_key:v}))}
                onToggle={() => setShow(s=>({...s, google:!s.google}))}
              />
            </div>
          </div>

          {/* Your Background card */}
          <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${BORDER}` }}>
            <div style={{ padding:'20px 24px', borderBottom:`1px solid ${BORDER}`, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:'rgba(232,83,58,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <FileText style={{ width:16, height:16, color: ACCENT }} />
              </div>
              <div>
                <h2 style={{ fontSize:15, fontWeight:700, color: TEXT, margin:0 }}>Your Background</h2>
                <p style={{ fontSize:12, color: MUTED, margin:0, marginTop:1 }}>
                  Paste your resume or LinkedIn summary. Cold emails will be tailored to your actual skills and experience.
                </p>
              </div>
            </div>
            <div style={{ padding:'24px' }}>
              <textarea
                value={config.user_resume}
                onChange={e => setConfig(c=>({...c, user_resume:e.target.value}))}
                rows={10}
                placeholder={`Paste your resume, LinkedIn profile summary, or key skills here.\n\nExample:\nSenior Software Engineer with 8 years in distributed systems. Led backend infrastructure at Stripe, handling $2B+ in annual payment volume. Expert in Go, Python, and Kubernetes. Seeking senior engineering roles.`}
                style={{
                  width:'100%', borderRadius:10, border:`1px solid ${BORDER}`,
                  background: LIGHT_BG, padding:'12px 14px', fontSize:13,
                  fontFamily:'inherit', color: TEXT, lineHeight:1.65,
                  resize:'vertical', outline:'none', boxSizing:'border-box',
                }}
              />
              <p style={{ fontSize:11, color:'#9ca3af', margin:0, marginTop:6 }}>
                Used as <code style={{ fontSize:10, background: LIGHT_BG, padding:'1px 4px', borderRadius:3 }}>{'{{user_resume}}'}</code> in the email prompt. The AI will pick the most relevant part for each recruiter.
              </p>
            </div>
          </div>

          {/* Prompt card */}
          <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${BORDER}` }}>
            <div style={{ padding:'20px 24px', borderBottom:`1px solid ${BORDER}`, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:'rgba(232,83,58,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <MessageSquare style={{ width:16, height:16, color: ACCENT }} />
              </div>
              <div>
                <h2 style={{ fontSize:15, fontWeight:700, color: TEXT, margin:0 }}>Email generation prompt</h2>
                <p style={{ fontSize:12, color: MUTED, margin:0, marginTop:1 }}>
                  Use{' '}
                  {['{{user_name}}','{{user_resume}}','{{recruiter_name}}','{{company}}','{{recruiter_post}}'].map(v => (
                    <code key={v} style={{ fontSize:11, background: LIGHT_BG, padding:'1px 5px', borderRadius:4, marginRight:4 }}>{v}</code>
                  ))}
                  as template variables.
                </p>
              </div>
            </div>
            <div style={{ padding:'24px' }}>
              <textarea
                value={config.custom_email_prompt}
                onChange={e => setConfig(c=>({...c, custom_email_prompt:e.target.value}))}
                rows={12}
                style={{
                  width:'100%', borderRadius:10, border:`1px solid ${BORDER}`,
                  background: LIGHT_BG, padding:'12px 14px', fontSize:12,
                  fontFamily:'ui-monospace, monospace', color: TEXT, lineHeight:1.65,
                  resize:'vertical', outline:'none', boxSizing:'border-box',
                }}
              />
              <button type="button" onClick={() => setConfig(c=>({...c, custom_email_prompt: DEFAULT_PROMPT}))}
                style={{ fontSize:12, color: MUTED, background:'none', border:'none', cursor:'pointer', padding:0, marginTop:6, textDecoration:'underline' }}>
                Reset to default
              </button>
            </div>
          </div>

          {error && (
            <p style={{ fontSize:13, color:'#b91c1c', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px', margin:0 }}>
              {error}
            </p>
          )}

          {/* Save row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            {saved
              ? <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#059669', fontWeight:600 }}>
                  <CheckCircle2 style={{ width:15, height:15 }} /> Saved successfully
                </span>
              : <span />}
            <button type="submit" disabled={saving} style={{
              display:'inline-flex', alignItems:'center', gap:8,
              padding:'11px 24px', borderRadius:10, border:'none', cursor: saving?'not-allowed':'pointer',
              background: saving ? '#d1d5db' : ACCENT,
              color:'#fff', fontWeight:700, fontSize:14,
            }}>
              {saving
                ? <><Loader2 style={{ width:15, height:15, animation:'spin 1s linear infinite' }} />Saving…</>
                : <><Save style={{ width:15, height:15 }} />Save configuration</>}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ApiKeyField({ id, label, hint, value, show, onChange, onToggle, required }: {
  id:string; label:string; hint:string; value:string;
  show:boolean; onChange:(v:string)=>void; onToggle:()=>void; required?:boolean;
}) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label htmlFor={id} style={{ fontSize:13, fontWeight:600, color:'#374151' }}>
        {label}{required && <span style={{ color: ACCENT, marginLeft:3 }}>*</span>}
      </label>
      <div style={{ position:'relative' }}>
        <input
          id={id} type={show?'text':'password'} autoComplete="off"
          placeholder="sk-..." value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width:'100%', height:40, borderRadius:9, border:`1px solid ${BORDER}`,
            background:'#fff', padding:'0 40px 0 12px', fontSize:13,
            fontFamily:'ui-monospace, monospace', color: TEXT,
            outline:'none', boxSizing:'border-box',
          }}
        />
        <button type="button" onClick={onToggle} style={{
          position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
          background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4,
        }}>
          {show ? <EyeOff style={{ width:15, height:15 }} /> : <Eye style={{ width:15, height:15 }} />}
        </button>
      </div>
      <p style={{ fontSize:11, color:'#9ca3af', margin:0 }}>{hint}</p>
    </div>
  );
}
