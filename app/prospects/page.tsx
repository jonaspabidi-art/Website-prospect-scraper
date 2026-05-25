'use client';

import { useState, useEffect, useCallback } from 'react';
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
  job: { industry: string; city: string };
};

const STATUSES = ['Ny', 'Ringd', 'Intresserad', 'Kund', 'Nej'];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Ny:          { bg: '#f3f4f6', color: '#374151' },
  Ringd:       { bg: 'var(--accent-bg)', color: 'var(--accent)' },
  Intresserad: { bg: 'var(--good-bg)', color: 'var(--good)' },
  Kund:        { bg: '#f3e8ff', color: '#7c3aed' },
  Nej:         { bg: 'var(--bad-bg)', color: 'var(--bad)' },
};

function scorePillStyle(score: number) {
  if (score >= 70) return { bg: 'var(--good-bg)', color: 'var(--good)' };
  if (score >= 40) return { bg: 'var(--warn-bg)', color: 'var(--warn)' };
  return { bg: 'var(--bad-bg)', color: 'var(--bad)' };
}

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState<Prospect | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProspects = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/prospects?${params}`);
    const data = await res.json();
    setProspects(data.prospects ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
  }, [page, search, statusFilter]);

  useEffect(() => { fetchProspects(); }, [fetchProspects]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    await fetch(`/api/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setUpdatingId(null);
    fetchProspects();
  };

  return (
    <div style={{ padding: '40px 32px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 28, margin: 0 }}>Prospects</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: '4px 0 0' }}>{total} företag totalt</p>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1.5px dashed var(--border)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Sök på namn…"
          style={{ flex: 1, minWidth: 200, border: '1.5px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 14, background: 'var(--bg)', color: 'var(--ink)', outline: 'none' }}
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 14, background: 'var(--bg)', color: statusFilter ? 'var(--ink)' : 'var(--muted)', outline: 'none' }}
        >
          <option value="">Status: alla</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid var(--border)', background: 'var(--bg)' }}>
              {['Namn', 'Stad', 'Anst.', 'Score', 'Status', 'Åtgärder'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prospects.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>Inga prospects hittades</td></tr>
            )}
            {prospects.map((p, i) => {
              const score = scorePillStyle(p.priorityScore);
              const st = STATUS_STYLE[p.status] ?? { bg: '#eee', color: '#666' };
              return (
                <tr key={p.id} style={{ borderBottom: i < prospects.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{p.job.industry}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--ink-soft)' }}>{p.city || p.job.city}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--ink-soft)' }}>{p.employees ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: score.bg, color: score.color, fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{p.priorityScore}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <select
                      value={p.status}
                      disabled={updatingId === p.id}
                      onChange={e => updateStatus(p.id, e.target.value)}
                      style={{ background: st.bg, color: st.color, border: 'none', borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => setModal(p)}
                      style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer', color: 'var(--ink-soft)' }}
                    >
                      Kontakt
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
            Visar {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} av {total}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  width: 32, height: 32, borderRadius: 7, border: '1.5px solid var(--border)',
                  background: p === page ? 'var(--accent)' : 'var(--bg-card)',
                  color: p === page ? '#fff' : 'var(--ink)',
                  fontSize: 13, cursor: 'pointer', fontWeight: p === page ? 600 : 400,
                }}
              >{p}</button>
            ))}
          </div>
        </div>
      )}

      {modal && <ContactModal prospect={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
