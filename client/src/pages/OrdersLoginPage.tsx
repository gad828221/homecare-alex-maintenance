import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";

const ADMIN_PASSWORD = "19882@retal";

export default function OrdersLoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === ADMIN_PASSWORD) {
      // حفظ حالة تسجيل الدخول في Session Storage
      sessionStorage.setItem("ordersAuthenticated", "true");
      setLocation("/orders");
    } else {
      setError("❌ كلمة المرور غير صحيحة!");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md p-12 shadow-2xl border-2 border-orange-200 bg-gradient-to-br from-white to-blue-50/50">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-orange-600 bg-clip-text text-transparent mb-2">
            🔐 صفحة الأوردرات
          </h1>
          <p className="text-gray-700 text-lg">الوصول المحمي - إدارة الأوردرات</p>
          <div className="w-16 h-1 bg-gradient-to-r from-orange-400 to-red-500 mx-auto mt-4 rounded-full"></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-100 border-2 border-red-400 text-red-800 rounded-lg text-center font-semibold">
              {error}
            </div>
          )}

          <div className="relative">
            <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Lock className="w-6 h-6 text-orange-500" />
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="w-full px-6 py-4 bg-white border-3 border-orange-200 text-gray-800 rounded-xl focus:outline-none focus:ring-3 focus:ring-orange-500 focus:border-transparent transition-all text-lg font-semibold placeholder-gray-400"
                placeholder="أدخل كلمة المرور"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500 hover:text-orange-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-6 h-6" />
                ) : (
                  <Eye className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg rounded-xl hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 shadow-lg active:scale-95"
          >
            🔓 دخول
          </button>
        </form>

        <div className="mt-8 p-6 bg-orange-50 border-2 border-orange-200 rounded-xl">
          <p className="text-center text-gray-700 text-sm">
            <span className="font-bold text-orange-600">⚠️ تنبيه:</span> هذه الصفحة محمية بكلمة مرور
          </p>
          <p className="text-center text-gray-600 text-xs mt-2">
            يُسمح بالوصول للمسؤولين فقط
          </p>
        </div>
      </Card>
    </div>
  );
}
