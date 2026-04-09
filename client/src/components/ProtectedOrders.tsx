import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Plus, Download, Search, LayoutDashboard, Users, 
  Clock, CheckCircle2, AlertCircle, XCircle, 
  Edit, Trash2, RefreshCw, Phone,
  TrendingUp, Wallet, PieChart, Calendar, Copy, Check, MapPin, Filter, MoreVertical
} from "lucide-react";
import { useNotification } from "../components/NotificationSystem";

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

  // --- نظام الخزنة (مع توزيع أرباح الشركاء) ---
  const [cashLedger, setCashLedger] = useState<any[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showEditCashModal, setShowEditCashModal] = useState(false);
  const [editingCashEntry, setEditingCashEntry] = useState<any>(null);
  const [cashType, setCashType] = useState<'company_profit' | 'expense' | 'profit_distribution'>('company_profit');
  const [cashAmount, setCashAmount] = useState(0);
  const [cashDesc, setCashDesc] = useState('');
  const [cashDate, setCashDate] = useState(new Date().toISOString().split('T')[0]);
  const [cashFilterDate, setCashFilterDate] = useState('');

  // جلب سجل الخزنة
  const fetchCashLedger = useCallback(async () => {
    try {
      let endpoint = 'cash_ledger?select=*&order=date.desc';
      if (cashFilterDate) {
        endpoint = `cash_ledger?select=*&date=eq.${cashFilterDate}&order=date.desc`;
      }
      const data = await fetchAPI(endpoint);
      setCashLedger(data);
      // حساب الرصيد (دخل الشركة - (مصروفات + توزيع أرباح))
      const balance = data.reduce((acc: number, entry: any) => {
        if (entry.type === 'company_profit') return acc + entry.amount;
        return acc - entry.amount;
      }, 0);
      setCashBalance(balance);
    } catch (err) { console.error(err); }
  }, [cashFilterDate]);

  // إضافة حركة خزنة
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
          date: cashDate
        })
      });
      addNotification({ type: 'success', title: '✅ تم التسجيل', message: 'تم تسجيل الحركة بنجاح', duration: 3000 });
      setShowCashModal(false);
      setCashAmount(0);
      setCashDesc('');
      setCashDate(new Date().toISOString().split('T')[0]);
      fetchCashLedger();
    } catch (err) { console.error(err); }
  };

  // تعديل حركة خزنة
  const updateCashEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCashEntry) return;
    try {
      await fetchAPI(`cash_ledger?id=eq.${editingCashEntry.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          type: cashType,
          amount: cashAmount,
          description: cashDesc,
          date: cashDate
        })
      });
      addNotification({ type: 'success', title: '✏️ تم التعديل', message: 'تم تعديل الحركة', duration: 3000 });
      setShowEditCashModal(false);
      setEditingCashEntry(null);
      fetchCashLedger();
    } catch (err) { console.error(err); }
  };

  // حذف حركة خزنة
  const deleteCashEntry = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الحركة؟')) return;
    try {
      await fetchAPI(`cash_ledger?id=eq.${id}`, { method: 'DELETE' });
      addNotification({ type: 'success', title: '🗑️ تم الحذف', message: 'تم حذف الحركة', duration: 3000 });
      fetchCashLedger();
    } catch (err) { console.error(err); }
  };

  // إجمالي أرباح الشركة من الأوردرات المكتملة (من جدول orders)
  const getTotalCompanyProfitFromOrders = () => {
    return orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.company_share || 0), 0);
  };

  // إجمالي الموزع على الشركاء (من cash_ledger)
  const getTotalProfitDistributed = () => {
    return cashLedger.filter(e => e.type === 'profit_distribution').reduce((sum, e) => sum + e.amount, 0);
  };

  // صافي أرباح الشركة (الأرباح - الموزع)
  const getNetCompanyProfit = () => {
    return getTotalCompanyProfitFromOrders() - getTotalProfitDistributed();
  };

  // إحصائيات اليوم
  const getTodayCompanyProfit = () => {
    const today = new Date().toISOString().split('T')[0];
    return cashLedger.filter(e => e.date === today && e.type === 'company_profit').reduce((sum, e) => sum + e.amount, 0);
  };
  const getTodayExpenses = () => {
    const today = new Date().toISOString().split('T')[0];
    return cashLedger.filter(e => e.date === today && e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  };
  const getTodayProfitDistribution = () => {
    const today = new Date().toISOString().split('T')[0];
    return cashLedger.filter(e => e.date === today && e.type === 'profit_distribution').reduce((sum, e) => sum + e.amount, 0);
  };
  const getTodayNetCash = () => getTodayCompanyProfit() - (getTodayExpenses() + getTodayProfitDistribution());

  // --- دوال الإشعارات والصوت ---
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

  // جلب البيانات الأساسية
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
    showUnifiedNotification('info', '👋 أهلاً بك', 'نظام الخزنة وتوزيع الأرباح نشط', 5000);
    const interval = setInterval(() => { fetchData(); fetchCashLedger(); }, 30000);
    return () => clearInterval(interval);
  }, [fetchData, fetchCashLedger]);

  // حساب الأرباح (60% شركة / 40% فني)
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
    if (field === 'total_amount' || field === 'expenses') {
      const updated = { ...formData, [field]: parseFloat(value) || 0 };
      setFormData(calculateAmounts(updated));
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  // حفظ الأوردر
  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      device: isOtherDevice ? customDevice : formData.device,
      brand: isOtherBrand ? customBrand : formData.brand,
      total_amount: parseFloat(formData.total_amount as any) || 0,
      expenses: parseFloat(formData.expenses as any) || 0,
    };
    try {
      if (editingOrder) {
        await fetchAPI(`orders?id=eq.${editingOrder.id}`, { method: 'PATCH', body: JSON.stringify(finalData) });
        showUnifiedNotification('success', '✏️ تم التعديل', `تم تعديل أوردر ${formData.customer_name}`, 4000);
      } else {
        await fetchAPI('orders', {
          method: 'POST',
          body: JSON.stringify({ ...finalData, date: new Date().toLocaleString("ar-EG") })
        });
        showUnifiedNotification('success', '🎉 أوردر جديد', `تم إضافة أوردر لـ ${formData.customer_name}`, 4000);
      }
      setShowOrderModal(false);
      setEditingOrder(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      showUnifiedNotification('error', '❌ خطأ', 'حدث خطأ أثناء الحفظ', 4000);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: '', phone: '', device: '', address: '', brand: '', problem: '', technician: '',
      status: 'pending', total_amount: 0, expenses: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false
    });
    setCustomDevice('');
    setCustomBrand('');
    setIsOtherDevice(false);
    setIsOtherBrand(false);
  };

  // حفظ الفني
  const saveTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTech) {
        await fetchAPI(`technicians?id=eq.${editingTech.id}`, { method: 'PATCH', body: JSON.stringify(techForm) });
        showUnifiedNotification('success', '✏️ تم التعديل', `تم تعديل بيانات ${techForm.name}`, 4000);
      } else {
        await fetchAPI('technicians', { method: 'POST', body: JSON.stringify(techForm) });
        showUnifiedNotification('success', '👨‍🔧 فني جديد', `تم إضافة ${techForm.name}`, 4000);
      }
      setShowTechModal(false);
      setEditingTech(null);
      setTechForm({ name: '', phone: '', specialization: '', is_active: true });
      fetchData();
    } catch (err) {
      console.error(err);
      showUnifiedNotification('error', '❌ خطأ', 'حدث خطأ أثناء حفظ الفني', 4000);
    }
  };

  const deleteOrder = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الأوردر؟')) {
      await fetchAPI(`orders?id=eq.${id}`, { method: 'DELETE' });
      showUnifiedNotification('success', '✅ تم الحذف', 'تم حذف الأوردر', 4000);
      fetchData();
    }
  };

  const deleteTechnician = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الفني؟')) {
      await fetchAPI(`technicians?id=eq.${id}`, { method: 'DELETE' });
      showUnifiedNotification('success', '✅ تم الحذف', 'تم حذف الفني', 4000);
      fetchData();
    }
  };

  const copyTechLink = (name: string, id: number) => {
    const link = `${window.location.origin}/tech-portal?name=${encodeURIComponent(name)}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // تغيير حالة الأوردر مع إضافة أرباح الشركة تلقائياً للخزنة
  const changeOrderStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    try {
      await fetchAPI(`orders?id=eq.${orderId}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
      
      if (newStatus === 'completed' && order.status !== 'completed') {
        const companyShare = order.company_share || 0;
        if (companyShare > 0) {
          await fetchAPI('cash_ledger', {
            method: 'POST',
            body: JSON.stringify({
              type: 'company_profit',
              amount: companyShare,
              description: `أرباح شركة من أوردر ${order.customer_name} (رقم ${order.id})`,
              related_order_id: order.id,
              date: new Date().toISOString().split('T')[0]
            })
          });
          showUnifiedNotification('info', '💰 أرباح الشركة', `تم إضافة ${companyShare} ج.م للخزنة`, 4000);
          fetchCashLedger();
        }
      }
      showUnifiedNotification('success', '🔄 تغيير الحالة', `تم تغيير حالة أوردر ${order.customer_name}`, 3000);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.phone?.includes(searchTerm) ||
      o.technician?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading && orders.length === 0) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <RefreshCw className="w-12 h-12 text-orange-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 font-sans" dir="rtl">
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center"><LayoutDashboard className="w-6 h-6 text-white" /></div>
            <div><h1 className="text-lg font-bold text-white">لوحة التحكم</h1><p className="text-[10px] text-slate-500">Maintenance Guide</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setAudioEnabled(!audioEnabled); if (!audioEnabled && audioRef.current) { audioRef.current.play().then(() => { audioRef.current?.pause(); audioRef.current!.currentTime = 0; }).catch(e => console.log(e)); } }} className={`p-2 rounded-lg ${audioEnabled ? 'text-green-500 bg-green-500/20' : 'text-slate-400 bg-slate-800'}`}>{audioEnabled ? "🔊" : "🔇"}</button>
            <button onClick={requestNotificationPermission} className="p-2 rounded-lg bg-slate-800 text-slate-400">🔔</button>
            <button onClick={() => { fetchData(); fetchCashLedger(); }} className="p-2 text-slate-400"><RefreshCw className="w-5 h-5" /></button>
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
          <button onClick={() => setActiveTab('reports')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${activeTab === 'reports' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>التقارير</button>
          <button onClick={() => setActiveTab('invoices')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${activeTab === 'invoices' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>الفواتير</button>
          <button onClick={() => setActiveTab('cash')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${activeTab === 'cash' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>💰 الخزنة</button>
        </div>

        {/* تبويب الأوردرات */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <input type="text" placeholder="بحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-slate-800 p-2 rounded flex-1" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-800 p-2 rounded">
                <option value="all">الكل</option><option value="pending">قيد الانتظار</option><option value="in-progress">قيد التنفيذ</option><option value="completed">مكتمل</option>
              </select>
              <button onClick={() => { setEditingOrder(null); resetForm(); setShowOrderModal(true); }} className="bg-orange-600 px-4 py-2 rounded-xl flex items-center gap-2"><Plus className="w-4 h-4" /> أوردر جديد</button>
            </div>
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-slate-800 p-4 rounded-xl">
                <div className="flex justify-between"><div><p className="font-bold">{order.customer_name}</p><p className="text-sm text-slate-400">{order.phone}</p></div><span className={`px-2 py-1 rounded text-xs ${order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : order.status === 'in-progress' ? 'bg-blue-500/20 text-blue-500' : 'bg-green-500/20 text-green-500'}`}>{order.status === 'pending' ? 'قيد الانتظار' : order.status === 'in-progress' ? 'قيد التنفيذ' : 'مكتمل'}</span></div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm"><span>الجهاز: {order.device}</span><span>الماركة: {order.brand}</span><span>التكلفة: {order.total_amount} ج.م</span><span>نصيب الشركة: {order.company_share} ج.م</span></div>
                <div className="flex gap-2 mt-3">
                  <select value={order.status} onChange={(e) => changeOrderStatus(order.id, e.target.value)} className="bg-slate-700 p-1 rounded text-sm">
                    <option value="pending">قيد الانتظار</option><option value="in-progress">قيد التنفيذ</option><option value="completed">مكتمل</option>
                  </select>
                  <button onClick={() => { setEditingOrder(order); setFormData(order); setShowOrderModal(true); }} className="text-blue-400"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteOrder(order.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* تبويب الفنيين */}
        {activeTab === 'technicians' && (
          <div className="space-y-4">
            <button onClick={() => { setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true }); setShowTechModal(true); }} className="bg-orange-600 px-4 py-2 rounded-xl flex items-center gap-2"><Plus className="w-4 h-4" /> إضافة فني</button>
            <div className="space-y-3">
              {technicians.map(tech => (
                <div key={tech.id} className="bg-slate-800 p-4 rounded-xl flex justify-between items-center">
                  <div><p className="font-bold">{tech.name}</p><p className="text-sm text-slate-400">{tech.phone} - {tech.specialization}</p></div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingTech(tech); setTechForm(tech); setShowTechModal(true); }} className="text-blue-400"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => deleteTechnician(tech.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                    <button onClick={() => copyTechLink(tech.name, tech.id)} className="text-green-400">{copiedId === tech.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* تبويب الخزنة (مع توزيع أرباح الشركاء) */}
        {activeTab === 'cash' && (
          <div className="space-y-6">
            {/* رصيد الخزنة الحالي */}
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-6 rounded-2xl border border-emerald-500/30">
              <p className="text-slate-400 text-sm">رصيد الخزنة الحالي (صافي أرباح الشركة)</p>
              <p className="text-4xl font-bold text-emerald-400">{cashBalance.toFixed(2)} ج.م</p>
            </div>

            {/* إجمالي أرباح الشركة وتوزيعات الشركاء */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 p-4 rounded-xl border border-orange-500/30">
                <p className="text-slate-400 text-sm">إجمالي أرباح الشركة (من التصفيات)</p>
                <p className="text-2xl font-bold text-orange-400">{getTotalCompanyProfitFromOrders().toFixed(2)} ج.م</p>
              </div>
              <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 p-4 rounded-xl border border-red-500/30">
                <p className="text-slate-400 text-sm">إجمالي توزيع أرباح الشركاء</p>
                <p className="text-2xl font-bold text-red-400">{getTotalProfitDistributed().toFixed(2)} ج.م</p>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 p-4 rounded-xl border border-green-500/30">
                <p className="text-slate-400 text-sm">صافي أرباح الشركة (بعد التوزيع)</p>
                <p className="text-2xl font-bold text-green-400">{getNetCompanyProfit().toFixed(2)} ج.م</p>
              </div>
            </div>

            {/* إحصائيات اليوم مع فلتر تاريخ */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-2 items-center">
                <label className="text-sm text-slate-400">فلتر التاريخ:</label>
                <input type="date" value={cashFilterDate} onChange={e => setCashFilterDate(e.target.value)} className="bg-slate-800 p-2 rounded text-sm" />
                <button onClick={() => setCashFilterDate('')} className="bg-slate-700 px-3 py-1 rounded text-xs">إلغاء</button>
              </div>
              <button onClick={() => setShowCashModal(true)} className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-xl flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> تسجيل حركة جديدة</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-800 p-3 rounded-xl text-center"><p className="text-xs text-slate-400">دخل الشركة (اليوم)</p><p className="text-xl font-bold text-orange-400">{getTodayCompanyProfit()} ج.م</p></div>
              <div className="bg-slate-800 p-3 rounded-xl text-center"><p className="text-xs text-slate-400">مصروفات اليوم</p><p className="text-xl font-bold text-red-400">{getTodayExpenses()} ج.م</p></div>
              <div className="bg-slate-800 p-3 rounded-xl text-center"><p className="text-xs text-slate-400">توزيع أرباح اليوم</p><p className="text-xl font-bold text-yellow-400">{getTodayProfitDistribution()} ج.م</p></div>
              <div className="bg-slate-800 p-3 rounded-xl text-center"><p className="text-xs text-slate-400">صافي الخزنة اليوم</p><p className="text-xl font-bold text-green-400">{getTodayNetCash()} ج.م</p></div>
            </div>

            {/* جدول حركات الخزنة مع تعديل/حذف */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-800">
                  <tr><th className="p-3">التاريخ</th><th>النوع</th><th>المبلغ</th><th>الوصف</th><th>إجراءات</th></tr>
                </thead>
                <tbody>
                  {cashLedger.map(entry => (
                    <tr key={entry.id} className="border-b border-slate-800">
                      <td className="p-3">{new Date(entry.date).toLocaleDateString('ar-EG')}</td>
                      <td>{entry.type === 'company_profit' ? '💰 دخل شركة' : entry.type === 'expense' ? '💸 مصروف' : '📤 توزيع أرباح شركاء'}</td>
                      <td className={entry.type === 'company_profit' ? 'text-green-400' : 'text-red-400'}>{entry.amount} ج.م</td>
                      <td>{entry.description}</td>
                      <td className="flex gap-2">
                        <button onClick={() => { setEditingCashEntry(entry); setCashType(entry.type); setCashAmount(entry.amount); setCashDesc(entry.description); setCashDate(entry.date); setShowEditCashModal(true); }} className="text-blue-400"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => deleteCashEntry(entry.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* مودال إضافة/تعديل أوردر */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingOrder ? 'تعديل أوردر' : 'أوردر جديد'}</h3>
            <form onSubmit={saveOrder} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="اسم العميل" value={formData.customer_name} onChange={e => handleFormChange('customer_name', e.target.value)} className="bg-slate-800 p-2 rounded" required />
                <input type="text" placeholder="رقم الهاتف" value={formData.phone} onChange={e => handleFormChange('phone', e.target.value)} className="bg-slate-800 p-2 rounded" required />
                <select value={formData.device} onChange={e => handleFormChange('device', e.target.value)} className="bg-slate-800 p-2 rounded">
                  <option value="">اختر الجهاز</option>
                  <option value="ثلاجة">ثلاجة</option><option value="غسالة">غسالة</option><option value="تكييف">تكييف</option><option value="بوتاجاز">بوتاجاز</option><option value="سخان">سخان</option><option value="other">أخرى</option>
                </select>
                {isOtherDevice && <input type="text" placeholder="اكتب الجهاز" value={customDevice} onChange={e => setCustomDevice(e.target.value)} className="bg-slate-800 p-2 rounded" required />}
                <select value={formData.brand} onChange={e => handleFormChange('brand', e.target.value)} className="bg-slate-800 p-2 rounded">
                  <option value="">اختر الماركة</option>
                  <option value="سامسونج">سامسونج</option><option value="إل جي">إل جي</option><option value="شارب">شارب</option><option value="توشيبا">توشيبا</option><option value="زانوسي">زانوسي</option><option value="يونيون اير">يونيون اير</option><option value="فريش">فريش</option><option value="وايت ويل">وايت ويل</option><option value="أريستون">أريستون</option><option value="بيكو">بيكو</option><option value="هوفر">هوفر</option><option value="إندسيت">إندسيت</option><option value="other">أخرى</option>
                </select>
                {isOtherBrand && <input type="text" placeholder="اكتب الماركة" value={customBrand} onChange={e => setCustomBrand(e.target.value)} className="bg-slate-800 p-2 rounded" required />}
                <input type="text" placeholder="العنوان" value={formData.address} onChange={e => handleFormChange('address', e.target.value)} className="bg-slate-800 p-2 rounded" />
                <textarea placeholder="المشكلة" value={formData.problem} onChange={e => handleFormChange('problem', e.target.value)} className="bg-slate-800 p-2 rounded col-span-2" rows={2} />
                <select value={formData.technician} onChange={e => handleFormChange('technician', e.target.value)} className="bg-slate-800 p-2 rounded">
                  <option value="">اختر الفني</option>
                  {technicians.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
                <input type="number" placeholder="إجمالي المبلغ" value={formData.total_amount} onChange={e => handleFormChange('total_amount', e.target.value)} className="bg-slate-800 p-2 rounded" />
                <input type="number" placeholder="المصاريف" value={formData.expenses} onChange={e => handleFormChange('expenses', e.target.value)} className="bg-slate-800 p-2 rounded" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-orange-600 py-2 rounded-xl">حفظ</button>
                <button type="button" onClick={() => setShowOrderModal(false)} className="flex-1 bg-slate-700 py-2 rounded-xl">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال إضافة/تعديل فني */}
      {showTechModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editingTech ? 'تعديل فني' : 'فني جديد'}</h3>
            <form onSubmit={saveTechnician} className="space-y-4">
              <input type="text" placeholder="الاسم" value={techForm.name} onChange={e => setTechForm({ ...techForm, name: e.target.value })} className="w-full bg-slate-800 p-2 rounded" required />
              <input type="text" placeholder="رقم الهاتف" value={techForm.phone} onChange={e => setTechForm({ ...techForm, phone: e.target.value })} className="w-full bg-slate-800 p-2 rounded" required />
              <input type="text" placeholder="التخصص" value={techForm.specialization} onChange={e => setTechForm({ ...techForm, specialization: e.target.value })} className="w-full bg-slate-800 p-2 rounded" />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-orange-600 py-2 rounded-xl">حفظ</button>
                <button type="button" onClick={() => setShowTechModal(false)} className="flex-1 bg-slate-700 py-2 rounded-xl">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال إضافة حركة خزنة */}
      {showCashModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">تسجيل حركة جديدة</h3>
            <form onSubmit={addCashEntry} className="space-y-4">
              <select value={cashType} onChange={e => setCashType(e.target.value as any)} className="w-full p-2 bg-slate-800 rounded">
                <option value="company_profit">💰 دخل شركة (أرباح من أوردر)</option>
                <option value="expense">💸 مصروف</option>
                <option value="profit_distribution">📤 توزيع أرباح شركاء</option>
              </select>
              <input type="number" placeholder="المبلغ" value={cashAmount} onChange={e => setCashAmount(parseFloat(e.target.value))} className="w-full p-2 bg-slate-800 rounded" required />
              <input type="text" placeholder="الوصف" value={cashDesc} onChange={e => setCashDesc(e.target.value)} className="w-full p-2 bg-slate-800 rounded" required />
              <input type="date" value={cashDate} onChange={e => setCashDate(e.target.value)} className="w-full p-2 bg-slate-800 rounded" required />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-orange-600 py-2 rounded-xl">تسجيل</button>
                <button type="button" onClick={() => setShowCashModal(false)} className="flex-1 bg-slate-700 py-2 rounded-xl">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال تعديل حركة خزنة */}
      {showEditCashModal && editingCashEntry && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">تعديل حركة الخزنة</h3>
            <form onSubmit={updateCashEntry} className="space-y-4">
              <select value={cashType} onChange={e => setCashType(e.target.value as any)} className="w-full p-2 bg-slate-800 rounded">
                <option value="company_profit">💰 دخل شركة</option>
                <option value="expense">💸 مصروف</option>
                <option value="profit_distribution">📤 توزيع أرباح شركاء</option>
              </select>
              <input type="number" placeholder="المبلغ" value={cashAmount} onChange={e => setCashAmount(parseFloat(e.target.value))} className="w-full p-2 bg-slate-800 rounded" required />
              <input type="text" placeholder="الوصف" value={cashDesc} onChange={e => setCashDesc(e.target.value)} className="w-full p-2 bg-slate-800 rounded" required />
              <input type="date" value={cashDate} onChange={e => setCashDate(e.target.value)} className="w-full p-2 bg-slate-800 rounded" required />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-orange-600 py-2 rounded-xl">حفظ التعديل</button>
                <button type="button" onClick={() => setShowEditCashModal(false)} className="flex-1 bg-slate-700 py-2 rounded-xl">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
