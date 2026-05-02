import React, { useState } from 'react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('currentUser', JSON.stringify({ id: 1, name: 'مدير', role: 'admin' }));
        localStorage.setItem('userRole', 'admin');
        window.location.href = '/orders';
      } else {
        setError('بيانات غير صحيحة');
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '1rem', width: '350px' }}>
        <h1 style={{ color: 'white', textAlign: 'center' }}>تسجيل الدخول</h1>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="admin" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', margin: '0.5rem 0', padding: '0.5rem' }} required />
          <input type="password" placeholder="admin123" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', margin: '0.5rem 0', padding: '0.5rem' }} required />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ background: '#f97316', color: 'white', width: '100%', padding: '0.5rem', border: 'none', borderRadius: '0.5rem' }}>
            {loading ? 'جاري...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
