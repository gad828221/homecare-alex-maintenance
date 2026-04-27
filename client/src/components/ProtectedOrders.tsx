import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Plus, Search, LayoutDashboard, Users, 
  CheckCircle2, AlertCircle, 
  Edit, Trash2, RefreshCw, Phone,
  Copy, Check, Trash, Bell, DollarSign, X, Printer, UserPlus, UserMinus, LogOut, Send,
  AlertTriangle, RotateCcw
} from "lucide-react";
import AdminPermissions from './AdminPermissions';
import TechnicianPerformance from './TechnicianPerformance';
import { createClient } from '@supabase/supabase-js';
import { useNotification } from './EnhancedNotificationSystem';
import { notifyTechnician, notifyAdmins } from '../lib/onesignal';
import { invoiceService } from '../services/invoiceService';

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
  console.log("تم تعطيل مزامنة الفنيين تلقائياً للحفاظ على الصلاحيات");
  return;
};

// دالة الإشعارات النهائية (ترسل إلى externalId)
const sendPushToExternalId = async (externalId: string, title: string, message: string) => {
  try {
    if (!window.OneSignal) {
      console.log("OneSignal not ready");
      return false;
    }
    await window.OneSignal.sendToExternalUserId(externalId, title, message);
    console.log(`✅ تم الإرسال إلى ${externalId}`);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export default function ProtectedOrders() {
  const { addNotification: toastNotification } = useNotification();

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
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedOrders, setDeletedOrders] = useState<any[]>([]);
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

  const canEditDelete = () => userRole === 'admin' || userRole === 'manager';
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

  // توزيع الأرباح
  const distributeProfitForDate = async (targetDate: string) => {
    try {
      const incomeEntries = await fetchAPI(`cash_ledger?select=amount&date=eq.${targetDate}&type=eq.income`);
      const totalIncome = (incomeEntries || []).reduce((sum, entry) => sum + (entry.amount || 0), 0);
      const netProfit = totalIncome;
      if (netProfit <= 0) {
        alert(`⚠️ لا توجد أرباح ليوم ${targetDate}.`);
        return;
      }
      const activePartners = partners.filter(p => p.is_active === true);
      if (activePartners.length === 0) {
        alert("⚠️ لا يوجد شركاء نشطون.");
        return;
      }
      const totalPartnerShares = activePartners.reduce((sum, p) => sum + (Number(p.share_percentage) || 0), 0);
      if (totalPartnerShares <= 0) {
        alert("⚠️ إجمالي نسب الشركاء غير صالح.");
        return;
      }
      const amountToDistribute = (netProfit * totalPartnerShares) / 100;
      if (amountToDistribute <= 0) {
        alert("⚠️ لا يوجد مبلغ كافٍ للتوزيع.");
        return;
      }
      if (!confirm(`💰 أرباح يوم ${targetDate}: ${netProfit.toLocaleString()} ج.م\n📤 نسبة التوزيع: ${totalPartnerShares}%\n💰 سيتم توزيع ${amountToDistribute.toLocaleString()} ج.م على الشركاء\nهل تريد الاستمرار؟`)) return;

      const existingDistributions = await fetchAPI(`cash_ledger?select=id&date=eq.${targetDate}&type=eq.profit_distribution`);
      if (existingDistributions && existingDistributions.length > 0) {
        alert("⚠️ تم التوزيع مسبقاً.");
        return;
      }

      let distributedSum = 0;
      for (let i = 0; i < activePartners.length; i++) {
        const partner = activePartners[i];
        let share = (amountToDistribute * partner.share_percentage) / totalPartnerShares;
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

      await addNotification('توزيع أرباح', `✅ تم توزيع ${amountToDistribute.toLocaleString()} ج.م`);
      if (toastNotification) {
        toastNotification({
          type: 'success',
          title: '✅ توزيع أرباح',
          message: `تم توزيع ${amountToDistribute.toLocaleString()} ج.م`,
          duration: 5000
        });
      }
      await fetchCashLedger();
      await fetchData();
      alert(`✅ تم التوزيع بنجاح.\n💰 تم توزيع ${amountToDistribute.toLocaleString()} ج.م`);
    } catch (err) {
      console.error(err);
      alert("❌ حدث خطأ أثناء التوزيع");
    }
  };

  const sendDailyReportToPartners = async (targetDate: string) => {
    try {
      const entries = await fetchAPI(`cash_ledger?select=*&date=eq.${targetDate}&order=created_at.desc`);
      if (!entries || entries.length === 0) {
        alert(`⚠️ لا توجد حركات خزنة ليوم ${targetDate}`);
        return false;
      }

      const allBefore = await fetchAPI(`cash_ledger?select=type,amount&date=lt.${targetDate}`);
      let openingBalance = 0;
      (allBefore || []).forEach((entry: any) => {
        if (entry.type === 'income' || entry.type === 'reserve') openingBalance += entry.amount;
        else if (entry.type === 'expense' || entry.type === 'profit_distribution') openingBalance -= entry.amount;
      });

      let totalIncome = 0, totalExpense = 0, totalProfitDist = 0, totalReserve = 0;
      const profitDetails = [];
      for (const entry of entries) {
        if (entry.type === 'income') totalIncome += entry.amount;
        else if (entry.type === 'expense') totalExpense += entry.amount;
        else if (entry.type === 'profit_distribution') {
          totalProfitDist += entry.amount;
          profitDetails.push(`• ${entry.description} : ${entry.amount} ج.م`);
        }
        else if (entry.type === 'reserve') totalReserve += entry.amount;
      }

      const netProfit = totalIncome;
      const closingBalance = openingBalance + totalIncome + totalReserve - totalExpense - totalProfitDist;

      const reportText = `📊 *تقرير الخزنة اليومي* 📊
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 *التاريخ:* ${targetDate}

💰 *رصيد أول اليوم:* ${openingBalance.toLocaleString()} ج.م
💰 *الإيرادات (ربح اليوم):* ${totalIncome.toLocaleString()} ج.م
💸 *المصروفات (تخصم من الرصيد فقط):* ${totalExpense.toLocaleString()} ج.م
📤 *توزيع أرباح الشركاء:* ${totalProfitDist.toLocaleString()} ج.م
🏦 *الرصيد الاحتياطي المضاف:* ${totalReserve.toLocaleString()} ج.م
✅ *صافي الربح الموزع:* ${netProfit.toLocaleString()} ج.م
💰 *رصيد آخر اليوم:* ${closingBalance.toLocaleString()} ج.م

👥 *تفاصيل توزيع الأرباح:*
${profitDetails.length ? profitDetails.join('\n') : 'لا توجد توزيعات'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 للاستفسار: 01278885772
✨ نظام إدارة الصيانة - تقرير يومي`;

      const activePartners = partners.filter(p => p.is_active && p.phone);
      if (activePartners.length === 0) {
        alert("⚠️ لا يوجد شركاء نشطون بأرقام هواتف");
        return false;
      }

      if (!confirm(`📋 التقرير التالي سيتم إرساله للشركاء:\n\n${reportText}\n\nهل تريد المتابعة؟`)) return false;

      for (const partner of activePartners) {
        let phone = partner.phone.toString().replace(/[^\d]/g, '');
        if (phone.startsWith('0')) phone = phone.substring(1);
        if (phone.length === 10) phone = '20' + phone;
        const message = `🔔 *تقرير يومي - شركاء الصيانة*\n\nمرحباً ${partner.name}،\n\n${reportText}`;
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      await addNotification('إرسال تقرير يومي', `تم إرسال تقرير يوم ${targetDate} إلى ${activePartners.length} شريك`);
      if (toastNotification) {
        toastNotification({
          type: 'info',
          title: '📊 تقرير الخزنة',
          message: `تم إرسال التقرير إلى ${activePartners.length} شريك`,
          duration: 4000
        });
      }
      alert(`✅ تم إرسال التقرير إلى ${activePartners.length} شريك.`);
      return true;
    } catch (err) {
      console.error("فشل إرسال التقرير:", err);
      alert("❌ حدث خطأ أثناء إرسال التقرير");
      return false;
    }
  };

  const handleDistributeSelectedProfit = async () => {
    if (!selectedProfitDate) {
      alert("⚠️ يرجى اختيار التاريخ أولاً.");
      return;
    }
    await distributeProfitForDate(selectedProfitDate);
  };

  const handleSendReportForDate = async () => {
    if (!reportDate) {
      alert("⚠️ يرجى اختيار التاريخ أولاً.");
      return;
    }
    await sendDailyReportToPartners(reportDate);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, deletedData, techsData, notificationsData, partnersData, cashData] = await Promise.all([
        fetchAPI('orders?select=*&deleted_at=is.null&order=created_at.desc'),
        fetchAPI('orders?select=*&deleted_at=not.is.null&order=created_at.desc'),
        fetchAPI('technicians?select=*'),
        fetchAPI('notifications?select=*&order=created_at.desc'),
        fetchAPI('partners?select=*&order=created_at.desc'),
        fetchAPI('cash_ledger?select=*&order=date.desc,created_at.desc')
      ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setDeletedOrders(Array.isArray(deletedData) ? deletedData : []);
      setTechnicians(Array.isArray(techsData) ? techsData : []);
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      setPartners(Array.isArray(partnersData) ? partnersData : []);
      setCashLedger(Array.isArray(cashData) ? cashData : []);
      
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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    if (formData.technician) setFormData(prev => calculateAmounts(prev));
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
      if (oldStatus === 'completed' && newStatus !== 'completed' && order.profit_added_to_cash) await deleteOrderProfitFromCash(order);
      await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus, ...extraData }) });
      await addNotification('تغيير حالة أوردر', `🔄 تم تغيير حالة أوردر ${order.customer_name} إلى ${newStatus}`);
      if (newStatus === 'completed' && order.is_paid && !order.profit_added_to_cash) await addCompanyProfitToCash({ ...order, status: newStatus, ...extraData });
      sendWhatsAppToCustomer(order, newStatus);
      fetchData();
      
      if (toastNotification) {
        toastNotification({
          type: 'info',
          title: '🔄 تحديث الحالة',
          message: `تم تغيير حالة أوردر ${order.customer_name} إلى ${newStatus}`,
          duration: 3000
        });
      }
      
      // ✅ إشعار خارجي للمدير باستخدام ID الصحيح 105
      if (newStatus === 'completed' || newStatus === 'in-progress') {
        await sendPushToExternalId("105", `🔄 تحديث حالة`, `تم تغيير حالة أوردر ${order.customer_name} إلى ${newStatus}`);
        if (order.technician) {
          await sendPushToExternalId(`tech_${order.technician}`, `🔧 تحديث`, `تم تغيير حالة أوردر ${order.customer_name} إلى ${newStatus}`);
        }
      }
    } catch (err) { console.error(err); }
  };

  const togglePaidStatus = async (id: number, currentStatus: boolean) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const newPaidStatus = !currentStatus;
    try {
      if (!newPaidStatus && order.status === 'completed' && order.profit_added_to_cash) await deleteOrderProfitFromCash(order);
      await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ is_paid: newPaidStatus }) });
      await addNotification('تحديث حالة الدفع', `✅ تم تحديث حالة تحصيل أوردر ${order.customer_name} إلى ${newPaidStatus ? 'تم التحصيل' : 'لم يتم التحصيل'}`);
      if (newPaidStatus && order.status === 'completed' && !order.profit_added_to_cash) await addCompanyProfitToCash({ ...order, is_paid: true });
      fetchData(); fetchCashLedger();
      
      if (toastNotification) {
        toastNotification({
          type: newPaidStatus ? 'success' : 'warning',
          title: '💰 حالة الدفع',
          message: `${order.customer_name}: ${newPaidStatus ? 'تم التحصيل' : 'لم يتم التحصيل'}`,
          duration: 3000
        });
      }
    } catch (err) { console.error(err); }
  };

  const deleteOrder = async (id: number) => {
    if (!canEditDelete()) return alert("⚠️ ليس لديك صلاحية لحذف الأوردرات");
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const confirmation = prompt(
      `❗ حذف أوردر العميل: ${order.customer_name}\nرقم الأوردر: ${order.order_number}\n\nللتأكيد، اكتب كلمة "حذف" ثم اضغط OK.`
    );
    if (confirmation !== "حذف") {
      alert("❌ تم إلغاء الحذف");
      return;
    }
    try {
      await fetchAPI(`orders?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ deleted_at: new Date().toISOString() })
      });
      await addNotification('حذف أوردر (ناعم)', `تم نقل أوردر ${order.customer_name} (رقم ${order.order_number}) إلى سلة المحذوفات`);
      fetchData();
      
      if (toastNotification) {
        toastNotification({
          type: 'error',
          title: '🗑️ حذف أوردر',
          message: `تم نقل أوردر ${order.customer_name} إلى سلة المحذوفات`,
          duration: 3000
        });
      }
    } catch (err) { console.error(err); }
  };

  const restoreOrder = async (id: number) => {
    if (!canEditDelete()) return alert("⚠️ ليس لديك صلاحية");
    const order = deletedOrders.find(o => o.id === id);
    if (!order) return;
    if (confirm(`استعادة أوردر ${order.customer_name} (${order.order_number})؟`)) {
      try {
        await fetchAPI(`orders?id=eq.${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ deleted_at: null })
        });
        await addNotification('استعادة أوردر', `تم استعادة أوردر ${order.customer_name} (رقم ${order.order_number})`);
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  const copyOrderDetails = (order: any) => {
    const text = `📋 *بيانات الأوردر* 📋\n━━━━━━━━━━━━━━━━━━━━━━\n🔢 *رقم الأوردر:* ${order.order_number}\n👤 *العميل:* ${order.customer_name}\n📞 *الهاتف:* ${order.phone}\n🔧 *الجهاز:* ${order.device_type} - ${order.brand}\n📍 *العنوان:* ${order.address || 'غير محدد'}\n📝 *المشكلة:* ${order.problem_description || 'لا توجد'}\n💰 *المبلغ:* ${order.total_amount} ج.م\n👨‍🔧 *الفني:* ${order.technician || 'غير معين'}\n━━━━━━━━━━━━━━━━━━━━━━`;
    navigator.clipboard.writeText(text);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2000);
    alert("✅ تم نسخ بيانات الأوردر إلى الحافظة");
  };

  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const finalDevice = isOtherDevice ? customDevice : formData.device_type;
    const finalBrand = isOtherBrand ? customBrand : formData.brand;
    const orderToSave = { ...formData, device_type: finalDevice, brand: finalBrand, order_number: editingOrder ? editingOrder.order_number : `MG-${Date.now()}` };
    try {
      if (editingOrder) {
        const oldOrder = orders.find(o => o.id === editingOrder.id);
        if (oldOrder?.status === 'completed' && oldOrder?.is_paid && oldOrder?.profit_added_to_cash) await deleteOrderProfitFromCash(oldOrder);
        await fetchAPI(`orders?id=eq.${editingOrder.id}`, { method: 'PATCH', body: JSON.stringify(orderToSave) });
        await addNotification('تعديل أوردر', `تم تعديل أوردر ${formData.customer_name}`);
        
        if (orderToSave.technician) {
          notifyTechnician(orderToSave.technician, '🔄 تحديث في الأوردر', `تم تحديث بيانات الأوردر الخاص بالعميل: ${formData.customer_name}`);
        }
        
        if (orderToSave.status === 'completed' && orderToSave.is_paid && !orderToSave.profit_added_to_cash) await addCompanyProfitToCash({ ...orderToSave, id: editingOrder.id });
        alert("✅ تم تعديل الأوردر بنجاح");
      } else {
        await fetchAPI('orders', { method: 'POST', body: JSON.stringify(orderToSave) });
        await addNotification('إضافة أوردر', `تم إضافة أوردر جديد للعميل ${formData.customer_name}`);
        
        if (orderToSave.technician) {
          notifyTechnician(orderToSave.technician, '📢 أوردر جديد محول إليك', `تم تعيين أوردر جديد لك للعميل: ${formData.customer_name} في ${formData.address}`);
        }
        
        alert("✅ تم إضافة الأوردر بنجاح");
        sendWhatsAppToCustomerOnCreate(orderToSave);
        
        // ✅ إشعار خارجي للمدير باستخدام ID الصحيح 105
        await sendPushToExternalId("105", '📋 أوردر جديد', `تم إضافة أوردر جديد للعميل ${formData.customer_name}`);
        if (orderToSave.technician) {
          await sendPushToExternalId(`tech_${orderToSave.technician}`, '🔧 أوردر جديد', `تم تعيين أوردر جديد لك: ${formData.customer_name}`);
        }
      }
      setShowOrderModal(false); setEditingOrder(null);
      setFormData({ customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '', status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false, date: new Date().toLocaleDateString("ar-EG") });
      setIsOtherDevice(false); setIsOtherBrand(false); setCustomDevice(''); setCustomBrand('');
      fetchData();
    } catch (err) { console.error(err); alert("❌ حدث خطأ أثناء حفظ الأوردر"); } finally { setIsSubmitting(false); }
  };

  const updateAllPendingOrdersProfit = async (technicianName: string, newPercentage: number) => {
    if (!canEditDelete()) return alert("⚠️ ليس لديك صلاحية");
    if (!confirm(`هل تريد تحديث نسب الأرباح لجميع الأوردرات غير المكتملة للفني "${technicianName}" إلى ${newPercentage}%؟`)) return;
    const pendingOrders = orders.filter(o => o.technician === technicianName && o.status !== 'completed');
    if (pendingOrders.length === 0) { alert("لا توجد أوردرات غير مكتملة لهذا الفني."); return; }
    let updatedCount = 0;
    for (const order of pendingOrders) {
      const net = order.net_amount;
      const newTechnicianShare = Math.round((net * newPercentage) / 100);
      const newCompanyShare = net - newTechnicianShare;
      await fetchAPI(`orders?id=eq.${order.id}`, { method: 'PATCH', body: JSON.stringify({ technician_share: newTechnicianShare, company_share: newCompanyShare }) });
      updatedCount++;
    }
    await addNotification('تحديث نسب أرباح الفني', `تم تحديث نسب أرباح ${updatedCount} أوردر للفني ${technicianName} إلى ${newPercentage}%`);
    fetchData();
    alert(`✅ تم تحديث ${updatedCount} أوردر بنجاح.`);
  };

  const saveTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditDelete()) return alert("⚠️ ليس لديك صلاحية");
    const oldTech = editingTech ? technicians.find(t => t.id === editingTech.id) : null;
    const percentageChanged = oldTech && oldTech.profit_percentage !== techForm.profit_percentage;
    try {
      if (editingTech) {
        await fetchAPI(`technicians?id=eq.${editingTech.id}`, { method: 'PATCH', body: JSON.stringify({ ...techForm, profit_percentage: techForm.profit_percentage }) });
        await addNotification('تعديل فني', `تم تعديل بيانات الفني ${techForm.name}`);
        if (percentageChanged && confirm(`هل تريد تحديث الأوردرات غير المكتملة للفني "${techForm.name}" لتطبيق النسبة الجديدة (${techForm.profit_percentage}%)؟`)) await updateAllPendingOrdersProfit(techForm.name, techForm.profit_percentage);
      } else {
        await fetchAPI('technicians', { method: 'POST', body: JSON.stringify({ ...techForm, profit_percentage: techForm.profit_percentage }) });
        await addNotification('إضافة فني', `تم إضافة فني جديد: ${techForm.name}`);
      }
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
      fetchData();
    }
  };

  const toggleTechnicianActive = async (tech: any) => {
    if (!canEditDelete()) return alert("⚠️ ليس لديك صلاحية");
    await fetchAPI(`technicians?id=eq.${tech.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !tech.is_active }) });
    await addNotification('تغيير حالة فني', `تم ${!tech.is_active ? 'تفعيل' : 'تعطيل'} الفني ${tech.name}`);
    fetchData();
  };

  const copyTechLink = async (tech: any) => {
    const loginUrl = `${window.location.origin}/login`;
    const message = `🔧 *بيانات دخول بوابة الفنيين* 🔧\n━━━━━━━━━━━━━━━━━━━━━━\n👤 *الفني:* ${tech.name}\n🔗 *رابط الدخول:* ${loginUrl}\n👤 *اسم المستخدم:* ${tech.username || tech.name}\n🔑 *كلمة المرور:* ${tech.password}\n━━━━━━━━━━━━━━━━━━━━━━\n\n📝 *شرح الاستخدام:*\n1️⃣ اضغط على رابط الدخول أعلاه.\n2️⃣ اختر دور "🔧 الفني (Technician)".\n3️⃣ أدخل اسم المستخدم وكلمة المرور الخاصة بك.\n4️⃣ ستظهر لك الأوردرات الموكلة إليك.\n5️⃣ يمكنك:\n   • الاتصال بالعميل\n   • بدء العمل\n   • تصفية الأوردر بعد الإكمال\n   • كشف بقيمة، تأجيل، إلغاء، أو إضافة تعليق\n\nشكراً لتعاونك. 🌟`;
    await navigator.clipboard.writeText(message);
    setCopiedId(tech.id);
    setTimeout(() => setCopiedId(null), 3000);
    alert("✅ تم نسخ بيانات الدخول والشرح بنجاح!");
  };

  const printAndSendInvoice = async (order: any) => {
    const parts = prompt("✏️ قطع الغيار المستخدمة", "لا توجد") || "لا توجد";
    const warranty = prompt("🛡️ فترة الضمان", "6 أشهر") || "6 أشهر";
    if (!order.phone) return alert("❌ رقم الهاتف غير موجود");
    
    await fetchAPI(`orders?id=eq.${order.id}`, { method: 'PATCH', body: JSON.stringify({ invoice_approved: true, warranty_period: warranty, parts_used: parts, invoice_date: new Date().toISOString().split('T')[0] }) });
    await addNotification('اعتماد فاتورة', `تم اعتماد فاتورة ${order.customer_name} مع ضمان ${warranty}`);
    window.open(`/invoice?id=${order.id}`, '_blank');
    invoiceService.sendInvoiceViaWhatsApp({
      id: order.id.toString(), orderNumber: order.order_number, customerName: order.customer_name, phone: order.phone,
      device: order.device_type, brand: order.brand, problem: order.problem_description || 'غير محددة',
      totalAmount: order.total_amount, warranty: warranty, date: new Date().toLocaleDateString('ar-EG'),
      address: order.address, partsUsed: parts, technicianName: order.technician
    });
    // ✅ إشعار خارجي باستخدام ID الصحيح 105
    await sendPushToExternalId("105", '📄 فاتورة معتمدة', `تم اعتماد فاتورة للعميل ${order.customer_name}`);
    alert("✅ تم اعتماد الفاتورة وإرسالها للعميل");
    fetchData();
  };

  const deleteNotification = async (id: number) => { await fetchAPI(`notifications?id=eq.${id}`, { method: 'DELETE' }); fetchNotifications(); };
  const deleteAllNotifications = async () => { if (confirm('حذف كل الإشعارات؟')) { for (const n of notifications) await fetchAPI(`notifications?id=eq.${n.id}`, { method: 'DELETE' }); fetchNotifications(); } };
  const clearFilters = () => { setSearchTerm(''); setFilterStatus('all'); setFilterTechnician(''); setFilterDeviceType(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterDelay('all'); };

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
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3"><LayoutDashboard className="w-6 h-6 text-orange-500" /><div><h1 className="text-lg font-bold text-white">لوحة تحكم المدير</h1><p className="text-xs text-slate-400">{currentUser?.name || 'مدير النظام'}</p></div></div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"><LogOut className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex gap-2 p-4 border-b bg-slate-900 overflow-x-auto">
        <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'orders' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>📋 الأوردرات</button>
        <button onClick={() => setActiveTab('technicians')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'technicians' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>👨‍🔧 الفنيين</button>
        <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'reports' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>📊 التقارير</button>
        <button onClick={() => setActiveTab('invoicesReview')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'invoicesReview' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>📄 الفواتير</button>
        <button onClick={() => setActiveTab('cash')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'cash' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>💰 الخزنة</button>
        <button onClick={() => setActiveTab('partners')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'partners' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>🤝 الشركاء</button>
        <button onClick={() => setActiveTab('notifications')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition ${activeTab === 'notifications' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}><Bell className="w-4 h-4" /> الإشعارات ({notifications.length})</button>
        {userRole === 'admin' && <button onClick={() => setActiveTab('permissions')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'permissions' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>🔐 الصلاحيات</button>}
        <button onClick={() => setActiveTab('performance')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'performance' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>📊 أداء الفنيين</button>

        {/* أزرار الاختبار والإشعارات - الآن تستخدم 105 */}
        <button onClick={async () => { await window.OneSignal?.showSlidedown(); alert("افتح النافذة واسمح"); }} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm">🔔 تفعيل</button>
        <button onClick={async () => { 
          const externalId = "105";
          await sendPushToExternalId(externalId, "🔥 اختبار مباشر", "هذه رسالة من التطبيق");
          alert(`تم إرسال الإشعار إلى ${externalId}`);
        }} className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm">🔥 اختبار نهائي</button>
        <button onClick={async () => { const id = await window.OneSignal?.getExternalUserId(); alert(`External ID: ${id || "غير مسجل"}`); }} className="bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm">🆔 معرفي</button>
        <button onClick={() => { if (toastNotification) toastNotification({ type: 'success', title: 'Toast', message: 'يعمل', duration: 3000 }); else alert('غير متوفر'); }} className="bg-teal-600 text-white px-3 py-2 rounded-lg text-sm">📢 Toast</button>
      </div>

      <div className="p-4">
        {/* باقي محتوى الصفحة (الأوردرات، الفنيين، التقارير، الخزنة، المودالات) - اتركه كما هو دون تغيير */}
      </div>
    </div>
  );
}
