import { useState, useEffect, useCallback } from "react";
import { CheckCircle, LogOut, ClipboardList, PlusCircle, LayoutDashboard, RefreshCw, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import BookingForm from "@/components/BookingForm";

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

const fetchAPI = async (endpoint: string, options?: RequestInit) => {
  const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    headers: { 
      'apikey': supabaseKey, 
      'Authorization': `Bearer ${supabaseKey}`, 
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export default function DataEntryPage() {
  const [, setLocation] = useLocation();
  const [successCount, setSuccessCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOrderCount = useCallback(async () => {
    try {
      const data = await fetchAPI('orders?select=id');
      setSuccessCount(data.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    if (user.role !== "data-entry" && user.role !== "admin") {
      setLocation("/login");
      return;
    }
    fetchOrderCount();
    // تحديث تلقائي كل دقيقة
    const interval = setInterval(fetchOrderCount, 60000);
    return () => clearInterval(interval);
  }, [setLocation, fetchOrderCount]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userRole");
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-none">إدخال الأوردرات</h1>
              <p className="text-[10px] text-blue-500 mt-1 font-bold uppercase tracking-widest">Data Entry Portal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700 flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase">إجمالي الأوردرات</p>
                <p className="text-xl font-black text-white leading-none">{loading ? '...' : successCount}</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-500 transition-all">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 p-8 rounded-3xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-blue-500" />
              أضف أوردر جديد
            </h2>
            <p className="text-slate-400 text-sm font-bold max-w-md">أدخل بيانات العميل بدقة وسيتم إرسالها فوراً للنظام وللمدير عبر الواتساب.</p>
          </div>
          <LayoutDashboard className="absolute -right-10 -bottom-10 w-48 h-48 text-blue-500/5 rotate-12" />
        </div>

        {/* Form Section */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
          <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex justify-between items-center">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">نموذج التسجيل الذكي</span>
            <button onClick={fetchOrderCount} className="text-slate-500 hover:text-white transition-all"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          </div>
          <div className="p-2 md:p-6">
            <BookingForm 
              title="بيانات الأوردر"
              description="تأكد من صحة رقم الهاتف والعنوان"
            />
          </div>
        </div>

        {/* Tips Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex items-start gap-4">
            <div className="p-3 bg-green-500/10 rounded-2xl"><CheckCircle className="w-6 h-6 text-green-500" /></div>
            <div>
              <h3 className="text-white font-bold mb-1">تحديث تلقائي</h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">الأوردرات التي تسجلها تظهر فوراً للمدير وللفنيين في لوحات التحكم الخاصة بهم.</p>
            </div>
          </div>
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex items-start gap-4">
            <div className="p-3 bg-orange-500/10 rounded-2xl"><ClipboardList className="w-6 h-6 text-orange-500" /></div>
            <div>
              <h3 className="text-white font-bold mb-1">دقة البيانات</h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">يرجى التأكد من كتابة "ماركة الجهاز" و "المشكلة" بوضوح لتسهيل مهمة الفني.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
