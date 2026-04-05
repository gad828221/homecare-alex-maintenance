import React, { useState, useCallback, useEffect } from 'react';
import { 
  Plus, Download, Search, LayoutDashboard, Users, 
  Clock, CheckCircle2, AlertCircle, XCircle, 
  Edit, Trash2, RefreshCw, Phone,
  TrendingUp, Wallet, PieChart, Calendar, Copy, Check,
  Send, MessageCircle, StickyNote, Eye
} from "lucide-react";

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

const DEVICE_TYPES = ['غسالة', 'ثلاجة', 'بوتاجاز', 'سخان', 'تكييف', 'ميكروويف', 'غسالة أطباق'];
const BRANDS = ['سامسونج', 'LG', 'شارب', 'توشيبا', 'زانوسي', 'يونيون إير', 'فريش', 'وايت ويل', 'أريستون', 'بيكو', 'هوفر', 'إنديست'];

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
  const [orders, setOrders] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'technicians' | 'reports'>('orders');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingTech, setEditingTech] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [filterTechStatus, setFilterTechStatus] = useState<'all' | 'active' | 'inactive'>('active');
  
  // فلاتر الأوردرات
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTechnician, setFilterTechnician] = useState('');
  const [filterDeviceType, setFilterDeviceType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterDelay, setFilterDelay] = useState<'all' | 'delayed'>('all');
  
  const [formData, setFormData] = useState({
    customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '',
    status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, 
    net_amount: 0, company_share: 0, technician_share: 0, is_paid: false,
    date: new Date().toLocaleDateString("ar-EG")  // التاريخ الافتراضي (اليوم)
  });
  
  const [techForm, setTechForm] = useState({ name: '', phone: '', specialization: '', is_active: true });
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, cancelled: 0, totalIncome: 0 });

  // دالة محسنة لحساب فارق الأيام (تدعم صيغ متعددة)
  const getDaysDifference = (dateStr: string) => {
    if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return 0;
    let orderDate: Date;
    // صيغة DD/MM/YYYY
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          orderDate = new Date(year, month, day);
        } else return 0;
      } else return 0;
    } 
    // صيغة YYYY-MM-DD (من input date)
    else {
      orderDate = new Date(dateStr);
      if (isNaN(orderDate.getTime())) return 0;
    }
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTime = todayDate.getTime() - orderDate.getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const isDelayed = (order: any) => {
    if (order.status === 'completed' || order.status === 'cancelled') return false;
    const daysDiff = getDaysDifference(order.date);
    return daysDiff > 2;
  };

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
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const calculateAmounts = (data: any) => {
    const total = parseFloat(data.total_amount) || 0;
    const parts = parseFloat(data.parts_cost) || 0;
    const transport = parseFloat(data.transport_cost) || 0;
    const net = total - parts - transport;
    const companyShare = Math.round(net * 0.5);
    const techShare = net - companyShare;
    return { ...data, net_amount: net, company_share: companyShare, technician_share: techShare };
  };

  const handleFormChange = (field: string, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(calculateAmounts(updated));
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '+20' + cleaned.substring(1);
    } else if (cleaned.startsWith('1') && cleaned.length === 10) {
      cleaned = '+20' + cleaned;
    } else if (!cleaned.startsWith('+')) {
      cleaned = '+20' + cleaned;
    }
    return cleaned;
  };

  const notifyCustomerStatusChange = (order: any, newStatus: string) => {
    const phone = formatPhoneForWhatsApp(order.phone);
    let statusMessage = "";
    if (newStatus === "in-progress") statusMessage = "🔧 تم بدء العمل على طلبك بواسطة الفني.";
    else if (newStatus === "completed") statusMessage = "✅ تم إكمال طلب الصيانة بنجاح. شكرًا لثقتك بنا!";
    else if (newStatus === "cancelled") statusMessage = "❌ تم إلغاء طلب الصيانة. للاستفسار، يرجى الاتصال بنا.";
    else return;
    
    const message = `📢 *تحديث حالة طلب الصيانة* 📢\n\n` +
      `🔢 *كود الأوردر:* ${order.order_number}\n` +
      `👤 *العميل:* ${order.customer_name}\n` +
      `📝 *الحالة الجديدة:* ${statusMessage}\n\n` +
      `شكرًا لتواصلك معنا. 🌟`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const updateOrderStatus = async (id: number, newStatus: string) => {
    try {
      const oldOrder = orders.find(o => o.id === id);
      await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
      fetchData();
      if (oldOrder && oldOrder.status !== newStatus) {
        notifyCustomerStatusChange(oldOrder, newStatus);
      }
    } catch (err) { console.error(err); }
  };

  const togglePaidStatus = async (id: number, currentStatus: boolean) => {
    try {
      await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ is_paid: !currentStatus }) });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const deleteOrder = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الأوردر؟')) {
      try {
        await fetchAPI(`orders?id=eq.${id}`, { method: 'DELETE' });
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  const sendToWhatsApp = (order: any) => {
    const phone = formatPhoneForWhatsApp(order.phone);
    const message = `📝 *تم استلام طلب الصيانة بنجاح* 📝\n\n` +
      `🔢 *كود الأوردر:* ${order.order_number}\n` +
      `👤 *العميل:* ${order.customer_name}\n` +
      `📞 *رقمك:* ${order.phone}\n\n` +
      `✅ تم تسجيل طلبك وسيتم التواصل معك قريباً من قبل الفني المختص.\n\n` +
      `شكراً لثقتك بنا. 🌟`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const notifyTechnician = (techName: string, orderData: any) => {
    const tech = technicians.find(t => t.name === techName);
    if (tech && tech.phone) {
      const phone = formatPhoneForWhatsApp(tech.phone);
      const message = `🔧 *أوردر صيانة جديد* 🔧\n\n` +
        `🔢 *كود الأوردر:* ${orderData.order_number}\n` +
        `👤 *العميل:* ${orderData.customer_name}\n` +
        `📞 *هاتف العميل:* ${orderData.phone}\n` +
        `📍 *العنوان:* ${orderData.address}\n` +
        `🔧 *الجهاز:* ${orderData.device_type} - ${orderData.brand}\n` +
        `⚠️ *المشكلة:* ${orderData.problem_description}\n` +
        `💰 *الإجمالي:* ${orderData.total_amount} ج.م`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    }
  };

  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderNumber = `MG-${Date.now()}`;
    // استخدام التاريخ المختار أو التاريخ الحالي
    const orderDate = formData.date || new Date().toLocaleDateString("ar-EG");
    try {
      if (editingOrder) {
        await fetchAPI(`orders?id=eq.${editingOrder.id}`, { method: 'PATCH', body: JSON.stringify({ ...formData, date: orderDate }) });
      } else {
        await fetchAPI('orders', { 
          method: 'POST', 
          body: JSON.stringify({ ...formData, order_number: orderNumber, date: orderDate }) 
        });
        if (formData.technician) {
          notifyTechnician(formData.technician, { ...formData, order_number: orderNumber });
        }
      }
      setShowOrderModal(false);
      setEditingOrder(null);
      setFormData({
        customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '',
        status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, 
        net_amount: 0, company_share: 0, technician_share: 0, is_paid: false,
        date: new Date().toLocaleDateString("ar-EG")
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const saveTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTech) {
        await fetchAPI(`technicians?id=eq.${editingTech.id}`, { method: 'PATCH', body: JSON.stringify(techForm) });
      } else {
        await fetchAPI('technicians', { method: 'POST', body: JSON.stringify(techForm) });
      }
      setShowTechModal(false);
      setEditingTech(null);
      setTechForm({ name: '', phone: '', specialization: '', is_active: true });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const deleteTechnician = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الفني؟')) {
      try {
        await fetchAPI(`technicians?id=eq.${id}`, { method: 'DELETE' });
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  const toggleTechnicianActive = async (tech: any) => {
    await fetchAPI(`technicians?id=eq.${tech.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !tech.is_active }) });
    fetchData();
  };

  const copyTechLink = (name: string, id: number) => {
    const link = `${window.location.origin}/tech-portal?name=${encodeURIComponent(name)}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // فلترة الأوردرات
  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.phone?.includes(searchTerm) ||
      o.technician?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    const matchesTechnician = !filterTechnician || o.technician === filterTechnician;
    const matchesDeviceType = !filterDeviceType || o.device_type === filterDeviceType;
    const matchesDateFrom = !filterDateFrom || (o.date && o.date >= filterDateFrom);
    const matchesDateTo = !filterDateTo || (o.date && o.date <= filterDateTo);
    const matchesDelay = filterDelay === 'all' || (filterDelay === 'delayed' && isDelayed(o));
    return matchesSearch && matchesStatus && matchesTechnician && matchesDeviceType && matchesDateFrom && matchesDateTo && matchesDelay;
  });

  const filteredTechnicians = technicians.filter(tech => {
    if (filterTechStatus === 'active') return tech.is_active !== false;
    if (filterTechStatus === 'inactive') return tech.is_active === false;
    return true;
  });

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterTechnician('');
    setFilterDeviceType('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDelay('all');
  };

  if (loading && orders.length === 0) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <RefreshCw className="w-12 h-12 text-orange-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20">
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center"><LayoutDashboard className="w-6 h-6 text-white" /></div>
            <h1 className="text-lg font-bold text-white">لوحة تحكم المدير</h1>
          </div>
          <button onClick={fetchData} className="p-2 text-slate-400 hover:text-white"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800"><p className="text-2xl font-black text-white">{orders.length}</p><p className="text-[10px] text-slate-500 uppercase">إجمالي الأوردرات</p></div>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800"><p className="text-2xl font-black text-yellow-500">{stats.pending}</p><p className="text-[10px] text-slate-500 uppercase">قيد الانتظار</p></div>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800"><p className="text-2xl font-black text-green-500">{stats.completed}</p><p className="text-[10px] text-slate-500 uppercase">مكتمل</p></div>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800"><p className="text-2xl font-black text-orange-500">{stats.totalIncome.toLocaleString()} ج.م</p><p className="text-[10px] text-slate-500 uppercase">أرباح الشركة</p></div>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800"><p className="text-2xl font-black text-purple-500">{technicians.length}</p><p className="text-[10px] text-slate-500 uppercase">فني متاح</p></div>
        </div>

        <div className="flex gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 mb-6 w-fit">
          <button onClick={() => setActiveTab('orders')} className={`px-6 py-2 rounded-xl text-sm font-bold ${activeTab === 'orders' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>الأوردرات</button>
          <button onClick={() => setActiveTab('technicians')} className={`px-6 py-2 rounded-xl text-sm font-bold ${activeTab === 'technicians' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>الفنيين</button>
          <button onClick={() => setActiveTab('reports')} className={`px-6 py-2 rounded-xl text-sm font-bold ${activeTab === 'reports' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>التقارير</button>
        </div>

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* شريط البحث والأوردر الجديد */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input type="text" placeholder="ابحث عن عميل، هاتف، أو فني..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pr-12 pl-4 text-sm outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <button onClick={() => { setEditingOrder(null); setFormData({ customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '', status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false, date: new Date().toLocaleDateString("ar-EG") }); setShowOrderModal(true); }} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2"> <Plus className="w-5 h-5" /> أوردر جديد</button>
            </div>

            {/* شريط الفلاتر المتقدمة */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-sm">
                <option value="all">جميع الحالات</option>
                <option value="pending">⏳ قيد الانتظار</option>
                <option value="in-progress">🔧 قيد التنفيذ</option>
                <option value="completed">✅ مكتمل</option>
                <option value="cancelled">❌ ملغي</option>
                <option value="deferred">📅 مؤجل</option>
                <option value="inspected">💰 تم الكشف</option>
              </select>

              <select value={filterTechnician} onChange={(e) => setFilterTechnician(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-sm">
                <option value="">جميع الفنيين</option>
                {technicians.filter(t => t.is_active !== false).map(tech => <option key={tech.id} value={tech.name}>{tech.name}</option>)}
              </select>

              <select value={filterDeviceType} onChange={(e) => setFilterDeviceType(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-sm">
                <option value="">جميع الأجهزة</option>
                {DEVICE_TYPES.map(device => <option key={device} value={device}>{device}</option>)}
              </select>

              <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-sm" placeholder="من تاريخ" />
              <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-sm" placeholder="إلى تاريخ" />
            </div>

            {/* شريط الفلاتر الإضافية (تأخير ومسح الكل) */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button onClick={() => setFilterDelay(filterDelay === 'delayed' ? 'all' : 'delayed')} className={`px-3 py-1 rounded-full text-xs ${filterDelay === 'delayed' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300'}`}>⚠️ المتأخرة فقط</button>
              </div>
              <button onClick={clearAllFilters} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1 rounded-full text-xs">مسح جميع الفلاتر</button>
            </div>

            {/* قائمة الأوردرات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map(order => (
                <div key={order.id} className="bg-slate-900 rounded-3xl p-5 border border-slate-800 hover:border-slate-700 transition-all relative overflow-hidden">
                  {/* شعار التأخير */}
                  {isDelayed(order) && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg z-10">
                      ⚠️ تأخير {getDaysDifference(order.date)} أيام
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                      order.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                      order.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500' :
                      order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                      order.status === 'deferred' ? 'bg-purple-500/10 text-purple-500' :
                      order.status === 'inspected' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {order.status === 'completed' ? 'مكتمل' : order.status === 'in-progress' ? 'جاري العمل' : order.status === 'cancelled' ? 'ملغي' : order.status === 'deferred' ? 'مؤجل' : order.status === 'inspected' ? 'تم الكشف' : 'قيد الانتظار'}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => togglePaidStatus(order.id, order.is_paid)} className={`p-2 rounded-xl ${order.is_paid ? 'bg-green-500/20 text-green-500' : 'bg-slate-800 text-slate-500'}`}>{order.is_paid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}</button>
                      <button onClick={() => sendToWhatsApp(order)} className="p-2 text-slate-500 hover:text-green-500 hover:bg-green-500/10 rounded-xl"><MessageCircle className="w-4 h-4" /></button>
                      <button onClick={() => { setEditingOrder(order); setFormData({ ...order, date: order.date || new Date().toLocaleDateString("ar-EG") }); setShowOrderModal(true); }} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => deleteOrder(order.id)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-white font-black text-lg truncate">{order.customer_name}</h3>
                    <div className="text-xs text-slate-400 space-y-1">
                      <p>📍 {order.address}</p>
                      <p>🔧 {order.device_type} - {order.brand}</p>
                      <p>⚠️ {order.problem_description}</p>
                    </div>
                    {order.technician_note && <div className="mt-2 p-2 bg-slate-800/50 rounded-lg border-r-2 border-orange-500"><p className="text-[10px] text-slate-400">📝 ملاحظة الفني</p><p className="text-xs text-slate-300">{order.technician_note}</p></div>}
                    {order.inspection_amount > 0 && <div className="mt-2 p-2 bg-yellow-500/10 rounded-lg flex justify-between"><span className="text-xs text-yellow-500">💰 كشف بقيمة</span><span className="text-sm font-bold text-yellow-500">{order.inspection_amount} ج.م</span></div>}
                    <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-800/50">
                      <div><p className="text-[10px] text-slate-500 uppercase">الإجمالي</p><p className="text-xs text-white font-bold">{order.total_amount || 0} ج.م</p></div>
                      <div><p className="text-[10px] text-slate-500 uppercase">الصافي</p><p className="text-xs text-green-500 font-bold">{order.net_amount || 0} ج.م</p></div>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">الفني</p>
                        <p className="text-sm font-black text-orange-400">{order.technician || 'لم يحدد'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase text-left">الحالة</p>
                        <select 
                          value={order.status} 
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)} 
                          className="bg-slate-700 text-white rounded px-2 py-1 text-xs"
                        >
                          <option value="pending">⏳ قيد الانتظار</option>
                          <option value="in-progress">🔧 قيد التنفيذ</option>
                          <option value="completed">✅ مكتمل</option>
                          <option value="cancelled">❌ ملغي</option>
                          <option value="deferred">📅 مؤجل</option>
                          <option value="inspected">💰 تم الكشف</option>
                        </select>
                      </div>
                      <div className={`text-[10px] font-black px-2 py-1 rounded ${order.is_paid ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                        {order.is_paid ? 'تم التحصيل' : 'لم يحصل'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredOrders.length === 0 && (
              <div className="text-center py-12 text-slate-400">لا توجد أوردرات مطابقة للبحث</div>
            )}
          </div>
        )}

        {activeTab === 'technicians' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <button onClick={() => setFilterTechStatus('active')} className={`px-3 py-1 rounded-full text-xs ${filterTechStatus === 'active' ? 'bg-orange-600' : 'bg-slate-800'}`}>النشطون</button>
                <button onClick={() => setFilterTechStatus('inactive')} className={`px-3 py-1 rounded-full text-xs ${filterTechStatus === 'inactive' ? 'bg-orange-600' : 'bg-slate-800'}`}>غير النشطون</button>
                <button onClick={() => setFilterTechStatus('all')} className={`px-3 py-1 rounded-full text-xs ${filterTechStatus === 'all' ? 'bg-orange-600' : 'bg-slate-800'}`}>الجميع</button>
              </div>
              <button onClick={() => { setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true }); setShowTechModal(true); }} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> إضافة فني</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredTechnicians.map(tech => (
                <div key={tech.id} className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-center relative">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4"><Users className="w-8 h-8 text-orange-500" /></div>
                  <h3 className="text-white font-black text-lg">{tech.name}</h3>
                  <p className="text-slate-500 text-xs font-bold mb-4">{tech.specialization}</p>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => copyTechLink(tech.name, tech.id)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2">{copiedId === tech.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}{copiedId === tech.id ? 'تم النسخ' : 'نسخ رابط الفني'}</button>
                    <div className="flex gap-2">
                      <a href={`tel:${tech.phone}`} className="flex-1 p-2 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500/20"><Phone className="w-4 h-4 mx-auto" /></a>
                      <button onClick={() => { setEditingTech(tech); setTechForm(tech); setShowTechModal(true); }} className="flex-1 p-2 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700"><Edit className="w-4 h-4 mx-auto" /></button>
                      <button onClick={() => deleteTechnician(tech.id)} className="flex-1 p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20"><Trash2 className="w-4 h-4 mx-auto" /></button>
                      <button onClick={() => toggleTechnicianActive(tech)} className={`flex-1 p-2 rounded-xl ${tech.is_active !== false ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{tech.is_active !== false ? 'نشط' : 'غير نشط'}</button>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => { setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true }); setShowTechModal(true); }} className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-900 hover:border-orange-500/50 text-slate-500 hover:text-orange-500"><Plus className="w-8 h-8" /><span className="font-bold">إضافة فني</span></button>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800">
              <h2 className="text-2xl font-black text-white mb-8">التقارير المالية</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700"><PieChart className="w-8 h-8 text-blue-500 mb-4" /><p className="text-slate-400 text-xs font-bold mb-1">إجمالي الإيرادات</p><p className="text-3xl font-black text-white">{orders.reduce((acc, o) => acc + (o.total_amount || 0), 0).toLocaleString()} ج.م</p></div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700"><AlertCircle className="w-8 h-8 text-red-500 mb-4" /><p className="text-slate-400 text-xs font-bold mb-1">إجمالي المصاريف</p><p className="text-3xl font-black text-white">{orders.reduce((acc, o) => acc + (o.parts_cost || 0) + (o.transport_cost || 0), 0).toLocaleString()} ج.م</p></div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700"><CheckCircle2 className="w-8 h-8 text-green-500 mb-4" /><p className="text-slate-400 text-xs font-bold mb-1">صافي أرباح الشركة</p><p className="text-3xl font-black text-white">{stats.totalIncome.toLocaleString()} ج.م</p></div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl my-auto">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-black text-white">{editingOrder ? 'تعديل أوردر' : 'أوردر جديد'}</h2>
              <button onClick={() => setShowOrderModal(false)} className="p-2 text-slate-500 hover:text-white"><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={saveOrder} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-slate-500 uppercase">👤 اسم العميل</label><input type="text" required value={formData.customer_name} onChange={(e) => handleFormChange('customer_name', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase">📞 رقم الهاتف</label><input type="tel" required value={formData.phone} onChange={(e) => handleFormChange('phone', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" /></div>
                <div className="md:col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase">📍 العنوان</label><input type="text" required value={formData.address} onChange={(e) => handleFormChange('address', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" placeholder="الشارع والحي والمدينة" /></div>
              </div>
              <div className="border-t border-slate-800 pt-4"><h3 className="text-sm font-bold text-white mb-3">🔧 بيانات الجهاز</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select required value={formData.device_type} onChange={(e) => handleFormChange('device_type', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500"><option value="">نوع الجهاز</option>{DEVICE_TYPES.map(d => <option key={d}>{d}</option>)}</select>
                  <select required value={formData.brand} onChange={(e) => handleFormChange('brand', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500"><option value="">الماركة</option>{BRANDS.map(b => <option key={b}>{b}</option>)}</select>
                  <select value={formData.technician} onChange={(e) => handleFormChange('technician', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500"><option value="">اختر فني</option>{technicians.filter(t => t.is_active !== false).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select>
                </div>
                <div className="mt-4"><label className="text-[10px] font-bold text-slate-500 uppercase">⚠️ وصف العطل</label><textarea required value={formData.problem_description} onChange={(e) => handleFormChange('problem_description', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" rows={3} placeholder="اشرح المشكلة بالتفصيل..."></textarea></div>
              </div>
              <div className="border-t border-slate-800 pt-4"><h3 className="text-sm font-bold text-white mb-3">💰 المبالغ المالية</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase">الإجمالي</label><input type="number" value={formData.total_amount} onChange={(e) => handleFormChange('total_amount', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" /></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase">قطع الغيار</label><input type="number" value={formData.parts_cost} onChange={(e) => handleFormChange('parts_cost', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" /></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase">المواصلات</label><input type="number" value={formData.transport_cost} onChange={(e) => handleFormChange('transport_cost', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" /></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-center"><p className="text-[10px] text-slate-500 uppercase">نصيب الشركة (50%)</p><p className="text-lg font-black text-blue-500">{formData.company_share} ج.م</p></div>
                <div className="text-center border-r border-slate-800"><p className="text-[10px] text-slate-500 uppercase">نصيب الفني (50%)</p><p className="text-lg font-black text-purple-500">{formData.technician_share} ج.م</p></div>
              </div>
              {/* حقل التاريخ اليدوي */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase pr-2">📅 تاريخ الأوردر</label>
                  <input
                    type="date"
                    value={(() => {
                      if (!formData.date) return new Date().toISOString().split('T')[0];
                      // تحويل من DD/MM/YYYY إلى YYYY-MM-DD
                      if (formData.date.includes('/')) {
                        const parts = formData.date.split('/');
                        if (parts.length === 3) {
                          return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
                        }
                      }
                      return formData.date;
                    })()}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      if (selectedDate) {
                        const [year, month, day] = selectedDate.split('-');
                        const formattedDate = `${day}/${month}/${year}`;
                        handleFormChange('date', formattedDate);
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-800 p-3 rounded-xl border border-slate-700"><input type="checkbox" id="is_paid" checked={formData.is_paid} onChange={(e) => handleFormChange('is_paid', e.target.checked)} className="w-5 h-5 accent-orange-500" /><label htmlFor="is_paid" className="text-sm font-bold text-white cursor-pointer">✅ تم تحصيل المبلغ بالكامل</label></div>
              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 mt-4">💾 حفظ الأوردر</button>
            </form>
          </div>
        </div>
      )}

      {/* Technician Modal */}
      {showTechModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-black text-white">{editingTech ? 'تعديل فني' : 'فني جديد'}</h2>
              <button onClick={() => setShowTechModal(false)} className="p-2 text-slate-500 hover:text-white"><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={saveTechnician} className="p-6 space-y-4">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">👤 اسم الفني</label><input type="text" required value={techForm.name} onChange={(e) => setTechForm({ ...techForm, name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">📞 رقم الهاتف</label><input type="tel" required value={techForm.phone} onChange={(e) => setTechForm({ ...techForm, phone: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">🔧 التخصص</label><input type="text" value={techForm.specialization} onChange={(e) => setTechForm({ ...techForm, specialization: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" placeholder="مثال: صيانة ثلاجات" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="is_active" checked={techForm.is_active} onChange={(e) => setTechForm({ ...techForm, is_active: e.target.checked })} className="w-5 h-5 accent-orange-500" /><label htmlFor="is_active" className="text-sm font-bold text-white cursor-pointer">✅ نشط (يظهر في قائمة الفنيين)</label></div>
              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 mt-4">💾 حفظ الفني</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
