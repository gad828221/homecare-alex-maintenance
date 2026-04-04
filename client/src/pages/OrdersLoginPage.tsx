import { useState } from "react";
import { useLocation } from "wouter";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "data-entry" | "tech">("admin");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // بيانات الدخول
    if (role === "admin" && username === "admin" && password === "19882@retal") {
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("currentUser", JSON.stringify({ username: "admin", role: "admin" }));
      // تحويل مباشر
      window.location.href = "/orders";
      return;
    }
    
    if (role === "data-entry" && username === "dataentry" && password === "dataentry123") {
      localStorage.setItem("userRole", "data-entry");
      localStorage.setItem("currentUser", JSON.stringify({ username: "dataentry", role: "data-entry" }));
      window.location.href = "/data-entry";
      return;
    }
    
    if (role === "tech" && username === "tech" && password === "tech123") {
      localStorage.setItem("userRole", "tech");
      localStorage.setItem("currentUser", JSON.stringify({ username: "tech", role: "tech" }));
      window.location.href = "/tech-portal";
      return;
    }
    
    setError("اسم المستخدم أو كلمة المرور غير صحيحة");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border-2 border-orange-500/30 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">نظام الصيانة</h1>
          <p className="text-slate-400 mt-2">تسجيل الدخول الآمن</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-3">اختر دورك</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border-2 border-orange-500/30 focus:border-orange-500 focus:outline-none transition-all"
            >
              <option value="admin">👨‍💼 مدير النظام (Admin)</option>
              <option value="data-entry">📝 مدخل البيانات (Data Entry)</option>
              <option value="tech">🔧 الفني (Technician)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-3">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border-2 border-orange-500/30 focus:border-orange-500 focus:outline-none transition-all"
              placeholder="أدخل اسم المستخدم"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-3">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border-2 border-orange-500/30 focus:border-orange-500 focus:outline-none transition-all"
              placeholder="أدخل كلمة المرور"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-500/20 border-2 border-red-500/50 text-red-300 rounded-lg text-sm">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 hover:from-orange-600 hover:via-orange-700 hover:to-red-700 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg"
          >
            تسجيل الدخول
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-500/10 border-2 border-blue-500/30 rounded-lg">
          <p className="text-xs text-slate-300 text-center">
            🔐 <strong>ملاحظة:</strong> هذا النظام محمي بكلمات مرور. استخدم بيانات الدخول المناسبة لدورك.
          </p>
        </div>
      </div>
    </div>
  );
}
