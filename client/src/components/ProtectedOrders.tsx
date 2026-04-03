import { useState } from "react";
import { Eye, EyeOff, LogOut } from "lucide-react";
import AdvancedOrdersManagement from "./AdvancedOrdersManagement";

const ADMIN_PASSWORD = "19882@retal";

export default function ProtectedOrders() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      setError("");
      localStorage.setItem("adminLoggedIn", "true");
    } else {
      setError("كلمة المرور غير صحيحة!");
      setPassword("");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPassword("");
    localStorage.removeItem("adminLoggedIn");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {!isLoggedIn ? (
        <div className="max-w-md mx-auto mt-20">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-10 rounded-2xl border-2 border-orange-500/50 shadow-2xl">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="text-3xl font-bold text-white mb-2">صفحة الأوردرات</h2>
              <p className="text-slate-400">الوصول المحمي - إدارة الأوردرات</p>
              <div className="w-16 h-1 bg-gradient-to-r from-orange-400 to-red-500 mx-auto mt-4 rounded-full"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3">
                  🔓 كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="w-full px-5 py-3 bg-slate-700 border-2 border-orange-300 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-orange-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/20 border-2 border-red-500/50 text-red-300 rounded-lg text-center font-bold">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                🔓 دخول
              </button>
            </form>

            <div className="mt-6 p-4 bg-yellow-500/10 border-2 border-yellow-500/30 text-yellow-300 rounded-lg text-sm text-center">
              ⚠️ تنبيه: هذه الصفحة محمية بكلمة مرور يُسمح بالوصول للمسؤولين فقط
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">🔧 نظام إدارة الصيانة المتكامل</h1>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center gap-2 transition-all"
            >
              <LogOut className="w-5 h-5" />
              تسجيل خروج
            </button>
          </div>

          {/* Advanced Orders Management */}
          <AdvancedOrdersManagement />
        </div>
      )}
    </div>
  );
}
