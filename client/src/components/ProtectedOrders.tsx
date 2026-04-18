import React, { useState, useCallback, useEffect } from 'react';
import { 
  Plus, Search, LayoutDashboard, Users, 
  CheckCircle2, AlertCircle, 
  Edit, Trash2, RefreshCw, Phone,
  Copy, Check, Trash, Bell, DollarSign, X, Printer, UserPlus, UserMinus, LogOut, Send
} from "lucide-react";
import AdminPermissions from './AdminPermissions';

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

const DEVICE_TYPES = ['غسالة', 'ثلاجة', 'بوتاجاز', 'سخان', 'تكييف', 'ميكروويف', 'غسالة أطباق'];
const BRANDS = ['سامسونج', 'LG', 'شارب', 'توشيبا', 'زانوسي', 'يونيون إير', 'فريش', 'وايت ويل', 'أريستون', 'بيكو', 'هوفر', 'إنديست'];

const fetchAPI = async (endpoint: string, options?: RequestInit) => {
  const url = `${supabaseUrl}/rest/v1/${endpoint}`;
  const res = await fetch(url, {
    headers: { 
      'apikey': supabaseKey, 
      'Authorization': `Bearer ${supabaseKey}`, 
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (res.status === 204 || options?.method === 'DELETE') return { success: true };
  const text = await res.text();
  if (!text) return { success: true };
  try { return JSON.parse(text); } catch (e) { console.error("JSON parse error:", text); return { success: true }; }
};

const addNotification = async (action: string, details: string) => {
  try {
    await fetch('https://hjrnfsdvrrwgyppqhwml.supabase.co/rest/v1/notifications', {
      method: 'POST',
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details, user_name: 'المدير', created_at: new Date().toISOString() })
    });
  } catch (err) { console.error(err); }
};

// مزامنة الفنيين مع users
const syncTechniciansToUsers = async () => {
  try {
    const techs = await fetchAPI('technicians?select=*');
    if (!techs || techs.length === 0) return;
    for (const tech of techs) {
      const userData = { username: tech.username, password: tech.password, name: tech.name, phone: tech.phone || '', role: 'tech', is_active: tech.is_active };
      const updateRes = await fetch(`${supabaseUrl}/rest/v1/users?username=eq.${tech.username}`, {
        method: 'PATCH', headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(userData)
      });
      if (updateRes.status === 404) {
        await fetch(`${supabaseUrl}/rest/v1/users`, { method: 'POST', headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(userData) });
      }
    }
    console.log("✅ تمت مزامنة الفنيين");
  } catch (err) { console.error("❌ فشل مزامنة الفنيين:", err); }
};

export default function ProtectedOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [cashLedger, setCashLedger] = useState<any[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'technicians' | 'cash' | 'partners' | 'notifications' | 'permissions'>('orders');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingTech, setEditingTech] = useState<any>(null);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [editingCash, setEditingCash] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [filterTechStatus, setFilterTechStatus] = useState<'all' | 'active' | 'inactive'>('active');
  const [cashFilterDate, setCashFilterDate] = useState('');
  const [cashForm, setCashForm] = useState({ type: 'expense', amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
  const [partnerForm, setPartnerForm] = useState({ name: '', share_percentage: 0, phone: '', is_active: true });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTechnician, setFilterTechnician] = useState('');
  const [filterDeviceType, setFilterDeviceType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterDelay, setFilterDelay] = useState<'all' | 'delayed'>('all');
  
  const [customDevice, setCustomDevice] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [isOtherDevice, setIsOtherDevice] = useState(false);
  const [isOtherBrand, setIsOtherBrand] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '',
    status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false,
    date: new Date().toLocaleDateString("ar-EG")
  });
  
  const [techForm, setTechForm] = useState({ name: '', phone: '', specialization: '', is_active: true, username: '', password: '' });
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, cancelled: 0, totalIncome: 0 });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const role = localStorage.getItem('userRole');
    if (!storedUser) { window.location.href = '/login'; return; }
    setCurrentUser(JSON.parse(storedUser));
    setUserRole(role || 'user');
  }, []);

  const canEditDelete = () => userRole === 'admin';
  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); window.location.href = "/login"; };

  const formatPhoneForWhatsApp = (phone: string) => {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/[^\d]/g, '');
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    if (cleaned.length === 10) cleaned = '20' + cleaned;
    return cleaned;
  };

  // إرسال تفاصيل الأوردر للفني عبر واتساب
  const sendOrderToTechnician = (order: any) => {
    if (!order.technician) { alert("⚠️ لم يتم تحديد فني لهذا الأوردر"); return; }
    const tech = technicians.find(t => t.name === order.technician);
    if (!tech || !tech.phone) { alert("⚠️ رقم هاتف الفني غير موجود"); return; }
    const phone = formatPhoneForWhatsApp(tech.phone);
    const message = `🔧 *طلب صيانة جديد* 🔧\n\n🔢 *رقم الأوردر:* ${order.order_number}\n👤 *العميل:* ${order.customer_name}\n📞 *هاتف العميل:* ${order.phone}\n🔧 *الجهاز:* ${order.device_type} - ${order.brand}\n📍 *العنوان:* ${order.address || 'غير محدد'}\n📝 *المشكلة:* ${order.problem_description || 'لا توجد'}\n\n💰 *المبلغ:* ${order.total_amount} ج.م\n✅ *يرجى التواصل مع العميل في أقرب وقت.*`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // نسخ بيانات الأوردر
  const copyOrderDetails = (order: any) => {
    const text = `الأوردر رقم: ${order.order_number}\nالعميل: ${order.customer_name}\nالهاتف: ${order.phone}\nالجهاز: ${order.device_type} - ${order.brand}\nالعنوان: ${order.address}\nالمشكلة: ${order.problem_description}\nالفني: ${order.technician}\nالمبلغ: ${order.total_amount} ج.م`;
    navigator.clipboard.writeText(text);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendWhatsAppToCustomerOnCreate = (order: any) => {
    const phone = formatPhoneForWhatsApp(order.phone);
    if (!phone) return;
    const message = `📝 *تم استلام طلب الصيانة بنجاح* 📝\n\n🔢 *رقم الأوردر:* ${order.order_number}\n👤 *العميل:* ${order.customer_name}\n🔧 *الجهاز:* ${order.device_type} - ${order.brand}\n📍 *العنوان:* ${order.address || 'غير محدد'}\n\n✅ تم تسجيل طلبك وسيتم التواصل معك قريباً.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getDaysDifference = (dateStr: string, status: string) => {
    if (status === 'inspected') return 0;
    if (!dateStr) return 0;
    let orderDate: Date;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]), month = parseInt(parts[1]) - 1, year = parseInt(parts[2]);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) orderDate = new Date(year, month, day);
        else return 0;
      } else return 0;
    } else {
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
    if (order.status === 'inspected') return false;
    return getDaysDifference(order.date, order.status) > 2;
  };

  const fetchNotifications = useCallback(async () => {
    try { const data = await fetchAPI('notifications?select=*&order=created_at.desc'); setNotifications(data || []); } catch (err) { console.error(err); }
  }, []);
  const fetchPartners = useCallback(async () => {
    try { const data = await fetchAPI('partners?select=*&order=created_at.desc'); setPartners(data || []); } catch (err) { console.error(err); }
  }, []);
  const fetchCashLedger = useCallback(async () => {
    try {
      let endpoint = 'cash_ledger?select=*&order=date.desc';
      if (cashFilterDate) endpoint = `cash_ledger?select=*&date=eq.${cashFilterDate}&order=date.desc`;
      const data = await fetchAPI(endpoint);
      setCashLedger(data || []);
      const balance = (data || []).reduce((acc: number, entry: any) => entry.type === 'income' ? acc + entry.amount : acc - entry.amount, 0);
      setCashBalance(balance);
    } catch (err) { console.error(err); }
  }, [cashFilterDate]);

  const addCashEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCash) await fetchAPI(`cash_ledger?id=eq.${editingCash.id}`, { method: 'PATCH', body: JSON.stringify(cashForm) });
      else await fetchAPI('cash_ledger', { method: 'POST', body: JSON.stringify(cashForm) });
      await addNotification(editingCash ? 'تعديل حركة خزنة' : 'إضافة حركة خزنة', `تم ${editingCash ? 'تعديل' : 'إضافة'} حركة ${cashForm.type} بقيمة ${cashForm.amount} ج.م`);
      setShowCashModal(false); setEditingCash(null); setCashForm({ type: 'expense', amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
      fetchCashLedger();
    } catch (err) { console.error(err); }
  };
  const deleteCashEntry = async (id: number) => {
    if (confirm('حذف هذه الحركة؟')) {
      await fetchAPI(`cash_ledger?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف حركة خزنة', 'تم حذف حركة من سجل الخزنة');
      fetchCashLedger();
    }
  };

  const addCompanyProfitToCash = async (order: any) => {
    const companyShare = order.company_share || 0;
    if (order.profit_added_to_cash) { alert("⚠️ تم إضافة أرباح هذا الأوردر للخزنة مسبقاً"); return false; }
    if (companyShare <= 0) { alert("❌ لا توجد أرباح للشركة"); return false; }
    if (!order.is_paid) { alert("❌ الأوردر لم يتم تحصيله بعد."); return false; }
    if (order.status !== 'completed') { alert("❌ الأوردر لم يكتمل بعد."); return false; }
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${supabaseUrl}/rest/v1/cash_ledger`, {
        method: 'POST', headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'income', amount: companyShare, description: `أرباح شركة من أوردر ${order.customer_name} (رقم ${order.order_number})`, date: today })
      });
      if (response.ok) {
        await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`, {
          method: 'PATCH', headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ profit_added_to_cash: true })
        });
        await addNotification('إضافة أرباح للخزنة', `✅ تم إضافة ${companyShare} ج.م للخزنة من أوردر ${order.order_number} (${order.customer_name})`);
        await fetchCashLedger(); await fetchData();
        return true;
      } else { const error = await response.text(); alert(`❌ فشل إضافة الأرباح: ${error}`); return false; }
    } catch (err) { alert(`❌ حدث خطأ في الاتصال: ${err.message}`); return false; }
  };

  const distributeDailyProfit = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const alreadyDistributed = (cashLedger || []).some(c => c.date === today && c.type === 'profit_distribution');
      if (alreadyDistributed && !confirm("⚠️ تم توزيع أرباح اليوم بالفعل. هل تريد التوزيع مرة أخرى؟")) return;
      const todayIncome = (cashLedger || []).filter(c => c.date === today && c.type === 'income').reduce((sum, c) => sum + Number(c.amount), 0);
      const todayExpenses = (cashLedger || []).filter(c => c.date === today && c.type === 'expense').reduce((sum, c) => sum + Number(c.amount), 0);
      const netProfit = todayIncome - todayExpenses;
      if (netProfit <= 0) { alert(`⚠️ لا توجد أرباح صافية اليوم للتوزيع.`); return; }
      const activePartners = (partners || []).filter(p => p.is_active === true);
      if (activePartners.length === 0) { alert("⚠️ لا يوجد شركاء نشطون"); return; }
      if (!confirm(`💰 سيتم توزيع ${netProfit.toLocaleString()} ج.م على ${activePartners.length} شريك. هل تريد الاستمرار؟`)) return;
      for (const partner of activePartners) {
        const shareAmount = Math.floor((netProfit * Number(partner.share_percentage)) / 100);
        if (shareAmount > 0) {
          await fetchAPI('cash_ledger', {
            method: 'POST', body: JSON.stringify({ type: 'profit_distribution', amount: shareAmount, description: `📤 توزيع أرباح: ${partner.name} (${partner.share_percentage}%) - ${today}`, date: today })
          });
        }
      }
      await addNotification('توزيع أرباح يومية', `✅ تم توزيع ${netProfit.toLocaleString()} ج.م على الشركاء`);
      await fetchCashLedger();
      alert(`✅ تم توزيع ${netProfit.toLocaleString()} ج.م على الشركاء`);
    } catch (err) { console.error(err); alert("❌ حدث خطأ أثناء توزيع الأرباح"); }
  };

  const fetchData = useCallback(async () => {
    try {
      const [ordersData, techsData] = await Promise.all([ fetchAPI('orders?select=*&order=created_at.desc'), fetchAPI('technicians?select=*') ]);
      setOrders(ordersData || []); setTechnicians(techsData || []);
      const pending = (ordersData || []).filter((o: any) => o.status === 'pending').length;
      const inProgress = (ordersData || []).filter((o: any) => o.status === 'in-progress').length;
      const completed = (ordersData || []).filter((o: any) => o.status === 'completed').length;
      const cancelled = (ordersData || []).filter((o: any) => o.status === 'cancelled').length;
      const totalIncome = (ordersData || []).reduce((acc: number, o: any) => acc + (o.company_share || 0), 0);
      setStats({ pending, inProgress, completed, cancelled, totalIncome });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    addNotification('تسجيل دخول', 'تم تسجيل دخول المدير');
    fetchData(); fetchNotifications(); fetchCashLedger(); fetchPartners();
    const interval = setInterval(() => { fetchData(); fetchNotifications(); fetchCashLedger(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  const calculateAmounts = (data: any) => {
    const total = parseFloat(data.total_amount) || 0, parts = parseFloat(data.parts_cost) || 0, transport = parseFloat(data.transport_cost) || 0;
    const net = total - parts - transport, companyShare = Math.round(net * 0.5), techShare = net - companyShare;
    return { ...data, net_amount: net, company_share: companyShare, technician_share: techShare };
  };
  const handleFormChange = (field: string, value: any) => {
    if (field === 'device_type') { if (value === 'other') { setIsOtherDevice(true); setFormData({ ...formData, device_type: '' }); return; } else setIsOtherDevice(false); }
    if (field === 'brand') { if (value === 'other') { setIsOtherBrand(true); setFormData({ ...formData, brand: '' }); return; } else setIsOtherBrand(false); }
    const updated = { ...formData, [field]: value };
    setFormData(calculateAmounts(updated));
  };
  const sendWhatsAppToCustomer = (order: any, newStatus: string) => {
    const phone = formatPhoneForWhatsApp(order.phone);
    if (!phone) return;
    let statusMessage = "";
    switch (newStatus) {
      case 'in-progress': statusMessage = "🔧 تم بدء العمل على طلبك بواسطة الفني."; break;
      case 'inspected': statusMessage = "🔍 تم الكشف على جهازك. سيتم إبلاغك بالخطوات التالية."; break;
      case 'completed': statusMessage = "✅ تم إكمال طلب الصيانة بنجاح. شكراً لثقتك بنا!"; break;
      case 'cancelled': statusMessage = "❌ تم إلغاء طلب الصيانة. للاستفسار، يرجى الاتصال بنا."; break;
      default: return;
    }
    const message = `📢 *تحديث حالة طلب الصيانة* 📢\n\n🔢 *رقم الأوردر:* ${order.order_number}\n👤 *العميل:* ${order.customer_name}\n📝 *الحالة الجديدة:* ${statusMessage}\n\nشكراً لتواصلك معنا. 🌟`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };
  const updateOrderStatus = async (id: number, newStatus: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    try {
      await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
      await addNotification('تغيير حالة أوردر', `🔄 تم تغيير حالة أوردر ${order.customer_name} إلى ${newStatus}`);
      if (newStatus === 'completed' && order.is_paid) await addCompanyProfitToCash(order);
      sendWhatsAppToCustomer(order, newStatus);
      fetchData();
    } catch (err) { console.error(err); }
  };
  const togglePaidStatus = async (id: number, currentStatus: boolean) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    try {
      await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ is_paid: !currentStatus }) });
      await addNotification('تحديث حالة الدفع', `✅ تم تحديث حالة تحصيل أوردر ${order.customer_name} إلى ${!currentStatus ? 'تم التحصيل' : 'لم يتم التحصيل'}`);
      if (!currentStatus && order.status === 'completed') await addCompanyProfitToCash({ ...order, is_paid: true });
      fetchData(); fetchCashLedger();
    } catch (err) { console.error(err); }
  };
  const deleteOrder = async (id: number) => {
    if (!canEditDelete()) return alert("ليس لديك صلاحية");
    if (confirm('هل أنت متأكد من الحذف؟')) { await fetchAPI(`orders?id=eq.${id}`, { method: 'DELETE' }); await addNotification('حذف أوردر', `تم حذف أوردر`); fetchData(); }
  };
  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalDevice = formData.device_type, finalBrand = formData.brand;
    if (isOtherDevice && customDevice.trim()) finalDevice = customDevice.trim();
    if (isOtherBrand && customBrand.trim()) finalBrand = customBrand.trim();
    const orderToSubmit = { ...formData, device_type: finalDevice, brand: finalBrand, date: new Date().toLocaleDateString("ar-EG") };
    try {
      if (editingOrder) {
        await fetchAPI(`orders?id=eq.${editingOrder.id}`, { method: 'PATCH', body: JSON.stringify(orderToSubmit) });
        await addNotification('تعديل أوردر', `تم تعديل أوردر ${orderToSubmit.customer_name}`);
      } else {
        const newOrder = await fetchAPI('orders', { method: 'POST', body: JSON.stringify(orderToSubmit) });
        await addNotification('إضافة أوردر', `تم إضافة أوردر للعميل ${orderToSubmit.customer_name}`);
        if (newOrder && newOrder[0]) { sendWhatsAppToCustomerOnCreate(newOrder[0]); sendOrderToTechnician(newOrder[0]); }
      }
      setShowOrderModal(false); setEditingOrder(null);
      setFormData({ customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '', status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false, date: new Date().toLocaleDateString("ar-EG") });
      setIsOtherDevice(false); setIsOtherBrand(false); setCustomDevice(''); setCustomBrand('');
      fetchData();
    } catch (err) { console.error(err); }
  };
  const submitTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTech) await fetchAPI(`technicians?id=eq.${editingTech.id}`, { method: 'PATCH', body: JSON.stringify(techForm) });
      else await fetchAPI('technicians', { method: 'POST', body: JSON.stringify(techForm) });
      await addNotification(editingTech ? 'تعديل فني' : 'إضافة فني', `${editingTech ? 'تم تعديل' : 'تم إضافة'} الفني ${techForm.name}`);
      await syncTechniciansToUsers();
      setShowTechModal(false); setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true, username: '', password: '' });
      fetchData();
    } catch (err) { console.error(err); }
  };
  const deleteTechnician = async (id: number) => {
    if (!canEditDelete()) return alert("ليس لديك صلاحية");
    if (confirm('هل أنت متأكد من الحذف؟')) {
      await fetchAPI(`technicians?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف فني', `تم حذف فني`);
      await syncTechniciansToUsers();
      await fetchData();
    }
  };
  const submitPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPartner) await fetchAPI(`partners?id=eq.${editingPartner.id}`, { method: 'PATCH', body: JSON.stringify(partnerForm) });
      else await fetchAPI('partners', { method: 'POST', body: JSON.stringify(partnerForm) });
      await addNotification(editingPartner ? 'تعديل شريك' : 'إضافة شريك', `${editingPartner ? 'تم تعديل' : 'تم إضافة'} الشريك ${partnerForm.name}`);
      setShowPartnerModal(false); setEditingPartner(null); setPartnerForm({ name: '', share_percentage: 0, phone: '', is_active: true });
      fetchPartners();
    } catch (err) { console.error(err); }
  };
  const deletePartner = async (id: number) => {
    if (!canEditDelete()) return alert("ليس لديك صلاحية");
    if (confirm('هل أنت متأكد من الحذف؟')) { await fetchAPI(`partners?id=eq.${id}`, { method: 'DELETE' }); await addNotification('حذف شريك', `تم حذف شريك`); fetchPartners(); }
  };

  if (loading) return <div className="text-center py-8">جاري التحميل...</div>;

  // ========== JSX ==========
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-40 px-4 py-3 border-b">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3"><LayoutDashboard className="w-6 h-6 text-orange-500" /><div><h1 className="text-lg font-bold text-gray-800">لوحة تحكم المدير</h1><p className="text-xs text-gray-500">{currentUser?.name || 'مدير النظام'}</p></div></div>
          <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><LogOut className="w-5 h-5" /></button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-3 text-center"><div className="text-2xl font-bold text-gray-800">{orders.length}</div><div className="text-xs text-gray-500">إجمالي الأوردرات</div></div>
          <div className="bg-white rounded-lg shadow p-3 text-center"><div className="text-2xl font-bold text-yellow-600">{stats.pending}</div><div className="text-xs text-gray-500">قيد الانتظار</div></div>
          <div className="bg-white rounded-lg shadow p-3 text-center"><div className="text-2xl font-bold text-green-600">{stats.completed}</div><div className="text-xs text-gray-500">مكتمل</div></div>
          <div className="bg-white rounded-lg shadow p-3 text-center"><div className="text-xl font-bold text-purple-600">{stats.totalIncome.toLocaleString()} ج.م</div><div className="text-xs text-gray-500">أرباح الشركة</div></div>
          <div className="bg-white rounded-lg shadow p-3 text-center"><div className="text-2xl font-bold text-blue-600">{technicians.filter(t => t.is_active).length}</div><div className="text-xs text-gray-500">فني متاح</div></div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
          <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'orders' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>📋 الأوردرات</button>
          <button onClick={() => setActiveTab('technicians')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'technicians' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>👨‍🔧 الفنيين</button>
          <button onClick={() => setActiveTab('cash')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'cash' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>💰 الخزنة</button>
          <button onClick={() => setActiveTab('partners')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'partners' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>🤝 الشركاء</button>
          <button onClick={() => setActiveTab('notifications')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${activeTab === 'notifications' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><Bell className="w-4 h-4" /> الإشعارات ({notifications.length})</button>
          {userRole === 'admin' && <button onClick={() => setActiveTab('permissions')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'permissions' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>🔐 الصلاحيات</button>}
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-3 flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[200px]"><Search className="absolute right-3 top-2.5 text-gray-400" size={18} /><input type="text" placeholder="بحث..." className="w-full pr-10 p-2 border rounded-lg" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="p-2 border rounded-lg"><option value="all">جميع الحالات</option><option value="pending">قيد الانتظار</option><option value="in-progress">قيد التنفيذ</option><option value="completed">مكتمل</option><option value="cancelled">ملغي</option></select>
              <select value={filterTechnician} onChange={e => setFilterTechnician(e.target.value)} className="p-2 border rounded-lg"><option value="">جميع الفنيين</option>{technicians.map(tech => <option key={tech.id} value={tech.name}>{tech.name}</option>)}</select>
              <select value={filterDelay} onChange={e => setFilterDelay(e.target.value as any)} className="p-2 border rounded-lg"><option value="all">الكل</option><option value="delayed">المتأخرة فقط</option></select>
              <button onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterTechnician(''); setFilterDelay('all'); }} className="bg-gray-500 text-white px-3 py-2 rounded-lg text-sm">مسح الكل</button>
              {canEditDelete() && <button onClick={() => { setEditingOrder(null); setFormData({ customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '', status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false, date: new Date().toLocaleDateString("ar-EG") }); setShowOrderModal(true); }} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"><Plus className="w-4 h-4" /> أوردر جديد</button>}
              <button onClick={fetchData} className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg"><RefreshCw className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              {orders.filter(order => {
                if (searchTerm && !order.customer_name.includes(searchTerm) && !order.phone.includes(searchTerm) && !String(order.order_number).includes(searchTerm)) return false;
                if (filterStatus !== 'all' && order.status !== filterStatus) return false;
                if (filterTechnician && order.technician !== filterTechnician) return false;
                if (filterDelay === 'delayed' && !isDelayed(order)) return false;
                return true;
              }).map(order => (
                <div key={order.id} className={`bg-white rounded-lg shadow p-4 border-r-4 ${isDelayed(order) ? 'border-red-500' : order.status === 'completed' ? 'border-green-500' : order.status === 'in-progress' ? 'border-blue-500' : 'border-yellow-500'}`}>
                  <div className="flex justify-between items-start">
                    <div><div className="font-bold text-gray-800">{order.customer_name}</div><div className="text-xs text-gray-500">رقم: {order.order_number}</div></div>
                    <div className="flex gap-2">
                      <button onClick={() => togglePaidStatus(order.id, order.is_paid)} className={`px-2 py-1 rounded-full text-xs font-bold ${order.is_paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{order.is_paid ? 'تم التحصيل' : 'لم يتم التحصيل'}</button>
                      <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)} className={`text-xs rounded-lg px-2 py-1 ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : order.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        <option value="pending">قيد الانتظار</option><option value="in-progress">قيد التنفيذ</option><option value="completed">مكتمل</option><option value="cancelled">ملغي</option>
                      </select>
                      {canEditDelete() && <button onClick={() => deleteOrder(order.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div>📞 {order.phone}</div><div>🔧 {order.device_type} - {order.brand}</div>
                    <div className="col-span-2">📍 {order.address}</div>
                    <div className="col-span-2">📝 {order.problem_description}</div>
                    <div>💰 {order.total_amount} ج.م</div><div>👨‍🔧 {order.technician || 'غير معين'}</div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => copyOrderDetails(order)} className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"><Copy className="w-4 h-4" /> {copiedId === order.id ? 'تم النسخ' : 'نسخ الأوردر'}</button>
                    <button onClick={() => sendOrderToTechnician(order)} className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"><Send className="w-4 h-4" /> إرسال للفني واتساب</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technicians Tab - تصميم فاتح */}
        {activeTab === 'technicians' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center"><div className="flex gap-2"><select value={filterTechStatus} onChange={e => setFilterTechStatus(e.target.value as any)} className="p-2 border rounded-lg"><option value="active">النشطون</option><option value="inactive">غير النشطون</option><option value="all">الجميع</option></select></div>{canEditDelete() && <button onClick={() => { setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true, username: '', password: '' }); setShowTechModal(true); }} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"><Plus className="w-4 h-4" /> إضافة فني</button>}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {technicians.filter(tech => filterTechStatus === 'all' ? true : filterTechStatus === 'active' ? tech.is_active : !tech.is_active).map(tech => (
                <div key={tech.id} className="bg-white rounded-lg shadow p-4"><div className="flex justify-between"><div><div className="font-bold text-gray-800">{tech.name}</div><div className="text-xs text-gray-500">{tech.specialization || 'عام'}</div></div><span className={`text-xs px-2 py-0.5 rounded-full ${tech.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{tech.is_active ? 'نشط' : 'غير نشط'}</span></div><div className="flex justify-between mt-3">{canEditDelete() && <><button onClick={() => { setEditingTech(tech); setTechForm(tech); setShowTechModal(true); }} className="text-blue-500"><Edit className="w-4 h-4" /></button><button onClick={() => deleteTechnician(tech.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></>}</div></div>
              ))}
            </div>
          </div>
        )}

        {/* Cash Tab - تصميم فاتح */}
        {activeTab === 'cash' && (
          <div className="space-y-4"><div className="flex justify-between items-center flex-wrap gap-2"><div className="text-lg font-bold text-gray-800">الرصيد الحالي: <span className="text-green-600">{cashBalance.toLocaleString()} ج.م</span></div><div className="flex gap-2"><input type="date" value={cashFilterDate} onChange={e => setCashFilterDate(e.target.value)} className="p-2 border rounded-lg" /><button onClick={() => setCashFilterDate('')} className="bg-gray-500 text-white px-3 py-2 rounded-lg">إلغاء الفلتر</button>{canEditDelete() && <button onClick={() => { setEditingCash(null); setCashForm({ type: 'expense', amount: 0, description: '', date: new Date().toISOString().split('T')[0] }); setShowCashModal(true); }} className="bg-orange-500 text-white px-3 py-2 rounded-lg flex items-center gap-1"><Plus className="w-4 h-4" /> حركة جديدة</button>}<button onClick={distributeDailyProfit} className="bg-purple-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"><DollarSign className="w-4 h-4" /> توزيع أرباح اليوم</button></div></div>
          <div className="space-y-2">{cashLedger.map(entry => (<div key={entry.id} className={`bg-white rounded-lg shadow p-3 border-r-4 ${entry.type === 'income' ? 'border-green-500' : entry.type === 'expense' ? 'border-red-500' : 'border-blue-500'}`}><div className="flex justify-between"><span>{entry.date}</span><span className={entry.type === 'income' ? 'text-green-600' : 'text-red-600'}>{entry.type === 'income' ? '💰 إيراد' : entry.type === 'expense' ? '💸 مصروف' : '📤 توزيع أرباح'}</span><span>{entry.amount.toLocaleString()} ج.م</span>{canEditDelete() && <button onClick={() => deleteCashEntry(entry.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>}</div><div className="text-xs text-gray-500 mt-1">{entry.description}</div></div>))}</div></div>
        )}

        {/* Partners Tab - تصميم فاتح */}
        {activeTab === 'partners' && (
          <div className="space-y-4"><div className="flex justify-end">{canEditDelete() && <button onClick={() => { setEditingPartner(null); setPartnerForm({ name: '', share_percentage: 0, phone: '', is_active: true }); setShowPartnerModal(true); }} className="bg-orange-500 text-white px-3 py-2 rounded-lg flex items-center gap-1"><Plus className="w-4 h-4" /> شريك جديد</button>}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{partners.map(partner => (<div key={partner.id} className="bg-white rounded-lg shadow p-4"><div className="flex justify-between"><div><div className="font-bold text-gray-800">{partner.name}</div><div className="text-xs text-gray-500">نسبة: {partner.share_percentage}%</div></div><span className={`text-xs px-2 py-0.5 rounded-full ${partner.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{partner.is_active ? 'نشط' : 'غير نشط'}</span></div>{canEditDelete() && <div className="flex gap-2 mt-3"><button onClick={() => { setEditingPartner(partner); setPartnerForm(partner); setShowPartnerModal(true); }} className="text-blue-500"><Edit className="w-4 h-4" /></button><button onClick={() => deletePartner(partner.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></div>}</div>))}</div></div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (<div className="space-y-2">{notifications.map(notif => (<div key={notif.id} className="bg-white rounded-lg shadow p-3"><div className="flex justify-between text-xs text-gray-500"><span>{new Date(notif.created_at).toLocaleString('ar-EG')}</span><span>{notif.user_name}</span></div><div className="mt-1"><span className="font-bold">{notif.action}:</span> {notif.details}</div></div>))}</div>)}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && userRole === 'admin' && <AdminPermissions />}
      </main>

      {/* باقي المودالات (Order, Technician, Partner, Cash) كما هي في الكود السابق ولكن مع الحفاظ على التصميم الفاتح */}
      {/* ... (سأضيفها في الرد التالي لتجنب طول الرد) */}
    </div>
  );
}
