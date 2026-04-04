import { useState, useEffect, useCallback } from "react";
import { 
  Wrench, LogOut, Clock, CheckCircle2, AlertCircle, 
  XCircle, RefreshCw, Phone, MapPin, ClipboardList,
  Wallet, TrendingUp, Calendar, ChevronRight
} from "lucide-react";
import { useLocation } from "wouter";

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

export default function TechnicianPortal() {
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [techName, setTechName] = useState("");
  const [stats, setStats] = useState({ active: 0, completed: 0, earnings: 0 });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    if (user.role !== "tech") {
      setLocation("/login");
      return;
    }
    // في نظامنا البسيط، نستخدم اسم المستخدم كاسم للفني للفلترة
    // يمكن تحسين هذا لاحقاً بربط حقيقي
    setTechName(user.username === "tech" ? "إسلام العمده" : user.username);
  }, [setLocation]);

  const fetchData = useCallback(async () => {
    if (!techName) return;
    try {
      // جلب الأوردرات الخاصة بهذا الفني فقط
      const data = await fetchAPI(`orders?technician=eq.${encodeURIComponent(techName)}&order=created_at.desc`);
      setOrders(data);
      
      const active = data.filter((o: any) => o.status === 'pending' || o.status === 'in-progress').length;
      const completed = data.filter((o: any) => o.status === 'completed').length;
      const earnings = data.filter((o: any) => o.status === 'completed')
                          .reduce((acc: number, o: any) => acc + (o.technician_share || 0), 0);
      
      setStats({ active, completed, earnings });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [techName]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await fetchAPI(`orders?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userRole");
    setLocation("/login");
  };

  if (loading && orders.length === 0) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <RefreshCw className="w-10 h-10 text-orange-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-10">
      {/* Header */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-none">بوابة الفنيين</h1>
              <p className="text-[10px] text-orange-500 mt-1 font-bold uppercase tracking-widest">{techName}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-500 transition-all">
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 text-center">
            <p className="text-2xl font-black text-white">{stats.active}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase">نشط</p>
          </div>
          <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 text-center">
            <p className="text-2xl font-black text-green-500">{stats.completed}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase">مكتمل</p>
          </div>
          <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 text-center">
            <p className="text-xl font-black text-orange-500">{stats.earnings.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase">أرباحي</p>
          </div>
        </div>

        {/* Orders Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-orange-500" />
              أوردراتي
            </h2>
            <button onClick={fetchData} className="text-slate-500"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          </div>

          {orders.length === 0 ? (
            <div className="bg-slate-900 rounded-3xl p-16 text-center border border-slate-800">
              <AlertCircle className="w-12 h-12 text-slate-800 mx-auto mb-4" />
              <p className="text-slate-500 font-bold">لا توجد أوردرات حالياً</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                  {/* Status Bar */}
                  <div className={`h-1.5 ${
                    order.status === 'completed' ? 'bg-green-500' :
                    order.status === 'in-progress' ? 'bg-blue-500' :
                    order.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-black text-white">{order.customer_name}</h3>
                        <p className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {order.date}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                        order.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                        order.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {order.status === 'completed' ? 'مكتمل' : 
                         order.status === 'in-progress' ? 'جاري العمل' : 'قيد الانتظار'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                      <div className="flex items-start gap-2">
                        <Wrench className="w-4 h-4 text-orange-500 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">الجهاز</p>
                          <p className="text-sm text-slate-200 font-bold">{order.device}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-orange-500 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">العنوان</p>
                          <p className="text-sm text-slate-200 font-bold truncate">{order.address || 'غير محدد'}</p>
                        </div>
                      </div>
                    </div>

                    {order.problem && (
                      <div className="bg-orange-500/5 border border-orange-500/10 p-3 rounded-xl">
                        <p className="text-[10px] text-orange-500 font-bold uppercase mb-1">المشكلة</p>
                        <p className="text-sm text-slate-300 italic">"{order.problem}"</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <a 
                        href={`tel:${order.phone}`}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <Phone className="w-4 h-4" />
                        اتصال
                      </a>
                      
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <button 
                          onClick={() => updateStatus(order.id, order.status === 'pending' ? 'in-progress' : 'completed')}
                          className={`flex-[2] font-black py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                            order.status === 'pending' 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20' 
                            : 'bg-green-600 hover:bg-green-700 text-white shadow-green-900/20'
                          }`}
                        >
                          {order.status === 'pending' ? <RefreshCw className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          {order.status === 'pending' ? 'بدء العمل' : 'إبلاغ باكتمال الأوردر'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-xl"><TrendingUp className="w-5 h-5 text-blue-500" /></div>
            <h3 className="text-lg font-black text-blue-400">ملخص حسابي</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-bold">إجمالي الأوردرات المكتملة</span>
              <span className="text-white font-black">{stats.completed}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-bold">إجمالي مستحقاتي</span>
              <span className="text-orange-500 font-black">{stats.earnings.toLocaleString()} ج.م</span>
            </div>
            <div className="pt-3 border-t border-blue-500/10 flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase tracking-widest">
              <AlertCircle className="w-3 h-3" />
              يتم تحديث الحسابات تلقائياً عند تغيير حالة الأوردر
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
