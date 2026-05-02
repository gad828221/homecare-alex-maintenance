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
import { invoiceService } from '../services/invoiceService';
import { notifyAdmin, notifyTechnician, sendWhatsApp } from '../lib/whatsapp';

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

  // ========== STATE للتقارير ==========
  const [reportType, setReportType] = useState<'cash' | 'pending_orders' | 'cancelled_orders' | 'tech_performance' | 'profits' | 'expenses' | 'comparison'>('cash');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportColumns, setReportColumns] = useState<string[]>([]);
  const [filterTechnicianReport, setFilterTechnicianReport] = useState<string>('');

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

  // ========== دوال جلب البيانات (معدلة لتجنب التعليق) ==========
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      console.log("بدء جلب البيانات لـ ProtectedOrders...");
      
      // جلب البيانات بشكل متوازٍ مع معالجة الأخطاء
      const results = await Promise.allSettled([
        fetchAPI('orders?select=*&deleted_at=is.null&order=created_at.desc'),
        fetchAPI('orders?select=*&deleted_at=not.is.null&order=created_at.desc'),
        fetchAPI('technicians?select=*'),
        fetchAPI('notifications?select=*&order=created_at.desc'),
        fetchAPI('partners?select=*&order=created_at.desc'),
        fetchAPI('cash_ledger?select=*&order=date.desc,created_at.desc')
      ]);
      
      // معالجة النتائج (فقط الناجحة منها)
      const ordersData = results[0].status === 'fulfilled' ? results[0].value : [];
      const deletedData = results[1].status === 'fulfilled' ? results[1].value : [];
      const techsData = results[2].status === 'fulfilled' ? results[2].value : [];
      const notificationsData = results[3].status === 'fulfilled' ? results[3].value : [];
      const partnersData = results[4].status === 'fulfilled' ? results[4].value : [];
      const cashData = results[5].status === 'fulfilled' ? results[5].value : [];
      
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
      
      console.log("✅ جلب البيانات اكتمل بنجاح");
    } catch (err) {
      console.error("❌ خطأ في fetchData:", err);
      // عدم إعادة طرح الخطأ لمنع تعليق التطبيق
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // باقي الدوال (حساب المبالغ، التصفية، إلخ) موجودة كما هي
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
      
      // إشعار واتساب للمدير
      const statusAr = newStatus === 'completed' ? 'تم التنفيذ ✅' : 
                       newStatus === 'cancelled' ? 'ملغي ❌' : 
                       newStatus === 'in-progress' ? 'قيد التنفيذ 🔧' : 
                       newStatus === 'inspected' ? 'تم الكشف 💰' : 
                       newStatus === 'deferred' ? 'مؤجل ⏰' : newStatus;
      const adminMsg = `📦 *تحديث حالة أوردر* 📦\n\n👤 العميل: ${order.customer_name}\n🔄 الحالة الجديدة: ${statusAr}\n🔢 رقم الأوردر: ${order.order_number}`;
      notifyAdmin(adminMsg);
      
      if (order.technician && (newStatus === 'in-progress' || newStatus === 'completed')) {
        const tech = technicians.find(t => t.name === order.technician);
        if (tech && tech.phone) {
          const techMsg = `🔧 *تحديث في أوردرك* 🔧\n\nالعميل: ${order.customer_name}\nالحالة: ${statusAr}\nرقم الأوردر: ${order.order_number}`;
          sendWhatsApp(tech.phone, techMsg);
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
          const tech = technicians.find(t => t.name === orderToSave.technician);
          if (tech && tech.phone) {
            const techMsg = `تم تحديث بيانات الأوردر الخاص بالعميل: ${formData.customer_name}\nالجهاز: ${finalDeviceType}\nالعنوان: ${formData.address}`;
            notifyTechnician(tech.phone, tech.name, techMsg);
          }
        }
        
        if (orderToSave.status === 'completed' && orderToSave.is_paid && !orderToSave.profit_added_to_cash) await addCompanyProfitToCash({ ...orderToSave, id: editingOrder.id });
        alert("✅ تم تعديل الأوردر بنجاح");
      } else {
        await fetchAPI('orders', { method: 'POST', body: JSON.stringify(orderToSave) });
        await addNotification('إضافة أوردر', `تم إضافة أوردر جديد للعميل ${formData.customer_name}`);
        
        const adminMsg = `🆕 *أوردر جديد* 🆕\n\n👤 العميل: ${formData.customer_name}\n📞 الهاتف: ${formData.phone}\n🔧 الجهاز: ${finalDeviceType} - ${finalBrand}\n📍 العنوان: ${formData.address}\n👨‍🔧 الفني: ${orderToSave.technician || 'غير معين'}\n🔢 رقم الأوردر: ${orderToSave.order_number}\n📝 المشكلة: ${formData.problem_description || 'بدون'}`;
        notifyAdmin(adminMsg);
        
        if (orderToSave.technician) {
          const tech = technicians.find(t => t.name === orderToSave.technician);
          if (tech && tech.phone) {
            const techMsg = `العميل: ${formData.customer_name}\nالجهاز: ${finalDeviceType}\nالعنوان: ${formData.address}\nرقم الأوردر: ${orderToSave.order_number}`;
            notifyTechnician(tech.phone, tech.name, techMsg);
          }
        }
        
        alert("✅ تم إضافة الأوردر بنجاح");
        sendWhatsAppToCustomerOnCreate(orderToSave);
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

  // ========== دوال التقارير (مثل السابق) ==========
  const fetchCashReport = async () => {
    setReportLoading(true);
    try {
      const { data, error } = await supabase
        .from('cash_ledger')
        .select('date, type, amount, description')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });
      if (error) throw error;
      setReportColumns(['التاريخ', 'النوع', 'المبلغ (ج.م)', 'الوصف']);
      setReportData(data || []);
    } catch (err) {
      console.error(err);
      alert('فشل تحميل التقرير');
    } finally {
      setReportLoading(false);
    }
  };

  const fetchPendingOrdersReport = async () => {
    setReportLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('order_number, customer_name, phone, device_type, brand, technician, status, created_at')
        .in('status', ['pending', 'in-progress'])
        .order('created_at', { ascending: true });
        
      if (filterTechnicianReport) {
        query = query.eq('technician', filterTechnicianReport);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const testKeywords = ['اختبار', 'test', 'تجربة', 'jj', 'nn', 'hh', 'rr', 'zz', '00', '000', 
                            'زسةس', 'ويوي', 'تلل', 'أختي', 'جاى', 'gytt', 'ممظم', 'زءووي', 'حذف', 
                            'تجربه', 'زسوزي', 'وسووي', 'gff', 'gggg', 'jzjz', 'nznz'];
      const filteredData = (data || []).filter(order => {
        const customer = (order.customer_name || '').toLowerCase();
        const phone = (order.phone || '').toLowerCase();
        const device = (order.device_type || '').toLowerCase();
        const brand = (order.brand || '').toLowerCase();
        return !testKeywords.some(keyword => 
          customer.includes(keyword) || 
          phone.includes(keyword) || 
          device.includes(keyword) || 
          brand.includes(keyword)
        );
      });
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      
      const dateFiltered = filteredData.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= start && orderDate <= end;
      });
      
      const finalData = dateFiltered.filter(order => {
        const diffDays = Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 3;
      });
      
      setReportColumns(['رقم الأوردر', 'العميل', 'الهاتف', 'الجهاز', 'الماركة', 'الفني', 'الحالة', 'التاريخ']);
      setReportData(finalData.map(order => ({
        ...order,
        date: order.created_at.split('T')[0]
      })));
    } catch (err) {
      console.error(err);
      alert('فشل تحميل التقرير');
    } finally {
      setReportLoading(false);
    }
  };

  const fetchCancelledOrdersReport = async () => {
    setReportLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('order_number, customer_name, phone, device_type, brand, technician, technician_note, created_at')
        .eq('status', 'cancelled')
        .order('created_at', { ascending: false });
        
      if (filterTechnicianReport) {
        query = query.eq('technician', filterTechnicianReport);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      
      const filtered = (data || []).filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= start && orderDate <= end;
      });
      
      setReportColumns(['رقم الأوردر', 'العميل', 'الهاتف', 'الجهاز', 'الماركة', 'الفني', 'سبب الإلغاء', 'التاريخ']);
      setReportData(filtered.map(order => ({
        ...order,
        date: order.created_at.split('T')[0]
      })));
    } catch (err) {
      console.error(err);
      alert('فشل تحميل التقرير');
    } finally {
      setReportLoading(false);
    }
  };

  const fetchTechPerformanceReport = async () => {
    setReportLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('technician, status, created_at, completed_at')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .not('technician', 'is', null);
      if (error) throw error;
      const techMap = new Map();
      (data || []).forEach(order => {
        const tech = order.technician;
        if (!techMap.has(tech)) {
          techMap.set(tech, { total: 0, completed: 0, cancelled: 0, totalHours: 0 });
        }
        const rec = techMap.get(tech);
        rec.total++;
        if (order.status === 'completed') rec.completed++;
        if (order.status === 'cancelled') rec.cancelled++;
        if (order.status === 'completed' && order.completed_at && order.created_at) {
          const created = new Date(order.created_at);
          const completed = new Date(order.completed_at);
          const hours = (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
          rec.totalHours += hours;
        }
      });
      const report = Array.from(techMap.entries()).map(([technician, stats]) => ({
        technician,
        total_orders: stats.total,
        completed: stats.completed,
        cancelled: stats.cancelled,
        avg_hours: stats.completed > 0 ? (stats.totalHours / stats.completed).toFixed(1) : '-'
      }));
      setReportColumns(['الفني', 'إجمالي الأوردرات', 'مكتمل', 'ملغي', 'متوسط الوقت (ساعات)']);
      setReportData(report);
    } catch (err) {
      console.error(err);
      alert('فشل تحميل التقرير');
    } finally {
      setReportLoading(false);
    }
  };

  const fetchProfitsReport = async () => {
    setReportLoading(true);
    try {
      const { data, error } = await supabase
        .from('cash_ledger')
        .select('description, amount, date')
        .eq('type', 'profit_distribution')
        .gte('date', startDate)
        .lte('date', endDate);
      if (error) throw error;
      
      const partnerMap = new Map();
      (data || []).forEach(item => {
        const match = item.description.match(/توزيع أرباح: ([^(]+)/);
        if (match) {
          const partnerName = match[1].trim();
          partnerMap.set(partnerName, (partnerMap.get(partnerName) || 0) + item.amount);
        }
      });
      const report = Array.from(partnerMap.entries()).map(([name, total]) => ({ name, total }));
      setReportColumns(['الشريك', 'إجمالي الأرباح (ج.م)']);
      setReportData(report);
    } catch (err) {
      console.error(err);
      alert('فشل تحميل تقرير الأرباح');
    } finally {
      setReportLoading(false);
    }
  };

  const fetchExpensesReport = async () => {
    setReportLoading(true);
    try {
      const { data, error } = await supabase
        .from('cash_ledger')
        .select('description, amount, date')
        .eq('type', 'expense')
        .gte('date', startDate)
        .lte('date', endDate);
      if (error) throw error;
      setReportColumns(['التاريخ', 'الوصف', 'المبلغ (ج.م)']);
      setReportData(data || []);
    } catch (err) {
      console.error(err);
      alert('فشل تحميل تقرير المصروفات');
    } finally {
      setReportLoading(false);
    }
  };

  const fetchComparisonReport = async () => {
    setReportLoading(true);
    try {
      const { data: incomeData, error: incomeError } = await supabase
        .from('cash_ledger')
        .select('amount')
        .eq('type', 'income')
        .gte('date', startDate)
        .lte('date', endDate);
      if (incomeError) throw incomeError;
      const totalIncome = (incomeData || []).reduce((sum, i) => sum + i.amount, 0);
      
      const { data: expenseData, error: expenseError } = await supabase
        .from('cash_ledger')
        .select('amount')
        .eq('type', 'expense')
        .gte('date', startDate)
        .lte('date', endDate);
      if (expenseError) throw expenseError;
      const totalExpense = (expenseData || []).reduce((sum, e) => sum + e.amount, 0);
      
      const { data: profitDistData, error: profitError } = await supabase
        .from('cash_ledger')
        .select('amount')
        .eq('type', 'profit_distribution')
        .gte('date', startDate)
        .lte('date', endDate);
      if (profitError) throw profitError;
      const totalProfitDist = (profitDistData || []).reduce((sum, p) => sum + p.amount, 0);
      
      const netProfit = totalIncome - totalExpense - totalProfitDist;
      
      setReportData([{
        الإيرادات: totalIncome,
        المصروفات: totalExpense,
        توزيع_الأرباح: totalProfitDist,
        صافي_الربح: netProfit
      }]);
      setReportColumns(['الإيرادات (ج.م)', 'المصروفات (ج.م)', 'توزيع الأرباح (ج.م)', 'صافي الربح (ج.م)']);
    } catch (err) {
      console.error(err);
      alert('فشل تحميل تقرير المقارنة');
    } finally {
      setReportLoading(false);
    }
  };

  const generateReport = () => {
    if (!startDate || !endDate) {
      alert('يرجى اختيار تاريخ البداية والنهاية');
      return;
    }
    switch (reportType) {
      case 'cash': fetchCashReport(); break;
      case 'pending_orders': fetchPendingOrdersReport(); break;
      case 'cancelled_orders': fetchCancelledOrdersReport(); break;
      case 'tech_performance': fetchTechPerformanceReport(); break;
      case 'profits': fetchProfitsReport(); break;
      case 'expenses': fetchExpensesReport(); break;
      case 'comparison': fetchComparisonReport(); break;
      default: break;
    }
  };

  const exportToCSV = () => {
    if (!reportData.length) {
      alert('لا توجد بيانات للتصدير');
      return;
    }
    const headers = reportColumns.join(',');
    const rows = reportData.map(row => {
      return reportColumns.map(col => {
        let value = '';
        if (col === 'التاريخ') value = row.date || '';
        else if (col === 'النوع') value = row.type === 'income' ? 'دخل' : row.type === 'expense' ? 'مصروف' : row.type === 'profit_distribution' ? 'توزيع أرباح' : row.type || '';
        else if (col === 'المبلغ (ج.م)') value = row.amount || '';
        else if (col === 'الوصف') value = row.description || '';
        else if (col === 'رقم الأوردر') value = row.order_number || '';
        else if (col === 'العميل') value = row.customer_name || '';
        else if (col === 'الهاتف') value = row.phone || '';
        else if (col === 'الجهاز') value = row.device_type || '';
        else if (col === 'الماركة') value = row.brand || '';
        else if (col === 'الفني') value = row.technician || '';
        else if (col === 'الحالة') value = row.status || '';
        else if (col === 'سبب الإلغاء') value = row.technician_note || '';
        else if (col === 'الشريك') value = row.name || '';
        else if (col === 'إجمالي الأرباح (ج.م)') value = row.total || '';
        else if (col === 'الإيرادات (ج.م)') value = row.الإيرادات || '';
        else if (col === 'المصروفات (ج.م)') value = row.المصروفات || '';
        else if (col === 'توزيع الأرباح (ج.م)') value = row.توزيع_الأرباح || '';
        else if (col === 'صافي الربح (ج.م)') value = row.صافي_الربح || '';
        else if (col === 'إجمالي الأوردرات') value = row.total_orders || '';
        else if (col === 'مكتمل') value = row.completed || '';
        else if (col === 'ملغي') value = row.cancelled || '';
        else if (col === 'متوسط الوقت (ساعات)') value = row.avg_hours || '';
        else value = '';
        return `"${value}"`;
      }).join(',');
    }).join('\n');
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `تقرير_${reportType}_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

        <button onClick={() => { if (toastNotification) toastNotification({ type: 'success', title: 'Toast', message: 'يعمل', duration: 3000 }); else alert('غير متوفر'); }} className="bg-teal-600 text-white px-3 py-2 rounded-lg text-sm">📢 Toast</button>
      </div>

      <div className="p-4">
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-xl p-4 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><input type="text" placeholder="بحث..." className="w-full pr-10 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} /></div>
              <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                <option value="all">الكل</option>
                <option value="pending">قيد الانتظار</option>
                <option value="in-progress">قيد التنفيذ</option>
                <option value="inspected">تم الكشف</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
                <option value="deferred">مؤجل</option>
              </select>
              <select value={filterTechnician} onChange={e=>setFilterTechnician(e.target.value)} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"><option value="">جميع الفنيين</option>{technicians.map(t=><option key={t.id} value={t.name}>{t.name}</option>)}</select>
              <select value={filterDeviceType} onChange={e=>setFilterDeviceType(e.target.value)} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"><option value="">جميع الأجهزة</option>{DEVICE_TYPES.map(d=><option key={d}>{d}</option>)}</select>
              <input type="date" value={filterDateFrom} onChange={e=>setFilterDateFrom(e.target.value)} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white" />
              <input type="date" value={filterDateTo} onChange={e=>setFilterDateTo(e.target.value)} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white" />
              <button onClick={()=>setFilterDelay(filterDelay==='delayed'?'all':'delayed')} className={`px-3 py-2 rounded-lg text-sm ${filterDelay==='delayed'?'bg-red-600 text-white':'bg-slate-800 text-slate-300'}`}>⚠️ المتأخرة فقط</button>
              <button onClick={clearFilters} className="bg-slate-800 text-slate-300 px-3 py-2 rounded-lg text-sm">مسح الكل</button>
              <button onClick={()=>setShowAllOrders(!showAllOrders)} className={`px-3 py-2 rounded-lg text-sm transition ${showAllOrders ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{showAllOrders ? '📋 إخفاء المنجز' : '📋 عرض الكل'}</button>
              <button onClick={()=>{setEditingOrder(null); setFormData({ customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '', status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false, date: new Date().toLocaleDateString("ar-EG") }); setShowOrderModal(true);}} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> أوردر جديد</button>
              <button onClick={()=>setShowDeleted(!showDeleted)} className={`px-3 py-2 rounded-lg text-sm transition ${showDeleted ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}><Trash2 size={16} /> {showDeleted ? 'إخفاء المحذوفة' : `عرض المحذوفة (${deletedOrders.length})`}</button>
              <button onClick={fetchData} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg"><RefreshCw size={18} /></button>
            </div>
            
            {!showDeleted && filteredOrders.length === 0 && !showAllOrders && <div className="text-center py-8 text-slate-400">لا توجد أوردرات (قيد الانتظار، قيد التنفيذ، أو بدون فني). اضغط "عرض الكل" لمشاهدة جميع الأوردرات.</div>}
            
            {!showDeleted && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map(order => {
                  const delayed = isDelayed(order);
                  return (
                    <div key={order.id} className={`bg-slate-900 rounded-xl border-r-4 p-4 ${delayed ? 'border-red-500' : order.status === 'completed' ? 'border-green-500' : order.status === 'in-progress' ? 'border-blue-500' : order.status === 'deferred' ? 'border-purple-500' : 'border-yellow-500'}`}>
                      <div className="flex justify-between items-start">
                        <div><h3 className="font-bold text-white">{order.customer_name}</h3><p className="text-xs text-slate-400">رقم: {order.order_number}</p></div>
                        <div className="flex gap-1"><button onClick={()=>togglePaidStatus(order.id, order.is_paid)} className={`p-1 rounded ${order.is_paid ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>{order.is_paid ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}</button>{canEditDelete() && <><button onClick={()=>{setEditingOrder(order); setFormData(order); setShowOrderModal(true);}} className="p-1 text-blue-500"><Edit size={16}/></button><button onClick={() => copyOrderDetails(order)} className="p-1 text-slate-400" title="نسخ البيانات"><Copy size={16}/></button><button onClick={() => deleteOrder(order.id)} className="p-1 text-red-500"><Trash2 size={16}/></button></>}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 mt-2 text-sm">
                        <div className="text-slate-300">📞 {order.phone}</div>
                        <div className="text-slate-300">🔧 {order.device_type} - {order.brand}</div>
                        <div className="col-span-2 text-slate-300">📍 {order.address}</div>
                        <div className="col-span-2 text-slate-300">📝 {order.problem_description}</div>
                        <div className="text-slate-300">💰 {order.total_amount} ج.م</div>
                        <div className="text-slate-300">👨‍🔧 {order.technician || '-'}</div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <select value={order.status} onChange={e=>updateOrderStatus(order.id, e.target.value)} className="text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white">
                          <option value="pending">قيد الانتظار</option>
                          <option value="in-progress">قيد التنفيذ</option>
                          <option value="inspected">تم الكشف</option>
                          <option value="completed">مكتمل</option>
                          <option value="cancelled">ملغي</option>
                          <option value="deferred">مؤجل</option>
                        </select>
                        <span className={`text-xs px-2 py-1 rounded ${order.is_paid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{order.is_paid ? 'تم التحصيل' : 'لم يتحصل'}</span>
                      </div>
                      {order.technician_note && (
                        <div className="mt-2 text-xs text-slate-400">📝 ملاحظة الفني: {order.technician_note}</div>
                      )}
                      {order.status === 'in-progress' && canEditDelete() && (<button onClick={() => { setSelectedOrder(order); setSettleForm({ total_amount: order.total_amount || 0, parts_cost: order.parts_cost || 0, transport_cost: order.transport_cost || 0, net_amount: order.net_amount || 0, technician_share: order.technician_share || 0, company_share: order.company_share || 0 }); setShowSettleModal(true); }} className="mt-2 w-full bg-orange-600 hover:bg-orange-700 text-white py-1 rounded-lg text-sm font-bold">تصفية الأوردر</button>)}
                      {order.status === 'completed' && (
                        <button onClick={() => window.open(`/invoice?id=${order.id}`, '_blank')} className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-1 rounded-lg text-sm font-bold">📄 عرض الفاتورة</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {showDeleted && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deletedOrders.length === 0 && <div className="col-span-full text-center py-8 text-slate-400">لا توجد أوردرات محذوفة</div>}
                {deletedOrders.map(order => (
                  <div key={order.id} className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 opacity-70">
                    <div className="flex justify-between items-start">
                      <div><h3 className="font-bold text-white">{order.customer_name}</h3><p className="text-xs text-slate-400">رقم: {order.order_number}</p><p className="text-xs text-red-400">🗑️ محذوف في {new Date(order.deleted_at).toLocaleDateString('ar-EG')}</p></div>
                      {canEditDelete() && <button onClick={() => restoreOrder(order.id)} className="p-1 text-green-500 hover:text-green-400" title="استعادة"><RotateCcw size={16} /></button>}
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-2 text-sm"><div className="text-slate-300">📞 {order.phone}</div><div className="text-slate-300">🔧 {order.device_type} - {order.brand}</div><div className="col-span-2 text-slate-300">📍 {order.address}</div><div className="col-span-2 text-slate-300">📝 {order.problem_description}</div><div className="text-slate-300">💰 {order.total_amount} ج.م</div><div className="text-slate-300">👨‍🔧 {order.technician || '-'}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'technicians' && (
          <div className="bg-slate-900 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <button onClick={()=>setFilterTechStatus('active')} className={`px-3 py-1 rounded-full text-sm ${filterTechStatus==='active'?'bg-orange-600 text-white':'bg-slate-800 text-slate-300'}`}>النشطون</button>
                <button onClick={()=>setFilterTechStatus('inactive')} className={`px-3 py-1 rounded-full text-sm ${filterTechStatus==='inactive'?'bg-orange-600 text-white':'bg-slate-800 text-slate-300'}`}>غير النشطون</button>
                <button onClick={()=>setFilterTechStatus('all')} className={`px-3 py-1 rounded-full text-sm ${filterTechStatus==='all'?'bg-orange-600 text-white':'bg-slate-800 text-slate-300'}`}>الجميع</button>
              </div>
              {canEditDelete() && <button onClick={()=>{setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true, username: '', password: '', profit_percentage: 50 }); setShowTechModal(true);}} className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18}/> إضافة فني</button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTechnicians.map(tech => (
                <div key={tech.id} className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3"><Users className="w-8 h-8 text-orange-500" /></div>
                  <h3 className="font-bold text-white">{tech.name}</h3>
                  <p className="text-xs text-slate-400">{tech.specialization}</p>
                  <p className="text-xs text-slate-400 mt-1">نسبة الأرباح: {tech.profit_percentage ?? 50}%</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => copyTechLink(tech)} className="flex-1 bg-slate-700 text-slate-300 py-1 rounded text-xs flex items-center justify-center gap-1">
                      {copiedId === tech.id ? <Check size={14}/> : <Copy size={14}/>} نسخ
                    </button>
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

        {activeTab === 'reports' && (
          <div className="bg-slate-900 rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm text-slate-400 mb-1">نوع التقرير</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="cash">الخزنة</option>
                  <option value="pending_orders">أوردرات غير منفذة (متأخرة)</option>
                  <option value="cancelled_orders">أوردرات ملغية</option>
                  <option value="tech_performance">أداء الفنيين</option>
                  <option value="profits">💰 أرباح الشركاء</option>
                  <option value="expenses">💸 المصروفات</option>
                  <option value="comparison">📊 مقارنة (إيرادات / مصروفات / أرباح)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">من تاريخ</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">إلى تاريخ</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">الفني</label>
                <select
                  value={filterTechnicianReport}
                  onChange={(e) => setFilterTechnicianReport(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-white min-w-[150px]"
                >
                  <option value="">الكل</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.name}>{tech.name}</option>
                  ))}
                </select>
              </div>
              <button onClick={generateReport} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold">عرض التقرير</button>
              <button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold">📎 تصدير CSV</button>
            </div>
            {reportLoading && <div className="text-center py-8 text-slate-400">جاري تحميل البيانات...</div>}
            {!reportLoading && reportData.length === 0 && <div className="text-center py-8 text-slate-400">لا توجد بيانات للفترة المحددة</div>}
            {!reportLoading && reportData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-800">
                    <tr>
                      {reportColumns.map((col, idx) => (
                        <th key={idx} className="p-3 text-right border border-slate-700">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-800">
                        {reportColumns.map((col, colIdx) => {
                          let val = '';
                          if (col === 'التاريخ') val = row.date || '';
                          else if (col === 'النوع') val = row.type === 'income' ? 'دخل' : row.type === 'expense' ? 'مصروف' : row.type === 'profit_distribution' ? 'توزيع أرباح' : row.type || '';
                          else if (col === 'المبلغ (ج.م)') val = row.amount || '';
                          else if (col === 'الوصف') val = row.description || '';
                          else if (col === 'رقم الأوردر') val = row.order_number || '';
                          else if (col === 'العميل') val = row.customer_name || '';
                          else if (col === 'الهاتف') val = row.phone || '';
                          else if (col === 'الجهاز') val = row.device_type || '';
                          else if (col === 'الماركة') val = row.brand || '';
                          else if (col === 'الفني') val = row.technician || '';
                          else if (col === 'الحالة') val = row.status || '';
                          else if (col === 'سبب الإلغاء') val = row.technician_note || '';
                          else if (col === 'الشريك') val = row.name || '';
                          else if (col === 'إجمالي الأرباح (ج.م)') val = row.total || '';
                          else if (col === 'الإيرادات (ج.م)') val = row.الإيرادات || '';
                          else if (col === 'المصروفات (ج.م)') val = row.المصروفات || '';
                          else if (col === 'توزيع الأرباح (ج.م)') val = row.توزيع_الأرباح || '';
                          else if (col === 'صافي الربح (ج.م)') val = row.صافي_الربح || '';
                          else if (col === 'إجمالي الأوردرات') val = row.total_orders || '';
                          else if (col === 'مكتمل') val = row.completed || '';
                          else if (col === 'ملغي') val = row.cancelled || '';
                          else if (col === 'متوسط الوقت (ساعات)') val = row.avg_hours || '';
                          else val = '';
                          return <td key={colIdx} className="p-3 border border-slate-800">{val}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

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
              <div className="flex flex-col gap-1"><p className="text-sm font-semibold text-purple-300">📅 توزيع أرباح الشركاء</p><p className="text-xs text-slate-400">اختر التاريخ ثم اضغط زر التوزيع (يتم توزيع صافي ربح اليوم بنسبة الشركاء)</p></div>
              <div className="flex flex-wrap items-center gap-3"><input type="date" value={selectedProfitDate} onChange={e=>setSelectedProfitDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"/>{canEditDelete() && <button onClick={handleDistributeSelectedProfit} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><DollarSign size={16}/> توزيع أرباح التاريخ المحدد</button>}</div>
            </div>
            <div className="bg-blue-600/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 border border-blue-500/30">
              <div className="flex flex-col gap-1"><p className="text-sm font-semibold text-blue-300">📊 إرسال تقرير الخزنة للشركاء</p><p className="text-xs text-slate-400">اختر التاريخ ثم اضغط زر الإرسال (يفتح واتساب لكل شريك)</p></div>
              <div className="flex flex-wrap items-center gap-3"><input type="date" value={reportDate} onChange={e=>setReportDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"/>{canEditDelete() && <button onClick={handleSendReportForDate} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Send size={16}/> إرسال تقرير التاريخ المحدد</button>}</div>
            </div>
            <div className="bg-slate-900 rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800">
                  <tr><th className="p-3">التاريخ</th><th>النوع</th><th>المبلغ</th><th>الوصف</th><th>إجراءات</th></tr>
                </thead>
                <tbody>
                  {cashLedger.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-800">
                      <td className="p-3 text-slate-300">{entry.date}</td>
                      <td className="text-slate-300">{entry.type === 'income' ? '💰 دخل' : entry.type === 'expense' ? '💸 مصروف' : entry.type === 'profit_distribution' ? '📤 توزيع أرباح' : '🏦 رصيد احتياطي'}</td>
                      <td className={entry.type === 'income' || entry.type === 'reserve' ? 'text-green-400' : 'text-red-400'}>{entry.amount} ج.م</td>
                      <td className="max-w-xs break-words text-slate-300">{entry.description}</td>
                      <td>{canEditDelete() && <button onClick={() => deleteCashEntry(entry.id)} className="text-red-400"><Trash2 size={16} /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'partners' && (
          <div className="space-y-4">
            <div className="flex justify-end">{canEditDelete() && <button onClick={()=>{setEditingPartner(null); setPartnerForm({ name: '', share_percentage: 0, phone: '', is_active: true }); setShowPartnerModal(true);}} className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><UserPlus size={16}/> إضافة شريك</button>}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partners.map(partner => (
                <div key={partner.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                  <div className="flex justify-between"><h3 className="font-bold text-white">{partner.name}</h3><span className={`text-xs px-2 py-1 rounded-full ${partner.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{partner.is_active ? 'نشط' : 'غير نشط'}</span></div>
                  <p className="text-2xl font-bold text-orange-500 mt-2">{partner.share_percentage}%</p>
                  <p className="text-sm text-slate-400">📞 {partner.phone || 'لا يوجد'}</p>
                  {canEditDelete() && <div className="flex gap-2 mt-3"><button onClick={()=>{setEditingPartner(partner); setPartnerForm(partner); setShowPartnerModal(true);}} className="text-blue-500"><Edit size={16}/></button><button onClick={()=>deletePartner(partner.id, partner.name)} className="text-red-500"><Trash2 size={16}/></button></div>}
                </div>
              ))}
            </div>
          </div>
        )}

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

        {activeTab === 'performance' && <TechnicianPerformance orders={orders} technicians={technicians} />}
        {activeTab === 'permissions' && userRole === 'admin' && <AdminPermissions />}
      </div>

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
              <div className="flex gap-3 pt-4"><button type="submit" disabled={isSubmitting} className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-bold">{isSubmitting ? 'جاري الحفظ...' : 'حفظ'}</button><button type="button" onClick={()=>setShowOrderModal(false)} className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-lg font-bold">إلغاء</button></div>
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
              <input type="text" placeholder="اسم المستخدم" value={techForm.username} onChange={e=>setTechForm({...techForm, username: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"/>
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
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (editingPartner) await fetchAPI(`partners?id=eq.${editingPartner.id}`, { method: 'PATCH', body: JSON.stringify(partnerForm) });
                else await fetchAPI('partners', { method: 'POST', body: JSON.stringify(partnerForm) });
                await addNotification(editingPartner ? 'تعديل شريك' : 'إضافة شريك', `تم ${editingPartner ? 'تعديل' : 'إضافة'} الشريك ${partnerForm.name}`);
                setShowPartnerModal(false); setEditingPartner(null); setPartnerForm({ name: '', share_percentage: 0, phone: '', is_active: true });
                fetchPartners();
              } catch (err) { console.error(err); }
            }} className="space-y-4">
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
