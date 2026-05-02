import React, { useState } from 'react';
import { LogIn, User, Lock, AlertCircle, Wrench, LayoutDashboard } from 'lucide-react';

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

export default function Login() {
  const [role, setRole] = useState<'admin' | 'tech'>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (role === 'admin') {
        const res = await fetch(`${supabaseUrl}/rest/v1/users?select=*&username=eq.${encodeURIComponent(username)}`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        if (data && data.length > 0 && data[0].password === password) {
          const user = data[0];
          
          // ✅ منع الفنيين من الدخول كمدير
          if (user.role === 'tech') {
            setError('❌ هذا الحساب مخصص للفنيين. الرجاء اختيار دور "فني" في الأعلى.');
            setLoading(false);
            return;
          }
          
          if (user.is_active === false) {
            setError('❌ الحساب غير نشط. يرجى التواصل مع الإدارة.');
            setLoading(false);
            return;
          }
          
          localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role
          }));
          localStorage.setItem('userRole', user.role);
          
          window.location.href = user.role === 'data-entry' ? '/data-entry' : '/orders';
        } else {
          setError('❌ اسم المستخدم أو كلمة المرور غير صحيحة');
        }
      } else {
        const res = await fetch(`${supabaseUrl}/rest/v1/technicians?select=*&username=eq.${encodeURIComponent(username)}`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        if (data && data.length > 0 && data[0].password === password) {
          const tech = data[0];
          if (tech.is_active === false) {
            setError('❌ الحساب غير نشط. يرجى التواصل مع الإدارة.');
            setLoading(false);
            return;
          }
          localStorage.setItem('currentUser', JSON.stringify({
            id: tech.id,
            username: tech.username,
            name: tech.name,
            role: 'tech',
            techName: tech.name
          }));
          localStorage.setItem('userRole', 'tech');
          localStorage.setItem('techName', tech.name);
          
          window.location.href = '/tech-portal';
        } else {
          setError('❌ اسم المستخدم أو كلمة المرور غير صحيحة');
        }
      }
    } catch (err) {
      console.error(err);
      setError('❌ حدث خطأ في الاتصال بقاعدة البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-700">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-900/20">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">🔧 Maintenance Guide</h1>
          <p className="text-slate-400 text-sm mt-1">نظام إدارة الصيانة</p>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              role === 'admin' 
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            مدير / مستخدم
          </button>
          <button
            type="button"
            onClick={() => setRole('tech')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              role === 'tech' 
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Wrench className="w-4 h-4" />
            فني
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" /> اسم المستخدم
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition-all"
              placeholder="أدخل اسم المستخدم"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" /> كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition-all"
              placeholder="أدخل كلمة المرور"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-xl p-3 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-900/20 disabled:opacity-50"
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
