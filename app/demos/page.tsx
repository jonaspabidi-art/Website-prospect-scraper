'use client';

import { useState, useEffect } from 'react';

type DemoSite = {
  id: string;
  industry: string;
  url: string;
  notes: string | null;
  createdAt: string;
};

const empty = { industry: '', url: '', notes: '' };

function Modal({
  initial,
  onSave,
  onClose,
}: {
  initial: typeof empty & { id?: string };
  onSave: (data: typeof empty & { id?: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof empty, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.industry.trim() || !form.url.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    fontSize: 13,
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: 'var(--bg)',
    color: 'var(--text)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440,
        boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: 16,
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{initial.id ? 'Redigera demo' : 'Ny demosida'}</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Bransch *</label>
            <input style={fieldStyle} value={form.industry} onChange={e => set('industry', e.target.value)} placeholder="t.ex. Rörmokare" required />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>URL *</label>
            <input style={fieldStyle} value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://demo.example.com" type="url" required />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Anteckningar</label>
            <textarea style={{ ...fieldStyle, resize: 'vertical', minHeight: 70 }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Byggd för VVS-bolag i Stockholm, fokus på kontaktformulär..." />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              padding: '8px 16px', fontSize: 13, borderRadius: 8, border: '1px solid var(--border)',
              background: 'none', color: 'var(--text)', cursor: 'pointer',
            }}>
              Avbryt
            </button>
            <button type="submit" disabled={saving} style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
              border: 'none', background: 'var(--accent)', color: '#fff', cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Sparar...' : 'Spara'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DemosPage() {
  const [demos, setDemos] = useState<DemoSite[]>([]);
  const [modal, setModal] = useState<(typeof empty & { id?: string }) | null>(null);

  const fetch_ = async () => {
    const res = await fetch('/api/demos');
    setDemos(await res.json());
  };

  useEffect(() => { fetch_(); }, []);

  const openNew = () => setModal({ ...empty });
  const openEdit = (d: DemoSite) => setModal({ id: d.id, industry: d.industry, url: d.url, notes: d.notes ?? '' });

  const save = async (form: typeof empty & { id?: string }) => {
    const method = form.id ? 'PATCH' : 'POST';
    const url = form.id ? `/api/demos/${form.id}` : '/api/demos';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setModal(null);
    fetch_();
  };

  const del = async (id: string) => {
    if (!window.confirm('Ta bort demosidan?')) return;
    await fetch(`/api/demos/${id}`, { method: 'DELETE' });
    fetch_();
  };

  // Group by industry
  const grouped = demos.reduce<Record<string, DemoSite[]>>((acc, d) => {
    (acc[d.industry] = acc[d.industry] || []).push(d);
    return acc;
  }, {});

  return (
    <div style={{ padding: '48px 32px 80px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', margin: 0, lineHeight: 1.15 }}>Demosidor</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: '6px 0 0' }}>
            {demos.length} demo{demos.length !== 1 ? 's' : ''} · {Object.keys(grouped).length} bransch{Object.keys(grouped).length !== 1 ? 'er' : ''}
          </p>
        </div>
        <button onClick={openNew} style={{
          padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 10,
          border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer',
          flexShrink: 0,
        }}>
          + Ny demo
        </button>
      </div>

      {demos.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 16,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🖥️</div>
          <div style={{ fontWeight: 500 }}>Inga demosidor ännu</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Lägg till en demo för varje bransch du pitchar mot</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(grouped).map(([industry, items]) => (
            <div key={industry}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
                textTransform: 'uppercase', color: 'var(--text-faint)',
                marginBottom: 10,
              }}>
                {industry}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map(d => (
                  <div key={d.id} style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: 16,
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a
                        href={d.url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', wordBreak: 'break-all' }}
                      >
                        {d.url.replace(/^https?:\/\//, '')}
                      </a>
                      {d.notes && (
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{d.notes}</p>
                      )}
                    </div>
                    <a
                      href={d.url} target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 12, fontWeight: 500, color: 'var(--accent)',
                        background: 'var(--accent-soft)', border: '1px solid rgba(26,86,219,0.18)',
                        borderRadius: 7, padding: '5px 11px', textDecoration: 'none',
                        flexShrink: 0,
                      }}
                    >
                      Öppna
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 11 10 2M4 2h6v6"/>
                      </svg>
                    </a>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => openEdit(d)} style={{
                        background: 'none', border: '1px solid var(--border)', borderRadius: 7,
                        padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--text-muted)',
                      }}>Redigera</button>
                      <button onClick={() => del(d.id)} style={{
                        background: 'none', border: '1px solid var(--red-border)', borderRadius: 7,
                        padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--red)',
                      }}>Ta bort</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <Modal initial={modal} onSave={save} onClose={() => setModal(null)} />}
    </div>
  );
}
