'use client';

import { useState, useEffect } from 'react';

type User = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { jobs: number };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'seller' | 'admin'>('seller');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => { fetchUsers(); }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setCreating(false); return; }
    setEmail(''); setPassword(''); setRole('seller');
    setCreating(false);
    fetchUsers();
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Ta bort användare och alla deras jobb och prospects?')) return;
    setDeletingId(id);
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    fetchUsers();
  };

  const resetPassword = async (id: string) => {
    if (!newPassword) return;
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    });
    setResetId(null);
    setNewPassword('');
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '48px 32px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', margin: '0 0 4px' }}>Användare</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: '0 0 32px' }}>Hantera säljare och admins.</p>

      {/* User list */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: 32 }}>
        {users.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Inga användare</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--text-muted)', fontSize: 12 }}>Email</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--text-muted)', fontSize: 12 }}>Roll</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--text-muted)', fontSize: 12 }}>Jobb</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--text-muted)', fontSize: 12 }}>Åtgärd</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none', opacity: deletingId === u.id ? 0.4 : 1 }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 12, padding: '2px 8px', borderRadius: 'var(--r-pill)', fontWeight: 500,
                      background: u.role === 'admin' ? 'var(--purple-soft)' : 'var(--bg-subtle)',
                      color: u.role === 'admin' ? 'var(--purple)' : 'var(--text-muted)',
                      border: `1px solid ${u.role === 'admin' ? 'var(--purple-border)' : 'var(--border)'}`,
                    }}>
                      {u.role === 'admin' ? 'Admin' : 'Säljare'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{u._count.jobs}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {resetId === u.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Nytt lösenord"
                          type="password"
                          style={{ height: 30, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, width: 140, background: 'var(--bg)', color: 'var(--text)', outline: 'none' }}
                        />
                        <button onClick={() => resetPassword(u.id)} style={smallBtnStyle}>Spara</button>
                        <button onClick={() => { setResetId(null); setNewPassword(''); }} style={{ ...smallBtnStyle, color: 'var(--text-muted)' }}>Avbryt</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setResetId(u.id)} style={smallBtnStyle}>Byt lösenord</button>
                        <button onClick={() => deleteUser(u.id)} style={{ ...smallBtnStyle, color: 'var(--red)', borderColor: 'var(--red-border)' }}>Ta bort</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create user */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', letterSpacing: '-0.01em' }}>Ny användare</h2>
        <form onSubmit={createUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="säljare@email.se" required type="email" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Lösenord</label>
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required type="password" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {(['seller', 'admin'] as const).map(r => (
              <button key={r} type="button" onClick={() => setRole(r)} style={{
                padding: '6px 14px', borderRadius: 'var(--r-pill)', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', border: `1px solid ${role === r ? 'var(--accent)' : 'var(--border)'}`,
                background: role === r ? 'var(--accent-soft)' : 'var(--bg-muted)',
                color: role === r ? 'var(--accent-text)' : 'var(--text-muted)',
              }}>
                {r === 'seller' ? 'Säljare' : 'Admin'}
              </button>
            ))}
          </div>
          {error && (
            <div style={{ background: 'var(--red-soft)', border: '1px solid var(--red-border)', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: 'var(--red)' }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={creating} style={{
            height: 40, background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 'var(--r-pill)', fontSize: 14, fontWeight: 500,
            cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1, alignSelf: 'flex-start', padding: '0 20px',
          }}>
            {creating ? 'Skapar…' : 'Skapa användare'}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 38, padding: '0 12px', border: '1px solid var(--border)',
  borderRadius: 8, background: 'var(--bg)', fontSize: 13, color: 'var(--text)', outline: 'none', width: '100%',
};

const smallBtnStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, padding: '4px 10px',
  border: '1px solid var(--border)', borderRadius: 6,
  background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer',
};
