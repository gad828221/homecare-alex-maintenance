import React, { useState, useCallback, useEffect } from 'react';
import { 
  Wrench, LogOut, Clock, CheckCircle2, AlertCircle, 
  XCircle, RefreshCw, Phone, MapPin, ClipboardList,
  Calendar, X, Trash2, Eye, ClockArrowUp, StickyNote
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
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNote, setCurrentNote] = useState("");
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  
  const [settleForm, setSettleForm] = useState({
    total_amount: 0,
    parts_cost: 0,
    transport_cost: 0,
    net_amount: 0,
    technician_share: 0,
    company_share: 0
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nameFromUrl = params.get("name");
    if (nameFromUrl) {
      setTechName(decodeURIComponent(nameFromUrl));
    } else {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      if (user.role === "tech") {
        setTechName(user.username === "tech" ? "إسلام العمده" : user.username);
      } else if (user.role !== "admin") {
        setLocation("/login");
      }
    }
  }, [setLocation]);

  const fetchData = useCallback(async () => {
    if (!techName) return;
    try {
      const data = await fetchAPI(`orders?technician=eq.${encodeURIComponent(techName)}&order=created_at.desc`);
      setOrders(data);
      const active = data.filter((o: any) => o.status === 'pending' || o.status === 'in-progress').length;
      const completed = data.filter((o: any) => o.status === 'completed').length;
      const earnings = data.filter((o: any) => o.status === 'completed').reduce((acc: number, o: any) => acc + (o.technician_share || 0), 0);
      setStats({ active, completed, earnings });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [techName]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const updateStatus = async (id: number, newStatus: string, extraData = {}) => {
    try {
      await fetchAPI(`orders?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, ...extraData })
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleSettleChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updated = { ...settleForm, [field]: numValue };
    const net = updated.total_amount - updated.parts_cost - updated.transport_cost;
    const share = Math.round(net * 0.5);
    setSettleForm({ ...updated, net_amount: net, technician_share: share, company_share: net - share });
  };

  const submitSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateStatus(selectedOrder.id, 'completed', settleForm);
    setShowSettleModal(false);
    
    const message = `✅ *تقرير تصفية أوردر*\n\n👤 *الفني:* ${techName}\n📦 *العميل:* ${selectedOrder.customer_name}\n\n💰 *الإجمالي:* ${settleForm.total_amount} ج.م\n🛠️ *قطع غيار:* ${settleForm.parts_cost} ج.م\n🚗 *مواصلات:* ${settleForm.transport_cost} ج.م\n✨ *الصافي:* ${settleForm.net_amount} ج.م\n\n🏢 *نصيب الشركة:* ${settleForm.company_share} ج.م\n🔧 *نصيب الفني:* ${settleForm.technician_share} ج.م`;
    window.open(`https://wa.me/201558625259?text=${encodeURIComponent(message)}`, "_blank");
  };

  const addNote = async () => {
    if (currentNote.trim() && currentOrderId) {
      const order = orders.find(o => o.id === currentOrderId);
      await updateStatus(currentOrderId, order?.status || 'pending', { technician_note: currentNote });
      setShowNoteModal(false);
      setCurrentNote("");
      setCurrentOrderId(null);
    }
  };

  if (loading && orders.length === 0) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <RefreshCw className="w-10 h-10 text-orange-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-10">
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center"><Wrench className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-lg font-black text-white leading-none">بوابة الفنيين</h1>
              <p className="text-[10px] text-orange-500 mt-1 font-bold uppercase tracking-widest">{techName}</p>
            </div>
          </div>
          <button onClick={() => {
            localStorage.removeItem("userRole");
            localStorage.removeItem("currentUser");
            setLocation("/login");
          }} className="p-2 text-slate-500 hover:text-white transition-all"><LogOut className="w-6 h-6" /></button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
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

        <div className="space-y-4">
          <h2 className="text-xl font-black text-white flex items-center gap-2 px-2"><ClipboardList className="w-5 h-5 text-orange-500" />أوردراتي</h2>
          {orders.map(order => (
            <div key={order.id} className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
              <div className={`h-1.5 ${order.status === 'completed' ? 'bg-green-500' : order.status === 'in-progress' ? 'bg-blue-500' : order.status === 'cancelled' ? 'bg-red-500' : order.status === 'deferred' ? 'bg-purple-500' : 'bg-yellow-500'}`}></div>
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-white">{order.customer_name}</h3>
                    <p className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-1"><Calendar className="w-3 h-3" />{order.date}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black ${order.status === 'completed' ? 'bg-green-500/10 text-green-500' : order.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500' : order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : order.status === 'deferred' ? 'bg-purple-500/10 text-purple-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {order.status === 'completed' ? 'مكتمل' : order.status === 'in-progress' ? 'جاري العمل' : order.status === 'cancelled' ? 'ملغي' : order.status === 'deferred' ? 'مؤجل' : 'قيد الانتظار'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                  <div className="flex items-start gap-2"><Wrench className="w-4 h-4 text-orange-500 mt-0.5" /><div><p className="text-[10px] text-slate-500 font-bold uppercase">الجهاز</p><p className="text-sm text-slate-200 font-bold">{order.device_type} - {order.brand}</p></div></div>
                  <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-orange-500 mt-0.5" /><div><p className="text-[10px] text-slate-500 font-bold uppercase">العنوان</p><p className="text-sm text-slate-200 font-bold">{order.address || 'غير محدد'}</p></div></div>
                  <div className="md:col-span-2 flex items-start gap-2 border-t border-slate-800/50 pt-2"><AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" /><div><p className="text-[10px] text-slate-500 font-bold uppercase">المشكلة</p><p className="text-xs text-slate-300">{order.problem_description || 'لا يوجد وصف'}</p></div></div>
                </div>

                {/* عرض تعليق الفني إن وجد */}
                {order.technician_note && (
                  <div className="bg-slate-800/50 p-3 rounded-xl border-r-4 border-orange-500">
                    <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1"><StickyNote className="w-3 h-3" /> تعليق الفني:</p>
                    <p className="text-sm text-slate-300">{order.technician_note}</p>
                  </div>
                )}

                {/* عرض مبلغ الكشف إن وجد */}
                {order.inspection_amount > 0 && (
                  <div className="bg-yellow-500/10 p-3 rounded-xl">
                    <p className="text-[10px] text-yellow-500 font-bold uppercase">قيمة الكشف:</p>
                    <p className="text-lg font-black text-yellow-400">{order.inspection_amount} ج.م</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <a href={`tel:${order.phone}`} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"><Phone className="w-4 h-4" />اتصال</a>
                  
                  {/* إلغاء */}
                  <button 
                    onClick={() => {
                      const reason = prompt("سبب الإلغاء:");
                      if (reason) updateStatus(order.id, 'cancelled', { technician_note: reason, action_date: new Date().toLocaleString("ar-EG") });
                    }}
                    className="flex-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                    disabled={order.status === 'completed' || order.status === 'cancelled'}
                  >
                    <Trash2 className="w-4 h-4" /> إلغاء
                  </button>
                  
                  {/* كشف بقيمة */}
                  <button 
                    onClick={() => {
                      const amount = prompt("قيمة الكشف:");
                      if (amount && !isNaN(parseFloat(amount))) {
                        updateStatus(order.id, 'inspected', { inspection_amount: parseFloat(amount), technician_note: `كشف بقيمة ${amount} ج.م`, action_date: new Date().toLocaleString("ar-EG") });
                      }
                    }}
                    className="flex-1 bg-yellow-600/20 hover:bg-yellow-600 text-yellow-400 hover:text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                    disabled={order.status === 'completed' || order.status === 'cancelled'}
                  >
                    <Eye className="w-4 h-4" /> كشف بقيمة
                  </button>
                  
                  {/* تأجيل */}
                  <button 
                    onClick={() => {
                      const reason = prompt("سبب التأجيل:");
                      if (reason) updateStatus(order.id, 'deferred', { technician_note: reason, action_date: new Date().toLocaleString("ar-EG") });
                    }}
                    className="flex-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                    disabled={order.status === 'completed' || order.status === 'cancelled'}
                  >
                    <ClockArrowUp className="w-4 h-4" /> تأجيل
                  </button>

                  {/* إضافة تعليق عام */}
                  <button 
                    onClick={() => {
                      setCurrentOrderId(order.id);
                      setCurrentNote(order.technician_note || "");
                      setShowNoteModal(true);
                    }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <StickyNote className="w-4 h-4" /> تعليق
                  </button>

                  {/* تصفية الأوردر (تبقى كما هي) */}
                  {order.status === 'in-progress' && (
                    <button 
                      onClick={() => {
                        setSelectedOrder(order);
                        setSettleForm({ total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, technician_share: 0, company_share: 0 });
                        setShowSettleModal(true);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-900/20"
                    >
                      <CheckCircle2 className="w-4 h-4" /> تصفية الأوردر
                    </button>
                  )}

                  {/* بدء العمل (يبقى كما هي) */}
                  {order.status === 'pending' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'in-progress')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                    >
                      <RefreshCw className="w-4 h-4" /> بدء العمل
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* مودال إضافة تعليق */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-black text-white">إضافة تعليق</h2>
              <button onClick={() => setShowNoteModal(false)} className="p-2 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <textarea
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500"
                rows={4}
                placeholder="اكتب تعليقك هنا..."
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
              />
              <div className="flex gap-2 mt-6">
                <button onClick={addNote} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-2xl transition-all">حفظ التعليق</button>
                <button onClick={() => setShowNoteModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl transition-all">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال تصفية الأوردر (كما هو) */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-black text-white">تصفية الأوردر</h2>
              <button onClick={() => setShowSettleModal(false)} className="p-2 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={submitSettlement} className="p-6 space-y-4">
              <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase pr-2">المبلغ الإجمالي</label><input type="number" required value={settleForm.total_amount} onChange={(e) => handleSettleChange('total_amount', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500" placeholder="0" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase pr-2">قطع الغيار</label><input type="number" value={settleForm.parts_cost} onChange={(e) => handleSettleChange('parts_cost', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500" placeholder="0" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase pr-2">المواصلات</label><input type="number" value={settleForm.transport_cost} onChange={(e) => handleSettleChange('transport_cost', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500" placeholder="0" /></div>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center"><span className="text-xs text-slate-500 font-bold">الصافي</span><span className="text-lg font-black text-green-500">{settleForm.net_amount} ج.م</span></div>
                <div className="h-[1px] bg-slate-800"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center"><p className="text-[10px] text-slate-500 font-bold uppercase">نصيبي (50%)</p><p className="text-md font-black text-purple-500">{settleForm.technician_share} ج.م</p></div>
                  <div className="text-center border-r border-slate-800"><p className="text-[10px] text-slate-500 font-bold uppercase">الشركة (50%)</p><p className="text-md font-black text-blue-500">{settleForm.company_share} ج.م</p></div>
                </div>
              </div>
              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 mt-4">إرسال التقرير وتصفية الأوردر</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
