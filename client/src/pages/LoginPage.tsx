import React, { useState } from 'react';

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
      // 1. البحث في جدول users (للمدراء ومدخلي البيانات)
      const resUsers = await fetch(`${supabaseUrl}/rest/v1/users?select=*&username=eq.${username}&is_active=eq.true`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const users = await resUsers.json();

      if (users && users.length > 0 && users[0].password === password) {
        const user = users[0];
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('currentUser', JSON.stringify(user));
        if (user.role === 'data-entry') {
          window.location.href = '/data-entry';
        } else {
          window.location.href = '/orders';
        }
        return;
      }

      // 2. البحث في جدول technicians (للفنيين)
      const resTechs = await fetch(`${supabaseUrl}/rest/v1/technicians?select=*&username=eq.${username}&is_active=eq.true`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const techs = await resTechs.json();

      if (techs && techs.length > 0 && techs[0].password === password) {
        const tech = techs[0];
        localStorage.setItem('userRole', 'tech');
        localStorage.setItem('currentUser', JSON.stringify({ ...tech, role: 'tech' }));
        window.location.href = '/tech-portal';
        return;
      }

      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    } catch (err) {
      console.error(err);
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">نظام إدارة الصيانة</h1>
          <p className="text-blue-100 mt-1">تسجيل الدخول</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="أدخل اسم المستخدم"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="أدخل كلمة المرور"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg"
          >
            {loading ? 'جاري...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
