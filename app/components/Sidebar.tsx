'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const NAV = [
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

export default function Sidebar() {
  const path = usePathname();

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
        Arbetsyta
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ href, label, icon }) => {
          const active = path === href || (href !== '/' && path.startsWith(href));
          return (
            <Link
              key={href}
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
        })}
      </nav>

      <div style={{
        marginTop: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 8px 4px',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 600, fontSize: 13, flexShrink: 0,
        }}>
          JD
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>JD Prospects</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>beta</div>
        </div>
      </div>
    </aside>
  );
}
