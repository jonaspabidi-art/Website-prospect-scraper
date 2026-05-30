'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Inloggning misslyckades');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 380,
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-lg)',
        padding: '36px 32px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Image src="/logo-tight.png" alt="JD Prospects" height={30} width={140} style={{ height: 30, width: 'auto', margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Logga in</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="din@email.se"
              required
              autoFocus
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Lösenord</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{
              background: 'var(--red-soft)', border: '1px solid var(--red-border)',
              borderRadius: 'var(--r-sm)', padding: '10px 14px',
              fontSize: 13, color: 'var(--red)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 42, background: loading ? 'var(--accent-hover)' : 'var(--accent)',
              color: '#fff', border: 'none', borderRadius: 'var(--r-pill)',
              fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, marginTop: 4, transition: 'background 0.15s',
            }}
          >
            {loading ? 'Loggar in…' : 'Logga in'}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 42, padding: '0 14px',
  border: '1px solid var(--border)', borderRadius: 10,
  background: 'var(--bg)', fontSize: 14, color: 'var(--text)', outline: 'none', width: '100%',
};
