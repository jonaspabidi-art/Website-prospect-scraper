'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TEMPLATE_LABELS, TEMPLATE_COLORS } from '@/app/templates/types';
import type { TemplateId } from '@/app/templates/types';

type Demo = {
  id: string;
  name: string;
  template: TemplateId;
  slug: string;
  published: boolean;
  notes: string | null;
  createdAt: string;
};

const TEMPLATES: { id: TemplateId; emoji: string }[] = [
  { id: 'restaurang', emoji: '🍽️' },
  { id: 'hantverkare', emoji: '🔧' },
  { id: 'tjansteforetag', emoji: '💼' },
  { id: 'verkstad', emoji: '🚗' },
];

function NewDemoModal({ onClose, onCreate }: { onClose: () => void; onCreate: (d: Demo) => void }) {
  const [name, setName] = useState('');
  const [template, setTemplate] = useState<TemplateId>('restaurang');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch('/api/demos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), template }),
    });
    const demo = await res.json();
    setSaving(false);
    onCreate(demo);
    router.push(`/demos/${demo.id}/edit`);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480,
        boxShadow: 'var(--shadow-lg)',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>Ny demosida</h2>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Namn</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="t.ex. Bergströms VVS – Stockholm"
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box', padding: '9px 12px', fontSize: 14,
              border: '1px solid var(--border)', borderRadius: 9, background: 'var(--bg)',
              color: 'var(--text)', outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 10 }}>Välj mall</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {TEMPLATES.map(t => {
              const selected = template === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id)}
                  style={{
                    padding: '14px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: selected ? `2px solid ${TEMPLATE_COLORS[t.id]}` : '1.5px solid var(--border)',
                    background: selected ? `${TEMPLATE_COLORS[t.id]}0f` : 'var(--bg-subtle)',
                    transition: 'all 0.12s',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{t.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: selected ? TEMPLATE_COLORS[t.id] : 'var(--text)' }}>
                    {TEMPLATE_LABELS[t.id]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '9px 18px', fontSize: 13, borderRadius: 8,
            border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer',
          }}>Avbryt</button>
          <button onClick={handleCreate} disabled={saving || !name.trim()} style={{
            padding: '9px 22px', fontSize: 13, fontWeight: 600, borderRadius: 8,
            border: 'none', background: 'var(--accent)', color: '#fff',
            cursor: saving || !name.trim() ? 'default' : 'pointer', opacity: !name.trim() ? 0.5 : 1,
          }}>
            {saving ? 'Skapar...' : 'Skapa & redigera →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DemosPage() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [showNew, setShowNew] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/demos').then(r => r.json()).then(setDemos);
  }, []);

  const del = async (id: string) => {
    if (!window.confirm('Ta bort demosidan?')) return;
    await fetch(`/api/demos/${id}`, { method: 'DELETE' });
    setDemos(ds => ds.filter(d => d.id !== id));
  };

  const templateEmoji = (t: TemplateId) => TEMPLATES.find(x => x.id === t)?.emoji ?? '🖥️';

  return (
    <div style={{ padding: '48px 32px 80px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, lineHeight: 1.15 }}>Demosidor</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: '6px 0 0' }}>
            {demos.length} demo{demos.length !== 1 ? 's' : ''} · {demos.filter(d => d.published).length} publicerade
          </p>
        </div>
        <button onClick={() => setShowNew(true)} style={{
          padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 10,
          border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', flexShrink: 0,
        }}>
          + Ny demo
        </button>
      </div>

      {demos.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 16,
        }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>🖥️</div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>Inga demosidor ännu</div>
          <div style={{ fontSize: 14, marginTop: 6, marginBottom: 20 }}>Bygg en hemsida-demo och dela länken med din prospect</div>
          <button onClick={() => setShowNew(true)} style={{
            padding: '10px 22px', fontSize: 14, fontWeight: 600, borderRadius: 9,
            border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer',
          }}>Skapa din första demo</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {demos.map(d => (
            <div key={d.id} style={{
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: `${TEMPLATE_COLORS[d.template]}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                {templateEmoji(d.template)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{d.name}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{TEMPLATE_LABELS[d.template]}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 50,
                    background: d.published ? '#dcfce7' : 'var(--bg-subtle)',
                    color: d.published ? '#15803d' : 'var(--text-faint)',
                    border: `1px solid ${d.published ? '#86efac' : 'var(--border)'}`,
                  }}>
                    {d.published ? 'Publicerad' : 'Utkast'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                <a
                  href={`/demos/preview/${d.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '6px 12px', fontSize: 12, fontWeight: 500,
                    border: '1px solid var(--border)', borderRadius: 7,
                    textDecoration: 'none', color: 'var(--text-muted)', background: 'var(--bg-subtle)',
                  }}
                >↗ Preview</a>
                <button onClick={() => router.push(`/demos/${d.id}/edit`)} style={{
                  padding: '6px 14px', fontSize: 12, fontWeight: 600,
                  border: 'none', borderRadius: 7, background: 'var(--accent)',
                  color: '#fff', cursor: 'pointer',
                }}>Redigera</button>
                <button onClick={() => del(d.id)} style={{
                  background: 'none', border: '1px solid var(--red-border)', borderRadius: 7,
                  padding: '6px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--red)',
                }}>Ta bort</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && <NewDemoModal onClose={() => setShowNew(false)} onCreate={d => setDemos(ds => [d, ...ds])} />}
    </div>
  );
}
