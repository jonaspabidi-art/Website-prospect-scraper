'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Job = {
  id: string;
  industry: string;
  city: string;
  maxResults: number;
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
  const [maxResults, setMaxResults] = useState(20);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

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
      body: JSON.stringify({ industry, city, maxResults }),
    });
    const job = await res.json();
    setActiveJobId(job.id);
    setIndustry('');
    setCity('');
    setLoading(false);
    fetchJobs();
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
          <div className="sok-form-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.7fr auto', gap: 16, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Bransch</label>
              <input
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                placeholder="t.ex. däckverkstad"
                required
                style={inputStyle}
              />
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
              <span style={{ fontWeight: 500 }}>Scrapar {activeJob.industry} i {activeJob.city}…</span>
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
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{activeJob.industry} · {activeJob.city}</div>
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
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  padding: '14px 18px',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'box-shadow 0.15s',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{job.industry} — {job.city}</div>
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
