'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Search, Settings, ClipboardList, LogOut, Zap } from 'lucide-react';

const ACCENT  = '#e8533a';
const NAV_BG  = '#0d0f1c';

const navItems = [
  { href: '/scrapper',       label: 'Scrapper',       icon: Search },
  { href: '/orders',         label: 'Orders',         icon: ClipboardList },
  { href: '/configuration',  label: 'Configuration',  icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/landing');
    router.refresh();
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      height: 60, background: NAV_BG,
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 24px',
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link href="/scrapper" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap style={{ width: 16, height: 16, color: '#fff' }} />
          </div>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>RecruiterFind</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, textDecoration: 'none',
                fontSize: 13, fontWeight: active ? 600 : 500,
                color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                transition: 'all .15s',
              }}>
                <Icon style={{ width: 14, height: 14 }} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Sign out */}
        <button onClick={handleSignOut} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 8, border: 'none',
          background: 'transparent', cursor: 'pointer',
          fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.4)',
        }}>
          <LogOut style={{ width: 14, height: 14 }} />
          Sign out
        </button>
      </div>
    </nav>
  );
}
