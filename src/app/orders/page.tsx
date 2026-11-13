'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { resultsToCSV, formatDate } from '@/lib/utils';
import type { Order } from '@/types';
import { Download, Loader2, ClipboardList, Building2, Calendar, Users, ChevronDown, ChevronRight } from 'lucide-react';

const ACCENT   = '#e8533a';
const LIGHT_BG = '#f7f8fc';
const BORDER   = '#e5e7eb';
const TEXT      = '#111827';
const MUTED     = '#6b7280';

type StatusMeta = { label:string; bg:string; color:string };

function statusMeta(s: Order['status']): StatusMeta {
  if (s==='completed') return { label:'Completed', bg:'#d1fae5', color:'#065f46' };
  if (s==='processing') return { label:'Processing', bg:'#dbeafe', color:'#1e40af' };
  if (s==='pending')    return { label:'Pending',    bg:'#fef3c7', color:'#92400e' };
  return                       { label:'Failed',     bg:'#fee2e2', color:'#991b1b' };
}

export default function OrdersPage() {
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<string|null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending:false });
      setOrders((data as Order[]) ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  function downloadCSV(order: Order) {
    if (!order.results?.length) return;
    const csv  = resultsToCSV(order.results);
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `recruiters-${order.company}-${order.id.slice(0,8)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background: LIGHT_BG, paddingTop:60, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Loader2 style={{ width:24, height:24, color:'#9ca3af', animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background: LIGHT_BG, paddingTop:60 }}>
      <div style={{ maxWidth:900, margin:'0 auto', padding:'40px 24px' }}>

        {/* Page header */}
        <div style={{ marginBottom:32 }}>
          <h1 style={{ fontSize:28, fontWeight:800, color: TEXT, margin:0, letterSpacing:-0.5 }}>Orders</h1>
          <p style={{ fontSize:14, color: MUTED, margin:0, marginTop:6 }}>
            Past scrape runs — download CSV results for any completed order.
          </p>
        </div>

        {orders.length===0 ? (
          <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${BORDER}`, minHeight:400, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:48 }}>
            <div style={{ width:52, height:52, borderRadius:14, background: LIGHT_BG, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
              <ClipboardList style={{ width:22, height:22, color:'#d1d5db' }} />
            </div>
            <p style={{ fontSize:14, fontWeight:600, color: MUTED, margin:0 }}>No orders yet</p>
            <p style={{ fontSize:13, color:'#9ca3af', margin:0, marginTop:4 }}>Run your first scrape and results will appear here.</p>
            <button onClick={()=>window.location.href='/scrapper'} style={{
              marginTop:20, padding:'10px 20px', borderRadius:9, border:'none',
              background: ACCENT, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer',
            }}>
              Go to Scrapper
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {orders.map(order => {
              const meta = statusMeta(order.status);
              const isOpen = expanded===order.id;
              return (
                <div key={order.id} style={{ background:'#fff', borderRadius:16, border:`1px solid ${BORDER}`, overflow:'hidden' }}>

                  {/* Row header */}
                  <div
                    onClick={()=>setExpanded(isOpen ? null : order.id)}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', cursor:'pointer' }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:14, minWidth:0 }}>
                      <div style={{ width:38, height:38, borderRadius:10, background: LIGHT_BG, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Building2 style={{ width:17, height:17, color: MUTED }} />
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                          <span style={{ fontSize:14, fontWeight:700, color: TEXT }}>{order.company}</span>
                          <span style={{ fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:999, background: meta.bg, color: meta.color }}>
                            {meta.label}
                          </span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:16, marginTop:3 }}>
                          <span style={{ fontSize:12, color: MUTED, display:'flex', alignItems:'center', gap:4 }}>
                            <Users style={{ width:12, height:12 }} />{order.actual_count??0} of {order.requested_count} found
                          </span>
                          <span style={{ fontSize:12, color: MUTED, display:'flex', alignItems:'center', gap:4 }}>
                            <Calendar style={{ width:12, height:12 }} />{formatDate(order.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                      {order.status==='completed' && order.results?.length && (
                        <button onClick={e=>{e.stopPropagation(); downloadCSV(order);}} style={{
                          display:'inline-flex', alignItems:'center', gap:6,
                          padding:'7px 14px', borderRadius:8, border:`1px solid ${BORDER}`,
                          background:'#fff', color: TEXT, fontWeight:600, fontSize:12, cursor:'pointer',
                        }}>
                          <Download style={{ width:13, height:13 }} /> CSV
                        </button>
                      )}
                      {isOpen
                        ? <ChevronDown style={{ width:16, height:16, color: MUTED }} />
                        : <ChevronRight style={{ width:16, height:16, color: MUTED }} />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div style={{ borderTop:`1px solid ${BORDER}`, padding:'20px 20px 20px' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:16 }}>
                        {[
                          ['Company',         order.company],
                          ['Country',         order.country],
                          ['Role type',       order.role_type],
                          ['Activity window', order.activity_window],
                        ].map(([k,v])=>(
                          <div key={k} style={{ background: LIGHT_BG, borderRadius:10, padding:'10px 14px' }}>
                            <p style={{ fontSize:11, color:'#9ca3af', margin:0 }}>{k}</p>
                            <p style={{ fontSize:13, fontWeight:600, color: TEXT, margin:0, marginTop:2 }}>{v}</p>
                          </div>
                        ))}
                      </div>

                      {order.error && (
                        <p style={{ fontSize:13, color:'#b91c1c', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:9, padding:'10px 14px', margin:0, marginBottom:14 }}>
                          {order.error}
                        </p>
                      )}

                      {order.results && order.results.length>0 && (
                        <div>
                          <p style={{ fontSize:12, fontWeight:700, color: MUTED, textTransform:'uppercase', letterSpacing:0.5, margin:0, marginBottom:8 }}>
                            Top results preview ({Math.min(5, order.results.length)} of {order.results.length})
                          </p>
                          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                            {order.results.slice(0,5).map((r,i)=>(
                              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background: LIGHT_BG, borderRadius:8, padding:'9px 14px' }}>
                                <div>
                                  <span style={{ fontSize:13, fontWeight:600, color: TEXT }}>{r.name}</span>
                                  <span style={{ fontSize:12, color: MUTED, marginLeft:8 }}>{r.title}</span>
                                </div>
                                {r.email && <span style={{ fontSize:12, color:'#059669' }}>{r.email}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
