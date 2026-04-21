import React, { useState, useCallback, useEffect } from 'react';
import { 
  Wrench, LogOut, Clock, CheckCircle2, AlertCircle, 
  RefreshCw, Phone, MapPin, ClipboardList,
  Calendar, X, Trash2, Eye, ClockArrowUp, StickyNote,
  Play, FileCheck, DollarSign, CalendarX, Ban, MessageSquare
} from "lucide-react";
import { useLocation } from "wouter";
import { useNotification } from "../components/EnhancedNotificationSystem"; // ✅ تغيير الاستيراد
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';
const supabase = createClient(supabaseUrl, supabaseKey);

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
  const { addNotification } = useNotification();
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [techName, setTechName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [stats, setStats] = useState({ active: 0, completed: 0, earnings: 0 });
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedOrderForActions, setSelectedOrderForActions] = useState<any>(null);
  const [actionType, setActionType] = useState<'cancel' | 'inspect' | 'defer' | 'note'>('note');
  const [actionValue, setActionValue] = useState("");
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  
  const [technicianPercentage, setTechnicianPercentage] = useState(50);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [filterDevice, setFilterDevice] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [showFilters, setShowFilters] = useState(false);
  
  const [settleForm, setSettleForm] = useState({
    total_amount: 0,
    parts_cost: 0,
    transport_cost: 0,
    net_amount: 0,
    technician_share: 0,
    company_share: 0
  });

  // التحقق من الجلسة
  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const currentUser = localStorage.getItem("currentUser");
    if (userRole === "tech" && currentUser) {
      const user = JSON.parse(currentUser);
      if (user.techName) setTechName(user.techName);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const nameFromUrl = params.get("name");
    if (nameFromUrl) {
      setTechName(decodeURIComponent(nameFromUrl));
    } else {
      window.location.href = "/login";
    }
  }, []);

  // ✅ دالة إخفاء رقم الهاتف (تعمل بشكل صحيح)
  const isPhoneHidden = (order: any) => {
    return order.status === 'completed' || order.status === 'cancelled' || order.status === 'inspected';
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0')) cleaned = '+20' + cleaned.substring(1);
    else if (cleaned.startsWith('1') && cleaned.length === 10) cleaned = '+20' + cleaned;
    else if (!cleaned.startsWith('+')) cleaned = '+20' + cleaned;
    return cleaned;
  };

  const notifyAdmin = async (action: string, order: any, details: string = "") => {
    try {
      await fetch(`${supabaseUrl}/rest/v1/notifications`, {
        method: 'POST',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action,
          details: `الفني: ${techName}\nالأوردر: ${order.order_number}\nالعميل: ${order.customer_name}\n${details}`,
          user_name: 'نظام',
          created_at: new Date().toISOString()
        })
      });
    } catch (err) { console.error(err); }
    const message = `🔔 *تنبيه إداري* 🔔\n━━━━━━━━━━━━━━━━━━━━━━\n👤 *الفني:* ${techName}\n🔢 *كود الأوردر:* ${order.order_number}\n👤 *العميل:* ${order.customer_name}\n📋 *الإجراء:* ${action}\n${details ? `📝 *التفاصيل:* ${details}\n` : ''}\n⏰ *الوقت:* ${new Date().toLocaleString("ar-EG")}\n\nيرجى المراجعة من لوحة التحكم.`;
    window.open(`https://wa.me/201558625259?text=${encodeURIComponent(message)}`, '_blank');
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role === "tech" && user.techName) setTechName(user.techName);
    }
  }, []);

  useEffect(() => {
    const checkActiveStatus = async () => {
      if (!techName) return;
      try {
        const data = await fetchAPI(`technicians?select=is_active&name=eq.${encodeURIComponent(techName)}`);
        if (data && data[0]) setIsActive(data[0].is_active !== false);
      } catch (err) { console.error(err); }
    };
    checkActiveStatus();
  }, [techName]);

  const fetchTechnicianPercentage = useCallback(async () => {
    if (!techName) return;
    try {
      const data = await fetchAPI(`technicians?select=profit_percentage&name=eq.${encodeURIComponent(techName)}`);
      if (data && data[0] && typeof data[0].profit_percentage === 'number') setTechnicianPercentage(data[0].profit_percentage);
      else setTechnicianPercentage(50);
    } catch (err) { console.error(err); }
  }, [techName]);

  const fetchData = useCallback(async () => {
    if (!techName || !isActive) return;
    try {
      const data = await fetchAPI(`orders?technician=eq.${encodeURIComponent(techName)}&order=created_at.desc`);
      setOrders(data);
      const active = data.filter((o: any) => o.status === 'pending' || o.status === 'in-progress').length;
      const completed = data.filter((o: any) => o.status === 'completed').length;
      const earnings = data.filter((o: any) => o.status === 'completed').reduce((acc: number, o: any) => acc + (o.technician_share || 0), 0);
      setStats({ active, completed, earnings });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [techName, isActive]);

  useEffect(() => {
    if (isActive) {
      fetchData();
      fetchTechnicianPercentage();
    }
    const interval = setInterval(() => { if (isActive) { fetchData(); fetchTechnicianPercentage(); } }, 30000);
    return () => clearInterval(interval);
  }, [fetchData, fetchTechnicianPercentage, isActive]);

  // Realtime subscription
  useEffect(() => {
    if (!techName) return;
    const subscription = supabase
      .channel('orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `technician=eq.${techName}` }, (payload) => {
        console.log('تغيير في الأوردرات:', payload);
        fetchData();
        if (payload.eventType === 'INSERT') {
          addNotification({ type: 'info', title: '📢 أوردر جديد', message: `تم إضافة أوردر جديد للعميل ${payload.new.customer_name}`, duration: 5000 });
        } else if (payload.eventType === 'UPDATE') {
          addNotification({ type: 'warning', title: '🔄 تحديث أوردر', message: `تم تحديث بيانات الأوردر رقم ${payload.new.order_number}`, duration: 4000 });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [techName, addNotification, fetchData]);

  const updateStatus = async (id: number, newStatus: string, extraData = {}) => {
    try {
      const oldOrder = orders.find(o => o.id === id);
      const updateData: any = { status: newStatus, ...extraData };
      if (newStatus === 'completed' && oldOrder?.status !== 'completed') updateData.completed_at = new Date().toISOString();
      await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(updateData) });
      addNotification({ type: 'success', title: '✅ تم التحديث', message: 'تم حفظ التغييرات وإرسال إشعار للمدير', duration: 3000 });
      fetchData();
      if (oldOrder && oldOrder.status !== newStatus) {
        let statusAr = newStatus;
        if (newStatus === 'completed') statusAr = "تم التنفيذ ✅";
        if (newStatus === 'cancelled') statusAr = "ملغي ❌";
        if (newStatus === 'inspected') statusAr = "تم الكشف 💰";
        if (newStatus === 'deferred') statusAr = "مؤجل ⏰";
        notifyAdmin(`تغيير حالة الأوردر إلى: ${statusAr}`, oldOrder);
      }
    } catch (err) { console.error(err); }
  };

  const handleInspection = (order: any, amount: number) => {
    const total = amount;
    const companyShare = Math.round(total * (100 - technicianPercentage) / 100);
    const techShare = total - companyShare;
    updateStatus(order.id, 'inspected', {
      total_amount: total, parts_cost: 0, transport_cost: 0, net_amount: total,
      company_share: companyShare, technician_share: techShare,
      technician_note: `كشف بقيمة ${total} ج.م`, action_date: new Date().toLocaleString("ar-EG"), invoice_approved: false
    });
    notifyAdmin("💰 كشف جديد", order, `المبلغ: ${total} ج.م`);
  };

  const handleCancel = (order: any, reason: string) => {
    updateStatus(order.id, 'cancelled', { technician_note: `إلغاء: ${reason}`, action_date: new Date().toISOString() });
    notifyAdmin("✖️ إلغاء الطلب", order, `السبب: ${reason}`);
  };

  const handleDefer = (order: any, reason: string) => {
    updateStatus(order.id, 'deferred', { technician_note: `تأجيل: ${reason}`, action_date: new Date().toISOString() });
    notifyAdmin("⏰ تأجيل الطلب", order, `السبب: ${reason}`);
  };

  const handleNote = (order: any, note: string) => {
    const oldNote = order.technician_note || '';
    const newNote = oldNote ? `${oldNote}\n${note}` : note;
    updateStatus(order.id, order.status, { technician_note: newNote });
    notifyAdmin("📝 ملاحظة فنية", order, `المحتوى: ${note}`);
  };

  const handleSettleChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updated = { ...settleForm, [field]: numValue };
    const net = updated.total_amount - updated.parts_cost - updated.transport_cost;
    const techShare = Math.round(net * (technicianPercentage / 100));
    const companyShare = net - techShare;
    setSettleForm({ ...updated, net_amount: net, technician_share: techShare, company_share: companyShare });
  };

  const openSettleModal = async (order: any) => {
    await fetchTechnicianPercentage();
    setSelectedOrder(order);
    setSettleForm({
      total_amount: order.total_amount || 0, parts_cost: order.parts_cost || 0, transport_cost: order.transport_cost || 0,
      net_amount: order.net_amount || 0, technician_share: order.technician_share || 0, company_share: order.company_share || 0
    });
    setShowSettleModal(true);
  };

  const submitSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateStatus(selectedOrder.id, 'completed', { ...settleForm, invoice_approved: false });
    setShowSettleModal(false);
    notifyAdmin("✅ تصفية الأوردر (إكمال)", selectedOrder, `المبلغ: ${settleForm.total_amount} ج.م | قطع غيار: ${settleForm.parts_cost} ج.م | مواصلات: ${settleForm.transport_cost} ج.م`);
    alert("✅ تم إكمال الأوردر وانتظار موافقة المدير على الفاتورة.");
  };

  const openActionModal = (order: any, type: 'cancel' | 'inspect' | 'defer' | 'note') => {
    setCurrentOrder(order);
    setActionType(type);
    setActionValue('');
    setShowActionModal(true);
  };

  const confirmAction = () => {
    if (!currentOrder) return;
    switch (actionType) {
      case 'cancel': if (actionValue.trim()) handleCancel(currentOrder, actionValue); break;
      case 'inspect': const amount = parseFloat(actionValue); if (!isNaN(amount) && amount > 0) handleInspection(currentOrder, amount); break;
      case 'defer': if (actionValue.trim()) handleDefer(currentOrder, actionValue); break;
      case 'note': if (actionValue.trim()) handleNote(currentOrder, actionValue); break;
    }
    setShowActionModal(false);
    setActionValue("");
    setCurrentOrder(null);
  };

  if (!isActive) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-6 rounded-2xl text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">حساب غير نشط</h2>
          <p>حسابك غير نشط حالياً. يرجى التواصل مع الإدارة لتفعيله.</p>
        </div>
      </div>
    );
  }

  if (loading && orders.length === 0) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <div className="bg-slate-800/80 border-b border-slate-700 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3"><Wrench className="w-6 h-6 text-orange-400" /><div><h1 className="text-lg font-bold text-white">بوابة الفنيين</h1><p className="text-xs text-orange-400">{techName}</p></div></div>
          <button onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.href = "/login"; }} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><LogOut className="w-5 h-5" /></button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 space-y-5">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-orange-400">{stats.active}</div><div className="text-xs text-slate-400">نشط</div></div>
          <div className="bg-slate-800 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-green-400">{stats.completed}</div><div className="text-xs text-slate-400">مكتمل</div></div>
          <div className="bg-slate-800 rounded-xl p-3 text-center"><div className="text-xl font-bold text-emerald-400">{stats.earnings.toLocaleString()} ج.م</div><div className="text-xs text-slate-400">أرباحي</div></div>
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          <h2 className="text-md font-semibold text-white flex items-center gap-2"><ClipboardList className="w-4 h-4 text-orange-400" /> أوردراتي</h2>
          {orders.map(order => (
            <div key={order.id} className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
              <div className={`h-1 ${order.status === 'completed' ? 'bg-green-500' : order.status === 'in-progress' ? 'bg-blue-500' : order.status === 'cancelled' ? 'bg-red-500' : order.status === 'deferred' ? 'bg-purple-500' : order.status === 'inspected' ? 'bg-yellow-500' : 'bg-yellow-500'}`}></div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div><div className="font-bold text-white">{order.customer_name}</div><div className="text-[11px] text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {order.date}</div></div>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.status === 'completed' ? 'bg-green-500/20 text-green-400' : order.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' : order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : order.status === 'deferred' ? 'bg-purple-500/20 text-purple-400' : order.status === 'inspected' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {order.status === 'completed' ? 'مكتمل' : order.status === 'in-progress' ? 'جاري العمل' : order.status === 'cancelled' ? 'ملغي' : order.status === 'deferred' ? 'مؤجل' : order.status === 'inspected' ? 'تم الكشف' : 'قيد الانتظار'}
                  </div>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div>🔧 {order.device_type || 'جهاز'} - {order.brand || 'ماركة'}</div>
                  <div className="flex items-start gap-1"><MapPin className="w-3 h-3 text-slate-500 mt-0.5" /> {order.address || 'لا يوجد عنوان'}</div>
                  {order.problem_description && <div className="text-slate-400">⚠️ {order.problem_description}</div>}
                </div>
                {order.technician_note && (
                  <div className="bg-slate-800 p-2 rounded-lg text-xs"><span className="text-slate-400">📝 ملاحظتك:</span> {order.technician_note}</div>
                )}

                {/* ✅ الأزرار - ترتيب صحيح */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {/* زر الاتصال - يظهر فقط إذا لم يكن مخفياً */}
                  {!isPhoneHidden(order) ? (
                    <a href={`tel:${order.phone}`} className="flex-1 bg-slate-700 hover:bg-slate-600 text-center text-sm font-medium py-2 rounded-lg transition flex items-center justify-center gap-1">
                      <Phone className="w-4 h-4" /> اتصل
                    </a>
                  ) : (
                    <div className="flex-1 bg-slate-800 text-slate-500 text-center text-sm font-medium py-2 rounded-lg cursor-not-allowed flex items-center justify-center gap-1">
                      <Phone className="w-4 h-4" /> غير متاح
                    </div>
                  )}

                  {/* بدء العمل - يظهر فقط للأوردرات الجديدة */}
                  {order.status === 'pending' && (
                    <button onClick={() => updateStatus(order.id, 'in-progress')} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium py-2 rounded-lg transition flex items-center justify-center gap-1 shadow-lg shadow-blue-900/20">
                      <Play className="w-4 h-4" /> بدء العمل
                    </button>
                  )}

                  {/* إجراءات - يظهر للأوردرات قيد التنفيذ فقط */}
                  {order.status === 'in-progress' && (
                    <button onClick={() => { setSelectedOrderForActions(order); setShowActionsModal(true); }} className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-sm font-medium py-2 rounded-lg transition flex items-center justify-center gap-1 shadow-lg shadow-orange-900/20">
                      <FileCheck className="w-4 h-4" /> إجراءات
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {orders.length === 0 && <div className="text-center py-8 text-slate-400">لا توجد أوردرات</div>}
        </div>
      </main>

      {/* Action Modal (كشف، إلغاء، تأجيل، ملاحظة) */}
      {showActionModal && currentOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between mb-4"><h3 className="text-xl font-bold text-white">
              {actionType === 'cancel' && 'إلغاء الأوردر'}
              {actionType === 'inspect' && 'كشف بقيمة'}
              {actionType === 'defer' && 'تأجيل الأوردر'}
              {actionType === 'note' && 'إضافة ملاحظة'}
            </h3><button onClick={() => setShowActionModal(false)} className="text-slate-400"><X className="w-5 h-5" /></button></div>
            <div className="space-y-4">
              {actionType === 'inspect' ? (
                <input type="number" placeholder="المبلغ (ج.م)" value={actionValue} onChange={e => setActionValue(e.target.value)} className="w-full p-2 bg-slate-700 rounded-lg text-white" autoFocus />
              ) : (
                <textarea placeholder={actionType === 'note' ? "اكتب الملاحظة..." : "اكتب السبب..."} rows={3} value={actionValue} onChange={e => setActionValue(e.target.value)} className="w-full p-2 bg-slate-700 rounded-lg text-white" autoFocus />
              )}
              <button onClick={confirmAction} className="w-full bg-orange-600 hover:bg-orange-700 py-2 rounded-lg font-bold text-white">تأكيد</button>
            </div>
          </div>
        </div>
      )}

      {/* Actions Modal (قائمة الإجراءات) */}
      {showActionsModal && selectedOrderForActions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowActionsModal(false)}>
          <div className="bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">إجراءات الأوردر</h2>
              <button onClick={() => setShowActionsModal(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <button onClick={() => { openSettleModal(selectedOrderForActions); setShowActionsModal(false); }} className="w-full text-right px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center gap-3 transition-all">
                <FileCheck className="w-5 h-5 text-green-400" /> تصفية الأوردر
              </button>
              <button onClick={() => { openActionModal(selectedOrderForActions, 'inspect'); setShowActionsModal(false); }} className="w-full text-right px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center gap-3 transition-all">
                <DollarSign className="w-5 h-5 text-yellow-400" /> كشف بقيمة
              </button>
              <button onClick={() => { openActionModal(selectedOrderForActions, 'defer'); setShowActionsModal(false); }} className="w-full text-right px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center gap-3 transition-all">
                <CalendarX className="w-5 h-5 text-purple-400" /> تأجيل
              </button>
              <button onClick={() => { openActionModal(selectedOrderForActions, 'cancel'); setShowActionsModal(false); }} className="w-full text-right px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center gap-3 transition-all">
                <Ban className="w-5 h-5 text-red-400" /> إلغاء
              </button>
              <button onClick={() => { openActionModal(selectedOrderForActions, 'note'); setShowActionsModal(false); }} className="w-full text-right px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center gap-3 transition-all">
                <StickyNote className="w-5 h-5 text-blue-400" /> إضافة ملاحظة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Modal */}
      {showSettleModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between mb-4"><h3 className="text-xl font-bold text-white">تصفية الأوردر</h3><button onClick={() => setShowSettleModal(false)} className="text-slate-400"><X className="w-5 h-5" /></button></div>
            <form onSubmit={submitSettlement} className="space-y-4">
              <div><label className="text-sm text-slate-400">المبلغ الإجمالي</label><input type="number" value={settleForm.total_amount} onChange={(e) => handleSettleChange('total_amount', e.target.value)} className="w-full p-2 bg-slate-700 rounded-lg text-white" required /></div>
              <div><label className="text-sm text-slate-400">قطع غيار</label><input type="number" value={settleForm.parts_cost} onChange={(e) => handleSettleChange('parts_cost', e.target.value)} className="w-full p-2 bg-slate-700 rounded-lg text-white" /></div>
              <div><label className="text-sm text-slate-400">مواصلات</label><input type="number" value={settleForm.transport_cost} onChange={(e) => handleSettleChange('transport_cost', e.target.value)} className="w-full p-2 bg-slate-700 rounded-lg text-white" /></div>
              <div className="bg-slate-700 p-3 rounded-lg space-y-2">
                <div className="flex justify-between"><span className="text-slate-300">الصافي:</span><span className="text-white font-bold">{settleForm.net_amount} ج.م</span></div>
                <div className="flex justify-between"><span className="text-slate-300">نصيب الفني ({technicianPercentage}%):</span><span className="text-green-400 font-bold">{settleForm.technician_share} ج.م</span></div>
                <div className="flex justify-between"><span className="text-slate-300">نصيب الشركة:</span><span className="text-orange-400 font-bold">{settleForm.company_share} ج.م</span></div>
              </div>
              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 py-2 rounded-lg font-bold text-white">تأكيد التصفية</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
