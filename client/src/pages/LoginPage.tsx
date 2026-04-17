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
      // البحث عن المستخدم في قاعدة البيانات
      const res = await fetch(`${supabaseUrl}/rest/v1/users?select=*&username=eq.${username}&is_active=eq.true`, {
        headers: { 
          'apikey': supabaseKey, 
          'Authorization': `Bearer ${supabaseKey}` 
        }
      });
      
      const users = await res.json();
      
      if (users && users.length > 0 && users[0].password === password) {
        const user = users[0];
        
        // تخزين بيانات المستخدم
        localStorage.setItem('currentUser', JSON.stringify({
          id: user.id,
          username: user.username,
          name: user.name,
          phone: user.phone || '',
          role: user.role,
          is_active: user.is_active
        }));
        localStorage.setItem('userRole', user.role);
        
        // تحديث آخر تسجيل دخول
        await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${user.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ last_login: new Date().toISOString() })
        });
        
        // تسجيل إشعار
        await fetch(`${supabaseUrl}/rest/v1/notifications`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'تسجيل دخول',
            details: `تم تسجيل دخول المستخدم ${user.name}`,
            user_name: user.name,
            created_at: new Date().toISOString()
          })
        });
        
        // التوجيه حسب الدور
        const redirectMap: Record<string, string> = {
          'admin': '/orders',
          'manager': '/orders', 
          'data-entry': '/data-entry',
          'tech': '/tech-portal',
          'viewer': '/orders'
        };
        
        const redirectPath = redirectMap[user.role] || '/orders';
        window.location.href = redirectPath;
        
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    } catch (err) {
      console.error("خطأ:", err);
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
          <p className="text-blue-100 mt-1">تسجيل الدخول إلى لوحة التحكم</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اسم المستخدم</label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pr-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="أدخل اسم المستخدم"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="أدخل كلمة المرور"
                required
              />
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'جاري التسجيل...' : 'دخول'}
          </button>
        </form>
        
        <div className="bg-gray-50 p-4 text-center border-t">
          <p className="text-xs text-gray-500">© 2024 نظام إدارة الصيانة</p>
        </div>
      </div>
    </div>
  );
}
