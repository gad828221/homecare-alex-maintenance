import React, { useState, useCallback, useEffect } from 'react';
import { 
  Plus, Download, Search, LayoutDashboard, Users, 
  Clock, CheckCircle2, AlertCircle, XCircle, 
  Edit, Trash2, RefreshCw, Phone,
  TrendingUp, Wallet, PieChart, Calendar, Copy, Check,
  Send, MessageCircle, StickyNote, Eye
} from "lucide-react";
import { useNotification } from "./NotificationSystem";
import { InvoiceApprovalModal } from "./InvoiceApprovalModal";

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
  const [activeTab, setActiveTab] = useState<'orders' | 'technicians' | 'reports' | 'invoices'>('orders');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingTech, setEditingTech] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '',
    status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, 
    net_amount: 0, company_share: 0, technician_share: 0, is_paid: false,
    date: new Date().toLocaleDateString("ar-EG")
  });

  const [customDevice, setCustomDevice] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [isOtherDevice, setIsOtherDevice] = useState(false);
  const [isOtherBrand, setIsOtherBrand] = useState(false);
  
  const [techForm, setTechForm] = useState({ name: '', phone: '', specialization: '', is_active: true });
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, cancelled: 0, totalIncome: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const DEVICE_TYPES = ['غسالة', 'ثلاجة', 'بوتاجاز', 'سخان', 'تكييف', 'ميكروويف', 'غسالة أطباق'];
  const BRANDS = ['سامسونج', 'LG', 'شارب', 'توشيبا', 'زانوسي', 'يونيون إير', 'فريش', 'وايت ويل', 'أريستون', 'بيكو', 'هوفر', 'إنديست'];

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
    if (field === 'device_type') {
        if (value === 'other') {
            setIsOtherDevice(true);
            setFormData({ ...formData, device_type: '' });
            return;
        } else {
            setIsOtherDevice(false);
        }
    }
    if (field === 'brand') {
        if (value === 'other') {
            setIsOtherBrand(true);
            setFormData({ ...formData, brand: '' });
            return;
        } else {
            setIsOtherBrand(false);
        }
    }
    const updated = { ...formData, [field]: value };
    setFormData(calculateAmounts(updated));
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0')) cleaned = '+20' + cleaned.substring(1);
    else if (cleaned.startsWith('1') && cleaned.length === 10) cleaned = '+20' + cleaned;
    else if (!cleaned.startsWith('+')) cleaned = '+20' + cleaned;
    return cleaned;
  };

  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderNumber = `MG-${Date.now()}`;
    const finalDeviceType = isOtherDevice ? customDevice : formData.device_type;
    const finalBrand = isOtherBrand ? customBrand : formData.brand;
    
    const orderToSave = {
      ...formData,
      device_type: finalDeviceType,
      brand: finalBrand,
      order_number: orderNumber,
    };
    
    try {
      if (editingOrder) {
        await fetchAPI(`orders?id=eq.${editingOrder.id}`, { method: 'PATCH', body: JSON.stringify(orderToSave) });
        addNotification({ type: 'success', title: '✏️ تم التعديل', message: `تم تعديل أوردر ${formData.customer_name}`, duration: 4000 });
      } else {
        await fetchAPI('orders', { method: 'POST', body: JSON.stringify(orderToSave) });
        addNotification({ type: 'success', title: '🎉 أوردر جديد', message: `تم إضافة أوردر لـ ${formData.customer_name}`, duration: 4000 });
      }
      setShowOrderModal(false);
      setEditingOrder(null);
      resetForm();
      fetchData();
    } catch (err) { 
      console.error(err);
      addNotification({ type: 'error', title: '❌ خطأ', message: 'حدث خطأ أثناء الحفظ', duration: 4000 });
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '',
      status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, 
      net_amount: 0, company_share: 0, technician_share: 0, is_paid: false,
      date: new Date().toLocaleDateString("ar-EG")
    });
    setCustomDevice('');
    setCustomBrand('');
    setIsOtherDevice(false);
    setIsOtherBrand(false);
  };

  const deleteOrder = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الأوردر؟')) {
      try {
        await fetchAPI(`orders?id=eq.${id}`, { method: 'DELETE' });
        addNotification({ type: 'success', title: '✅ تم الحذف', message: 'تم حذف الأوردر', duration: 4000 });
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  const togglePaidStatus = async (id: number, currentStatus: boolean) => {
    try {
      await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ is_paid: !currentStatus }) });
      addNotification({ type: 'success', title: '💰 تحديث الدفع', message: 'تم تحديث حالة التحصيل', duration: 3000 });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const saveTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTech) {
        await fetchAPI(`technicians?id=eq.${editingTech.id}`, { method: 'PATCH', body: JSON.stringify(techForm) });
        addNotification({ type: 'success', title: '✏️ تم التعديل', message: `تم تعديل بيانات ${techForm.name}`, duration: 4000 });
      } else {
        await fetchAPI('technicians', { method: 'POST', body: JSON.stringify(techForm) });
        addNotification({ type: 'success', title: '👨‍🔧 فني جديد', message: `تم إضافة ${techForm.name}`, duration: 4000 });
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
        addNotification({ type: 'success', title: '✅ تم الحذف', message: 'تم حذف الفني', duration: 4000 });
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  const copyTechLink = (name: string, id: number) => {
    const link = `${window.location.origin}/tech-portal?name=${encodeURIComponent(name)}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    addNotification({ type: 'success', title: '📋 تم النسخ', message: 'رابط الفني جاهز للإرسال', duration: 2000 });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const updateOrderStatus = async (id: number, newStatus: string) => {
    try {
      await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleInvoiceApprove = async (warranty: string) => {
    await fetchAPI(`orders?id=eq.${selectedOrderForInvoice.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ warranty_text: warranty, invoice_approved: true })
    });
    addNotification({ type: 'success', title: '✅ تمت الموافقة', message: 'تم حفظ الضمان وإرسال الفاتورة', duration: 4000 });
    setShowInvoiceModal(false);
    fetchData();
  };

  const handleSendWhatsApp = (link: string) => {
    window.open(link, '_blank');
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || o.phone?.includes(searchTerm) || o.technician?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading && orders.length === 0) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><RefreshCw className="w-12 h-12 text-orange-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20">
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center"><LayoutDashboard className="w-6 h-6 text-white" /></div><h1 className="text-lg font-bold text-white">لوحة تحكم المدير</h1></div>
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

        <div className="flex gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 mb-6 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('orders')} className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'orders' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>الأوردرات</button>
          <button onClick={() => setActiveTab('technicians')} className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'technicians' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>الفنيين</button>
          <button onClick={() => setActiveTab('reports')} className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'reports' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>التقارير</button>
          <button onClick={() => setActiveTab('invoices')} className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'invoices' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>الفواتير</button>
        </div>

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" /><input type="text" placeholder="ابحث عن عميل، هاتف، أو فني..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pr-12 pl-4 text-sm outline-none focus:ring-2 focus:ring-orange-500" /></div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm"><option value="all">الكل</option><option value="pending">قيد الانتظار</option><option value="in-progress">قيد التنفيذ</option><option value="completed">مكتمل</option><option value="cancelled">ملغي</option></select>
              <button onClick={() => { setEditingOrder(null); resetForm(); setShowOrderModal(true); }} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2"><Plus className="w-5 h-5" />أوردر جديد</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map(order => (
                <div key={order.id} className="bg-slate-900 rounded-3xl p-5 border border-slate-800 hover:border-slate-700 transition-all relative shadow-xl">
                  {!order.is_paid && order.status === 'completed' && <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50 animate-pulse"></div>}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${order.status === 'completed' ? 'bg-green-500/10 text-green-500' : order.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500' : order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {order.status === 'completed' ? 'مكتمل' : order.status === 'in-progress' ? 'جاري العمل' : order.status === 'cancelled' ? 'ملغي' : 'قيد الانتظار'}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => togglePaidStatus(order.id, order.is_paid)} className={`p-2 rounded-xl transition-all ${order.is_paid ? 'bg-green-500/20 text-green-500' : 'bg-slate-800 text-slate-500'}`}><CheckCircle2 className="w-4 h-4" /></button>
                      <button onClick={() => { setEditingOrder(order); setFormData(order); setShowOrderModal(true); }} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => deleteOrder(order.id)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-white font-black text-lg truncate">{order.customer_name}</h3>
                    <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-800/50">
                      <div><p className="text-[10px] text-slate-500">الإجمالي</p><p className="text-xs text-white font-bold">{order.total_amount || 0} ج.م</p></div>
                      <div><p className="text-[10px] text-slate-500">الصافي</p><p className="text-xs text-green-500 font-bold">{order.net_amount || 0} ج.م</p></div>
                      <div><p className="text-[10px] text-slate-500">المصاريف</p><p className="text-xs text-red-400">{order.parts_cost + order.transport_cost || 0} ج.م</p></div>
                      <div><p className="text-[10px] text-slate-500">التاريخ</p><p className="text-[10px] text-slate-400">{order.date}</p></div>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <div><p className="text-[10px] text-slate-500">الفني</p><p className="text-sm font-black text-orange-400">{order.technician || 'لم يحدد'}</p></div>
                      <div className={`text-[10px] font-black px-2 py-1 rounded flex items-center gap-1 ${order.is_paid ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                        {order.is_paid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {order.is_paid ? 'تم التحصيل' : 'لم يحصل'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'technicians' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {technicians.map(tech => (
              <div key={tech.id} className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-center relative shadow-lg">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4"><Users className="w-8 h-8 text-orange-500" /></div>
                <h3 className="text-white font-black text-lg">{tech.name}</h3>
                <p className="text-slate-500 text-xs font-bold mb-4">{tech.specialization}</p>
                <div className="flex flex-col gap-2">
                  <button onClick={() => copyTechLink(tech.name, tech.id)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2">{copiedId === tech.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />} نسخ رابط الفني</button>
                  <div className="flex gap-2">
                    <a href={`tel:${tech.phone}`} className="flex-1 p-2 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500/20"><Phone className="w-4 h-4 mx-auto" /></a>
                    <button onClick={() => { setEditingTech(tech); setTechForm(tech); setShowTechModal(true); }} className="flex-1 p-2 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700"><Edit className="w-4 h-4 mx-auto" /></button>
                    <button onClick={() => deleteTechnician(tech.id)} className="flex-1 p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20"><Trash2 className="w-4 h-4 mx-auto" /></button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => { setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true }); setShowTechModal(true); }} className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-900 hover:border-orange-500/50 text-slate-500 hover:text-orange-500"><Plus className="w-8 h-8" /><span>إضافة فني</span></button>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center"><p className="text-3xl font-black text-orange-500">{orders.filter(o => o.status === 'completed').length}</p><p className="text-sm text-slate-400">الأوردرات المكتملة</p></div>
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center"><p className="text-3xl font-black text-green-500">{stats.totalIncome.toLocaleString()} ج.م</p><p className="text-sm text-slate-400">أرباح الشركة</p></div>
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center"><p className="text-3xl font-black text-red-500">{orders.reduce((sum, o) => sum + (o.parts_cost + o.transport_cost || 0), 0).toLocaleString()} ج.م</p><p className="text-sm text-slate-400">إجمالي المصاريف</p></div>
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center"><p className="text-3xl font-black text-blue-500">{(stats.totalIncome - orders.reduce((sum, o) => sum + (o.parts_cost + o.transport_cost || 0), 0)).toLocaleString()} ج.م</p><p className="text-sm text-slate-400">صافي الربح</p></div>
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">🧾 الفواتير (الأوردرات المكتملة)</h3>
            {orders.filter(o => o.status === 'completed').map(order => (
              <div key={order.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <div><p className="font-black text-white">{order.customer_name}</p><p className="text-sm text-slate-400">{order.device_type} - {order.brand}</p></div>
                  <button onClick={() => { setSelectedOrderForInvoice(order); setShowInvoiceModal(true); }} className="bg-orange-600 hover:bg-orange-700 px-5 py-2 rounded-xl text-sm font-bold">طباعة فاتورة مع الضمان</button>
                </div>
                <div className="mt-3 text-sm grid grid-cols-2 gap-2"><span>المبلغ: {order.total_amount} ج.م</span><span>المصاريف: {order.parts_cost + order.transport_cost} ج.م</span><span>صافي الربح: {order.net_amount} ج.م</span><span>نصيب الشركة: {order.company_share} ج.م</span></div>
                {order.warranty_text && <div className="mt-3 bg-slate-800 p-2 rounded text-xs"><span className="text-orange-400">🛡️ الضمان:</span> {order.warranty_text}</div>}
              </div>
            ))}
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
                <select value={formData.device_type} onChange={e => handleFormChange('device_type', e.target.value)} className="bg-slate-800 p-2 rounded">
                  <option value="">اختر الجهاز</option>{DEVICE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}<option value="other">أخرى</option>
                </select>
                {isOtherDevice && <input type="text" placeholder="اكتب الجهاز" value={customDevice} onChange={e => setCustomDevice(e.target.value)} className="bg-slate-800 p-2 rounded" required />}
                <select value={formData.brand} onChange={e => handleFormChange('brand', e.target.value)} className="bg-slate-800 p-2 rounded">
                  <option value="">اختر الماركة</option>{BRANDS.map(b => <option key={b} value={b}>{b}</option>)}<option value="other">أخرى</option>
                </select>
                {isOtherBrand && <input type="text" placeholder="اكتب الماركة" value={customBrand} onChange={e => setCustomBrand(e.target.value)} className="bg-slate-800 p-2 rounded" required />}
                <input type="text" placeholder="العنوان" value={formData.address} onChange={e => handleFormChange('address', e.target.value)} className="bg-slate-800 p-2 rounded" />
                <textarea placeholder="المشكلة" value={formData.problem_description} onChange={e => handleFormChange('problem_description', e.target.value)} className="bg-slate-800 p-2 rounded col-span-2" rows={2} />
                <select value={formData.technician} onChange={e => handleFormChange('technician', e.target.value)} className="bg-slate-800 p-2 rounded"><option value="">اختر الفني</option>{technicians.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select>
                <input type="number" placeholder="إجمالي المبلغ" value={formData.total_amount} onChange={e => handleFormChange('total_amount', e.target.value)} className="bg-slate-800 p-2 rounded" />
                <div className="grid grid-cols-2 gap-2"><input type="number" placeholder="قطع غيار" value={formData.parts_cost} onChange={e => handleFormChange('parts_cost', e.target.value)} className="bg-slate-800 p-2 rounded" /><input type="number" placeholder="مواصلات" value={formData.transport_cost} onChange={e => handleFormChange('transport_cost', e.target.value)} className="bg-slate-800 p-2 rounded" /></div>
              </div>
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-orange-600 py-2 rounded-xl">حفظ</button><button type="button" onClick={() => setShowOrderModal(false)} className="flex-1 bg-slate-700 py-2 rounded-xl">إلغاء</button></div>
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
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-orange-600 py-2 rounded-xl">حفظ</button><button type="button" onClick={() => setShowTechModal(false)} className="flex-1 bg-slate-700 py-2 rounded-xl">إلغاء</button></div>
            </form>
          </div>
        </div>
      )}

      {/* مودال اعتماد الفاتورة والضمان */}
      {showInvoiceModal && selectedOrderForInvoice && (
        <InvoiceApprovalModal
          order={selectedOrderForInvoice}
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          onApprove={handleInvoiceApprove}
          onSendWhatsApp={handleSendWhatsApp}
        />
      )}
    </div>
  );
}
