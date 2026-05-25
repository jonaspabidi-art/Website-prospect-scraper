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
  priorityScore: number;
  status: string;
  job: { industry: string; city: string };
};

type Mode = 'pitch' | 'sms' | 'email';

type Props = {
  prospect: Prospect;
  onClose: () => void;
  onRefresh?: () => void;
};

function scoreClass(score: number) {
  if (score >= 70) return { bg: 'var(--green-soft)', color: 'var(--green)', border: 'var(--green-border)' };
  if (score >= 40) return { bg: 'var(--yellow-soft)', color: 'var(--yellow)', border: 'var(--yellow-border)' };
  return { bg: 'var(--red-soft)', color: 'var(--red)', border: 'var(--red-border)' };
}

function statusPill(status: string) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    Ny:          { bg: '#f0f0f3', color: '#4b5563', border: 'rgba(0,0,0,0.06)' },
    Ringd:       { bg: 'var(--accent-soft)', color: 'var(--accent-text)', border: 'rgba(26,86,219,0.18)' },
    Intresserad: { bg: 'var(--green-soft)', color: 'var(--green)', border: 'var(--green-border)' },
    Kund:        { bg: 'var(--purple-soft)', color: 'var(--purple)', border: 'var(--purple-border)' },
    Nej:         { bg: 'var(--red-soft)', color: 'var(--red)', border: 'var(--red-border)' },
  };
  return map[status] ?? { bg: '#f0f0f3', color: '#4b5563', border: 'rgba(0,0,0,0.06)' };
}

export default function ContactModal({ prospect, onClose, onRefresh }: Props) {
  const [mode, setMode] = useState<Mode>('pitch');
  const [copied, setCopied] = useState(false);
  const [marking, setMarking] = useState(false);

  const industry = prospect.job?.industry ?? '';
  const city = prospect.city || prospect.job?.city || '';

  const pitch = `Hej!

Jag såg att ${prospect.name} inte har en hemsida. Vi hjälper ${industry.toLowerCase()}er i ${city}-området att synas online snabbt och enkelt — ofta på under en vecka.

Har du 5 minuter att prata?

Vänliga hälsningar,
Jonas`;

  const sms = `Hej! Jonas här. Sett att ${prospect.name.split(' ')[0]} inte har en hemsida — hjälper gärna er komma igång snabbt. Har du 5 min? /Jonas`;

  function getContent() {
    if (mode === 'pitch') return pitch;
    if (mode === 'sms') return sms;
    return '';
  }

  const copy = () => {
    navigator.clipboard.writeText(getContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const markAsRingd = async () => {
    if (prospect.status === 'Ringd') { onClose(); return; }
    setMarking(true);
    await fetch(`/api/prospects/${prospect.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Ringd' }),
    });
    setMarking(false);
    onRefresh?.();
    onClose();
  };

  const sc = scoreClass(prospect.priorityScore);
  const sp = statusPill(prospect.status);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.32)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, zIndex: 100,
        backdropFilter: 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: 'blur(14px) saturate(140%)',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: 620,
          maxHeight: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.18s ease',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>{prospect.name}</h2>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                {city}{prospect.employees ? ` · ${prospect.employees} anst.` : ''}{prospect.revenue ? ` · ${(prospect.revenue / 1000000).toFixed(1)} MSEK` : ''}{prospect.orgNumber ? ` · Org. ${prospect.orgNumber}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, marginBottom: 16 }}>
                <span style={{
                  background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                  fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--r-pill)',
                }}>
                  Score {prospect.priorityScore}
                </span>
                <span style={{
                  background: sp.bg, color: sp.color, border: `1px solid ${sp.border}`,
                  fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 'var(--r-pill)',
                }}>
                  {prospect.status}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, border: 'none', background: 'transparent',
                borderRadius: 'var(--r-sm)', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l8 8M12 4L4 12"/>
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: -1 }}>
            {(['pitch', 'sms', 'email'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px 8px 0 0',
                  fontSize: 13, fontWeight: 500,
                  color: mode === m ? 'var(--accent-text)' : 'var(--text-muted)',
                  background: mode === m ? 'var(--accent-soft)' : 'transparent',
                  border: mode === m ? '1px solid rgba(26,86,219,0.18)' : '1px solid transparent',
                  borderBottom: mode === m ? '1px solid var(--bg)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'background 0.12s, color 0.12s',
                }}
              >
                {m === 'pitch' ? 'Pitch' : m === 'sms' ? 'SMS' : 'E-post'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {mode === 'pitch' && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                Pitch · ringskript
              </div>
              <div style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                padding: '18px 20px',
                fontSize: 14, lineHeight: 1.65,
                color: 'var(--text)',
                whiteSpace: 'pre-wrap',
              }}>
                {pitch}
              </div>
              {prospect.phone && (
                <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M2 3a1 1 0 0 1 1-1h2.5a1 1 0 0 1 1 .9l.5 3a1 1 0 0 1-.6 1l-1 .5a9 9 0 0 0 3.7 3.7l.5-1a1 1 0 0 1 1-.6l3 .5a1 1 0 0 1 .9 1V13a1 1 0 0 1-1 1A13 13 0 0 1 2 3Z"/>
                  </svg>
                  <a href={`tel:${prospect.phone}`} style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
                    {prospect.phone}
                  </a>
                </div>
              )}
            </>
          )}
          {mode === 'sms' && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                SMS · förhandsgranskning
              </div>
              <div style={{
                background: 'var(--accent)',
                color: '#fff',
                borderRadius: '16px 16px 16px 4px',
                padding: '12px 16px',
                maxWidth: '80%',
                fontSize: 14,
                lineHeight: 1.5,
              }}>
                {sms}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                <span>Till: {prospect.phone || '—'}</span>
                <span>{sms.length} / 160 tecken · 1 SMS</span>
              </div>
            </>
          )}
          {mode === 'email' && (
            <div style={{
              border: '1px dashed var(--border-strong)',
              borderRadius: 'var(--r-md)',
              padding: '48px 32px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              background: 'var(--bg-subtle)',
            }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>E-postmall kommer snart</div>
              <p style={{ margin: 0, fontSize: 14 }}>Vi jobbar på e-postintegration.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={copy}
              style={ghostBtnStyle}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M3 11V3a1 1 0 0 1 1-1h8"/>
              </svg>
              {copied ? 'Kopierat!' : 'Kopiera'}
            </button>
          </div>
          {mode !== 'email' && (
            <button
              onClick={markAsRingd}
              disabled={marking}
              style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--r-pill)',
                padding: '8px 18px',
                fontSize: 14,
                fontWeight: 500,
                cursor: marking ? 'not-allowed' : 'pointer',
                opacity: marking ? 0.7 : 1,
                transition: 'background 0.15s',
              }}
            >
              {mode === 'sms' ? 'Skicka SMS' : 'Markera som ringd'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

const ghostBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 16px',
  borderRadius: 'var(--r-pill)',
  fontSize: 14, fontWeight: 500,
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  cursor: 'pointer',
  transition: 'background 0.15s',
};
