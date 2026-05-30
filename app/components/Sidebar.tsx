'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const PROSPECT_NAV = [
  {
    href: '/',
    label: 'Sök prospects',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="9" r="6"/><path d="m14 14 4 4"/>
      </svg>
    ),
  },
  {
    href: '/prospects',
    label: 'Prospects',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5h14M3 10h14M3 15h14"/>
      </svg>
    ),
  },
  {
    href: '/pipeline',
    label: 'Pipeline',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="5" height="14" rx="1"/>
        <rect x="9" y="3" width="5" height="9" rx="1"/>
        <rect x="16" y="3" width="5" height="6" rx="1" transform="translate(-3, 0)"/>
      </svg>
    ),
  },
];

const BUSINESS_NAV = [
  {
    href: '/customers',
    label: 'Kunder',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="6" r="3"/><path d="M2 18c0-4 3-6 6-6s6 2 6 6"/>
        <circle cx="15" cy="6" r="2.5"/><path d="M18 18c0-3-1.5-5-3-5.5"/>
      </svg>
    ),
  },
  {
    href: '/demos',
    label: 'Demosidor',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="16" height="11" rx="2"/>
        <path d="M7 18h6M10 14v4"/>
      </svg>
    ),
  },
];

function NavItem({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  const path = usePathname();
  const active = path === href || (href !== '/' && path.startsWith(href));
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '9px 12px',
        borderRadius: 10,
        textDecoration: 'none',
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: '-0.005em',
        background: active ? 'rgba(0,0,0,0.06)' : 'transparent',
        color: 'var(--text)',
        transition: 'background 0.15s',
      }}
    >
      <span style={{ color: active ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setUser(d));
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (path === '/login') return null;

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '..';

  return (
    <aside className="desktop-sidebar" style={{
      width: 232,
      flexShrink: 0,
      background: 'var(--bg-subtle)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      padding: '24px 16px 20px',
    }}>
      <div style={{ padding: '4px 6px 32px', display: 'flex', alignItems: 'center' }}>
        <Image src="/logo-tight.png" alt="JD Prospects" height={32} width={140} style={{ height: 32, width: 'auto' }} />
      </div>

      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
        textTransform: 'uppercase', color: 'var(--text-faint)',
        padding: '0 10px 10px',
      }}>
        Prospektering
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {PROSPECT_NAV.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
        textTransform: 'uppercase', color: 'var(--text-faint)',
        padding: '20px 10px 10px',
        borderTop: '1px solid var(--border)',
        marginTop: 16,
      }}>
        Verksamhet
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {BUSINESS_NAV.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      {user?.role === 'admin' && (
        <>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: 'var(--text-faint)',
            padding: '20px 10px 10px',
            borderTop: '1px solid var(--border)',
            marginTop: 16,
          }}>
            Admin
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <NavItem
              href="/admin/users"
              label="Användare"
              icon={
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="6" r="3"/><path d="M2 18c0-4 3-6 6-6s6 2 6 6"/>
                  <path d="M15 8v6M12 11h6"/>
                </svg>
              }
            />
          </nav>
        </>
      )}

      <div style={{
        marginTop: 'auto',
        padding: '14px 8px 4px',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--accent-soft)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: 12, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email ?? '…'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {user?.role === 'admin' ? 'Admin' : 'Säljare'}
            </div>
          </div>
          <button
            onClick={logout}
            title="Logga ut"
            style={{
              width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 6,
              background: 'var(--bg)', color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M11 11l3-3-3-3M14 8H6"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
