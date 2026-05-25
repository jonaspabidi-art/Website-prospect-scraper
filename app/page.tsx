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

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: 'var(--warn-bg)',  color: 'var(--warn)',  label: 'Väntar' },
  running:   { bg: 'var(--accent-bg)', color: 'var(--accent)', label: 'Kör...' },
  completed: { bg: 'var(--good-bg)',  color: 'var(--good)',  label: 'Klar' },
  failed:    { bg: 'var(--bad-bg)',   color: 'var(--bad)',   label: 'Misslyckades' },
};

function Pill({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: '#eee', color: '#666', label: status };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
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
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 32px' }}>
      <h1 style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 28, marginBottom: 4 }}>Sök prospects</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>Hitta företag utan hemsida via hitta.se och Google Maps</p>

      <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.6fr auto', gap: 14, alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bransch</label>
              <input
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                placeholder="t.ex. däckverkstad"
                required
                style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 14, background: 'var(--bg)', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stad</label>
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="t.ex. Göteborg"
                required
                style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 14, background: 'var(--bg)', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Max</label>
              <input
                type="number"
                value={maxResults}
                onChange={e => setMaxResults(Number(e.target.value))}
                min={5} max={50}
                style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 14, background: 'var(--bg)', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {loading ? 'Startar...' : 'Hitta prospects →'}
            </button>
          </div>
        </form>
      </div>

      {activeJob && (activeJob.status === 'running' || activeJob.status === 'pending') && (
        <div style={{ background: 'var(--accent-bg)', border: '1.5px dashed var(--accent)', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Scrapar {activeJob.industry} i {activeJob.city}…</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>uppdateras var 4:e sek</span>
          </div>
          <div style={{ height: 8, background: 'var(--border-soft)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 4, width: activeJob.status === 'running' ? '60%' : '15%', transition: 'width 1s' }} />
          </div>
          {lastProgressLine && (
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'var(--font-hand)' }}>{lastProgressLine}</div>
          )}
        </div>
      )}

      {activeJob?.status === 'completed' && (
        <div style={{ background: 'var(--good-bg)', border: '1.5px solid var(--good)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 15 }}>✓ Lade till {activeJob._count.prospects} nya prospects</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{activeJob.industry} · {activeJob.city}</div>
          </div>
          <Link href="/prospects" style={{ background: 'var(--good)', color: '#fff', textDecoration: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            Visa lista →
          </Link>
        </div>
      )}

      {activeJob?.status === 'failed' && (
        <div style={{ background: 'var(--bad-bg)', border: '1.5px solid var(--bad)', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontWeight: 600, color: 'var(--bad)', marginBottom: 4 }}>Scraping misslyckades</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{activeJob.progress?.split('\n').slice(-1)[0]}</div>
        </div>
      )}

      <div>
        <h2 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: 12 }}>Senaste körningar</h2>
        {jobs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)', fontSize: 14 }}>Inga körningar än</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {jobs.map(job => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                borderRadius: 10, padding: '14px 18px', textDecoration: 'none', color: 'var(--ink)',
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 15 }}>{job.industry} — {job.city}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {new Date(job.createdAt).toLocaleString('sv-SE')}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {job.status === 'completed' && (
                  <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{job._count.prospects} prospects</span>
                )}
                <Pill status={job.status} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
