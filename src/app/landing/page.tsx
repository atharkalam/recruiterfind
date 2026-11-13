import Link from 'next/link';
import { ArrowRight, Star, Zap, Search, Mail, TrendingUp, FileDown, Target, Users, CheckCircle2, Play } from 'lucide-react';

// ── constants ────────────────────────────────────────────────
const NAV_BG   = '#0d0f1c';
const ACCENT   = '#e8533a';
const LIGHT_BG = '#f7f8fc';

const companies = ['Google','Microsoft','Apple','Meta','Amazon','Stripe','Airbnb','Notion'];

const steps = [
  { n:'01', icon: Search,     title:'Enter your target',    body:'Company name, country, number of recruiters, and how recently they must have posted about hiring.' },
  { n:'02', icon: TrendingUp, title:'AI ranks by activity', body:'Pipeline finds 150+ profiles, scores each by hiring signals, surfaces the most active first.' },
  { n:'03', icon: Mail,       title:'Get verified emails',  body:'Email enrichment runs on the top results so you get real, validated contact info.' },
  { n:'04', icon: FileDown,   title:'Export and reach out', body:'Download a clean CSV or use AI-generated cold emails personalised with your profile.' },
];

const feats = [
  { icon: Target,       color:'#fee2e2', ic:'#ef4444', title:'Hiring activity scoring',  body:'Prioritise recruiters who posted about open roles in the last 7, 30 or 90 days.' },
  { icon: Users,        color:'#ede9fe', ic:'#7c3aed', title:'Deep recruiter discovery', body:'Searches recruiter, talent acquisition, sourcer, HR partner titles at any company.' },
  { icon: Mail,         color:'#d1fae5', ic:'#059669', title:'Email enrichment',         body:'Finds and validates professional email addresses for every recruiter profile found.' },
  { icon: Zap,          color:'#fef3c7', ic:'#d97706', title:'Instant results',          body:'Complete pipeline runs in under 3 minutes for up to 50 contacts.' },
];

const testimonials = [
  { q:'"RecruiterFind cut my job-search research from 2 hours to 5 minutes. I landed 4 interviews in a week."', name:'Alex T.', role:'Software Engineer, Ex-Spotify', init:'A', c:'#e85d3a' },
  { q:'"The hiring activity score is genius. I only reached out to recruiters who were actively posting — 80% responded."', name:'Priya S.', role:'Product Manager, Google', init:'P', c:'#7c3aed' },
  { q:'"I sent 20 cold emails using the AI templates and got 7 replies. Never had results like this before."', name:'Marcus L.', role:'Data Scientist, Stripe', init:'M', c:'#059669' },
];

const scoreRows = [
  { label:'Posted "I\'m hiring" in last 7 days',  score:100, bar:'#10b981', tag:'Actively Hiring'  },
  { label:'Posted about hiring in last 30 days',   score:85,  bar:'#3b82f6', tag:'Recently Hiring'  },
  { label:'Shared a job opening in last 30 days',  score:75,  bar:'#7c3aed', tag:'Hiring Signal'    },
  { label:'Posted about hiring in last 90 days',   score:60,  bar:'#f59e0b', tag:'Past Activity'    },
  { label:'No recent hiring posts',                score:0,   bar:'#d1d5db', tag:'No Signal'        },
];

const previewRows = [
  { name:'Sarah Chen',       title:'Senior Technical Recruiter', tag:'Actively Hiring',  tc:'#059669', bc:'#d1fae5' },
  { name:'James Rodriguez',  title:'Talent Acquisition Lead',    tag:'Recently Hiring',  tc:'#2563eb', bc:'#dbeafe' },
  { name:'Priya Patel',      title:'University Recruiter',       tag:'Hiring Signal',    tc:'#7c3aed', bc:'#ede9fe' },
];

// ── page ─────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}>

      {/* ═══════════════════════════════════════════════════════
          DARK HERO SECTION
      ═══════════════════════════════════════════════════════ */}
      <div style={{ background: NAV_BG }}>

        {/* Navbar */}
        <header style={{ position:'fixed', top:0, left:0, right:0, zIndex:50, height:60, borderBottom:'1px solid rgba(255,255,255,0.08)', background: NAV_BG }}>
          <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', height:'100%', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <Link href="/landing" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
              <div style={{ width:30, height:30, borderRadius:8, background: ACCENT, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Zap style={{ width:16, height:16, color:'#fff' }} />
              </div>
              <span style={{ fontWeight:700, color:'#fff', fontSize:15 }}>RecruiterFind</span>
            </Link>

            <nav style={{ display:'flex', alignItems:'center', gap:28 }}>
              {['How it works','Features','Pricing'].map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`}
                   style={{ fontSize:14, color:'rgba(255,255,255,0.6)', textDecoration:'none', transition:'color .15s' }}>
                  {l}
                </a>
              ))}
            </nav>

            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Link href="/login" style={{ fontSize:14, color:'rgba(255,255,255,0.7)', padding:'8px 16px', textDecoration:'none', borderRadius:8, transition:'background .15s' }}>
                Sign in
              </Link>
              <Link href="/signup" style={{ fontSize:14, fontWeight:600, color:'#fff', background: ACCENT, padding:'9px 20px', borderRadius:9, textDecoration:'none' }}>
                Get started free
              </Link>
            </div>
          </div>
        </header>

        {/* Hero content */}
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', paddingTop:120, paddingBottom:96, display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>

          {/* Left — headline */}
          <div>
            {/* Badge */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(232,83,58,0.15)', border:'1px solid rgba(232,83,58,0.3)', borderRadius:999, padding:'6px 14px', marginBottom:28 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background: ACCENT, display:'inline-block' }} />
              <span style={{ fontSize:12, fontWeight:600, color: ACCENT }}>50K+ recruiter contacts found</span>
            </div>

            <h1 style={{ fontSize:56, fontWeight:800, lineHeight:1.08, letterSpacing:-1.5, color:'#fff', margin:0, marginBottom:20 }}>
              Find recruiters<br />
              <span style={{ color: ACCENT }}>actively hiring.</span>
            </h1>

            <p style={{ fontSize:17, color:'rgba(255,255,255,0.55)', lineHeight:1.65, margin:0, marginBottom:36, maxWidth:460 }}>
              Enter a company name, get a ranked list of their recruiters with verified emails — prioritized by who posted about jobs in the last 7 days.
            </p>

            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:52 }}>
              <Link href="/signup" style={{ display:'inline-flex', alignItems:'center', gap:8, background: ACCENT, color:'#fff', fontWeight:700, fontSize:15, padding:'13px 24px', borderRadius:10, textDecoration:'none' }}>
                Start for free <ArrowRight style={{ width:16, height:16 }} />
              </Link>
              <a href="#how-it-works" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.85)', fontWeight:600, fontSize:15, padding:'13px 24px', borderRadius:10, textDecoration:'none', border:'1px solid rgba(255,255,255,0.12)' }}>
                <Play style={{ width:14, height:14 }} /> See how it works
              </a>
            </div>

            {/* Stats row */}
            <div style={{ display:'flex', gap:40, paddingTop:28, borderTop:'1px solid rgba(255,255,255,0.1)' }}>
              {[['50K+','Recruiter contacts'],['94%','Email deliverability'],['3 min','Average run time']].map(([v,l])=>(
                <div key={l}>
                  <div style={{ fontSize:22, fontWeight:800, color:'#fff' }}>{v}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — preview card */}
          <div>
            <div style={{ background:'#161829', borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', overflow:'hidden' }}>
              {/* Card header */}
              <div style={{ background:'#1e2135', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:'#10b981', display:'inline-block' }} />
                  <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)' }}>Pipeline running</span>
                </div>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>Microsoft · US · 50 results</span>
              </div>

              {/* Rows */}
              <div style={{ padding:'8px 0' }}>
                {previewRows.map((r, i) => (
                  <div key={r.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom: i < previewRows.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.7)', flexShrink:0 }}>
                        {r.name[0]}
                      </div>
                      <div>
                        <div style={{ fontSize:14, fontWeight:600, color:'#fff', lineHeight:1.2 }}>{r.name}</div>
                        <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{r.title}</div>
                      </div>
                    </div>
                    <span style={{ fontSize:11, fontWeight:600, color: r.tc, background: r.bc, padding:'3px 10px', borderRadius:999, flexShrink:0 }}>
                      {r.tag}
                    </span>
                  </div>
                ))}
              </div>

              {/* Card footer */}
              <div style={{ background:'#1e2135', borderTop:'1px solid rgba(255,255,255,0.07)', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>47 more results with verified emails</span>
                <span style={{ fontSize:12, fontWeight:700, color: ACCENT, cursor:'pointer' }}>Export CSV →</span>
              </div>
            </div>

            {/* Below card: recruiter count bar */}
            <div style={{ marginTop:16, background:'rgba(255,255,255,0.05)', borderRadius:12, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>Recruiters with hiring signal</span>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:120, height:6, background:'rgba(255,255,255,0.1)', borderRadius:999, overflow:'hidden' }}>
                  <div style={{ width:'72%', height:'100%', background: ACCENT, borderRadius:999 }} />
                </div>
                <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>36 / 50</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          LOGOS STRIP
      ═══════════════════════════════════════════════════════ */}
      <div style={{ background:'#f0f1f5', borderTop:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb', padding:'28px 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', textAlign:'center' }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:3, color:'#9ca3af', textTransform:'uppercase', margin:0, marginBottom:18 }}>
            Find recruiters at any company
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', alignItems:'center', gap:'8px 36px' }}>
            {companies.map(c=>(
              <span key={c} style={{ fontSize:14, fontWeight:700, color:'#c4c7d0' }}>{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════ */}
      <div id="how-it-works" style={{ background: LIGHT_BG, padding:'96px 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <span style={{ display:'inline-block', background:'rgba(232,83,58,0.1)', color: ACCENT, fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', padding:'5px 14px', borderRadius:999, marginBottom:16 }}>
              Process
            </span>
            <h2 style={{ fontSize:40, fontWeight:800, color:'#111827', margin:0, letterSpacing:-0.5 }}>
              From search to inbox in minutes.
            </h2>
            <p style={{ fontSize:16, color:'#6b7280', marginTop:14, maxWidth:520, marginLeft:'auto', marginRight:'auto', lineHeight:1.6 }}>
              A fully automated pipeline runs behind the scenes so you get the right contacts without the manual research.
            </p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:20 }}>
            {steps.map(({ n, icon: Icon, title, body }) => (
              <div key={n} style={{ background:'#fff', borderRadius:16, padding:'28px 24px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', border:'1px solid #e5e7eb' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'rgba(232,83,58,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon style={{ width:22, height:22, color: ACCENT }} />
                  </div>
                  <span style={{ fontSize:28, fontWeight:900, color:'#f3f4f6' }}>{n}</span>
                </div>
                <h3 style={{ fontSize:15, fontWeight:700, color:'#111827', margin:0, marginBottom:8 }}>{title}</h3>
                <p style={{ fontSize:13, color:'#6b7280', margin:0, lineHeight:1.65 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════════════════════ */}
      <div id="features" style={{ background:'#fff', padding:'96px 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <span style={{ display:'inline-block', background:'rgba(232,83,58,0.1)', color: ACCENT, fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', padding:'5px 14px', borderRadius:999, marginBottom:16 }}>
              Features
            </span>
            <h2 style={{ fontSize:40, fontWeight:800, color:'#111827', margin:0, letterSpacing:-0.5 }}>
              Built to get you results fast.
            </h2>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:20 }}>
            {feats.map(({ icon: Icon, color, ic, title, body }) => (
              <div key={title} style={{ background: LIGHT_BG, borderRadius:16, padding:'28px 24px' }}>
                <div style={{ width:48, height:48, borderRadius:14, background: color, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                  <Icon style={{ width:24, height:24, color: ic }} />
                </div>
                <h3 style={{ fontSize:15, fontWeight:700, color:'#111827', margin:0, marginBottom:8 }}>{title}</h3>
                <p style={{ fontSize:13, color:'#6b7280', margin:0, lineHeight:1.65 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          HIRING SCORE
      ═══════════════════════════════════════════════════════ */}
      <div style={{ background: LIGHT_BG, padding:'96px 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' }}>
          <div>
            <span style={{ display:'inline-block', background:'rgba(232,83,58,0.1)', color: ACCENT, fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', padding:'5px 14px', borderRadius:999, marginBottom:20 }}>
              Ranking system
            </span>
            <h2 style={{ fontSize:38, fontWeight:800, color:'#111827', margin:0, marginBottom:16, letterSpacing:-0.5, lineHeight:1.15 }}>
              Hiring activity score
            </h2>
            <p style={{ fontSize:15, color:'#6b7280', lineHeight:1.7, margin:0, marginBottom:32 }}>
              Not all recruiters are equally useful. Our scoring system ranks them by how recently and actively they&apos;ve posted about hiring — so you reach out to the right people first.
            </p>
            <Link href="/signup" style={{ display:'inline-flex', alignItems:'center', gap:8, background: ACCENT, color:'#fff', fontWeight:700, fontSize:15, padding:'13px 24px', borderRadius:10, textDecoration:'none' }}>
              Try it free <ArrowRight style={{ width:16, height:16 }} />
            </Link>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {scoreRows.map(({ label, score, bar, tag }) => (
              <div key={label} style={{ background:'#fff', borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', border:'1px solid #e5e7eb' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontSize:13, fontWeight:500, color:'#374151' }}>{label}</span>
                  <span style={{ fontSize:15, fontWeight:800, color:'#111827', marginLeft:8, flexShrink:0 }}>{score}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ flex:1, height:6, background:'#f3f4f6', borderRadius:999, overflow:'hidden' }}>
                    <div style={{ width: score > 0 ? `${score}%` : '3%', height:'100%', background: bar, borderRadius:999 }} />
                  </div>
                  <span style={{ fontSize:11, color:'#9ca3af', width:88, textAlign:'right', flexShrink:0 }}>{tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════════════ */}
      <div style={{ background:'#fff', padding:'96px 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <span style={{ display:'inline-block', background:'rgba(232,83,58,0.1)', color: ACCENT, fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', padding:'5px 14px', borderRadius:999, marginBottom:16 }}>
              User stories
            </span>
            <h2 style={{ fontSize:40, fontWeight:800, color:'#111827', margin:0, letterSpacing:-0.5 }}>
              Careers changed by RecruiterFind.
            </h2>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:20 }}>
            {testimonials.map(({ q, name, role, init, c }) => (
              <div key={name} style={{ background: LIGHT_BG, borderRadius:16, padding:'28px 24px' }}>
                <div style={{ display:'flex', gap:2, marginBottom:16 }}>
                  {[...Array(5)].map((_,i) => <Star key={i} style={{ width:16, height:16, fill:'#f59e0b', color:'#f59e0b' }} />)}
                </div>
                <p style={{ fontSize:14, color:'#374151', lineHeight:1.7, margin:0, marginBottom:24, fontStyle:'italic' }}>{q}</p>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background: c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'#fff', flexShrink:0 }}>
                    {init}
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{name}</div>
                    <div style={{ fontSize:12, color:'#9ca3af' }}>{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          CTA — dark gradient
      ═══════════════════════════════════════════════════════ */}
      <div id="pricing" style={{ padding:'0 24px 80px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ background:'linear-gradient(135deg, #0d0f1c 0%, #1a0d2e 100%)', borderRadius:24, padding:'64px 64px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:48 }}>
            <div>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:3, color: ACCENT, textTransform:'uppercase', display:'block', marginBottom:16 }}>
                Start today · It&apos;s free
              </span>
              <h2 style={{ fontSize:40, fontWeight:800, color:'#fff', margin:0, marginBottom:16, lineHeight:1.15, letterSpacing:-0.5 }}>
                Your recruiter outreach<br />starts right now.
              </h2>
              <p style={{ fontSize:15, color:'rgba(255,255,255,0.5)', margin:0, lineHeight:1.65 }}>
                Add your Apify key, enter a company name, and get 50<br />recruiter contacts with verified emails in under 3 minutes.
              </p>
            </div>
            <div style={{ flexShrink:0, textAlign:'center' }}>
              <Link href="/signup" style={{ display:'inline-flex', alignItems:'center', gap:8, background: ACCENT, color:'#fff', fontWeight:700, fontSize:16, padding:'16px 32px', borderRadius:12, textDecoration:'none', whiteSpace:'nowrap' }}>
                Get started — it&apos;s free <ArrowRight style={{ width:18, height:18 }} />
              </Link>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)', margin:0, marginTop:12 }}>
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════ */}
      <footer style={{ borderTop:'1px solid #e5e7eb', padding:'28px 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:26, height:26, borderRadius:7, background: ACCENT, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap style={{ width:14, height:14, color:'#fff' }} />
            </div>
            <span style={{ fontWeight:700, color:'#111827', fontSize:14 }}>RecruiterFind</span>
          </div>
          <span style={{ fontSize:12, color:'#9ca3af' }}>© 2026 RecruiterFind. Built for job seekers.</span>
          <div style={{ display:'flex', gap:24 }}>
            {['Privacy','Terms','Contact'].map(l=>(
              <a key={l} href="#" style={{ fontSize:12, color:'#9ca3af', textDecoration:'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
