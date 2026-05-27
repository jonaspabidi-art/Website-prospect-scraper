'use client';

import { useState, useEffect } from 'react';

type Customer = {
  id: string;
  name: string;
  website: string | null;
  amountPaid: number | null;
  pitch: string | null;
  notes: string | null;
  createdAt: string;
};

const empty = { name: '', website: '', amountPaid: '', pitch: '', notes: '' };

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
    if (!form.name.trim()) return;
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
        background: 'var(--bg)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480,
        boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: 16,
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{initial.id ? 'Redigera kund' : 'Ny kund'}</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Namn *</label>
            <input style={fieldStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Företagsnamn" required />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Hemsida</label>
            <input style={fieldStyle} value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." type="url" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Betalat (kr)</label>
            <input style={fieldStyle} value={form.amountPaid} onChange={e => set('amountPaid', e.target.value)} placeholder="15000" type="number" min="0" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Hur pitchade du?</label>
            <textarea style={{ ...fieldStyle, resize: 'vertical', minHeight: 80 }} value={form.pitch} onChange={e => set('pitch', e.target.value)} placeholder="Ringde och pratade om att de saknade hemsida..." />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Anteckningar</label>
            <textarea style={{ ...fieldStyle, resize: 'vertical', minHeight: 60 }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Övrigt..." />
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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [modal, setModal] = useState<(typeof empty & { id?: string }) | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetch_ = async () => {
    const res = await fetch('/api/customers');
    setCustomers(await res.json());
  };

  useEffect(() => { fetch_(); }, []);

  const openNew = () => setModal({ ...empty });
  const openEdit = (c: Customer) => setModal({
    id: c.id, name: c.name, website: c.website ?? '',
    amountPaid: c.amountPaid != null ? String(c.amountPaid) : '',
    pitch: c.pitch ?? '', notes: c.notes ?? '',
  });

  const save = async (form: typeof empty & { id?: string }) => {
    const method = form.id ? 'PATCH' : 'POST';
    const url = form.id ? `/api/customers/${form.id}` : '/api/customers';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amountPaid: form.amountPaid ? Number(form.amountPaid) : null }),
    });
    setModal(null);
    fetch_();
  };

  const del = async (id: string) => {
    if (!window.confirm('Ta bort kunden?')) return;
    await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    fetch_();
  };

  const totalRevenue = customers.reduce((s, c) => s + (c.amountPaid ?? 0), 0);

  return (
    <div style={{ padding: '48px 32px 80px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', margin: 0, lineHeight: 1.15 }}>Kunder</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: '6px 0 0' }}>
            {customers.length} kund{customers.length !== 1 ? 'er' : ''}
            {totalRevenue > 0 && (
              <span style={{ marginLeft: 12, color: 'var(--green)', fontWeight: 500 }}>
                {totalRevenue.toLocaleString('sv-SE')} kr totalt
              </span>
            )}
          </p>
        </div>
        <button onClick={openNew} style={{
          padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 10,
          border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer',
          flexShrink: 0,
        }}>
          + Ny kund
        </button>
      </div>

      {customers.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 16,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🤝</div>
          <div style={{ fontWeight: 500 }}>Inga kunder ännu</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Lägg till din första kund ovan</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {customers.map(c => (
            <div key={c.id} style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 18px', cursor: 'pointer',
              }} onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--accent-soft)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 14,
                }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                  {c.website && (
                    <a
                      href={c.website} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}
                    >
                      {c.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
                {c.amountPaid != null && (
                  <span style={{
                    fontSize: 13, fontWeight: 600, color: 'var(--green)',
                    background: 'var(--green-soft)', border: '1px solid var(--green-border)',
                    padding: '3px 10px', borderRadius: 'var(--r-pill)', flexShrink: 0,
                  }}>
                    {c.amountPaid.toLocaleString('sv-SE')} kr
                  </span>
                )}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={e => { e.stopPropagation(); openEdit(c); }} style={{
                    background: 'none', border: '1px solid var(--border)', borderRadius: 7,
                    padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--text-muted)',
                  }}>Redigera</button>
                  <button onClick={e => { e.stopPropagation(); del(c.id); }} style={{
                    background: 'none', border: '1px solid var(--red-border)', borderRadius: 7,
                    padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--red)',
                  }}>Ta bort</button>
                </div>
              </div>

              {expanded === c.id && (c.pitch || c.notes) && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  {c.pitch && (
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Pitch</div>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.pitch}</p>
                    </div>
                  )}
                  {c.notes && (
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Anteckningar</div>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && <Modal initial={modal} onSave={save} onClose={() => setModal(null)} />}
    </div>
  );
}
