import React, { useState, useCallback, useEffect } from 'react';
import { 
  Plus, Search, LayoutDashboard, Users, 
  CheckCircle2, AlertCircle, 
  Edit, Trash2, RefreshCw, Phone,
  Copy, Check, Trash, Bell, DollarSign, X, Printer, UserPlus, UserMinus, LogOut
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
  
  if (res.status === 204 || options?.method === 'DELETE') {
    return { success: true };
  }
  
  const text = await res.text();
  if (!text) return { success: true };
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("JSON parse error:", text);
    return { success: true };
  }
};

const addNotification = async (action: string, details: string) => {
  try {
    await fetch('https://hjrnfsdvrrwgyppqhwml.supabase.co/rest/v1/notifications', {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: action,
        details: details,
        user_name: 'المدير',
        created_at: new Date().toISOString()
      })
    });
  } catch (err) {
    console.error("خطأ في تسجيل الإشعار:", err);
  }
};

// دالة لمزامنة الفنيين من technicians إلى users (تلقائياً)
const syncTechniciansToUsers = async () => {
  try {
    const techs = await fetchAPI('technicians?select=*');
    if (!techs || techs.length === 0) return;

    for (const tech of techs) {
      const userData = {
        username: tech.username,
        password: tech.password,
        name: tech.name,
        phone: tech.phone || '',
        role: 'tech',
        is_active: tech.is_active
      };
      
      // محاولة تحديث إذا كان موجوداً
      const updateRes = await fetch(`${supabaseUrl}/rest/v1/users?username=eq.${tech.username}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      // إذا لم يكن موجوداً (404) نقوم بالإضافة
      if (updateRes.status === 404) {
        await fetch(`${supabaseUrl}/rest/v1/users`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
      }
    }
    console.log("✅ تمت مزامنة الفنيين مع جدول users");
  } catch (err) {
    console.error("❌ فشل مزامنة الفنيين:", err);
  }
};

export default function ProtectedOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [cashLedger, setCashLedger] = useState<any[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'technicians' | 'reports' | 'invoicesReview' | 'cash' | 'partners' | 'notifications' | 'permissions'>('orders');
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
    status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, 
    net_amount: 0, company_share: 0, technician_share: 0, is_paid: false,
    date: new Date().toLocaleDateString("ar-EG")
  });
  
  const [techForm, setTechForm] = useState({ 
    name: '', phone: '', specialization: '', is_active: true,
    username: '', password: '' 
  });
  
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, cancelled: 0, totalIncome: 0 });

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const role = localStorage.getItem('userRole');
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }
    setCurrentUser(JSON.parse(storedUser));
    setUserRole(role || 'user');
  }, []);

  const canEditDelete = () => userRole === 'admin';

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/[^\d]/g, '');
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    if (cleaned.length === 10) cleaned = '20' + cleaned;
    return cleaned;
  };

  const sendWhatsAppToCustomerOnCreate = (order: any) => {
    const phone = formatPhoneForWhatsApp(order.phone);
    if (!phone) {
      console.error("رقم الهاتف غير صالح:", order.phone);
      return;
    }
    const message = `📝 *تم استلام طلب الصيانة بنجاح* 📝\n\n` +
      `🔢 *رقم الأوردر:* ${order.order_number}\n` +
      `👤 *العميل:* ${order.customer_name}\n` +
      `🔧 *الجهاز:* ${order.device_type} - ${order.brand}\n` +
      `📍 *العنوان:* ${order.address || 'غير محدد'}\n\n` +
      `✅ تم تسجيل طلبك وسيتم التواصل معك قريباً من قبل الفني المختص.\n\n` +
      `شكراً لثقتك بنا. 🌟`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getDaysDifference = (dateStr: string, status: string) => {
    if (status === 'inspected') return 0;
    if (!dateStr) return 0;
    let orderDate: Date;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
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
    const daysDiff = getDaysDifference(order.date, order.status);
    return daysDiff > 2;
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await fetchAPI('notifications?select=*&order=created_at.desc');
      setNotifications(data || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchPartners = useCallback(async () => {
    try {
      const data = await fetchAPI('partners?select=*&order=created_at.desc');
      setPartners(data || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchCashLedger = useCallback(async () => {
    try {
      let endpoint = 'cash_ledger?select=*&order=date.desc';
      if (cashFilterDate) endpoint = `cash_ledger?select=*&date=eq.${cashFilterDate}&order=date.desc`;
      const data = await fetchAPI(endpoint);
      setCashLedger(data || []);
      const balance = (data || []).reduce((acc: number, entry: any) => {
        if (entry.type === 'income') return acc + entry.amount;
        if (entry.type === 'expense') return acc - entry.amount;
        return acc;
      }, 0);
      setCashBalance(balance);
    } catch (err) { console.error(err); }
  }, [cashFilterDate]);

  const addCashEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCash) {
        await fetchAPI(`cash_ledger?id=eq.${editingCash.id}`, { method: 'PATCH', body: JSON.stringify(cashForm) });
        await addNotification('تعديل حركة خزنة', `تم تعديل حركة ${cashForm.type} بقيمة ${cashForm.amount} ج.م`);
      } else {
        await fetchAPI('cash_ledger', { method: 'POST', body: JSON.stringify(cashForm) });
        await addNotification('إضافة حركة خزنة', `تم إضافة حركة ${cashForm.type} بقيمة ${cashForm.amount} ج.م`);
      }
      setShowCashModal(false);
      setEditingCash(null);
      setCashForm({ type: 'expense', amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
      fetchCashLedger();
    } catch (err) { console.error(err); }
  };

  const deleteCashEntry = async (id: number) => {
    if (confirm('حذف هذه الحركة؟')) {
      await fetchAPI(`cash_ledger?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف حركة خزنة', `تم حذف حركة من سجل الخزنة`);
      fetchCashLedger();
    }
  };

  const addCompanyProfitToCash = async (order: any) => {
    const companyShare = order.company_share || 0;
    
    console.log("🔍 محاولة إضافة أرباح للخزنة:", {
      companyShare,
      is_paid: order.is_paid,
      status: order.status,
      customer: order.customer_name,
      order_id: order.id,
      order_number: order.order_number,
      profit_added_to_cash: order.profit_added_to_cash
    });
    
    if (order.profit_added_to_cash) {
      console.log("⚠️ تم إضافة أرباح هذا الأوردر مسبقاً");
      alert("⚠️ تم إضافة أرباح هذا الأوردر للخزنة مسبقاً");
      return false;
    }
    
    if (companyShare <= 0) {
      console.log("❌ لا توجد أرباح للشركة");
      alert("❌ لا توجد أرباح للشركة (company_share = 0)");
      return false;
    }
    
    if (!order.is_paid) {
      console.log("❌ الأوردر لم يتم تحصيله بعد");
      alert("❌ الأوردر لم يتم تحصيله بعد. قم بتفعيل التحصيل أولاً.");
      return false;
    }
    
    if (order.status !== 'completed') {
      console.log("❌ الأوردر لم يكتمل بعد");
      alert("❌ الأوردر لم يكتمل بعد. غير الحالة إلى مكتمل أولاً.");
      return false;
    }
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`${supabaseUrl}/rest/v1/cash_ledger`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'income',
          amount: companyShare,
          description: `أرباح شركة من أوردر ${order.customer_name} (رقم ${order.order_number})`,
          date: today
        })
      });
      
      if (response.ok) {
        await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ profit_added_to_cash: true })
        });
        
        await addNotification('إضافة أرباح للخزنة', `✅ تم إضافة ${companyShare} ج.م للخزنة من أوردر ${order.order_number} (${order.customer_name})`);
        await fetchCashLedger();
        await fetchData();
        return true;
      } else {
        const error = await response.text();
        console.error("❌ خطأ من Supabase:", error);
        alert(`❌ فشل إضافة الأرباح: ${error}`);
        return false;
      }
    } catch (err) {
      console.error("❌ خطأ في الشبكة:", err);
      alert(`❌ حدث خطأ في الاتصال: ${err.message}`);
      return false;
    }
  };

  const distributeDailyProfit = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const alreadyDistributed = (cashLedger || []).some(c => c.date === today && c.type === 'profit_distribution');
      if (alreadyDistributed) {
        if (!confirm("⚠️ تم توزيع أرباح اليوم بالفعل. هل تريد التوزيع مرة أخرى؟")) {
          return;
        }
      }

      const todayIncome = (cashLedger || []).filter(c => c.date === today && c.type === 'income').reduce((sum, c) => sum + Number(c.amount), 0);
      const todayExpenses = (cashLedger || []).filter(c => c.date === today && c.type === 'expense').reduce((sum, c) => sum + Number(c.amount), 0);
      const netProfit = todayIncome - todayExpenses;
      
      if (netProfit <= 0) {
        alert(`⚠️ لا توجد أرباح صافية اليوم للتوزيع.`);
        return;
      }
      
      const activePartners = (partners || []).filter(p => p.is_active === true);
      if (activePartners.length === 0) {
        alert("⚠️ لا يوجد شركاء نشطون");
        return;
      }
      
      if (!confirm(`💰 سيتم توزيع ${netProfit.toLocaleString()} ج.م على ${activePartners.length} شريك. هل تريد الاستمرار؟`)) {
        return;
      }

      for (const partner of activePartners) {
        const shareAmount = Math.floor((netProfit * Number(partner.share_percentage)) / 100);
        if (shareAmount > 0) {
          await fetchAPI('cash_ledger', {
            method: 'POST',
            body: JSON.stringify({
              type: 'profit_distribution',
              amount: shareAmount,
              description: `📤 توزيع أرباح: ${partner.name} (${partner.share_percentage}%) - ${today}`,
              date: today
            })
          });
        }
      }
      
      await addNotification('توزيع أرباح يومية', `✅ تم توزيع ${netProfit.toLocaleString()} ج.م على الشركاء`);
      await fetchCashLedger();
      alert(`✅ تم توزيع ${netProfit.toLocaleString()} ج.م على الشركاء`);
      
    } catch (err) {
      console.error("خطأ في توزيع الأرباح:", err);
      alert("❌ حدث خطأ أثناء توزيع الأرباح");
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [ordersData, techsData] = await Promise.all([
        fetchAPI('orders?select=*&order=created_at.desc'),
        fetchAPI('technicians?select=*')
      ]);
      setOrders(ordersData || []);
      setTechnicians(techsData || []);
      
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
    fetchData();
    fetchNotifications();
    fetchCashLedger();
    fetchPartners();
    const interval = setInterval(() => { fetchData(); fetchNotifications(); fetchCashLedger(); }, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const sendWhatsAppToCustomer = (order: any, newStatus: string) => {
    const phone = formatPhoneForWhatsApp(order.phone);
    if (!phone) {
      console.error("رقم الهاتف غير صالح:", order.phone);
      return;
    }
    let statusMessage = "";
    switch (newStatus) {
      case 'in-progress':
        statusMessage = "🔧 تم بدء العمل على طلبك بواسطة الفني.";
        break;
      case 'inspected':
        statusMessage = "🔍 تم الكشف على جهازك. سيتم إبلاغك بالخطوات التالية.";
        break;
      case 'completed':
        statusMessage = "✅ تم إكمال طلب الصيانة بنجاح. شكراً لثقتك بنا!";
        break;
      case 'cancelled':
        statusMessage = "❌ تم إلغاء طلب الصيانة. للاستفسار، يرجى الاتصال بنا.";
        break;
      default:
        return;
    }
    const message = `📢 *تحديث حالة طلب الصيانة* 📢\n\n🔢 *رقم الأوردر:* ${order.order_number}\n👤 *العميل:* ${order.customer_name}\n📝 *الحالة الجديدة:* ${statusMessage}\n\nشكراً لتواصلك معنا. 🌟`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const updateOrderStatus = async (id: number, newStatus: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    try {
      await fetchAPI(`orders?id=eq.${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify({ status: newStatus }) 
      });
      
      await addNotification('تغيير حالة أوردر', `🔄 تم تغيير حالة أوردر ${order.customer_name} إلى ${newStatus}`);
      
      if (newStatus === 'completed' && order.is_paid) {
        await addCompanyProfitToCash(order);
      }
      
      sendWhatsAppToCustomer(order, newStatus);
      fetchData();
    } catch (err) { 
      console.error("خطأ في تحديث حالة الأوردر:", err); 
    }
  };

  const togglePaidStatus = async (id: number, currentStatus: boolean) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    try {
      await fetchAPI(`orders?id=eq.${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify({ is_paid: !currentStatus }) 
      });
      
      await addNotification('تحديث حالة الدفع', `✅ تم تحديث حالة تحصيل أوردر ${order.customer_name} إلى ${!currentStatus ? 'تم التحصيل' : 'لم يتم التحصيل'}`);
      
      const updatedOrder = { ...order, is_paid: !currentStatus };
      
      if (!currentStatus && order.status === 'completed') {
        await addCompanyProfitToCash(updatedOrder);
      }
      
      fetchData();
      fetchCashLedger();
    } catch (err) { 
      console.error("خطأ في تحديث حالة الدفع:", err); 
    }
  };

  const deleteOrder = async (id: number) => {
    if (!canEditDelete()) return alert("ليس لديك صلاحية");
    if (confirm('هل أنت متأكد من الحذف؟')) {
      await fetchAPI(`orders?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف أوردر', `تم حذف أوردر`);
      fetchData();
    }
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalDevice = formData.device_type;
    let finalBrand = formData.brand;
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
        if (newOrder && newOrder[0]) sendWhatsAppToCustomerOnCreate(newOrder[0]);
      }
      setShowOrderModal(false);
      setEditingOrder(null);
      setFormData({ customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '', status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false, date: new Date().toLocaleDateString("ar-EG") });
      setIsOtherDevice(false); setIsOtherBrand(false); setCustomDevice(''); setCustomBrand('');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const submitTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTech) {
        await fetchAPI(`technicians?id=eq.${editingTech.id}`, { method: 'PATCH', body: JSON.stringify(techForm) });
        await addNotification('تعديل فني', `تم تعديل بيانات الفني ${techForm.name}`);
      } else {
        await fetchAPI('technicians', { method: 'POST', body: JSON.stringify(techForm) });
        await addNotification('إضافة فني', `تم إضافة فني جديد: ${techForm.name}`);
      }
      // مزامنة تلقائية مع جدول users
      await syncTechniciansToUsers();
      
      setShowTechModal(false);
      setEditingTech(null);
      setTechForm({ name: '', phone: '', specialization: '', is_active: true, username: '', password: '' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const deleteTechnician = async (id: number) => {
    if (!canEditDelete()) return alert("ليس لديك صلاحية");
    if (confirm('هل أنت متأكد من الحذف؟')) {
      await fetchAPI(`technicians?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف فني', `تم حذف فني`);
      // مزامنة تلقائية مع جدول users
      await syncTechniciansToUsers();
      await fetchData();
    }
  };

  const submitPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPartner) {
        await fetchAPI(`partners?id=eq.${editingPartner.id}`, { method: 'PATCH', body: JSON.stringify(partnerForm) });
        await addNotification('تعديل شريك', `تم تعديل بيانات الشريك ${partnerForm.name}`);
      } else {
        await fetchAPI('partners', { method: 'POST', body: JSON.stringify(partnerForm) });
        await addNotification('إضافة شريك', `تم إضافة شريك جديد: ${partnerForm.name}`);
      }
      setShowPartnerModal(false);
      setEditingPartner(null);
      setPartnerForm({ name: '', share_percentage: 0, phone: '', is_active: true });
      fetchPartners();
    } catch (err) { console.error(err); }
  };

  const deletePartner = async (id: number) => {
    if (!canEditDelete()) return alert("ليس لديك صلاحية");
    if (confirm('هل أنت متأكد من الحذف؟')) {
      await fetchAPI(`partners?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف شريك', `تم حذف شريك`);
      fetchPartners();
    }
  };

  if (loading) return <div className="text-center py-8">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200" dir="rtl">
      {/* Header */}
      <div className="bg-slate-800/80 border-b border-slate-700 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-orange-400" />
            <div>
              <h1 className="text-lg font-bold text-white">لوحة تحكم المدير</h1>
              <p className="text-xs text-orange-400">{currentUser?.name || 'مدير النظام'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-slate-800 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-orange-400">{orders.length}</div><div className="text-xs text-slate-400">إجمالي الأوردرات</div></div>
          <div className="bg-slate-800 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-yellow-400">{stats.pending}</div><div className="text-xs text-slate-400">قيد الانتظار</div></div>
          <div className="bg-slate-800 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-green-400">{stats.completed}</div><div className="text-xs text-slate-400">مكتمل</div></div>
          <div className="bg-slate-800 rounded-xl p-3 text-center"><div className="text-xl font-bold text-purple-400">{stats.totalIncome.toLocaleString()} ج.م</div><div className="text-xs text-slate-400">أرباح الشركة</div></div>
          <div className="bg-slate-800 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-blue-400">{technicians.filter(t => t.is_active).length}</div><div className="text-xs text-slate-400">فني متاح</div></div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-2">
          <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'orders' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>📋 الأوردرات</button>
          <button onClick={() => setActiveTab('technicians')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'technicians' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>👨‍🔧 الفنيين</button>
          <button onClick={() => setActiveTab('cash')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'cash' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>💰 الخزنة</button>
          <button onClick={() => setActiveTab('partners')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'partners' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>🤝 الشركاء</button>
          <button onClick={() => setActiveTab('notifications')} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 ${activeTab === 'notifications' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><Bell className="w-4 h-4" /> الإشعارات ({notifications.length})</button>
          {userRole === 'admin' && (
            <button onClick={() => setActiveTab('permissions')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'permissions' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>🔐 الصلاحيات</button>
          )}
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 bg-slate-800/50 p-3 rounded-xl">
              <input type="text" placeholder="بحث..." className="bg-slate-700 text-white px-3 py-2 rounded-lg text-sm flex-1" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-700 text-white px-3 py-2 rounded-lg text-sm"><option value="all">جميع الحالات</option><option value="pending">قيد الانتظار</option><option value="in-progress">قيد التنفيذ</option><option value="completed">مكتمل</option><option value="cancelled">ملغي</option></select>
              {canEditDelete() && <button onClick={() => { setEditingOrder(null); setFormData({ customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '', status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false, date: new Date().toLocaleDateString("ar-EG") }); setShowOrderModal(true); }} className="bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> أوردر جديد</button>}
              <button onClick={fetchData} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg text-sm"><RefreshCw className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              {orders.filter(order => {
                if (searchTerm && !order.customer_name.includes(searchTerm) && !order.phone.includes(searchTerm) && !String(order.order_number).includes(searchTerm)) return false;
                if (filterStatus !== 'all' && order.status !== filterStatus) return false;
                return true;
              }).map(order => (
                <div key={order.id} className="bg-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div><div className="font-bold text-white">{order.customer_name}</div><div className="text-xs text-slate-400">رقم: {order.order_number}</div></div>
                    <div className="flex gap-2">
                      <button onClick={() => togglePaidStatus(order.id, order.is_paid)} className={`px-2 py-1 rounded-full text-xs font-bold ${order.is_paid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{order.is_paid ? 'تم التحصيل' : 'لم يتم التحصيل'}</button>
                      <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)} className={`text-xs rounded-lg px-2 py-1 ${order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : order.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' : order.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        <option value="pending">قيد الانتظار</option><option value="in-progress">قيد التنفيذ</option><option value="completed">مكتمل</option><option value="cancelled">ملغي</option>
                      </select>
                      {canEditDelete() && <button onClick={() => deleteOrder(order.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mt-2">📞 {order.phone} | 🔧 {order.device_type} - {order.brand}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technicians Tab */}
        {activeTab === 'technicians' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2"><select value={filterTechStatus} onChange={e => setFilterTechStatus(e.target.value as any)} className="bg-slate-700 text-white px-3 py-2 rounded-lg text-sm"><option value="active">النشطون</option><option value="inactive">غير النشطون</option><option value="all">الجميع</option></select></div>
              {canEditDelete() && <button onClick={() => { setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true, username: '', password: '' }); setShowTechModal(true); }} className="bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> إضافة فني</button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {technicians.filter(tech => filterTechStatus === 'all' ? true : filterTechStatus === 'active' ? tech.is_active : !tech.is_active).map(tech => (
                <div key={tech.id} className="bg-slate-800 rounded-xl p-3">
                  <div className="flex justify-between"><div><div className="font-bold text-white">{tech.name}</div><div className="text-xs text-slate-400">{tech.specialization || 'عام'}</div></div><span className={`text-xs px-2 py-0.5 rounded-full ${tech.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{tech.is_active ? 'نشط' : 'غير نشط'}</span></div>
                  <div className="flex justify-between mt-3">
                    <button onClick={() => { navigator.clipboard.writeText(tech.username || ''); setCopiedId(tech.id); setTimeout(() => setCopiedId(null), 2000); }} className="text-slate-400 hover:text-white text-xs">نسخ الرابط</button>
                    {canEditDelete() && <button onClick={() => { setEditingTech(tech); setTechForm(tech); setShowTechModal(true); }} className="text-blue-400 hover:text-blue-300"><Edit className="w-4 h-4" /></button>}
                    {canEditDelete() && <button onClick={() => deleteTechnician(tech.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cash Tab */}
        {activeTab === 'cash' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="text-lg font-bold text-white">الرصيد الحالي: <span className="text-green-400">{cashBalance.toLocaleString()} ج.م</span></div>
              <div className="flex gap-2">
                <input type="date" value={cashFilterDate} onChange={e => setCashFilterDate(e.target.value)} className="bg-slate-700 text-white px-3 py-2 rounded-lg text-sm" />
                <button onClick={() => setCashFilterDate('')} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg text-sm">إلغاء الفلتر</button>
                {canEditDelete() && <button onClick={() => { setEditingCash(null); setCashForm({ type: 'expense', amount: 0, description: '', date: new Date().toISOString().split('T')[0] }); setShowCashModal(true); }} className="bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> حركة جديدة</button>}
                <button onClick={distributeDailyProfit} className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg text-sm flex items-center gap-1"><DollarSign className="w-4 h-4" /> توزيع أرباح اليوم</button>
              </div>
            </div>
            <div className="space-y-2">
              {cashLedger.map(entry => (
                <div key={entry.id} className={`bg-slate-800 rounded-xl p-3 ${entry.type === 'income' ? 'border-r-4 border-green-500' : entry.type === 'expense' ? 'border-r-4 border-red-500' : 'border-r-4 border-blue-500'}`}>
                  <div className="flex justify-between"><span>{entry.date}</span><span className={entry.type === 'income' ? 'text-green-400' : 'text-red-400'}>{entry.type === 'income' ? '💰 إيراد' : entry.type === 'expense' ? '💸 مصروف' : '📤 توزيع أرباح'}</span><span>{entry.amount.toLocaleString()} ج.م</span>{canEditDelete() && <button onClick={() => deleteCashEntry(entry.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>}</div>
                  <div className="text-xs text-slate-400 mt-1">{entry.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Partners Tab */}
        {activeTab === 'partners' && (
          <div className="space-y-4">
            <div className="flex justify-end">{canEditDelete() && <button onClick={() => { setEditingPartner(null); setPartnerForm({ name: '', share_percentage: 0, phone: '', is_active: true }); setShowPartnerModal(true); }} className="bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> شريك جديد</button>}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {partners.map(partner => (
                <div key={partner.id} className="bg-slate-800 rounded-xl p-3">
                  <div className="flex justify-between"><div><div className="font-bold text-white">{partner.name}</div><div className="text-xs text-slate-400">نسبة: {partner.share_percentage}%</div></div><span className={`text-xs px-2 py-0.5 rounded-full ${partner.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{partner.is_active ? 'نشط' : 'غير نشط'}</span></div>
                  {canEditDelete() && <div className="flex gap-2 mt-3"><button onClick={() => { setEditingPartner(partner); setPartnerForm(partner); setShowPartnerModal(true); }} className="text-blue-400"><Edit className="w-4 h-4" /></button><button onClick={() => deletePartner(partner.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button></div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-2">
            {notifications.map(notif => (
              <div key={notif.id} className="bg-slate-800 rounded-xl p-3">
                <div className="flex justify-between text-xs text-slate-400"><span>{new Date(notif.created_at).toLocaleString('ar-EG')}</span><span>{notif.user_name}</span></div>
                <div className="mt-1"><span className="font-bold">{notif.action}:</span> {notif.details}</div>
              </div>
            ))}
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && userRole === 'admin' && <AdminPermissions />}
      </main>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">{editingOrder ? 'تعديل أوردر' : 'إضافة أوردر جديد'}</h3><button onClick={() => setShowOrderModal(false)}><X className="w-5 h-5" /></button></div>
            <form onSubmit={submitOrder} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="اسم العميل" className="bg-slate-700 text-white p-2 rounded" value={formData.customer_name} onChange={e => handleFormChange('customer_name', e.target.value)} required />
                <input type="tel" placeholder="رقم الهاتف" className="bg-slate-700 text-white p-2 rounded" value={formData.phone} onChange={e => handleFormChange('phone', e.target.value)} required />
                <input type="text" placeholder="نوع الجهاز" className="bg-slate-700 text-white p-2 rounded" value={formData.device_type} onChange={e => handleFormChange('device_type', e.target.value)} />
                <input type="text" placeholder="الماركة" className="bg-slate-700 text-white p-2 rounded" value={formData.brand} onChange={e => handleFormChange('brand', e.target.value)} />
                <textarea placeholder="العنوان" className="bg-slate-700 text-white p-2 rounded" value={formData.address} onChange={e => handleFormChange('address', e.target.value)} />
                <textarea placeholder="وصف المشكلة" className="bg-slate-700 text-white p-2 rounded" value={formData.problem_description} onChange={e => handleFormChange('problem_description', e.target.value)} />
                <select value={formData.technician} onChange={e => handleFormChange('technician', e.target.value)} className="bg-slate-700 text-white p-2 rounded"><option value="">اختر الفني</option>{technicians.filter(t => t.is_active).map(tech => <option key={tech.id} value={tech.name}>{tech.name}</option>)}</select>
                <input type="number" placeholder="المبلغ الإجمالي" className="bg-slate-700 text-white p-2 rounded" value={formData.total_amount} onChange={e => handleFormChange('total_amount', parseFloat(e.target.value))} />
                <input type="number" placeholder="قطع الغيار" className="bg-slate-700 text-white p-2 rounded" value={formData.parts_cost} onChange={e => handleFormChange('parts_cost', parseFloat(e.target.value))} />
                <input type="number" placeholder="مصاريف النقل" className="bg-slate-700 text-white p-2 rounded" value={formData.transport_cost} onChange={e => handleFormChange('transport_cost', parseFloat(e.target.value))} />
              </div>
              <div className="flex gap-2"><label className="flex items-center gap-2"><input type="checkbox" checked={formData.is_paid} onChange={e => handleFormChange('is_paid', e.target.checked)} /> تم التحصيل</label></div>
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowOrderModal(false)} className="bg-slate-700 px-4 py-2 rounded">إلغاء</button><button type="submit" className="bg-orange-600 px-4 py-2 rounded">حفظ</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Technician Modal */}
      {showTechModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">{editingTech ? 'تعديل فني' : 'إضافة فني'}</h3><button onClick={() => setShowTechModal(false)}><X className="w-5 h-5" /></button></div>
            <form onSubmit={submitTechnician} className="space-y-4">
              <input type="text" placeholder="الاسم" className="bg-slate-700 text-white p-2 rounded w-full" value={techForm.name} onChange={e => setTechForm({...techForm, name: e.target.value})} required />
              <input type="tel" placeholder="رقم الهاتف" className="bg-slate-700 text-white p-2 rounded w-full" value={techForm.phone} onChange={e => setTechForm({...techForm, phone: e.target.value})} />
              <input type="text" placeholder="التخصص" className="bg-slate-700 text-white p-2 rounded w-full" value={techForm.specialization} onChange={e => setTechForm({...techForm, specialization: e.target.value})} />
              <input type="text" placeholder="اسم المستخدم" className="bg-slate-700 text-white p-2 rounded w-full" value={techForm.username} onChange={e => setTechForm({...techForm, username: e.target.value})} required />
              <input type="password" placeholder="كلمة المرور" className="bg-slate-700 text-white p-2 rounded w-full" value={techForm.password} onChange={e => setTechForm({...techForm, password: e.target.value})} required />
              <label className="flex items-center gap-2"><input type="checkbox" checked={techForm.is_active} onChange={e => setTechForm({...techForm, is_active: e.target.checked})} /> نشط</label>
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowTechModal(false)} className="bg-slate-700 px-4 py-2 rounded">إلغاء</button><button type="submit" className="bg-orange-600 px-4 py-2 rounded">حفظ</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Partner Modal */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">{editingPartner ? 'تعديل شريك' : 'إضافة شريك'}</h3><button onClick={() => setShowPartnerModal(false)}><X className="w-5 h-5" /></button></div>
            <form onSubmit={submitPartner} className="space-y-4">
              <input type="text" placeholder="الاسم" className="bg-slate-700 text-white p-2 rounded w-full" value={partnerForm.name} onChange={e => setPartnerForm({...partnerForm, name: e.target.value})} required />
              <input type="tel" placeholder="رقم الهاتف" className="bg-slate-700 text-white p-2 rounded w-full" value={partnerForm.phone} onChange={e => setPartnerForm({...partnerForm, phone: e.target.value})} />
              <input type="number" placeholder="نسبة الربح %" className="bg-slate-700 text-white p-2 rounded w-full" value={partnerForm.share_percentage} onChange={e => setPartnerForm({...partnerForm, share_percentage: parseFloat(e.target.value)})} step="0.01" />
              <label className="flex items-center gap-2"><input type="checkbox" checked={partnerForm.is_active} onChange={e => setPartnerForm({...partnerForm, is_active: e.target.checked})} /> نشط</label>
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowPartnerModal(false)} className="bg-slate-700 px-4 py-2 rounded">إلغاء</button><button type="submit" className="bg-orange-600 px-4 py-2 rounded">حفظ</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Modal */}
      {showCashModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">{editingCash ? 'تعديل حركة' : 'إضافة حركة'}</h3><button onClick={() => setShowCashModal(false)}><X className="w-5 h-5" /></button></div>
            <form onSubmit={addCashEntry} className="space-y-4">
              <select className="bg-slate-700 text-white p-2 rounded w-full" value={cashForm.type} onChange={e => setCashForm({...cashForm, type: e.target.value})}><option value="income">💰 إيراد</option><option value="expense">💸 مصروف</option></select>
              <input type="number" placeholder="المبلغ" className="bg-slate-700 text-white p-2 rounded w-full" value={cashForm.amount} onChange={e => setCashForm({...cashForm, amount: parseFloat(e.target.value)})} required />
              <textarea placeholder="الوصف" className="bg-slate-700 text-white p-2 rounded w-full" value={cashForm.description} onChange={e => setCashForm({...cashForm, description: e.target.value})} required />
              <input type="date" className="bg-slate-700 text-white p-2 rounded w-full" value={cashForm.date} onChange={e => setCashForm({...cashForm, date: e.target.value})} />
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowCashModal(false)} className="bg-slate-700 px-4 py-2 rounded">إلغاء</button><button type="submit" className="bg-orange-600 px-4 py-2 rounded">حفظ</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
