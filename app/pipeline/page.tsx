'use client';

import { useState, useEffect, useMemo } from 'react';
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
  inPipeline: boolean;
  source: string | null;
  websiteUrl: string | null;
  notes: string | null;
  createdAt: string;
  job: { industry: string; city: string };
};

const STAGES = ['Ny', 'Ringd', 'Intresserad', 'Kund', 'Nej'];

const NEXT_STAGE: Record<string, string | null> = {
  Ny: 'Ringd',
  Ringd: 'Intresserad',
  Intresserad: 'Kund',
  Kund: null,
  Nej: 'Ny',
};

function scoreBadge(score: number) {
  if (score >= 70) return { bg: 'var(--green-soft)', color: 'var(--green)', border: 'var(--green-border)' };
  if (score >= 40) return { bg: 'var(--yellow-soft)', color: 'var(--yellow)', border: 'var(--yellow-border)' };
  return { bg: 'var(--red-soft)', color: 'var(--red)', border: 'var(--red-border)' };
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default function PipelinePage() {
  const [all, setAll] = useState<Prospect[]>([]);
  const [modal, setModal] = useState<Prospect | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showRejected, setShowRejected] = useState(false);

  const fetchAll = async () => {
    const res = await fetch('/api/prospects?pipeline=true&limit=200');
    const data = await res.json();
    setAll(data.prospects ?? []);
  };

  useEffect(() => { fetchAll(); }, []);

  const moveTo = async (id: string, status: string) => {
    setAll(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    if (modal?.id === id) setModal(prev => prev ? { ...prev, status } : prev);
    await fetch(`/api/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  };

  const filtered = useMemo(() => {
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.job.industry.toLowerCase().includes(q) ||
      (p.city || p.job.city || '').toLowerCase().includes(q)
    );
  }, [all, search]);

  const visibleStages = showRejected ? STAGES : STAGES.filter(s => s !== 'Nej');
  const byStage = (stage: string) => filtered.filter(p => p.status === stage);
  const rejectedCount = all.filter(p => p.status === 'Nej').length;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDragging(id);
  };
  const handleDragEnd = () => { setDragging(null); setDragOver(null); };
  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const prospect = all.find(p => p.id === id);
    if (prospect && prospect.status !== stage) moveTo(id, stage);
    setDragOver(null);
  };

  return (
    <div className="pipeline-wrap" style={{ padding: '48px 32px 80px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', margin: 0, lineHeight: 1.15 }}>Pipeline</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: '6px 0 0', letterSpacing: '-0.005em' }}>
          {all.length} prospects totalt · dra kort för att flytta
        </p>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="4.5"/><path d="M11 11l3 3"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Sök namn, bransch, stad…"
            style={{
              width: '100%', height: 36, padding: '0 12px 0 32px',
              border: '1px solid var(--border)', borderRadius: 'var(--r-pill)',
              background: 'var(--bg)', fontSize: 13, color: 'var(--text)', outline: 'none',
            }}
          />
        </div>
        <button
          onClick={() => setShowRejected(v => !v)}
          style={{
            height: 36, padding: '0 14px',
            border: `1px solid ${showRejected ? 'var(--red-border)' : 'var(--border)'}`,
            borderRadius: 'var(--r-pill)',
            background: showRejected ? 'var(--red-soft)' : 'var(--bg)',
            color: showRejected ? 'var(--red)' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          {showRejected ? 'Göm avvisade' : `Visa avvisade${rejectedCount > 0 ? ` (${rejectedCount})` : ''}`}
        </button>
      </div>

      <div
        className="pipeline-columns"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${visibleStages.length}, minmax(0, 1fr))`,
          gap: 14, flex: 1, alignItems: 'start', overflowX: 'auto',
        }}
      >
        {visibleStages.map(stage => {
          const cards = byStage(stage);
          const isOver = dragOver === stage;
          return (
            <div
              key={stage}
              onDragOver={e => { e.preventDefault(); setDragOver(stage); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null); }}
              onDrop={e => handleDrop(e, stage)}
              style={{
                background: isOver ? 'var(--accent-soft)' : 'var(--bg-subtle)',
                border: `1px solid ${isOver ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)',
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                minHeight: 480,
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              {/* Column header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '2px 4px 8px',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{stage}</span>
                <span style={{
                  fontSize: 12, color: 'var(--text-muted)',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  padding: '1px 8px', borderRadius: 'var(--r-pill)', fontWeight: 500,
                }}>
                  {cards.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                {cards.length === 0 && (
                  <div style={{
                    border: '1px dashed var(--border-strong)', borderRadius: 'var(--r-sm)',
                    padding: '16px 12px', textAlign: 'center',
                    color: 'var(--text-faint)', fontSize: 12,
                  }}>
                    Tomt
                  </div>
                )}
                {cards.map(p => {
                  const sc = scoreBadge(p.priorityScore);
                  const days = daysSince(p.createdAt);
                  const followUp = days >= 3 && stage !== 'Kund' && stage !== 'Nej';
                  const isDragging = dragging === p.id;
                  const nextStage = NEXT_STAGE[stage];
                  return (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={e => handleDragStart(e, p.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setModal(p)}
                      style={{
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--r-sm)',
                        padding: 10,
                        boxShadow: 'var(--shadow-sm)',
                        cursor: 'grab',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 5,
                        opacity: isDragging ? 0.4 : 1,
                        transition: 'box-shadow 0.15s, transform 0.15s, border-color 0.15s, opacity 0.15s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                        (e.currentTarget as HTMLElement).style.transform = '';
                      }}
                    >
                      {/* Name + score */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                          {p.name}
                        </span>
                        <span style={{
                          background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                          fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 'var(--r-pill)',
                          flexShrink: 0, fontVariantNumeric: 'tabular-nums',
                        }}>
                          {p.priorityScore}
                        </span>
                      </div>

                      {/* Phone + website */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        {p.phone ? (
                          <a
                            href={`tel:${p.phone}`}
                            onClick={e => e.stopPropagation()}
                            style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {p.phone}
                          </a>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>—</span>
                        )}
                        {p.websiteUrl && (
                          <a
                            href={p.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}
                          >
                            Hemsida ↗
                          </a>
                        )}
                      </div>

                      {/* Industry · city + age/follow-up */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {p.job.industry} · {p.city || p.job.city}
                        </span>
                        {followUp ? (
                          <span style={{
                            fontSize: 10, fontWeight: 600,
                            color: 'var(--red)', background: 'var(--red-soft)',
                            border: '1px solid var(--red-border)',
                            padding: '1px 6px', borderRadius: 'var(--r-pill)', flexShrink: 0,
                          }}>
                            Följ upp
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0 }}>
                            {days === 0 ? 'idag' : `${days} d`}
                          </span>
                        )}
                      </div>

                      {/* Quick actions */}
                      <div
                        onClick={e => e.stopPropagation()}
                        style={{ display: 'flex', gap: 5, marginTop: 1, paddingTop: 7, borderTop: '1px solid var(--border)' }}
                      >
                        {stage === 'Nej' ? (
                          <button onClick={() => moveTo(p.id, 'Ny')} style={quickBtn}>
                            ↺ Återaktivera
                          </button>
                        ) : (
                          <>
                            {nextStage && (
                              <button onClick={() => moveTo(p.id, nextStage)} style={quickBtn}>
                                {stage === 'Ny' ? '✓ Ringd' : stage === 'Ringd' ? '→ Intresserad' : '★ Kund'}
                              </button>
                            )}
                            <button
                              onClick={() => moveTo(p.id, 'Nej')}
                              style={{ ...quickBtn, marginLeft: 'auto', color: 'var(--red)', borderColor: 'var(--red-border)', background: 'var(--red-soft)' }}
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <ContactModal
          prospect={modal}
          onClose={() => setModal(null)}
          onRefresh={fetchAll}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const quickBtn: React.CSSProperties = {
  fontSize: 11, fontWeight: 500,
  padding: '2px 8px',
  borderRadius: 'var(--r-pill)',
  border: '1px solid var(--border)',
  background: 'var(--bg-muted)',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};
