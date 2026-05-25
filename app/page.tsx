'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Job = {
  id: string;
  industry: string;
  city: string;
  maxResults: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  _count: { prospects: number };
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Väntar',
  running: 'Kör...',
  completed: 'Klar',
  failed: 'Misslyckades',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export default function Home() {
  const [industry, setIndustry] = useState('');
  const [city, setCity] = useState('');
  const [maxResults, setMaxResults] = useState(20);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  const fetchJobs = async () => {
    const res = await fetch('/api/jobs');
    const data = await res.json();
    setJobs(data);
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industry, city, maxResults }),
    });
    setIndustry('');
    setCity('');
    setLoading(false);
    fetchJobs();
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-1">Prospektering</h1>
      <p className="text-gray-500 mb-8 text-sm">Hitta företag utan hemsida i Sverige</p>

      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 mb-8 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bransch</label>
            <input
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              placeholder="t.ex. däckverkstad"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stad</label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="t.ex. Göteborg"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max per källa</label>
            <input
              type="number"
              value={maxResults}
              onChange={e => setMaxResults(Number(e.target.value))}
              min={5}
              max={50}
              className="w-24 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-5 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Startar...' : 'Starta scraping'}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {jobs.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">Inga körningar än</p>
        )}
        {jobs.map(job => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="flex items-center justify-between bg-white border rounded-xl px-5 py-4 hover:border-blue-300 transition-colors"
          >
            <div>
              <div className="font-medium text-sm">{job.industry} — {job.city}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {new Date(job.createdAt).toLocaleString('sv-SE')}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {job.status === 'completed' && (
                <span className="text-sm text-gray-600">{job._count.prospects} prospects</span>
              )}
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[job.status]}`}>
                {STATUS_LABEL[job.status]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
