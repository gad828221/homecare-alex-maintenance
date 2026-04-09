import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Plus, Download, Search, LayoutDashboard, Users, 
  Clock, CheckCircle2, AlertCircle, XCircle, 
  Edit, Trash2, RefreshCw, Phone,
  TrendingUp, Wallet, PieChart, Calendar, Copy, Check, MapPin, Filter, MoreVertical
} from "lucide-react";
import { useNotification } from "./NotificationSystem";

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

export default function ProtectedOrders() {
  const { addNotification } = useNotification();
  const [orders, setOrders] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'technicians' | 'reports' | 'invoices' | 'cash'>('orders');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingTech, setEditingTech] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    customer_name: '', phone: '', device: '', address: '', brand: '', problem: '', technician: '',
    status: 'pending', total_amount: 0, expenses: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false
  });

  const [customDevice, setCustomDevice] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [isOtherDevice, setIsOtherDevice] = useState(false);
  const [isOtherBrand, setIsOtherBrand] = useState(false);
  
  const [techForm, setTechForm] = useState({ name: '', phone: '', specialization: '', is_active: true });
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, cancelled: 0, totalIncome: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // --- نظام الخزنة (يدوي بالكامل) ---
  const [cashLedger, setCashLedger] = useState<any[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashType, setCashType] = useState<'company_profit' | 'expense' | 'technician_payment'>('company_profit');
  const [cashAmount, setCashAmount] = useState(0);
  const [cashDesc, setCashDesc] = useState('');
  const [selectedTechForPayment, setSelectedTechForPayment] = useState('');

  // جلب سجل الخزنة
  const fetchCashLedger = useCallback(async () => {
    try {
      const data = await fetchAPI('cash_ledger?select=*&order=date.desc');
      setCashLedger(data);
      const balance = data.reduce((acc: number, entry: any) => {
        if (entry.type === 'company_profit') return acc + entry.amount;
        return acc - entry.amount;
      }, 0);
      setCashBalance(balance);
    } catch (err) { console.error(err); }
  }, []);

  // تسجيل حركة جديدة (إيراد شركة، مصروف، أو دفع للفني)
  const addCashEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cashAmount <= 0) return;
    try {
      await fetchAPI('cash_ledger', {
        method: 'POST',
        body: JSON.stringify({
          type: cashType,
          amount: cashAmount,
          description: cashDesc,
          related_technician_id: cashType === 'technician_payment' ? selectedTechForPayment : null,
          date: new Date().toISOString().split('T')[0]
        })
      });
      addNotification({ type: 'success', title: '✅ تم التسجيل', message: `تم تسجيل الحركة بنجاح`, duration: 3000 });
      setShowCashModal(false);
      setCashAmount(0);
      setCashDesc('');
      setSelectedTechForPayment('');
      fetchCashLedger();
    } catch (err) { console.error(err); }
  };

  // إحصائيات اليوم من الخزنة
  const getTodayCompanyProfit = () => {
    const today = new Date().toISOString().split('T')[0];
    return cashLedger.filter(e => e.date === today && e.type === 'company_profit').reduce((sum, e) => sum + e.amount, 0);
  };
  const getTodayExpenses = () => {
    const today = new Date().toISOString().split('T')[0];
    return cashLedger.filter(e => e.date === today && e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  };
  const getTodayTechPayments = () => {
    const today = new Date().toISOString().split('T')[0];
    return cashLedger.filter(e => e.date === today && e.type === 'technician_payment').reduce((sum, e) => sum + e.amount, 0);
  };
  const getTodayNetCash = () => getTodayCompanyProfit() - (getTodayExpenses() + getTodayTechPayments());

  // --- دوال الإشعارات والصوت (نفس الكود القديم) ---
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setBrowserNotificationsEnabled(permission === 'granted');
      if (permission === 'granted') addNotification({ type: 'success', title: '🔔 تم التفعيل', message: 'ستصلك الإشعارات', duration: 4000 });
    }
  };
  const playSound = () => { if (audioEnabled && audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(e => console.log(e)); } };
  const sendBrowserNotification = (title: string, body: string) => {
    if (browserNotificationsEnabled && 'Notification' in window && Notification.permission === 'granted') new Notification(title, { body, icon: '/favicon.ico', silent: false });
  };
  const showUnifiedNotification = (type: 'success' | 'error' | 'info', title: string, message: string, duration: number = 4000) => {
    playSound(); sendBrowserNotification(title, message); addNotification({ type, title, message, duration });
  };

  useEffect(() => {
    audioRef.current = new Audio("https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3");
    audioRef.current.load();
    requestNotificationPermission();
  }, []);

  const formatPhoneForWhatsApp = (phone: string) => { /* يمكنك تركها كما هي أو إضافتها */ return phone; };

  // --- جلب البيانات الأساسية (الأوردرات والفنيين) ---
  const fetchData = useCallback(async () => {
    try {
      const [ordersData, techsData] = await Promise.all([
        fetchAPI('orders?select=*&order=created_at.desc'),
        fetchAPI('technicians?select=*')
      ]);
      setOrders(ordersData);
      setTechnicians(techsData);
      const pending = ordersData.filter((o: any) => o.status === 'pending').length;
      const inProgress = ordersData.filter((o: any) => o.status === 'in-progress').length;
      const completed = ordersData.filter((o: any) => o.status === 'completed').length;
      const cancelled = ordersData.filter((o: any) => o.status === 'cancelled').length;
      const totalIncome = ordersData.reduce((acc: number, o: any) => acc + (o.company_share || 0), 0);
      setStats({ pending, inProgress, completed, cancelled, totalIncome });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    fetchCashLedger();
    showUnifiedNotification('info', '👋 أهلاً بك', 'نظام الخزنة اليدوي نشط', 5000);
    const interval = setInterval(() => { fetchData(); fetchCashLedger(); }, 30000);
    return () => clearInterval(interval);
  }, [fetchData, fetchCashLedger]);

  const calculateAmounts = (data: any) => {
    const total = parseFloat(data.total_amount) || 0;
    const expenses = parseFloat(data.expenses) || 0;
    const net = total - expenses;
    const companyShare = Math.round(net * 0.6);
    const techShare = net - companyShare;
    return { ...data, net_amount: net, company_share: companyShare, technician_share: techShare };
  };

  const handleFormChange = (field: string, value: any) => {
    if (field === 'device' && value === 'other') { setIsOtherDevice(true); setFormData({ ...formData, device: '' }); return; }
    if (field === 'brand' && value === 'other') { setIsOtherBrand(true); setFormData({ ...formData, brand: '' }); return; }
    const updated = { ...formData, [field]: value };
    setFormData(calculateAmounts(updated));
  };

  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = { ...formData, device: isOtherDevice ? customDevice : formData.device, brand: isOtherBrand ? customBrand : formData.brand };
    try {
      if (editingOrder) {
        await fetchAPI(`orders?id=eq.${editingOrder.id}`, { method: 'PATCH', body: JSON.stringify(finalData) });
        showUnifiedNotification('success', '✏️ تم التعديل', `تم تعديل أوردر ${formData.customer_name}`, 4000);
      } else {
        await fetchAPI('orders', { method: 'POST', body: JSON.stringify({ ...finalData, date: new Date().toLocaleString("ar-EG") }) });
        showUnifiedNotification('success', '🎉 أوردر جديد', `تم إضافة أوردر لـ ${formData.customer_name}`, 4000);
      }
      setShowOrderModal(false); setEditingOrder(null); resetForm(); fetchData();
    } catch (err) { console.error(err); showUnifiedNotification('error', '❌ خطأ', 'حدث خطأ أثناء الحفظ', 4000); }
  };

  const resetForm = () => {
    setFormData({ customer_name: '', phone: '', device: '', address: '', brand: '', problem: '', technician: '', status: 'pending', total_amount: 0, expenses: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false });
    setCustomDevice(''); setCustomBrand(''); setIsOtherDevice(false); setIsOtherBrand(false);
  };

  const deleteOrder = async (id: number) => { if (confirm('هل أنت متأكد؟')) { await fetchAPI(`orders?id=eq.${id}`, { method: 'DELETE' }); showUnifiedNotification('success', '✅ تم الحذف', 'تم حذف الأوردر', 4000); fetchData(); } };
  const togglePaidStatus = async (id: number, currentStatus: boolean) => { await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ is_paid: !currentStatus }) }); showUnifiedNotification('success', '💰 تحديث الدفع', 'تم تحديث حالة التحصيل', 3000); fetchData(); };
  const saveTechnician = async (e: React.FormEvent) => { e.preventDefault(); try { if (editingTech) { await fetchAPI(`technicians?id=eq.${editingTech.id}`, { method: 'PATCH', body: JSON.stringify(techForm) }); } else { await fetchAPI('technicians', { method: 'POST', body: JSON.stringify(techForm) }); } setShowTechModal(false); setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true }); fetchData(); } catch (err) { console.error(err); } };
  const deleteTechnician = async (id: number) => { if (confirm('هل أنت متأكد؟')) { await fetchAPI(`technicians?id=eq.${id}`, { method: 'DELETE' }); fetchData(); } };
  const copyTechLink = (name: string, id: number) => { const link = `${window.location.origin}/tech-portal?name=${encodeURIComponent(name)}`; navigator.clipboard.writeText(link); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };

  // دالة تغيير حالة الأوردر بالطريقة القديمة (تستخدم داخل select)
  const changeOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetchAPI(`orders?id=eq.${orderId}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
      showUnifiedNotification('success', '🔄 تغيير الحالة', `تم تغيير الحالة إلى ${newStatus === 'pending' ? 'قيد الانتظار' : newStatus === 'in-progress' ? 'قيد التنفيذ' : 'مكتمل'}`, 3000);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || o.phone?.includes(searchTerm) || o.technician?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading && orders.length === 0) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><RefreshCw className="w-12 h-12 text-orange-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 font-sans" dir="rtl">
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center"><LayoutDashboard className="w-6 h-6 text-white" /></div><div><h1 className="text-lg font-bold text-white">لوحة التحكم</h1><p className="text-[10px] text-slate-500">Maintenance Guide</p></div></div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setAudioEnabled(!audioEnabled); if (!audioEnabled && audioRef.current) { audioRef.current.play().then(() => { audioRef.current?.pause(); audioRef.current!.currentTime = 0; }).catch(e => console.log(e)); } }} className={`p-2 rounded-lg ${audioEnabled ? 'text-green-500 bg-green-500/20' : 'text-slate-400 bg-slate-800'}`}>{audioEnabled ? "🔊" : "🔇"}</button>
            <button onClick={requestNotificationPermission} className="p-2 rounded-lg bg-slate-800 text-slate-400">🔔</button>
            <button onClick={() => { fetchData(); fetchCashLedger(); }} className="p-2 text-slate-400"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-2 sm:p-3 md:p-4">
        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 mb-5">
          <div className="bg-slate-900 p-3 rounded-xl text-center"><p className="text-xl font-black text-white">{orders.length}</p><p className="text-[10px] text-slate-500">إجمالي الأوردرات</p></div>
          <div className="bg-slate-900 p-3 rounded-xl text-center"><p className="text-xl font-black text-yellow-500">{stats.pending}</p><p className="text-[10px] text-slate-500">قيد الانتظار</p></div>
          <div className="bg-slate-900 p-3 rounded-xl text-center"><p className="text-xl font-black text-green-500">{stats.completed}</p><p className="text-[10px] text-slate-500">مكتمل</p></div>
          <div className="bg-slate-900 p-3 rounded-xl text-center"><p className="text-xl font-black text-orange-500">{stats.totalIncome.toLocaleString()}</p><p className="text-[10px] text-slate-500">أرباح الشركة</p></div>
          <div className="bg-slate-900 p-3 rounded-xl text-center"><p className="text-xl font-black text-purple-500">{technicians.length}</p><p className="text-[10px] text-slate-500">فني متاح</p></div>
        </div>

        {/* التبويبات */}
        <div className="flex gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 mb-4 overflow-x-auto">
          <button onClick={() => setActiveTab('orders')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${activeTab === 'orders' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>الأوردرات</button>
          <button onClick={() => setActiveTab('technicians')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${activeTab === 'technicians' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>الفنيين</button>
          <button onClick={() => setActiveTab('invoices')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${activeTab === 'invoices' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>الفواتير</button>
          <button onClick={() => setActiveTab('reports')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${activeTab === 'reports' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>التقارير</button>
          <button onClick={() => setActiveTab('cash')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${activeTab === 'cash' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>💰 الخزنة</button>
        </div>

        {/* تبويب الخزنة (يدوي بالكامل) */}
        {activeTab === 'cash' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-6 rounded-2xl border border-emerald-500/30">
              <p className="text-slate-400 text-sm">رصيد الخزنة الحالي (نصيب الشركة بعد المصاريف والفنيين)</p>
              <p className="text-4xl font-bold text-emerald-400">{cashBalance.toFixed(2)} ج.م</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-800 p-3 rounded-xl text-center"><p className="text-xs text-slate-400">دخل الشركة اليوم</p><p className="text-xl font-bold text-orange-400">{getTodayCompanyProfit()} ج.م</p></div>
              <div className="bg-slate-800 p-3 rounded-xl text-center"><p className="text-xs text-slate-400">مصروفات اليوم</p><p className="text-xl font-bold text-red-400">{getTodayExpenses()} ج.م</p></div>
              <div className="bg-slate-800 p-3 rounded-xl text-center"><p className="text-xs text-slate-400">مدفوع للفنيين اليوم</p><p className="text-xl font-bold text-yellow-400">{getTodayTechPayments()} ج.م</p></div>
              <div className="bg-slate-800 p-3 rounded-xl text-center"><p className="text-xs text-slate-400">صافي الخزنة اليوم</p><p className="text-xl font-bold text-green-400">{getTodayNetCash()} ج.م</p></div>
            </div>
            <button onClick={() => setShowCashModal(true)} className="bg-orange-600 hover:bg-orange-700 px-5 py-2 rounded-xl flex items-center gap-2"><Plus className="w-5 h-5" /> تسجيل حركة جديدة</button>
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
              <table className="w-full text-right text-sm"><thead className="bg-slate-800"><tr><th className="p-3">التاريخ</th><th>النوع</th><th>المبلغ</th><th>الوصف</th></tr></thead>
              <tbody>{cashLedger.map(entry => (<tr key={entry.id} className="border-b border-slate-800"><td className="p-3">{new Date(entry.date).toLocaleDateString('ar-EG')}</td><td>{entry.type === 'company_profit' ? '💰 دخل شركة' : entry.type === 'expense' ? '💸 مصروف' : '👨‍🔧 دفع للفني'}</td><td className={entry.type === 'company_profit' ? 'text-green-400' : 'text-red-400'}>{entry.amount} ج.م</td><td>{entry.description}</td></tr>))}</tbody></table>
            </div>
          </div>
        )}

        {/* تبويب الأوردرات (باستخدام الآلية القديمة لتغيير الحالة) */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap"><input type="text" placeholder="بحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-slate-800 p-2 rounded flex-1" /><select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-800 p-2 rounded"><option value="all">الكل</option><option value="pending">قيد الانتظار</option><option value="in-progress">قيد التنفيذ</option><option value="completed">مكتمل</option></select><button onClick={() => setShowOrderModal(true)} className="bg-orange-600 px-4 py-2 rounded-xl flex items-center gap-2"><Plus className="w-4 h-4" /> أوردر جديد</button></div>
            {filteredOrders.map(order => (<div key={order.id} className="bg-slate-800 p-4 rounded-xl"><div className="flex justify-between"><div><p className="font-bold">{order.customer_name}</p><p className="text-sm text-slate-400">{order.phone}</p></div><span className={`px-2 py-1 rounded text-xs ${order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : order.status === 'in-progress' ? 'bg-blue-500/20 text-blue-500' : 'bg-green-500/20 text-green-500'}`}>{order.status === 'pending' ? 'قيد الانتظار' : order.status === 'in-progress' ? 'قيد التنفيذ' : 'مكتمل'}</span></div><div className="grid grid-cols-2 gap-2 mt-2 text-sm"><span>الجهاز: {order.device}</span><span>الماركة: {order.brand}</span><span>التكلفة: {order.total_amount} ج.م</span><span>نصيب الشركة: {order.company_share} ج.م</span></div><div className="flex gap-2 mt-3">
              <select value={order.status} onChange={(e) => changeOrderStatus(order.id, e.target.value)} className="bg-slate-700 p-1 rounded text-sm">
                <option value="pending">قيد الانتظار</option>
                <option value="in-progress">قيد التنفيذ</option>
                <option value="completed">مكتمل</option>
              </select>
              <button onClick={() => deleteOrder(order.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div></div>))}
          </div>
        )}

        {/* تبويب الفنيين (يمكنك إضافته بنفس الكود القديم) */}
        {activeTab === 'technicians' && (
          <div className="space-y-4">
            <button onClick={() => setShowTechModal(true)} className="bg-orange-600 px-4 py-2 rounded-xl">إضافة فني</button>
            {technicians.map(tech => (<div key={tech.id} className="bg-slate-800 p-3 rounded-xl flex justify-between items-center"><div><p className="font-bold">{tech.name}</p><p className="text-sm">{tech.phone}</p></div><button onClick={() => deleteTechnician(tech.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button></div>))}
          </div>
        )}

        {/* باقي التبويبات (invoices, reports) يمكنك إضافتها لاحقاً */}
      </main>

      {/* مودال إضافة حركة خزنة (يدوي) */}
      {showCashModal && (<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"><div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md"><h3 className="text-xl font-bold mb-4">تسجيل حركة جديدة</h3><form onSubmit={addCashEntry} className="space-y-4"><select value={cashType} onChange={e => setCashType(e.target.value as any)} className="w-full p-2 bg-slate-800 rounded"><option value="company_profit">💰 دخل شركة (أرباح من أوردر)</option><option value="expense">💸 مصروف</option><option value="technician_payment">👨‍🔧 دفع مستحقات فني</option></select>{cashType === 'technician_payment' && (<select value={selectedTechForPayment} onChange={e => setSelectedTechForPayment(e.target.value)} className="w-full p-2 bg-slate-800 rounded" required><option value="">اختر الفني</option>{technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>)}<input type="number" placeholder="المبلغ" value={cashAmount} onChange={e => setCashAmount(parseFloat(e.target.value))} className="w-full p-2 bg-slate-800 rounded" required /><input type="text" placeholder="الوصف (مثال: أرباح أوردر رقم كذا، أو ثمن قطعة غيار)" value={cashDesc} onChange={e => setCashDesc(e.target.value)} className="w-full p-2 bg-slate-800 rounded" required /><div className="flex gap-3"><button type="submit" className="flex-1 bg-orange-600 py-2 rounded-xl">تسجيل</button><button type="button" onClick={() => setShowCashModal(false)} className="flex-1 bg-slate-700 py-2 rounded-xl">إلغاء</button></div></form></div></div>)}

      {/* مودال إضافة/تعديل أوردر (يمكنك إضافته من الكود القديم إذا احتجت) */}
    </div>
  );
}
