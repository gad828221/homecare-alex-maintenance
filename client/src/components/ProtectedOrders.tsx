import React, { useState, useCallback, useEffect } from 'react';
import { 
  Plus, Search, LayoutDashboard, Users, 
  CheckCircle2, AlertCircle, 
  Edit, Trash2, RefreshCw, Phone,
  Copy, Check, Trash, Bell, DollarSign, X
} from "lucide-react";
import { useNotification } from "./NotificationSystem";
import { InvoiceApprovalModal } from "./InvoiceApprovalModal";

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
  const { addNotification } = useNotification();
  const [orders, setOrders] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'technicians' | 'reports' | 'invoices' | 'notifications'>('orders');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingTech, setEditingTech] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<any>(null);
  
  // مودال إدخال قيمة الكشف
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [selectedOrderForInspect, setSelectedOrderForInspect] = useState<any>(null);
  const [inspectAmount, setInspectAmount] = useState('');
  
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
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, inspected: 0, completed: 0, cancelled: 0, totalIncome: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // جلب الإشعارات
  const fetchNotifications = useCallback(async () => {
    try {
      const data = await fetchAPI('notifications?select=*&order=created_at.desc');
      setNotifications(data);
    } catch (err) { console.error(err); }
  }, []);

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
      const inspected = ordersData.filter((o: any) => o.status === 'inspected').length;
      const completed = ordersData.filter((o: any) => o.status === 'completed').length;
      const cancelled = ordersData.filter((o: any) => o.status === 'cancelled').length;
      const totalIncome = ordersData.reduce((acc: number, o: any) => acc + (o.company_share || 0), 0);
      
      setStats({ pending, inProgress, inspected, completed, cancelled, totalIncome });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    fetchNotifications();
    const interval = setInterval(() => { fetchData(); fetchNotifications(); }, 30000);
    return () => clearInterval(interval);
  }, [fetchData, fetchNotifications]);

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

  // تغيير حالة الأوردر (مع دعم الكشف بقيمة مالية)
  const handleStatusChange = async (order: any, newStatus: string) => {
    if (newStatus === 'inspected') {
      // فتح مودال لإدخال قيمة الكشف
      setSelectedOrderForInspect(order);
      setInspectAmount('');
      setShowInspectModal(true);
      return;
    }
    
    // تغيير مباشر للحالات الأخرى
    try {
      await fetchAPI(`orders?id=eq.${order.id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
      addNotification({ type: 'success', title: '🔄 تغيير الحالة', message: `تم تغيير حالة الأوردر إلى ${newStatus === 'pending' ? 'قيد الانتظار' : newStatus === 'in-progress' ? 'قيد التنفيذ' : newStatus === 'completed' ? 'مكتمل' : 'ملغي'}`, duration: 3000 });
      fetchData();
    } catch (err) { console.error(err); }
  };

  // حفظ قيمة الكشف وتحديث الحالة
  const saveInspection = async () => {
    const amount = parseFloat(inspectAmount);
    if (isNaN(amount) || amount <= 0) {
      addNotification({ type: 'error', title: '⚠️ خطأ', message: 'يرجى إدخال قيمة كشف صحيحة', duration: 3000 });
      return;
    }
    
    const companyShare = amount / 2;
    const techShare = amount / 2;
    
    try {
      await fetchAPI(`orders?id=eq.${selectedOrderForInspect.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'inspected',
          inspection_amount: amount,
          total_amount: amount,
          net_amount: amount,
          company_share: companyShare,
          technician_share: techShare,
          parts_cost: 0,
          transport_cost: 0
        })
      });
      addNotification({ type: 'success', title: '💰 تم الكشف', message: `تم تسجيل كشف بقيمة ${amount} ج.م`, duration: 4000 });
      setShowInspectModal(false);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const deleteNotification = async (id: number) => {
    if (confirm('حذف هذا الإشعار؟')) {
      await fetchAPI(`notifications?id=eq.${id}`, { method: 'DELETE' });
      fetchNotifications();
    }
  };

  const deleteAllNotifications = async () => {
    if (confirm('حذف كل الإشعارات نهائياً؟')) {
      for (const n of notifications) {
        await fetchAPI(`notifications?id=eq.${n.id}`, { method: 'DELETE' });
      }
      fetchNotifications();
      addNotification({ type: 'success', title: '🧹 تم التنظيف', message: 'تم حذف جميع الإشعارات', duration: 3000 });
    }
  };

  const handleInvoiceApprove = async (warranty: string) => {
    await fetchAPI(`orders?id=eq.${selectedOrderForInvoice.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ warranty_text: warranty, invoice_approved: true })
    });
    
    // إرسال واتساب للعميل مباشرة
    const phone = formatPhoneForWhatsApp(selectedOrderForInvoice.phone);
    const message = `📄 *فاتورة الصيانة - ضمان* 📄\n\nشكراً لثقتك بنا.\n\nالجهاز: ${selectedOrderForInvoice.device_type || selectedOrderForInvoice.device} - ${selectedOrderForInvoice.brand}\nالمبلغ: ${selectedOrderForInvoice.total_amount} ج.م\nالضمان: ${warranty}\n\nللاستفسار: 01278885772`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    addNotification({ type: 'success', title: '✅ تمت الموافقة', message: 'تم إرسال الفاتورة للعميل', duration: 4000 });
    setShowInvoiceModal(false);
    fetchData();
  };

  const handleSendWhatsApp = (link: string) => {
    window.open(link, '_blank');
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.phone?.includes(searchTerm) || 
                          (o.technician?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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
          <button onClick={() => { fetchData(); fetchNotifications(); }} className="p-2 text-slate-400 hover:text-white"><RefreshCw className="w-5 h-5" /></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
          <div className="bg-slate-900 p-3 rounded-xl text-center"><p className="text-2xl font-black text-white">{orders.length}</p><p className="text-[10px] uppercase">الإجمالي</p></div>
          <div className="bg-slate-900 p-3 rounded-xl text-center"><p className="text-2xl font-black text-yellow-500">{stats.pending}</p><p className="text-[10px] uppercase">قيد الانتظار</p></div>
          <div className="bg-slate-900 p-3 rounded-xl text-center"><p className="text-2xl font-black text-blue-500">{stats.inProgress}</p><p className="text-[10px] uppercase">قيد التنفيذ</p></div>
          <div className="bg-slate-900 p-3 rounded-xl text-center"><p className="text-2xl font-black text-purple-500">{stats.inspected}</p><p className="text-[10px] uppercase">تم الكشف</p></div>
          <div className="bg-slate-900 p-3 rounded-xl text-center"><p className="text-2xl font-black text-green-500">{stats.completed}</p><p className="text-[10px] uppercase">مكتمل</p></div>
          <div className="bg-slate-900 p-3 rounded-xl text-center"><p className="text-2xl font-black text-orange-500">{stats.totalIncome.toLocaleString()} ج.م</p><p className="text-[10px] uppercase">أرباح الشركة</p></div>
        </div>

        {/* تبويبات */}
        <div className="flex gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 mb-6 overflow-x-auto">
          <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'orders' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>الأوردرات</button>
          <button onClick={() => setActiveTab('technicians')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'technicians' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>الفنيين</button>
          <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'reports' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>التقارير</button>
          <button onClick={() => setActiveTab('invoices')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'invoices' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>الفواتير</button>
          <button onClick={() => setActiveTab('notifications')} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 ${activeTab === 'notifications' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><Bell className="w-4 h-4" /> الإشعارات ({notifications.length})</button>
        </div>

        {/* ================== الأوردرات ================== */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="relative flex-1"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" /><input type="text" placeholder="بحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pr-12 pl-4 text-sm" /></div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm">
                <option value="all">الكل</option>
                <option value="pending">قيد الانتظار</option>
                <option value="in-progress">قيد التنفيذ</option>
                <option value="inspected">تم الكشف</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </select>
              <button onClick={() => { setEditingOrder(null); resetForm(); setShowOrderModal(true); }} className="bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2"><Plus className="w-5 h-5" /> أوردر جديد</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map(order => {
                let statusColor = '';
                if (order.status === 'completed') statusColor = 'text-green-500 bg-green-500/10';
                else if (order.status === 'in-progress') statusColor = 'text-blue-500 bg-blue-500/10';
                else if (order.status === 'inspected') statusColor = 'text-purple-500 bg-purple-500/10';
                else if (order.status === 'cancelled') statusColor = 'text-red-500 bg-red-500/10';
                else statusColor = 'text-yellow-500 bg-yellow-500/10';
                
                return (
                  <div key={order.id} className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-black text-white">{order.customer_name}</h3>
                        <p className="text-xs text-slate-400">{order.phone}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => togglePaidStatus(order.id, order.is_paid)} className={`p-2 rounded-xl ${order.is_paid ? 'text-green-500' : 'text-slate-500'}`}><CheckCircle2 className="w-4 h-4" /></button>
                        <button onClick={() => { setEditingOrder(order); setFormData(order); setShowOrderModal(true); }} className="p-2 text-slate-400 hover:text-white"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => deleteOrder(order.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="text-sm mb-2">🔧 {order.device_type || order.device || 'جهاز'} - {order.brand || 'ماركة'}</div>
                    <div className="text-xs text-slate-400 mb-3">{order.address || 'لا يوجد عنوان'}</div>
                    
                    {/* عرض قيمة الكشف إذا كانت الحالة inspected */}
                    {order.status === 'inspected' && order.inspection_amount > 0 && (
                      <div className="bg-purple-500/10 p-2 rounded-lg text-xs mb-3 flex justify-between">
                        <span>💰 قيمة الكشف:</span>
                        <span className="font-bold text-purple-400">{order.inspection_amount} ج.م</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
                        {order.status === 'completed' ? 'مكتمل' : order.status === 'in-progress' ? 'قيد التنفيذ' : order.status === 'inspected' ? 'تم الكشف' : order.status === 'cancelled' ? 'ملغي' : 'قيد الانتظار'}
                      </span>
                      <select 
                        value={order.status} 
                        onChange={(e) => handleStatusChange(order, e.target.value)} 
                        className="bg-slate-800 text-xs rounded-lg px-2 py-1 border border-slate-700"
                      >
                        <option value="pending">قيد الانتظار</option>
                        <option value="in-progress">قيد التنفيذ</option>
                        <option value="inspected">تم الكشف</option>
                        <option value="completed">مكتمل</option>
                        <option value="cancelled">ملغي</option>
                      </select>
                    </div>
                    {order.technician && <div className="text-xs text-slate-400 mt-2">الفني: {order.technician}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================== الفنيين ================== */}
        {activeTab === 'technicians' && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {technicians.map(tech => (
              <div key={tech.id} className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3"><Users className="w-8 h-8 text-orange-500" /></div>
                <h3 className="font-black text-white">{tech.name}</h3>
                <p className="text-xs text-slate-400 mb-3">{tech.specialization}</p>
                <div className="flex justify-center gap-2">
                  <button onClick={() => copyTechLink(tech.name, tech.id)} className="p-2 bg-slate-800 rounded-lg text-xs">{copiedId === tech.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
                  <button onClick={() => { setEditingTech(tech); setTechForm(tech); setShowTechModal(true); }} className="p-2 bg-slate-800 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteTechnician(tech.id)} className="p-2 bg-slate-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            <button onClick={() => { setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true }); setShowTechModal(true); }} className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-orange-500"><Plus className="w-6 h-6" /><span className="text-sm">إضافة فني</span></button>
          </div>
        )}

        {/* ================== التقارير ================== */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 p-5 rounded-2xl"><p className="text-slate-400">إجمالي الأوردرات</p><p className="text-3xl font-black">{orders.length}</p></div>
            <div className="bg-slate-900 p-5 rounded-2xl"><p className="text-slate-400">الأوردرات المكتملة</p><p className="text-3xl font-black text-green-500">{stats.completed}</p></div>
            <div className="bg-slate-900 p-5 rounded-2xl"><p className="text-slate-400">إجمالي أرباح الشركة</p><p className="text-3xl font-black text-orange-500">{stats.totalIncome.toLocaleString()} ج.م</p></div>
            <div className="bg-slate-900 p-5 rounded-2xl"><p className="text-slate-400">إجمالي المصاريف</p><p className="text-3xl font-black text-red-500">{orders.reduce((s,o)=>s+(o.parts_cost+o.transport_cost||0),0).toLocaleString()} ج.م</p></div>
          </div>
        )}

        {/* ================== الفواتير ================== */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">🧾 الفواتير (الأوردرات المكتملة)</h3>
            {orders.filter(o => o.status === 'completed').map(order => (
              <div key={order.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-wrap justify-between items-center gap-3">
                <div><p className="font-black">{order.customer_name}</p><p className="text-sm text-slate-400">{order.device_type || order.device} - {order.brand}</p></div>
                <button onClick={() => { setSelectedOrderForInvoice(order); setShowInvoiceModal(true); }} className="bg-orange-600 px-4 py-2 rounded-xl text-sm font-bold">طباعة فاتورة مع الضمان</button>
              </div>
            ))}
            {orders.filter(o => o.status === 'completed').length === 0 && <div className="text-center text-slate-400">لا توجد أوردرات مكتملة</div>}
          </div>
        )}

        {/* ================== الإشعارات ================== */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2"><Bell className="w-5 h-5" /> سجل الإشعارات</h3>
              {notifications.length > 0 && (
                <button onClick={deleteAllNotifications} className="bg-red-600/20 hover:bg-red-600 text-red-400 px-3 py-1 rounded-lg text-sm flex items-center gap-1"><Trash className="w-4 h-4" /> مسح الكل</button>
              )}
            </div>
            <div className="space-y-3">
              {notifications.map(notif => (
                <div key={notif.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex justify-between items-start">
                  <div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="text-orange-400 font-bold">{notif.action}</span>
                      <span className="text-slate-400">|</span>
                      <span>الفني: {notif.technician_name}</span>
                      <span className="text-slate-400">|</span>
                      <span>العميل: {notif.customer_name}</span>
                      {notif.details && <span className="text-slate-400">| التفاصيل: {notif.details}</span>}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{new Date(notif.created_at).toLocaleString('ar-EG')}</div>
                  </div>
                  <button onClick={() => deleteNotification(notif.id)} className="text-red-400 hover:text-red-500 p-1"><Trash className="w-4 h-4" /></button>
                </div>
              ))}
              {notifications.length === 0 && <div className="text-center text-slate-400 py-8">لا توجد إشعارات حتى الآن</div>}
            </div>
          </div>
        )}
      </main>

      {/* ================== مودال إضافة/تعديل أوردر (منسق بالكامل) ================== */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingOrder ? 'تعديل أوردر' : 'أوردر جديد'}</h3>
              <button onClick={() => setShowOrderModal(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveOrder} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">اسم العميل *</label>
                  <input type="text" value={formData.customer_name} onChange={e => handleFormChange('customer_name', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500" required />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">رقم الهاتف *</label>
                  <input type="text" value={formData.phone} onChange={e => handleFormChange('phone', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500" required />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">نوع الجهاز</label>
                  <select value={formData.device_type} onChange={e => handleFormChange('device_type', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white">
                    <option value="">اختر الجهاز</option>
                    {DEVICE_TYPES.map(d => <option key={d}>{d}</option>)}
                    <option value="other">أخرى</option>
                  </select>
                </div>
                {isOtherDevice && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">جهاز مخصص</label>
                    <input type="text" value={customDevice} onChange={e => setCustomDevice(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white" required />
                  </div>
                )}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">الماركة</label>
                  <select value={formData.brand} onChange={e => handleFormChange('brand', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white">
                    <option value="">اختر الماركة</option>
                    {BRANDS.map(b => <option key={b}>{b}</option>)}
                    <option value="other">أخرى</option>
                  </select>
                </div>
                {isOtherBrand && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">ماركة مخصصة</label>
                    <input type="text" value={customBrand} onChange={e => setCustomBrand(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white" required />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">العنوان</label>
                  <input type="text" value={formData.address} onChange={e => handleFormChange('address', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">وصف المشكلة</label>
                  <textarea rows={3} value={formData.problem_description} onChange={e => handleFormChange('problem_description', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">الفني</label>
                  <select value={formData.technician} onChange={e => handleFormChange('technician', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white">
                    <option value="">اختر فني</option>
                    {technicians.map(t => <option key={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">إجمالي المبلغ (ج.م)</label>
                  <input type="number" value={formData.total_amount} onChange={e => handleFormChange('total_amount', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">قطع غيار (ج.م)</label>
                  <input type="number" value={formData.parts_cost} onChange={e => handleFormChange('parts_cost', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">مواصلات (ج.م)</label>
                  <input type="number" value={formData.transport_cost} onChange={e => handleFormChange('transport_cost', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700 py-3 rounded-xl font-bold">حفظ</button>
                <button type="button" onClick={() => setShowOrderModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================== مودال إضافة/تعديل فني ================== */}
      {showTechModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingTech ? 'تعديل فني' : 'فني جديد'}</h3>
              <button onClick={() => setShowTechModal(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveTechnician} className="space-y-4">
              <input type="text" placeholder="الاسم" value={techForm.name} onChange={e => setTechForm({ ...techForm, name: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl" required />
              <input type="text" placeholder="رقم الهاتف" value={techForm.phone} onChange={e => setTechForm({ ...techForm, phone: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl" required />
              <input type="text" placeholder="التخصص" value={techForm.specialization} onChange={e => setTechForm({ ...techForm, specialization: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl" />
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-orange-600 py-3 rounded-xl font-bold">حفظ</button><button type="button" onClick={() => setShowTechModal(false)} className="flex-1 bg-slate-700 py-3 rounded-xl font-bold">إلغاء</button></div>
            </form>
          </div>
        </div>
      )}

      {/* ================== مودال إدخال قيمة الكشف ================== */}
      {showInspectModal && selectedOrderForInspect && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2"><DollarSign className="w-5 h-5 text-yellow-400" /> كشف بقيمة</h3>
              <button onClick={() => setShowInspectModal(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">💰 قيمة الكشف (ج.م)</label>
                <input type="number" value={inspectAmount} onChange={e => setInspectAmount(e.target.value)} placeholder="مثال: 500" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500" autoFocus />
              </div>
              <div className="flex gap-3">
                <button onClick={saveInspection} className="flex-1 bg-orange-600 hover:bg-orange-700 py-3 rounded-xl font-bold">تأكيد الكشف</button>
                <button onClick={() => setShowInspectModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-bold">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================== مودال اعتماد الفاتورة والضمان ================== */}
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
