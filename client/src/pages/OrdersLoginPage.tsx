import { useState } from "react";
import { Lock, User, LogOut } from "lucide-react";
import { useLocation } from "wouter";

interface LoginPageProps {
  onLoginSuccess?: (role: string, username: string) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "data-entry" | "tech">("admin");
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);

  // قائمة المدراء (يمكن إضافة المزيد بسهولة)
  const adminAccounts = [
    { username: "admin", password: "19882@retal" },
    { username: "kajo", password: "@kajo" }
  ];

  // بيانات باقي الأدوار
  const roleCredentials = {
    "data-entry": { username: "dataentry", password: "dataentry123" },
    "tech": { username: "tech", password: "tech123" }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // التحقق من المدير
    if (role === "admin") {
      const foundAdmin = adminAccounts.find(acc => acc.username === username && acc.password === password);
      if (foundAdmin) {
        setIsLoggedIn(true);
        setCurrentUser({ username, role: "admin" });
        localStorage.setItem("currentUser", JSON.stringify({ username, role: "admin" }));
        localStorage.setItem("userRole", "admin");
        if (onLoginSuccess) onLoginSuccess("admin", username);
        setLocation("/orders");
        return;
      }
    } 
    // التحقق من مدخل البيانات أو الفني
    else {
      const creds = roleCredentials[role as keyof typeof roleCredentials];
      if (creds && username === creds.username && password === creds.password) {
        setIsLoggedIn(true);
        setCurrentUser({ username, role });
        localStorage.setItem("currentUser", JSON.stringify({ username, role }));
        localStorage.setItem("userRole", role);
        if (onLoginSuccess) onLoginSuccess(role, username);
        if (role === "data-entry") setLocation("/data-entry");
        else if (role === "tech") setLocation("/tech-portal");
        return;
      }
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
          <button onClick={handleLogout} className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all">
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
