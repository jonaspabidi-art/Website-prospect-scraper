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

  const fetchAll = async () => {
    const res = await fetch('/api/prospects?page=1&limit=200');
    const data = await res.json();
    setAll(data.prospects ?? []);
  };

  useEffect(() => { fetchAll(); }, []);

  const moveTo = async (id: string, status: string) => {
    setAll(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    await fetch(`/api/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  };

  const byStage = (stage: string) => all.filter(p => p.status === stage);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDragging(id);
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const prospect = all.find(p => p.id === id);
    if (prospect && prospect.status !== stage) {
      moveTo(id, stage);
    }
    setDragOver(null);
  };

  return (
    <div className="pipeline-wrap" style={{ padding: '48px 32px 80px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', margin: 0, lineHeight: 1.15 }}>Pipeline</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: '6px 0 0', letterSpacing: '-0.005em' }}>
          Dra kort mellan kolumner för att uppdatera status. {all.length} prospects totalt.
        </p>
      </div>

      <div className="pipeline-columns" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 16, flex: 1, alignItems: 'start', overflowX: 'auto' }}>
        {STAGES.map(stage => {
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
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                minHeight: 480,
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '4px 6px 10px',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{stage}</span>
                <span style={{
                  fontSize: 12, color: 'var(--text-muted)',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  padding: '1px 8px',
                  borderRadius: 'var(--r-pill)',
                  fontWeight: 500,
                }}>
                  {cards.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {cards.length === 0 && (
                  <div style={{
                    border: '1px dashed var(--border-strong)',
                    borderRadius: 'var(--r-sm)',
                    padding: '18px 12px',
                    textAlign: 'center',
                    color: 'var(--text-faint)',
                    fontSize: 12,
                  }}>
                    Tomt
                  </div>
                )}
                {cards.map(p => {
                  const sc = scoreBadge(p.priorityScore);
                  const days = daysSince(p.createdAt);
                  const followUp = days >= 3 && stage !== 'Kund' && stage !== 'Nej';
                  const isDragging = dragging === p.id;
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
                        padding: 12,
                        boxShadow: 'var(--shadow-sm)',
                        cursor: 'grab',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
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
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                          {p.name}
                        </span>
                        <span style={{
                          background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                          fontSize: 12, fontWeight: 600, padding: '2px 6px', borderRadius: 'var(--r-pill)',
                          flexShrink: 0, fontVariantNumeric: 'tabular-nums',
                        }}>
                          {p.priorityScore}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                        <span>{p.city || p.job.city}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                        <span>{days === 0 ? 'idag' : `${days} d sedan`}</span>
                        {followUp && (
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: 'var(--red)', background: 'var(--red-soft)',
                            border: '1px solid var(--red-border)',
                            padding: '1px 7px', borderRadius: 'var(--r-pill)',
                          }}>
                            Följ upp
                          </span>
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
    </div>
  );
}
