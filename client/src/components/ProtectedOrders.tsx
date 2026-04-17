import React, { useState, useCallback, useEffect } from 'react';
import { 
  Plus, Search, LayoutDashboard, Users, 
  CheckCircle2, AlertCircle, 
  Edit, Trash2, RefreshCw, Phone,
  Copy, Check, Trash, Bell, DollarSign, X, Printer, UserPlus, UserMinus, LogOut
} from "lucide-react";

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

export default function ProtectedOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [cashLedger, setCashLedger] = useState<any[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'technicians' | 'reports' | 'invoicesReview' | 'cash' | 'partners' | 'notifications'>('orders');
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

  // التحقق من صلاحيات المستخدم
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

  const canEditDelete = () => {
    return userRole === 'admin';
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  };

  // ✅ دالة تنسيق رقم الهاتف لواتساب
  const formatPhoneForWhatsApp = (phone: string) => {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/[^\d]/g, '');
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    if (cleaned.length === 10) cleaned = '20' + cleaned;
    return cleaned;
  };

  // ✅ إرسال واتساب للعميل عند إضافة أوردر جديد
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
    console.log("📱 إرسال واتساب تأكيد للعميل:", url);
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
        return acc - entry.amount;
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

  // ✅ دالة إضافة أرباح الشركة إلى الخزنة (مباشرة بدون fetchAPI)
const addCompanyProfitToCash = async (order: any) => {
  const companyShare = order.company_share || 0;
  
  console.log("🔍 محاولة إضافة أرباح للخزنة:", {
    companyShare,
    is_paid: order.is_paid,
    status: order.status,
    customer: order.customer_name,
    order_id: order.id,
    order_number: order.order_number
  });
  
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
    
    // استخدام fetch مباشرة بدلاً من fetchAPI
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
      const result = await response.json();
      console.log(`✅ تم إضافة ${companyShare} ج.م للخزنة`, result);
      
      // تحديث الأوردر بعلم أن الربح تم إضافته
      await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profit_added_to_cash: true })
      });
      
      await addNotification('إضافة أرباح للخزنة', `✅ تم إضافة ${companyShare} ج.م للخزنة من أوردر ${order.customer_name}`);
      await fetchCashLedger();
      alert(`✅ تم إضافة ${companyShare} ج.م إلى الخزنة بنجاح`);
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
  
  const togglePaidStatus = async (id: number, currentStatus: boolean) => {
  const order = orders.find(o => o.id === id);
  if (!order) return;

  try {
    // تحديث حالة الدفع في قاعدة البيانات
    await fetchAPI(`orders?id=eq.${id}`, { 
      method: 'PATCH', 
      body: JSON.stringify({ is_paid: !currentStatus }) 
    });
    
    await addNotification('تحديث حالة الدفع', `✅ تم تحديث حالة تحصيل أوردر ${order.customer_name} إلى ${!currentStatus ? 'تم التحصيل' : 'لم يتم التحصيل'}`);
    
    // تحديث البيانات محلياً
    const updatedOrder = { ...order, is_paid: !currentStatus };
    
    // إذا تم التحصيل الآن والأوردر مكتمل
    if (!currentStatus && order.status === 'completed') {
      console.log("💰 محاولة إضافة أرباح للخزنة...");
      const added = await addCompanyProfitToCash(updatedOrder);
      if (!added) {
        console.log("⚠️ فشل إضافة الأرباح، تحقق من console أعلاه");
      }
    } else {
      console.log("ℹ️ لم تتم إضافة أرباح: is_paid devient", !currentStatus, "status:", order.status);
    }
    
    fetchData();
  } catch (err) { 
    console.error("خطأ في تحديث حالة الدفع:", err); 
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

  // ✅ إرسال واتساب للعميل عند تغيير الحالة
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
    console.log("📱 فتح واتساب للعميل:", url);
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

  // ✅ تغيير حالة التحصيل مع إضافة الأرباح للخزنة
  const togglePaidStatus = async (id: number, currentStatus: boolean) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    try {
      await fetchAPI(`orders?id=eq.${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify({ is_paid: !currentStatus }) 
      });
      
      await addNotification('تحديث حالة الدفع', `✅ تم تحديث حالة تحصيل أوردر ${order.customer_name} إلى ${!currentStatus ? 'تم التحصيل' : 'لم يتم التحصيل'}`);
      
      if (!currentStatus && order.status === 'completed') {
        const added = await addCompanyProfitToCash(order);
        if (added) {
          alert(`✅ تم إضافة ${order.company_share} ج.م إلى الخزنة`);
        }
      }
      
      fetchData();
    } catch (err) { 
      console.error("خطأ في تحديث حالة الدفع:", err); 
    }
  };

  const deleteOrder = async (id: number) => {
    if (!canEditDelete()) {
      alert("⚠️ ليس لديك صلاحية لحذف الأوردرات");
      return;
    }
    const order = orders.find(o => o.id === id);
    if (confirm('هل أنت متأكد من حذف هذا الأوردر؟')) {
      try { 
        await fetchAPI(`orders?id=eq.${id}`, { method: 'DELETE' });
        await addNotification('حذف أوردر', `تم حذف أوردر ${order?.customer_name}`);
        fetchData(); 
      } catch (err) { console.error(err); }
    }
  };

  const deleteNotification = async (id: number) => {
    await fetchAPI(`notifications?id=eq.${id}`, { method: 'DELETE' });
    fetchNotifications();
  };

  const deleteAllNotifications = async () => {
    if (confirm('حذف كل الإشعارات؟')) {
      for (const n of notifications) {
        await fetchAPI(`notifications?id=eq.${n.id}`, { method: 'DELETE' });
      }
      fetchNotifications();
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

  // ✅ حفظ الأوردر مع إرسال واتساب تأكيد للعميل
  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const orderNumber = `MG-${Date.now()}`;
    const finalDeviceType = isOtherDevice ? customDevice : formData.device_type;
    const finalBrand = isOtherBrand ? customBrand : formData.brand;
    
    const orderToSave = { 
      ...formData, 
      device_type: finalDeviceType,
      brand: finalBrand,
      order_number: editingOrder ? editingOrder.order_number : orderNumber
    };

    try {
      if (editingOrder) {
        if (!canEditDelete()) {
          alert("⚠️ ليس لديك صلاحية لتعديل الأوردرات");
          return;
        }
        await fetchAPI(`orders?id=eq.${editingOrder.id}`, { method: 'PATCH', body: JSON.stringify(orderToSave) });
        await addNotification('تعديل أوردر', `تم تعديل أوردر ${formData.customer_name}`);
        alert("✅ تم تعديل الأوردر بنجاح");
      } else {
        await fetchAPI('orders', { method: 'POST', body: JSON.stringify(orderToSave) });
        await addNotification('إضافة أوردر', `تم إضافة أوردر جديد للعميل ${formData.customer_name}`);
        alert("✅ تم إضافة الأوردر بنجاح");
        
        sendWhatsAppToCustomerOnCreate(orderToSave);
      }
      setShowOrderModal(false);
      setEditingOrder(null);
      resetForm();
      fetchData();
    } catch (err) { 
      console.error(err);
      alert("❌ حدث خطأ أثناء حفظ الأوردر: " + (err.message || "خطأ غير معروف"));
    }
  };

  const savePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditDelete()) {
      alert("⚠️ ليس لديك صلاحية لإدارة الشركاء");
      return;
    }
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

  const deletePartner = async (id: number, name: string) => {
    if (!canEditDelete()) {
      alert("⚠️ ليس لديك صلاحية لحذف الشركاء");
      return;
    }
    if (confirm(`حذف الشريك ${name}؟`)) {
      await fetchAPI(`partners?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف شريك', `تم حذف الشريك ${name}`);
      fetchPartners();
    }
  };

  const saveTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditDelete()) {
      alert("⚠️ ليس لديك صلاحية لإدارة الفنيين");
      return;
    }
    try {
      if (editingTech) {
        await fetchAPI(`technicians?id=eq.${editingTech.id}`, { method: 'PATCH', body: JSON.stringify(techForm) });
        await addNotification('تعديل فني', `تم تعديل بيانات الفني ${techForm.name}`);
      } else {
        await fetchAPI('technicians', { method: 'POST', body: JSON.stringify(techForm) });
        await addNotification('إضافة فني', `تم إضافة فني جديد: ${techForm.name}`);
      }
      setShowTechModal(false);
      setEditingTech(null);
      setTechForm({ name: '', phone: '', specialization: '', is_active: true, username: '', password: '' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const deleteTechnician = async (id: number, name: string) => {
    if (!canEditDelete()) {
      alert("⚠️ ليس لديك صلاحية لحذف الفنيين");
      return;
    }
    if (confirm('هل أنت متأكد من حذف هذا الفني؟')) {
      try { 
        await fetchAPI(`technicians?id=eq.${id}`, { method: 'DELETE' });
        await addNotification('حذف فني', `تم حذف الفني ${name}`);
        fetchData(); 
      } catch (err) { console.error(err); }
    }
  };

  const toggleTechnicianActive = async (tech: any) => {
    if (!canEditDelete()) {
      alert("⚠️ ليس لديك صلاحية لتغيير حالة الفنيين");
      return;
    }
    await fetchAPI(`technicians?id=eq.${tech.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !tech.is_active }) });
    await addNotification('تغيير حالة فني', `تم ${!tech.is_active ? 'تفعيل' : 'تعطيل'} الفني ${tech.name}`);
    fetchData();
  };

  const copyTechLink = (name: string, id: number) => {
    const link = `${window.location.origin}/tech-portal?name=${encodeURIComponent(name)}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openInvoicePage = (order: any) => {
    window.open(`/invoice?id=${order.id}`, '_blank');
  };

  const printAndSendInvoice = async (order: any) => {
    const parts = prompt("✏️ أدخل قطع الغيار المستخدمة", "لا توجد");
    const partsList = parts || "لا توجد";
    const warranty = prompt("🛡️ فترة الضمان", "6 أشهر");
    const finalWarranty = warranty || "6 أشهر";
    
    if (!order.phone || !order.customer_name) {
      alert("❌ بيانات الأوردر غير كاملة");
      return;
    }
    
    try {
      await fetchAPI(`orders?id=eq.${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          invoice_approved: true, 
          warranty_period: finalWarranty, 
          parts_used: partsList,
          invoice_date: new Date().toISOString().split('T')[0]
        })
      });
      await addNotification('اعتماد فاتورة', `تم اعتماد فاتورة ${order.customer_name} مع ضمان ${finalWarranty}`);
      
      setTimeout(() => {
        openInvoicePage(order);
      }, 500);
      
      const phone = formatPhoneForWhatsApp(order.phone);
      const invoiceText = `📄 *فاتورة الصيانة - ضمان* 📄\n\n` +
        `شكراً لثقتك بنا\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🔢 *رقم الأوردر:* ${order.order_number}\n` +
        `👤 *العميل:* ${order.customer_name}\n` +
        `📱 *الهاتف:* ${order.phone}\n` +
        `📍 *العنوان:* ${order.address || 'غير محدد'}\n\n` +
        `🔧 *الجهاز:* ${order.device_type || order.device} - ${order.brand}\n` +
        `⚠️ *المشكلة:* ${order.problem_description || 'غير محددة'}\n` +
        `🔧 *قطع الغيار:* ${partsList}\n\n` +
        `💰 *المبلغ:* ${order.total_amount} ج.م\n` +
        `🛡️ *الضمان:* ${finalWarranty}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📞 للاستفسار: 01278885772\n\n` +
        `شكراً لثقتك بنا 🙏`;
      
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(invoiceText)}`;
      window.open(whatsappUrl, '_blank');
      
      alert("✅ تم اعتماد الفاتورة بنجاح!");
      fetchData();
    } catch (err) {
      console.error("خطأ في اعتماد الفاتورة:", err);
      alert("❌ حدث خطأ في اعتماد الفاتورة");
    }
  };

  const filteredOrders = (orders || []).filter(o => {
    const matchesSearch = o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || o.phone?.includes(searchTerm) || o.technician?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    const matchesTechnician = !filterTechnician || o.technician === filterTechnician;
    const matchesDeviceType = !filterDeviceType || o.device_type === filterDeviceType;
    const matchesDateFrom = !filterDateFrom || (o.date && o.date >= filterDateFrom);
    const matchesDateTo = !filterDateTo || (o.date && o.date <= filterDateTo);
    const matchesDelay = filterDelay === 'all' || (filterDelay === 'delayed' && isDelayed(o));
    return matchesSearch && matchesStatus && matchesTechnician && matchesDeviceType && matchesDateFrom && matchesDateTo && matchesDelay;
  });

  const filteredTechnicians = (technicians || []).filter(tech => {
    if (filterTechStatus === 'active') return tech.is_active !== false;
    if (filterTechStatus === 'inactive') return tech.is_active === false;
    return true;
  });

  const clearAllFilters = () => {
    setSearchTerm(''); setFilterStatus('all'); setFilterTechnician(''); setFilterDeviceType('');
    setFilterDateFrom(''); setFilterDateTo(''); setFilterDelay('all');
  };

  if (loading && orders.length === 0) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><RefreshCw className="w-12 h-12 text-orange-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20">
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center"><LayoutDashboard className="w-6 h-6 text-white" /></div>
            <h1 className="text-lg font-bold text-white">لوحة تحكم المدير</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { fetchData(); fetchNotifications(); fetchCashLedger(); }} className="p-2 text-slate-400 hover:text-white transition-all"><RefreshCw className="w-5 h-5" /></button>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all" title="تسجيل الخروج">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          <div className="bg-slate-900 p-4 rounded-2xl"><p className="text-2xl font-black text-white">{orders.length}</p><p className="text-[10px] text-slate-500 uppercase">إجمالي الأوردرات</p></div>
          <div className="bg-slate-900 p-4 rounded-2xl"><p className="text-2xl font-black text-yellow-500">{stats.pending}</p><p className="text-[10px] text-slate-500 uppercase">قيد الانتظار</p></div>
          <div className="bg-slate-900 p-4 rounded-2xl"><p className="text-2xl font-black text-green-500">{stats.completed}</p><p className="text-[10px] text-slate-500 uppercase">مكتمل</p></div>
          <div className="bg-slate-900 p-4 rounded-2xl"><p className="text-2xl font-black text-orange-500">{stats.totalIncome.toLocaleString()} ج.م</p><p className="text-[10px] text-slate-500 uppercase">أرباح الشركة</p></div>
          <div className="bg-slate-900 p-4 rounded-2xl"><p className="text-2xl font-black text-purple-500">{technicians.length}</p><p className="text-[10px] text-slate-500 uppercase">فني متاح</p></div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 mb-6 overflow-x-auto">
          <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'orders' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>📋 الأوردرات</button>
          <button onClick={() => setActiveTab('technicians')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'technicians' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>👨‍🔧 الفنيين</button>
          <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'reports' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>📊 التقارير</button>
          <button onClick={() => setActiveTab('invoicesReview')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'invoicesReview' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>📄 الفواتير</button>
          <button onClick={() => setActiveTab('cash')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'cash' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>💰 الخزنة</button>
          <button onClick={() => setActiveTab('partners')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'partners' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>🤝 الشركاء</button>
          <button onClick={() => setActiveTab('notifications')} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 ${activeTab === 'notifications' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><Bell className="w-4 h-4" /> الإشعارات ({notifications.length})</button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" /><input type="text" placeholder="ابحث..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pr-12 pl-4 text-sm" /></div>
              <button onClick={() => { setEditingOrder(null); resetForm(); setShowOrderModal(true); }} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2"><Plus className="w-5 h-5" /> أوردر جديد</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm">
                <option value="all">الكل</option><option value="pending">قيد الانتظار</option><option value="in-progress">قيد التنفيذ</option><option value="inspected">تم الكشف</option><option value="completed">مكتمل</option><option value="cancelled">ملغي</option>
              </select>
              <select value={filterTechnician} onChange={(e) => setFilterTechnician(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm"><option value="">جميع الفنيين</option>{technicians.filter(t => t.is_active !== false).map(tech => <option key={tech.id} value={tech.name}>{tech.name}</option>)}</select>
              <select value={filterDeviceType} onChange={(e) => setFilterDeviceType(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm"><option value="">جميع الأجهزة</option>{DEVICE_TYPES.map(d => <option key={d}>{d}</option>)}</select>
              <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm" />
              <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm" />
            </div>
            <div className="flex justify-between items-center"><button onClick={() => setFilterDelay(filterDelay === 'delayed' ? 'all' : 'delayed')} className={`px-3 py-1 rounded-full text-xs ${filterDelay === 'delayed' ? 'bg-red-600' : 'bg-slate-800'}`}>⚠️ المتأخرة فقط</button><button onClick={clearAllFilters} className="bg-slate-800 px-4 py-1 rounded-full text-xs">مسح الكل</button></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map(order => (
                <div key={order.id} className="bg-slate-900 rounded-3xl p-5 border border-slate-800 relative">
                  {isDelayed(order) && <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">⚠️ تأخير</div>}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${order.status === 'completed' ? 'bg-green-500/10 text-green-500' : order.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500' : order.status === 'inspected' ? 'bg-yellow-500/10 text-yellow-500' : order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {order.status === 'completed' ? 'مكتمل' : order.status === 'in-progress' ? 'قيد التنفيذ' : order.status === 'inspected' ? 'تم الكشف' : order.status === 'cancelled' ? 'ملغي' : 'قيد الانتظار'}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => togglePaidStatus(order.id, order.is_paid)} className={`p-2 rounded-xl ${order.is_paid ? 'bg-green-500/20 text-green-500' : 'bg-slate-800 text-slate-500'}`}>
                        {order.is_paid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      </button>
                      
                      {canEditDelete() && (
                        <>
                          <button onClick={() => { setEditingOrder(order); setFormData(order); setShowOrderModal(true); }} className="p-2 text-slate-400 hover:text-white"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => deleteOrder(order.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </div>
                  <h3 className="text-white font-black text-lg truncate">{order.customer_name}</h3>
                  <div className="text-xs text-slate-400 mt-1">📞 {order.phone}</div>
                  <div className="text-xs text-slate-400">🔧 {order.device_type} - {order.brand}</div>
                  <div className="grid grid-cols-2 gap-2 mt-2 py-2 border-y border-slate-800">
                    <div><p className="text-[10px] text-slate-500">الإجمالي</p><p className="text-xs font-bold">{order.total_amount || 0} ج.م</p></div>
                    <div><p className="text-[10px] text-slate-500">الصافي</p><p className="text-xs text-green-500 font-bold">{order.net_amount || 0} ج.م</p></div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div><p className="text-[10px] text-slate-500">الفني</p><p className="text-sm font-black text-orange-400">{order.technician || '-'}</p></div>
                    <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className="bg-slate-700 text-xs rounded px-2 py-1">
                      <option value="pending">قيد الانتظار</option><option value="in-progress">قيد التنفيذ</option><option value="inspected">تم الكشف</option><option value="completed">مكتمل</option><option value="cancelled">ملغي</option>
                    </select>
                  </div>
                  <div className={`text-[10px] font-black px-2 py-1 rounded mt-2 text-center ${order.is_paid ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                    {order.is_paid ? '✅ تم التحصيل' : '⏳ لم يتحصل'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technicians Tab */}
        {activeTab === 'technicians' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <button onClick={() => setFilterTechStatus('active')} className={`px-3 py-1 rounded-full text-xs ${filterTechStatus === 'active' ? 'bg-orange-600' : 'bg-slate-800'}`}>النشطون</button>
                <button onClick={() => setFilterTechStatus('inactive')} className={`px-3 py-1 rounded-full text-xs ${filterTechStatus === 'inactive' ? 'bg-orange-600' : 'bg-slate-800'}`}>غير النشطون</button>
                <button onClick={() => setFilterTechStatus('all')} className={`px-3 py-1 rounded-full text-xs ${filterTechStatus === 'all' ? 'bg-orange-600' : 'bg-slate-800'}`}>الجميع</button>
              </div>
              {canEditDelete() && (
                <button onClick={() => { setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true, username: '', password: '' }); setShowTechModal(true); }} className="bg-orange-600 px-4 py-2 rounded-xl text-sm font-bold"><Plus className="w-4 h-4" /> إضافة فني</button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredTechnicians.map(tech => (
                <div key={tech.id} className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4"><Users className="w-8 h-8 text-orange-500" /></div>
                  <h3 className="text-white font-black text-lg">{tech.name}</h3>
                  <p className="text-slate-500 text-xs mb-4">{tech.specialization}</p>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => copyTechLink(tech.name, tech.id)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                      {copiedId === tech.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />} نسخ الرابط
                    </button>
                    <div className="flex gap-2">
                      <a href={`tel:${tech.phone}`} className="flex-1 p-2 bg-blue-500/10 text-blue-500 rounded-xl"><Phone className="w-4 h-4 mx-auto" /></a>
                      {canEditDelete() && (
                        <>
                          <button onClick={() => { setEditingTech(tech); setTechForm(tech); setShowTechModal(true); }} className="flex-1 p-2 bg-slate-800 text-slate-400 rounded-xl"><Edit className="w-4 h-4 mx-auto" /></button>
                          <button onClick={() => deleteTechnician(tech.id, tech.name)} className="flex-1 p-2 bg-red-500/10 text-red-500 rounded-xl"><Trash2 className="w-4 h-4 mx-auto" /></button>
                          <button onClick={() => toggleTechnicianActive(tech)} className={`flex-1 p-2 rounded-xl ${tech.is_active !== false ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{tech.is_active !== false ? 'نشط' : 'تعطيل'}</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 p-6 rounded-2xl"><p className="text-slate-400">إجمالي الإيرادات</p><p className="text-3xl font-black text-white">{orders.reduce((a,o)=>a+(o.total_amount||0),0).toLocaleString()} ج.م</p></div>
            <div className="bg-slate-900 p-6 rounded-2xl"><p className="text-slate-400">إجمالي المصاريف</p><p className="text-3xl font-black text-white">{orders.reduce((a,o)=>a+(o.parts_cost+o.transport_cost||0),0).toLocaleString()} ج.م</p></div>
            <div className="bg-slate-900 p-6 rounded-2xl"><p className="text-slate-400">صافي أرباح الشركة</p><p className="text-3xl font-black text-orange-500">{stats.totalIncome.toLocaleString()} ج.م</p></div>
          </div>
        )}

        {/* Invoices Review Tab */}
        {activeTab === 'invoicesReview' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">📄 فواتير بانتظار المراجعة</h2>
            {orders.filter(o => o.status === 'completed' && !o.invoice_approved).map(order => (
              <div key={order.id} className="bg-slate-800 p-4 rounded-2xl flex justify-between items-center flex-wrap gap-3">
                <div><p className="font-bold">{order.customer_name}</p><p className="text-sm text-slate-400">{order.device_type} - {order.brand}</p><p className="text-green-400">المبلغ: {order.total_amount} ج.م</p></div>
                <button onClick={() => printAndSendInvoice(order)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"><Printer className="w-4 h-4" /> طباعة الفاتورة</button>
              </div>
            ))}
            {orders.filter(o => o.status === 'completed' && !o.invoice_approved).length === 0 && <div className="text-center py-8 text-slate-400">لا توجد فواتير بانتظار المراجعة</div>}
          </div>
        )}

        {/* Cash Tab */}
        {activeTab === 'cash' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div className="bg-emerald-500/20 p-4 rounded-2xl"><p className="text-slate-400">رصيد الخزنة</p><p className="text-3xl font-bold text-emerald-400">{cashBalance.toLocaleString()} ج.م</p></div>
              <div className="flex gap-2">
                <input type="date" value={cashFilterDate} onChange={e => setCashFilterDate(e.target.value)} className="bg-slate-800 p-2 rounded" />
                <button onClick={() => setCashFilterDate('')} className="bg-slate-700 px-3 py-1 rounded text-sm">إلغاء الفلتر</button>
                {canEditDelete() && (
                  <button onClick={() => { setEditingCash(null); setCashForm({ type: 'expense', amount: 0, description: '', date: new Date().toISOString().split('T')[0] }); setShowCashModal(true); }} className="bg-orange-600 px-4 py-2 rounded-xl text-sm">+ إضافة حركة</button>
                )}
                {canEditDelete() && (
                  <button onClick={distributeDailyProfit} className="bg-purple-600 px-4 py-2 rounded-xl text-sm">📤 توزيع أرباح اليوم</button>
                )}
              </div>
            </div>
            <div className="bg-slate-900 rounded-2xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800">
                  <tr><th className="p-3">التاريخ</th><th>النوع</th><th>المبلغ</th><th>الوصف</th><th>إجراءات</th></tr>
                </thead>
                <tbody>
                  {cashLedger.map(entry => (
                    <tr key={entry.id} className="border-b border-slate-800">
                      <td className="p-3">{entry.date}</td>
                      <td>{entry.type === 'income' ? '💰 دخل' : entry.type === 'expense' ? '💸 مصروف' : '📤 توزيع أرباح'}</td>
                      <td className={entry.type === 'income' ? 'text-green-400' : 'text-red-400'}>{entry.amount} ج.م</td>
                      <td className="max-w-xs break-words">{entry.description}</td>
                      <td className="flex gap-2">
                        {canEditDelete() && (
                          <>
                            <button onClick={() => { setEditingCash(entry); setCashForm(entry); setShowCashModal(true); }} className="text-blue-400"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => deleteCashEntry(entry.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Partners Tab */}
        {activeTab === 'partners' && (
          <div className="space-y-4">
            {canEditDelete() && (
              <div className="flex justify-end"><button onClick={() => { setEditingPartner(null); setPartnerForm({ name: '', share_percentage: 0, phone: '', is_active: true }); setShowPartnerModal(true); }} className="bg-orange-600 px-4 py-2 rounded-xl text-sm"><UserPlus className="w-4 h-4" /> إضافة شريك</button></div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partners.map(partner => (
                <div key={partner.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <div className="flex justify-between"><h3 className="font-bold text-lg">{partner.name}</h3><span className={`text-xs px-2 py-1 rounded-full ${partner.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{partner.is_active ? 'نشط' : 'غير نشط'}</span></div>
                  <p className="text-orange-400 text-2xl font-bold mt-2">{partner.share_percentage}%</p>
                  <p className="text-slate-400 text-sm">📞 {partner.phone || 'لا يوجد'}</p>
                  {canEditDelete() && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => { setEditingPartner(partner); setPartnerForm(partner); setShowPartnerModal(true); }} className="text-blue-400 text-sm"><Edit className="w-4 h-4 inline" /> تعديل</button>
                      <button onClick={() => deletePartner(partner.id, partner.name)} className="text-red-400 text-sm"><UserMinus className="w-4 h-4 inline" /> حذف</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex justify-between"><h2 className="text-xl font-bold">🔔 سجل الإشعارات</h2>{canEditDelete() && notifications.length > 0 && <button onClick={deleteAllNotifications} className="bg-red-600/20 text-red-400 px-3 py-1 rounded-lg text-sm"><Trash className="w-4 h-4" /> مسح الكل</button>}</div>
            <div className="space-y-3">
              {notifications.map(notif => (
                <div key={notif.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex justify-between">
                  <div><span className="text-orange-400">{notif.action}</span><span className="text-slate-400 mx-2">|</span><span>{notif.details}</span><div className="text-xs text-slate-500 mt-1">{new Date(notif.created_at).toLocaleString('ar-EG')}</div></div>
                  {canEditDelete() && (
                    <button onClick={() => deleteNotification(notif.id)} className="text-red-400"><Trash className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
              {notifications.length === 0 && <div className="text-center py-8 text-slate-400">لا توجد إشعارات</div>}
            </div>
          </div>
        )}

      </main>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex justify-between mb-4"><h3 className="text-xl font-bold">{editingOrder ? 'تعديل أوردر' : 'أوردر جديد'}</h3><button onClick={() => setShowOrderModal(false)} className="text-slate-400"><X className="w-5 h-5" /></button></div>
            <form onSubmit={saveOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-slate-400">اسم العميل</label><input type="text" value={formData.customer_name} onChange={e => handleFormChange('customer_name', e.target.value)} className="w-full bg-slate-800 p-3 rounded-xl" required /></div>
                <div><label className="text-sm text-slate-400">رقم الهاتف</label><input type="text" value={formData.phone} onChange={e => handleFormChange('phone', e.target.value)} className="w-full bg-slate-800 p-3 rounded-xl" required /></div>
                <div><label className="text-sm text-slate-400">نوع الجهاز</label><select value={formData.device_type} onChange={e => handleFormChange('device_type', e.target.value)} className="w-full bg-slate-800 p-3 rounded-xl"><option value="">اختر</option>{DEVICE_TYPES.map(d=><option key={d}>{d}</option>)}<option value="other">أخرى</option></select></div>
                {isOtherDevice && <div><input type="text" placeholder="جهاز مخصص" value={customDevice} onChange={e=>setCustomDevice(e.target.value)} className="w-full bg-slate-800 p-3 rounded-xl" required /></div>}
                <div><label className="text-sm text-slate-400">الماركة</label><select value={formData.brand} onChange={e => handleFormChange('brand', e.target.value)} className="w-full bg-slate-800 p-3 rounded-xl"><option value="">اختر</option>{BRANDS.map(b=><option key={b}>{b}</option>)}<option value="other">أخرى</option></select></div>
                {isOtherBrand && <div><input type="text" placeholder="ماركة مخصصة" value={customBrand} onChange={e=>setCustomBrand(e.target.value)} className="w-full bg-slate-800 p-3 rounded-xl" required /></div>}
                <div className="col-span-2"><label className="text-sm text-slate-400">العنوان</label><input type="text" value={formData.address} onChange={e=>handleFormChange('address', e.target.value)} className="w-full bg-slate-800 p-3 rounded-xl" /></div>
                <div className="col-span-2"><label className="text-sm text-slate-400">وصف المشكلة</label><textarea rows={3} value={formData.problem_description} onChange={e=>handleFormChange('problem_description', e.target.value)} className="w-full bg-slate-800 p-3 rounded-xl" /></div>
                <div><label className="text-sm text-slate-400">الفني</label><select value={formData.technician} onChange={e=>handleFormChange('technician', e.target.value)} className="w-full bg-slate-800 p-3 rounded-xl"><option value="">اختر فني</option>{technicians.map(t=><option key={t.id}>{t.name}</option>)}</select></div>
                <div><label className="text-sm text-slate-400">إجمالي المبلغ</label><input type="number" value={formData.total_amount} onChange={e=>handleFormChange('total_amount', e.target.value)} className="w-full bg-slate-800 p-3 rounded-xl" /></div>
                <div><label className="text-sm text-slate-400">قطع غيار</label><input type="number" value={formData.parts_cost} onChange={e=>handleFormChange('parts_cost', e.target.value)} className="w-full bg-slate-800 p-3 rounded-xl" /></div>
                <div><label className="text-sm text-slate-400">مواصلات</label><input type="number" value={formData.transport_cost} onChange={e=>handleFormChange('transport_cost', e.target.value)} className="w-full bg-slate-800 p-3 rounded-xl" /></div>
              </div>
              <div className="flex gap-3 pt-4"><button type="submit" className="flex-1 bg-orange-600 py-3 rounded-xl font-bold">حفظ</button><button type="button" onClick={() => setShowOrderModal(false)} className="flex-1 bg-slate-700 py-3 rounded-xl font-bold">إلغاء</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Technician Modal */}
      {showTechModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between mb-4"><h3 className="text-xl font-bold">{editingTech ? 'تعديل فني' : 'فني جديد'}</h3><button onClick={() => setShowTechModal(false)} className="text-slate-400"><X className="w-5 h-5" /></button></div>
            <form onSubmit={saveTechnician} className="space-y-4">
              <input type="text" placeholder="الاسم" value={techForm.name} onChange={e => setTechForm({...techForm, name: e.target.value})} className="w-full bg-slate-800 p-3 rounded-xl" required />
              <input type="text" placeholder="رقم الهاتف" value={techForm.phone} onChange={e => setTechForm({...techForm, phone: e.target.value})} className="w-full bg-slate-800 p-3 rounded-xl" required />
              <input type="text" placeholder="التخصص" value={techForm.specialization} onChange={e => setTechForm({...techForm, specialization: e.target.value})} className="w-full bg-slate-800 p-3 rounded-xl" />
              <input type="text" placeholder="اسم المستخدم" value={techForm.username} onChange={e => setTechForm({...techForm, username: e.target.value})} className="w-full bg-slate-800 p-3 rounded-xl" />
              <input type="password" placeholder="كلمة المرور" value={techForm.password} onChange={e => setTechForm({...techForm, password: e.target.value})} className="w-full bg-slate-800 p-3 rounded-xl" />
              <div className="flex items-center gap-2"><input type="checkbox" checked={techForm.is_active} onChange={e => setTechForm({...techForm, is_active: e.target.checked})} /><label>نشط</label></div>
              <button type="submit" className="w-full bg-orange-600 py-3 rounded-xl font-bold">حفظ</button>
            </form>
          </div>
        </div>
      )}

      {/* Partner Modal */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editingPartner ? 'تعديل شريك' : 'إضافة شريك'}</h3>
            <form onSubmit={savePartner} className="space-y-4">
              <input type="text" placeholder="اسم الشريك" value={partnerForm.name} onChange={e => setPartnerForm({...partnerForm, name: e.target.value})} className="w-full bg-slate-800 p-3 rounded-xl" required />
              <input type="number" placeholder="نسبة الربح (%)" value={partnerForm.share_percentage} onChange={e => setPartnerForm({...partnerForm, share_percentage: parseFloat(e.target.value)})} className="w-full bg-slate-800 p-3 rounded-xl" required />
              <input type="text" placeholder="رقم الهاتف" value={partnerForm.phone} onChange={e => setPartnerForm({...partnerForm, phone: e.target.value})} className="w-full bg-slate-800 p-3 rounded-xl" />
              <div className="flex items-center gap-2"><input type="checkbox" checked={partnerForm.is_active} onChange={e => setPartnerForm({...partnerForm, is_active: e.target.checked})} /><label>نشط</label></div>
              <button type="submit" className="w-full bg-orange-600 py-3 rounded-xl font-bold">حفظ</button>
            </form>
          </div>
        </div>
      )}

      {/* Cash Modal */}
      {showCashModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editingCash ? 'تعديل حركة' : 'إضافة حركة'}</h3>
            <form onSubmit={addCashEntry} className="space-y-4">
              <select value={cashForm.type} onChange={e => setCashForm({...cashForm, type: e.target.value})} className="w-full bg-slate-800 p-3 rounded-xl"><option value="income">💰 دخل</option><option value="expense">💸 مصروف</option></select>
              <input type="number" placeholder="المبلغ" value={cashForm.amount} onChange={e => setCashForm({...cashForm, amount: parseFloat(e.target.value)})} className="w-full bg-slate-800 p-3 rounded-xl" required />
              <input type="text" placeholder="الوصف" value={cashForm.description} onChange={e => setCashForm({...cashForm, description: e.target.value})} className="w-full bg-slate-800 p-3 rounded-xl" required />
              <input type="date" value={cashForm.date} onChange={e => setCashForm({...cashForm, date: e.target.value})} className="w-full bg-slate-800 p-3 rounded-xl" required />
              <button type="submit" className="w-full bg-orange-600 py-3 rounded-xl font-bold">حفظ</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
