import { useState } from "react";
import { Lock, User, LogOut } from "lucide-react";
import { useLocation } from "wouter";

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "data-entry" | "tech">("admin");
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string; techName?: string } | null>(null);

  const adminList = [
    { username: "admin", password: "19882@retal" },
    { username: "kajo", password: "@kajo" }
  ];
  const dataEntry = { username: "dataentry", password: "dataentry123" };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (role === "admin") {
      const isValid = adminList.some(admin => admin.username === username && admin.password === password);
      if (isValid) {
        setIsLoggedIn(true);
        setCurrentUser({ username, role: "admin" });
        localStorage.setItem("currentUser", JSON.stringify({ username, role: "admin" }));
        localStorage.setItem("userRole", "admin");
        setLocation("/orders");
        return;
      }
    } else if (role === "data-entry") {
      if (username === dataEntry.username && password === dataEntry.password) {
        setIsLoggedIn(true);
        setCurrentUser({ username, role: "data-entry" });
        localStorage.setItem("currentUser", JSON.stringify({ username, role: "data-entry" }));
        localStorage.setItem("userRole", "data-entry");
        setLocation("/data-entry");
        return;
      }
    } else if (role === "tech") {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/technicians?select=name,username,password,is_active&username=eq.${username}`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const data = await response.json();
        if (data && data.length > 0 && data[0].password === password) {
          if (data[0].is_active === false) {
            setError("حساب الفني غير نشط، يرجى التواصل مع الإدارة");
            return;
          }
          setIsLoggedIn(true);
          const techName = data[0].name;
          setCurrentUser({ username, role: "tech", techName });
          localStorage.setItem("currentUser", JSON.stringify({ username, role: "tech", techName }));
          localStorage.setItem("userRole", "tech");
          setLocation(`/tech-portal?name=${encodeURIComponent(techName)}`);
          return;
        } else {
          setError("اسم المستخدم أو كلمة المرور غير صحيحة");
        }
      } catch (err) {
        console.error(err);
        setError("خطأ في الاتصال بقاعدة البيانات");
      }
      return;
    }

    setError("اسم المستخدم أو كلمة المرور غير صحيحة");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUsername("");
    setPassword("");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userRole");
  };

  if (isLoggedIn && currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl border border-orange-500/30 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">مرحباً بك</h2>
            <p className="text-slate-400 mt-2">{currentUser.username}</p>
            <p className="text-orange-400 font-semibold mt-1">
              {currentUser.role === "admin" && "👨‍💼 مدير النظام"}
              {currentUser.role === "data-entry" && "📝 مدخل البيانات"}
              {currentUser.role === "tech" && "🔧 الفني"}
            </p>
          </div>
          <button onClick={handleLogout} className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
            <LogOut className="w-5 h-5" /> تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border-2 border-orange-500/30 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">نظام الصيانة</h1>
          <p className="text-slate-400 mt-2">تسجيل الدخول الآمن</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-3">اختر دورك</label>
            <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border-2 border-orange-500/30">
              <option value="admin">👨‍💼 مدير النظام (Admin)</option>
              <option value="data-entry">📝 مدخل البيانات (Data Entry)</option>
              <option value="tech">🔧 الفني (Technician)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-3">اسم المستخدم</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border-2 border-orange-500/30" placeholder="أدخل اسم المستخدم" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-3">كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border-2 border-orange-500/30" placeholder="أدخل كلمة المرور" />
          </div>

          {error && <div className="p-4 bg-red-500/20 border-2 border-red-500/50 text-red-300 rounded-lg text-sm">❌ {error}</div>}

          <button type="submit" className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 hover:from-orange-600 hover:via-orange-700 hover:to-red-700 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg">
            تسجيل الدخول
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-500/10 border-2 border-blue-500/30 rounded-lg">
          <p className="text-xs text-slate-300 text-center">🔐 <strong>ملاحظة:</strong> هذا النظام محمي بكلمات مرور. استخدم بيانات الدخول المناسبة لدورك.</p>
        </div>
      </div>
    </div>
  );
}
