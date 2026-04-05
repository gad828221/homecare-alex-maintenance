import React, { useState, useCallback, useEffect } from 'react';
import { 
  Wrench, LogOut, Clock, CheckCircle2, AlertCircle, 
  RefreshCw, Phone, MapPin, ClipboardList,
  Calendar, X, Trash2, Eye, ClockArrowUp, StickyNote, DollarSign
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
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'cancel' | 'inspect' | 'defer' | 'note'>('note');
  const [actionValue, setActionValue] = useState("");
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  
  const [settleForm, setSettleForm] = useState({
    total_amount: 0,
    parts_cost: 0,
    transport_cost: 0,
    net_amount: 0,
    technician_share: 0,
    company_share: 0
  });

  // تحديد اسم الفني من الرابط أو من localStorage
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

  // جلب الأوردرات الخاصة بالفني
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

  // دالة تحديث الحالة مع حفظ البيانات الإضافية
  const updateStatus = async (id: number, newStatus: string, extraData = {}) => {
    try {
      await fetchAPI(`orders?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, ...extraData })
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  // معالجة الإجراءات (إلغاء، كشف، تأجيل، تعليق)
  const handleAction = () => {
    if (!currentOrder) return;
    
    const now = new Date().toLocaleString("ar-EG");
    switch (actionType) {
      case 'cancel':
        if (actionValue.trim()) {
          updateStatus(currentOrder.id, 'cancelled', { 
            technician_note: `إلغاء: ${actionValue}`, 
            action_date: now 
          });
        }
        break;
      case 'inspect':
        const amount = parseFloat(actionValue);
        if (!isNaN(amount) && amount > 0) {
          updateStatus(currentOrder.id, 'inspected', { 
            inspection_amount: amount, 
            technician_note: `كشف بقيمة ${amount} ج.م - تم الرفض`, 
            action_date: now 
          });
        }
        break;
      case 'defer':
        if (actionValue.trim()) {
          updateStatus(currentOrder.id, 'deferred', { 
            technician_note: `تأجيل: ${actionValue}`, 
            action_date: now 
          });
        }
        break;
      case 'note':
        if (actionValue.trim()) {
          const oldNote = currentOrder.technician_note || '';
          const newNote = oldNote ? `${oldNote}\n${actionValue}` : actionValue;
          updateStatus(currentOrder.id, currentOrder.status, { 
            technician_note: newNote 
          });
        }
        break;
    }
    setShowActionModal(false);
    setActionValue("");
    setCurrentOrder(null);
  };

  // حساب نصيب الشركة والفني عند التصفية
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
    const message = `✅ تقرير تصفية أوردر\n\nالفني: ${techName}\nالعميل: ${selectedOrder.customer_name}\n\nالإجمالي: ${settleForm.total_amount} ج.م\nقطع غيار: ${settleForm.parts_cost} ج.م\nمواصلات: ${settleForm.transport_cost} ج.م\nالصافي: ${settleForm.net_amount} ج.م\n\nنصيب الشركة: ${settleForm.company_share} ج.م\nنصيب الفني: ${settleForm.technician_share} ج.م`;
    window.open(`https://wa.me/201558625259?text=${encodeURIComponent(message)}`, "_blank");
  };

  const openActionModal = (order: any, type: 'cancel' | 'inspect' | 'defer' | 'note') => {
    setCurrentOrder(order);
    setActionType(type);
    setActionValue('');
    setShowActionModal(true);
  };

  if (loading && orders.length === 0) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <RefreshCw className="w-10 h-10 text-orange-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-slate-200">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">بوابة الفنيين</h1>
              <p className="text-xs text-orange-400 font-mono">{techName}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem("userRole");
              localStorage.removeItem("currentUser");
              setLocation("/login");
            }} 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* الإحصائيات */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/50 rounded-2xl p-4 text-center border border-slate-700">
            <p className="text-2xl font-black text-orange-400">{stats.active}</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">نشط</p>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-4 text-center border border-slate-700">
            <p className="text-2xl font-black text-green-400">{stats.completed}</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">مكتمل</p>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-4 text-center border border-slate-700">
            <p className="text-xl font-black text-emerald-400">{stats.earnings.toLocaleString()} <span className="text-xs">ج.م</span></p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">أرباحي</p>
          </div>
        </div>

        {/* قائمة الأوردرات */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><ClipboardList className="w-5 h-5 text-orange-400" /> أوردراتي</h2>
          
          {orders.map(order => (
            <div key={order.id} className="bg-slate-800/40 rounded-2xl border border-slate-700 overflow-hidden hover:border-orange-500/30 transition-all">
              {/* شريط الحالة العلوي */}
              <div className={`h-1 ${order.status === 'completed' ? 'bg-green-500' : order.status === 'in-progress' ? 'bg-blue-500' : order.status === 'cancelled' ? 'bg-red-500' : order.status === 'deferred' ? 'bg-purple-500' : order.status === 'inspected' ? 'bg-yellow-500' : 'bg-yellow-500'}`}></div>
              
              <div className="p-4 space-y-3">
                {/* رأس البطاقة */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-bold text-lg">{order.customer_name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <p className="text-[11px] text-slate-500 font-mono">{order.date}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    order.status === 'completed' ? 'bg-green-500/20 text-green-400' : 
                    order.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' : 
                    order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 
                    order.status === 'deferred' ? 'bg-purple-500/20 text-purple-400' : 
                    order.status === 'inspected' ? 'bg-yellow-500/20 text-yellow-400' : 
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {order.status === 'completed' ? 'مكتمل' : 
                     order.status === 'in-progress' ? 'جاري العمل' : 
                     order.status === 'cancelled' ? 'ملغي' : 
                     order.status === 'deferred' ? 'مؤجل' : 
                     order.status === 'inspected' ? 'تم الكشف' : 'قيد الانتظار'}
                  </span>
                </div>

                {/* تفاصيل الجهاز والعنوان */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2"><Wrench className="w-3.5 h-3.5 text-orange-400" /><span className="text-slate-300">{order.device_type || 'جهاز'} - {order.brand || 'ماركة'}</span></div>
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-orange-400" /><span className="text-slate-300 truncate">{order.address || 'لا يوجد عنوان'}</span></div>
                </div>
                {order.problem_description && <p className="text-xs text-slate-400 bg-slate-800/50 p-2 rounded-lg">⚠️ {order.problem_description}</p>}
                
                {/* تعليق الفني (إن وجد) */}
                {order.technician_note && (
                  <div className="bg-slate-800/70 p-2 rounded-lg border-r-2 border-orange-500">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">📝 تعليقك</p>
                    <p className="text-sm text-slate-200 whitespace-pre-wrap">{order.technician_note}</p>
                  </div>
                )}
                
                {/* مبلغ الكشف (إن وجد) */}
                {order.inspection_amount > 0 && (
                  <div className="bg-yellow-500/10 p-2 rounded-lg flex justify-between items-center">
                    <span className="text-xs text-yellow-400">💰 كشف بقيمة</span>
                    <span className="text-lg font-bold text-yellow-400">{order.inspection_amount} ج.م</span>
                  </div>
                )}

                {/* أزرار الإجراءات */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <a href={`tel:${order.phone}`} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition-all"><Phone className="w-4 h-4" /> اتصل</a>
                  
                  {order.status === 'pending' && (
                    <button onClick={() => updateStatus(order.id, 'in-progress')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition-all">▶ بدء العمل</button>
                  )}
                  
                  {order.status === 'in-progress' && (
                    <button onClick={() => { setSelectedOrder(order); setSettleForm({ total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, technician_share: 0, company_share: 0 }); setShowSettleModal(true); }} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition-all"><CheckCircle2 className="w-4 h-4" /> تصفية</button>
                  )}
                  
                  <button onClick={() => openActionModal(order, 'inspect')} className="flex-1 bg-yellow-600/30 hover:bg-yellow-600 text-yellow-300 text-sm font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition-all"><Eye className="w-4 h-4" /> كشف</button>
                  <button onClick={() => openActionModal(order, 'defer')} className="flex-1 bg-purple-600/30 hover:bg-purple-600 text-purple-300 text-sm font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition-all"><ClockArrowUp className="w-4 h-4" /> تأجيل</button>
                  <button onClick={() => openActionModal(order, 'cancel')} className="flex-1 bg-red-600/30 hover:bg-red-600 text-red-300 text-sm font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition-all"><Trash2 className="w-4 h-4" /> إلغاء</button>
                  <button onClick={() => openActionModal(order, 'note')} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition-all"><StickyNote className="w-4 h-4" /> تعليق</button>
                </div>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700">
              <p className="text-slate-400">لا توجد أوردرات حالياً</p>
            </div>
          )}
        </div>
      </main>

      {/* مودال إجراءات الفني (إلغاء، كشف، تأجيل، تعليق) */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowActionModal(false)}>
          <div className="bg-slate-800 rounded-2xl max-w-md w-full p-5 border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {actionType === 'cancel' && 'إلغاء الأوردر'}
                {actionType === 'inspect' && 'كشف بقيمة'}
                {actionType === 'defer' && 'تأجيل الأوردر'}
                {actionType === 'note' && 'إضافة تعليق'}
              </h2>
              <button onClick={() => setShowActionModal(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              {actionType === 'inspect' ? (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">💰 قيمة الكشف (ج.م)</label>
                  <input type="number" value={actionValue} onChange={(e) => setActionValue(e.target.value)} placeholder="مثال: 300" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500" autoFocus />
                  <p className="text-xs text-slate-500 mt-2">سيتم حفظ المبلغ مع تعليق "تم الكشف والرفض"</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    {actionType === 'cancel' && '📝 سبب الإلغاء'}
                    {actionType === 'defer' && '⏰ سبب التأجيل'}
                    {actionType === 'note' && '✏️ نص التعليق'}
                  </label>
                  <textarea rows={3} value={actionValue} onChange={(e) => setActionValue(e.target.value)} placeholder={actionType === 'note' ? 'اكتب ملاحظتك هنا...' : 'اكتب السبب...'} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500" autoFocus />
                </div>
              )}
              <button onClick={handleAction} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition-all">تأكيد</button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تصفية الأوردر (كما هو) */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={() => setShowSettleModal(false)}>
          <div className="bg-slate-800 rounded-2xl max-w-md w-full p-5 border border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">تصفية الأوردر</h2>
              <button onClick={() => setShowSettleModal(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitSettlement} className="space-y-4">
              <div><label className="block text-sm text-slate-400 mb-1">💰 المبلغ الإجمالي</label><input type="number" required value={settleForm.total_amount} onChange={(e) => handleSettleChange('total_amount', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-slate-400 mb-1">🛠️ قطع غيار</label><input type="number" value={settleForm.parts_cost} onChange={(e) => handleSettleChange('parts_cost', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white" /></div>
                <div><label className="block text-sm text-slate-400 mb-1">🚗 مواصلات</label><input type="number" value={settleForm.transport_cost} onChange={(e) => handleSettleChange('transport_cost', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white" /></div>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl space-y-2">
                <div className="flex justify-between"><span className="text-slate-400">الصافي:</span><span className="text-green-400 font-bold">{settleForm.net_amount} ج.م</span></div>
                <div className="flex justify-between"><span className="text-slate-400">نصيبك (50%):</span><span className="text-purple-400 font-bold">{settleForm.technician_share} ج.م</span></div>
                <div className="flex justify-between"><span className="text-slate-400">نصيب الشركة:</span><span className="text-blue-400 font-bold">{settleForm.company_share} ج.م</span></div>
              </div>
              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition-all">تأكيد التصفية</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
