import React, { useState, useEffect } from 'react';
import { Users, Edit2, Trash2, Toggle2, Eye, EyeOff, Plus, X, Lock, Unlock } from 'lucide-react';

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

interface User {
  id: number;
  username: string;
  name: string;
  password: string;
  role: 'admin' | 'data-entry' | 'user';
  is_active: boolean;
  created_at: string;
}

const fetchAPI = async (endpoint: string, options?: RequestInit) => {
  const url = `${supabaseUrl}/rest/v1/${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    ...options,
  });
  
  if (res.status === 204 || options?.method === 'DELETE') {
    return { success: true };
  }
  
  const text = await res.text();
  if (!text) return { success: true };
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("JSON parse error:", text);
    return { success: true };
  }
};

export default function AdminPermissions() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({});
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    role: 'user' as 'admin' | 'data-entry' | 'user',
    is_active: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await fetchAPI('users?select=*&order=created_at.desc');
      setUsers(data || []);
    } catch (err) {
      console.error('خطأ في جلب المستخدمين:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.name || !formData.password) {
      alert('⚠️ يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      if (editingUser) {
        await fetchAPI(`users?id=eq.${editingUser.id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData)
        });
        alert('✅ تم تحديث المستخدم بنجاح');
      } else {
        await fetchAPI('users', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        alert('✅ تم إضافة المستخدم بنجاح');
      }
      
      setShowModal(false);
      setEditingUser(null);
      setFormData({
        username: '',
        name: '',
        password: '',
        role: 'user',
        is_active: true
      });
      fetchUsers();
    } catch (err) {
      console.error('خطأ في حفظ المستخدم:', err);
      alert('❌ حدث خطأ في حفظ المستخدم');
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (confirm(`هل أنت متأكد من حذف المستخدم ${name}?`)) {
      try {
        await fetchAPI(`users?id=eq.${id}`, { method: 'DELETE' });
        alert('✅ تم حذف المستخدم بنجاح');
        fetchUsers();
      } catch (err) {
        console.error('خطأ في حذف المستخدم:', err);
        alert('❌ حدث خطأ في حذف المستخدم');
      }
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await fetchAPI(`users?id=eq.${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !user.is_active })
      });
      alert(`✅ تم ${!user.is_active ? 'تفعيل' : 'تعطيل'} المستخدم بنجاح`);
      fetchUsers();
    } catch (err) {
      console.error('خطأ في تحديث حالة المستخدم:', err);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      name: user.name,
      password: user.password,
      role: user.role,
      is_active: user.is_active
    });
    setShowModal(true);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '🔐 مدير';
      case 'data-entry': return '📝 إدخال بيانات';
      case 'user': return '👤 مستخدم عادي';
      default: return role;
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري تحميل المستخدمين...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" /> إدارة المستخدمين والصلاحيات
        </h2>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({
              username: '',
              name: '',
              password: '',
              role: 'user',
              is_active: true
            });
            setShowModal(true);
          }}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> مستخدم جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <div
            key={user.id}
            className={`p-4 rounded-lg border-2 ${
              user.is_active
                ? 'bg-slate-800 border-slate-700'
                : 'bg-slate-900 border-red-500/30'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-white">{user.name}</h3>
                <p className="text-xs text-slate-400">@{user.username}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                user.is_active
                  ? 'bg-green-500/20 text-green-500'
                  : 'bg-red-500/20 text-red-500'
              }`}>
                {user.is_active ? '✅ نشط' : '❌ معطل'}
              </span>
            </div>

            <div className="mb-3">
              <p className="text-xs text-slate-400">الدور</p>
              <p className="text-sm font-semibold">{getRoleLabel(user.role)}</p>
            </div>

            <div className="mb-3">
              <p className="text-xs text-slate-400">كلمة المرور</p>
              <div className="flex items-center gap-2">
                <input
                  type={showPasswords[user.id] ? 'text' : 'password'}
                  value={user.password}
                  readOnly
                  className="flex-1 bg-slate-700 text-white text-xs px-2 py-1 rounded"
                />
                <button
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      [user.id]: !showPasswords[user.id]
                    })
                  }
                  className="text-slate-400 hover:text-white"
                >
                  {showPasswords[user.id] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleToggleActive(user)}
                className={`flex-1 p-2 rounded text-xs font-bold flex items-center justify-center gap-1 ${
                  user.is_active
                    ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                    : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                }`}
              >
                {user.is_active ? (
                  <>
                    <Lock className="w-3 h-3" /> تعطيل
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3" /> تفعيل
                  </>
                )}
              </button>
              <button
                onClick={() => handleEditUser(user)}
                className="flex-1 p-2 rounded text-xs font-bold bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 flex items-center justify-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> تعديل
              </button>
              <button
                onClick={() => handleDeleteUser(user.id, user.name)}
                className="flex-1 p-2 rounded text-xs font-bold bg-red-500/20 text-red-500 hover:bg-red-500/30 flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {editingUser ? 'تعديل المستخدم' : 'مستخدم جديد'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">اسم المستخدم</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">الاسم الكامل</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">كلمة المرور</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">الدور</label>
                <select
                  value={formData.role}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      role: e.target.value as 'admin' | 'data-entry' | 'user'
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                >
                  <option value="user">👤 مستخدم عادي</option>
                  <option value="data-entry">📝 إدخال بيانات</option>
                  <option value="admin">🔐 مدير</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label className="text-sm text-slate-400">نشط</label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded font-bold"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
