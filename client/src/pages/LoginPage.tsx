import React, { useState } from 'react';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. البحث في جدول users (للمدراء)
      const resUsers = await fetch(`${supabaseUrl}/rest/v1/users?select=*&username=eq.${username}&is_active=eq.true`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const users = await resUsers.json();
      
      if (users && users.length > 0 && users[0].password === password) {
        localStorage.setItem('userRole', users[0].role);
        localStorage.setItem('currentUser', JSON.stringify(users[0]));
        window.location.href = users[0].role === 'data-entry' ? '/data-entry' : '/orders';
        return;
      }

      // 2. البحث في جدول technicians (للفنيين)
      const resTechs = await fetch(`${supabaseUrl}/rest/v1/technicians?select=*&username=eq.${username}&is_active=eq.true`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const techs = await resTechs.json();

      if (techs && techs.length > 0 && techs[0].password === password) {
        localStorage.setItem('userRole', 'tech');
        localStorage.setItem('currentUser', JSON.stringify({ ...techs[0], role: 'tech' }));
        window.location.href = '/tech-portal';
        return;
      }

      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">نظام إدارة الصيانة</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اسم المستخدم</label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pr-10 p-3 border rounded-lg" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pr-10 p-3 border rounded-lg" required />
            </div>
          </div>
          {error && <div className="bg-red-50 p-3 rounded-lg text-red-700 text-sm">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg">
            {loading ? 'جاري...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
