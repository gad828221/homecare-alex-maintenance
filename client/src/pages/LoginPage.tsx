import React, { useState } from 'react';
import { LogIn, User, Lock, AlertCircle, Wrench, LayoutDashboard, Download, Share2 } from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { supabase } from '../lib/supabaseClient';

// Must match the migration byte-for-byte: the username EXACTLY as stored
// (case-sensitive, no trim/lower) -> UTF-8 bytes -> lowercase hex, namespaced
// per login context: 's.' for the staff tab (users table), 't.' for the
// technician tab (technicians table). Same person can hold both, as today.
const toHex = (s: string): string =>
  [...new TextEncoder().encode(s)].map(b => b.toString(16).padStart(2, '0')).join('');
const staffEmail = (context: 's' | 't', username: string): string =>
  context + '.' + toHex(username) + '@staff.maintenanceguide.life';

export default function Login() {
  const [role, setRole] = useState<'admin' | 'tech'>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isInstalled, canInstall, isIos, isFirefox, install, installCompleted } = usePwaInstall();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ✅ تفعيل الصوت إجبارياً عند أول ضغطة تفاعل (تسجيل الدخول)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      // حفظ حالة تفعيل الصوت في الجلسة ليتم التقاطها في الصفحات التالية
      sessionStorage.setItem('audio_forced_enabled', 'true');
    } catch (err) { console.warn("Audio activation failed", err); }

    // Tab-scoped login (same as today): the admin tab authenticates a
    // users-table identity, the tech tab a technicians-table identity.
    // Supabase Auth verifies the password server-side; the client never
    // reads any password column. Username is used exactly as typed —
    // case-sensitive, same as today's `eq` lookup.
    const context: 's' | 't' = role === 'admin' ? 's' : 't';
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: staffEmail(context, username),
        password,
      });
      if (authError || !authData.session) {
        setError('❌ اسم المستخدم أو كلمة المرور غير صحيحة');
        setLoading(false);
        return;
      }
      const authId = authData.user.id;

      // Identity resolves ONLY in the tab's table — each auth account is
      // linked to exactly one row there (migration Plan E).
      let u: any = null;
      let t: any = null;
      if (context === 's') {
        const { data: uRows } = await supabase
          .from('users').select('id,username,name,role,is_active')
          .eq('auth_user_id', authId).limit(1);
        u = uRows?.[0] ?? null;
      } else {
        const { data: tRows } = await supabase
          .from('technicians').select('id,username,name,is_active')
          .eq('auth_user_id', authId).limit(1);
        t = tRows?.[0] ?? null;
      }
      const activeU = context === 's' && !!u && u.is_active !== false;
      const activeT = context === 't' && !!t && t.is_active !== false;

      if (!activeU && !activeT) {
        await supabase.auth.signOut();
        setError('❌ الحساب غير نشط. يرجى التواصل مع الإدارة.');
        setLoading(false);
        return;
      }

      const role2 = activeU ? u!.role : 'tech';
      const name = activeU ? u!.name : t!.name;
      const id = activeU ? u!.id : t!.id;
      const uname2 = activeU ? u!.username : t!.username;

      localStorage.setItem('currentUser', JSON.stringify({
        id, username: uname2, name, role: role2,
        techName: role2 === 'tech' ? name : undefined,
      }));
      localStorage.setItem('userRole', role2);
      if (role2 === 'tech') localStorage.setItem('techName', name);

      // Same login notification as today — now inserted as authenticated staff
      // (allowed by notifications_staff_insert). Ordering matters: after sign-in.
      try {
        await supabase.from('notifications').insert({
          action: role2 === 'tech' ? 'تسجيل دخول فني' : 'تسجيل دخول',
          details: role2 === 'tech'
            ? `الفني ${name} قام بفتح البرنامج الآن`
            : `المستخدم ${name} (${role2 === 'tech' ? 'فني' : 'إدارة'}) قام بفتح البرنامج الآن`,
          user_name: name,
          created_at: new Date().toISOString(),
        });
      } catch (err) { console.error(err); }

      if (role2 === 'tech') {
        window.location.href = '/tech-portal';
      } else if (role2 === 'data-entry') {
        window.location.href = '/data-entry';
      } else {
        window.location.href = '/orders';
      }
    } catch (err) {
      console.error(err);
      setError('❌ حدث خطأ في الاتصال بقاعدة البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`technician-login-page min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4 ${role === 'tech' ? 'is-technician-login' : ''}`}>
      <div className="technician-login-card bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-700">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-900/20">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">🔧 Maintenance Guide</h1>
          <p className="text-slate-400 text-sm mt-1">نظام إدارة الصيانة</p>
        </div>

        {!isInstalled && (
          <div className="mb-6 rounded-2xl border border-orange-500/40 bg-orange-500/10 p-4 text-right">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-orange-600 flex items-center justify-center">
                {isIos ? <Share2 className="w-5 h-5 text-white" /> : <Download className="w-5 h-5 text-white" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-white">ثبّت البرنامج للوصول السريع والتنبيهات</p>
                {canInstall ? (
                  <button
                    type="button"
                    onClick={() => { void install(); }}
                    className="mt-3 w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-3 font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Download size={17} /> تثبيت البرنامج الآن
                  </button>
                ) : isIos ? (
                  <p className="mt-2 text-[11px] text-slate-300 leading-6">من Safari اضغط <b className="text-orange-300">مشاركة</b> ثم <b className="text-orange-300">إضافة إلى الشاشة الرئيسية</b>، وبعدها افتح التطبيق من الأيقونة.</p>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-300 leading-6">{isFirefox ? <>في Firefox افتح القائمة ثم اختر <b className="text-orange-300">إضافة إلى الشاشة الرئيسية</b> أو <b className="text-orange-300">تثبيت</b> إذا ظهر الخيار.</> : <>من قائمة المتصفح اختر <b className="text-orange-300">تثبيت التطبيق</b> أو <b className="text-orange-300">إضافة إلى الشاشة الرئيسية</b>.</>}</p>
                )}
                {installCompleted && <p className="mt-2 text-[11px] text-emerald-300 font-bold">تم قبول التثبيت. افتح التطبيق من الأيقونة الجديدة.</p>}
              </div>
            </div>
          </div>
        )}

        <div className="technician-role-switcher flex gap-3 mb-6">
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
