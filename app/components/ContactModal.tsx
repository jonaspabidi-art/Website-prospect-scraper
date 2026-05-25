'use client';

import { useState } from 'react';

type Prospect = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  orgNumber: string | null;
  employees: number | null;
  revenue: number | null;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} style={{
      fontSize: 11, padding: '3px 8px', borderRadius: 4,
      border: '1.5px solid var(--border)',
      background: copied ? 'var(--good-bg)' : 'var(--bg-card)',
      color: copied ? 'var(--good)' : 'var(--ink-soft)',
      cursor: 'pointer', transition: 'all 0.15s',
    }}>
      {copied ? '✓ Kopierat' : 'Kopiera'}
    </button>
  );
}

type Props = { prospect: Prospect; onClose: () => void };

export default function ContactModal({ prospect, onClose }: Props) {
  const template = `Hej! Jag heter Jonas och såg att ${prospect.name} inte har en hemsida. Vi hjälper lokala företag att synas online snabbt och enkelt. Har du 5 minuter att prata? / Jonas`;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(28,24,20,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', borderRadius: 12,
          border: '1.5px solid var(--border)', padding: 28,
          width: 480, maxWidth: '95vw', boxShadow: '0 8px 32px rgba(28,24,20,0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 20 }}>{prospect.name}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
              {prospect.city}{prospect.employees ? ` · ${prospect.employees} anst.` : ''}{prospect.revenue ? ` · ${(prospect.revenue / 1000000).toFixed(1)} MSEK` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: 4 }}>Telefon</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-hand)', fontSize: 15 }}>{prospect.phone || '—'}</span>
              {prospect.phone && <CopyButton text={prospect.phone} />}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: 4 }}>Org.nr</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-hand)', fontSize: 15 }}>{prospect.orgNumber || '—'}</span>
              {prospect.orgNumber && <CopyButton text={prospect.orgNumber} />}
            </div>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: 4 }}>Adress</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-hand)', fontSize: 15 }}>{prospect.address || '—'}</span>
              {prospect.address && <CopyButton text={prospect.address} />}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1.5px dashed var(--border-soft)', paddingTop: 16 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: 8 }}>Föreslagen pitch</div>
          <div style={{
            background: 'var(--bg)', border: '1.5px solid var(--border-soft)',
            borderRadius: 8, padding: '12px 14px',
            fontFamily: 'var(--font-hand)', fontSize: 14, lineHeight: 1.6,
            color: 'var(--ink-soft)', marginBottom: 10,
          }}>
            {template}
          </div>
          <CopyButton text={template} />
        </div>
      </div>
    </div>
  );
}
