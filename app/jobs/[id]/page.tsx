'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

type Prospect = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  employees: number | null;
  googleRating: number | null;
  source: string | null;
  priorityScore: number;
  inPipeline: boolean;
  dismissed: boolean;
  websiteUrl: string | null;
  websiteQuality: string | null;
  websiteSignals: string | null;
};

type Job = {
  id: string;
  industry: string;
  city: string;
  status: string;
  progress: string | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  prospects: Prospect[];
};

export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [pipelineSet, setPipelineSet] = useState<Set<string>>(new Set());
  const [pushing, setPushing] = useState<Set<string>>(new Set());
  const [dismissedSet, setDismissedSet] = useState<Set<string>>(new Set());

  const fetchJob = async () => {
    const res = await fetch(`/api/jobs/${id}`);
    const data = await res.json();
    setJob(data);
    if (data.prospects) {
      setPipelineSet(new Set(data.prospects.filter((p: Prospect) => p.inPipeline).map((p: Prospect) => p.id)));
      setDismissedSet(new Set(data.prospects.filter((p: Prospect) => p.dismissed).map((p: Prospect) => p.id)));
    }
  };

  useEffect(() => {
    fetchJob();
    const interval = setInterval(() => {
      setJob(j => {
        if (j?.status === 'completed' || j?.status === 'failed') return j;
        fetchJob();
        return j;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const pushToPipeline = async (prospectId: string) => {
    if (pipelineSet.has(prospectId) || pushing.has(prospectId)) return;
    setPushing(prev => new Set(prev).add(prospectId));
    await fetch(`/api/prospects/${prospectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inPipeline: true }),
    });
    setPipelineSet(prev => new Set(prev).add(prospectId));
    setPushing(prev => { const s = new Set(prev); s.delete(prospectId); return s; });
  };

  const dismiss = async (prospectId: string) => {
    setDismissedSet(prev => new Set(prev).add(prospectId));
    await fetch(`/api/prospects/${prospectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dismissed: true }),
    });
  };

  const pushAll = async () => {
    if (!job) return;
    const unpushed = job.prospects.filter(p => !pipelineSet.has(p.id) && !dismissedSet.has(p.id));
    await Promise.all(unpushed.map(p => pushToPipeline(p.id)));
  };

  if (!job) return <div className="max-w-4xl mx-auto px-4 py-10 text-sm text-gray-400">Laddar...</div>;

  const pushedCount = pipelineSet.size;
  const visibleProspects = job.prospects;
  const dismissedCount = dismissedSet.size;

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <Link href="/" className="text-sm text-blue-600 hover:underline mb-6 block">← Tillbaka</Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">{job.industry} — {job.city}</h1>
          <p className="text-sm text-gray-400">{new Date(job.createdAt).toLocaleString('sv-SE')}</p>
        </div>
        <span className="text-sm font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700">
          {job.status === 'completed' ? `${job.prospects.length} prospects` : job.status}
        </span>
      </div>

      {(job.status === 'running' || job.status === 'pending') && job.progress && (
        <div className="bg-gray-950 text-green-400 rounded-xl p-4 mb-6 font-mono text-xs leading-5 max-h-64 overflow-y-auto">
          {job.progress.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}

      {job.status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          {job.error}
        </div>
      )}

      {visibleProspects.length > 0 && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="flex justify-between items-center px-5 py-3 border-b bg-gray-50">
            <span className="text-sm font-medium">
              {visibleProspects.length} prospects
              {pushedCount > 0 && <span className="ml-2 text-xs text-gray-400">({pushedCount} i pipeline)</span>}
              {dismissedCount > 0 && <span className="ml-2 text-xs text-gray-400">({dismissedCount} avvisade)</span>}
            </span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {pushedCount < visibleProspects.length && (
                <button
                  onClick={pushAll}
                  style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: '1px solid var(--accent)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontWeight: 500 }}
                >
                  Lägg till alla i pipeline
                </button>
              )}
              <a href={`/api/jobs/${id}/csv`} className="text-xs text-blue-600 hover:underline">Exportera CSV</a>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-gray-500 text-left">
                <th className="px-5 py-3 font-medium">Bolag</th>
                <th className="px-4 py-3 font-medium">Telefon</th>
                <th className="px-4 py-3 font-medium">Anst.</th>
                <th className="px-4 py-3 font-medium">Betyg</th>
                <th className="px-4 py-3 font-medium">Källa</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Åtgärd</th>
              </tr>
            </thead>
            <tbody>
              {visibleProspects.map((p, i) => {
                const inPipe = pipelineSet.has(p.id);
                const isLoading = pushing.has(p.id);
                return (
                  <tr key={p.id} className={`border-b last:border-0 ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="font-medium">{p.name}</div>
                      {p.address && <div className="text-xs text-gray-400">{p.address}</div>}
                      {p.websiteUrl && (
                        <div style={{ marginTop: 2 }}>
                          <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Hemsida</a>
                          {p.websiteSignals && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>{p.websiteSignals}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {p.phone
                          ? <a href={`tel:${p.phone}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 13 }}>{p.phone}</a>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>
                        }
                        <a href={`https://www.google.com/maps/search/?q=${encodeURIComponent(p.name + ' ' + job.city + ' Sverige')}`} target="_blank" rel="noopener noreferrer" title="Visa på Google Maps" style={{ color: 'var(--text-faint)', display: 'flex', lineHeight: 1 }}>
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="8" cy="7" r="3"/><path d="M8 2a5 5 0 0 1 5 5c0 3.5-5 9-5 9S3 10.5 3 7a5 5 0 0 1 5-5Z"/>
                          </svg>
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.employees ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{p.googleRating ? `${p.googleRating}★` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        p.source === 'both' ? 'bg-purple-100 text-purple-700' :
                        p.source === 'google' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{p.source}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{p.priorityScore}</td>
                    <td className="px-4 py-3">
                      {dismissedSet.has(p.id) ? (
                        <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500 }}>✕ Togs bort</span>
                      ) : inPipe ? (
                        <span style={{ fontSize: 12, color: 'var(--green, #16a34a)', fontWeight: 500 }}>✓ Tillagd</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => pushToPipeline(p.id)}
                            disabled={isLoading}
                            style={{ fontSize: 12, color: isLoading ? 'var(--text-muted)' : 'var(--accent)', background: 'none', border: `1px solid ${isLoading ? 'var(--border)' : 'var(--accent)'}`, borderRadius: 6, padding: '2px 8px', cursor: isLoading ? 'default' : 'pointer', fontWeight: 500 }}
                          >
                            {isLoading ? '...' : '+ Pipeline'}
                          </button>
                          <button
                            onClick={() => dismiss(p.id)}
                            title="Avvisa — dyker inte upp igen"
                            style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 7px', cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
