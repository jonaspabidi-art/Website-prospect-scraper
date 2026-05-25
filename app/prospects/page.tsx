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

function scoreBadge(score: number) {
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

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState<Prospect | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [industries, setIndustries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [industryFilter, setIndustryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProspects = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (industryFilter) params.set('bransch', industryFilter);
    if (cityFilter) params.set('stad', cityFilter);
    const res = await fetch(`/api/prospects?${params}`);
    const data = await res.json();
    setProspects(data.prospects ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
  }, [page, search, statusFilter, industryFilter, cityFilter]);

  useEffect(() => { fetchProspects(); }, [fetchProspects]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    await fetch(`/api/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setUpdatingId(null);
  };

  useEffect(() => {
    fetch('/api/filter-options').then(r => r.json()).then(d => {
      setIndustries(d.industries ?? []);
      setCities(d.cities ?? []);
    });
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="page-wrap" style={{ padding: '48px 56px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 36, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', margin: 0, lineHeight: 1.15 }}>Prospects</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: '6px 0 0', letterSpacing: '-0.005em' }}>
            {total} företag · klicka en rad för att se detaljer
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: 14, flexWrap: 'wrap',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        background: 'var(--bg-subtle)',
        marginBottom: 20,
      }}>
        {industries.length > 0 && (
          <select value={industryFilter} onChange={e => { setIndustryFilter(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="">Bransch: alla</option>
            {industries.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        )}
        {cities.length > 0 && (
          <select value={cityFilter} onChange={e => { setCityFilter(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="">Stad: alla</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="">Status: alla</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="filter-search" style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }}>
            <circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/>
          </svg>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Sök på namn…"
            style={{ ...inputStyle, paddingLeft: 36 }}
          />
        </div>
      </div>

      {/* Table (desktop) */}
      <div className="desktop-table" style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        background: 'var(--bg)',
        boxShadow: 'var(--shadow-md)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 32 }}></th>
              {['Namn', 'Stad', 'Anst.', 'Score', 'Status', 'Åtgärder'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prospects.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                  <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>Inga prospects matchar dina filter</div>
                  <div style={{ fontSize: 13 }}>Prova att rensa filtren eller justera söktermen.</div>
                </td>
              </tr>
            )}
            {prospects.map((p) => {
              const sc = scoreBadge(p.priorityScore);
              const sp = statusPill(p.status);
              const isOpen = expanded.has(p.id);
              return (
                <>
                  <tr
                    key={p.id}
                    onClick={() => toggleExpand(p.id)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <svg
                        width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ color: 'var(--text-faint)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.18s', display: 'block' }}
                      >
                        <path d="m5 3 4 4-4 4"/>
                      </svg>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{p.job.industry}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', verticalAlign: 'middle' }}>{p.city || p.job.city}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', verticalAlign: 'middle' }}>{p.employees ?? '—'}</td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <span style={{
                        background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                        fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--r-pill)',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {p.priorityScore}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <span style={{
                        background: sp.bg, color: sp.color, border: `1px solid ${sp.border}`,
                        fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 'var(--r-pill)',
                        whiteSpace: 'nowrap',
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                        <StatusBtn
                          label="Ringd"
                          active={p.status === 'Ringd'}
                          disabled={updatingId === p.id}
                          color="var(--accent)"
                          activeBg="var(--accent-soft)"
                          activeBorder="rgba(26,86,219,0.18)"
                          activeColor="var(--accent-text)"
                          onClick={() => updateStatus(p.id, p.status === 'Ringd' ? 'Ny' : 'Ringd')}
                        />
                        <StatusBtn
                          label="Intresserad"
                          active={p.status === 'Intresserad'}
                          disabled={updatingId === p.id}
                          color="var(--green)"
                          activeBg="var(--green-soft)"
                          activeBorder="var(--green-border)"
                          activeColor="var(--green)"
                          onClick={() => updateStatus(p.id, p.status === 'Intresserad' ? 'Ny' : 'Intresserad')}
                        />
                        <StatusBtn
                          label="Nej"
                          active={p.status === 'Nej'}
                          disabled={updatingId === p.id}
                          color="var(--red)"
                          activeBg="var(--red-soft)"
                          activeBorder="var(--red-border)"
                          activeColor="var(--red)"
                          onClick={() => updateStatus(p.id, p.status === 'Nej' ? 'Ny' : 'Nej')}
                        />
                        <button onClick={() => setModal(p)} style={actionBtnStyle}>Kontakt</button>
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${p.id}-expand`} style={{ background: 'var(--bg-subtle)' }}>
                      <td></td>
                      <td colSpan={6}>
                        <div style={{ padding: '20px 0 24px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, paddingRight: 24 }}>
                            <div>
                              <h4 style={detailHeadStyle}>Företagsinfo</h4>
                              <dl>
                                <DetailRow label="Org.nr" value={p.orgNumber || '—'} />
                                <DetailRow label="Bransch" value={p.job.industry} />
                                <DetailRow label="Adress" value={p.address || '—'} />
                              </dl>
                            </div>
                            <div>
                              <h4 style={detailHeadStyle}>Ekonomi</h4>
                              <dl>
                                <DetailRow label="Omsättning" value={p.revenue ? `${(p.revenue / 1000000).toFixed(1)} MSEK` : '—'} />
                                <DetailRow label="Anställda" value={p.employees != null ? String(p.employees) : '—'} />
                                <DetailRow label="Google" value={p.googleRating ? `${p.googleRating} ★` : '—'} />
                              </dl>
                            </div>
                            <div>
                              <h4 style={detailHeadStyle}>Kontakt</h4>
                              <dl>
                                <DetailRow label="Telefon" value={p.phone || '—'} link={p.phone ? `tel:${p.phone}` : undefined} />
                                <DetailRow label="Källa" value={p.source || '—'} />
                              </dl>
                              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                <button onClick={() => setModal(p)} style={{ ...actionBtnStyle, background: 'var(--accent)', color: '#fff', border: 'none' }}>
                                  Öppna kontakt
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) */}
      <div className="mobile-cards">
        {prospects.length === 0 && (
          <div style={{
            border: '1px dashed var(--border-strong)',
            borderRadius: 'var(--r-md)',
            padding: '40px 24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            background: 'var(--bg-subtle)',
          }}>
            <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>Inga prospects matchar dina filter</div>
            <div style={{ fontSize: 13 }}>Prova att rensa filtren.</div>
          </div>
        )}
        {prospects.map(p => {
          const sc = scoreBadge(p.priorityScore);
          const sp = statusPill(p.status);
          return (
            <div
              key={p.id}
              onClick={() => setModal(p)}
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                padding: '14px 16px',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>{p.name}</span>
                <span style={{
                  background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                  fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--r-pill)', flexShrink: 0,
                }}>
                  {p.priorityScore}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                {p.job.industry} · {p.city || p.job.city}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                  <StatusBtn
                    label="Ringd"
                    active={p.status === 'Ringd'}
                    disabled={updatingId === p.id}
                    color="var(--accent)"
                    activeBg="var(--accent-soft)"
                    activeBorder="rgba(26,86,219,0.18)"
                    activeColor="var(--accent-text)"
                    onClick={() => updateStatus(p.id, p.status === 'Ringd' ? 'Ny' : 'Ringd')}
                  />
                  <StatusBtn
                    label="Intresserad"
                    active={p.status === 'Intresserad'}
                    disabled={updatingId === p.id}
                    color="var(--green)"
                    activeBg="var(--green-soft)"
                    activeBorder="var(--green-border)"
                    activeColor="var(--green)"
                    onClick={() => updateStatus(p.id, p.status === 'Intresserad' ? 'Ny' : 'Intresserad')}
                  />
                  <StatusBtn
                    label="Nej"
                    active={p.status === 'Nej'}
                    disabled={updatingId === p.id}
                    color="var(--red)"
                    activeBg="var(--red-soft)"
                    activeBorder="var(--red-border)"
                    activeColor="var(--red)"
                    onClick={() => updateStatus(p.id, p.status === 'Nej' ? 'Ny' : 'Nej')}
                  />
                </div>
                <span style={{
                  background: sp.bg, color: sp.color, border: `1px solid ${sp.border}`,
                  fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 'var(--r-pill)',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {p.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Visar {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} av {total}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pageBtnStyle(false)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
              <button key={p} onClick={() => setPage(p)} style={pageBtnStyle(p === page)}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pageBtnStyle(false)}>›</button>
          </div>
        </div>
      )}

      {modal && (
        <ContactModal
          prospect={modal}
          onClose={() => setModal(null)}
          onRefresh={fetchProspects}
        />
      )}
    </div>
  );
}

function DetailRow({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12, padding: '6px 0', fontSize: 13 }}>
      <dt style={{ color: 'var(--text-muted)' }}>{label}</dt>
      <dd style={{ margin: 0, fontWeight: 500 }}>
        {link ? <a href={link} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{value}</a> : value}
      </dd>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  background: 'var(--bg-subtle)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
};

const detailHeadStyle: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-muted)',
  margin: '0 0 12px',
  fontWeight: 600,
  paddingBottom: 8,
  borderBottom: '1px solid var(--border)',
};

const inputStyle: React.CSSProperties = {
  height: 42,
  padding: '0 14px',
  border: '1px solid var(--border)',
  borderRadius: 10,
  background: 'var(--bg)',
  fontSize: 14,
  color: 'var(--text)',
  outline: 'none',
  width: '100%',
  letterSpacing: '-0.005em',
};

const selectStyle: React.CSSProperties = {
  height: 42,
  padding: '0 32px 0 14px',
  border: '1px solid var(--border)',
  borderRadius: 10,
  background: 'var(--bg)',
  fontSize: 14,
  color: 'var(--text)',
  outline: 'none',
  cursor: 'pointer',
  minWidth: 160,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
};

const actionBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '5px 12px',
  borderRadius: 'var(--r-pill)',
  fontSize: 13, fontWeight: 500,
  border: '1px solid var(--border)',
  background: 'var(--bg-muted)',
  color: 'var(--text)',
  cursor: 'pointer',
  transition: 'background 0.15s',
  whiteSpace: 'nowrap',
};

const pageBtnStyle = (active: boolean): React.CSSProperties => ({
  minWidth: 32, height: 32,
  padding: '0 10px',
  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
  background: active ? 'var(--accent)' : 'var(--bg)',
  color: active ? '#fff' : 'var(--text)',
  borderRadius: 'var(--r-sm)',
  fontSize: 13, fontWeight: active ? 600 : 400,
  cursor: 'pointer',
  transition: 'background 0.12s, border-color 0.12s',
});

function StatusBtn({ label, active, disabled, activeBg, activeBorder, activeColor, onClick }: {
  label: string;
  active: boolean;
  disabled: boolean;
  color: string;
  activeBg: string;
  activeBorder: string;
  activeColor: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={active ? `Klicka för att ångra (sätt tillbaka till Ny)` : `Markera som ${label}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 10px',
        borderRadius: 'var(--r-pill)',
        fontSize: 12, fontWeight: 500,
        border: `1px solid ${active ? activeBorder : 'var(--border)'}`,
        background: active ? activeBg : 'var(--bg-muted)',
        color: active ? activeColor : 'var(--text-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {active && (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6l3 3 5-5"/>
        </svg>
      )}
      {label}
    </button>
  );
}
