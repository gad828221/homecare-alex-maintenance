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

  const [selectedProfitDate, setSelectedProfitDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });
  const [reportDate, setReportDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // تصحيح حساب الرصيد: income و reserve يزيدان الرصيد، expense و profit_distribution ينقصانه
  const fetchCashLedger = useCallback(async () => {
    try {
      let endpoint = 'cash_ledger?select=*&order=date.desc,created_at.desc';
      if (cashFilterDate) endpoint = `cash_ledger?select=*&date=eq.${cashFilterDate}&order=date.desc,created_at.desc`;
      const data = await fetchAPI(endpoint);
      setCashLedger(data || []);
      let balance = 0;
      (data || []).forEach((entry: any) => {
        if (entry.type === 'income' || entry.type === 'reserve') balance += entry.amount;
        else if (entry.type === 'expense' || entry.type === 'profit_distribution') balance -= entry.amount;
      });
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
      const entries = await fetchAPI(`cash_ledger?description=like=*${order.order_number}*&type=eq.income&select=id`);
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

  // دالة توزيع أرباح تاريخ محدد (مع منع تكرار reserve)
  const distributeProfitForDate = async (targetDate: string) => {
    try {
      const incomeEntries = await fetchAPI(`cash_ledger?select=amount&date=eq.${targetDate}&type=eq.income`);
      const expenseEntries = await fetchAPI(`cash_ledger?select=amount&date=eq.${targetDate}&type=eq.expense`);
      const totalIncome = (incomeEntries || []).reduce((sum, entry) => sum + (entry.amount || 0), 0);
      const totalExpense = (expenseEntries || []).reduce((sum, entry) => sum + (entry.amount || 0), 0);
      const netProfit = totalIncome - totalExpense;
      if (netProfit <= 0) { alert(`⚠️ لا توجد أرباح صافية ليوم ${targetDate}.`); return; }
      const activePartners = partners.filter(p => p.is_active === true);
      if (activePartners.length === 0) { alert("⚠️ لا يوجد شركاء نشطون."); return; }
      const totalPartnerShares = activePartners.reduce((sum, p) => sum + (Number(p.share_percentage) || 0), 0);
      if (totalPartnerShares <= 0) { alert("⚠️ إجمالي نسب الشركاء غير صالح."); return; }
      const amountToDistribute = (netProfit * totalPartnerShares) / 100;
      const remainingReserve = netProfit - amountToDistribute;
      if (amountToDistribute <= 0) { alert(`⚠️ لا يوجد مبلغ كافٍ للتوزيع.`); return; }
      const confirmMsg = `💰 أرباح يوم ${targetDate}: ${netProfit.toLocaleString()} ج.م\n📊 نسبة التوزيع: ${totalPartnerShares}%\n💰 سيتم توزيع ${amountToDistribute.toLocaleString()} ج.م على الشركاء\n🏦 سيتم إضافة ${remainingReserve.toLocaleString()} ج.م كرصيد احتياطي\nهل تريد الاستمرار؟`;
      if (!confirm(confirmMsg)) return;
      const existingDistributions = await fetchAPI(`cash_ledger?select=id&date=eq.${targetDate}&type=eq.profit_distribution`);
      if (existingDistributions && existingDistributions.length > 0) { alert(`⚠️ تم توزيع أرباح يوم ${targetDate} مسبقاً.`); return; }
      let distributedSum = 0;
      for (let i = 0; i < activePartners.length; i++) {
        const partner = activePartners[i];
        let share = (amountToDistribute * Number(partner.share_percentage)) / totalPartnerShares;
        if (i === activePartners.length - 1) share = amountToDistribute - distributedSum;
        else share = Math.floor(share);
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
      if (remainingReserve > 0) {
        const existingReserve = await fetchAPI(`cash_ledger?select=id&date=eq.${targetDate}&type=eq.reserve`);
        if (!existingReserve || existingReserve.length === 0) {
          await fetchAPI('cash_ledger', {
            method: 'POST',
            body: JSON.stringify({
              type: 'reserve',
              amount: remainingReserve,
              description: `🏦 رصيد احتياطي للشركة - أرباح يوم ${targetDate}`,
              date: targetDate
            })
          });
        }
      }
      await addNotification('توزيع أرباح الشركاء', `✅ تم توزيع ${amountToDistribute.toLocaleString()} ج.م وإضافة ${remainingReserve.toLocaleString()} ج.م للخزنة.`);
      await fetchCashLedger(); await fetchData();
      alert(`✅ تم التوزيع بنجاح.\n💰 تم توزيع ${amountToDistribute.toLocaleString()} ج.م\n🏦 تم إضافة ${remainingReserve.toLocaleString()} ج.م للخزنة.`);
    } catch (err) { console.error(err); alert("❌ حدث خطأ أثناء توزيع الأرباح"); }
  };

  const sendDailyReportToPartners = async (targetDate: string) => {
    try {
      const entries = await fetchAPI(`cash_ledger?select=*&date=eq.${targetDate}&order=created_at.desc`);
      if (!entries || entries.length === 0) { alert(`⚠️ لا توجد حركات ليوم ${targetDate}`); return false; }
      let totalIncome = 0, totalExpense = 0, totalProfitDist = 0, totalReserve = 0;
      const profitDetails = [];
      for (const entry of entries) {
        if (entry.type === 'income') totalIncome += entry.amount;
        else if (entry.type === 'expense') totalExpense += entry.amount;
        else if (entry.type === 'profit_distribution') {
          totalProfitDist += entry.amount;
          profitDetails.push(`• ${entry.description} : ${entry.amount} ج.م`);
        } else if (entry.type === 'reserve') totalReserve += entry.amount;
      }
      const netProfit = totalIncome - totalExpense;
      const reportText = `📊 *تقرير الخزنة اليومي* 📊\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📅 *التاريخ:* ${targetDate}\n\n💰 *الإيرادات:* ${totalIncome.toLocaleString()} ج.م\n💸 *المصروفات:* ${totalExpense.toLocaleString()} ج.م\n📤 *توزيع أرباح الشركاء:* ${totalProfitDist.toLocaleString()} ج.م\n🏦 *الرصيد الاحتياطي المضاف:* ${totalReserve.toLocaleString()} ج.م\n✅ *صافي ربح اليوم:* ${netProfit.toLocaleString()} ج.م\n💰 *الرصيد الحالي للخزنة:* ${cashBalance.toLocaleString()} ج.م\n\n👥 *تفاصيل توزيع الأرباح:*\n${profitDetails.length ? profitDetails.join('\n') : 'لا توجد توزيعات'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📞 للاستفسار: 01278885772\n✨ نظام إدارة الصيانة - تقرير يومي`;
      const activePartners = partners.filter(p => p.is_active && p.phone);
      if (activePartners.length === 0) { alert("⚠️ لا يوجد شركاء نشطون بأرقام هواتف"); return false; }
      if (!confirm(`📋 التقرير التالي سيتم إرساله:\n\n${reportText}\n\nهل تريد المتابعة؟`)) return false;
      for (const partner of activePartners) {
        let phone = partner.phone.toString().replace(/[^\d]/g, '');
        if (phone.startsWith('0')) phone = phone.substring(1);
        if (phone.length === 10) phone = '20' + phone;
        const message = `🔔 *تقرير يومي - شركاء الصيانة*\n\nمرحباً ${partner.name}،\n\n${reportText}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      await addNotification('إرسال تقرير يومي', `تم إرسال التقرير إلى ${activePartners.length} شريك`);
      alert(`✅ تم إرسال التقرير إلى ${activePartners.length} شريك.`);
      return true;
    } catch (err) { console.error(err); alert("❌ حدث خطأ أثناء إرسال التقرير"); return false; }
  };

  const handleDistributeSelectedProfit = async () => {
    if (!selectedProfitDate) { alert("⚠️ يرجى اختيار التاريخ أولاً."); return; }
    await distributeProfitForDate(selectedProfitDate);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, techsData, notificationsData, partnersData, cashData] = await Promise.all([
        fetchAPI('orders?select=*&order=created_at.desc'),
        fetchAPI('technicians?select=*'),
        fetchAPI('notifications?select=*&order=created_at.desc'),
        fetchAPI('partners?select=*&order=created_at.desc'),
        fetchAPI('cash_ledger?select=*&order=date.desc,created_at.desc')
      ]);
      setOrders(ordersData || []);
      setTechnicians(techsData || []);
      setNotifications(notificationsData || []);
      setPartners(partnersData || []);
      setCashLedger(cashData || []);
      let balance = 0;
      (cashData || []).forEach((entry: any) => {
        if (entry.type === 'income' || entry.type === 'reserve') balance += entry.amount;
        else if (entry.type === 'expense' || entry.type === 'profit_distribution') balance -= entry.amount;
      });
      setCashBalance(balance);
      const pending = (ordersData || []).filter(o => o.status === 'pending').length;
      const inProgress = (ordersData || []).filter(o => o.status === 'in_progress').length;
      const completed = (ordersData || []).filter(o => o.status === 'completed').length;
      const cancelled = (ordersData || []).filter(o => o.status === 'cancelled').length;
      const totalIncome = (ordersData || []).filter(o => o.is_paid).reduce((sum, o) => sum + (o.company_share || 0), 0);
      setStats({ pending, inProgress, completed, cancelled, totalIncome });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    syncTechniciansToUsers();
  }, [fetchData]);

  // دوال إنشاء وتعديل وحذف الأوردرات
  const generateOrderNumber = () => `MG-${Math.floor(Math.random() * 10000000000000)}`;
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
  const handleFormChange = (field: string, value: any) => {
    if (field === 'device_type') {
      if (value === 'other') { setIsOtherDevice(true); setFormData({ ...formData, device_type: '' }); return; }
      else setIsOtherDevice(false);
    }
    if (field === 'brand') {
      if (value === 'other') { setIsOtherBrand(true); setFormData({ ...formData, brand: '' }); return; }
      else setIsOtherBrand(false);
    }
    const updated = { ...formData, [field]: value };
    setFormData(calculateAmounts(updated));
  };
  const createOrder = async () => {
    if (!formData.customer_name || !formData.phone || !formData.device_type || !formData.address || !formData.technician) {
      alert("⚠️ الرجاء ملء جميع الحقول المطلوبة"); return;
    }
    setIsSubmitting(true);
    try {
      const orderNumber = generateOrderNumber();
      const newOrder = {
        ...formData,
        order_number: orderNumber,
        device_type: isOtherDevice ? customDevice : formData.device_type,
        brand: isOtherBrand ? customBrand : formData.brand,
        created_at: new Date().toISOString()
      };
      await fetchAPI('orders', { method: 'POST', body: JSON.stringify(newOrder) });
      await addNotification('إضافة أوردر', `تم إضافة أوردر جديد للعميل ${formData.customer_name}`);
      sendWhatsAppToCustomerOnCreate(newOrder);
      setShowOrderModal(false);
      resetOrderForm();
      fetchData();
    } catch (err) { console.error(err); alert("❌ فشل إضافة الأوردر"); } finally { setIsSubmitting(false); }
  };
  const updateOrder = async () => {
    if (!editingOrder) return;
    setIsSubmitting(true);
    try {
      const updated = { ...formData };
      await fetchAPI(`orders?id=eq.${editingOrder.id}`, { method: 'PATCH', body: JSON.stringify(updated) });
      await addNotification('تعديل أوردر', `تم تعديل أوردر رقم ${editingOrder.order_number}`);
      setShowOrderModal(false); setEditingOrder(null); resetOrderForm();
      fetchData();
    } catch (err) { console.error(err); alert("❌ فشل تعديل الأوردر"); } finally { setIsSubmitting(false); }
  };
  const deleteOrder = async (id: number, orderNumber: string) => {
    if (!canEditDelete()) return alert("⚠️ ليس لديك صلاحية");
    if (confirm(`هل تريد حذف الأوردر رقم ${orderNumber} نهائياً؟`)) {
      await fetchAPI(`orders?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف أوردر', `تم حذف الأوردر رقم ${orderNumber}`);
      fetchData();
    }
  };
  const updateOrderStatus = async (id: number, newStatus: string, settlementData?: any) => {
    try {
      const updateData: any = { status: newStatus };
      if (settlementData) {
        updateData.total_amount = settlementData.total_amount;
        updateData.parts_cost = settlementData.parts_cost;
        updateData.transport_cost = settlementData.transport_cost;
        updateData.net_amount = settlementData.net_amount;
        updateData.company_share = settlementData.company_share;
        updateData.technician_share = settlementData.technician_share;
        updateData.is_paid = true;
      }
      await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(updateData) });
      await addNotification('تحديث حالة أوردر', `تم تغيير حالة الأوردر رقم ${id} إلى ${newStatus}`);
      fetchData();
    } catch (err) { console.error(err); }
  };
  const resetOrderForm = () => {
    setFormData({
      customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '',
      status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false,
      date: new Date().toLocaleDateString("ar-EG")
    });
    setIsOtherDevice(false); setIsOtherBrand(false); setCustomDevice(''); setCustomBrand('');
  };

  // دوال الفنيين
  const createTechnician = async () => {
    if (!techForm.name || !techForm.username || !techForm.password) { alert("⚠️ الرجاء ملء جميع الحقول"); return; }
    try {
      await fetchAPI('technicians', { method: 'POST', body: JSON.stringify(techForm) });
      await addNotification('إضافة فني', `تم إضافة الفني ${techForm.name}`);
      setShowTechModal(false);
      setTechForm({ name: '', phone: '', specialization: '', is_active: true, username: '', password: '', profit_percentage: 50 });
      fetchData();
    } catch (err) { console.error(err); alert("❌ فشل إضافة الفني"); }
  };
  const updateTechnician = async () => {
    if (!editingTech) return;
    try {
      await fetchAPI(`technicians?id=eq.${editingTech.id}`, { method: 'PATCH', body: JSON.stringify(techForm) });
      await addNotification('تعديل فني', `تم تعديل بيانات الفني ${techForm.name}`);
      setShowTechModal(false); setEditingTech(null);
      setTechForm({ name: '', phone: '', specialization: '', is_active: true, username: '', password: '', profit_percentage: 50 });
      fetchData();
    } catch (err) { console.error(err); alert("❌ فشل تعديل الفني"); }
  };
  const deleteTechnician = async (id: number, name: string) => {
    if (!canEditDelete()) return alert("⚠️ ليس لديك صلاحية");
    if (confirm(`هل تريد حذف الفني ${name} نهائياً؟`)) {
      await fetchAPI(`technicians?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف فني', `تم حذف الفني ${name}`);
      fetchData();
    }
  };

  // دوال الشركاء
  const createPartner = async () => {
    if (!partnerForm.name || partnerForm.share_percentage <= 0) { alert("⚠️ الرجاء إدخال اسم ونسبة صحيحة"); return; }
    try {
      await fetchAPI('partners', { method: 'POST', body: JSON.stringify(partnerForm) });
      await addNotification('إضافة شريك', `تم إضافة الشريك ${partnerForm.name}`);
      setShowPartnerModal(false);
      setPartnerForm({ name: '', share_percentage: 0, phone: '', is_active: true });
      fetchData();
    } catch (err) { console.error(err); alert("❌ فشل إضافة الشريك"); }
  };
  const updatePartner = async () => {
    if (!editingPartner) return;
    try {
      await fetchAPI(`partners?id=eq.${editingPartner.id}`, { method: 'PATCH', body: JSON.stringify(partnerForm) });
      await addNotification('تعديل شريك', `تم تعديل بيانات الشريك ${partnerForm.name}`);
      setShowPartnerModal(false); setEditingPartner(null);
      setPartnerForm({ name: '', share_percentage: 0, phone: '', is_active: true });
      fetchData();
    } catch (err) { console.error(err); alert("❌ فشل تعديل الشريك"); }
  };
  const deletePartner = async (id: number, name: string) => {
    if (!canEditDelete()) return alert("⚠️ ليس لديك صلاحية");
    if (confirm(`هل تريد حذف الشريك ${name} نهائياً؟`)) {
      await fetchAPI(`partners?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف شريك', `تم حذف الشريك ${name}`);
      fetchData();
    }
  };

  // دوال تسوية الأوردر (مودال التصفية)
  const calculateSettlementAmounts = (data: any, technicianName: string) => {
    const total = parseFloat(data.total_amount) || 0;
    const parts = parseFloat(data.parts_cost) || 0;
    const transport = parseFloat(data.transport_cost) || 0;
    const net = total - parts - transport;
    const selectedTech = technicians.find(t => t.name === technicianName);
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

  // فلترة الأوردرات
  const filteredOrders = orders.filter(order => {
    if (searchTerm && !order.customer_name.includes(searchTerm) && !order.order_number.includes(searchTerm)) return false;
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    if (filterTechnician && order.technician !== filterTechnician) return false;
    if (filterDeviceType && order.device_type !== filterDeviceType) return false;
    if (filterDateFrom && order.date < filterDateFrom) return false;
    if (filterDateTo && order.date > filterDateTo) return false;
    if (filterDelay === 'delayed' && !isDelayed(order)) return false;
    return true;
  });
  const displayedOrders = showAllOrders ? filteredOrders : filteredOrders.slice(0, 20);

  if (loading) return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <div className="flex items-center gap-2"><LayoutDashboard className="text-blue-600" /><h1 className="text-xl font-bold">لوحة تحكم المدير</h1></div>
        <div className="flex items-center gap-4"><span className="text-gray-600">مرحباً، {currentUser?.name || 'المدير'}</span><button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded-lg flex items-center gap-1"><LogOut size={18} /> خروج</button></div>
      </header>

      <div className="flex gap-2 p-4 border-b bg-white overflow-x-auto">
        <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-lg ${activeTab === 'orders' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>📋 الأوردرات</button>
        <button onClick={() => setActiveTab('technicians')} className={`px-4 py-2 rounded-lg ${activeTab === 'technicians' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>🔧 الفنيين</button>
        <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-lg ${activeTab === 'reports' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>📊 التقارير</button>
        <button onClick={() => setActiveTab('invoicesReview')} className={`px-4 py-2 rounded-lg ${activeTab === 'invoicesReview' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>📄 الفواتير</button>
        <button onClick={() => setActiveTab('cash')} className={`px-4 py-2 rounded-lg ${activeTab === 'cash' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>💰 الخزنة</button>
        <button onClick={() => setActiveTab('partners')} className={`px-4 py-2 rounded-lg ${activeTab === 'partners' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>🤝 الشركاء</button>
        <button onClick={() => setActiveTab('notifications')} className={`px-4 py-2 rounded-lg ${activeTab === 'notifications' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>🔔 الإشعارات ({notifications.length})</button>
        {userRole === 'admin' && <button onClick={() => setActiveTab('permissions')} className={`px-4 py-2 rounded-lg ${activeTab === 'permissions' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>🔐 الصلاحيات</button>}
        <button onClick={() => setActiveTab('performance')} className={`px-4 py-2 rounded-lg ${activeTab === 'performance' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>📊 أداء الفنيين</button>
      </div>

      <div className="p-4">
        {/* تبويب الأوردرات */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div className="flex gap-2"><button onClick={() => { resetOrderForm(); setEditingOrder(null); setShowOrderModal(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> أوردر جديد</button><button onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterTechnician(''); setFilterDeviceType(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterDelay('all'); }} className="bg-gray-500 text-white px-4 py-2 rounded-lg">إلغاء الفلتر</button></div>
              <div className="flex gap-2 flex-wrap"><input type="text" placeholder="بحث" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border p-2 rounded" /><select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border p-2 rounded"><option value="all">كل الحالات</option><option value="pending">قيد الانتظار</option><option value="in_progress">قيد التنفيذ</option><option value="inspected">تم الكشف</option><option value="completed">مكتمل</option><option value="cancelled">ملغي</option></select><select value={filterTechnician} onChange={(e) => setFilterTechnician(e.target.value)} className="border p-2 rounded"><option value="">كل الفنيين</option>{technicians.map(t => <option key={t.id}>{t.name}</option>)}</select><select value={filterDeviceType} onChange={(e) => setFilterDeviceType(e.target.value)} className="border p-2 rounded"><option value="">كل الأجهزة</option>{DEVICE_TYPES.map(d => <option key={d}>{d}</option>)}</select><input type="date" placeholder="من تاريخ" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="border p-2 rounded" /><input type="date" placeholder="إلى تاريخ" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="border p-2 rounded" /><button onClick={() => setFilterDelay(filterDelay === 'delayed' ? 'all' : 'delayed')} className={`px-3 py-2 rounded ${filterDelay === 'delayed' ? 'bg-red-600 text-white' : 'bg-gray-300'}`}>تأخر</button></div>
            </div>
            <div className="overflow-x-auto"><table className="w-full border"><thead className="bg-gray-100"><tr><th className="p-2 border">#</th><th className="p-2 border">التاريخ</th><th className="p-2 border">رقم الأوردر</th><th className="p-2 border">العميل</th><th className="p-2 border">الجهاز</th><th className="p-2 border">الفني</th><th className="p-2 border">الحالة</th><th className="p-2 border">صافي الربح</th><th className="p-2 border">إجراءات</th></tr></thead><tbody>{displayedOrders.map((order, idx) => (<tr key={order.id}><td className="p-2 border">{idx+1}</td><td className="p-2 border">{order.date}</td><td className="p-2 border">{order.order_number}</td><td className="p-2 border">{order.customer_name}</td><td className="p-2 border">{order.device_type} - {order.brand}</td><td className="p-2 border">{order.technician}</td><td className="p-2 border"><select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className="border rounded p-1"><option value="pending">قيد الانتظار</option><option value="in_progress">قيد التنفيذ</option><option value="inspected">تم الكشف</option><option value="completed">مكتمل</option><option value="cancelled">ملغي</option></select></td><td className="p-2 border">{order.net_amount} ج.م</td><td className="p-2 border flex gap-2"><button onClick={() => { setEditingOrder(order); setFormData(order); setShowOrderModal(true); }} className="text-blue-500"><Edit size={18} /></button><button onClick={() => deleteOrder(order.id, order.order_number)} className="text-red-500"><Trash2 size={18} /></button>{order.status === 'completed' && !order.is_paid && (<button onClick={() => { setSelectedOrder(order); setSettleForm({ total_amount: order.total_amount, parts_cost: order.parts_cost, transport_cost: order.transport_cost, net_amount: order.net_amount, technician_share: order.technician_share, company_share: order.company_share }); setShowSettleModal(true); }} className="text-green-500"><DollarSign size={18} /></button>)}{order.status === 'completed' && order.is_paid && !order.profit_added_to_cash && (<button onClick={() => addCompanyProfitToCash(order)} className="text-yellow-500"><Plus size={18} /></button>)}</td></tr>))}</tbody></table></div>
            {!showAllOrders && filteredOrders.length > 20 && <button onClick={() => setShowAllOrders(true)} className="mt-4 text-blue-600">عرض الكل ({filteredOrders.length})</button>}
          </div>
        )}

        {/* تبويب الفنيين */}
        {activeTab === 'technicians' && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between mb-4"><button onClick={() => { setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true, username: '', password: '', profit_percentage: 50 }); setShowTechModal(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><UserPlus size={18} /> فني جديد</button><div className="flex gap-2"><button onClick={() => setFilterTechStatus('all')} className={`px-3 py-1 rounded ${filterTechStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>الكل</button><button onClick={() => setFilterTechStatus('active')} className={`px-3 py-1 rounded ${filterTechStatus === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>نشط</button><button onClick={() => setFilterTechStatus('inactive')} className={`px-3 py-1 rounded ${filterTechStatus === 'inactive' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>غير نشط</button></div></div>
            <div className="overflow-x-auto"><table className="w-full border"><thead className="bg-gray-100"><tr><th className="p-2 border">#</th><th className="p-2 border">الاسم</th><th className="p-2 border">الهاتف</th><th className="p-2 border">التخصص</th><th className="p-2 border">نسبة الربح</th><th className="p-2 border">الحالة</th><th className="p-2 border">إجراءات</th></tr></thead><tbody>{technicians.filter(t => filterTechStatus === 'all' ? true : filterTechStatus === 'active' ? t.is_active : !t.is_active).map((tech, idx) => (<tr key={tech.id}><td className="p-2 border">{idx+1}</td><td className="p-2 border">{tech.name}</td><td className="p-2 border">{tech.phone}</td><td className="p-2 border">{tech.specialization}</td><td className="p-2 border">{tech.profit_percentage}%</td><td className="p-2 border">{tech.is_active ? 'نشط' : 'غير نشط'}</td><td className="p-2 border flex gap-2"><button onClick={() => { setEditingTech(tech); setTechForm(tech); setShowTechModal(true); }} className="text-blue-500"><Edit size={18} /></button><button onClick={() => deleteTechnician(tech.id, tech.name)} className="text-red-500"><Trash2 size={18} /></button></td></tr>))}</tbody></table></div>
          </div>
        )}

        {/* تبويب التقارير */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow p-4"><h2 className="text-xl font-bold mb-4">التقارير والإحصائيات</h2><div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"><div className="bg-blue-100 p-3 rounded text-center"><div className="text-2xl font-bold">{orders.length}</div><div>إجمالي الأوردرات</div></div><div className="bg-yellow-100 p-3 rounded text-center"><div className="text-2xl font-bold">{stats.pending}</div><div>قيد الانتظار</div></div><div className="bg-green-100 p-3 rounded text-center"><div className="text-2xl font-bold">{stats.completed}</div><div>مكتمل</div></div><div className="bg-purple-100 p-3 rounded text-center"><div className="text-2xl font-bold">{stats.totalIncome.toLocaleString()} ج.م</div><div>أرباح الشركة</div></div><div className="bg-gray-100 p-3 rounded text-center"><div className="text-2xl font-bold">{technicians.filter(t=>t.is_active).length}</div><div>فني متاح</div></div></div><button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><Printer size={18} /> طباعة التقرير</button></div>
        )}

        {/* تبويب الفواتير */}
        {activeTab === 'invoicesReview' && (
          <div className="bg-white rounded-lg shadow p-4"><h2 className="text-xl font-bold mb-4">مراجعة الفواتير</h2><div className="overflow-x-auto"><table className="w-full border"><thead className="bg-gray-100"><tr><th className="p-2 border">رقم الأوردر</th><th className="p-2 border">العميل</th><th className="p-2 border">المبلغ الإجمالي</th><th className="p-2 border">صافي الربح</th><th className="p-2 border">حالة الدفع</th><th className="p-2 border">عرض</th></tr></thead><tbody>{orders.filter(o => o.status === 'completed').map(order => (<tr key={order.id}><td className="p-2 border">{order.order_number}</td><td className="p-2 border">{order.customer_name}</td><td className="p-2 border">{order.total_amount} ج.م</td><td className="p-2 border">{order.net_amount} ج.م</td><td className="p-2 border">{order.is_paid ? 'مدفوع' : 'غير مدفوع'}</td><td className="p-2 border"><button className="text-blue-500"><Eye size={18} /></button></td></tr>))}</tbody></table></div></div>
        )}

        {/* تبويب الخزنة (المعدل) */}
        {activeTab === 'cash' && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="mb-6 p-4 bg-gray-50 rounded-lg"><p className="text-lg">رصيد الخزنة: <span className="font-bold text-green-600">{cashBalance.toLocaleString()} ج.م</span></p></div>
            <div className="flex justify-between mb-6"><button onClick={() => { setEditingCash(null); setCashForm({ type: 'expense', amount: 0, description: '', date: new Date().toISOString().split('T')[0] }); setShowCashModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> حركة جديدة</button><button onClick={() => setCashFilterDate('')} className="bg-gray-500 text-white px-4 py-2 rounded-lg">إلغاء الفلتر</button></div>
            <div className="mb-8 p-4 border rounded-lg"><h3 className="text-lg font-semibold mb-3">📤 توزيع أرباح الشركاء</h3><p className="text-sm text-gray-500 mb-3">اختر التاريخ ثم اضغط زر التوزيع (يتم توزيع صافي ربح اليوم بنسبة الشركاء)</p><div className="flex flex-wrap items-end gap-4"><div><input type="date" value={selectedProfitDate} onChange={(e) => setSelectedProfitDate(e.target.value)} className="border p-2 rounded" /></div><button onClick={handleDistributeSelectedProfit} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><DollarSign size={18} /> توزيع أرباح التاريخ المحدد</button></div></div>
            <div className="mb-8 p-4 border rounded-lg"><h3 className="text-lg font-semibold mb-3">📨 إرسال تقرير الخزنة للشركاء</h3><p className="text-sm text-gray-500 mb-3">اختر التاريخ ثم اضغط زر الإرسال (يفتح واتساب لكل شريك)</p><div className="flex flex-wrap items-end gap-4"><div><input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="border p-2 rounded" /></div><button onClick={() => sendDailyReportToPartners(reportDate)} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Send size={18} /> إرسال تقرير التاريخ المحدد</button></div></div>
            <div className="overflow-x-auto"><table className="w-full border"><thead className="bg-gray-100"><tr><th className="p-2 border">التاريخ</th><th className="p-2 border">النوع</th><th className="p-2 border">المبلغ</th><th className="p-2 border">الوصف</th><th className="p-2 border">إجراءات</th></tr></thead><tbody>{cashLedger.map(entry => (<tr key={entry.id}><td className="p-2 border">{entry.date}</td><td className="p-2 border">{entry.type === 'income' ? '💰 دخل' : entry.type === 'expense' ? '💸 مصروف' : entry.type === 'profit_distribution' ? '📤 توزيع أرباح' : '🏦 رصيد احتياطي'}</td><td className="p-2 border">{entry.amount.toLocaleString()} ج.م</td><td className="p-2 border">{entry.description}</td><td className="p-2 border">{canEditDelete() && <button onClick={() => deleteCashEntry(entry.id)} className="text-red-500"><Trash2 size={18} /></button>}</td></tr>))}</tbody></table></div>
          </div>
        )}

        {/* تبويب الشركاء */}
        {activeTab === 'partners' && (
          <div className="bg-white rounded-lg shadow p-4"><div className="flex justify-between mb-4"><button onClick={() => { setEditingPartner(null); setPartnerForm({ name: '', share_percentage: 0, phone: '', is_active: true }); setShowPartnerModal(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><UserPlus size={18} /> شريك جديد</button></div><div className="overflow-x-auto"><table className="w-full border"><thead className="bg-gray-100"><tr><th className="p-2 border">#</th><th className="p-2 border">الاسم</th><th className="p-2 border">النسبة</th><th className="p-2 border">الهاتف</th><th className="p-2 border">الحالة</th><th className="p-2 border">إجراءات</th></tr></thead><tbody>{partners.map((p, idx) => (<tr key={p.id}><td className="p-2 border">{idx+1}</td><td className="p-2 border">{p.name}</td><td className="p-2 border">{p.share_percentage}%</td><td className="p-2 border">{p.phone}</td><td className="p-2 border">{p.is_active ? 'نشط' : 'غير نشط'}</td><td className="p-2 border flex gap-2"><button onClick={() => { setEditingPartner(p); setPartnerForm(p); setShowPartnerModal(true); }} className="text-blue-500"><Edit size={18} /></button><button onClick={() => deletePartner(p.id, p.name)} className="text-red-500"><Trash2 size={18} /></button></td></tr>))}</tbody></table></div></div>
        )}

        {/* تبويب الإشعارات */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-lg shadow p-4"><h2 className="text-xl font-bold mb-4">سجل الإشعارات</h2><div className="space-y-2 max-h-96 overflow-y-auto">{notifications.map(n => (<div key={n.id} className="border-b p-2"><div className="font-semibold">{n.action}</div><div className="text-sm text-gray-600">{n.details}</div><div className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</div></div>))}</div></div>
        )}

        {/* تبويب الصلاحيات */}
        {activeTab === 'permissions' && <AdminPermissions />}

        {/* تبويب أداء الفنيين */}
        {activeTab === 'performance' && <TechnicianPerformance technicians={technicians} orders={orders} />}
      </div>

      {/* مودال الأوردر */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto"><h3 className="text-xl font-bold mb-4">{editingOrder ? 'تعديل أوردر' : 'إضافة أوردر جديد'}</h3><div className="grid grid-cols-2 gap-3"><input type="text" placeholder="اسم العميل" value={formData.customer_name} onChange={(e) => handleFormChange('customer_name', e.target.value)} className="border p-2 rounded" /><input type="text" placeholder="رقم الهاتف" value={formData.phone} onChange={(e) => handleFormChange('phone', e.target.value)} className="border p-2 rounded" /><div className="flex gap-2 col-span-2"><select value={formData.device_type} onChange={(e) => handleFormChange('device_type', e.target.value)} className="border p-2 rounded flex-1"><option value="">نوع الجهاز</option>{DEVICE_TYPES.map(d => <option key={d}>{d}</option>)}<option value="other">أخرى</option></select>{isOtherDevice && <input type="text" placeholder="اكتب النوع" value={customDevice} onChange={(e) => setCustomDevice(e.target.value)} className="border p-2 rounded flex-1" />}</div><div className="flex gap-2 col-span-2"><select value={formData.brand} onChange={(e) => handleFormChange('brand', e.target.value)} className="border p-2 rounded flex-1"><option value="">الماركة</option>{BRANDS.map(b => <option key={b}>{b}</option>)}<option value="other">أخرى</option></select>{isOtherBrand && <input type="text" placeholder="اكتب الماركة" value={customBrand} onChange={(e) => setCustomBrand(e.target.value)} className="border p-2 rounded flex-1" />}</div><input type="text" placeholder="العنوان" value={formData.address} onChange={(e) => handleFormChange('address', e.target.value)} className="border p-2 rounded col-span-2" /><textarea placeholder="وصف المشكلة" value={formData.problem_description} onChange={(e) => handleFormChange('problem_description', e.target.value)} className="border p-2 rounded col-span-2" rows={2} /><select value={formData.technician} onChange={(e) => handleFormChange('technician', e.target.value)} className="border p-2 rounded"><option value="">اختر الفني</option>{technicians.map(t => <option key={t.id}>{t.name}</option>)}</select><input type="number" placeholder="إجمالي المبلغ" value={formData.total_amount} onChange={(e) => handleFormChange('total_amount', e.target.value)} className="border p-2 rounded" /><input type="number" placeholder="تكلفة القطع" value={formData.parts_cost} onChange={(e) => handleFormChange('parts_cost', e.target.value)} className="border p-2 rounded" /><input type="number" placeholder="تكلفة النقل" value={formData.transport_cost} onChange={(e) => handleFormChange('transport_cost', e.target.value)} className="border p-2 rounded" /><input type="text" placeholder="صافي الربح" value={formData.net_amount} readOnly className="border p-2 rounded bg-gray-100" /><input type="text" placeholder="حصة الفني" value={formData.technician_share} readOnly className="border p-2 rounded bg-gray-100" /><input type="text" placeholder="حصة الشركة" value={formData.company_share} readOnly className="border p-2 rounded bg-gray-100" /></div><div className="flex gap-2 mt-4"><button onClick={editingOrder ? updateOrder : createOrder} disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded flex-1">{isSubmitting ? 'جاري الحفظ...' : 'حفظ'}</button><button onClick={() => { setShowOrderModal(false); setEditingOrder(null); resetOrderForm(); }} className="bg-gray-300 px-4 py-2 rounded">إلغاء</button></div></div></div>
      )}

      {/* مودال الفني */}
      {showTechModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 w-96"><h3 className="text-xl font-bold mb-4">{editingTech ? 'تعديل فني' : 'إضافة فني جديد'}</h3><input type="text" placeholder="الاسم" value={techForm.name} onChange={(e) => setTechForm({...techForm, name: e.target.value})} className="w-full border p-2 mb-2 rounded" /><input type="text" placeholder="رقم الهاتف" value={techForm.phone} onChange={(e) => setTechForm({...techForm, phone: e.target.value})} className="w-full border p-2 mb-2 rounded" /><input type="text" placeholder="التخصص" value={techForm.specialization} onChange={(e) => setTechForm({...techForm, specialization: e.target.value})} className="w-full border p-2 mb-2 rounded" /><input type="text" placeholder="اسم المستخدم" value={techForm.username} onChange={(e) => setTechForm({...techForm, username: e.target.value})} className="w-full border p-2 mb-2 rounded" /><input type="password" placeholder="كلمة المرور" value={techForm.password} onChange={(e) => setTechForm({...techForm, password: e.target.value})} className="w-full border p-2 mb-2 rounded" /><input type="number" placeholder="نسبة الربح %" value={techForm.profit_percentage} onChange={(e) => setTechForm({...techForm, profit_percentage: parseFloat(e.target.value)})} className="w-full border p-2 mb-2 rounded" /><label className="flex items-center gap-2 mb-2"><input type="checkbox" checked={techForm.is_active} onChange={(e) => setTechForm({...techForm, is_active: e.target.checked})} /> نشط</label><div className="flex gap-2"><button onClick={editingTech ? updateTechnician : createTechnician} className="bg-blue-600 text-white px-4 py-2 rounded flex-1">حفظ</button><button onClick={() => { setShowTechModal(false); setEditingTech(null); }} className="bg-gray-300 px-4 py-2 rounded">إلغاء</button></div></div></div>
      )}

      {/* مودال الشريك */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 w-96"><h3 className="text-xl font-bold mb-4">{editingPartner ? 'تعديل شريك' : 'إضافة شريك جديد'}</h3><input type="text" placeholder="الاسم" value={partnerForm.name} onChange={(e) => setPartnerForm({...partnerForm, name: e.target.value})} className="w-full border p-2 mb-2 rounded" /><input type="number" placeholder="نسبة الربح %" value={partnerForm.share_percentage} onChange={(e) => setPartnerForm({...partnerForm, share_percentage: parseFloat(e.target.value)})} className="w-full border p-2 mb-2 rounded" /><input type="text" placeholder="رقم الهاتف (واتساب)" value={partnerForm.phone} onChange={(e) => setPartnerForm({...partnerForm, phone: e.target.value})} className="w-full border p-2 mb-2 rounded" /><label className="flex items-center gap-2 mb-2"><input type="checkbox" checked={partnerForm.is_active} onChange={(e) => setPartnerForm({...partnerForm, is_active: e.target.checked})} /> نشط</label><div className="flex gap-2"><button onClick={editingPartner ? updatePartner : createPartner} className="bg-blue-600 text-white px-4 py-2 rounded flex-1">حفظ</button><button onClick={() => { setShowPartnerModal(false); setEditingPartner(null); }} className="bg-gray-300 px-4 py-2 rounded">إلغاء</button></div></div></div>
      )}

      {/* مودال الخزنة */}
      {showCashModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 w-96"><h3 className="text-xl font-bold mb-4">{editingCash ? 'تعديل حركة' : 'إضافة حركة جديدة'}</h3><form onSubmit={addCashEntry}><select value={cashForm.type} onChange={(e) => setCashForm({ ...cashForm, type: e.target.value })} className="w-full border p-2 mb-3 rounded" required><option value="expense">مصروف</option><option value="income">دخل</option></select><input type="number" placeholder="المبلغ" value={cashForm.amount} onChange={(e) => setCashForm({ ...cashForm, amount: parseFloat(e.target.value) })} className="w-full border p-2 mb-3 rounded" required /><input type="text" placeholder="الوصف" value={cashForm.description} onChange={(e) => setCashForm({ ...cashForm, description: e.target.value })} className="w-full border p-2 mb-3 rounded" required /><input type="date" value={cashForm.date} onChange={(e) => setCashForm({ ...cashForm, date: e.target.value })} className="w-full border p-2 mb-3 rounded" required /><div className="flex gap-2"><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded flex-1">حفظ</button><button type="button" onClick={() => setShowCashModal(false)} className="bg-gray-300 px-4 py-2 rounded">إلغاء</button></div></form></div></div>
      )}

      {/* مودال تصفية الأوردر */}
      {showSettleModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 w-96"><h3 className="text-xl font-bold mb-4">تصفية الأوردر</h3><div className="space-y-2"><input type="number" placeholder="إجمالي المبلغ" value={settleForm.total_amount} onChange={(e) => handleSettleChange('total_amount', e.target.value)} className="w-full border p-2 rounded" /><input type="number" placeholder="تكلفة القطع" value={settleForm.parts_cost} onChange={(e) => handleSettleChange('parts_cost', e.target.value)} className="w-full border p-2 rounded" /><input type="number" placeholder="تكلفة النقل" value={settleForm.transport_cost} onChange={(e) => handleSettleChange('transport_cost', e.target.value)} className="w-full border p-2 rounded" /><div className="text-sm">صافي الربح: {settleForm.net_amount} ج.م</div><div className="text-sm">حصة الفني: {settleForm.technician_share} ج.م</div><div className="text-sm">حصة الشركة: {settleForm.company_share} ج.م</div></div><div className="flex gap-2 mt-4"><button onClick={submitSettlement} className="bg-green-600 text-white px-4 py-2 rounded flex-1">تأكيد وتسليم</button><button onClick={() => { setShowSettleModal(false); setSelectedOrder(null); }} className="bg-gray-300 px-4 py-2 rounded">إلغاء</button></div></div></div>
      )}
    </div>
  );
}
