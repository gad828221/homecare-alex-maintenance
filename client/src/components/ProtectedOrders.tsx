import React, { useState, useCallback, useEffect } from 'react';
import { 
  Plus, Search, LayoutDashboard, Users, 
  CheckCircle2, AlertCircle, 
  Edit, Trash2, RefreshCw, Phone,
  Copy, Check, Trash, Bell, DollarSign, X, Printer, UserPlus, UserMinus, LogOut, Send
} from "lucide-react";
import AdminPermissions from './AdminPermissions';
import TechnicianPerformance from './TechnicianPerformance';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';
const supabase = createClient(supabaseUrl, supabaseKey);

const DEVICE_TYPES = ['غسالة', 'ثلاجة', 'بوتاجاز', 'سخان', 'تكييف', 'ميكروويف', 'غسالة أطباق'];
const BRANDS = ['سامسونج', 'LG', 'شارب', 'توشيبا', 'زانوسي', 'يونيون إير', 'فريش', 'وايت ويل', 'أريستون', 'بيكو', 'هوفر', 'إنديست'];

const fetchAPI = async (endpoint: string, options?: RequestInit) => {
  const url = `${supabaseUrl}/rest/v1/${endpoint}`;
  const res = await fetch(url, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
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
      method: 'POST', headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details, user_name: 'المدير', created_at: new Date().toISOString() })
    });
  } catch (err) { console.error(err); }
};

// مزامنة الفنيين مع جدول users (لضمان تسجيل الدخول)
const syncTechniciansToUsers = async () => {
  try {
    const techs = await fetchAPI('technicians?select=*');
    if (!techs || techs.length === 0) return;
    for (const tech of techs) {
      const userData = {
        username: tech.username?.trim(),
        password: tech.password,
        name: tech.name,
        phone: tech.phone || '',
        role: 'tech',
        is_active: tech.is_active
      };
      if (!userData.username) continue;
      
      const updateRes = await fetch(`${supabaseUrl}/rest/v1/users?username=eq.${userData.username}`, {
        method: 'PATCH',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (updateRes.status === 404) {
        await fetch(`${supabaseUrl}/rest/v1/users`, {
          method: 'POST',
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
      }
    }
    console.log("✅ تمت مزامنة الفنيين مع users");
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
  const [activeTab, setActiveTab] = useState<'orders' | 'technicians' | 'reports' | 'invoicesReview' | 'cash' | 'partners' | 'notifications' | 'permissions' | 'performance'>('orders');
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
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [customDevice, setCustomDevice] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [isOtherDevice, setIsOtherDevice] = useState(false);
  const [isOtherBrand, setIsOtherBrand] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '',
    status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false,
    date: new Date().toLocaleDateString("ar-EG")
  });
  const [techForm, setTechForm] = useState({ 
    name: '', phone: '', specialization: '', is_active: true,
    username: '', password: '', profit_percentage: 50 
  });
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, cancelled: 0, totalIncome: 0 });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  
  // States for settlement modal
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [settleForm, setSettleForm] = useState({
    total_amount: 0,
    parts_cost: 0,
    transport_cost: 0,
    net_amount: 0,
    technician_share: 0,
    company_share: 0
  });

  // State for profit distribution date picker
  const [selectedProfitDate, setSelectedProfitDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });

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
        if (entry.type === 'income' || entry.type === 'reserve') {
          return acc + entry.amount;
        } else if (entry.type === 'expense' || entry.type === 'profit_distribution') {
          return acc - entry.amount;
        }
        return acc;
      }, 0);
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
    if (!canEditDelete()) return alert("⚠️ ليس لديك صلاحية");
    if (confirm('هل تريد حذف هذا القيد نهائياً؟')) {
      await fetchAPI(`cash_ledger?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف قيد خزنة', `تم حذف قيد من سجل الخزنة`);
      fetchCashLedger();
    }
  };

  const deleteOrderProfitFromCash = async (order: any) => {
    try {
      const { data: entries } = await fetchAPI(`cash_ledger?description=like=*${order.order_number}*&type=eq.income&select=id`);
      if (entries && entries.length > 0) {
        for (const entry of entries) {
          await fetchAPI(`cash_ledger?id=eq.${entry.id}`, { method: 'DELETE' });
          await addNotification('حذف أرباح أوردر من الخزنة', `تم حذف أرباح الأوردر رقم ${order.order_number} (${order.customer_name}) من الخزنة`);
        }
        await fetchCashLedger();
      }
    } catch (err) { console.error("فشل حذف أرباح الأوردر من الخزنة:", err); }
  };

  const addCompanyProfitToCash = async (order: any) => {
    const companyShare = order.company_share || 0;
    if (order.profit_added_to_cash) { alert("⚠️ تم إضافة أرباح هذا الأوردر مسبقاً"); return false; }
    if (companyShare <= 0) { alert("❌ لا توجد أرباح للشركة"); return false; }
    if (!order.is_paid) { alert("❌ الأوردر لم يتم تحصيله بعد"); return false; }
    if (order.status !== 'completed') { alert("❌ الأوردر لم يكتمل بعد"); return false; }
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

  // ========== دالة توزيع أرباح تاريخ محدد ==========
  const distributeProfitForDate = async (targetDate: string) => {
    try {
      const incomeEntries = await fetchAPI(`cash_ledger?select=amount&date=eq.${targetDate}&type=eq.income`);
      const totalIncome = (incomeEntries || []).reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0);
      const expenseEntries = await fetchAPI(`cash_ledger?select=amount&date=eq.${targetDate}&type=eq.expense`);
      const totalExpense = (expenseEntries || []).reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0);
      const netProfit = totalIncome - totalExpense;
      if (netProfit <= 0) {
        alert(`⚠️ لا توجد أرباح صافية ليوم ${targetDate}.`);
        return;
      }
      const activePartners = partners.filter(p => p.is_active === true);
      if (activePartners.length === 0) {
        alert("⚠️ لا يوجد شركاء نشطون لتوزيع الأرباح.");
        return;
      }
      const totalPartnerShares = activePartners.reduce((sum, p) => sum + (Number(p.share_percentage) || 0), 0);
      if (totalPartnerShares <= 0) {
        alert("⚠️ إجمالي نسب الشركاء غير صالح.");
        return;
      }
      const amountToDistribute = Math.floor((netProfit * totalPartnerShares) / 100);
      const remaining = netProfit - amountToDistribute;
      if (amountToDistribute <= 0) {
        alert(`⚠️ لا يوجد مبلغ كافٍ للتوزيع.`);
        return;
      }
      if (!confirm(`💰 أرباح يوم ${targetDate}: ${netProfit.toLocaleString()} ج.م\n📤 نسبة التوزيع: ${totalPartnerShares}%\n💰 سيتم توزيع ${amountToDistribute.toLocaleString()} ج.م على الشركاء\n🏦 سيتم إضافة ${remaining.toLocaleString()} ج.م للخزنة\nهل تريد الاستمرار؟`)) return;
      let distributedSum = 0;
      for (let i = 0; i < activePartners.length; i++) {
        const partner = activePartners[i];
        let share = i === activePartners.length - 1 ? amountToDistribute - distributedSum : Math.floor((amountToDistribute * Number(partner.share_percentage)) / totalPartnerShares);
        distributedSum += share;
        if (share > 0) {
          await fetchAPI('cash_ledger', {
            method: 'POST',
            body: JSON.stringify({
              type: 'profit_distribution',
              amount: share,
              description: `📤 توزيع أرباح: ${partner.name} (${partner.share_percentage}%) - أرباح يوم ${targetDate}`,
              date: targetDate
            })
          });
        }
      }
      if (remaining > 0) {
        await fetchAPI('cash_ledger', {
          method: 'POST',
          body: JSON.stringify({
            type: 'reserve',
            amount: remaining,
            description: `🏦 رصيد احتياطي للشركة - أرباح يوم ${targetDate}`,
            date: targetDate
          })
        });
      }
      await addNotification('توزيع أرباح الشركاء', `✅ تم توزيع ${amountToDistribute.toLocaleString()} ج.م على الشركاء (أرباح يوم ${targetDate}).`);
      await fetchCashLedger();
      await fetchData();
      alert(`✅ تم التوزيع بنجاح.\n💰 تم توزيع ${amountToDistribute.toLocaleString()} ج.م\n🏦 تم إضافة ${remaining.toLocaleString()} ج.م للخزنة`);
    } catch (err) {
      console.error(err);
      alert("❌ حدث خطأ أثناء توزيع الأرباح");
    }
  };

  const handleDistributeSelectedProfit = async () => {
    if (!selectedProfitDate) {
      alert("⚠️ يرجى اختيار التاريخ أولاً.");
      return;
    }
    await distributeProfitForDate(selectedProfitDate);
  };

  // ========== باقي الدوال (fetchData, calculateAmounts, etc.) ==========
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
    const total = parseFloat(data.total_amount) || 0;
    const parts = parseFloat(data.parts_cost) || 0;
    const transport = parseFloat(data.transport_cost) || 0;
    const net = total - parts - transport;
    const selectedTech = technicians.find(t => t.name === data.technician);
    const technicianPercent = selectedTech?.profit_percentage ?? 50;
    const technicianShare = Math.round((net * technicianPercent) / 100);
    const companyShare = net - technicianShare;
    return { ...data, net_amount: net, company_share: companyShare, technician_share: technicianShare };
  };

  useEffect(() => {
    if (formData.technician) {
      setFormData(prev => calculateAmounts(prev));
    }
  }, [technicians, formData.technician]);

  const calculateSettlementAmounts = (data: any, technicianName: string) => {
    const total = parseFloat(data.total_amount) || 0;
    const parts = parseFloat(data.parts_cost) || 0;
    const transport = parseFloat(data.transport_cost) || 0;
    const net = total - parts - transport;
    const selectedTech = technicians.find(t => 
      t.name === technicianName || t.username === technicianName ||
      t.name?.toLowerCase() === technicianName?.toLowerCase() ||
      t.username?.toLowerCase() === technicianName?.toLowerCase()
    );
    const technicianPercent = selectedTech?.profit_percentage ?? 50;
    const technicianShare = Math.round((net * technicianPercent) / 100);
    const companyShare = net - technicianShare;
    return { ...data, net_amount: net, technician_share: technicianShare, company_share: companyShare };
  };

  const handleSettleChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updated = { ...settleForm, [field]: numValue };
    const calculated = calculateSettlementAmounts(updated, selectedOrder?.technician);
    setSettleForm(calculated);
  };

  const submitSettlement = async () => {
    if (!selectedOrder) return;
    await updateOrderStatus(selectedOrder.id, 'completed', settleForm);
    setShowSettleModal(false);
    setSelectedOrder(null);
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

  const updateOrderStatus = async (id: number, newStatus: string, extraData = {}) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const oldStatus = order.status;
    try {
      if (oldStatus === 'completed' && newStatus !== 'completed' && order.profit_added_to_cash) {
        await deleteOrderProfitFromCash(order);
      }
      await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus, ...extraData }) });
      await addNotification('تغيير حالة أوردر', `🔄 تم تغيير حالة أوردر ${order.customer_name} إلى ${newStatus}`);
      if (newStatus === 'completed' && order.is_paid && !order.profit_added_to_cash) {
        await addCompanyProfitToCash({ ...order, status: newStatus, ...extraData });
      }
      sendWhatsAppToCustomer(order, newStatus);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const togglePaidStatus = async (id: number, currentStatus: boolean) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const newPaidStatus = !currentStatus;
    try {
      if (!newPaidStatus && order.status === 'completed' && order.profit_added_to_cash) {
        await deleteOrderProfitFromCash(order);
      }
      await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ is_paid: newPaidStatus }) });
      await addNotification('تحديث حالة الدفع', `✅ تم تحديث حالة تحصيل أوردر ${order.customer_name} إلى ${newPaidStatus ? 'تم التحصيل' : 'لم يتم التحصيل'}`);
      if (newPaidStatus && order.status === 'completed' && !order.profit_added_to_cash) {
        await addCompanyProfitToCash({ ...order, is_paid: true });
      }
      fetchData(); fetchCashLedger();
    } catch (err) { console.error(err); }
  };

  const deleteOrder = async (id: number) => {
    if (!canEditDelete()) return alert("⚠️ ليس لديك صلاحية لحذف الأوردرات");
    const order = orders.find(o => o.id === id);
    if (!order) return;
    if (confirm(`حذف أوردر ${order.customer_name}؟`)) {
      if (order.profit_added_to_cash) {
        await deleteOrderProfitFromCash(order);
      }
      await fetchAPI(`orders?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف أوردر', `تم حذف أوردر ${order.customer_name}`);
      fetchData();
    }
  };

  const copyOrder = async (order: any) => {
    if (!canEditDelete()) return alert("⚠️ ليس لديك صلاحية لنسخ الأوردرات");
    const newOrder = { ...order, id: undefined, order_number: `MG-${Date.now()}`, status: 'pending', is_paid: false, profit_added_to_cash: false };
    await fetchAPI('orders', { method: 'POST', body: JSON.stringify(newOrder) });
    await addNotification('نسخ أوردر', `تم نسخ أوردر ${order.order_number} بنجاح`);
    alert('✅ تم نسخ الأوردر بنجاح');
    fetchData();
  };

  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDevice = isOtherDevice ? customDevice : formData.device_type;
    const finalBrand = isOtherBrand ? customBrand : formData.brand;
    const orderToSave = { ...formData, device_type: finalDevice, brand: finalBrand, order_number: editingOrder ? editingOrder.order_number : `MG-${Date.now()}` };
    try {
      if (editingOrder) {
        const oldOrder = orders.find(o => o.id === editingOrder.id);
        if (oldOrder?.status === 'completed' && oldOrder?.is_paid && oldOrder?.profit_added_to_cash) {
          await deleteOrderProfitFromCash(oldOrder);
        }
        await fetchAPI(`orders?id=eq.${editingOrder.id}`, { method: 'PATCH', body: JSON.stringify(orderToSave) });
        await addNotification('تعديل أوردر', `تم تعديل أوردر ${formData.customer_name}`);
        if (orderToSave.status === 'completed' && orderToSave.is_paid && !orderToSave.profit_added_to_cash) {
          await addCompanyProfitToCash({ ...orderToSave, id: editingOrder.id });
        }
        alert("✅ تم تعديل الأوردر بنجاح");
      } else {
        await fetchAPI('orders', { method: 'POST', body: JSON.stringify(orderToSave) });
        await addNotification('إضافة أوردر', `تم إضافة أوردر جديد للعميل ${formData.customer_name}`);
        alert("✅ تم إضافة الأوردر بنجاح");
        sendWhatsAppToCustomerOnCreate(orderToSave);
      }
      setShowOrderModal(false); setEditingOrder(null);
      setFormData({ customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '', status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false, date: new Date().toLocaleDateString("ar-EG") });
      setIsOtherDevice(false); setIsOtherBrand(false); setCustomDevice(''); setCustomBrand('');
      fetchData();
    } catch (err) { console.error(err); alert("❌ حدث خطأ أثناء حفظ الأوردر"); }
  };

  const updateAllPendingOrdersProfit = async (technicianName: string, newPercentage: number) => {
    if (!canEditDelete()) return alert("⚠️ ليس لديك صلاحية");
    if (!confirm(`هل تريد تحديث نسب الأرباح لجميع الأوردرات غير المكتملة للفني "${technicianName}" إلى ${newPercentage}%؟`)) return;
    const pendingOrders = orders.filter(o => o.technician === technicianName && o.status !== 'completed');
    if (pendingOrders.length === 0) {
      alert("لا توجد أوردرات غير مكتملة لهذا الفني.");
      return;
    }
    let updatedCount = 0;
    for (const order of pendingOrders) {
      const net = order.net_amount;
      const newTechnicianShare = Math.round((net * newPercentage) / 100);
      const newCompanyShare = net - newTechnicianShare;
      await fetchAPI(`orders?id=eq.${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ technician_share: newTechnicianShare, company_share: newCompanyShare })
      });
      updatedCount++;
    }
    await addNotification('تحديث نسب أرباح الفني', `تم تحديث نسب أرباح ${updatedCount} أوردر للفني ${technicianName} إلى ${newPercentage}%`);
    await fetchData();
    alert(`✅ تم تحديث ${updatedCount} أوردر بنجاح.`);
  };

  const saveTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditDelete()) return alert("⚠️ ليس لديك صلاحية");
    const oldTech = editingTech ? technicians.find(t => t.id === editingTech.id) : null;
    const percentageChanged = oldTech && oldTech.profit_percentage !== techForm.profit_percentage;
    try {
      if (editingTech) {
        await fetchAPI(`technicians?id=eq.${editingTech.id}`, { 
          method: 'PATCH', 
          body: JSON.stringify({ ...techForm, profit_percentage: techForm.profit_percentage }) 
        });
        await addNotification('تعديل فني', `تم تعديل بيانات الفني ${techForm.name}`);
        if (percentageChanged && confirm(`هل تريد تحديث الأوردرات غير المكتملة للفني "${techForm.name}" لتطبيق النسبة الجديدة (${techForm.profit_percentage}%)؟`)) {
          await updateAllPendingOrdersProfit(techForm.name, techForm.profit_percentage);
        }
      } else {
        await fetchAPI('technicians', { method: 'POST', body: JSON.stringify({ ...techForm, profit_percentage: techForm.profit_percentage }) });
        await addNotification('إضافة فني', `تم إضافة فني جديد: ${techForm.name}`);
      }
      await syncTechniciansToUsers();
      setShowTechModal(false); setEditingTech(null);
      setTechForm({ name: '', phone: '', specialization: '', is_active: true, username: '', password: '', profit_percentage: 50 });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const deleteTechnician = async (id: number, name: string) => {
    if (!canEditDelete()) return alert("⚠️ ليس لديك صلاحية");
    if (confirm(`حذف الفني ${name}؟`)) { 
      await fetchAPI(`technicians?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف فني', `تم حذف الفني ${name}`);
      await syncTechniciansToUsers();
      await fetchData();
    }
  };

  const toggleTechnicianActive = async (tech: any) => {
    if (!canEditDelete()) return alert("⚠️ ليس لديك صلاحية");
    await fetchAPI(`technicians?id=eq.${tech.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !tech.is_active }) });
    await addNotification('تغيير حالة فني', `تم ${!tech.is_active ? 'تفعيل' : 'تعطيل'} الفني ${tech.name}`);
    await syncTechniciansToUsers();
    fetchData();
  };

  const copyTechLink = (name: string, id: number) => {
    navigator.clipboard.writeText(`${window.location.origin}/tech-portal?name=${encodeURIComponent(name)}`);
    setCopiedId(id); setTimeout(() => setCopiedId(null), 2000);
  };

  const savePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditDelete()) return alert("⚠️ ليس لديك صلاحية");
    try {
      if (editingPartner) await fetchAPI(`partners?id=eq.${editingPartner.id}`, { method: 'PATCH', body: JSON.stringify(partnerForm) });
      else await fetchAPI('partners', { method: 'POST', body: JSON.stringify(partnerForm) });
      await addNotification(editingPartner ? 'تعديل شريك' : 'إضافة شريك', `${editingPartner ? 'تم تعديل' : 'تم إضافة'} الشريك ${partnerForm.name}`);
      setShowPartnerModal(false); setEditingPartner(null); setPartnerForm({ name: '', share_percentage: 0, phone: '', is_active: true });
      fetchPartners();
    } catch (err) { console.error(err); }
  };

  const deletePartner = async (id: number, name: string) => {
    if (!canEditDelete()) return alert("⚠️ ليس لديك صلاحية");
    if (confirm(`حذف الشريك ${name}؟`)) { await fetchAPI(`partners?id=eq.${id}`, { method: 'DELETE' }); await addNotification('حذف شريك', `تم حذف الشريك ${name}`); fetchPartners(); }
  };

  const printAndSendInvoice = async (order: any) => {
    const parts = prompt("✏️ قطع الغيار المستخدمة", "لا توجد") || "لا توجد";
    const warranty = prompt("🛡️ فترة الضمان", "6 أشهر") || "6 أشهر";
    if (!order.phone) return alert("❌ رقم الهاتف غير موجود");
    await fetchAPI(`orders?id=eq.${order.id}`, { method: 'PATCH', body: JSON.stringify({ invoice_approved: true, warranty_period: warranty, parts_used: parts, invoice_date: new Date().toISOString().split('T')[0] }) });
    await addNotification('اعتماد فاتورة', `تم اعتماد فاتورة ${order.customer_name} مع ضمان ${warranty}`);
    window.open(`/invoice?id=${order.id}`, '_blank');
    const phone = formatPhoneForWhatsApp(order.phone);
    const msg = `📄 *فاتورة الصيانة - ضمان* 📄\n\nشكراً لثقتك بنا\n━━━━━━━━━━━━━━━━━━━━━━\n🔢 رقم الأوردر: ${order.order_number}\n👤 العميل: ${order.customer_name}\n📱 الهاتف: ${order.phone}\n📍 العنوان: ${order.address || 'غير محدد'}\n\n🔧 الجهاز: ${order.device_type} - ${order.brand}\n⚠️ المشكلة: ${order.problem_description || 'غير محددة'}\n🔧 قطع الغيار: ${parts}\n\n💰 المبلغ: ${order.total_amount} ج.م\n🛡️ الضمان: ${warranty}\n\n━━━━━━━━━━━━━━━━━━━━━━\n📞 للاستفسار: 01278885772\n\nشكراً لثقتك بنا 🙏`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    alert("✅ تم اعتماد الفاتورة وإرسالها للعميل");
    fetchData();
  };

  const deleteNotification = async (id: number) => { await fetchAPI(`notifications?id=eq.${id}`, { method: 'DELETE' }); fetchNotifications(); };
  const deleteAllNotifications = async () => {
    if (confirm('حذف كل الإشعارات؟')) { for (const n of notifications) await fetchAPI(`notifications?id=eq.${n.id}`, { method: 'DELETE' }); fetchNotifications(); }
  };
  const clearFilters = () => { setSearchTerm(''); setFilterStatus('all'); setFilterTechnician(''); setFilterDeviceType(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterDelay('all'); };

  // دالة إرسال التقرير اليومي للشركاء عبر واتساب
  const sendDailyReportToPartners = async () => {
    const today = new Date().toISOString().split('T')[0];
    const entries = await fetchAPI(`cash_ledger?select=*&date=eq.${today}&order=created_at.desc`);
    if (!entries || entries.length === 0) {
      alert("⚠️ لا توجد حركات خزنة لهذا اليوم");
      return;
    }
    let totalIncome = 0, totalExpense = 0, totalProfitDist = 0, totalReserve = 0;
    const profitDetails: string[] = [];
    entries.forEach((entry: any) => {
      if (entry.type === 'income') totalIncome += entry.amount;
      else if (entry.type === 'expense') totalExpense += entry.amount;
      else if (entry.type === 'profit_distribution') {
        totalProfitDist += entry.amount;
        profitDetails.push(`• ${entry.description} : ${entry.amount} ج.م`);
      }
      else if (entry.type === 'reserve') totalReserve += entry.amount;
    });
    const netBalance = totalIncome + totalReserve - totalExpense;
    const reportText = `📊 *تقرير الخزنة اليومي* 📊\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📅 *التاريخ:* ${today}\n\n💰 *الإيرادات:* ${totalIncome.toLocaleString()} ج.م\n💸 *المصروفات:* ${totalExpense.toLocaleString()} ج.م\n📤 *توزيع أرباح الشركاء:* ${totalProfitDist.toLocaleString()} ج.م\n🏦 *الرصيد الاحتياطي:* ${totalReserve.toLocaleString()} ج.م\n✅ *صافي ربح اليوم:* ${netBalance.toLocaleString()} ج.م\n💰 *الرصيد الحالي للخزنة:* ${cashBalance.toLocaleString()} ج.م\n\n👥 *تفاصيل توزيع الأرباح:*\n${profitDetails.length ? profitDetails.join('\n') : 'لا توجد توزيعات'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📞 للاستفسار: 01278885772\n✨ نظام إدارة الصيانة - تقرير يومي`;
    const activePartners = partners.filter(p => p.is_active && p.phone);
    if (activePartners.length === 0) {
      alert("⚠️ لا يوجد شركاء نشطون بأرقام هواتف");
      return;
    }
    const userChoice = confirm(`📋 التقرير جاهز للإرسال.\n\n${reportText}\n\nهل تريد فتح واتساب لإرسال التقرير لكل شريك على حدة؟`);
    if (!userChoice) return;
    for (const partner of activePartners) {
      let phone = partner.phone.toString().replace(/[^\d]/g, '');
      if (phone.startsWith('0')) phone = phone.substring(1);
      if (phone.length === 10) phone = '20' + phone;
      if (!phone.startsWith('20')) phone = '20' + phone;
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(reportText)}`;
      window.open(whatsappUrl, '_blank');
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    alert(`✅ تم فتح واتساب لـ ${activePartners.length} شريك. قم بإرسال التقرير لكل منهم.`);
  };

  // فلترة الأوردرات
  const filteredOrders = orders.filter(o => {
    if (searchTerm && !o.customer_name?.includes(searchTerm) && !o.phone?.includes(searchTerm) && !String(o.order_number).includes(searchTerm)) return false;
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (filterTechnician && o.technician !== filterTechnician) return false;
    if (filterDeviceType && o.device_type !== filterDeviceType) return false;
    if (filterDateFrom && o.date && o.date < filterDateFrom) return false;
    if (filterDateTo && o.date && o.date > filterDateTo) return false;
    if (filterDelay === 'delayed' && !isDelayed(o)) return false;
    if (showAllOrders) return true;
    return (o.status === 'in-progress' || o.status === 'pending' || !o.technician);
  });

  const filteredTechnicians = technicians.filter(t => filterTechStatus === 'all' ? true : filterTechStatus === 'active' ? t.is_active !== false : t.is_active === false);

  if (loading) return <div className="flex justify-center items-center h-screen text-slate-400">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200" dir="rtl">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3"><LayoutDashboard className="w-6 h-6 text-orange-500" /><div><h1 className="text-lg font-bold text-white">لوحة تحكم المدير</h1><p className="text-xs text-slate-400">{currentUser?.name || 'مدير النظام'}</p></div></div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"><LogOut className="w-5 h-5" /></button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900 rounded-xl p-4 text-center border border-slate-800"><p className="text-2xl font-bold text-white">{orders.length}</p><p className="text-xs text-slate-400">إجمالي الأوردرات</p></div>
          <div className="bg-slate-900 rounded-xl p-4 text-center border border-slate-800"><p className="text-2xl font-bold text-yellow-500">{stats.pending}</p><p className="text-xs text-slate-400">قيد الانتظار</p></div>
          <div className="bg-slate-900 rounded-xl p-4 text-center border border-slate-800"><p className="text-2xl font-bold text-green-500">{stats.completed}</p><p className="text-xs text-slate-400">مكتمل</p></div>
          <div className="bg-slate-900 rounded-xl p-4 text-center border border-slate-800"><p className="text-xl font-bold text-orange-500">{stats.totalIncome.toLocaleString()} ج.م</p><p className="text-xs text-slate-400">أرباح الشركة</p></div>
          <div className="bg-slate-900 rounded-xl p-4 text-center border border-slate-800"><p className="text-2xl font-bold text-blue-500">{technicians.filter(t=>t.is_active!==false).length}</p><p className="text-xs text-slate-400">فني متاح</p></div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'orders' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>📋 الأوردرات</button>
          <button onClick={() => setActiveTab('technicians')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'technicians' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>👨‍🔧 الفنيين</button>
          <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'reports' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>📊 التقارير</button>
          <button onClick={() => setActiveTab('invoicesReview')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'invoicesReview' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>📄 الفواتير</button>
          <button onClick={() => setActiveTab('cash')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'cash' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>💰 الخزنة</button>
          <button onClick={() => setActiveTab('partners')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'partners' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>🤝 الشركاء</button>
          <button onClick={() => setActiveTab('notifications')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition ${activeTab === 'notifications' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Bell className="w-4 h-4" /> الإشعارات ({notifications.length})</button>
          {userRole === 'admin' && <button onClick={() => setActiveTab('permissions')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'permissions' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>🔐 الصلاحيات</button>}
          <button onClick={() => setActiveTab('performance')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'performance' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>📊 أداء الفنيين</button>
        </div>

        {/* Orders Tab (مختصر لتوفير المساحة، باقي الكود كما هو) */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-xl p-4 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><input type="text" placeholder="بحث..." className="w-full pr-10 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} /></div>
              <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"><option value="all">الكل</option><option value="pending">قيد الانتظار</option><option value="in-progress">قيد التنفيذ</option><option value="inspected">تم الكشف</option><option value="completed">مكتمل</option><option value="cancelled">ملغي</option></select>
              <select value={filterTechnician} onChange={e=>setFilterTechnician(e.target.value)} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"><option value="">جميع الفنيين</option>{technicians.map(t=><option key={t.id} value={t.name}>{t.name}</option>)}</select>
              <select value={filterDeviceType} onChange={e=>setFilterDeviceType(e.target.value)} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"><option value="">جميع الأجهزة</option>{DEVICE_TYPES.map(d=><option key={d}>{d}</option>)}</select>
              <input type="date" value={filterDateFrom} onChange={e=>setFilterDateFrom(e.target.value)} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white" />
              <input type="date" value={filterDateTo} onChange={e=>setFilterDateTo(e.target.value)} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white" />
              <button onClick={()=>setFilterDelay(filterDelay==='delayed'?'all':'delayed')} className={`px-3 py-2 rounded-lg text-sm ${filterDelay==='delayed'?'bg-red-600 text-white':'bg-slate-800 text-slate-300'}`}>⚠️ المتأخرة فقط</button>
              <button onClick={clearFilters} className="bg-slate-800 text-slate-300 px-3 py-2 rounded-lg text-sm">مسح الكل</button>
              <button onClick={()=>setShowAllOrders(!showAllOrders)} className={`px-3 py-2 rounded-lg text-sm transition ${showAllOrders ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{showAllOrders ? '📋 إخفاء المنجز' : '📋 عرض الكل'}</button>
              <button onClick={()=>{setEditingOrder(null); setFormData({ customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '', status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false, date: new Date().toLocaleDateString("ar-EG") }); setShowOrderModal(true);}} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> أوردر جديد</button>
              <button onClick={fetchData} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg"><RefreshCw size={18} /></button>
            </div>
            {filteredOrders.length === 0 && !showAllOrders && <div className="text-center py-8 text-slate-400">لا توجد أوردرات (قيد الانتظار، قيد التنفيذ، أو بدون فني). اضغط "عرض الكل" لمشاهدة جميع الأوردرات.</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map(order => (
                <div key={order.id} className={`bg-slate-900 rounded-xl border-r-4 p-4 ${isDelayed(order) ? 'border-red-500' : order.status === 'completed' ? 'border-green-500' : order.status === 'in-progress' ? 'border-blue-500' : 'border-yellow-500'}`}>
                  <div className="flex justify-between items-start"><div><h3 className="font-bold text-white">{order.customer_name}</h3><p className="text-xs text-slate-400">رقم: {order.order_number}</p></div><div className="flex gap-1"><button onClick={()=>togglePaidStatus(order.id, order.is_paid)} className={`p-1 rounded ${order.is_paid ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>{order.is_paid ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}</button>{canEditDelete() && <><button onClick={()=>{setEditingOrder(order); setFormData(order); setShowOrderModal(true);}} className="p-1 text-blue-500"><Edit size={16}/></button><button onClick={()=>copyOrder(order)} className="p-1 text-slate-400"><Copy size={16}/></button><button onClick={()=>deleteOrder(order.id)} className="p-1 text-red-500"><Trash2 size={16}/></button></>}</div></div>
                  <div className="grid grid-cols-2 gap-1 mt-2 text-sm"><div className="text-slate-300">📞 {order.phone}</div><div className="text-slate-300">🔧 {order.device_type} - {order.brand}</div><div className="col-span-2 text-slate-300">📍 {order.address}</div><div className="col-span-2 text-slate-300">📝 {order.problem_description}</div><div className="text-slate-300">💰 {order.total_amount} ج.م</div><div className="text-slate-300">👨‍🔧 {order.technician || '-'}</div></div>
                  <div className="flex justify-between items-center mt-3"><select value={order.status} onChange={e=>updateOrderStatus(order.id, e.target.value)} className="text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white"><option value="pending">قيد الانتظار</option><option value="in-progress">قيد التنفيذ</option><option value="inspected">تم الكشف</option><option value="completed">مكتمل</option><option value="cancelled">ملغي</option></select><span className={`text-xs px-2 py-1 rounded ${order.is_paid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{order.is_paid ? 'تم التحصيل' : 'لم يتحصل'}</span></div>
                  {order.status === 'in-progress' && canEditDelete() && (
                    <button onClick={() => { setSelectedOrder(order); setSettleForm({ total_amount: order.total_amount || 0, parts_cost: order.parts_cost || 0, transport_cost: order.transport_cost || 0, net_amount: order.net_amount || 0, technician_share: order.technician_share || 0, company_share: order.company_share || 0 }); setShowSettleModal(true); }} className="mt-2 w-full bg-orange-600 hover:bg-orange-700 text-white py-1 rounded-lg text-sm font-bold">تصفية الأوردر</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technicians Tab */}
        {activeTab === 'technicians' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center"><div className="flex gap-2"><button onClick={()=>setFilterTechStatus('active')} className={`px-3 py-1 rounded-full text-sm ${filterTechStatus==='active'?'bg-orange-600 text-white':'bg-slate-800 text-slate-300'}`}>النشطون</button><button onClick={()=>setFilterTechStatus('inactive')} className={`px-3 py-1 rounded-full text-sm ${filterTechStatus==='inactive'?'bg-orange-600 text-white':'bg-slate-800 text-slate-300'}`}>غير النشطون</button><button onClick={()=>setFilterTechStatus('all')} className={`px-3 py-1 rounded-full text-sm ${filterTechStatus==='all'?'bg-orange-600 text-white':'bg-slate-800 text-slate-300'}`}>الجميع</button></div>{canEditDelete() && <button onClick={()=>{setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true, username: '', password: '', profit_percentage: 50 }); setShowTechModal(true);}} className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18}/> إضافة فني</button>}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTechnicians.map(tech => (
                <div key={tech.id} className="bg-slate-900 rounded-xl p-4 text-center border border-slate-800">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3"><Users className="w-8 h-8 text-orange-500" /></div>
                  <h3 className="font-bold text-white">{tech.name}</h3>
                  <p className="text-xs text-slate-400">{tech.specialization}</p>
                  <p className="text-xs text-slate-400 mt-1">نسبة الأرباح: {tech.profit_percentage ?? 50}%</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={()=>copyTechLink(tech.name, tech.id)} className="flex-1 bg-slate-800 text-slate-300 py-1 rounded text-xs flex items-center justify-center gap-1">{copiedId===tech.id ? <Check size={14}/> : <Copy size={14}/>} نسخ</button>
                    {canEditDelete() && <>
                      <button onClick={()=>{setEditingTech(tech); setTechForm(tech); setShowTechModal(true);}} className="p-1 text-blue-500"><Edit size={16}/></button>
                      <button onClick={()=>deleteTechnician(tech.id, tech.name)} className="p-1 text-red-500"><Trash2 size={16}/></button>
                      <button onClick={()=>toggleTechnicianActive(tech)} className={`p-1 ${tech.is_active!==false ? 'text-green-500' : 'text-red-500'}`}>{tech.is_active!==false ? 'نشط' : 'تعطيل'}</button>
                      <button onClick={() => updateAllPendingOrdersProfit(tech.name, tech.profit_percentage ?? 50)} className="p-1 text-purple-500 hover:text-purple-400" title="تحديث نسب الأوردرات غير المكتملة لهذا الفني"><RefreshCw size={16}/></button>
                    </>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 rounded-xl p-6 text-center"><p className="text-slate-400">إجمالي الإيرادات</p><p className="text-3xl font-bold text-white">{orders.reduce((a,o)=>a+(o.total_amount||0),0).toLocaleString()} ج.م</p></div>
            <div className="bg-slate-900 rounded-xl p-6 text-center"><p className="text-slate-400">إجمالي المصاريف</p><p className="text-3xl font-bold text-white">{orders.reduce((a,o)=>a+(o.parts_cost+o.transport_cost||0),0).toLocaleString()} ج.م</p></div>
            <div className="bg-slate-900 rounded-xl p-6 text-center"><p className="text-slate-400">صافي أرباح الشركة</p><p className="text-3xl font-bold text-orange-500">{stats.totalIncome.toLocaleString()} ج.م</p></div>
          </div>
        )}

        {/* Invoices Review Tab */}
        {activeTab === 'invoicesReview' && (
          <div className="space-y-3">
            {orders.filter(o=>o.status==='completed' && !o.invoice_approved).map(order => (
              <div key={order.id} className="bg-slate-900 rounded-xl p-4 flex justify-between items-center flex-wrap gap-3 border border-slate-800">
                <div><p className="font-bold text-white">{order.customer_name}</p><p className="text-sm text-slate-400">{order.device_type} - {order.brand}</p><p className="text-orange-400">المبلغ: {order.total_amount} ج.م</p></div>
                <button onClick={()=>printAndSendInvoice(order)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Printer size={16}/> طباعة الفاتورة</button>
              </div>
            ))}
            {orders.filter(o=>o.status==='completed' && !o.invoice_approved).length===0 && <div className="text-center py-8 text-slate-400">لا توجد فواتير بانتظار المراجعة</div>}
          </div>
        )}

        {/* Cash Tab */}
        {activeTab === 'cash' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div className="bg-emerald-500/20 p-4 rounded-xl"><p className="text-slate-400">رصيد الخزنة</p><p className="text-3xl font-bold text-emerald-400">{cashBalance.toLocaleString()} ج.م</p></div>
              <div className="flex gap-2">
                <input type="date" value={cashFilterDate} onChange={e=>setCashFilterDate(e.target.value)} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"/>
                <button onClick={()=>setCashFilterDate('')} className="bg-slate-700 text-white px-3 py-2 rounded-lg text-sm">إلغاء الفلتر</button>
                {canEditDelete() && <button onClick={()=>{setEditingCash(null); setCashForm({ type: 'expense', amount: 0, description: '', date: new Date().toISOString().split('T')[0] }); setShowCashModal(true);}} className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={16}/> حركة جديدة</button>}
              </div>
            </div>

            <div className="bg-purple-600/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 border border-purple-500/30">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-purple-300">📅 توزيع أرباح الشركاء</p>
                <p className="text-xs text-slate-400">اختر التاريخ ثم اضغط زر التوزيع (يتم توزيع صافي ربح اليوم بنسبة الشركاء)</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="date"
                  value={selectedProfitDate}
                  onChange={(e) => setSelectedProfitDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
                {canEditDelete() && (
                  <button
                    onClick={handleDistributeSelectedProfit}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                  >
                    <DollarSign size={16}/> توزيع أرباح التاريخ المحدد
                  </button>
                )}
                {canEditDelete() && (
                  <button onClick={sendDailyReportToPartners} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <Send className="w-4 h-4" /> إرسال تقرير اليوم للشركاء
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800">
                  <tr><th className="p-3">التاريخ</th><th>النوع</th><th>المبلغ</th><th>الوصف</th><th>إجراءات</th></tr>
                </thead>
                <tbody>
                  {cashLedger.map(entry=>(
                    <tr key={entry.id} className="border-b border-slate-800">
                      <td className="p-3 text-slate-300">{entry.date}</td>
                      <td className="text-slate-300">{entry.type==='income'?'💰 دخل':entry.type==='expense'?'💸 مصروف':entry.type==='profit_distribution'?'📤 توزيع أرباح':'🏦 رصيد احتياطي'}</td>
                      <td className={entry.type==='income'||entry.type==='reserve'?'text-green-400':'text-red-400'}>{entry.amount} ج.م</td>
                      <td className="max-w-xs break-words text-slate-300">{entry.description}</td>
                      <td>{canEditDelete() && <button onClick={()=>deleteCashEntry(entry.id)} className="text-red-400"><Trash2 size={16}/></button>}</td>
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
            <div className="flex justify-end">{canEditDelete() && <button onClick={()=>{setEditingPartner(null); setPartnerForm({ name: '', share_percentage: 0, phone: '', is_active: true }); setShowPartnerModal(true);}} className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><UserPlus size={16}/> إضافة شريك</button>}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{partners.map(partner => (
              <div key={partner.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                <div className="flex justify-between"><h3 className="font-bold text-white">{partner.name}</h3><span className={`text-xs px-2 py-1 rounded-full ${partner.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{partner.is_active ? 'نشط' : 'غير نشط'}</span></div>
                <p className="text-2xl font-bold text-orange-500 mt-2">{partner.share_percentage}%</p>
                <p className="text-sm text-slate-400">📞 {partner.phone || 'لا يوجد'}</p>
                {canEditDelete() && <div className="flex gap-2 mt-3"><button onClick={()=>{setEditingPartner(partner); setPartnerForm(partner); setShowPartnerModal(true);}} className="text-blue-500"><Edit size={16}/></button><button onClick={()=>deletePartner(partner.id, partner.name)} className="text-red-500"><Trash2 size={16}/></button></div>}
              </div>
            ))}</div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-3">
            <div className="flex justify-between"><h2 className="text-xl font-bold">🔔 سجل الإشعارات</h2>{canEditDelete() && notifications.length>0 && <button onClick={deleteAllNotifications} className="bg-red-500/20 text-red-400 px-3 py-1 rounded-lg text-sm flex items-center gap-1"><Trash size={14}/> مسح الكل</button>}</div>
            {notifications.map(notif=>(
              <div key={notif.id} className="bg-slate-900 rounded-xl p-4 flex justify-between items-center">
                <div><span className="text-orange-400 font-semibold">{notif.action}</span><span className="mx-2 text-slate-600">|</span><span className="text-slate-300">{notif.details}</span><div className="text-xs text-slate-500 mt-1">{new Date(notif.created_at).toLocaleString('ar-EG')}</div></div>
                {canEditDelete() && <button onClick={()=>deleteNotification(notif.id)} className="text-red-400"><Trash size={16}/></button>}
              </div>
            ))}
            {notifications.length===0 && <div className="text-center py-8 text-slate-400">لا توجد إشعارات</div>}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && <TechnicianPerformance orders={orders} technicians={technicians} />}

        {activeTab === 'permissions' && userRole === 'admin' && <AdminPermissions />}
      </main>

      {/* باقي المودالات (Order, Technician, Partner, Cash, Settlement) - كما هي في الكود السابق */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-2xl shadow-xl">
            <div className="flex justify-between mb-4"><h3 className="text-xl font-bold text-white">{editingOrder ? 'تعديل أوردر' : 'أوردر جديد'}</h3><button onClick={()=>setShowOrderModal(false)} className="text-slate-400"><X size={20}/></button></div>
            <form onSubmit={saveOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-slate-400">اسم العميل</label><input type="text" value={formData.customer_name} onChange={e=>handleFormChange('customer_name',e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" required/></div>
                <div><label className="text-sm text-slate-400">رقم الهاتف</label><input type="text" value={formData.phone} onChange={e=>handleFormChange('phone',e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" required/></div>
                <div><label className="text-sm text-slate-400">نوع الجهاز</label><select value={formData.device_type} onChange={e=>handleFormChange('device_type',e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"><option value="">اختر</option>{DEVICE_TYPES.map(d=><option key={d}>{d}</option>)}<option value="other">أخرى</option></select>{isOtherDevice && <input type="text" placeholder="جهاز مخصص" value={customDevice} onChange={e=>setCustomDevice(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 mt-2 text-white" required/>}</div>
                <div><label className="text-sm text-slate-400">الماركة</label><select value={formData.brand} onChange={e=>handleFormChange('brand',e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"><option value="">اختر</option>{BRANDS.map(b=><option key={b}>{b}</option>)}<option value="other">أخرى</option></select>{isOtherBrand && <input type="text" placeholder="ماركة مخصصة" value={customBrand} onChange={e=>setCustomBrand(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 mt-2 text-white" required/>}</div>
                <div className="col-span-2"><label className="text-sm text-slate-400">العنوان</label><input type="text" value={formData.address} onChange={e=>handleFormChange('address',e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"/></div>
                <div className="col-span-2"><label className="text-sm text-slate-400">وصف المشكلة</label><textarea rows={3} value={formData.problem_description} onChange={e=>handleFormChange('problem_description',e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"/></div>
                <div><label className="text-sm text-slate-400">الفني</label><select value={formData.technician} onChange={e=>handleFormChange('technician',e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"><option value="">اختر فني</option>{technicians.map(t=><option key={t.id}>{t.name}</option>)}</select></div>
                <div><label className="text-sm text-slate-400">إجمالي المبلغ</label><input type="number" value={formData.total_amount} onChange={e=>handleFormChange('total_amount',parseFloat(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"/></div>
                <div><label className="text-sm text-slate-400">قطع غيار</label><input type="number" value={formData.parts_cost} onChange={e=>handleFormChange('parts_cost',parseFloat(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"/></div>
                <div><label className="text-sm text-slate-400">مواصلات</label><input type="number" value={formData.transport_cost} onChange={e=>handleFormChange('transport_cost',parseFloat(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"/></div>
                <div className="col-span-2"><label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={formData.is_paid} onChange={e=>handleFormChange('is_paid',e.target.checked)} /> تم التحصيل</label></div>
              </div>
              <div className="flex gap-3 pt-4"><button type="submit" className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-bold">حفظ</button><button type="button" onClick={()=>setShowOrderModal(false)} className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-lg font-bold">إلغاء</button></div>
            </form>
          </div>
        </div>
      )}

      {showTechModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">{editingTech ? 'تعديل فني' : 'فني جديد'}</h3>
            <form onSubmit={saveTechnician} className="space-y-4">
              <input type="text" placeholder="الاسم" value={techForm.name} onChange={e=>setTechForm({...techForm, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" required/>
              <input type="text" placeholder="رقم الهاتف" value={techForm.phone} onChange={e=>setTechForm({...techForm, phone: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"/>
              <input type="text" placeholder="التخصص" value={techForm.specialization} onChange={e=>setTechForm({...techForm, specialization: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"/>
              <input type="text" placeholder="اسم المستخدم" value={techForm.username} onChange={e=>setTechForm({...techForm, username: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" required/>
              <input type="password" placeholder="كلمة المرور" value={techForm.password} onChange={e=>setTechForm({...techForm, password: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" required/>
              <input type="number" placeholder="نسبة الفني (%)" value={techForm.profit_percentage} onChange={e=>setTechForm({...techForm, profit_percentage: parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" />
              <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={techForm.is_active} onChange={e=>setTechForm({...techForm, is_active: e.target.checked})} /> نشط</label>
              <button type="submit" className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold">حفظ</button>
            </form>
          </div>
        </div>
      )}

      {showPartnerModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">{editingPartner ? 'تعديل شريك' : 'إضافة شريك'}</h3>
            <form onSubmit={savePartner} className="space-y-4">
              <input type="text" placeholder="اسم الشريك" value={partnerForm.name} onChange={e=>setPartnerForm({...partnerForm, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" required/>
              <input type="number" placeholder="نسبة الربح (%)" value={partnerForm.share_percentage} onChange={e=>setPartnerForm({...partnerForm, share_percentage: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" required/>
              <input type="text" placeholder="رقم الهاتف" value={partnerForm.phone} onChange={e=>setPartnerForm({...partnerForm, phone: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"/>
              <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={partnerForm.is_active} onChange={e=>setPartnerForm({...partnerForm, is_active: e.target.checked})} /> نشط</label>
              <button type="submit" className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold">حفظ</button>
            </form>
          </div>
        </div>
      )}

      {showCashModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">{editingCash ? 'تعديل حركة' : 'إضافة حركة'}</h3>
            <form onSubmit={addCashEntry} className="space-y-4">
              <select value={cashForm.type} onChange={e=>setCashForm({...cashForm, type: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"><option value="income">💰 دخل</option><option value="expense">💸 مصروف</option></select>
              <input type="number" placeholder="المبلغ" value={cashForm.amount} onChange={e=>setCashForm({...cashForm, amount: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" required/>
              <input type="text" placeholder="الوصف" value={cashForm.description} onChange={e=>setCashForm({...cashForm, description: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" required/>
              <input type="date" value={cashForm.date} onChange={e=>setCashForm({...cashForm, date: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" required/>
              <button type="submit" className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold">حفظ</button>
            </form>
          </div>
        </div>
      )}

      {showSettleModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">تصفية الأوردر</h3>
            <div className="space-y-4">
              <div><label className="text-sm text-slate-400">المبلغ الإجمالي</label><input type="number" value={settleForm.total_amount} onChange={(e) => handleSettleChange('total_amount', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" /></div>
              <div><label className="text-sm text-slate-400">قطع غيار</label><input type="number" value={settleForm.parts_cost} onChange={(e) => handleSettleChange('parts_cost', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" /></div>
              <div><label className="text-sm text-slate-400">مواصلات</label><input type="number" value={settleForm.transport_cost} onChange={(e) => handleSettleChange('transport_cost', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" /></div>
              <div className="bg-slate-800 p-3 rounded-lg space-y-2">
                <div className="flex justify-between"><span className="text-slate-400">الصافي:</span><span className="text-white font-bold">{settleForm.net_amount} ج.م</span></div>
                <div className="flex justify-between"><span className="text-slate-400">نصيب الفني ({technicians.find(t => t.name === selectedOrder?.technician)?.profit_percentage ?? 50}%):</span><span className="text-green-400 font-bold">{settleForm.technician_share} ج.م</span></div>
                <div className="flex justify-between"><span className="text-slate-400">نصيب الشركة:</span><span className="text-orange-400 font-bold">{settleForm.company_share} ج.م</span></div>
              </div>
              <button onClick={submitSettlement} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-bold">تأكيد التصفية</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
