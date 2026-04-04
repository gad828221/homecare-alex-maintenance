import { useState } from "react";
import { CheckCircle, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import BookingForm from "@/components/BookingForm";

export default function DataEntryPage() {
  const [, setLocation] = useLocation();
  const [successCount, setSuccessCount] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userRole");
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b-2 border-orange-500/30 p-4">
        <div className="container max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">📝 نموذج تسجيل الأوردرات</h1>
            <p className="text-slate-400 text-sm mt-1">أضف أوردرات جديدة للنظام</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-green-500/20 px-4 py-2 rounded-lg border border-green-500/30">
              <p className="text-xs text-slate-400">الأوردرات المسجلة</p>
              <p className="text-2xl font-bold text-green-400">{successCount}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              تسجيل خروج
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto py-8">
        <BookingForm 
          title="تسجيل أوردر جديد"
          description="أدخل بيانات الأوردر الجديد وسيتم حفظه تلقائياً"
        />
      </div>

      {/* Info Box */}
      <div className="container max-w-6xl mx-auto pb-8">
        <div className="bg-blue-500/10 border-2 border-blue-500/30 p-6 rounded-lg">
          <h3 className="text-lg font-bold text-blue-300 mb-3">ℹ️ معلومات مهمة</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>✅ جميع الأوردرات التي تسجلها ستظهر في لوحة التحكم الرئيسية تلقائياً.</li>
            <li>✅ يمكنك تسجيل عدد غير محدود من الأوردرات.</li>
            <li>✅ بيانات الأوردر محفوظة بأمان في النظام.</li>
            <li>❌ لا يمكنك رؤية الأرباح أو إدارة الفنيين (هذه صلاحية المدير فقط).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
