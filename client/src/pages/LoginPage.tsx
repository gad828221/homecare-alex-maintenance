import React, { useState } from 'react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // محاكاة تسجيل الدخول بدون قاعدة بيانات
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // محاكاة تأخير الشبكة
    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        // تخزين بيانات وهمية
        localStorage.setItem('currentUser', JSON.stringify({ id: 1, name: 'مدير', role: 'admin' }));
        localStorage.setItem('userRole', 'admin');
        // توجيه إلى لوحة التحكم
        window.location.href = '/orders';
      } else {
        setError('❌ اسم المستخدم أو كلمة المرور غير صحيحة (admin / admin123)');
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-700">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-900/20">
            <span className="text-4xl">🔧</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Maintenance Guide</h1>
          <p className="text-slate-400 text-sm mt-1">نظام إدارة الصيانة</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm text-slate-400 mb-2">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500"
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500"
              placeholder="••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          <p>للتواصل: 01278885772</p>
        </div>
      </div>
    </div>
  );
}
