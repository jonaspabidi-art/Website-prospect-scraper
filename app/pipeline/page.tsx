'use client';

import { useState, useEffect } from 'react';
import ContactModal from '../components/ContactModal';

type Prospect = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  orgNumber: string | null;
  employees: number | null;
  revenue: number | null;
  googleRating: number | null;
  priorityScore: number;
  status: string;
  source: string | null;
  createdAt: string;
  job: { industry: string; city: string };
};

const STAGES = ['Ny', 'Ringd', 'Intresserad', 'Kund', 'Nej'];

const STAGE_STYLE: Record<string, { border: string; header: string; headerText: string }> = {
  Ny:          { border: '#d1d5db', header: '#f3f4f6', headerText: '#374151' },
  Ringd:       { border: '#bfdbfe', header: '#eff6ff', headerText: '#1d4ed8' },
  Intresserad: { border: '#bbf7d0', header: '#f0fdf4', headerText: '#15803d' },
  Kund:        { border: '#e9d5ff', header: '#faf5ff', headerText: '#7c3aed' },
  Nej:         { border: '#fecaca', header: '#fef2f2', headerText: '#b91c1c' },
};

function scorePillStyle(score: number) {
  if (score >= 70) return { bg: 'var(--good-bg)', color: 'var(--good)' };
  if (score >= 40) return { bg: 'var(--warn-bg)', color: 'var(--warn)' };
  return { bg: 'var(--bad-bg)', color: 'var(--bad)' };
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default function PipelinePage() {
  const [all, setAll] = useState<Prospect[]>([]);
  const [modal, setModal] = useState<Prospect | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAll = async () => {
    const res = await fetch('/api/prospects?page=1&limit=200');
    const data = await res.json();
    setAll(data.prospects ?? []);
  };

  useEffect(() => { fetchAll(); }, []);

  const moveTo = async (id: string, status: string) => {
    setUpdatingId(id);
    await fetch(`/api/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setUpdatingId(null);
    fetchAll();
  };

  const byStage = (stage: string) => all.filter(p => p.status === stage);

  return (
    <div style={{ padding: '40px 32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 28, margin: 0 }}>Pipeline</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '4px 0 0' }}>Håll koll på din prospektering — {all.length} totalt</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, flex: 1, minHeight: 0, overflowX: 'auto' }}>
        {STAGES.map(stage => {
          const cards = byStage(stage);
          const st = STAGE_STYLE[stage];
          return (
            <div key={stage} style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
              <div style={{ background: st.header, border: `1.5px solid ${st.border}`, borderRadius: '10px 10px 0 0', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: st.headerText }}>{stage}</span>
                <span style={{ background: 'rgba(0,0,0,0.08)', color: st.headerText, fontSize: 11, padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>{cards.length}</span>
              </div>
              <div style={{ flex: 1, border: `1.5px solid ${st.border}`, borderTop: 'none', borderRadius: '0 0 10px 10px', padding: 8, display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--bg-card)', overflowY: 'auto', maxHeight: 'calc(100vh - 240px)' }}>
                {cards.map(p => {
                  const score = scorePillStyle(p.priorityScore);
                  const days = daysSince(p.createdAt);
                  const followUp = days >= 3 && stage !== 'Kund' && stage !== 'Nej';
                  return (
                    <div key={p.id} style={{ background: '#fff', border: '1.5px solid var(--border-soft)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 14, flex: 1, marginRight: 6, lineHeight: 1.3 }}>{p.name}</div>
                        <span style={{ background: score.bg, color: score.color, fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 12, flexShrink: 0 }}>{p.priorityScore}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{p.city || p.job.city}</div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{days === 0 ? 'idag' : `${days}d sedan`}</span>
                          {followUp && <span style={{ background: 'var(--bad-bg)', color: 'var(--bad)', fontSize: 10, padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>Följ upp</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => setModal(p)}
                            style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1.5px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', color: 'var(--ink-soft)' }}
                          >Kontakt</button>
                          <select
                            value={p.status}
                            disabled={updatingId === p.id}
                            onChange={e => moveTo(p.id, e.target.value)}
                            style={{ fontSize: 11, padding: '3px 6px', borderRadius: 6, border: '1.5px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', color: 'var(--ink-soft)', outline: 'none' }}
                          >
                            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {cards.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--font-hand)' }}>— tomt —</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal && <ContactModal prospect={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
