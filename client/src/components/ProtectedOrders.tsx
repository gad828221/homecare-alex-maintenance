import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Search, LayoutDashboard, Users,
  CheckCircle2, AlertCircle,
  Edit, Trash2, RefreshCw, Phone,
  Copy, Check, Trash, Bell, DollarSign, X, Printer, UserPlus, UserMinus, LogOut, Send, Play,
  RotateCcw, Clock, MapPin, Star, Cpu, ShieldCheck
} from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { Helmet } from 'react-helmet-async';
import { sendExternalPush } from '../utils/pushNotifications';

const runWithOneSignal = (callback: (OneSignal: any) => void | Promise<void>) => {
  if (typeof window === 'undefined') return;
  const win = window as any;
  win.OneSignalDeferred = win.OneSignalDeferred || [];
  win.OneSignalDeferred.push(callback);
};


// ==================== الإعدادات الأساسية ====================
const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';
const supabase = createClient(supabaseUrl, supabaseKey);

const DEVICE_TYPES = ['غسالة', 'ثلاجة', 'بوتاجاز', 'سخان', 'تكييف', 'ميكروويف', 'غسالة أطباق'];
const BRANDS = ['سامسونج', 'LG', 'شارب', 'توشيبا', 'زانوسي', 'يونيون إير', 'فريش', 'وايت ويل', 'أريستون', 'بيكو', 'هوفر', 'إنديست', 'كريازي'];

// ==================== مكونات وهمية محلية ====================
function AdminPermissions({ currentUser }: { currentUser?: any }) {
  return (
    <div className="bg-slate-900 rounded-xl p-6 text-white">
      <h2 className="text-xl font-bold mb-4">🔐 إدارة الصلاحيات</h2>
      <p>مرحباً {currentUser?.name || 'مدير'}، صفحة الصلاحيات تعمل.</p>
    </div>
  );
}

function TechnicianPerformance({ orders, technicians }: { orders: any[], technicians: any[] }) {
  const techStats = technicians.map(tech => {
    const techOrders = orders.filter(o => o.technician === tech.name);
    const completed = techOrders.filter(o => o.status === 'completed').length;
    const pending = techOrders.filter(o => o.status === 'pending' || o.status === 'in-progress').length;
    const cancelled = techOrders.filter(o => o.status === 'cancelled').length;
    const totalIncome = techOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const techShare = techOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.technician_share || 0), 0);

    return {
      name: tech.name,
      total: techOrders.length,
      completed,
      pending,
      cancelled,
      totalIncome,
      techShare,
      successRate: techOrders.length > 0 ? Math.round((completed / techOrders.length) * 100) : 0
    };
  }).sort((a, b) => b.completed - a.completed);

  return (
    <div className="bg-slate-900 rounded-xl p-6 text-white">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Users className="text-orange-500" /> إحصائيات أداء الفنيين
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {techStats.map(stat => (
          <div key={stat.name} className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-orange-500/50 transition-all">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg">{stat.name}</h3>
              <span className="bg-orange-600/20 text-orange-400 text-xs px-2 py-1 rounded-full font-bold">
                نجاح: {stat.successRate}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                <div className="text-blue-400 font-bold">{stat.total}</div>
                <div className="text-[10px] text-slate-500">إجمالي</div>
              </div>
              <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                <div className="text-green-400 font-bold">{stat.completed}</div>
                <div className="text-[10px] text-slate-500">مكتمل</div>
              </div>
              <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                <div className="text-red-400 font-bold">{stat.cancelled}</div>
                <div className="text-[10px] text-slate-500">ملغي</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">إجمالي التحصيل:</span>
                <span className="text-white font-bold">{stat.totalIncome} ج.م</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">مستحقات الفني:</span>
                <span className="text-orange-400 font-bold">{stat.techShare} ج.م</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-green-500 h-full transition-all duration-500"
                  style={{ width: `${stat.successRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const invoiceService = {
  sendInvoiceViaWhatsApp: (data: any) => {
    console.log('محاكاة إرسال الفاتورة:', data);
  }
};

// ==================== دوال الواتساب المحلية ====================
const ADMIN_PHONE = '201558625259';
const formatPhoneForWhatsApp = (phone: string) => {
  if (!phone) return '';
  let cleaned = phone.toString().replace(/[^\d]/g, '');
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  if (cleaned.length === 10) cleaned = '20' + cleaned;
  return cleaned;
};
const openWhatsApp = (phone: string, message: string) => {
  const cleanedPhone = formatPhoneForWhatsApp(phone);
  if (!cleanedPhone) return;
  const encodedMsg = encodeURIComponent(message);
  
  // محاولة استخدام الرابط العميق لفتح التطبيق مباشرة على الموبايل
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = `whatsapp://send?phone=${cleanedPhone}&text=${encodedMsg}`;
  } else {
    // على الكمبيوتر نستخدم الرابط العادي
    window.open(`https://wa.me/${cleanedPhone}?text=${encodedMsg}`, '_blank');
  }
};

const notifyAdmin = (message: string) => {
  openWhatsApp(ADMIN_PHONE, message);
};

const notifyTechnician = (techPhone: string, techName: string, message: string) => {
  openWhatsApp(techPhone, message);
};

const sendWhatsApp = (phoneNumber: string, message: string) => {
  openWhatsApp(phoneNumber, message);
};

// ==================== دالة جلب محسّنة ====================
const fetchAPI = async (endpoint: string, options?: RequestInit) => {
  try {
    const url = `${supabaseUrl}/rest/v1/${endpoint}`;
    const res = await fetch(url, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
      ...options,
    });
    if (res.status === 204 || options?.method === 'DELETE') return [];
    const text = await res.text();
    if (!text) return [];
    return JSON.parse(text);
  } catch (e) {
    console.error("fetchAPI error:", e);
    return [];
  }
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

// ==================== المكون الرئيسي ====================
export default function ProtectedOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<any[]>([]);
  const getPhotoUrl = (note: string, type: 'OLD' | 'NEW') => {
    if (!note) return null;
    const regex = new RegExp(`\\[${type}_PARTS:(.*?)\\]`);
    const match = note.match(regex);
    return match ? match[1] : null;
  };

  const [technicians, setTechnicians] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [cashLedger, setCashLedger] = useState<any[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'archived' | 'technicians' | 'reports' | 'invoicesReview' | 'cash' | 'partners' | 'notifications' | 'permissions' | 'performance' | 'analytics' | 'feedback'>('orders');
  const [showOrderModal, setShowOrderModal] = useState(false);

  const [showTechModal, setShowTechModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingTech, setEditingTech] = useState<any>(null);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [editingCash, setEditingCash] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserAccount, setEditingUserAccount] = useState<any>(null);
  const [userForm, setUserForm] = useState({ name: '', username: '', password: '', role: 'viewer', is_active: true });
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
  const [filterWarranty, setFilterWarranty] = useState<'all' | 'active' | 'expired' | 'expiring'>('all');
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
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);


  const [userRole, setUserRole] = useState<string>('');
  const [isUrgentAlert, setIsUrgentAlert] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alertInterval = useRef<any>(null);
  const lastCheckedOrderId = useRef<number | null>(null);

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

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    if (type === 'success' || type === 'info') playDing();
    setTimeout(() => setToast(null), 3000);
  };

  const initAudio = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      setAudioEnabled(true);
      sessionStorage.setItem('audio_forced_enabled', 'true');
      playDing(false);
    } catch (e) { console.error("Audio init error", e); }
  };

  const playDing = (isUrgent = false) => {
    try {
      const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioContextRef.current) audioContextRef.current = ctx;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = isUrgent ? 1200 : 880;
      oscillator.type = isUrgent ? 'square' : 'sine';
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(isUrgent ? 0.4 : 0.2, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (isUrgent ? 0.8 : 0.5));
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + (isUrgent ? 0.8 : 0.5));
    } catch (e) { console.warn("Audio error", e); }
  };

  const startUrgentAlert = () => {
    if (alertInterval.current) return;
    setIsUrgentAlert(true);
    playDing(true);
    alertInterval.current = setInterval(() => {
      playDing(true);
    }, 2000);
  };

  const stopUrgentAlert = () => {
    if (alertInterval.current) {
      clearInterval(alertInterval.current);
      alertInterval.current = null;
    }
    setIsUrgentAlert(false);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const role = localStorage.getItem('userRole');
    if (!storedUser) { window.location.href = '/login'; return; }
    setCurrentUser(JSON.parse(storedUser));
    setUserRole(role || 'user');

    // ✅ التحقق إذا كان الصوت قد تم تفعيله مسبقاً في هذه الجلسة
    if (sessionStorage.getItem('audio_forced_enabled') === 'true') {
      setAudioEnabled(true);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();
    }
  }, []);

  useEffect(() => {
    if (userRole === 'viewer' && viewerBlockedTabs.includes(activeTab)) {
      setActiveTab('orders');
    }
  }, [userRole, activeTab]);

  const canEditDelete = () => {
    const role = userRole?.toLowerCase() || '';
    return role === 'admin' || role === 'manager';
  };
  const isViewer = userRole?.toLowerCase() === 'viewer';
  const viewerBlockedTabs = ['technicians', 'reports', 'invoicesReview', 'partners', 'performance', 'feedback', 'permissions'];
  
  const saveUserAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'admin') return showToast("ليس لديك صلاحية", "error");
    try {
      if (editingUserAccount) {
        await fetchAPI(`users?id=eq.${editingUserAccount.id}`, { method: 'PATCH', body: JSON.stringify(userForm) });
        showToast("✅ تم تحديث المستخدم", "success");
      } else {
        await fetchAPI('users', { method: 'POST', body: JSON.stringify(userForm) });
        showToast("✅ تم إضافة المستخدم بنجاح", "success");
      }
      setShowUserModal(false);
      fetchData();
    } catch (err) { console.error(err); showToast("❌ حدث خطأ أثناء الحفظ", "error"); }
  };

  const deleteUserAccount = async (id: number, name: string) => {
    if (userRole !== 'admin') return showToast("ليس لديك صلاحية", "error");
    if (confirm(`هل أنت متأكد من حذف حساب ${name}؟`)) {
      try {
        await fetchAPI(`users?id=eq.${id}`, { method: 'DELETE' });
        showToast("✅ تم حذف الحساب", "success");
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  const toggleUserAccountStatus = async (user: any) => {
    if (userRole !== 'admin') return showToast("ليس لديك صلاحية", "error");
    try {
      await fetchAPI(`users?id=eq.${user.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !user.is_active }) });
      showToast(user.is_active ? "⚠️ تم إيقاف الحساب" : "✅ تم تفعيل الحساب", "info");
      fetchData();
    } catch (err) { console.error(err); }
  };
  const sendFeedbackRequest = (order: any) => {
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
    if (!order.phone || !order.order_number) return showToast("بيانات العميل غير مكتملة", "error");
    const feedbackUrl = `${window.location.origin}/feedback?order=${encodeURIComponent(order.order_number)}`;
    const message = `مرحباً أ/ ${order.customer_name || 'عميلنا العزيز'}،\n\nنرجو مشاركتنا تقييمك لخدمة الصيانة للأوردر رقم ${order.order_number}.\n\n⭐ قيّم الخدمة من هنا:\n${feedbackUrl}\n\nشكراً لثقتك في Maintenance Guide.`;
    sendWhatsApp(order.phone, message);
  };
  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); window.location.href = "/login"; };

  const sendWhatsAppToCustomerOnCreate = (order: any) => {
    if (isViewer) return;
    const message = `📝 *تم استلام طلب الصيانة بنجاح* 📝\n\n🔢 *رقم الأوردر:* ${order.order_number}\n👤 *العميل:* ${order.customer_name}\n🔧 *الجهاز:* ${order.device_type} - ${order.brand}\n📍 *العنوان:* ${order.address || 'غير محدد'}\n\n✅ تم تسجيل طلبك وسيتم التواصل معك قريباً.`;
    openWhatsApp(order.phone, message);
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

  const isOldAndShouldArchive = (order: any) => {
    const archiveStatuses = ['pending', 'in-progress', 'cancelled', 'inspected'];
    if (!archiveStatuses.includes(order.status)) return false;
    return getDaysDifference(order.date, order.status) > 30;
  };

  const isNewOrder = (order: any) => {
    if (!order.created_at) return false;
    const created = new Date(order.created_at);
    const now = new Date();
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffHours < 1; // أوردر جديد خلال آخر ساعة
  };

  const getWarrantyStatus = (order: any) => {
    if (!order.invoice_approved || !order.warranty_period || order.status !== 'completed') {
      return { status: 'none', text: 'لا يوجد ضمان', color: 'slate' };
    }
    
    // استخدام تاريخ الفاتورة أو تاريخ الإكمال أو تاريخ الإنشاء
    const dateSource = order.invoice_date || order.completed_at || order.created_at || order.date;
    if (!dateSource) return { status: 'none', text: 'لا يوجد ضمان', color: 'slate' };
    
    const orderDate = new Date(dateSource);
    if (isNaN(orderDate.getTime())) return { status: 'none', text: 'تاريخ غير صالح', color: 'slate' };

    let months = 6;
    if (order.warranty_period?.includes('سنة')) {
      const match = order.warranty_period.match(/(\d+)/);
      months = match ? parseInt(match[1]) * 12 : 12;
    } else if (order.warranty_period?.includes('شهر')) {
      const match = order.warranty_period.match(/(\d+)/);
      if (match) months = parseInt(match[1]);
    } else if (order.warranty_period === 'بدون ضمان') {
      return { status: 'none', text: 'بدون ضمان', color: 'slate' };
    }
    
    const endDate = new Date(orderDate);
    endDate.setMonth(endDate.getMonth() + months);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endCompare = new Date(endDate);
    endCompare.setHours(0, 0, 0, 0);
    
    if (today > endCompare) return { status: 'expired', text: 'منتهي', color: 'red' };
    
    const diffTime = endCompare.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7 && diffDays >= 0) return { status: 'expiring', text: `ينتهي خلال ${diffDays} يوم`, color: 'orange' };
    return { status: 'active', text: 'ساري', color: 'emerald' };
  };

  const sendDailyReportToWhatsApp = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => (o.created_at || o.date).includes(today));
    const completedToday = todayOrders.filter(o => o.status === 'completed').length;
    const incomeToday = todayOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'in-progress').length;
    const delayedCount = orders.filter(o => isDelayed(o)).length;
    const noTechCount = orders.filter(o => !o.technician || o.technician === '-' || o.technician === '').length;

    const message = `📊 *ملخص سير العمل اليومي* 📊\n━━━━━━━━━━━━━━━━━━━━━━\n📅 *التاريخ:* ${new Date().toLocaleDateString('ar-EG')}\n\n✅ *إحصائيات الإنجاز:* \n🔹 طلبات جديدة: ${todayOrders.length}\n🔹 طلبات مكتملة: ${completedToday}\n💰 إجمالي التحصيل: ${incomeToday.toLocaleString()} ج.م\n\n⚠️ *حالة الطلبات القائمة:* \n🔸 قيد العمل: ${pendingCount}\n🚨 طلبات متأخرة: ${delayedCount}\n👤 بدون فني: ${noTechCount}\n━━━━━━━━━━━━━━━━━━━━━━\n🚀 *نعمل معاً لتقديم أفضل خدمة عملاء.*`;

    notifyAdmin(message);
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
      const allData = await fetchAPI('cash_ledger?select=*&order=date.desc,created_at.desc');
      const all = allData || [];
      let balance = 0;
      all.forEach((entry: any) => {
        if (entry.type === 'income') balance += entry.amount;
        else if (entry.type === 'expense' || entry.type === 'profit_distribution') balance -= entry.amount;
      });
      setCashBalance(balance);
      let displayData = all;
      if (cashFilterDate) {
        displayData = all.filter(entry => entry.date === cashFilterDate);
      }
      setCashLedger(displayData);
    } catch (err) { console.error(err); }
  }, [cashFilterDate]);

  const addCashEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
    try {
      const amount = Number(Number(cashForm.amount).toFixed(2));
      const entryData = { ...cashForm, amount };
      if (editingCash) await fetchAPI(`cash_ledger?id=eq.${editingCash.id}`, { method: 'PATCH', body: JSON.stringify(entryData) });
      else await fetchAPI('cash_ledger', { method: 'POST', body: JSON.stringify(entryData) });
      await addNotification(editingCash ? 'تعديل حركة خزنة' : 'إضافة حركة خزنة', `تم ${editingCash ? 'تعديل' : 'إضافة'} حركة ${cashForm.type} بقيمة ${amount} ج.م`);
      setShowCashModal(false); setEditingCash(null); setCashForm({ type: 'expense', amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
      fetchCashLedger();
    } catch (err) { console.error(err); }
  };

  const deleteCashEntry = async (id: number) => {
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
    if (confirm('هل تريد حذف هذا القيد نهائياً؟')) {
      await fetchAPI(`cash_ledger?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف قيد خزنة', `تم حذف قيد من سجل الخزنة`);
      fetchCashLedger();
    }
  };

  const deleteOrderProfitFromCash = async (order: any) => {
    if (!canEditDelete()) return false;
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
    if (!canEditDelete()) return false;
    const companyShare = order.company_share || 0;
    if (order.profit_added_to_cash) { showToast("ليس لديك صلاحية", "error"); return false; }
    if (companyShare <= 0) { showToast("ليس لديك صلاحية", "error"); return false; }
    if (!order.is_paid) { showToast("ليس لديك صلاحية", "error"); return false; }
    if (order.status !== 'completed') { showToast("ليس لديك صلاحية", "error"); return false; }
    try {
      const today = new Date().toISOString().split('T')[0];
      const roundedShare = Number(companyShare.toFixed(2));
      const response = await fetch(`${supabaseUrl}/rest/v1/cash_ledger`, {
        method: 'POST', headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'income', amount: roundedShare, description: `أرباح شركة من أوردر ${order.customer_name} (رقم ${order.order_number})`, date: today })
      });
      if (response.ok) {
        await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`, {
          method: 'PATCH', headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ profit_added_to_cash: true })
        });
        await addNotification('إضافة أرباح للخزنة', `✅ تم إضافة ${roundedShare} ج.م للخزنة من أوردر ${order.order_number} (${order.customer_name})`);
        await fetchCashLedger(); await fetchData();
        return true;
      } else { const error = await response.text(); alert(`❌ فشل إضافة الأرباح: ${error}`); return false; }
    } catch (err) { alert(`❌ حدث خطأ في الاتصال: ${err.message}`); return false; }
  };

  // ✅ توزيع أرباح يوم – يعتمد على الإيرادات اليومية فقط، بدون reserve، ويمنع التكرار
  const distributeProfitForDate = async (targetDate: string) => {
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
    try {
      const incomeEntries = await fetchAPI(`cash_ledger?select=amount&date=eq.${targetDate}&type=eq.income`);
      const totalIncome = (incomeEntries || []).reduce((sum, entry) => sum + (entry.amount || 0), 0);

      const existingDistributions = await fetchAPI(`cash_ledger?select=amount&date=eq.${targetDate}&type=eq.profit_distribution`);
      const totalDistributedSoFar = (existingDistributions || []).reduce((sum, entry) => sum + (entry.amount || 0), 0);

      if (totalIncome <= 0) {
        alert(`⚠️ لا توجد أرباح ليوم ${targetDate}.`);
        return;
      }

      const activePartners = partners.filter(p => p.is_active === true);
      if (activePartners.length === 0) {
        showToast("ليس لديك صلاحية", "error");
        return;
      }

      const totalPartnerShares = activePartners.reduce((sum, p) => sum + (Number(p.share_percentage) || 0), 0);
      if (totalPartnerShares <= 0) {
        showToast("ليس لديك صلاحية", "error");
        return;
      }

      // حساب إجمالي ما يجب توزيعه بناءً على الدخل الكلي
      const totalShouldBeDistributed = Number(((totalIncome * totalPartnerShares) / 100).toFixed(2));

      // المبلغ المتبقي للتوزيع (الإجمالي المطلوب - ما تم توزيعه بالفعل)
      const amountToDistribute = Number((totalShouldBeDistributed - totalDistributedSoFar).toFixed(2));

      if (amountToDistribute <= 0) {
        alert(`⚠️ تم توزيع كافة أرباح يوم ${targetDate} بالفعل (${totalDistributedSoFar.toLocaleString()} ج.م). لا توجد أرباح جديدة للتوزيع.`);
        return;
      }

      const confirmMsg = totalDistributedSoFar > 0
        ? `💰 إجمالي أرباح اليوم: ${totalIncome.toLocaleString()} ج.م\n📤 تم توزيع سابقاً: ${totalDistributedSoFar.toLocaleString()} ج.م\n🔄 المتبقي للتوزيع الآن: ${amountToDistribute.toLocaleString()} ج.م\n\nهل تريد الاستمرار؟`
        : `💰 أرباح يوم ${targetDate}: ${totalIncome.toLocaleString()} ج.م\n📤 نسبة التوزيع: ${totalPartnerShares}%\n💰 سيتم توزيع ${amountToDistribute.toLocaleString()} ج.م على الشركاء\n\nهل تريد الاستمرار؟`;

      if (!confirm(confirmMsg)) return;

      let distributedSum = 0;
      for (let i = 0; i < activePartners.length; i++) {
        const partner = activePartners[i];
        let share;
        if (i === activePartners.length - 1) {
          share = Number((amountToDistribute - distributedSum).toFixed(2));
        } else {
          share = Math.floor((amountToDistribute * partner.share_percentage) / totalPartnerShares);
        }
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
      showToast(`تم توزيع ${amountToDistribute.toLocaleString()} ج.م`, 'success');
      await fetchCashLedger();
      await fetchData();
      alert(`✅ تم التوزيع بنجاح.\n💰 تم توزيع ${amountToDistribute.toLocaleString()} ج.م`);
    } catch (err) {
      console.error(err);
      showToast("ليس لديك صلاحية", "error");
    }
  };

  // دالة إرسال التقرير اليومي للشركاء (مع احتساب توزيعات الأرباح بشكل صحيح)
  const sendDailyReportToPartners = async (targetDate: string) => {
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
    try {
      // 1. حساب الرصيد الافتتاحي (جميع الحركات قبل التاريخ)
      const allEntriesBefore = await fetchAPI(`cash_ledger?select=*&date=lt.${targetDate}`);
      const openingBalance = (allEntriesBefore || []).reduce((acc: number, entry: any) => {
        const amount = Number(entry.amount) || 0;
        if (entry.type === 'income') return Number((acc + amount).toFixed(2));
        if (entry.type === 'expense') return Number((acc - amount).toFixed(2));
        if (entry.type === 'profit_distribution') return Number((acc - amount).toFixed(2));
        return acc;
      }, 0);

      // 2. جلب حركات اليوم المحدد
      const entries = await fetchAPI(`cash_ledger?select=*&date=eq.${targetDate}`);
      if (!entries || entries.length === 0) {
        alert(`⚠️ لا توجد حركات خزنة ليوم ${targetDate}`);
        return;
      }

      let totalIncome = 0, totalExpense = 0, totalProfitDist = 0;
      entries.forEach((entry: any) => {
        const amt = Number(entry.amount) || 0;
        if (entry.type === 'income') totalIncome += amt;
        else if (entry.type === 'expense') totalExpense += amt;
        else if (entry.type === 'profit_distribution') totalProfitDist += amt;
      });

      // 3. الرصيد الختامي (نفس معادلة الخزنة الأساسية)
      const closingBalance = openingBalance + totalIncome - totalExpense - totalProfitDist;

      // 4. بناء نص التقرير
      const reportText = `🏦 *التقرير المالي اليومي - الخزنة* 🏦\n━━━━━━━━━━━━━━━━━━━━━━\n📅 *تاريخ التقرير:* ${targetDate}\n\n💰 *رصيد الافتتاح:* ${openingBalance.toLocaleString()} ج.م\n📈 *إجمالي الإيرادات:* ${totalIncome.toLocaleString()} ج.م\n📉 *إجمالي المصروفات:* ${totalExpense.toLocaleString()} ج.م\n📤 *الأرباح الموزعة:* ${totalProfitDist.toLocaleString()} ج.م\n━━━━━━━━━━━━━━━━━━━━━━\n✅ *الرصيد الختامي الحالي:* ${closingBalance.toLocaleString()} ج.م\n━━━━━━━━━━━━━━━━━━━━━━\n✨ *HomeCare Financial System* ✨`;

      const activePartners = partners.filter(p => p.is_active && p.phone);
      if (activePartners.length === 0) {
        showToast("ليس لديك صلاحية", "error");
        return;
      }

      const userChoice = confirm(`📋 التقرير جاهز للإرسال ليوم ${targetDate}.\n\n${reportText}\n\nهل تريد فتح واتساب لإرسال التقرير لكل شريك على حدة؟`);
      if (!userChoice) return;

      for (const partner of activePartners) {
        let phone = partner.phone.replace(/\D/g, '');
        if (phone.startsWith('0')) phone = phone.substring(1);
        if (!phone.startsWith('20')) phone = '20' + phone;
        openWhatsApp(partner.phone, reportText);
      }
      showToast("فشل تنفيذ العملية", "error");
    } catch (err) {
      console.error(err);
      showToast("ليس لديك صلاحية", "error");
    }
  };

  const handleSendReportForDate = () => {
    if (!reportDate) {
      showToast("ليس لديك صلاحية", "error");
      return;
    }
    sendDailyReportToPartners(reportDate);
  };

  const handleDistributeSelectedProfit = async () => {
    if (!selectedProfitDate) {
      showToast("ليس لديك صلاحية", "error");
      return;
    }
    await distributeProfitForDate(selectedProfitDate);
  };

  // ========== دالة fetchData الآمنة ==========

  const updateOrderRating = async (orderId: number, rating: number) => {
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
    try {
      await fetchAPI(`orders?id=eq.${orderId}`, { method: 'PATCH', body: JSON.stringify({ rating }) });
      showToast("✅ تم تقييم الفني بنجاح", "success");
      fetchData();
    } catch (err) { console.error(err); }
  };

  const fetchData = useCallback(async (isAutoRefresh = false) => {
    if (!userRole) return;
    if (!isAutoRefresh) setLoading(true);
    try {
      const orderFields = isViewer
        ? 'id,order_number,customer_name,device_type,address,brand,problem_description,technician,status,total_amount,parts_cost,transport_cost,net_amount,company_share,technician_share,is_paid,created_at,date,deleted_at,technician_note,warranty_period,invoice_approved,invoice_date,parts_used,completed_at'
        : '*';
      const allOrders = await fetchAPI(`orders?select=${orderFields}&order=created_at.desc`);
      const ordersArray = Array.isArray(allOrders) ? allOrders : [];
      
      // نظام المراقب الذكي: إذا وجدنا أوردر جديد برقم ID أكبر من آخر واحد رأيناه
      if (ordersArray.length > 0) {
        const newestId = Math.max(...ordersArray.map((o: any) => o.id));
        if (lastCheckedOrderId.current !== null && newestId > lastCheckedOrderId.current) {
          const role = userRole?.toLowerCase() || '';
          if (role === 'admin' || role === 'manager') {
            console.log("🔍 Polling found new order! ID:", newestId);
            startUrgentAlert();
          }
        }
        lastCheckedOrderId.current = newestId;
      }

      const notDeleted = ordersArray.filter((o: any) => !o.deleted_at);
      const activeOrders = notDeleted.filter((o: any) => !isOldAndShouldArchive(o));
      const archivedOrders = notDeleted.filter((o: any) => isOldAndShouldArchive(o));
      const deletedOrders = ordersArray.filter((o: any) => o.deleted_at);

      setOrders(activeOrders);
      setArchivedOrders(archivedOrders);
      setDeletedOrders(deletedOrders);

      const [techsData, notificationsData, partnersData, cashData, usersData] = await Promise.all([
        fetchAPI('technicians?select=*'),
        fetchAPI('notifications?select=*&order=created_at.desc'),
        fetchAPI('partners?select=*&order=created_at.desc'),
        fetchAPI('cash_ledger?select=*&order=date.desc,created_at.desc'),
        fetchAPI('users?select=*&order=created_at.desc')
      ]);

      setTechnicians(Array.isArray(techsData) ? techsData : []);
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      setPartners(Array.isArray(partnersData) ? partnersData : []);
      setCashLedger(Array.isArray(cashData) ? cashData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);

      let balance = 0;
      (cashData || []).forEach((entry: any) => {
        if (entry.type === 'income') balance += entry.amount;
        else if (entry.type === 'expense' || entry.type === 'profit_distribution') balance -= entry.amount;
      });
      setCashBalance(balance);

      const pending = activeOrders.filter((o: any) => o.status === 'pending').length;
      const inProgress = activeOrders.filter((o: any) => o.status === 'in_progress').length;
      const completed = activeOrders.filter((o: any) => o.status === 'completed').length;
      const cancelled = activeOrders.filter((o: any) => o.status === 'cancelled').length;
      const totalIncome = activeOrders.filter((o: any) => o.is_paid).reduce((sum, o) => sum + (o.company_share || 0), 0);
      setStats({ pending, inProgress, completed, cancelled, totalIncome });

      // إنذار المتأخرات للمدير
      const delayedOrders = activeOrders.filter(o => isDelayed(o));
      if (delayedOrders.length > 0) {
        const role = userRole?.toLowerCase() || '';
        if (role === 'admin' || role === 'manager') {
          console.log("🚨 Delayed orders found! Count:", delayedOrders.length);
          startUrgentAlert();
          
          // إرسال إشعار خارجي للمدير (مرة واحدة كل ساعة لتجنب الإزعاج)
          const lastAlert = localStorage.getItem('last_delay_alert_manager');
          const now = new Date().getTime();
          if (!lastAlert || (now - parseInt(lastAlert)) > 3600000) {
            void sendExternalPush({
              event: 'system_alert',
              title: '⚠️ تنبيه أوردرات متأخرة',
              message: `يوجد ${delayedOrders.length} أوردر متأخر لأكثر من يومين. يرجى المتابعة مع الفنيين.`,
              targetRoles: ['admin', 'manager']
            });
            localStorage.setItem('last_delay_alert_manager', now.toString());
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userRole, isViewer]);

  useEffect(() => {
    fetchData();

    // إجبار وسم OneSignal للمدير فور الدخول
    runWithOneSignal(async (OneSignal: any) => {
      const role = userRole?.toLowerCase();
      if (role === 'admin' || role === 'manager') {
        await OneSignal.User.addTag('role', role).catch(() => {});
        console.log("✅ OneSignal Tag Forced:", role);
      }
    });

    // نظام التحديث التلقائي (المراقب الذكي)
    const interval = setInterval(() => {
      console.log("🔄 Auto-polling for new orders...");
      fetchData(true);
    }, 10000);
    
    // اشتراك حي للأوردرات الجديدة لإصدار صوت تنبيه ملح للمدير
    console.log("🔔 Realtime subscription active for role:", userRole);
    const channel = supabase
      .channel('orders-audio-alert')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        console.log("🆕 New order detected via realtime!", payload);
        const role = userRole?.toLowerCase() || '';
        if (role === 'admin' || role === 'manager') {
          startUrgentAlert();
        } else {
          playDing();
        }
        fetchData();
      })
      .subscribe((status) => {
        console.log("📡 Realtime status:", status);
      });
      
    // اشتراك حي لتنبيهات الأوردرات الجديدة اليدوية (Fallback)
    const alertChannel = supabase
      .channel('admin-order-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'action=eq.new_order_alert' }, (payload) => {
        console.log("🆕 Manual new order alert received!", payload);
        const role = userRole?.toLowerCase() || '';
        if (role === 'admin' || role === 'manager') {
          startUrgentAlert();
          fetchData();
        }
      })
      .subscribe();

    // اشتراك تتبع المتواجدين حالياً
    const presenceChannel = supabase.channel('online-users');
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = Object.values(state).flat();
        setOnlineUsers(users);
      })
      .subscribe();

    return () => { 
      clearInterval(interval);
      supabase.removeChannel(channel); 
      supabase.removeChannel(alertChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [fetchData, userRole]);

  // وميض عنوان الصفحة عند وجود إنذار
  useEffect(() => {
    let interval: any;
    if (isUrgentAlert) {
      let show = true;
      interval = setInterval(() => {
        document.title = show ? "🚨 أوردر جديد! 🚨" : "HomeCare Dashboard";
        show = !show;
      }, 1000);
    } else {
      document.title = "HomeCare Dashboard";
    }
    return () => clearInterval(interval);
  }, [isUrgentAlert]);

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
    if (isViewer) return;
    let statusMessage = "";
    switch (newStatus) {
      case 'in-progress': statusMessage = "🔧 تم بدء العمل على طلبك بواسطة الفني."; break;
      case 'inspected': statusMessage = "🔍 تم الكشف على جهازك. سيتم إبلاغك بالخطوات التالية."; break;
      case 'completed': statusMessage = "✅ تم إكمال طلب الصيانة بنجاح. شكراً لثقتك بنا!"; break;
      case 'cancelled': statusMessage = "❌ تم إلغاء طلب الصيانة. للاستفسار، يرجى الاتصال بنا."; break;
      default: return;
    }
    const message = `📢 *تحديث هام بخصوص طلب الصيانة* 📢\n━━━━━━━━━━━━━━━━━━━━━━\n🔢 *رقم الطلب:* ${order.order_number}\n👤 *عزيزنا العميل:* ${order.customer_name}\n\n${statusMessage}\n\n🌟 *شكراً لثقتكم في HomeCare Maintenance. نحن دائماً في خدمتكم.*`;
    openWhatsApp(order.phone, message);
  };

  const updateOrderStatus = async (id: number, newStatus: string, extraData = {}) => {
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
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

      showToast(`تم تحديث حالة الأوردر إلى ${newStatus}`, 'info');

      const statusAr = newStatus === 'completed' ? 'تم التنفيذ ✅' :
                       newStatus === 'cancelled' ? 'ملغي ❌' :
                       newStatus === 'in-progress' ? 'قيد التنفيذ 🔧' :
                       newStatus === 'inspected' ? 'تم الكشف 💰' :
                       newStatus === 'deferred' ? 'مؤجل ⏰' : newStatus;
      const adminMsg = `🔄 *تحديث حالة طلب* 🔄\n━━━━━━━━━━━━━━━━━━━━━━\n👤 *العميل:* ${order.customer_name}\n🔢 *رقم الطلب:* ${order.order_number}\n📍 *الحالة الجديدة:* ${statusAr}\n⏰ *الوقت:* ${new Date().toLocaleTimeString('ar-EG')}\n━━━━━━━━━━━━━━━━━━━━━━`;
      notifyAdmin(adminMsg);

      if (order.technician && (newStatus === 'in-progress' || newStatus === 'completed')) {
        const tech = technicians.find(t => t.name === order.technician);
        if (tech && tech.phone) {
          const techMsg = `🔧 *تنبيه للفني: تحديث طلب* 🔧\n━━━━━━━━━━━━━━━━━━━━━━\n👤 *العميل:* ${order.customer_name}\n🔢 *رقم الطلب:* ${order.order_number}\n🔄 *الحالة المحدثة:* ${statusAr}\n📌 يرجى متابعة الإجراءات اللازمة.`;
          sendWhatsApp(tech.phone, techMsg);
          void sendExternalPush({
            event: 'order_status_changed',
            title: '🔄 تحديث حالة أوردر',
            message: techMsg,
            targetUserIds: [`tech:${tech.id}`],
            data: { order_number: order.order_number, status: newStatus }
          });
        }
      }

    } catch (err) { console.error(err); }
  };

  const pingTechnician = async (techName: string) => {
    if (!techName || techName === '-' || techName === '') {
      showToast("يرجى تعيين فني أولاً", "error");
      return;
    }
    try {
      await addNotification('tech_ping', techName);
      
      // ✅ إرسال إشعار Push للفني لضمان وصول التنبيه حتى لو التطبيق مغلق
      const tech = technicians.find(t => t.name === techName);
      if (tech) {
        void sendExternalPush({
          event: 'system_alert',
          title: '🚨 تنبيه عاجل من الإدارة',
          message: `يرجى فتح البرنامج فوراً، المدير يحاول التواصل معك!`,
          targetUserIds: [`tech:${tech.id}`]
        });
      }
      
      showToast(`جاري تنبيه الفني ${techName}...`, 'success');
    } catch (err) { console.error(err); }
  };

  const togglePaidStatus = async (id: number, currentStatus: boolean) => {
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const newPaidStatus = !currentStatus;
    try {
      if (!newPaidStatus && order.status === 'completed' && order.profit_added_to_cash) await deleteOrderProfitFromCash(order);
      await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ is_paid: newPaidStatus }) });
      await addNotification('تحديث حالة الدفع', `✅ تم تحديث حالة تحصيل أوردر ${order.customer_name} إلى ${newPaidStatus ? 'تم التحصيل' : 'لم يتم التحصيل'}`);
      if (newPaidStatus && order.status === 'completed' && !order.profit_added_to_cash) await addCompanyProfitToCash({ ...order, is_paid: true });
      fetchData(); fetchCashLedger();
      showToast(`تم ${newPaidStatus ? 'تحصيل' : 'إلغاء تحصيل'} الأوردر`, newPaidStatus ? 'success' : 'info');
    } catch (err) { console.error(err); }
  };

  const deleteOrder = async (id: number) => {
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const confirmation = prompt(
      `❗ حذف أوردر العميل: ${order.customer_name}\nرقم الأوردر: ${order.order_number}\n\nللتأكيد، اكتب كلمة "حذف" ثم اضغط OK.`
    );
    if (confirmation !== "حذف") {
      showToast("تم إلغاء الحذف", "info");
      return;
    }
    try {
      await fetchAPI(`orders?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ deleted_at: new Date().toISOString() })
      });
      await addNotification('حذف أوردر (ناعم)', `تم نقل أوردر ${order.customer_name} (رقم ${order.order_number}) إلى سلة المحذوفات`);
      fetchData();
      showToast('تم نقل الأوردر إلى سلة المحذوفات', 'error');
    } catch (err) { console.error(err); }
  };

  const restoreOrder = async (id: number) => {
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
    const order = deletedOrders.find(o => o.id === id);
    if (!order) return;
    if (confirm(`استعادة أوردر ${order.customer_name} (${order.order_number})؟`)) {
      try {
        await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ deleted_at: null }) });
        await addNotification('استعادة أوردر', `تم استعادة أوردر ${order.customer_name} (رقم ${order.order_number})`);
        fetchData();
        showToast('تمت الاستعادة بنجاح', 'success');
      } catch (err) { console.error(err); }
    }
  };

  const copyOrderDetails = (order: any) => {
    if (isViewer) return showToast("ليس لديك صلاحية", "error");
    const text = `📋 *بيانات الأوردر* 📋\n━━━━━━━━━━━━━━━━━━━━━━\n🔢 *رقم الأوردر:* ${order.order_number}\n👤 *العميل:* ${order.customer_name}\n📞 *الهاتف:* ${order.phone}\n🔧 *الجهاز:* ${order.device_type} - ${order.brand}\n📍 *العنوان:* ${order.address || 'غير محدد'}\n📝 *المشكلة:* ${order.problem_description || 'لا توجد'}\n💰 *المبلغ:* ${order.total_amount} ج.م\n👨‍🔧 *الفني:* ${order.technician || 'غير معين'}\n━━━━━━━━━━━━━━━━━━━━━━`;
    navigator.clipboard.writeText(text);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast("✅ تم نسخ بيانات الأوردر", "success");
  };

  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
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
            const techMsg = `📝 *تحديث بيانات الأوردر* 📝\n━━━━━━━━━━━━━━━━━━━━━━\n👤 *العميل:* ${formData.customer_name}\n🔧 *الجهاز:* ${finalDevice}\n📍 *العنوان:* ${formData.address}\n📌 تم تحديث البيانات، يرجى المراجعة.`;
            notifyTechnician(tech.phone, tech.name, techMsg);
            void sendExternalPush({
              event: 'technician_assigned',
              title: '🔧 تم تحديث أوردر مكلّف به',
              message: techMsg,
              targetUserIds: [`tech:${tech.id}`],
              data: { order_number: orderToSave.order_number }
            });
          }
        }

        if (orderToSave.status === 'completed' && orderToSave.is_paid && !orderToSave.profit_added_to_cash) await addCompanyProfitToCash({ ...orderToSave, id: editingOrder.id });
        showToast('تم تعديل الأوردر بنجاح', 'success');
      } else {
        await fetchAPI('orders', { method: 'POST', body: JSON.stringify(orderToSave) });
        await addNotification('إضافة أوردر', `تم إضافة أوردر جديد للعميل ${formData.customer_name}`);

        const adminMsg = `🆕 *إشعار: طلب صيانة جديد* 🆕\n━━━━━━━━━━━━━━━━━━━━━━\n🔢 *رقم الطلب:* ${orderToSave.order_number}\n👤 *العميل:* ${formData.customer_name}\n📱 *الهاتف:* ${formData.phone}\n🔧 *الجهاز:* ${finalDevice} - ${finalBrand}\n📍 *العنوان:* ${formData.address}\n👨‍🔧 *الفني:* ${orderToSave.technician || 'غير معين'}\n📝 *المشكلة:* ${formData.problem_description || 'لا يوجد وصف'}\n━━━━━━━━━━━━━━━━━━━━━━`;
        notifyAdmin(adminMsg);
        void sendExternalPush({
          event: 'new_order',
          title: '🆕 أوردر جديد',
          message: adminMsg,
          targetRoles: ['admin', 'manager', 'all'],
          data: { order_number: orderToSave.order_number }
        });

        if (orderToSave.technician) {
          const tech = technicians.find(t => t.name === orderToSave.technician);
          if (tech && tech.phone) {
            const techMsg = `🔧 *تنبيه: أوردر جديد لك* 🔧\n━━━━━━━━━━━━━━━━━━━━━━\n🔢 *رقم الطلب:* ${orderToSave.order_number}\n👤 *العميل:* ${formData.customer_name}\n🔧 *الجهاز:* ${finalDevice}\n📍 *العنوان:* ${formData.address}\n📌 يرجى مراجعة التفاصيل في بوابتك الخاصة.`;
            notifyTechnician(tech.phone, tech.name, techMsg);
            void sendExternalPush({
              event: 'technician_assigned',
              title: '🔧 تم تعيين أوردر جديد لك',
              message: techMsg,
              targetUserIds: [`tech:${tech.id}`],
              data: { order_number: orderToSave.order_number }
            });
          }
        }

        showToast('تم إضافة الأوردر بنجاح', 'success');
        sendWhatsAppToCustomerOnCreate(orderToSave);
      }
      setShowOrderModal(false); setEditingOrder(null);
      setFormData({ customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '', status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false, date: new Date().toLocaleDateString("ar-EG") });
      setIsOtherDevice(false); setIsOtherBrand(false); setCustomDevice(''); setCustomBrand('');
      fetchData();
    } catch (err) { console.error(err); showToast("حدث خطأ أثناء الحفظ", "error"); } finally { setIsSubmitting(false); }
  };

  const updateAllPendingOrdersProfit = async (technicianName: string, newPercentage: number) => {
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
    if (!confirm(`هل تريد تحديث نسب الأرباح لجميع الأوردرات غير المكتملة للفني "${technicianName}" إلى ${newPercentage}%؟`)) return;
    const pendingOrders = orders.filter(o => o.technician === technicianName && o.status !== 'completed');
    if (pendingOrders.length === 0) { showToast("لا توجد أوردرات معلقة لتحديثها", "info"); return; }
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
    showToast(`تم تحديث ${updatedCount} أوردر`, 'success');
  };

  const saveTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
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
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
    if (confirm(`حذف الفني ${name}؟`)) {
      await fetchAPI(`technicians?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف فني', `تم حذف الفني ${name}`);
      fetchData();
    }
  };

  const toggleTechnicianActive = async (tech: any) => {
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
    await fetchAPI(`technicians?id=eq.${tech.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !tech.is_active }) });
    await addNotification('تغيير حالة فني', `تم ${!tech.is_active ? 'تفعيل' : 'تعطيل'} الفني ${tech.name}`);
    fetchData();
  };

  const copyTechLink = async (tech: any) => {
    const loginUrl = `${window.location.origin}/login`;
    const message = `🔧 *بيانات الدخول الرسمية - بوابة الفنيين* 🔧\n━━━━━━━━━━━━━━━━━━━━━━\n👤 *الفني:* ${tech.name}\n🔗 *رابط الدخول:* ${loginUrl}\n👤 *اسم المستخدم:* ${tech.username || tech.name}\n🔑 *كلمة المرور:* ${tech.password}\n━━━━━━━━━━━━━━━━━━━━━━\n\n📖 *دليل البدء السريع:*\n1️⃣ افتح الرابط واختر دور "🔧 الفني".\n2️⃣ سجل دخولك بالبيانات أعلاه.\n3️⃣ ابدأ بمتابعة الأوردرات الموكلة إليك فوراً.\n\n✨ *HomeCare Team - معاً للقمة* ✨`;
    await navigator.clipboard.writeText(message);
    setCopiedId(tech.id);
    setTimeout(() => setCopiedId(null), 3000);
    showToast("✅ تم نسخ رابط دخول الفني", "success");
  };

  const printAndSendInvoice = async (order: any) => {
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
    const parts = prompt("✏️ قطع الغيار المستخدمة", "لا توجد") || "لا توجد";
    const warranty = prompt("🛡️ فترة الضمان", "6 أشهر") || "6 أشهر";
    if (!order.phone) return showToast("ليس لديك صلاحية", "error");

    await fetchAPI(`orders?id=eq.${order.id}`, { method: 'PATCH', body: JSON.stringify({ invoice_approved: true, warranty_period: warranty, parts_used: parts, invoice_date: new Date().toISOString().split('T')[0] }) });
    await addNotification('اعتماد فاتورة', `تم اعتماد فاتورة ${order.customer_name} مع ضمان ${warranty}`);
    window.open(`/invoice?id=${order.id}`, '_blank');
    invoiceService.sendInvoiceViaWhatsApp({
      id: order.id.toString(), orderNumber: order.order_number, customerName: order.customer_name, phone: order.phone,
      device: order.device_type, brand: order.brand, problem: order.problem_description || 'غير محددة',
      totalAmount: order.total_amount, warranty: warranty, date: new Date().toLocaleDateString('ar-EG'),
      address: order.address, partsUsed: parts, technicianName: order.technician
    });
    showToast("✅ تم اعتماد وإرسال الفاتورة", "success");
    fetchData();
  };

  const deleteNotification = async (id: number) => {
    if (userRole !== 'admin') return showToast("ليس لديك صلاحية", "error");
    await fetchAPI(`notifications?id=eq.${id}`, { method: 'DELETE' });
    fetchNotifications();
  };
  const deleteAllNotifications = async () => {
    if (userRole !== 'admin') return showToast("ليس لديك صلاحية", "error");
    if (confirm('هل أنت متأكد من حذف جميع الإشعارات نهائياً؟')) {
      for (const n of notifications) await fetchAPI(`notifications?id=eq.${n.id}`, { method: 'DELETE' });
      fetchNotifications();
    }
  };
  const clearFilters = () => { setSearchTerm(''); setFilterStatus('all'); setFilterTechnician(''); setFilterDeviceType(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterDelay('all'); setFilterWarranty('all'); };


  const dateFilteredOrders = orders.filter(o => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = o.customer_name?.toLowerCase().includes(searchLower);
      const matchesPhone = o.phone?.includes(searchTerm);
      const matchesOrderNum = String(o.order_number).includes(searchTerm);
      if (!matchesName && !matchesPhone && !matchesOrderNum) return false;
    }

    if (filterTechnician === '__NONE__') {
      if (o.technician && o.technician !== '-' && o.technician !== '') return false;
    } else if (filterTechnician && o.technician !== filterTechnician) {
      return false;
    }

    if (filterDeviceType && o.device_type !== filterDeviceType) return false;

    if (filterDateFrom) {
      const oDate = o.created_at ? o.created_at.split('T')[0] : o.date;
      if (oDate < filterDateFrom) return false;
    }
    if (filterDateTo) {
      const oDate = o.created_at ? o.created_at.split('T')[0] : o.date;
      if (oDate > filterDateTo) return false;
    }

    if (filterDelay === 'delayed' && !isDelayed(o)) return false;
    
    if (filterWarranty !== 'all') {
      const warrantyInfo = getWarrantyStatus(o);
      if (filterWarranty === 'active' && warrantyInfo.status !== 'active') return false;
      if (filterWarranty === 'expired' && warrantyInfo.status !== 'expired') return false;
      if (filterWarranty === 'expiring' && warrantyInfo.status !== 'expiring') return false;
    }

    return true;
  });

  const filteredOrders = dateFilteredOrders.filter(o => {
    if (filterStatus === '__UNPAID__') {
      if (o.status !== 'completed' || o.is_paid) return false;
    } else if (filterStatus !== 'all' && o.status !== filterStatus) {
      return false;
    }

    if (showAllOrders || filterStatus !== 'all' || filterTechnician || filterDateFrom || searchTerm) return true;
    return (o.status === 'in-progress' || o.status === 'pending' || !o.technician || o.technician === '-' || o.technician === '');
  });

  const filteredArchivedOrders = archivedOrders.filter(o => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = o.customer_name?.toLowerCase().includes(searchLower);
      const matchesPhone = o.phone?.includes(searchTerm);
      const matchesOrderNum = String(o.order_number).includes(searchTerm);
      if (!matchesName && !matchesPhone && !matchesOrderNum) return false;
    }
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (filterTechnician && o.technician !== filterTechnician) return false;
    return true;
  });


  const filteredTechnicians = technicians.filter(t => filterTechStatus === 'all' ? true : filterTechStatus === 'active' ? t.is_active !== false : t.is_active === false);

  // ========== دوال التقارير ==========
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
      showToast("فشل تنفيذ العملية", "error");
    } finally {
      setReportLoading(false);
    }
  };

  const fetchPendingOrdersReport = async () => {
    setReportLoading(true);
    try {
      const reportOrderFields = isViewer
        ? 'order_number, customer_name, device_type, brand, technician, status, created_at'
        : 'order_number, customer_name, phone, device_type, brand, technician, status, created_at';
      let query = supabase
        .from('orders')
        .select(reportOrderFields)
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

      setReportColumns(isViewer
        ? ['رقم الأوردر', 'العميل', 'الجهاز', 'الماركة', 'الفني', 'الحالة', 'التاريخ']
        : ['رقم الأوردر', 'العميل', 'الهاتف', 'الجهاز', 'الماركة', 'الفني', 'الحالة', 'التاريخ']);
      setReportData(finalData.map(order => ({ ...order, date: order.created_at.split('T')[0] })));
    } catch (err) {
      console.error(err);
      showToast("فشل تنفيذ العملية", "error");
    } finally {
      setReportLoading(false);
    }
  };

  const fetchCancelledOrdersReport = async () => {
    setReportLoading(true);
    try {
      const reportOrderFields = isViewer
        ? 'order_number, customer_name, device_type, brand, technician, technician_note, created_at'
        : 'order_number, customer_name, phone, device_type, brand, technician, technician_note, created_at';
      let query = supabase
        .from('orders')
        .select(reportOrderFields)
        .eq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (filterTechnicianReport) query = query.eq('technician', filterTechnicianReport);

      const { data, error } = await query;
      if (error) throw error;

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);

      const filtered = (data || []).filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= start && orderDate <= end;
      });

      setReportColumns(isViewer
        ? ['رقم الأوردر', 'العميل', 'الجهاز', 'الماركة', 'الفني', 'سبب الإلغاء', 'التاريخ']
        : ['رقم الأوردر', 'العميل', 'الهاتف', 'الجهاز', 'الماركة', 'الفني', 'سبب الإلغاء', 'التاريخ']);
      setReportData(filtered.map(order => ({ ...order, date: order.created_at.split('T')[0] })));
    } catch (err) { console.error(err); showToast("فشل تنفيذ العملية", "error"); } finally { setReportLoading(false); }
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
        if (!techMap.has(tech)) techMap.set(tech, { total: 0, completed: 0, cancelled: 0, totalHours: 0 });
        const rec = techMap.get(tech);
        rec.total++;
        if (order.status === 'completed') rec.completed++;
        if (order.status === 'cancelled') rec.cancelled++;
        if (order.status === 'completed' && order.completed_at && order.created_at) {
          const hours = (new Date(order.completed_at).getTime() - new Date(order.created_at).getTime()) / 3600000;
          rec.totalHours += hours;
        }
      });
      const report = Array.from(techMap.entries()).map(([technician, stats]) => ({
        technician, total_orders: stats.total, completed: stats.completed, cancelled: stats.cancelled,
        avg_hours: stats.completed > 0 ? (stats.totalHours / stats.completed).toFixed(1) : '-'
      }));
      setReportColumns(['الفني', 'إجمالي الأوردرات', 'مكتمل', 'ملغي', 'متوسط الوقت (ساعات)']);
      setReportData(report);
    } catch (err) { console.error(err); showToast("فشل تنفيذ العملية", "error"); } finally { setReportLoading(false); }
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
        if (match) partnerMap.set(match[1].trim(), (partnerMap.get(match[1].trim()) || 0) + item.amount);
      });
      const report = Array.from(partnerMap.entries()).map(([name, total]) => ({ name, total }));
      setReportColumns(['الشريك', 'إجمالي الأرباح (ج.م)']);
      setReportData(report);
    } catch (err) { console.error(err); showToast("فشل تنفيذ العملية", "error"); } finally { setReportLoading(false); }
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
    } catch (err) { console.error(err); showToast("فشل تنفيذ العملية", "error"); } finally { setReportLoading(false); }
  };

  const fetchComparisonReport = async () => {
    setReportLoading(true);
    try {
      const { data: incomeData } = await supabase.from('cash_ledger').select('amount').eq('type', 'income').gte('date', startDate).lte('date', endDate);
      const { data: expenseData } = await supabase.from('cash_ledger').select('amount').eq('type', 'expense').gte('date', startDate).lte('date', endDate);
      const { data: profitDistData } = await supabase.from('cash_ledger').select('amount').eq('type', 'profit_distribution').gte('date', startDate).lte('date', endDate);
      const totalIncome = (incomeData||[]).reduce((s,i)=>s+i.amount,0);
      const totalExpense = (expenseData||[]).reduce((s,e)=>s+e.amount,0);
      const totalProfitDist = (profitDistData||[]).reduce((s,p)=>s+p.amount,0);
      setReportData([{ الإيرادات: totalIncome, المصروفات: totalExpense, توزيع_الأرباح: totalProfitDist, صافي_الربح: totalIncome - totalExpense - totalProfitDist }]);
      setReportColumns(['الإيرادات (ج.م)', 'المصروفات (ج.م)', 'توزيع الأرباح (ج.م)', 'صافي الربح (ج.م)']);
    } catch (err) { console.error(err); showToast("فشل تنفيذ العملية", "error"); } finally { setReportLoading(false); }
  };

  const generateReport = () => {
    if (!startDate || !endDate) { showToast("يرجى تحديد الفترة الزمنية للتقرير", "error"); return; }
    switch (reportType) {
      case 'cash': fetchCashReport(); break;
      case 'pending_orders': fetchPendingOrdersReport(); break;
      case 'cancelled_orders': fetchCancelledOrdersReport(); break;
      case 'tech_performance': fetchTechPerformanceReport(); break;
      case 'profits': fetchProfitsReport(); break;
      case 'expenses': fetchExpensesReport(); break;
      case 'comparison': fetchComparisonReport(); break;
    }
  };

  const exportToCSV = () => {
    if (!reportData.length) { showToast("لا توجد بيانات متاحة للتصدير حالياً", "info"); return; }
    const headers = reportColumns.join(',');
    const rows = reportData.map(row => reportColumns.map(col => {
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
      return `"${val}"`;
    }).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير_${reportType}_${startDate}_${endDate}.csv`;
    link.click();
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-slate-400">جاري التحميل...</div>;

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 transition-all duration-500 ${isUrgentAlert ? 'ring-inset ring-[12px] ring-red-600/50' : ''}`}>
      
      {/* ✅ قفل الشاشة الإجباري للمدير لتفعيل الصوت */}
      {!audioEnabled && (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-6 text-center backdrop-blur-xl">
          <div className="max-w-md w-full bg-slate-900 border border-orange-500/30 p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-900/40 animate-pulse">
              <LayoutDashboard className="text-white w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-white mb-4">دخول لوحة التحكم</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              يجب تفعيل التنبيهات الصوتية الإجبارية لمراقبة سير العمل واستقبال إشعارات الفنيين والعملاء فوراً.
            </p>
            <button 
              onClick={initAudio}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-black py-5 rounded-2xl transition-all active:scale-95 shadow-xl shadow-orange-900/20 text-lg flex items-center justify-center gap-3"
            >
              <Play fill="currentColor" size={20} /> دخول وتفعيل التنبيهات 🔊
            </button>
            <p className="text-[10px] text-slate-600 mt-6 uppercase tracking-widest font-bold">Maintenance Guide Admin v1.6.0</p>
          </div>
        </div>
      )}

      {isUrgentAlert && (
        <div className="fixed top-0 left-0 w-full z-[100] animate-bounce pt-4 flex justify-center pointer-events-none">
          <button 
            onClick={(e) => { e.stopPropagation(); stopUrgentAlert(); }} 
            className="pointer-events-auto bg-red-600 text-white px-8 py-4 rounded-full font-black shadow-2xl flex items-center gap-3 border-4 border-white animate-pulse text-xl"
          >
            <Bell className="animate-spin" /> إيقاف صوت الإنذار (أوردر جديد!)
          </button>
        </div>
      )}
      <Helmet>
        <title>لوحة التحكم | Homecare Alex Maintenance</title>
      </Helmet>
      {toast && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-white font-bold shadow-lg ${
          toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {toast.message}
        </div>
      )}

      {!audioEnabled && (
        <div className="bg-orange-600 text-white px-4 py-2 text-center flex flex-col md:flex-row items-center justify-center gap-3 animate-pulse">
          <div className="flex items-center gap-2">
            <Bell size={16} />
            <span className="text-xs font-black">تنبيهات الصوت معطلة من المتصفح</span>
          </div>
          <button 
            onClick={initAudio}
            className="bg-white text-orange-600 px-4 py-1 rounded-full text-[10px] font-black hover:bg-slate-100 transition-all shadow-lg active:scale-95"
          >
            تفعيل الصوت الآن 🔊
          </button>
        </div>
      )}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3"><LayoutDashboard className="w-6 h-6 text-orange-500" /><div><h1 className="text-lg font-bold text-white">لوحة تحكم المدير</h1><p className="text-xs text-slate-400">{currentUser?.name || 'مدير النظام'}</p></div></div>
          
          {/* قسم المتواجدين حالياً */}
          <div className="hidden md:flex items-center gap-4 bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المتواجدون الآن ({onlineUsers.length})</span>
            </div>
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {onlineUsers.slice(0, 5).map((user, idx) => (
                <div 
                  key={idx} 
                  className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
                  title={`${user.name} (${user.role})`}
                >
                  {user.name?.substring(0, 2)}
                </div>
              ))}
              {onlineUsers.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-slate-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                  +{onlineUsers.length - 5}
                </div>
              )}
            </div>
          </div>

          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"><LogOut className="w-5 h-5" /></button>
        </div>
        
        {/* نسخة الموبايل من المتواجدين */}
        <div className="md:hidden mt-2 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
          <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap">نشط:</span>
          {onlineUsers.map((user, idx) => (
            <span key={idx} className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full whitespace-nowrap border border-slate-700">
              {user.name}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2 p-4 border-b bg-slate-900 overflow-x-auto">
        <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'orders' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>📋 الأوردرات</button>
        <button onClick={() => setActiveTab('archived')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'archived' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>📂 الأرشيف ({archivedOrders.length})</button>
        {userRole !== 'viewer' && <button onClick={() => setActiveTab('technicians')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'technicians' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>👨‍🔧 الفنيين</button>}
        {userRole !== 'viewer' && <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'reports' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>📊 التقارير</button>}
        {userRole !== 'viewer' && <button onClick={() => setActiveTab('invoicesReview')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'invoicesReview' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>📄 الفواتير</button>}
        <button onClick={() => setActiveTab('cash')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'cash' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>💰 الخزنة</button>
        {userRole !== 'viewer' && <button onClick={() => setActiveTab('partners')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'partners' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>🤝 الشركاء</button>}
        <button onClick={() => setActiveTab('notifications')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition ${activeTab === 'notifications' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}><Bell className="w-4 h-4" /> الإشعارات ({notifications.length})</button>
        {canEditDelete() && <button onClick={() => setActiveTab('feedback')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'feedback' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>⭐ تقييمات العملاء</button>}
        {userRole === 'admin' && <button onClick={() => setActiveTab('permissions')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'permissions' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>🔐 الصلاحيات</button>}
        <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'analytics' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>📈 الإحصائيات</button>
        {userRole !== 'viewer' && <button onClick={() => setActiveTab('performance')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'performance' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>📊 أداء الفنيين</button>}
      </div>

	      <div className="p-4">
		        {/* تبويب الأوردرات */}
		        {activeTab === 'orders' && (
		          <div className="space-y-4">
              {/* لوحة ملخص اليوم الذكي */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 border border-slate-700 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-orange-500"></div>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div>
                      <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <LayoutDashboard className="text-orange-500 w-8 h-8" /> ملخص العمليات اليوم
                      </h2>
                      <p className="text-sm text-slate-400 mt-2">نظرة عامة على أداء المركز والحالات الحرجة التي تتطلب انتباهك.</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={sendDailyReportToWhatsApp} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20 active:scale-95">
                        <Send size={18} /> تقرير الواتساب
                      </button>
                      <button onClick={fetchData} className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-2xl transition-all active:scale-95">
                        <RefreshCw size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 hover:border-blue-500/30 transition-all group">
                      <div className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest">أوردرات اليوم</div>
                      <div className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">{orders.filter(o => (o.created_at || o.date).includes(new Date().toISOString().split('T')[0])).length}</div>
                    </div>
                    <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 hover:border-orange-500/30 transition-all group">
                      <div className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest">بدون فني</div>
                      <div className={`text-2xl font-black ${orders.filter(o => !o.technician || o.technician === '-' || o.technician === '').length > 0 ? 'text-orange-500 animate-pulse' : 'text-white'}`}>
                        {orders.filter(o => !o.technician || o.technician === '-' || o.technician === '').length}
                      </div>
                    </div>
                    <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 hover:border-red-500/30 transition-all group">
                      <div className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest">متأخرة ⚠️</div>
                      <div className={`text-2xl font-black ${orders.filter(o => isDelayed(o)).length > 0 ? 'text-red-500' : 'text-white'}`}>
                        {orders.filter(o => isDelayed(o)).length}
                      </div>
                    </div>
	                    <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 hover:border-green-500/30 transition-all group">
	                      <div className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest">قيد التنفيذ</div>
	                      <div className="text-2xl font-black text-blue-400">{orders.filter(o => o.status === 'in-progress').length}</div>
	                    </div>
	                    <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 hover:border-emerald-500/30 transition-all group cursor-pointer" onClick={() => { clearFilters(); setFilterWarranty('active'); setFilterStatus('completed'); }}>
	                      <div className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest">ضمان ساري 🛡️</div>
	                      <div className="text-2xl font-black text-emerald-400">{orders.filter(o => getWarrantyStatus(o).status === 'active').length}</div>
	                    </div>
	                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 border border-slate-700 shadow-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="text-green-500" />
                      <h3 className="text-lg font-black text-white">الرصيد الحالي</h3>
                    </div>
                    <div className="text-4xl font-black text-green-400 tabular-nums">{cashBalance.toLocaleString()} <span className="text-sm text-green-600">ج.م</span></div>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <button onClick={() => setActiveTab('cash')} className="flex-1 bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white py-3 rounded-2xl text-xs font-black transition-all">إدارة الخزنة</button>
                    <button onClick={() => setActiveTab('reports')} className="flex-1 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white py-3 rounded-2xl text-xs font-black transition-all">التقارير</button>
                  </div>
                </div>
              </div>
	            <div className="bg-slate-900 rounded-xl p-4 flex flex-col gap-4">
		              <div className="flex flex-wrap gap-3 items-center">
		                <div className="relative flex-1 min-w-[200px]"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><input type="text" placeholder={isViewer ? "بحث بالاسم أو رقم الأوردر..." : "بحث بالاسم أو الهاتف أو رقم الأوردر..."} className="w-full pr-10 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
		                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
		                  <option value="all">جميع الحالات</option><option value="pending">قيد الانتظار</option><option value="in-progress">قيد التنفيذ</option><option value="inspected">تم الكشف</option><option value="completed">مكتمل</option><option value="cancelled">ملغي</option><option value="deferred">مؤجل</option>
		                </select>
		                <select value={filterTechnician} onChange={e => setFilterTechnician(e.target.value)} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"><option value="">جميع الفنيين</option>{technicians.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select>
		                <select value={filterDeviceType} onChange={e => setFilterDeviceType(e.target.value)} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"><option value="">جميع الأجهزة</option>{DEVICE_TYPES.map(d => <option key={d}>{d}</option>)}</select>
		              </div>

		              <div className="flex flex-wrap gap-2 items-center border-t border-slate-800 pt-3">
		                <span className="text-xs text-slate-500 ml-2">فلترة سريعة:</span>
		                <button onClick={() => { clearFilters(); const today = new Date().toISOString().split('T')[0]; setFilterDateFrom(today); setFilterDateTo(today); }} className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-3 py-1 rounded-full text-xs border border-blue-600/30 transition">📅 أوردرات اليوم</button>
		                <button onClick={() => { clearFilters(); setFilterStatus('all'); setSearchTerm('');
		                  setFilterTechnician('__NONE__');
		                }} className="bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 px-3 py-1 rounded-full text-xs border border-orange-600/30 transition">👨‍🔧 بدون فني</button>
			                <button onClick={() => { clearFilters(); setFilterStatus('__UNPAID__');
			                }} className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1 rounded-full text-xs border border-red-600/30 transition">💰 بانتظار التحصيل</button>
			                <button onClick={() => { clearFilters(); setFilterWarranty('expiring'); setFilterStatus('completed'); }} className="bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 px-3 py-1 rounded-full text-xs border border-orange-600/30 transition">🛡️ ينتهي قريباً</button>
			                <div className="h-4 w-[1px] bg-slate-700 mx-1"></div>
		                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="p-1 bg-slate-800 border border-slate-700 rounded text-xs text-white" />
		                <span className="text-slate-600 text-xs">إلى</span>
		                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="p-1 bg-slate-800 border border-slate-700 rounded text-xs text-white" />
		                <button onClick={() => setFilterDelay(filterDelay==='delayed'?'all':'delayed')} className={`px-3 py-1 rounded-full text-xs transition ${filterDelay==='delayed'?'bg-red-600 text-white':'bg-slate-800 text-slate-300 border border-slate-700'}`}>⚠️ المتأخرة</button>
		                <button onClick={clearFilters} className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs border border-slate-700 hover:bg-slate-700 transition">مسح</button>
		              </div>
		            </div>

		            <div className="flex flex-wrap gap-3 items-center">
		              <button onClick={() => setShowAllOrders(!showAllOrders)} className={`px-3 py-2 rounded-lg text-sm transition ${showAllOrders ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{showAllOrders ? '📋 إخفاء المنجز' : '📋 عرض الكل'}</button>
		              {canEditDelete() && <button onClick={() => { setEditingOrder(null); setFormData({ customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '', status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false, date: new Date().toLocaleDateString("ar-EG") }); setShowOrderModal(true); }} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> أوردر جديد</button>}
		              <button onClick={() => setShowDeleted(!showDeleted)} className={`px-3 py-2 rounded-lg text-sm transition ${showDeleted ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}><Trash2 size={16} /> {showDeleted ? 'إخفاء المحذوفة' : `عرض المحذوفة (${deletedOrders.length})`}</button>
		              			              <div className="flex gap-2 ml-auto">
	                        <button onClick={fetchData} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg" title="تحديث البيانات"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
	                      </div>

		            </div>

            {!showDeleted && filteredOrders.length === 0 && !showAllOrders && <div className="text-center py-8 text-slate-400">لا توجد أوردرات (قيد الانتظار، قيد التنفيذ، أو بدون فني). اضغط "عرض الكل" لمشاهدة جميع الأوردرات.</div>}

	            {!showDeleted && filteredOrders.length > 0 && (
	              <div className="space-y-4 mb-6">
                  {/* شريط الإحصائيات السريع */}
	                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
	                  <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4 text-center hover:bg-blue-600/20 transition-all group">
	                    <div className="text-3xl font-black text-blue-400 group-hover:scale-110 transition-transform">{filteredOrders.filter(o => o.status === 'in-progress').length}</div>
	                    <div className="text-xs font-bold text-blue-300/70 mt-1 uppercase tracking-wider">🔧 قيد التنفيذ</div>
	                  </div>
	                  <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4 text-center hover:bg-red-600/20 transition-all group">
	                    <div className="text-3xl font-black text-red-400 group-hover:scale-110 transition-transform">{filteredOrders.filter(o => isDelayed(o)).length}</div>
	                    <div className="text-xs font-bold text-red-300/70 mt-1 uppercase tracking-wider">⚠️ متأخرة</div>
	                  </div>
	                  <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4 text-center hover:bg-green-600/20 transition-all group">
	                    <div className="text-3xl font-black text-green-400 group-hover:scale-110 transition-transform">{filteredOrders.filter(o => o.status === 'completed').length}</div>
	                    <div className="text-xs font-bold text-green-300/70 mt-1 uppercase tracking-wider">✅ مكتملة</div>
	                  </div>
	                  <div className="bg-purple-600/10 border border-purple-600/30 rounded-xl p-4 text-center hover:bg-purple-600/20 transition-all group">
	                    <div className="text-3xl font-black text-purple-400 group-hover:scale-110 transition-transform">{filteredOrders.length}</div>
	                    <div className="text-xs font-bold text-purple-300/70 mt-1 uppercase tracking-wider">📄 الإجمالي</div>
	                  </div>
	                </div>

                  {/* لوحة التقارير البيانية المصغرة */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <LayoutDashboard size={16} className="text-orange-500" /> تحليل حالة العمل
                      </h3>
                      <span className="text-[10px] text-slate-500">تحديث تلقائي</span>
                    </div>
                    <div className="space-y-3">
                      {['pending', 'in-progress', 'completed', 'cancelled'].map(status => {
                        const count = filteredOrders.filter(o => o.status === status).length;
                        const percentage = filteredOrders.length > 0 ? (count / filteredOrders.length) * 100 : 0;
                        const color = status === 'completed' ? 'bg-green-500' : status === 'in-progress' ? 'bg-blue-500' : status === 'pending' ? 'bg-yellow-500' : 'bg-red-500';
                        const label = status === 'completed' ? 'مكتمل' : status === 'in-progress' ? 'قيد التنفيذ' : status === 'pending' ? 'قيد الانتظار' : 'ملغي';

                        return (
                          <div key={status} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-400">{label}</span>
                              <span className="text-slate-200">{count} أوردر ({Math.round(percentage)}%)</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`${color} h-full transition-all duration-1000 ease-out`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
	              </div>
	            )}

            {/* نظام التبويبات الذكي (Kanban Mobile) */}
                <div className="flex flex-nowrap gap-3 overflow-x-auto no-scrollbar pb-3 mb-4 sticky top-[60px] z-30 bg-slate-950/80 backdrop-blur-md py-2 -mx-4 px-4">
                  {[
                    { id: 'all', label: 'الكل', color: 'slate' },
                    { id: 'pending', label: 'قيد الانتظار', color: 'amber' },
                    { id: 'in-progress', label: 'قيد التنفيذ', color: 'blue' },
                    { id: 'inspected', label: 'تم الكشف', color: 'cyan' },
                    { id: 'completed', label: 'مكتمل', color: 'emerald' },
                    { id: 'cancelled', label: 'ملغي', color: 'rose' },
                    { id: 'deferred', label: 'مؤجل', color: 'purple' }
                  ].map(tab => {
                    const count = tab.id === 'all' ? dateFilteredOrders.length : dateFilteredOrders.filter(o => o.status === tab.id).length;
                    const isActive = filterStatus === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setFilterStatus(tab.id)}
                        className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl whitespace-nowrap transition-all border-2 ${
                          isActive
                          ? `bg-${tab.color}-600 border-${tab.color}-500 text-white shadow-lg shadow-${tab.color}-900/20 scale-105`
                          : `bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700`
                        }`}
                      >
                        <span className="text-xs font-black">{tab.label}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20' : 'bg-slate-800'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {!showDeleted && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map(order => {
                  const delayed = isDelayed(order);
                  const noTechnician = !order.technician || order.technician === '-' || order.technician === '';
                  const statusConfig = {
                    pending: { color: 'amber', label: '⏳ قيد الانتظار', pulse: 'animate-pulse' },
                    'in-progress': { color: 'blue', label: '🔧 قيد التنفيذ', pulse: '' },
                    completed: { color: 'emerald', label: '✅ مكتمل', pulse: '' },
                    cancelled: { color: 'rose', label: '❌ ملغي', pulse: '' },
                    deferred: { color: 'purple', label: '⏰ مؤجل', pulse: '' },
                    inspected: { color: 'cyan', label: '🔍 تم الكشف', pulse: '' }
                  };
                  const config = statusConfig[order.status] || { color: 'slate', label: order.status, pulse: '' };
                  const cardColor = config.color;
                  const isPending = order.status === 'pending';

                  const statusColor =
                    order.status === 'completed' ? 'green' :
                    order.status === 'in-progress' ? 'blue' :
                    order.status === 'pending' ? 'yellow' :
                    order.status === 'cancelled' ? 'red' :
                    order.status === 'deferred' ? 'purple' : 'slate';

                  return (
                    <div key={order.id} className={`group bg-${cardColor}-950/10 rounded-[1.5rem] border-2 border-${cardColor}-500/30 p-5 transition-all hover:border-${cardColor}-500 hover:shadow-2xl hover:shadow-${cardColor}-500/20 relative overflow-hidden ${config.pulse}`}>
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-orange-500/10 transition-all`}></div>

                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex flex-col gap-1">
	                          <div className="flex items-center gap-2">
	                            <h3 className="text-lg font-black text-white group-hover:text-orange-400 transition-colors">{order.customer_name}</h3>
	                            {isNewOrder(order) && <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping"></span>}
	                            {getWarrantyStatus(order).status !== 'none' && (
	                              <div className={`px-2 py-0.5 rounded-full text-[8px] font-black bg-${getWarrantyStatus(order).color}-500/20 text-${getWarrantyStatus(order).color}-400 border border-${getWarrantyStatus(order).color}-500/30 flex items-center gap-1`}>
	                                <ShieldCheck size={8} /> {getWarrantyStatus(order).text}
	                              </div>
	                            )}
	                          </div>
                          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">#{order.order_number}</span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black border border-${cardColor}-500/30 bg-${cardColor}-500/10 text-${cardColor}-400`}>{config.label}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
                        <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50">
                          <p className="text-[9px] font-bold text-slate-500 mb-1">الجهاز والماركة</p>
                          <p className="text-xs font-black text-slate-200">{order.device_type} - {order.brand}</p>
                        </div>
                        <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50">
                          <p className="text-[9px] font-bold text-slate-500 mb-1">إجمالي المبلغ</p>
                          <p className="text-xs font-black text-orange-400">{order.total_amount} ج.م</p>
                        </div>
                      </div>

                                            {/* صور قطع الغيار */}
                      {(getPhotoUrl(order.technician_note, 'OLD') || getPhotoUrl(order.technician_note, 'NEW')) && (
                        <div className="grid grid-cols-2 gap-2 mb-4 relative z-10">
                          {getPhotoUrl(order.technician_note, 'OLD') && (
                            <div className="group/photo relative">
                              <p className="text-[8px] font-bold text-rose-400 mb-1">القطع القديمة</p>
                              <img
                                src={getPhotoUrl(order.technician_note, 'OLD')}
                                alt="صورة القطعة القديمة في تقرير الفني"
                                className="w-full h-16 object-cover rounded-xl border border-rose-500/20 cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => window.open(getPhotoUrl(order.technician_note, 'OLD'), '_blank')}
                              />
                            </div>
                          )}
                          {getPhotoUrl(order.technician_note, 'NEW') && (
                            <div className="group/photo relative">
                              <p className="text-[8px] font-bold text-emerald-400 mb-1">القطع الجديدة</p>
                              <img
                                src={getPhotoUrl(order.technician_note, 'NEW')}
                                alt="صورة القطعة الجديدة في تقرير الفني"
                                className="w-full h-16 object-cover rounded-xl border border-emerald-500/20 cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => window.open(getPhotoUrl(order.technician_note, 'NEW'), '_blank')}
                              />
                            </div>
                          )}
                        </div>
                      )}
<div className="space-y-2.5 mb-6 relative z-10">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500"><MapPin size={12} /></div>
                          <span className="line-clamp-1">{order.address || 'لا يوجد عنوان مسجل'}</span>
                        </div>
	                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
	                          <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500"><Users size={12} /></div>
	                          <div className="flex-1 flex items-center justify-between">
	                            <span>الفني: <span className={noTechnician ? 'text-orange-500 font-black animate-pulse' : 'text-slate-200 font-bold'}>{order.technician || 'لم يتم التعيين بعد'}</span></span>
	                            {!noTechnician && canEditDelete() && (
	                              <button 
	                                onClick={() => pingTechnician(order.technician)}
	                                className="p-1 bg-orange-600/20 text-orange-500 rounded-lg hover:bg-orange-600 hover:text-white transition-all"
	                                title="تنبيه الفني الآن"
	                              >
	                                <Bell size={12} className="animate-pulse" />
	                              </button>
	                            )}
	                          </div>
	                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500"><Clock size={12} /></div>
                          <span>{new Date(order.created_at || order.date).toLocaleDateString('ar-EG')} - {new Date(order.created_at || order.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {!isViewer && <div className="flex items-center gap-2 relative z-10 pt-4 border-t border-slate-800/50">
                        <a href={`tel:${order.phone}`} className="flex-1 h-10 bg-slate-800 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95">
                          <Phone size={14} /> <span className="text-[10px] font-black">اتصال</span>
                        </a>
                        <button onClick={() => sendWhatsApp(order.phone, `مرحباً أ/ ${order.customer_name}، معك مركز الصيانة بخصوص طلبك رقم ${order.order_number}`)} className="flex-1 h-10 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                          <Send size={14} /> <span className="text-[10px] font-black">واتساب</span>
                        </button>
                        {canEditDelete() && <div className="flex gap-1.5">
                          <button onClick={() => { setEditingOrder(order); setFormData(order); setShowOrderModal(true); }} className="w-10 h-10 bg-slate-800 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-95"><Edit size={16} /></button>
                          <button onClick={() => deleteOrder(order.id)} className="w-10 h-10 bg-slate-800 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-95"><Trash2 size={16} /></button>
                        </div>}
                      </div>}

                      {delayed && (
                        <div className="absolute top-2 left-2 bg-rose-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-bounce shadow-lg">متأخر ⚠️</div>
                      )}

                      {canEditDelete() && <div className="mt-3 flex gap-2 relative z-10">
                         <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)} className="text-[10px] bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white flex-1">
                           <option value="pending">تغيير الحالة</option><option value="in-progress">قيد التنفيذ</option><option value="inspected">تم الكشف</option><option value="completed">مكتمل</option><option value="cancelled">ملغي</option><option value="deferred">مؤجل</option>
                         </select>
                         <button onClick={() => togglePaidStatus(order.id, order.is_paid)} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${order.is_paid ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                           {order.is_paid ? 'تم التحصيل' : 'تحصيل؟'}
                         </button>
                      </div>}


                      {order.status === 'completed' && canEditDelete() && (
                        <div className="mt-4 pt-4 border-t border-slate-800/50 relative z-10">
                          <p className="text-[10px] font-bold text-slate-500 mb-2">تقييم أداء الفني:</p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                onClick={() => updateOrderRating(order.id, star)}
                                className={`transition-all ${star <= (order.rating || 0) ? 'text-yellow-500 scale-110' : 'text-slate-700 hover:text-slate-500'}`}
                              >
                                <Star size={18} fill={star <= (order.rating || 0) ? 'currentColor' : 'none'} />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {!isViewer && <div className="mt-2 flex gap-1 relative z-10">
                        {order.status === 'completed' ? (
                          <button onClick={() => window.open(`/invoice?id=${order.id}`, '_blank')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 rounded-lg text-[10px] font-bold">📄 فاتورة</button>
                        ) : (
                          <button onClick={() => window.open(`/pickup-receipt?id=${order.id}`, '_blank')} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-1 rounded-lg text-[10px] font-bold">📋 إيصال</button>
                        )}
                        {order.status === 'completed' && canEditDelete() && (
                          <button onClick={() => sendFeedbackRequest(order)} className="w-full bg-yellow-600/20 hover:bg-yellow-600 text-yellow-300 hover:text-white py-1 rounded-lg text-[10px] font-bold">⭐ طلب تقييم</button>
                        )}
                        {order.status === 'in-progress' && canEditDelete() && (
                          <button onClick={() => { setSelectedOrder(order); setSettleForm({ total_amount: order.total_amount || 0, parts_cost: order.parts_cost || 0, transport_cost: order.transport_cost || 0, net_amount: order.net_amount || 0, technician_share: order.technician_share || 0, company_share: order.company_share || 0 }); setShowSettleModal(true); }} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-1 rounded-lg text-[10px] font-bold">💰 تصفية</button>
                        )}
                      </div>}
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
                    <div className="grid grid-cols-2 gap-1 mt-2 text-sm">{!isViewer && <div className="text-slate-300">📞 {order.phone}</div>}<div className="text-slate-300">🔧 {order.device_type} - {order.brand}</div><div className="col-span-2 text-slate-300">📍 {order.address}</div><div className="col-span-2 text-slate-300">📝 {order.problem_description}</div><div className="text-slate-300">💰 {order.total_amount} ج.م</div><div className="text-slate-300">👨‍🔧 {order.technician || '-'}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'archived' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-2xl">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Plus className="rotate-45 text-indigo-400" /> أرشيف الأوردرات القديمة
                </h2>
                <p className="text-xs text-slate-400 mt-1">الأوردرات التي مر عليها أكثر من 30 يوماً ولم تكتمل بعد.</p>
              </div>
              <div className="bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                {archivedOrders.length} أوردر
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArchivedOrders.length === 0 && (
                <div className="col-span-full text-center py-20 bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-800">
                  <Plus className="w-12 h-12 text-slate-700 mx-auto mb-4 rotate-45" />
                  <p className="text-slate-500 font-bold">لا توجد أوردرات في الأرشيف حالياً</p>
                </div>
              )}
              {filteredArchivedOrders.map(order => {
                const statusConfig = {
                  pending: { color: 'amber', label: '⏳ قيد الانتظار' },
                  'in-progress': { color: 'blue', label: '🔧 قيد التنفيذ' },
                  completed: { color: 'emerald', label: '✅ مكتمل' },
                  cancelled: { color: 'rose', label: '❌ ملغي' },
                  deferred: { color: 'purple', label: '⏰ مؤجل' },
                  inspected: { color: 'cyan', label: '🔍 تم الكشف' }
                };
                const config = statusConfig[order.status] || { color: 'slate', label: order.status };
                const cardColor = config.color;

                return (
                  <div key={order.id} className="bg-slate-900/40 rounded-[1.5rem] border border-slate-800 p-5 opacity-80 hover:opacity-100 transition-all hover:border-indigo-500/50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-md font-bold text-white">{order.customer_name}</h3>
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">#{order.order_number}</span>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-[9px] font-bold border border-${cardColor}-500/30 bg-${cardColor}-500/10 text-${cardColor}-400`}>{config.label}</div>
                    </div>
                    <div className="space-y-2 text-xs text-slate-400">
                      <p>🔧 {order.device_type} - {order.brand}</p>
                      <p>📍 {order.address || 'بدون عنوان'}</p>
                      <p>⏰ {new Date(order.created_at || order.date).toLocaleDateString('ar-EG')}</p>
                      <p className="text-indigo-400 font-bold">💰 {order.total_amount} ج.م</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-800 flex gap-2">
                      {!isViewer && <a href={`tel:${order.phone}`} className="flex-1 bg-slate-800 text-white py-2 rounded-xl text-center text-[10px] font-bold">اتصال</a>}
                      {canEditDelete() && (
                        <button 
                          onClick={() => { setEditingOrder(order); setFormData(order); setShowOrderModal(true); }}
                          className="px-3 bg-slate-800 text-blue-400 rounded-xl"
                        >
                          <Edit size={14} />
                        </button>
                      )}
                      {canEditDelete() && (
                        <button 
                          onClick={() => deleteOrder(order.id)}
                          className="px-3 bg-slate-800 text-rose-400 rounded-xl"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'technicians' && userRole !== 'viewer' && (
          <div className="bg-slate-900 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <button onClick={() => setFilterTechStatus('active')} className={`px-3 py-1 rounded-full text-sm ${filterTechStatus==='active'?'bg-orange-600 text-white':'bg-slate-800 text-slate-300'}`}>النشطون</button>
                <button onClick={() => setFilterTechStatus('inactive')} className={`px-3 py-1 rounded-full text-sm ${filterTechStatus==='inactive'?'bg-orange-600 text-white':'bg-slate-800 text-slate-300'}`}>غير النشطون</button>
                <button onClick={() => setFilterTechStatus('all')} className={`px-3 py-1 rounded-full text-sm ${filterTechStatus==='all'?'bg-orange-600 text-white':'bg-slate-800 text-slate-300'}`}>الجميع</button>
              </div>
              {canEditDelete() && <button onClick={() => { setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true, username: '', password: '', profit_percentage: 50 }); setShowTechModal(true); }} className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> إضافة فني</button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTechnicians.map(tech => (
                <div key={tech.id} className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3"><Users className="w-8 h-8 text-orange-500" /></div>
                  <h3 className="font-bold text-white">{tech.name}</h3>
                  <p className="text-xs text-slate-400">{tech.specialization}</p>
                  <p className="text-xs text-slate-400 mt-1">نسبة الأرباح: {tech.profit_percentage ?? 50}%</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => copyTechLink(tech)} className="flex-1 bg-slate-700 text-slate-300 py-1 rounded text-xs flex items-center justify-center gap-1">{copiedId===tech.id?<Check size={14}/>:<Copy size={14}/>} نسخ</button>
                    {canEditDelete() && <>
                      <button onClick={() => { setEditingTech(tech); setTechForm(tech); setShowTechModal(true); }} className="p-1 text-blue-500"><Edit size={16}/></button>
                      <button onClick={() => deleteTechnician(tech.id, tech.name)} className="p-1 text-red-500"><Trash2 size={16}/></button>
                      <button onClick={() => toggleTechnicianActive(tech)} className={`p-1 ${tech.is_active!==false?'text-green-500':'text-red-500'}`}>{tech.is_active!==false?'نشط':'تعطيل'}</button>
                      <button onClick={() => updateAllPendingOrdersProfit(tech.name, tech.profit_percentage ?? 50)} className="p-1 text-purple-500 hover:text-purple-400" title="تحديث نسب الأوردرات غير المكتملة لهذا الفني"><RefreshCw size={16}/></button>
                    </>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && userRole !== 'viewer' && (
          <div className="bg-slate-900 rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div><label className="block text-sm text-slate-400 mb-1">نوع التقرير</label>
                <select value={reportType} onChange={(e) => setReportType(e.target.value as any)} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-white">
                  <option value="cash">الخزنة</option><option value="pending_orders">أوردرات غير منفذة (متأخرة)</option><option value="cancelled_orders">أوردرات ملغية</option>
                  <option value="tech_performance">أداء الفنيين</option><option value="profits">💰 أرباح الشركاء</option><option value="expenses">💸 المصروفات</option><option value="comparison">📊 مقارنة (إيرادات / مصروفات / أرباح)</option>
                </select>
              </div>
              <div><label className="block text-sm text-slate-400 mb-1">من تاريخ</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" /></div>
              <div><label className="block text-sm text-slate-400 mb-1">إلى تاريخ</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" /></div>
              <div><label className="block text-sm text-slate-400 mb-1">الفني</label><select value={filterTechnicianReport} onChange={(e) => setFilterTechnicianReport(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-white min-w-[150px]"><option value="">الكل</option>{technicians.map(tech => <option key={tech.id} value={tech.name}>{tech.name}</option>)}</select></div>
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

        {activeTab === 'invoicesReview' && userRole !== 'viewer' && (
          <div className="space-y-3">
            {orders.filter(o=>o.status==='completed' && !o.invoice_approved).map(order => (
              <div key={order.id} className="bg-slate-900 rounded-xl p-4 flex justify-between items-center flex-wrap gap-3 border border-slate-800">
                <div><p className="font-bold text-white">{order.customer_name}</p><p className="text-sm text-slate-400">{order.device_type} - {order.brand}</p><p className="text-orange-400">المبلغ: {order.total_amount} ج.م</p></div>
                {canEditDelete() && <button onClick={()=>printAndSendInvoice(order)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Printer size={16}/> طباعة الفاتورة</button>}
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
                {canEditDelete() && <button onClick={()=>{setEditingCash(null); setCashForm({type:'expense',amount:0,description:'',date:new Date().toISOString().split('T')[0]}); setShowCashModal(true);}} className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={16}/> حركة جديدة</button>}
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
              <table className="w-full text-sm"><thead className="bg-slate-800"><tr><th className="p-3">التاريخ</th><th>النوع</th><th>المبلغ</th><th>الوصف</th><th>إجراءات</th></tr></thead>
              <tbody>{cashLedger.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-800">
                  <td className="p-3 text-slate-300">{entry.date}</td>
                  <td className="text-slate-300">{entry.type==='income'?'💰 دخل':entry.type==='expense'?'💸 مصروف':'📤 توزيع أرباح'}</td>
                  <td className={entry.type==='income'?'text-green-400':'text-red-400'}>{entry.amount} ج.م</td>
                  <td className="max-w-xs break-words text-slate-300">{entry.description}</td>
                  <td>{canEditDelete() && <button onClick={()=>deleteCashEntry(entry.id)} className="text-red-400"><Trash2 size={16}/></button>}</td>
                </tr>
              ))}</tbody></table>
            </div>
          </div>
        )}

        {activeTab === 'partners' && userRole !== 'viewer' && (
          <div className="space-y-4">
            <div className="flex justify-end">{canEditDelete() && <button onClick={()=>{setEditingPartner(null); setPartnerForm({name:'',share_percentage:0,phone:'',is_active:true}); setShowPartnerModal(true);}} className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><UserPlus size={16}/> إضافة شريك</button>}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partners.map(partner => (
                <div key={partner.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                  <div className="flex justify-between"><h3 className="font-bold text-white">{partner.name}</h3><span className={`text-xs px-2 py-1 rounded-full ${partner.is_active?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}`}>{partner.is_active?'نشط':'غير نشط'}</span></div>
                  <p className="text-2xl font-bold text-orange-500 mt-2">{partner.share_percentage}%</p>
                  <p className="text-sm text-slate-400">📞 {partner.phone||'لا يوجد'}</p>
                  {canEditDelete() && <div className="flex gap-2 mt-3"><button onClick={()=>{setEditingPartner(partner); setPartnerForm(partner); setShowPartnerModal(true);}} className="text-blue-500"><Edit size={16}/></button><button onClick={()=>deletePartner(partner.id, partner.name)} className="text-red-500"><Trash2 size={16}/></button></div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-3">
            <div className="flex justify-between"><h2 className="text-xl font-bold">🔔 سجل الإشعارات</h2>{userRole === 'admin' && notifications.length>0 && <button onClick={deleteAllNotifications} className="bg-red-500/20 text-red-400 px-3 py-1 rounded-lg text-sm flex items-center gap-1"><Trash size={14}/> مسح الكل</button>}</div>
            {notifications.map(notif=>{
              const isLogin = notif.action?.includes('دخول');
              const isOrder = notif.action?.includes('أوردر') || notif.action?.includes('طلب');
              const isMoney = notif.action?.includes('خزنة') || notif.action?.includes('أرباح');
              
              return (
                <div key={notif.id} className={`bg-slate-900 rounded-2xl p-4 flex justify-between items-center border-l-4 ${
                  isLogin ? 'border-blue-500' : isOrder ? 'border-orange-500' : isMoney ? 'border-emerald-500' : 'border-slate-700'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isLogin ? 'bg-blue-500/10 text-blue-400' : isOrder ? 'bg-orange-500/10 text-orange-400' : isMoney ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isLogin ? <LogIn size={18} /> : isMoney ? <DollarSign size={18} /> : <Bell size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                          isLogin ? 'bg-blue-500/20 text-blue-400' : isOrder ? 'bg-orange-500/20 text-orange-400' : isMoney ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {notif.action}
                        </span>
                        <span className="text-[10px] text-slate-500">{new Date(notif.created_at).toLocaleString('ar-EG')}</span>
                      </div>
                      <p className="text-sm text-slate-300 mt-1 font-medium">{notif.details}</p>
                    </div>
                  </div>
                  {userRole === 'admin' && (
                    <button onClick={()=>deleteNotification(notif.id)} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-500 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center">
                      <Trash2 size={14}/>
                    </button>
                  )}
                </div>
              );
            })}
            {notifications.length===0 && <div className="text-center py-8 text-slate-400">لا توجد إشعارات</div>}
          </div>
        )}


        {/* تبويب الإحصائيات الذكية */}
        {activeTab === 'feedback' && canEditDelete() && (
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
              <h2 className="text-xl font-black text-white">⭐ تقييمات العملاء</h2>
              <p className="text-sm text-slate-400 mt-2">تظهر هنا التقييمات التي يرسلها العملاء من رابط التقييم بعد إتمام الخدمة.</p>
            </div>
            {(() => {
              const feedbackItems = notifications.filter((notification) => notification.action === 'تقييم عميل');
              const scores = feedbackItems.map((notification) => Number((notification.details || '').match(/(\d+)\/5/)?.[1] || 0)).filter(Boolean);
              const average = scores.length ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) : '-';
              return (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-center"><div className="text-3xl font-black text-yellow-400">{average}</div><div className="text-xs text-slate-400 mt-1">متوسط التقييم</div></div>
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-center"><div className="text-3xl font-black text-orange-400">{feedbackItems.length}</div><div className="text-xs text-slate-400 mt-1">إجمالي التقييمات</div></div>
                  </div>
                  <div className="space-y-3">
                    {feedbackItems.map((notification) => (
                      <div key={notification.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
                        <div className="flex justify-between gap-3 items-start"><span className="text-yellow-400 font-black">{notification.details?.match(/(\d+)\/5/)?.[1] || '-'} / 5 ⭐</span><span className="text-xs text-slate-500">{new Date(notification.created_at).toLocaleString('ar-EG')}</span></div>
                        <p className="text-slate-200 mt-3 leading-7">{notification.details}</p>
                      </div>
                    ))}
                    {feedbackItems.length === 0 && <div className="text-center py-10 text-slate-400">لا توجد تقييمات عملاء حتى الآن.</div>}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* أفضل الفنيين */}
              <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-2xl">
                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3"><Users className="text-blue-500" /> أفضل الفنيين</h3>
                <div className="space-y-4">
                  {technicians
                    .map(t => {
                      const techOrders = orders.filter(o => o.technician === t.name);
                      const total = techOrders.length;
                      const completed = techOrders.filter(o => o.status === 'completed').length;
                      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                      const totalParts = techOrders.reduce((sum, o) => sum + (Number(o.parts_cost) || 0), 0);
                      const totalTransport = techOrders.reduce((sum, o) => sum + (Number(o.transport_cost) || 0), 0);
                      const totalRevenue = techOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
                      const partsPercent = totalRevenue > 0 ? Math.round((totalParts / totalRevenue) * 100) : 0;
                      const transportPercent = totalRevenue > 0 ? Math.round((totalTransport / totalRevenue) * 100) : 0;
                      return { name: t.name, total, completed, percentage, totalParts, totalTransport, totalRevenue, partsPercent, transportPercent };
                    })
                    .sort((a, b) => b.percentage - a.percentage || b.completed - a.completed)
                    .slice(0, 5)
                    .map((t, i) => (
                      <div key={i} className="flex flex-col gap-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-300">{t.name}</span>
                          <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black">{t.completed} / {t.total} مكتمل</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${t.percentage}%` }}></div>
                          </div>
                          <span className="text-[10px] font-black text-slate-400">{t.percentage}%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800/30 relative overflow-hidden">
                            <div className="absolute bottom-0 left-0 h-0.5 bg-rose-500/30" style={{ width: `${t.partsPercent}%` }}></div>
                            <div className="flex justify-between items-start">
                              <p className="text-[8px] font-bold text-slate-500 mb-0.5">⚙️ قطع غيار</p>
                              <span className="text-[7px] font-black text-rose-500/50">{t.partsPercent}%</span>
                            </div>
                            <p className="text-[10px] font-black text-rose-400">{t.totalParts.toLocaleString()} ج.م</p>
                          </div>
                          <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800/30 relative overflow-hidden">
                            <div className="absolute bottom-0 left-0 h-0.5 bg-amber-500/30" style={{ width: `${t.transportPercent}%` }}></div>
                            <div className="flex justify-between items-start">
                              <p className="text-[8px] font-bold text-slate-500 mb-0.5">🚗 مواصلات</p>
                              <span className="text-[7px] font-black text-amber-500/50">{t.transportPercent}%</span>
                            </div>
                            <p className="text-[10px] font-black text-amber-400">{t.totalTransport.toLocaleString()} ج.م</p>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                  {technicians.length === 0 && <p className="text-center text-slate-500 py-4">لا يوجد فنيون مسجلون</p>}
                </div>
              </div>

              {/* توزيع الأجهزة */}
              <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-2xl">
                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3"><Cpu className="text-orange-500" /> توزيع الأجهزة</h3>
                <div className="space-y-4">
                  {['غسالة', 'ثلاجة', 'بوتاجاز', 'سخان', 'تكييف', 'ميكروويف'].map(device => {
                    const count = orders.filter(o => o.device_type === device).length;
                    const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
                    if (count === 0) return null;
                    return (
                      <div key={device} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-400">{device}</span>
                          <span className="text-slate-200">{count} ({Math.round(percentage)}%)</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-orange-500 h-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                  {orders.length === 0 && <p className="text-center text-slate-500 py-4">لا توجد بيانات متاحة</p>}
                </div>
              </div>

              {/* أكثر الماركات عطلاً */}
              <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-2xl">
                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3"><Star className="text-yellow-500" /> أكثر الماركات عطلاً</h3>
                <div className="flex flex-wrap gap-2">
                  {['سامسونج', 'LG', 'توشيبا', 'شارب', 'زانوسي', 'فريش', 'وايت ويل', 'أريستون', 'إنديست', 'بيكو', 'يونيون إير', 'هوفر'].map(brand => {
                    const count = orders.filter(o => o.brand === brand).length;
                    if (count === 0) return null;
                    return (
                      <div key={brand} className="bg-slate-950/50 border border-slate-800 px-4 py-3 rounded-2xl flex flex-col items-center min-w-[80px] flex-1">
                        <span className="text-[10px] text-slate-500 font-bold">{brand}</span>
                        <span className="text-lg font-black text-white">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && userRole !== 'viewer' && <TechnicianPerformance orders={orders} technicians={technicians} />}
        {activeTab === 'permissions' && userRole === 'admin' && (
          <AdminPermissions 
            users={users} 
            canEdit={userRole === 'admin'} 
            onEdit={(u) => { setEditingUserAccount(u); setUserForm(u || { name: '', username: '', password: '', role: 'viewer', is_active: true }); setShowUserModal(true); }}
            onDelete={deleteUserAccount}
            onToggle={toggleUserAccountStatus}
          />
        )}
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="text-[10px] text-slate-500 opacity-20">
            Maintenance Guide © 2026 - All Rights Reserved
          </div>
          <div className="text-[8px] text-slate-500 opacity-10">v1.5.3-direct-whatsapp</div>
        </div>
      </div>

      {showOrderModal && canEditDelete() && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-2xl shadow-xl">
            <div className="flex justify-between mb-4"><h3 className="text-xl font-bold text-white">{editingOrder ? 'تعديل أوردر' : 'أوردر جديد'}</h3><button onClick={() => setShowOrderModal(false)} className="text-slate-400"><X size={20} /></button></div>
            <form onSubmit={saveOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-slate-400">اسم العميل</label><input type="text" value={formData.customer_name} onChange={e => handleFormChange('customer_name', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" required /></div>
                <div><label className="text-sm text-slate-400">رقم الهاتف</label><input type="text" value={formData.phone} onChange={e => handleFormChange('phone', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" required /></div>
                <div><label className="text-sm text-slate-400">نوع الجهاز</label><select value={formData.device_type} onChange={e => handleFormChange('device_type', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"><option value="">اختر</option>{DEVICE_TYPES.map(d => <option key={d}>{d}</option>)}<option value="other">أخرى</option></select>{isOtherDevice && <input type="text" placeholder="جهاز مخصص" value={customDevice} onChange={e => setCustomDevice(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 mt-2 text-white" required />}</div>
                <div><label className="text-sm text-slate-400">الماركة</label><select value={formData.brand} onChange={e => handleFormChange('brand', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"><option value="">اختر</option>{BRANDS.map(b => <option key={b}>{b}</option>)}<option value="other">أخرى</option></select>{isOtherBrand && <input type="text" placeholder="ماركة مخصصة" value={customBrand} onChange={e => setCustomBrand(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 mt-2 text-white" required />}</div>
                <div className="col-span-2"><label className="text-sm text-slate-400">العنوان</label><input type="text" value={formData.address} onChange={e => handleFormChange('address', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" /></div>
                <div className="col-span-2"><label className="text-sm text-slate-400">وصف المشكلة</label><textarea rows={3} value={formData.problem_description} onChange={e => handleFormChange('problem_description', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" /></div>
                <div><label className="text-sm text-slate-400">الفني</label><select value={formData.technician} onChange={e => handleFormChange('technician', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"><option value="">اختر فني</option>{technicians.map(t => <option key={t.id}>{t.name}</option>)}</select></div>
                <div><label className="text-sm text-slate-400">إجمالي المبلغ</label><input type="number" value={formData.total_amount} onChange={e => handleFormChange('total_amount', parseFloat(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" /></div>
                <div><label className="text-sm text-slate-400">قطع غيار</label><input type="number" value={formData.parts_cost} onChange={e => handleFormChange('parts_cost', parseFloat(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" /></div>
                <div><label className="text-sm text-slate-400">مواصلات</label><input type="number" value={formData.transport_cost} onChange={e => handleFormChange('transport_cost', parseFloat(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" /></div>
                <div className="col-span-2"><label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={formData.is_paid} onChange={e => handleFormChange('is_paid', e.target.checked)} /> تم التحصيل</label></div>
                
                {editingOrder && (
                  <>
                    <div className="col-span-2 border-t border-slate-800 pt-4 mt-2">
                      <h4 className="text-orange-500 font-bold text-sm mb-3 flex items-center gap-2">🛡️ بيانات الفاتورة والضمان</h4>
                    </div>
                    <div className="col-span-2"><label className="flex items-center gap-2 text-slate-300 mb-2"><input type="checkbox" checked={formData.invoice_approved} onChange={e => handleFormChange('invoice_approved', e.target.checked)} /> اعتماد الفاتورة والضمان</label></div>
                    <div><label className="text-sm text-slate-400">فترة الضمان</label><select value={formData.warranty_period || '6 أشهر'} onChange={e => handleFormChange('warranty_period', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"><option value="بدون ضمان">بدون ضمان</option><option value="3 أشهر">3 أشهر</option><option value="6 أشهر">6 أشهر</option><option value="1 سنة">1 سنة</option><option value="2 سنة">2 سنة</option></select></div>
                    <div><label className="text-sm text-slate-400">تاريخ الفاتورة</label><input type="date" value={formData.invoice_date || new Date().toISOString().split('T')[0]} onChange={e => handleFormChange('invoice_date', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" /></div>
                    <div className="col-span-2"><label className="text-sm text-slate-400">قطع الغيار المستخدمة (تظهر في الفاتورة)</label><textarea rows={2} value={formData.parts_used || ''} onChange={e => handleFormChange('parts_used', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" placeholder="مثلاً: طلمبة طرد، سير موتور..." /></div>
                  </>
                )}
              </div>
              <div className="flex gap-3 pt-4"><button type="submit" disabled={isSubmitting} className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-bold">{isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button><button type="button" onClick={() => setShowOrderModal(false)} className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-lg font-bold">إلغاء</button></div>
            </form>
          </div>
        </div>
      )}

      {showTechModal && canEditDelete() && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">{editingTech ? 'تعديل فني' : 'فني جديد'}</h3>
            <form onSubmit={saveTechnician} className="space-y-4">
              <input type="text" placeholder="الاسم" value={techForm.name} onChange={e => setTechForm({...techForm, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" required />
              <input type="text" placeholder="رقم الهاتف" value={techForm.phone} onChange={e => setTechForm({...techForm, phone: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" />
              <input type="text" placeholder="التخصص" value={techForm.specialization} onChange={e => setTechForm({...techForm, specialization: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" />
              <input type="text" placeholder="اسم المستخدم" value={techForm.username} onChange={e => setTechForm({...techForm, username: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" />
              <input type="password" placeholder="كلمة المرور" value={techForm.password} onChange={e => setTechForm({...techForm, password: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" required />
              <input type="number" placeholder="نسبة الفني (%)" value={techForm.profit_percentage} onChange={e => setTechForm({...techForm, profit_percentage: parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" />
              <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={techForm.is_active} onChange={e => setTechForm({...techForm, is_active: e.target.checked})} /> نشط</label>
              <button type="submit" className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold">حفظ</button>
            </form>
          </div>
        </div>
      )}

      {showPartnerModal && canEditDelete() && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">{editingPartner ? 'تعديل شريك' : 'إضافة شريك'}</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
              try {
                if (editingPartner) await fetchAPI(`partners?id=eq.${editingPartner.id}`, { method: 'PATCH', body: JSON.stringify(partnerForm) });
                else await fetchAPI('partners', { method: 'POST', body: JSON.stringify(partnerForm) });
                await addNotification(editingPartner ? 'تعديل شريك' : 'إضافة شريك', `تم ${editingPartner ? 'تعديل' : 'إضافة'} الشريك ${partnerForm.name}`);
                setShowPartnerModal(false); setEditingPartner(null); setPartnerForm({ name: '', share_percentage: 0, phone: '', is_active: true });
                fetchPartners();
              } catch (err) { console.error(err); }
            }} className="space-y-4">
              <input type="text" placeholder="اسم الشريك" value={partnerForm.name} onChange={e => setPartnerForm({...partnerForm, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" required />
              <input type="number" placeholder="نسبة الربح (%)" value={partnerForm.share_percentage} onChange={e => setPartnerForm({...partnerForm, share_percentage: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" required />
              <input type="text" placeholder="رقم الهاتف" value={partnerForm.phone} onChange={e => setPartnerForm({...partnerForm, phone: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" />
              <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={partnerForm.is_active} onChange={e => setPartnerForm({...partnerForm, is_active: e.target.checked})} /> نشط</label>
              <button type="submit" className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold">حفظ</button>
            </form>
          </div>
        </div>
      )}

      {showCashModal && canEditDelete() && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">{editingCash ? 'تعديل حركة' : 'إضافة حركة'}</h3>
            <form onSubmit={addCashEntry} className="space-y-4">
              <select value={cashForm.type} onChange={e => setCashForm({...cashForm, type: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"><option value="income">💰 دخل</option><option value="expense">💸 مصروف</option></select>
              <input type="number" placeholder="المبلغ" value={cashForm.amount} onChange={e => setCashForm({...cashForm, amount: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" required />
              <input type="text" placeholder="الوصف" value={cashForm.description} onChange={e => setCashForm({...cashForm, description: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" required />
              <input type="date" value={cashForm.date} onChange={e => setCashForm({...cashForm, date: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" required />
              <button type="submit" className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold">حفظ</button>
            </form>
          </div>
        </div>
      )}

      {showSettleModal && selectedOrder && canEditDelete() && (
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

      {showUserModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <UserPlus className="text-orange-500" /> {editingUserAccount ? 'تعديل بيانات مستخدم' : 'إضافة مستخدم جديد'}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={saveUserAccount} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">الاسم الكامل</label>
                <input type="text" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition-all" placeholder="مثلاً: أحمد محمد" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">اسم المستخدم (للدخول)</label>
                <input type="text" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition-all" placeholder="username" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">كلمة المرور</label>
                <input type="text" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition-all" placeholder="123456" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">الصلاحية (الدور)</label>
                <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition-all">
                  <option value="admin">مدير عام (صلاحيات كاملة)</option>
                  <option value="manager">مدير فرع (تعديل وتحصيل)</option>
                  <option value="data-entry">مدخل بيانات (إضافة فقط)</option>
                  <option value="viewer">مشاهد (رؤية فقط)</option>
                </select>
              </div>
              <div className="flex items-center gap-2 py-2">
                <input type="checkbox" id="user_active" checked={userForm.is_active} onChange={e => setUserForm({...userForm, is_active: e.target.checked})} className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-orange-600 focus:ring-orange-500" />
                <label htmlFor="user_active" className="text-sm text-slate-300 font-bold">الحساب نشط ويسمح له بالدخول</label>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-black py-4 rounded-xl transition-all active:scale-95 shadow-xl shadow-orange-900/20 mt-4">
                {editingUserAccount ? 'تحديث البيانات' : 'إنشاء الحساب الآن'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
