import React, { useState, useCallback, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState<'orders' | 'technicians' | 'reports' | 'invoices'>('orders');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
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
    addNotification({
      type: 'info',
      title: '👋 أهلاً بك يا مدير',
      message: 'نظام الإشعارات والتنبيهات الصوتية نشط الآن',
      duration: 5000
    });
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const calculateAmounts = (data: any) => {
    const total = parseFloat(data.total_amount) || 0;
    const expenses = parseFloat(data.expenses) || 0;
    const net = total - expenses;
    const companyShare = Math.round(net * 0.4); 
    const techShare = net - companyShare;
    return { ...data, net_amount: net, company_share: companyShare, technician_share: techShare };
  };

  const handleFormChange = (field: string, value: any) => {
    if (field === 'device') {
        if (value === 'other') {
            setIsOtherDevice(true);
            setFormData({ ...formData, device: '' });
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

  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
        ...formData,
        device: isOtherDevice ? customDevice : formData.device,
        brand: isOtherBrand ? customBrand : formData.brand
    };

    try {
      if (editingOrder) {
        await fetchAPI(`orders?id=eq.${editingOrder.id}`, { method: 'PATCH', body: JSON.stringify(finalData) });
        addNotification({ type: 'success', title: '✏️ تم التعديل', message: `تم تعديل أوردر ${formData.customer_name}`, duration: 4000 });
      } else {
        await fetchAPI('orders', { 
          method: 'POST', 
          body: JSON.stringify({ ...finalData, date: new Date().toLocaleString("ar-EG") }) 
        });
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
        customer_name: '', phone: '', device: '', address: '', brand: '', problem: '', technician: '',
        status: 'pending', total_amount: 0, expenses: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false
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
        addNotification({ type: 'success', title: '✅ تم الحذف', message: 'تم حذف الأوردر بنجاح', duration: 4000 });
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  const togglePaidStatus = async (id: number, currentStatus: boolean) => {
    try {
      await fetchAPI(`orders?id=eq.${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify({ is_paid: !currentStatus }) 
      });
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
        addNotification({ type: 'success', title: '✅ تم الحذف', message: 'تم حذف الفني بنجاح', duration: 4000 });
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

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/20">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">لوحة التحكم</h1>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">Maintenance Guide</p>
            </div>
          </div>
          <button onClick={fetchData} className="p-2 text-slate-400 hover:text-white transition-all"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </nav>

      {/* الحاوية الرئيسية بعد التعديل: عرض أقل ومسافة داخلية أقل */}
      <main className="max-w-5xl mx-auto p-3 md:p-4">

        {/* بطاقات الإحصائيات - مسافات أقل وحجم أصغر */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 mb-5">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-sm">
            <p className="text-xl font-black text-white">{orders.length}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase">إجمالي الأوردرات</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-sm">
            <p className="text-xl font-black text-yellow-500">{stats.pending}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase">قيد الانتظار</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-sm">
            <p className="text-xl font-black text-green-500">{stats.completed}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase">مكتمل</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-sm">
            <p className="text-xl font-black text-orange-500">{stats.totalIncome.toLocaleString()}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase">أرباح الشركة</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-sm">
            <p className="text-xl font-black text-purple-500">{technicians.length}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase">فني متاح</p>
          </div>
        </div>

        {/* التبويبات */}
        <div className="flex gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 mb-6 w-fit overflow-x-auto">
          <button onClick={() => setActiveTab('orders')} className={`px-5 py-1.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`}>الأوردرات</button>
          <button onClick={() => setActiveTab('technicians')} className={`px-5 py-1.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'technicians' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`}>الفنيين</button>
          <button onClick={() => setActiveTab('invoices')} className={`px-5 py-1.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'invoices' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`}>الفواتير</button>
          <button onClick={() => setActiveTab('reports')} className={`px-5 py-1.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'reports' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`}>التقارير</button>
        </div>

        {/* تبويب الأوردرات */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input type="text" placeholder="ابحث عن عميل، هاتف، أو فني..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pr-12 pl-4 text-sm outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <button onClick={() => { setEditingOrder(null); resetForm(); setShowOrderModal(true); }} className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-900/20"><Plus className="w-5 h-5" />أوردر جديد</button>
            </div>

            {/* شبكة الأوردرات - عمودان فقط على الشاشات المتوسطة والكبيرة */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map(order => (
                <div key={order.id} className="bg-slate-900 rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all group relative shadow-lg">
                  {!order.is_paid && order.status === 'completed' && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50 animate-pulse rounded-t-2xl"></div>
                  )}
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      order.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                      order.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500' :
                      order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {order.status === 'completed' ? 'مكتمل' : order.status === 'in-progress' ? 'جاري العمل' : order.status === 'cancelled' ? 'ملغي' : 'قيد الانتظار'}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => togglePaidStatus(order.id, order.is_paid)} className={`p-1.5 rounded-xl transition-all ${order.is_paid ? 'bg-green-500/20 text-green-500' : 'bg-slate-800 text-slate-500'}`} title={order.is_paid ? 'تم التحصيل' : 'لم يتم التحصيل'}>
                        {order.is_paid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setEditingOrder(order); setFormData(order); setShowOrderModal(true); }} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => deleteOrder(order.id)} className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-white font-black text-base truncate">{order.customer_name}</h3>
                    <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-800/50">
                      <div><p className="text-[9px] text-slate-500 font-bold uppercase">الإجمالي</p><p className="text-xs text-white font-bold">{order.total_amount || 0} ج.م</p></div>
                      <div><p className="text-[9px] text-slate-500 font-bold uppercase">الصافي</p><p className="text-xs text-green-500 font-bold">{order.net_amount || 0} ج.م</p></div>
                      <div><p className="text-[9px] text-slate-500 font-bold uppercase">المصاريف</p><p className="text-xs text-red-400 font-bold">{order.expenses || 0} ج.م</p></div>
                      <div><p className="text-[9px] text-slate-500 font-bold uppercase">التاريخ</p><p className="text-[10px] text-slate-400 font-bold">{order.date}</p></div>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <div><p className="text-[9px] text-slate-500 font-bold uppercase">الفني</p><p className="text-sm font-black text-orange-400">{order.technician || 'لم يحدد'}</p></div>
                      <div className={`text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 ${order.is_paid ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
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

        {/* تبويب الفنيين */}
        {activeTab === 'technicians' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {technicians.map(tech => (
              <div key={tech.id} className="bg-slate-900 rounded-2xl p-5 border border-slate-800 text-center relative shadow-lg">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-700">
                  <Users className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-white font-black text-base">{tech.name}</h3>
                <p className="text-slate-500 text-[11px] font-bold mb-3">{tech.specialization}</p>
                <div className="flex flex-col gap-2">
                  <button onClick={() => copyTechLink(tech.name, tech.id)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition-all">
                    {copiedId === tech.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copiedId === tech.id ? 'تم النسخ' : 'نسخ رابط الفني'}
                  </button>
                  <div className="flex gap-2">
                    <a href={`tel:${tech.phone}`} className="flex-1 p-1.5 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500/20 flex justify-center transition-all"><Phone className="w-4 h-4" /></a>
                    <button onClick={() => { setEditingTech(tech); setTechForm(tech); setShowTechModal(true); }} className="flex-1 p-1.5 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 flex justify-center transition-all"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => deleteTechnician(tech.id)} className="flex-1 p-1.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 flex justify-center transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => { setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true }); setShowTechModal(true); }} className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 hover:bg-slate-900 hover:border-orange-500/50 text-slate-500 hover:text-orange-500 transition-all">
              <Plus className="w-7 h-7" /><span className="font-bold text-sm">إضافة فني</span>
            </button>
          </div>
        )}

        {/* تبويب الفواتير (مبسط) */}
        {activeTab === 'invoices' && (
          <div className="bg-slate-900 rounded-2xl p-6 text-center border border-slate-800">
            <p className="text-slate-400">سيتم عرض الفواتير هنا قريباً</p>
          </div>
        )}

        {/* تبويب التقارير (مبسط) */}
        {activeTab === 'reports' && (
          <div className="bg-slate-900 rounded-2xl p-6 text-center border border-slate-800">
            <p className="text-slate-400">سيتم عرض التقارير المالية هنا قريباً</p>
          </div>
        )}
      </main>

      {/* مودال إضافة/تعديل أوردر (مبسط) */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl my-auto">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center"><h2 className="text-xl font-black text-white">{editingOrder ? 'تعديل أوردر' : 'أوردر جديد'}</h2><button onClick={() => setShowOrderModal(false)} className="p-2 text-slate-500 hover:text-white"><XCircle className="w-6 h-6" /></button></div>
            <form onSubmit={saveOrder} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-slate-500 uppercase">👤 اسم العميل</label><input type="text" required value={formData.customer_name} onChange={(e) => handleFormChange('customer_name', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-500" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase">📞 رقم الهاتف</label><input type="tel" required value={formData.phone} onChange={(e) => handleFormChange('phone', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-500" /></div>
                <div className="md:col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase">📍 العنوان</label><input type="text" required value={formData.address} onChange={(e) => handleFormChange('address', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-500" /></div>
              </div>
              <div className="border-t border-slate-800 pt-3"><h3 className="text-sm font-bold text-white mb-2">🔧 بيانات الجهاز</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase pr-2">نوع الجهاز</label>
                    {!isOtherDevice ? (
                      <select required value={formData.device} onChange={(e) => handleFormChange('device', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm">
                        <option value="">اختر الجهاز</option>
                        <option value="غسالة">غسالة</option><option value="ثلاجة">ثلاجة</option><option value="بوتاجاز">بوتاجاز</option>
                        <option value="other">أخرى...</option>
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <input type="text" required placeholder="نوع الجهاز" value={customDevice} onChange={(e) => setCustomDevice(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm" />
                        <button type="button" onClick={() => { setIsOtherDevice(false); setCustomDevice(''); }} className="p-2 bg-slate-700 rounded-xl"><XCircle className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase pr-2">الماركة</label>
                    {!isOtherBrand ? (
                      <select required value={formData.brand} onChange={(e) => handleFormChange('brand', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm">
                        <option value="">اختر الماركة</option>
                        <option value="سامسونج">سامسونج</option><option value="LG">LG</option>
                        <option value="other">أخرى...</option>
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <input type="text" required placeholder="الماركة" value={customBrand} onChange={(e) => setCustomBrand(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm" />
                        <button type="button" onClick={() => { setIsOtherBrand(false); setCustomBrand(''); }} className="p-2 bg-slate-700 rounded-xl"><XCircle className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase pr-2">الفني</label><select value={formData.technician} onChange={(e) => handleFormChange('technician', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm"><option value="">اختر فني</option>{technicians.filter(t => t.is_active !== false).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select></div>
                </div>
                <div className="mt-3"><label className="text-[10px] font-bold text-slate-500 uppercase">⚠️ وصف العطل</label><textarea required value={formData.problem} onChange={(e) => handleFormChange('problem', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm" rows={2}></textarea></div>
              </div>
              <div className="border-t border-slate-800 pt-3"><h3 className="text-sm font-bold text-white mb-2">💰 المبالغ المالية</h3>
                <div className="grid grid-cols-3 gap-3"><div><label className="text-[10px] font-bold text-slate-500 uppercase">الإجمالي</label><input type="number" value={formData.total_amount} onChange={(e) => handleFormChange('total_amount', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm" /></div><div><label className="text-[10px] font-bold text-slate-500 uppercase">المصاريف</label><input type="number" value={formData.expenses} onChange={(e) => handleFormChange('expenses', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm" /></div></div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800"><div className="text-center"><p className="text-[10px] text-slate-500 uppercase">نصيب الشركة (40%)</p><p className="text-base font-black text-blue-500">{formData.company_share} ج.م</p></div><div className="text-center border-r border-slate-800"><p className="text-[10px] text-slate-500 uppercase">نصيب الفني (60%)</p><p className="text-base font-black text-purple-500">{formData.technician_share} ج.م</p></div></div>
              <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl"><input type="checkbox" id="is_paid" checked={formData.is_paid} onChange={(e) => handleFormChange('is_paid', e.target.checked)} className="w-5 h-5 accent-orange-500" /><label htmlFor="is_paid" className="text-sm font-bold text-white cursor-pointer">✅ تم تحصيل المبلغ بالكامل</label></div>
              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-3 rounded-xl shadow-lg transition-all active:scale-95 mt-3">💾 حفظ الأوردر</button>
            </form>
          </div>
        </div>
      )}

      {/* مودال إضافة/تعديل فني */}
      {showTechModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center"><h2 className="text-xl font-black text-white">{editingTech ? 'تعديل فني' : 'فني جديد'}</h2><button onClick={() => setShowTechModal(false)} className="p-2 text-slate-500 hover:text-white"><XCircle className="w-6 h-6" /></button></div>
            <form onSubmit={saveTechnician} className="p-5 space-y-3">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">👤 اسم الفني</label><input type="text" required value={techForm.name} onChange={(e) => setTechForm({ ...techForm, name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">📞 رقم الهاتف</label><input type="tel" required value={techForm.phone} onChange={(e) => setTechForm({ ...techForm, phone: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">🔧 التخصص</label><input type="text" value={techForm.specialization} onChange={(e) => setTechForm({ ...techForm, specialization: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm" placeholder="مثال: صيانة ثلاجات" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="is_active" checked={techForm.is_active} onChange={(e) => setTechForm({ ...techForm, is_active: e.target.checked })} className="w-5 h-5 accent-orange-500" /><label htmlFor="is_active" className="text-sm font-bold text-white cursor-pointer">✅ نشط</label></div>
              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-3 rounded-xl shadow-lg transition-all active:scale-95 mt-3">💾 حفظ الفني</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
