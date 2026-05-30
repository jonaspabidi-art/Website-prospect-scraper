'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const INDUSTRIES = [
  'Däckverkstad', 'Bilverkstad', 'Bilreparation', 'Lackerare',
  'Målare', 'Målerifirma', 'Elektriker', 'VVS', 'Rörmokare',
  'Plåtslagare', 'Snickare', 'Byggfirma', 'Glasmästare', 'Låssmed',
  'Trädgård', 'Trädgårdsanläggning', 'Städfirma',
  'Frisör', 'Frisörssalong', 'Skönhetssalong', 'Solarium',
  'Nagelstudio', 'Hudvård', 'Massage', 'Fotvård',
  'Hundvård', 'Djurklippning', 'Veterinär',
  'Restaurang', 'Café', 'Pizzeria', 'Konditori', 'Bageri',
  'Flyttfirma', 'Transportfirma', 'Åkeri',
  'Redovisningsbyrå', 'Bokföring',
  'Tandläkare', 'Optiker', 'Fysioterapeut',
  'Blomsterhandel', 'Sportaffär',
];

type Job = {
  id: string;
  industry: string;
  city: string;
  area: string | null;
  maxResults: number;
  mode: 'no_website' | 'weak_website';
  status: string;
  progress: string | null;
  createdAt: string;
  completedAt: string | null;
  _count: { prospects: number };
};

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  pending:   { bg: 'var(--yellow-soft)', color: 'var(--yellow)', border: 'var(--yellow-border)', label: 'Väntar' },
  running:   { bg: 'var(--accent-soft)', color: 'var(--accent)', border: 'rgba(26,86,219,0.18)', label: 'Kör...' },
  completed: { bg: 'var(--green-soft)', color: 'var(--green)', border: 'var(--green-border)', label: 'Klar' },
  failed:    { bg: 'var(--red-soft)', color: 'var(--red)', border: 'var(--red-border)', label: 'Misslyckades' },
};

function Pill({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: '#f0f0f3', color: '#4b5563', border: 'rgba(0,0,0,0.06)', label: status };
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 'var(--r-pill)',
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

export default function SokPage() {
  const [industry, setIndustry] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [maxResults, setMaxResults] = useState(20);
  const [mode, setMode] = useState<'no_website' | 'weak_website'>('no_website');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchJobs = async () => {
    const res = await fetch('/api/jobs');
    const data = await res.json();
    setJobs(data);
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industry, city, area: area || undefined, maxResults, mode }),
    });
    const job = await res.json();
    setActiveJobId(job.id);
    setIndustry('');
    setCity('');
    setArea('');
    setLoading(false);
    fetchJobs();
  };

  const deleteJob = async (e: React.MouseEvent, jobId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Ta bort sökning och alla dess prospects?')) return;
    setDeletingId(jobId);
    await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
    setDeletingId(null);
    if (activeJobId === jobId) setActiveJobId(null);
    fetchJobs();
  };

  const rerun = (e: React.MouseEvent, job: Job) => {
    e.preventDefault();
    e.stopPropagation();
    setIndustry(job.industry);
    setCity(job.city);
    setArea(job.area ?? '');
    setMaxResults(job.maxResults);
    setMode(job.mode ?? 'no_website');
    setActiveJobId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeJob = jobs.find(j => j.id === activeJobId);
  const lastProgressLine = activeJob?.progress?.split('\n').filter(Boolean).slice(-1)[0] ?? '';

  return (
    <div className="page-wrap" style={{ maxWidth: 760, margin: '0 auto', padding: '48px 56px 80px' }}>
      <header style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', margin: 0, lineHeight: 1.15 }}>Sök prospects</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: '6px 0 0', letterSpacing: '-0.005em' }}>
          Skrapa hitta.se efter företag som matchar dina kriterier.
        </p>
      </header>

      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-md)',
        padding: 24,
        marginBottom: 20,
      }}>
        <form onSubmit={handleSubmit}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['no_website', 'weak_website'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--r-pill)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: `1px solid ${mode === m ? 'var(--accent)' : 'var(--border)'}`,
                  background: mode === m ? 'var(--accent-soft)' : 'var(--bg-muted)',
                  color: mode === m ? 'var(--accent-text)' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {m === 'no_website' ? 'Utan hemsida' : 'Svag hemsida'}
              </button>
            ))}
          </div>
          <div className="sok-form-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 0.7fr auto', gap: 16, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Bransch</label>
              <input
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                list="industries-list"
                placeholder="t.ex. däckverkstad"
                required
                style={inputStyle}
              />
              <datalist id="industries-list">
                {INDUSTRIES.map(i => <option key={i} value={i} />)}
              </datalist>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Stad</label>
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="t.ex. Göteborg"
                required
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                Område <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(valfritt)</span>
              </label>
              <input
                value={area}
                onChange={e => setArea(e.target.value)}
                placeholder="t.ex. Majorna"
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Max antal</label>
              <input
                type="number"
                value={maxResults}
                onChange={e => setMaxResults(Number(e.target.value))}
                min={5} max={50}
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                height: 42,
                background: loading ? 'var(--accent-hover)' : 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--r-pill)',
                padding: '0 20px',
                fontSize: 14,
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                opacity: loading ? 0.7 : 1,
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Startar…' : 'Hitta prospects'}
              {!loading && (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8h10M9 4l4 4-4 4"/>
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>

      {activeJob && (activeJob.status === 'running' || activeJob.status === 'pending') && (
        <div style={{
          padding: '16px 20px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          background: 'var(--bg-subtle)',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 14, height: 14, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
              <span style={{ fontWeight: 500 }}>Scrapar {activeJob.industry} i {activeJob.area ? `${activeJob.area}, ${activeJob.city}` : activeJob.city}…</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>uppdateras var 4:e sek</span>
          </div>
          <div style={{ height: 6, background: 'var(--bg)', borderRadius: 'var(--r-pill)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 'var(--r-pill)', width: activeJob.status === 'running' ? '60%' : '15%', transition: 'width 1s' }} />
          </div>
          {lastProgressLine && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{lastProgressLine}</div>
          )}
        </div>
      )}

      {activeJob?.status === 'completed' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          marginBottom: 20,
          padding: '16px 20px',
          background: 'var(--green-soft)',
          border: `1px solid var(--green-border)`,
          borderRadius: 'var(--r-md)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--green)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8l3.5 3.5L13 5"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Lade till {activeJob._count.prospects} nya prospects</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{activeJob.industry} · {activeJob.area ? `${activeJob.area}, ${activeJob.city}` : activeJob.city}</div>
          </div>
          <Link href="/prospects" style={{
            background: 'var(--green)', color: '#fff', textDecoration: 'none',
            padding: '5px 14px', borderRadius: 'var(--r-pill)', fontSize: 13, fontWeight: 500,
          }}>
            Visa lista
          </Link>
        </div>
      )}

      {activeJob?.status === 'failed' && (
        <div style={{
          background: 'var(--red-soft)', border: `1px solid var(--red-border)`,
          borderRadius: 'var(--r-md)', padding: '16px 20px', marginBottom: 20,
        }}>
          <div style={{ fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>Scraping misslyckades</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{activeJob.progress?.split('\n').slice(-1)[0]}</div>
        </div>
      )}

      {!activeJobId && jobs.length === 0 && (
        <div style={{
          border: '1px dashed var(--border-strong)',
          borderRadius: 'var(--r-md)',
          padding: '48px 32px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          background: 'var(--bg-subtle)',
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Inga sökningar än</div>
          <p style={{ margin: 0, fontSize: 14 }}>Fyll i fälten ovan och kör en sökning.</p>
        </div>
      )}

      {jobs.length > 0 && (
        <div>
          <h2 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>
            Senaste körningar
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {jobs.map(job => (
              <div key={job.id} style={{ position: 'relative' }}>
                <Link
                  href={`/jobs/${job.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    padding: '14px 18px',
                    paddingRight: 96,
                    textDecoration: 'none',
                    color: 'var(--text)',
                    boxShadow: 'var(--shadow-sm)',
                    opacity: deletingId === job.id ? 0.4 : 1,
                    transition: 'box-shadow 0.15s, opacity 0.15s',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{job.industry} — {job.area ? `${job.area}, ${job.city}` : job.city}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 500, padding: '1px 7px',
                        borderRadius: 'var(--r-pill)',
                        background: job.mode === 'weak_website' ? 'var(--yellow-soft)' : 'var(--bg-subtle)',
                        color: job.mode === 'weak_website' ? 'var(--yellow)' : 'var(--text-faint)',
                        border: `1px solid ${job.mode === 'weak_website' ? 'var(--yellow-border)' : 'var(--border)'}`,
                      }}>
                        {job.mode === 'weak_website' ? 'Svag hemsida' : 'Utan hemsida'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(job.createdAt).toLocaleString('sv-SE')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {job.status === 'completed' && (
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{job._count.prospects} prospects</span>
                    )}
                    <Pill status={job.status} />
                  </div>
                </Link>

                {/* Action buttons — float over the right edge */}
                <div style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  display: 'flex', gap: 4,
                }}>
                  <button
                    onClick={e => rerun(e, job)}
                    title="Kör igen"
                    style={iconBtnStyle}
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 4v5h5"/><path d="M1 9A7 7 0 1 0 4 3.5"/>
                    </svg>
                  </button>
                  <button
                    onClick={e => deleteJob(e, job.id)}
                    title="Radera"
                    disabled={deletingId === job.id}
                    style={{ ...iconBtnStyle, color: 'var(--red)' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-9"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

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
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const iconBtnStyle: React.CSSProperties = {
  width: 28, height: 28,
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-sm)',
  background: 'var(--bg)',
  color: 'var(--text-muted)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background 0.12s, color 0.12s',
};
