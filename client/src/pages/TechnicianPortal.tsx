import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Wrench, LogOut, Clock, CheckCircle2, AlertCircle, 
  RefreshCw, Phone, MapPin, ClipboardList,
  Calendar, X, Trash2, Eye, ClockArrowUp, StickyNote,
  Play, FileCheck, DollarSign, CalendarX, Ban, MessageSquare,
  TrendingUp, Award, Filter, ChevronDown, ChevronUp
} from "lucide-react";
import { useLocation } from "wouter";
import { useNotification } from "../components/EnhancedNotificationSystem"; // ✅ تغيير الاستيراد
import { createClient } from '@supabase/supabase-js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

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

  const isPhoneHidden = (order: any) => {
    if (order.status === 'completed' || order.status === 'cancelled' || order.status === 'inspected') return true;
    return false;
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

  // Advanced stats
  const advancedStats = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.technician_share || 0), 0);
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOrders = completedOrders.filter(o => o.completed_at?.startsWith(dateStr));
      const earnings = dayOrders.reduce((sum, o) => sum + (o.technician_share || 0), 0);
      return { date: dateStr, earnings };
    }).reverse();
    // Ranking simulation (can be improved later)
    const fetchRanking = async () => {
      try {
        const allTechs = await fetchAPI('technicians?select=name');
        const allOrders = await fetchAPI('orders?select=technician,technician_share,status');
        const techEarnings = allTechs.map((tech: any) => ({
          name: tech.name,
          earnings: allOrders.filter((o: any) => o.technician === tech.name && o.status === 'completed').reduce((s: number, o: any) => s + (o.technician_share || 0), 0)
        }));
        techEarnings.sort((a, b) => b.earnings - a.earnings);
        const rank = techEarnings.findIndex(t => t.name === techName) + 1;
        const total = techEarnings.length;
        setRanking({ rank, total });
      } catch (err) { console.error(err); }
    };
    fetchRanking();
    return { last7Days, totalEarnings };
  }, [orders, techName]);

  const [ranking, setRanking] = useState({ rank: 0, total: 0 });

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...orders];
    if (filterStatus !== 'all') filtered = filtered.filter(o => o.status === filterStatus);
    if (filterDate !== 'all') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
      if (filterDate === 'today') filtered = filtered.filter(o => o.date === today);
      else if (filterDate === 'week') filtered = filtered.filter(o => o.date >= weekAgo);
      else if (filterDate === 'month') filtered = filtered.filter(o => o.date >= monthAgo);
    }
    if (filterDevice !== 'all') filtered = filtered.filter(o => o.device_type === filterDevice);
    if (filterPriority !== 'all' && filtered.some(o => o.priority)) filtered = filtered.filter(o => o.priority === filterPriority);
    if (sortBy === 'latest') filtered.sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime());
    else if (sortBy === 'oldest') filtered.sort((a, b) => new Date(a.created_at || a.date).getTime() - new Date(b.created_at || b.date).getTime());
    else if (sortBy === 'most_delayed') filtered.sort((a, b) => (b.delay_days || 0) - (a.delay_days || 0));
    return filtered;
  }, [orders, filterStatus, filterDate, filterDevice, filterPriority, sortBy]);

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

  const deviceTypes = ['all', ...new Set(orders.map(o => o.device_type).filter(Boolean))];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <div className="bg-slate-800/80 border-b border-slate-700 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3"><Wrench className="w-6 h-6 text-orange-400" /><div><h1 className="text-lg font-bold text-white">بوابة الفنيين</h1><p className="text-xs text-orange-400">{techName}</p></div></div>
          <button onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.href = "/login"; }} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><LogOut className="w-5 h-5" /></button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 space-y-5">
        {/* Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-start"><div><p className="text-blue-100 text-sm">الأوردرات النشطة</p><p className="text-3xl font-bold">{stats.active}</p></div><Clock className="w-8 h-8 opacity-50" /></div>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-start"><div><p className="text-green-100 text-sm">الأوردرات المكتملة</p><p className="text-3xl font-bold">{stats.completed}</p></div><CheckCircle2 className="w-8 h-8 opacity-50" /></div>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-start"><div><p className="text-orange-100 text-sm">إجمالي أرباحي</p><p className="text-2xl font-bold">{stats.earnings.toLocaleString()} ج.م</p></div><DollarSign className="w-8 h-8 opacity-50" /></div>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-start"><div><p className="text-purple-100 text-sm">ترتيبي بين الفنيين</p><p className="text-2xl font-bold">{ranking.rank ? `#${ranking.rank}` : 'جاري...'}</p><p className="text-xs text-purple-200">من أصل {ranking.total} فني</p></div><Award className="w-8 h-8 opacity-50" /></div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-orange-400" /> أرباح آخر 7 أيام</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={advancedStats.last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }} formatter={(value) => [`${value} ج.م`, 'الأرباح']} />
              <Line type="monotone" dataKey="earnings" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Filters & Sorting */}
        <div className="bg-slate-800 rounded-xl p-3">
          <button onClick={() => setShowFilters(!showFilters)} className="w-full flex justify-between items-center text-white font-medium py-2">
            <span className="flex items-center gap-2"><Filter className="w-4 h-4" /> فلترة وترتيب</span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 pt-3 border-t border-slate-700">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-700 p-2 rounded-lg text-sm"><option value="all">جميع الحالات</option><option value="pending">قيد الانتظار</option><option value="in-progress">قيد التنفيذ</option><option value="inspected">تم الكشف</option><option value="completed">مكتمل</option><option value="cancelled">ملغي</option><option value="deferred">مؤجل</option></select>
              <select value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bg-slate-700 p-2 rounded-lg text-sm"><option value="all">جميع التواريخ</option><option value="today">اليوم</option><option value="week">آخر 7 أيام</option><option value="month">آخر 30 يوماً</option></select>
              <select value={filterDevice} onChange={e => setFilterDevice(e.target.value)} className="bg-slate-700 p-2 rounded-lg text-sm"><option value="all">جميع الأجهزة</option>{deviceTypes.filter(d => d !== 'all').map(d => <option key={d}>{d}</option>)}</select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-slate-700 p-2 rounded-lg text-sm"><option value="latest">الأحدث أولاً</option><option value="oldest">الأقدم أولاً</option><option value="most_delayed">الأكثر تأخيراً</option></select>
              <button onClick={() => { setFilterStatus('all'); setFilterDate('all'); setFilterDevice('all'); setSortBy('latest'); }} className="bg-slate-700 text-slate-300 p-2 rounded-lg text-sm">إعادة ضبط</button>
            </div>
          )}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredAndSortedOrders.map(order => (
            <div key={order.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-lg">{order.customer_name}</h3>
                  <p className="text-xs text-slate-400">رقم: {order.order_number}</p>
                </div>
                <div className="flex gap-1">
                  {order.status === 'pending' && <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded text-xs">جديد</span>}
                  {order.status === 'in-progress' && <span className="bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded text-xs">قيد التنفيذ</span>}
                  {order.status === 'inspected' && <span className="bg-purple-500/20 text-purple-500 px-2 py-0.5 rounded text-xs">تم الكشف</span>}
                  {order.status === 'completed' && <span className="bg-green-500/20 text-green-500 px-2 py-0.5 rounded text-xs">مكتمل</span>}
                  {order.status === 'cancelled' && <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-xs">ملغي</span>}
                  {order.status === 'deferred' && <span className="bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded text-xs">مؤجل</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                <div className="flex items-center gap-2 text-slate-300"><Phone className="w-4 h-4" /> <span className="font-mono">{order.phone}</span></div>
                <div className="flex items-center gap-2 text-slate-300"><Wrench className="w-4 h-4" /> {order.device_type} - {order.brand}</div>
                <div className="flex items-center gap-2 text-slate-300 col-span-2"><MapPin className="w-4 h-4" /> {order.address}</div>
                <div className="flex items-center gap-2 text-slate-300 col-span-2"><ClipboardList className="w-4 h-4" /> {order.problem_description}</div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'deferred' && (
                  <>
                    <button onClick={() => updateStatus(order.id, 'in-progress')} className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"><Play className="w-4 h-4" /> بدء العمل</button>
                    <button onClick={() => openActionModal(order, 'inspect')} className="bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"><DollarSign className="w-4 h-4" /> كشف بقيمة</button>
                    <button onClick={() => openSettleModal(order)} className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"><FileCheck className="w-4 h-4" /> تصفية الأوردر</button>
                    <button onClick={() => openActionModal(order, 'defer')} className="bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"><CalendarX className="w-4 h-4" /> تأجيل</button>
                    <button onClick={() => openActionModal(order, 'cancel')} className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"><Ban className="w-4 h-4" /> إلغاء</button>
                    <button onClick={() => openActionModal(order, 'note')} className="bg-slate-600 hover:bg-slate-500 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"><StickyNote className="w-4 h-4" /> إضافة ملاحظة</button>
                  </>
                )}
                {order.status === 'inspected' && (
                  <button onClick={() => openSettleModal(order)} className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"><FileCheck className="w-4 h-4" /> تصفية الأوردر</button>
                )}
                {order.status === 'completed' && (
                  <div className="text-green-400 text-sm flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> تم الإكمال - في انتظار مراجعة المدير</div>
                )}
                {order.status === 'deferred' && (
                  <div className="text-orange-400 text-sm flex items-center gap-1"><ClockArrowUp className="w-4 h-4" /> مؤجل حتى إشعار آخر</div>
                )}
                {order.status === 'cancelled' && (
                  <div className="text-red-400 text-sm flex items-center gap-1"><Ban className="w-4 h-4" /> ملغي</div>
                )}
              </div>
              {order.technician_note && (
                <div className="mt-3 bg-slate-700/50 p-2 rounded-lg text-xs text-slate-300"><MessageSquare className="w-3 h-3 inline ml-1" /> {order.technician_note}</div>
              )}
            </div>
          ))}
          {filteredAndSortedOrders.length === 0 && (
            <div className="text-center py-8 text-slate-400">لا توجد أوردرات متاحة</div>
          )}
        </div>
      </main>

      {/* Action Modal */}
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
