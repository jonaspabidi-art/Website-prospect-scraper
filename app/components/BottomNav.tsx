'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  {
    href: '/',
    label: 'Sök',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="9" r="6"/><path d="m14 14 4 4"/>
      </svg>
    ),
  },
  {
    href: '/prospects',
    label: 'Prospects',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5h14M3 10h14M3 15h14"/>
      </svg>
    ),
  },
  {
    href: '/pipeline',
    label: 'Pipeline',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="5" height="14" rx="1"/>
        <rect x="9" y="3" width="5" height="9" rx="1"/>
        <rect x="13" y="3" width="5" height="6" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/customers',
    label: 'Kunder',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="6" r="3"/><path d="M2 18c0-4 3-6 6-6s6 2 6 6"/>
        <circle cx="15" cy="6" r="2.5"/><path d="M18 18c0-3-1.5-5-3-5.5"/>
      </svg>
    ),
  },
  {
    href: '/demos',
    label: 'Demos',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="16" height="11" rx="2"/>
        <path d="M7 18h6M10 14v4"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const path = usePathname();
  if (path === '/login') return null;
  return (
    <nav className="mobile-bottomnav">
      {NAV.map(({ href, label, icon }) => {
        const active = path === href || (href !== '/' && path.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              textDecoration: 'none',
              flex: 1,
              padding: '6px 0',
              color: active ? 'var(--accent)' : 'var(--text-faint)',
              fontSize: 10,
              fontWeight: active ? 600 : 400,
              transition: 'color 0.15s',
            }}
          >
            {icon}
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
