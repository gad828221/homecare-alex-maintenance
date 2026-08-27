import React, { useState, useEffect, useMemo, useRef, useCallback, useDeferredValue } from 'react';
import {
  Plus, Search, LayoutDashboard, Users, SlidersHorizontal, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  CheckCircle2, AlertCircle, Eye, EyeOff,
  Edit, Trash2, RefreshCw, Phone,
  Copy, Check, Trash, Bell, DollarSign, X, Printer, UserPlus, UserMinus, LogOut, Send, Play, LogIn,
  RotateCcw, Clock, MapPin, Star, Cpu, ShieldCheck, Wrench, UserCircle, Wallet,
  ClipboardList, FileCheck, Camera, Navigation, ExternalLink, Pin, PinOff, History, MessageCircle
} from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { Helmet } from 'react-helmet-async';
import { sendExternalPush } from '../utils/pushNotifications';
import { useScreenWakeLock } from '../hooks/useScreenWakeLock';
import { formatElapsed, formatOrderDay, formatOrderDateTime, getElapsedTone, getOrderCreatedValue, parseOrderDate, getEgyptTodayString } from '../utils/orderTiming';
import { createPickupMarker, getPickupTypeLabel, parsePickupReceipt, type PickupReceiptData } from '../utils/pickupReceipt';
import { mergeCompanyTransferMarker, parseCompanyTransfer } from '../utils/companyTransfer';
import TechnicianPerformanceAdmin from './TechnicianPerformanceAdmin';
import ScrollButtons from './ScrollButtons';
import IOSPushEnablePrompt from './IOSPushEnablePrompt';

import { findTechnicianByIdentity, getTechnicianDisplayName, getTechnicianPhotoUrl, getTechnicianSpecialty, parseTechnicianProfileNotification } from '../utils/technicianProfile';
import { clearAuthSession, readAuthSession } from '../utils/authSession';
import { getOneSignalExternalId, syncOneSignalIdentity } from '../utils/oneSignalIdentity';

// ==================== الإعدادات الأساسية ====================
const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';
const supabase = createClient(supabaseUrl, supabaseKey);

const DEVICE_TYPES = ['غسالة', 'ثلاجة', 'بوتاجاز', 'سخان', 'تكييف', 'ميكروويف', 'غسالة أطباق'];
const BRANDS = ['سامسونج', 'LG', 'شارب', 'توشيبا', 'زانوسي', 'يونيون إير', 'فريش', 'وايت ويل', 'أريستون', 'بيكو', 'هوفر', 'إنديست', 'كريازي'];
const REPORT_TIME_OFFSET_MS = 8 * 60 * 60 * 1000;
const getReportingDate = (timestamp: any) => {
  if (!timestamp) return null;
  const date = new Date(String(timestamp));
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + REPORT_TIME_OFFSET_MS);
};
const normalizeCustomerPhone = (phone: any) => {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.startsWith('20') ? `0${digits.slice(2)}` : digits;
};

// ==================== إدارة المستخدمين والصلاحيات (النسخة المتكاملة) ====================
function AdminPermissions({ users, onEdit, onDelete, onToggle, canEdit, onSync }: { users: any[], onEdit: (u: any) => void, onDelete: (id: number, name: string) => void, onToggle: (u: any) => void, canEdit: boolean, onSync: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="text-orange-500" /> إدارة صلاحيات النظام
          </h2>
          <p className="text-xs text-slate-500 mt-1">إدارة حسابات الموظفين، المديرين، ومدخلي البيانات.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {canEdit && (
            <>
              <button
                onClick={onSync}
                className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
              >
                <RefreshCw size={14} /> مزامنة الفنيين
              </button>
              <button
                onClick={() => onEdit(null)}
                className="flex-1 md:flex-none bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
              >
                <UserPlus size={14} /> إضافة مستخدم
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <div key={user.id} className={`bg-slate-900 rounded-[1.5rem] border-2 ${user.is_active ? 'border-slate-800' : 'border-red-900/30 opacity-60'} p-5 transition-all hover:border-orange-500/30`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white ${
                  user.role === 'admin' ? 'bg-orange-600' : user.role === 'manager' ? 'bg-blue-600' : 'bg-slate-700'
                }`}>
                  {user.name?.substring(0, 1)}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{user.name}</h3>
                  <p className="text-[10px] text-slate-500">@{user.username}</p>
                </div>
              </div>
              <div className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                user.role === 'admin' ? 'bg-orange-500/20 text-orange-400' :
                user.role === 'manager' ? 'bg-blue-500/20 text-blue-400' :
                user.role === 'data-entry' ? 'bg-emerald-500/20 text-emerald-400' :
                user.role === 'tech' ? 'bg-indigo-500/20 text-indigo-400' :
                'bg-slate-800 text-slate-400'
              }`}>
                {user.role === 'admin' ? 'مدير عام' : user.role === 'manager' ? 'مدير فرع' : user.role === 'data-entry' ? 'مدخل بيانات' : user.role === 'tech' ? 'فني' : 'مشاهد'}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">كلمة المرور:</span>
                <span className="text-slate-300 font-mono">{user.password}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">الحالة:</span>
                <span className={user.is_active ? 'text-emerald-400' : 'text-red-400'}>
                  {user.is_active ? '● نشط' : '○ معطل'}
                </span>
              </div>
            </div>

            {canEdit && (
              <div className="flex gap-2 pt-4 border-t border-slate-800">
                <button onClick={() => onEdit(user)} className="flex-1 h-9 bg-slate-800 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl flex items-center justify-center gap-2 transition-all text-[10px] font-bold">
                  <Edit size={14} /> تعديل
                </button>
                <button onClick={() => onToggle(user)} className={`flex-1 h-9 rounded-xl flex items-center justify-center gap-2 transition-all text-[10px] font-bold ${user.is_active ? 'bg-slate-800 text-amber-400 hover:bg-amber-600 hover:text-white' : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white'}`}>
                  {user.is_active ? 'إيقاف' : 'تفعيل'}
                </button>
                <button onClick={() => onDelete(user.id, user.name)} className="w-9 h-9 bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl flex items-center justify-center transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
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
  const waUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;

  // لا نستبدل صفحة التطبيق برابط واتساب؛ افتحه في نافذة/تبويب مستقل حتى تبقى جلسة المدير ثابتة.
  const popup = window.open(waUrl, '_blank', 'noopener,noreferrer');
  if (!popup) {
    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

// واتساب مخصص للعميل فقط. تم إيقاف رسائل واتساب الداخلية للإدارة والفنيين.
const notifyAdmin = (_message: string) => undefined;
const notifyTechnician = (_techPhone: string, _techName: string, _message: string) => undefined;

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
    // null تعني فشل الشبكة؛ المصفوفة الفارغة تعني نتيجة صحيحة بلا بيانات.
    return null;
  }
};

const fetchAPIWithRetry = async (endpoint: string, attempts = 3) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = await fetchAPI(endpoint);
    if (result !== null) return result;
    if (attempt < attempts) await new Promise(resolve => window.setTimeout(resolve, 500 * attempt));
  }
  return null;
};
const addNotification = async (action: string, details: string, userName = 'المدير') => {
  try {
    await fetch('https://hjrnfsdvrrwgyppqhwml.supabase.co/rest/v1/notifications', {
      method: 'POST',
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details, user_name: userName, created_at: new Date().toISOString() })
    });
  } catch (err) { console.error(err); }
};

const sendSmartAlertOnce = async (key: string, action: string, details: string, push: { title: string; message: string; data?: Record<string, any> }) => {
  if (typeof window === 'undefined' || localStorage.getItem(key)) return false;
  localStorage.setItem(key, new Date().toISOString());
  await addNotification(action, details);
  void sendExternalPush({ event: 'system_alert', title: push.title, message: push.message, targetRoles: ['admin', 'manager'], data: push.data });
  return true;
};

// ==================== المكون الرئيسي ====================
export default function ProtectedOrders() {
  const { enabled: wakeLockEnabled, isLocked: wakeLockActive, supported: wakeLockSupported, toggle: toggleWakeLock } = useScreenWakeLock();
  const [orders, setOrders] = useState<any[]>([]);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [archivedOrders, setArchivedOrders] = useState<any[]>([]);
  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const [repeatCustomerSearch, setRepeatCustomerSearch] = useState('');
  const previousCustomerPhones = useMemo(() => {
    const counts = new Map<string, number>();
    [...orders, ...archivedOrders].forEach((order) => {
      const phone = normalizeCustomerPhone(order.phone);
      if (phone.length >= 10) counts.set(phone, (counts.get(phone) || 0) + 1);
    });
    return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([phone]) => phone));
  }, [archivedOrders, orders]);
  const repeatCustomers = useMemo(() => {
    const groups = new Map<string, { phone: string; name: string; orders: any[] }>();
    [...orders, ...archivedOrders].forEach((order) => {
      const phone = normalizeCustomerPhone(order.phone);
      if (phone.length < 10) return;
      const current: { phone: string; name: string; orders: any[] } = groups.get(phone) || { phone, name: order.customer_name || 'عميل بدون اسم', orders: [] };
      current.orders.push(order);
      if ((!current.name || current.name === 'عميل بدون اسم') && order.customer_name) current.name = order.customer_name;
      groups.set(phone, current);
    });
    return Array.from(groups.values())
      .filter((customer) => customer.orders.length > 1)
      .map((customer) => ({
        ...customer,
        orders: [...customer.orders].sort((a, b) => (parseOrderDate(b.created_at || b.date)?.getTime() || 0) - (parseOrderDate(a.created_at || a.date)?.getTime() || 0)),
      }))
      .sort((a, b) => b.orders.length - a.orders.length);
  }, [archivedOrders, orders]);
  const filteredRepeatCustomers = repeatCustomers.filter((customer) => {
    const query = repeatCustomerSearch.trim().toLowerCase();
    return !query || customer.name.toLowerCase().includes(query) || customer.phone.includes(query);
  });
  const getPhotoUrl = (note: string, type: 'OLD' | 'NEW') => {
    if (!note) return null;
    const regex = new RegExp(`\\[${type}_PARTS:(.*?)\\]`);
    const match = note.match(regex);
    return match ? match[1] : null;
  };

  const [technicians, setTechnicians] = useState<any[]>([]);
  const [technicianProfiles, setTechnicianProfiles] = useState<Record<string, any>>({});
  const [notifications, setNotifications] = useState<any[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('mg_read_notification_ids') || '[]')); } catch { return new Set(); }
  });
  const [partners, setPartners] = useState<any[]>([]);
  const [cashLedger, setCashLedger] = useState<any[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [confirmingTransferId, setConfirmingTransferId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'archived' | 'technicians' | 'reports' | 'repeatCustomers' | 'invoicesReview' | 'cash' | 'partners' | 'notifications' | 'permissions' | 'performance' | 'analytics' | 'feedback'>('orders');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const DEVICE_ICONS: Record<string, string> = {
    'غسالة': '🧺',
    'ثلاجة': '❄️',
    'بوتاجاز': '🔥',
    'سخان': '♨️',
    'تكييف': '🌬️',
    'شاشة': '📺',
    'ميكروويف': '⏲️',
    'مكنسة': '🧹',
    'أخرى': '⚙️'
  };

  const [showTechModal, setShowTechModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showManualPushModal, setShowManualPushModal] = useState(false);
  const [manualPushTarget, setManualPushTarget] = useState('all');
  const [manualPushTitle, setManualPushTitle] = useState('رسالة من الإدارة');
  const [manualPushMessage, setManualPushMessage] = useState('');
  const [manualPushSending, setManualPushSending] = useState(false);
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
  const [trackingShareOrderId, setTrackingShareOrderId] = useState<number | null>(null);
  const [filterTechStatus, setFilterTechStatus] = useState<'all' | 'active' | 'inactive'>('active');
  const [cashFilterDate, setCashFilterDate] = useState(() => getEgyptTodayString());
  const [cashForm, setCashForm] = useState({ type: 'expense', amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
  const [partnerForm, setPartnerForm] = useState({ name: '', share_percentage: 0, phone: '', is_active: true });
  const [searchTerm, setSearchTerm] = useState('');
  // إبقاء الكتابة فورية وتأجيل الفلترة الثقيلة حتى لا يتجمد الكيبورد مع كل حرف.
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [archiveSearchTerm, setArchiveSearchTerm] = useState('');
  const [archiveDateFilter, setArchiveDateFilter] = useState('');
  const [filterStatus, setFilterStatus] = useState('live');
  const [filterTechnician, setFilterTechnician] = useState('');
  const [filterDeviceType, setFilterDeviceType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterDelay, setFilterDelay] = useState<'all' | 'delayed'>('all');
  const [filterWarranty, setFilterWarranty] = useState<'all' | 'active' | 'expired' | 'expiring'>('all');
  const [showCompletedOrders, setShowCompletedOrders] = useState(false);
  const [visibleOrdersCount, setVisibleOrdersCount] = useState(15);
  const [visibleCompletedCount, setVisibleCompletedCount] = useState(15);
  const [visibleArchivedCount, setVisibleArchivedCount] = useState(15);
  const [visibleNotificationsCount, setVisibleNotificationsCount] = useState(20);
  const [notificationCategory, setNotificationCategory] = useState<'all' | 'urgent' | 'orders' | 'money' | 'system'>('all');
  const [notificationSearch, setNotificationSearch] = useState('');
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [invoiceDateFilter, setInvoiceDateFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [pinnedOrderIds, setPinnedOrderIds] = useState<Set<number>>(new Set());
  const [deletedOrders, setDeletedOrders] = useState<any[]>([]);
  const [customDevice, setCustomDevice] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [isOtherDevice, setIsOtherDevice] = useState(false);
  const [isOtherBrand, setIsOtherBrand] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '',
    status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false,
    invoice_approved: false, warranty_period: '6 أشهر', invoice_date: new Date().toISOString().split('T')[0], parts_used: '',
    date: new Date().toLocaleDateString("ar-EG")
  });
  const [previousCustomer, setPreviousCustomer] = useState<any>(null);
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false);

  useEffect(() => {
    if (editingOrder) {
      setPreviousCustomer(null);
      setCustomerLookupLoading(false);
      return;
    }
    const phone = String(formData.phone || '').trim();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setPreviousCustomer(null);
      setCustomerLookupLoading(false);
      return;
    }
    const variants = Array.from(new Set([phone, digits, digits.startsWith('0') ? `+20${digits.slice(1)}` : '', digits.startsWith('0') ? `20${digits.slice(1)}` : '', digits.startsWith('20') ? `0${digits.slice(2)}` : ''].filter(Boolean)));
    let cancelled = false;
    setCustomerLookupLoading(true);
    Promise.all(variants.map((variant) => supabase.from('orders').select('customer_name,address,phone').eq('phone', variant).order('created_at', { ascending: false }).limit(1)))
      .then((responses) => {
        if (cancelled) return;
        setPreviousCustomer(responses.map((response) => response.data?.[0]).find(Boolean) || null);
      })
      .catch(() => { if (!cancelled) setPreviousCustomer(null); })
      .finally(() => { if (!cancelled) setCustomerLookupLoading(false); });
    return () => { cancelled = true; };
  }, [editingOrder, formData.phone]);
  const [techForm, setTechForm] = useState({
    name: '', phone: '', specialization: '', is_active: true,
    username: '', password: '', profit_percentage: 50
  });
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, cancelled: 0, totalIncome: 0 });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const orderModalScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showOrderModal) return;
    // v3.8.9: منع إعادة التصفير للخطوة 1 إذا كان الأوردر موجوداً بالفعل (حالة التعديل أو التعيين السريع)
    if (!editingOrder) {
      setFormStep(1);
      setFormData({
        customer_name: '',
        phone: '',
        address: '',
        device_type: '',
        brand: '',
        problem_description: '',
        technician: '',
        total_amount: 0,
        parts_cost: 0,
        transport_cost: 0,
        net_amount: 0,
        technician_share: 0,
        company_share: 0,
        status: 'pending',
        is_paid: false,
        invoice_approved: false,
        warranty_period: '6 أشهر',
        invoice_date: new Date().toISOString().split('T')[0],
        parts_used: '',
        date: new Date().toLocaleDateString('ar-EG')
      });
      setIsOtherDevice(false);
      setIsOtherBrand(false);
      setCustomDevice('');
      setCustomBrand('');
    }
    requestAnimationFrame(() => orderModalScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' }));
  }, [showOrderModal, editingOrder]);


  const [userRole, setUserRole] = useState<string>('');
  const [isUrgentAlert, setIsUrgentAlert] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const alertInterval = useRef<any>(null);
  const lastCheckedOrderId = useRef<number | null>(null);
  const lastCheckedOrderCreatedAtRef = useRef<number | null>(null);
  const lastGoodOrdersRef = useRef<any[] | null>(null);
  const lastGoodNotificationsRef = useRef<any[] | null>(null);
  const latestFetchRequestRef = useRef(0);
  const alertBaselineReadyRef = useRef(false);
  const delayedAlertIdsRef = useRef<Set<number>>(new Set());
  const escalationAlertIdsRef = useRef<Set<number>>(new Set());
  const cashProfitLocksRef = useRef<Set<number>>(new Set());
  const expiringWarrantyIdsRef = useRef<Set<number>>(new Set());
  const highExpenseAlertIdsRef = useRef<Set<number>>(new Set());

  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<any>(null);
  const [returnReason, setReturnReason] = useState("");
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
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);
  const [monthlyPeriod, setMonthlyPeriod] = useState<'all' | 'start' | 'middle' | 'end'>('all');

  const peakTimes = useMemo(() => {
    const dayNames: Record<string, string> = { Sun: 'الأحد', Mon: 'الاثنين', Tue: 'الثلاثاء', Wed: 'الأربعاء', Thu: 'الخميس', Fri: 'الجمعة', Sat: 'السبت' };
    const dayCounts: Record<string, number> = { الأحد: 0, الاثنين: 0, الثلاثاء: 0, الأربعاء: 0, الخميس: 0, الجمعة: 0, السبت: 0 };
    const hourCounts: Record<number, number> = {};
    const allOrders = [...orders, ...archivedOrders];
        allOrders.forEach((order) => {
      const localDate = getReportingDate(order.created_at || order.createdAt);
      if (!localDate) return;
      const dayNameEn = localDate.toLocaleDateString('en-US', { weekday: 'short' });
      const hour = localDate.getHours();
      if (dayNameEn && dayNames[dayNameEn]) dayCounts[dayNames[dayNameEn]] += 1;
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const days = Object.entries(dayCounts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    const hours = Object.entries(hourCounts).map(([hour, count]) => ({ hour: Number(hour), count })).sort((a, b) => b.count - a.count);
    return { days, hours, totalWithTime: hours.reduce((sum, item) => sum + item.count, 0) };
  }, [archivedOrders, orders]);

  const monthlyStats = useMemo(() => {
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const allOrders = [...orders, ...archivedOrders];
    const daysInMonth = new Date(monthlyYear, monthlyMonth, 0).getDate();
    const periodStart = monthlyPeriod === 'start' ? 1 : monthlyPeriod === 'middle' ? 11 : monthlyPeriod === 'end' ? 21 : 1;
    const periodEnd = monthlyPeriod === 'start' ? 10 : monthlyPeriod === 'middle' ? 20 : monthlyPeriod === 'end' ? daysInMonth : daysInMonth;
    const ordersInSelectedPeriod = allOrders.filter((order) => {
      const date = getReportingDate(order.created_at || order.createdAt);
      return date && date.getFullYear() === monthlyYear && date.getMonth() + 1 === monthlyMonth && date.getDate() >= periodStart && date.getDate() <= periodEnd;
    });
    const monthCounts = monthNames.map((label, index) => ({
      label,
      month: index + 1,
      count: allOrders.filter((order) => {
        const date = getReportingDate(order.created_at || order.createdAt);
        return date && date.getFullYear() === monthlyYear && date.getMonth() === index;
      }).length
    }));
    const dayCounts: Record<number, number> = {};
    ordersInSelectedPeriod.forEach((order) => {
      const date = getReportingDate(order.created_at || order.createdAt);
      if (date) dayCounts[date.getDate()] = (dayCounts[date.getDate()] || 0) + 1;
    });
    const busiestDay = Object.entries(dayCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    return {
      monthName: monthNames[monthlyMonth - 1],
      periodStart,
      periodEnd,
      orders: ordersInSelectedPeriod,
      total: ordersInSelectedPeriod.length,
      completed: ordersInSelectedPeriod.filter((order) => order.status === 'completed').length,
      pending: ordersInSelectedPeriod.filter((order) => ['pending', 'in-progress'].includes(order.status)).length,
      cancelled: ordersInSelectedPeriod.filter((order) => order.status === 'cancelled').length,
      busiestDay: busiestDay ? Number(busiestDay[0]) : null,
      monthCounts,
      busiestMonth: [...monthCounts].sort((a, b) => b.count - a.count)[0]
    };
  }, [archivedOrders, monthlyMonth, monthlyPeriod, monthlyYear, orders]);

  const [reportType, setReportType] = useState<'cash' | 'pending_orders' | 'cancelled_orders' | 'tech_performance' | 'profits' | 'expenses' | 'comparison' | 'company_profit'>('cash');
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
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtor();
      }
      
      const ctx = audioContextRef.current;
      
      // v3.2.7: iOS Audio Unlock Sequence
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create and play a silent buffer to "warm up" iOS audio
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      setAudioEnabled(true);
      sessionStorage.setItem('audio_forced_enabled', 'true');
      
      // Play a confirmation sound
      setTimeout(() => playDing(false), 100);
    } catch (e) { 
      console.error("Audio init error", e);
      // Fallback for extreme cases
      setAudioEnabled(true);
    }
  };

  const playDing = async (isUrgent = false) => {
    try {
      // MP3 أكثر ثباتًا على أندرويد من جدولة Oscillator بعد تغيّر حالة الصفحة.
      if (!notificationAudioRef.current) notificationAudioRef.current = new Audio('/sounds/notification.mp3');
      const audio = notificationAudioRef.current;
      audio.volume = isUrgent ? 1 : 0.75;
      audio.currentTime = 0;
      await audio.play();
      if (isUrgent && 'vibrate' in navigator) navigator.vibrate?.([260, 100, 260, 100, 260]);
      return;
    } catch (mp3Error) {
      console.warn('MP3 playback unavailable, trying Web Audio:', mp3Error);
    }
    try {
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtor) return;
      
      // Always ensure we have a context and it's resumed (crucial for iOS)
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtor();
      }
      const ctx = audioContextRef.current;
      
            if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      if (ctx.state !== 'running') return;
      const tones = isUrgent
        ? [{ frequency: 1040, offset: 0, duration: 0.28 }, { frequency: 1320, offset: 0.22, duration: 0.28 }, { frequency: 1040, offset: 0.44, duration: 0.28 }]
        : [{ frequency: 880, offset: 0, duration: 0.5 }];
      
      const now = ctx.currentTime;
      tones.forEach(({ frequency, offset, duration }) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = frequency;
        oscillator.type = isUrgent ? 'square' : 'sine';
        
        // iOS requires very specific timing for gain nodes
        const start = now + offset;
        const volume = isUrgent ? 0.48 : 0.2;
        
        gainNode.gain.setValueAtTime(0.0001, start);
        gainNode.gain.exponentialRampToValueAtTime(volume, start + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        
        oscillator.start(start);
        oscillator.stop(start + duration + 0.05);
      });
      
      if (isUrgent && 'vibrate' in navigator) {
        navigator.vibrate?.([260, 100, 260, 100, 260]);
      }
    } catch (e) { 
      console.warn('Audio playback error', e); 
    }
  };

  const startUrgentAlert = () => {
    if (alertInterval.current) return;
    setIsUrgentAlert(true);
    void playDing(true);
    alertInterval.current = window.setInterval(() => { void playDing(true); }, 1500);
  };

  const stopUrgentAlert = () => {
    if (alertInterval.current) {
      clearInterval(alertInterval.current);
      alertInterval.current = null;
    }
    navigator.vibrate?.(0);
    setIsUrgentAlert(false);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const role = localStorage.getItem('userRole');
    // We let App.tsx handle the redirect to login if session is truly missing.
    // This prevents immediate kick-out during slow storage hydration.
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setUserRole(role || 'user');
    }

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
    // ✅ جلب الإشعارات والتقييمات فوراً عند فتح التبويب الخاص بها لضمان المزامنة
    if (activeTab === 'feedback' || activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [userRole, activeTab]);

  const canEditDelete = () => {
    const role = userRole?.toLowerCase() || '';
    return role === 'admin' || role === 'manager';
  };
  const isAdmin = userRole?.toLowerCase() === 'admin';
  const canManageTechnicians = isAdmin;
  const canManageCash = isAdmin;
  const canManagePartners = isAdmin;
  const isViewer = userRole?.toLowerCase() === 'viewer';
  const viewerBlockedTabs = ['technicians', 'reports', 'invoicesReview', 'partners', 'performance', 'feedback', 'permissions'];

  const saveUserAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'admin') return showToast("ليس لديك صلاحية", "error");

    // 🛡️ حماية من التكرار
    const isDuplicate = !editingUserAccount && users.some(u =>
      u.username.toLowerCase() === userForm.username.toLowerCase() ||
      u.name.toLowerCase() === userForm.name.toLowerCase()
    );
    if (isDuplicate) return showToast("⚠️ هذا المستخدم موجود بالفعل بنفس الاسم أو اسم المستخدم", "error");

    try {
      if (editingUserAccount) {
        await fetchAPI(`users?id=eq.${editingUserAccount.id}`, { method: 'PATCH', body: JSON.stringify(userForm) });

        if (userForm.role === 'tech') {
          const techData = { name: userForm.name, username: userForm.username, password: userForm.password, is_active: userForm.is_active };
          const existingTechs = await fetchAPI(`technicians?username=eq.${encodeURIComponent(userForm.username)}`);
          if (existingTechs && existingTechs.length > 0) {
            await fetchAPI(`technicians?id=eq.${existingTechs[0].id}`, { method: 'PATCH', body: JSON.stringify(techData) });
          } else {
            await fetchAPI('technicians', { method: 'POST', body: JSON.stringify({ ...techData, specialization: 'عام', profit_percentage: 50 }) });
          }
        }
        showToast("✅ تم تحديث المستخدم", "success");
      } else {
        await fetchAPI('users', { method: 'POST', body: JSON.stringify(userForm) });

        if (userForm.role === 'tech') {
          await fetchAPI('technicians', {
            method: 'POST',
            body: JSON.stringify({
              name: userForm.name,
              username: userForm.username,
              password: userForm.password,
              is_active: userForm.is_active,
              specialization: 'عام',
              profit_percentage: 50
            })
          });
        }
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

  const syncTechniciansToUsers = async () => {
    if (userRole !== 'admin') return;
    setLoading(true);
    let syncCount = 0;
    try {
      for (const tech of technicians) {
        // التحقق إذا كان الفني موجود بالفعل في جدول المستخدمين
        const existingUser = users.find(u => u.username === tech.username || u.name === tech.name);
        if (!existingUser) {
          await fetchAPI('users', {
            method: 'POST',
            body: JSON.stringify({
              name: tech.name,
              username: tech.username || tech.name.replace(/\s+/g, '_').toLowerCase(),
              password: tech.password || '123456',
              role: 'tech',
              is_active: tech.is_active !== false
            })
          });
          syncCount++;
        }
      }
      if (syncCount > 0) {
        showToast(`✅ تم مزامنة ${syncCount} فني بنجاح`, "success");
        fetchData();
      } else {
        showToast("ℹ️ كافة الفنيين لديهم حسابات بالفعل", "info");
      }
    } catch (err) {
      console.error(syncCount, err);
      showToast("❌ فشل مزامنة بعض الفنيين", "error");
    } finally {
      setLoading(false);
    }
  };
  const sendFeedbackRequest = (order: any) => {
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
    if (!order.phone || !order.order_number) return showToast("بيانات العميل غير مكتملة", "error");
    const feedbackUrl = `${window.location.origin}/feedback?order=${encodeURIComponent(order.order_number)}`;
    const message = `مرحباً أ/ ${order.customer_name || 'عميلنا العزيز'}،\n\nنرجو مشاركتنا تقييمك لخدمة الصيانة للأوردر رقم ${order.order_number}.\n\n⭐ قيّم الخدمة من هنا:\n${feedbackUrl}\n\nشكراً لثقتك في Maintenance Guide.`;
    sendWhatsApp(order.phone, message);
  };
	  const handleLogout = () => {
	    clearAuthSession();
	    window.location.replace('/login');
	  };

  const sendWhatsAppToCustomerOnCreate = (order: any) => {
    if (isViewer) return;
    const trackingUrl = `https://www.maintenanceguide.life/track/${order.order_number}`;
    const message = `📝 *تم استلام طلب الصيانة بنجاح* 📝\n━━━━━━━━━━━━━━━━━━━━━━\n🔢 *رقم الأوردر:* ${order.order_number}\n👤 *العميل:* ${order.customer_name}\n🔧 *الجهاز:* ${order.device_type} - ${order.brand}\n📍 *العنوان:* ${order.address || 'غير محدد'}\n\n✅ تم تسجيل طلبك وسيتم التواصل معك قريباً.\n\n📍 *يمكنك تتبع حالة طلبك من هنا:*\n${trackingUrl}`;
    openWhatsApp(order.phone, message);
  };

  const getOrderTechnicianProfile = (technicianIdentity: any) => {
    const technician = findTechnicianByIdentity(technicians, technicianIdentity);
    const lookupKeys = [
      technicianIdentity,
      technician?.id,
      technician?.username,
      technician?.code,
      technician?.name,
      getTechnicianDisplayName(technician || { name: technicianIdentity })
    ].filter(Boolean).map((value) => String(value).trim().toLowerCase());
    const storedProfile = lookupKeys.map((key) => technicianProfiles[key]).find(Boolean);
    return {
      technician,
      displayName: getTechnicianDisplayName(technician || { name: technicianIdentity }),
      photoUrl: storedProfile?.photoUrl || getTechnicianPhotoUrl(technician),
      specialty: getTechnicianSpecialty(technician, undefined)
    };
  };

  const sendTechnicianAssignmentToCustomer = (order: any, technicianIdentity: any) => {
    if (!['admin', 'manager'].includes(userRole?.toLowerCase() || '') || !order?.phone || !technicianIdentity) return false;
    const profile = getOrderTechnicianProfile(technicianIdentity);
    const specialty = getTechnicianSpecialty(profile.technician, order.device_type);
    const trackingUrl = `https://www.maintenanceguide.life/track/${order.order_number}`;
    const photoLine = profile.photoUrl ? `🖼️ *صورة الفني:*\n${profile.photoUrl}\n` : '';
    const message = `👨‍🔧 *تم تعيين الفني المسؤول عن طلبك* 👨‍🔧\n━━━━━━━━━━━━━━━━━━━━━━\n🔢 *رقم الأوردر:* ${order.order_number}\n👤 *العميل:* ${order.customer_name}\n\n✅ *الفني المتوجه إليك:* ${profile.displayName}\n🛠️ *التخصص:* متخصص ${specialty}\n${photoLine}\n📍 سيقوم الفني بالتواصل معك والتوجه إلى العنوان المسجل في الطلب.\n\n📍 *تتبع طلبك والضمان من هنا:*\n${trackingUrl}\n\n🏢 *Maintenance Guide (MG)*\nشكراً لثقتكم.`;
    openWhatsApp(order.phone, message);
    return true;
  };

  const normalizeArabicDigits = (value: unknown) => String(value ?? '')
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .trim();

  const getOrderReferenceDate = (order: any) => order?.created_at || order?.createdAt || order?.date || '';

  const getDaysDifference = (dateStr: string, status: string) => {
    if (status === 'inspected') return 0;
    const orderDate = parseOrderDate(dateStr);
    if (!orderDate) return 0;

    // v3.8.7: حساب الفرق الدقيق بالأيام والساعات
    const now = new Date();
    const diffMs = now.getTime() - orderDate.getTime();
    
    // تحويل الملي ثانية إلى أيام (يوم = 24 ساعة)
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    return days;
  };

  const isDelayed = (order: any) => {
    if (order.status === 'completed' || order.status === 'cancelled') return false;
    if (order.status === 'inspected') return false;
    return getDaysDifference(getOrderReferenceDate(order), order.status) > 2;
  };

  const normalizeTechnicianIdentity = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/[.\s_-]/g, '');

  const technicianMatchesOrder = (technician: any, order: any) => {
    const orderIdentity = normalizeTechnicianIdentity(order?.technician);
    if (!orderIdentity) return false;
    const technicianIdentities = [technician?.id, technician?.name, technician?.username, technician?.code, technician?.techName]
      .filter(Boolean)
      .map(normalizeTechnicianIdentity);
    if (technicianIdentities.includes(orderIdentity)) return true;
    const resolvedTechnician = findTechnicianByIdentity(technicians, order?.technician);
    return Boolean(resolvedTechnician && String(resolvedTechnician.id) === String(technician?.id));
  };

  const getOpenOrdersForTechnician = (technician: any) => {
    const openStatuses = new Set(['pending', 'in-progress', 'in_progress', 'deferred']);
    const uniqueOrders = new Map<string, any>();
    [...orders, ...archivedOrders]
      .filter((order: any) => technicianMatchesOrder(technician, order) && openStatuses.has(String(order.status || '').toLowerCase()))
      .forEach((order: any) => {
        const key = String(order.id ?? order.order_number ?? `${order.technician}-${order.date}`);
        if (!uniqueOrders.has(key)) {
          uniqueOrders.set(key, { ...order, ageDays: getDaysDifference(getOrderReferenceDate(order), order.status) });
        }
      });
    return Array.from(uniqueOrders.values());
  };

  const getOldOpenOrdersForTechnician = (technician: any) =>
    getOpenOrdersForTechnician(technician)
      .filter((order: any) => order.ageDays > 2)
      .sort((a: any, b: any) => b.ageDays - a.ageDays);

  const isOldAndShouldArchive = (order: any) => {
    // 1. الحالات النهائية تظهر في الأرشيف فوراً للحفاظ على نظافة لوحة التشغيل
    // ملاحظة: الأوردر المكتمل يذهب للأرشيف فقط إذا تم تحصيله (is_paid) ليبقى ظاهراً للمدير للمتابعة المالية إذا لم يُحصل بعد.
    if (order.status === 'cancelled' || order.status === 'inspected') return true;
    // المكتمل غير المحصل يظل في التشغيل حتى يتم اعتماد التحصيل، ولا يخضع لحد 30 يوماً.
    if (order.status === 'completed') return Boolean(order.is_paid);

    // 2. الأوردرات القديمة المفتوحة جداً (أكثر من 30 يوم) تُنقل للأرشيف تلقائياً لتخفيف اللوحة
    return getDaysDifference(getOrderReferenceDate(order), order.status) > 30;
  };

  const isNewOrder = (order: any) => {
    if (!order.created_at) return false;
    const created = parseOrderDate(order.created_at);
    if (!created) return false;
    const now = new Date();
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffHours < 1; // أوردر جديد خلال آخر ساعة
  };

  const getOrderCreatedAt = (order: any) => {
    if (order.created_at) {
      const date = parseOrderDate(order.created_at);
      if (date) return date;
    }
    if (order.date && typeof order.date === 'string') {
      const date = parseOrderDate(order.date);
      if (date) return date;
    }
        return null;
  };
  const isOrderToday = (order: any) => {
    const createdAt = getOrderCreatedAt(order);
    if (!createdAt) return false;
    const cairoDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(createdAt);
    return cairoDate === getEgyptTodayString();
  };
  const getWarrantyStatus = (order: any) => {
    if (!order.invoice_approved || !order.warranty_period || order.status !== 'completed') {
      return { status: 'none', text: 'لا يوجد ضمان', color: 'slate' };
    }

    // استخدام تاريخ الفاتورة أو تاريخ الإكمال أو تاريخ الإنشاء
    const dateSource = order.invoice_date || order.completed_at || order.created_at || order.date;
    if (!dateSource) return { status: 'none', text: 'لا يوجد ضمان', color: 'slate' };

    const orderDate = parseOrderDate(dateSource);
    if (!orderDate) return { status: 'none', text: 'تاريخ غير صالح', color: 'slate' };

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

  const sendDailyReportToApp = async () => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => (o.created_at || o.date).includes(today));
    const completedToday = todayOrders.filter(o => o.status === 'completed').length;
    const incomeToday = todayOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'in-progress').length;
    const delayedCount = orders.filter(o => isDelayed(o)).length;
    const noTechCount = orders.filter(o => !o.technician || o.technician === '-' || o.technician === '').length;

    const message = `📊 *ملخص سير العمل اليومي* 📊\n━━━━━━━━━━━━━━━━━━━━━━\n📅 *التاريخ:* ${new Date().toLocaleDateString('ar-EG')}\n\n✅ *إحصائيات الإنجاز:* \n🔹 طلبات جديدة: ${todayOrders.length}\n🔹 طلبات مكتملة: ${completedToday}\n💰 إجمالي التحصيل: ${incomeToday.toLocaleString()} ج.م\n\n⚠️ *حالة الطلبات القائمة:* \n🔸 قيد العمل: ${pendingCount}\n🚨 طلبات متأخرة: ${delayedCount}\n👤 بدون فني: ${noTechCount}\n━━━━━━━━━━━━━━━━━━━━━━\n🚀 *نعمل معاً لتقديم أفضل خدمة عملاء.*`;

    // إرسال Push أولًا حتى لا يتعطل التقرير إذا تأخر حفظ سجل الإشعارات.
    const signedInStaff = readAuthSession().user;
    const currentStaffExternalId = getOneSignalExternalId(signedInStaff, signedInStaff?.role);
    const pushResult = await sendExternalPush({
      event: 'system_alert',
      title: '📊 تقرير العمليات اليومي',
      message,
      targetRoles: ['admin', 'manager'],
      targetUserIds: currentStaffExternalId ? [currentStaffExternalId] : [],
      data: { focus: 'notifications' }
    });
    // حفظ نسخة داخلية في الخلفية دون تعطيل نتيجة الإرسال الخارجي.
    void addNotification('تقرير العمليات اليومي', message);
    if (pushResult.ok) {
      showToast('✅ تم إرسال التقرير داخل البرنامج وPush بنجاح', 'success');
    } else {
      const errorMsg = pushResult.error || 'فشل غير معروف';
      showToast(`✅ تم الحفظ داخلياً (فشل Push: ${errorMsg}). تأكد من الجرس أسفل الشاشة.`, 'info');
      console.warn('Push failed:', errorMsg);
    }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await fetchAPI('notifications?select=*&action=neq.employee_chat&order=created_at.desc');
      if (!Array.isArray(data)) return;
      // لا نمسح سجل الإشعارات بسبب فشل شبكة أو رد فارغ عابر أثناء التحديث.
      if (data.length === 0 && lastGoodNotificationsRef.current?.length) return;
      if (data.length > 0) lastGoodNotificationsRef.current = data;
      setNotifications(data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchPartners = useCallback(async () => {
    try {
      const data = await fetchAPI('partners?select=*&order=created_at.desc');
      setPartners(data || []);
    } catch (err) { console.error(err); }
  }, []);

  const deletePartner = async (id: number, name: string) => {
    if (!canManagePartners) return showToast('ليس لديك صلاحية حذف الشركاء', 'error');
    if (!confirm(`هل تريد حذف الشريك ${name} نهائياً؟`)) return;
    try {
      await fetchAPI(`partners?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف شريك', `تم حذف الشريك ${name}`);
      await fetchPartners();
    } catch (err) {
      console.error(err);
      showToast('تعذر حذف الشريك', 'error');
    }
  };

  const fetchCashLedger = useCallback(async () => {
    try {
      const allData = await fetchAPI('cash_ledger?select=*&order=date.desc,created_at.desc');
      const all = allData || [];
      let balance = 0;
      all.forEach((entry: any) => {
        const amount = Number(entry.amount) || 0;
        if (entry.type === 'income') balance += amount;
        else if (entry.type === 'expense' || entry.type === 'profit_distribution') balance -= amount;
      });
      setCashBalance(balance);
      // نخزن كل القيود في الحالة؛ الفلترة التالية للعرض فقط ولا تمس الرصيد.
      setCashLedger(all);
    } catch (err) { console.error(err); }
  }, [cashFilterDate]);

  const addCashEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCash) return showToast("مدير العمليات لا يملك صلاحية إضافة حركات للخزنة", "error");
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
    if (!canManageCash) return showToast("مدير العمليات لا يملك صلاحية تعديل الخزنة", "error");
    if (confirm('هل تريد حذف هذا القيد نهائياً؟')) {
      await fetchAPI(`cash_ledger?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف قيد خزنة', `تم حذف قيد من سجل الخزنة`);
      fetchCashLedger();
    }
  };

  const deleteOrderProfitFromCash = async (order: any) => {
    if (!isAdmin) return false;
    try {
      const entries = await fetchAPI(`cash_ledger?description=like=*${order.order_number}*&type=eq.income&select=id`);
      for (const entry of entries || []) {
        await fetchAPI(`cash_ledger?id=eq.${entry.id}`, { method: 'DELETE' });
      }
      await fetchAPI(`orders?id=eq.${order.id}`, { method: 'PATCH', body: JSON.stringify({ profit_added_to_cash: false }) });
      await addNotification('حذف أرباح أوردر من الخزنة', `تم حذف أرباح الأوردر رقم ${order.order_number} (${order.customer_name}) من الخزنة`);
      await fetchCashLedger();
      return true;
    } catch (err) { console.error("فشل حذف أرباح الأوردر من الخزنة:", err); return false; }
  };

  const addCompanyProfitToCash = async (order: any) => {
    if (!isAdmin) return false;
    const orderId = Number(order.id);
    const companyShare = Number(order.company_share) || 0;
    if (cashProfitLocksRef.current.has(orderId)) return false;
    if (order.profit_added_to_cash) { showToast("تمت إضافة ربح هذا الأوردر للخزنة مسبقاً", "info"); return false; }
    if (companyShare <= 0) { showToast("لا يوجد نصيب شركة صالح لهذا الأوردر", "error"); return false; }
    if (!order.is_paid) { showToast("يجب اعتماد التحصيل أولاً", "error"); return false; }
    if (order.status !== 'completed') { showToast("لا يمكن إضافة ربح أوردر غير مكتمل", "error"); return false; }

    cashProfitLocksRef.current.add(orderId);
    try {
      const today = new Date().toISOString().split('T')[0];
      const roundedShare = Number(companyShare.toFixed(2));
      const response = await fetch(`${supabaseUrl}/rest/v1/cash_ledger`, {
        method: 'POST',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify({ type: 'income', amount: roundedShare, description: `أرباح شركة من أوردر ${order.customer_name} (رقم ${order.order_number})`, date: today })
      });
      if (!response.ok) { const error = await response.text(); throw new Error(`cash-ledger-insert-failed: ${error}`); }
      const insertedPayload = await response.json().catch(() => []);
      const insertedEntry = Array.isArray(insertedPayload) ? insertedPayload[0] : insertedPayload;
      const patchResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`, {
        method: 'PATCH', headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ profit_added_to_cash: true })
      });
      if (!patchResponse.ok) {
        if (insertedEntry?.id) await fetchAPI(`cash_ledger?id=eq.${insertedEntry.id}`, { method: 'DELETE' });
        throw new Error(`order-profit-flag-update-failed: ${await patchResponse.text()}`);
      }
      await addNotification('إضافة أرباح للخزنة', `✅ تم إضافة ${roundedShare} ج.م للخزنة من أوردر ${order.order_number} (${order.customer_name})`);
      await fetchCashLedger(); await fetchData();
      return true;
    } catch (err: any) {
      console.error('فشل إضافة أرباح الأوردر للخزنة:', err);
      showToast('تعذر اعتماد ربح الأوردر للخزنة؛ لم تكتمل العملية', 'error');
      return false;
    } finally {
      cashProfitLocksRef.current.delete(orderId);
    }
  };

  // ✅ توزيع أرباح يوم – يعتمد على الإيرادات اليومية فقط، بدون reserve، ويمنع التكرار
  const distributeProfitForDate = async (targetDate: string) => {
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
    try {
      const incomeEntries = await fetchAPI(`cash_ledger?select=amount&date=eq.${targetDate}&type=eq.income`);
      const totalIncome = (incomeEntries || []).reduce((sum: number, entry: any) => sum + (Number(entry.amount) || 0), 0);

      const expenseEntries = await fetchAPI(`cash_ledger?select=amount&date=eq.${targetDate}&type=eq.expense`);
      const totalExpenses = (expenseEntries || []).reduce((sum: number, entry: any) => sum + (Number(entry.amount) || 0), 0);

      const existingDistributions = await fetchAPI(`cash_ledger?select=amount&date=eq.${targetDate}&type=eq.profit_distribution`);
      const totalDistributedSoFar = (existingDistributions || []).reduce((sum: number, entry: any) => sum + (Number(entry.amount) || 0), 0);

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
        ? `💰 صافي دخل اليوم: ${totalIncome.toLocaleString()} ج.م\n👥 نسبة الشركاء: ${totalPartnerShares}%\n🏦 نسبة الخزنة: ${Math.max(0, 100 - totalPartnerShares)}%\n💸 مصروفات اليوم: ${totalExpenses.toLocaleString()} ج.م (تُخصم من نصيب الخزنة)\n📤 تم توزيع سابقاً: ${totalDistributedSoFar.toLocaleString()} ج.م\n🔄 المتبقي لتوزيعه على الشركاء الآن: ${amountToDistribute.toLocaleString()} ج.م\n\nهل تريد الاستمرار؟`
        : `💰 صافي دخل يوم ${targetDate}: ${totalIncome.toLocaleString()} ج.م\n👥 نسبة الشركاء: ${totalPartnerShares}%\n🏦 نسبة الخزنة: ${Math.max(0, 100 - totalPartnerShares)}%\n💸 مصروفات اليوم: ${totalExpenses.toLocaleString()} ج.م (تُخصم من نصيب الخزنة)\n💰 سيتم توزيع ${amountToDistribute.toLocaleString()} ج.م على الشركاء\n\nهل تريد الاستمرار؟`;

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

      await addNotification('تقرير خزنة للشركاء', reportText);
      void sendExternalPush({ event: 'system_alert', title: '🏦 تقرير الخزنة للشركاء', message: reportText, targetRoles: ['admin', 'manager'], data: { focus: 'notifications', report_date: targetDate } });
      showToast('✅ تم حفظ تقرير الخزنة وإرساله داخل البرنامج وPush فقط', 'success');
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
    if (!canManageCash) {
      showToast("مدير العمليات لا يملك صلاحية توزيع الأرباح أو إنشاء حركة خزنة", "error");
      return;
    }
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
    const requestId = ++latestFetchRequestRef.current;
    if (!isAutoRefresh) setLoading(true);
    let loadedAllDashboardData = false;
    try {
      const orderFields = isViewer
        ? 'id,order_number,customer_name,device_type,address,brand,problem_description,technician,status,total_amount,parts_cost,transport_cost,net_amount,company_share,technician_share,is_paid,created_at,date,deleted_at,technician_note,warranty_period,invoice_approved,invoice_date,parts_used,completed_at'
        : '*';
      const allOrders = await fetchAPIWithRetry(`orders?select=${orderFields}&order=created_at.desc`);
      if (requestId !== latestFetchRequestRef.current) return;
      if (allOrders === null) throw new Error('تعذر تحديث بيانات الأوردرات مؤقتًا');
      if (!Array.isArray(allOrders)) throw new Error('بيانات الأوردرات غير صالحة');
      // لا نستبدل البيانات المعروضة بصفر أثناء رد فارغ عابر من الشبكة أو الجلسة.
      const ordersArray = allOrders.length === 0 && lastGoodOrdersRef.current?.length ? lastGoodOrdersRef.current : allOrders;
      if (allOrders.length > 0) lastGoodOrdersRef.current = allOrders;

      // مراقبة الأوردرات الجديدة: لا نعتبر تغيير ID وحده دليلاً على أوردر حديث.
      // هذا يمنع رنين أوردر قديم عند إعادة فتح الصفحة أو بعد تغيّر التخزين المؤقت.
      if (ordersArray.length > 0) {
        const newestOrder = ordersArray.reduce((latest: any, current: any) => {
          const latestTime = new Date(latest?.created_at || latest?.createdAt || 0).getTime();
          const currentTime = new Date(current?.created_at || current?.createdAt || 0).getTime();
          return currentTime > latestTime ? current : latest;
        }, ordersArray[0]);
        const newestId = Number(newestOrder?.id);
        const newestCreatedAt = new Date(newestOrder?.created_at || newestOrder?.createdAt || 0).getTime();
        const previousCreatedAt = lastCheckedOrderCreatedAtRef.current;
        const isRecentOrder = Number.isFinite(newestCreatedAt) && newestCreatedAt > 0 && (Date.now() - newestCreatedAt) <= 2 * 60 * 1000;
        const isNewOrder = alertBaselineReadyRef.current && lastCheckedOrderId.current !== null && newestId > lastCheckedOrderId.current &&
          (previousCreatedAt === null || newestCreatedAt > previousCreatedAt) && isRecentOrder;
        if (isNewOrder) {
          const role = userRole?.toLowerCase() || '';
          if (role === 'admin' || role === 'manager') {
            console.log("🔍 Polling found a recent new order! ID:", newestId);
            startUrgentAlert();
          }
        }
        lastCheckedOrderId.current = Number.isFinite(newestId) ? newestId : lastCheckedOrderId.current;
        lastCheckedOrderCreatedAtRef.current = newestCreatedAt > 0 ? newestCreatedAt : previousCreatedAt;
      }

      const notDeleted = ordersArray.filter((o: any) => !o.deleted_at);
      const activeOrders = notDeleted.filter((o: any) => !isOldAndShouldArchive(o));
      const archivedOrders = notDeleted.filter((o: any) => isOldAndShouldArchive(o));
            const deletedOrders = ordersArray.filter((o: any) => o.deleted_at);
      if (requestId !== latestFetchRequestRef.current) return;
      setOrders(activeOrders);
      setArchivedOrders(archivedOrders);
      setDeletedOrders(deletedOrders);

      // التحديث الدوري يحتاج الأوردرات فقط؛ إعادة تحميل كل الجداول والصور كل 10 ثوانٍ كانت سبب البطء.
      // عند الفتح اليدوي أو تبديل البيانات، نجلب الجداول المساندة كاملة كما هي.
      if (!isAutoRefresh) {
        const [techsData, notificationsData, partnersData, cashData, usersData] = await Promise.all([
          fetchAPIWithRetry('technicians?select=*'),
          fetchAPIWithRetry('notifications?select=*&action=neq.employee_chat&order=created_at.desc'),
          fetchAPIWithRetry('partners?select=*&order=created_at.desc'),
          fetchAPIWithRetry('cash_ledger?select=*&order=date.desc,created_at.desc'),
          fetchAPIWithRetry('users?select=*&order=created_at.desc')
        ]);
        if (requestId !== latestFetchRequestRef.current) return;
        if (!Array.isArray(techsData) || !Array.isArray(notificationsData) || !Array.isArray(partnersData) || !Array.isArray(cashData) || !Array.isArray(usersData)) {
          throw new Error('لم تكتمل بيانات لوحة المدير بعد');
        }
        setTechnicians(techsData);
        setNotifications(notificationsData);
        const nextProfiles: Record<string, any> = {};
        notificationsData.filter((row: any) => row.action === 'technician_profile_updated').forEach((row: any) => {
          const profile = parseTechnicianProfileNotification(row);
          if (!profile) return;
          [profile.id, profile.code, profile.username, profile.name].filter(Boolean).forEach((key) => {
            const normalizedKey = String(key).trim().toLowerCase();
            const current = nextProfiles[normalizedKey];
            if (!current || new Date(profile.updatedAt || 0).getTime() >= new Date(current.updatedAt || 0).getTime()) nextProfiles[normalizedKey] = profile;
          });
        });
        setTechnicianProfiles(nextProfiles);
        setPartners(partnersData);
        setCashLedger(cashData);
        setUsers(usersData);
        let balance = 0;
        cashData.forEach((entry: any) => {
          const amount = Number(entry.amount) || 0;
          if (entry.type === 'income') balance += amount;
          else if (entry.type === 'expense' || entry.type === 'profit_distribution') balance -= amount;
        });
        setCashBalance(balance);
      }

      const pending = notDeleted.filter((o: any) => o.status === 'pending').length;
      const inProgress = notDeleted.filter((o: any) => o.status === 'in_progress').length;
      const completed = notDeleted.filter((o: any) => o.status === 'completed').length;
      const cancelled = notDeleted.filter((o: any) => o.status === 'cancelled').length;
      const totalIncome = notDeleted.filter((o: any) => o.is_paid).reduce((sum, o) => sum + (o.company_share || 0), 0);
      setStats({ pending, inProgress, completed, cancelled, totalIncome });

      // إنذار المتأخرات للمدير: لا نعيد تنبيه الأوردرات القديمة عند أول فتح
      const role = userRole?.toLowerCase() || '';
      const canEmitLiveAlerts = alertBaselineReadyRef.current;
      const delayedOrders = activeOrders.filter(o => isDelayed(o));
      const delayedIds = new Set<number>(delayedOrders.map((order: any) => Number(order.id)));
      const newDelayedOrders = delayedOrders.filter((order: any) => !delayedAlertIdsRef.current.has(Number(order.id)));
      delayedAlertIdsRef.current = delayedIds;
      if (canEmitLiveAlerts && newDelayedOrders.length > 0 && (role === 'admin' || role === 'manager')) {
        console.log("🚨 New delayed orders found! Count:", newDelayedOrders.length);
        startUrgentAlert();
        const lastAlert = localStorage.getItem('last_delay_alert_manager');
        const now = new Date().getTime();
        if (!lastAlert || (now - parseInt(lastAlert)) > 3600000) {
          void sendExternalPush({
            event: 'system_alert',
            title: '⚠️ تنبيه أوردرات متأخرة',
            message: `يوجد ${newDelayedOrders.length} أوردر دخل مرحلة التأخير الآن. يرجى المتابعة مع الفنيين.`,
            targetRoles: ['admin', 'manager']
          });
          localStorage.setItem('last_delay_alert_manager', now.toString());
        }
      }
      if (role === 'admin' || role === 'manager') {
        // تصعيد تلقائي بعد 30 دقيقة، مع تجاهل كل الحالات الموجودة قبل فتح اللوحة
        const escalationCandidates = activeOrders.filter((order: any) => {
          const createdAt = getOrderCreatedAt(order);
          const isAssigned = Boolean(order.technician && order.technician !== '-');
          return order.status === 'pending' && isAssigned && createdAt && (Date.now() - createdAt.getTime()) >= 30 * 60 * 1000;
        });
        const escalationIds = new Set<number>(escalationCandidates.map((order: any) => Number(order.id)));
        const newEscalations = escalationCandidates.filter((order: any) => !escalationAlertIdsRef.current.has(Number(order.id)));
        escalationAlertIdsRef.current = escalationIds;
        if (canEmitLiveAlerts) {
          for (const order of newEscalations) {
            const details = `🚨 تصعيد تلقائي\nالفني: ${order.technician}\nالأوردر: ${order.order_number}\nالعميل: ${order.customer_name}\nتم التعيين منذ أكثر من 30 دقيقة ولم يبدأ الفني العمل بعد.`;
            const sent = await sendSmartAlertOnce(`smart_escalation_${order.id}`, 'تصعيد تعيين فني', details, {
              title: '🚨 فني لم يبدأ الأوردر',
              message: details,
              data: { order_id: order.id, order_number: order.order_number, technician: order.technician }
            });
            if (sent) startUrgentAlert();
          }
        }

        // تحضير baseline الضمان قبل السماح بالتنبيه
        const expiringOrders = notDeleted.filter((order: any) => getWarrantyStatus(order).status === 'expiring');
        const expiringIds = new Set<number>(expiringOrders.map((order: any) => Number(order.id)));
        const newExpiringOrders = expiringOrders.filter((order: any) => !expiringWarrantyIdsRef.current.has(Number(order.id)));
        expiringWarrantyIdsRef.current = expiringIds;
        if (canEmitLiveAlerts && newExpiringOrders.length > 0) {
          const todayKey = new Date().toISOString().split('T')[0];
          const warrantyDetails = `🛡️ ضمانات تقترب من الانتهاء (${newExpiringOrders.length})\n${newExpiringOrders.map((order: any) => `#${order.order_number} - ${order.customer_name} - ${getWarrantyStatus(order).text}`).join('\\n')}`;
          const sent = await sendSmartAlertOnce(`smart_warranty_${todayKey}`, 'ضمان يقترب من الانتهاء', warrantyDetails, {
            title: '🛡️ ضمانات تنتهي قريباً',
            message: warrantyDetails,
            data: { count: newExpiringOrders.length }
          });
          if (sent) startUrgentAlert();
        }

        // رادار نسب المصروفات في الفواتير المعتمدة، مع تجاهل القديم (أكثر من 3 أيام)
        const highExpenseSettlements = notDeleted.filter((order: any) => {
          const total = Number(order.total_amount) || 0;
          if (order.status !== 'completed' || !order.invoice_approved || total <= 0) return false;
          
          // حماية: لا ننبه عن أوردرات قديمة جداً (تجاوزت 3 أيام من تاريخ التسجيل)
          const orderAge = getDaysDifference(getOrderReferenceDate(order), order.status);
          if (orderAge > 3) return false;

          const partsPercent = ((Number(order.parts_cost) || 0) / total) * 100;
          const transportPercent = ((Number(order.transport_cost) || 0) / total) * 100;
          return partsPercent > 40 || transportPercent > 15;
        });
        const highExpenseIds = new Set<number>(highExpenseSettlements.map((order: any) => Number(order.id)));
        const newHighExpenseSettlements = highExpenseSettlements.filter((order: any) => !highExpenseAlertIdsRef.current.has(Number(order.id)));
        highExpenseAlertIdsRef.current = highExpenseIds;
        if (canEmitLiveAlerts) {
          for (const order of newHighExpenseSettlements) {
            const total = Number(order.total_amount) || 0;
            const partsPercent = ((Number(order.parts_cost) || 0) / total) * 100;
            const transportPercent = ((Number(order.transport_cost) || 0) / total) * 100;
            const expenseWarnings = [
              partsPercent > 40 ? `قطع الغيار ${partsPercent.toFixed(1)}% (الحد 40%)` : '',
              transportPercent > 15 ? `المواصلات ${transportPercent.toFixed(1)}% (الحد 15%)` : ''
            ].filter(Boolean).join('، ');
            const details = `⚠️ مصروفات مرتفعة بالنسبة لإجمالي الفاتورة\nالفني: ${order.technician || 'غير محدد'}\nالأوردر: ${order.order_number}\nالعميل: ${order.customer_name}\nإجمالي الفاتورة: ${total.toLocaleString()} ج.م\n${expenseWarnings}`;
            const sent = await sendSmartAlertOnce(`smart_high_expense_${order.id}`, 'مصروفات مرتفعة بالنسبة للفاتورة', details, {
              title: '⚠️ مصروفات مرتفعة بالنسبة للفاتورة',
              message: details,
              data: { order_id: order.id, total_amount: total, parts_percent: partsPercent, transport_percent: transportPercent }
            });
            if (sent) startUrgentAlert();
          }
        }

        // حصاد يومي للفنيين بعد الساعة 9 مساءً، يبدأ بعد baseline الصامت
      if (canEmitLiveAlerts && new Date().getHours() >= 21 && Array.isArray(technicians)) {
        const todayKey = new Date().toISOString().split('T')[0];
        for (const tech of technicians) {
            const techOrders = notDeleted.filter((order: any) => order.technician === tech.name);
            const todayOrders = techOrders.filter((order: any) => {
              const createdAt = getOrderCreatedAt(order);
              return createdAt && createdAt.toISOString().split('T')[0] === todayKey;
            });
            const completedToday = todayOrders.filter((order: any) => order.status === 'completed').length;
            const earningsToday = todayOrders.filter((order: any) => order.status === 'completed').reduce((sum: number, order: any) => sum + (Number(order.technician_share) || 0), 0);
            const summary = `📊 حصادك اليومي يا ${tech.name}\nأوردرات اليوم: ${todayOrders.length}\nالمكتمل: ${completedToday}\nمستحقاتك اليوم: ${earningsToday.toLocaleString()} ج.م\nالأوردرات المفتوحة: ${techOrders.filter((order: any) => ['pending', 'in-progress'].includes(order.status)).length}`;
            if (tech.id) {
              const summaryKey = `smart_daily_summary_${todayKey}_${tech.id}`;
              if (!localStorage.getItem(summaryKey)) {
                localStorage.setItem(summaryKey, new Date().toISOString());
                void sendExternalPush({ event: 'system_alert', title: '📊 حصادك اليومي', message: summary, targetUserIds: [`tech:${tech.id}`], data: { date: todayKey, technician: tech.name } });
              }
            }
          }
        }
      }
      // بعد تخزين baseline لا نعتبر البيانات القديمة أحداثاً جديدة في التحديث التالي
      alertBaselineReadyRef.current = true;
      loadedAllDashboardData = true;
    } catch (err) {
      console.error(err);
      if (!isAutoRefresh) window.setTimeout(() => { void fetchData(); }, 1500);
    } finally {
      if (requestId === latestFetchRequestRef.current) {
        setLoading(false);
        if (!isAutoRefresh && loadedAllDashboardData) setInitialLoadComplete(true);
      }
    }
  }, [userRole, isViewer]);

  const openManagerPickupReceipt = async (order: any) => {
    try {
      if (!parsePickupReceipt(order)) {
        const pickupRecord: PickupReceiptData = {
          type: 'full_device',
          partName: '',
          deposit: Number(order.deposit_amount) || 0,
          notes: '',
          photos: [],
          pickupDate: String(order.created_at || new Date().toISOString()),
          status: 'active'
        };
        const previousNotes = String(order.technician_notes || order.technician_note || '').trim();
        const marker = createPickupMarker(pickupRecord);
        const finalNotes = `${previousNotes}${previousNotes ? '\\n' : ''}${marker}`;
        const response = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`, {
          method: 'PATCH',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ technician_notes: finalNotes, technician_note: finalNotes })
        });
        if (!response.ok) throw new Error(await response.text());
        await fetchData(true);
      }
      window.open(`/pickup-receipt?id=${order.id}`, '_blank');
    } catch (err) {
      console.error('فشل تجهيز إيصال السحب من لوحة المدير:', err);
      showToast('تعذر ربط إيصال السحب بالتتبع، حاول مرة أخرى', 'error');
    }
  };

  useEffect(() => {
    fetchData();
    fetchNotifications();

    // ربط المدير ومدير العمليات بهوية ثابتة ووسوم OneSignal الموثوقة
    const { user: signedInUser } = readAuthSession();
    syncOneSignalIdentity(signedInUser, userRole);

    // نظام التحديث التلقائي (المراقب الذكي)
    const interval = setInterval(() => {
      console.log("🔄 Auto-polling for new orders...");
      void fetchData(true);
      // لا نعيد تحميل سجل الإشعارات الكامل إلا عند فتح تبويبه؛ التنبيهات الفورية تأتي عبر Realtime.
      if (activeTab === 'notifications' || activeTab === 'feedback') void fetchNotifications();
    }, 30000);

    // اشتراك حي للأوردرات الجديدة لإصدار صوت تنبيه ملح للمدير
    console.log("🔔 Realtime subscription active for role:", userRole);
    const channel = supabase
      .channel('orders-audio-alert')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const insertedOrder = payload.new as any;
        const insertedAt = new Date(insertedOrder?.created_at || 0).getTime();
        const isRecentInsert = Number.isFinite(insertedAt) && insertedAt > 0 && (Date.now() - insertedAt) <= 2 * 60 * 1000;
        if (!isRecentInsert) {
          console.log("ℹ️ Ignored stale realtime order insert", insertedOrder?.id);
          fetchData(true);
          return;
        }
        console.log("🆕 Recent new order detected via realtime!", payload);
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

    // اشتراك حي لتنبيهات الأوردرات والتصفية والفواتير (Fallback)
    const alertChannel = supabase
      .channel('admin-operation-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const notification = payload.new as any;
        const action = String(notification?.action || '');
        const isNewOrderOperation = action === 'new_order_alert' || action === 'new_order' || action === 'إضافة أوردر' || action.includes('أوردر جديد') || action.includes('طلب صيانة جديد');
        const isUrgentOperation = isNewOrderOperation || action === 'settlement_alert';
        const createdAt = new Date(notification?.created_at || 0).getTime();
        const isRecentNotification = Number.isFinite(createdAt) && createdAt > 0 && (Date.now() - createdAt) >= -30_000 && (Date.now() - createdAt) <= 2 * 60 * 1000;
        if (!isUrgentOperation || !isRecentNotification) {
          if (isUrgentOperation) console.log('ℹ️ Ignored stale operation notification', notification?.id);
          return;
        }
        console.log("🔔 Operation alert received!", payload);
        const role = userRole?.toLowerCase() || '';
        if (role === 'admin' || role === 'manager') {
          startUrgentAlert();
          fetchData();
          fetchNotifications();
          showToast(action === 'settlement_alert' ? '💰 تم تسجيل تصفية فاتورة جديدة' : '🆕 تم تسجيل أوردر جديد', 'info');
        }
      })
      .subscribe();

    // اشتراك تتبع المتواجدين حالياً
    const presenceChannel = supabase.channel('online-users');
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const presenceList = Object.values(state).flat() as any[];
        // قد يفتح المستخدم أكثر من تبويب/جهاز، لذلك نعرض كل مستخدم مرة واحدة فقط.
        const uniqueUsers = Array.from(
          new Map(
            presenceList.map((user: any) => [
              String(user.user_id ?? `${user.name ?? 'مستخدم'}:${user.role ?? ''}`),
              user,
            ])
          ).values()
        );
        setOnlineUsers(uniqueUsers);
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
    const total = parseFloat(String(data.total_amount || 0)) || 0;
    const parts = parseFloat(String(data.parts_cost || 0)) || 0;
    const transport = parseFloat(String(data.transport_cost || 0)) || 0;
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
      case 'inspected': statusMessage = "🔍 تمت زيارة الكشف وتشخيص العطل. تم تسجيل قيمة الكشف/الزيارة فقط، والإصلاح غير منفذ."; break;
      case 'completed': statusMessage = "✅ تم إكمال طلب الصيانة بنجاح. شكراً لثقتك بنا!"; break;
      case 'cancelled': statusMessage = "❌ تم إلغاء طلب الصيانة. للاستفسار، يرجى الاتصال بنا."; break;
      default: return;
    }
    const trackingUrl = `https://www.maintenanceguide.life/track/${order.order_number}`;
    const message = `📢 *تحديث هام بخصوص طلب الصيانة* 📢\n━━━━━━━━━━━━━━━━━━━━━━\n🔢 *رقم الطلب:* ${order.order_number}\n👤 *عزيزنا العميل:* ${order.customer_name}\n\n${statusMessage}\n\n📍 *يمكنك تتبع حالة طلبك مباشرة من هنا:*\n${trackingUrl}\n\n🌟 *شكراً لثقتكم في HomeCare Maintenance. نحن دائماً في خدمتكم.*`;
    openWhatsApp(order.phone, message);
  };

  const updateOrderStatus = async (id: number, newStatus: string, extraData = {}) => {
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
    const order = [...orders, ...archivedOrders].find(o => o.id === id);
    if (!order) return;
    const oldStatus = order.status;
    try {
      if (['completed', 'inspected'].includes(oldStatus) && !['completed', 'inspected'].includes(newStatus) && order.profit_added_to_cash) await deleteOrderProfitFromCash(order);
      await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus, ...extraData }) });
      await addNotification('تغيير حالة أوردر', `🔄 تم تغيير حالة أوردر ${order.customer_name} إلى ${newStatus}`);
      if (['completed', 'inspected'].includes(newStatus) && order.is_paid && !order.profit_added_to_cash) await addCompanyProfitToCash({ ...order, status: newStatus, ...extraData });
      sendWhatsAppToCustomer(order, newStatus);
      fetchData();

      showToast(`تم تحديث حالة الأوردر إلى ${newStatus}`, 'info');
    } catch (e) {
      console.error(e);
      showToast('تعذر تحديث الحالة', 'error');
    }
  };

  const handleReturnOrder = async () => {
    if (!selectedOrderForReturn || !returnReason.trim()) return;
    
    setIsSubmitting(true);
    try {
      // تم إزالة أي تعامل مع الخزنة بناءً على طلب المستخدم - الرصيد سيبقى كما هو
      const returnNote = `\n[⚠️ مرتجع صيانة: ${returnReason}]`;
      const updatedNote = `${selectedOrderForReturn.technician_note || ''}${returnNote}`;
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'returned', 
          technician_note: updatedNote,
          is_paid: false,
          profit_added_to_cash: false,
          invoice_approved: false
        })
        .eq('id', selectedOrderForReturn.id);

      if (error) throw error;

      // إرسال إشعار فوري للفني
      if (selectedOrderForReturn.technician) {
        void sendExternalPush({
          event: 'system_alert',
          title: '⚠️ تنبيه: أوردر مرتجع',
          message: `الفني ${selectedOrderForReturn.technician}: تم إعادة الأوردر رقم ${selectedOrderForReturn.order_number} كمرتجع. السبب: ${returnReason}`,
          targetTags: [{ key: 'tech_name', value: selectedOrderForReturn.technician }]
        });
      }

      showToast("تم إعادة الأوردر للفني وتعديل الحسابات بنجاح", "success");
      setShowReturnModal(false);
      setReturnReason("");
      fetchData();
    } catch (err) {
      console.error(err);
      showToast("تعذر إعادة الأوردر", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchConfirmPaid = async () => {
    if (!isAdmin) return showToast('اعتماد التحصيل متاح لمدير النظام فقط', 'error');
    const unpaidCompleted = filteredOrders.filter(isCollectionPending);
    if (unpaidCompleted.length === 0) return;
    
    if (!window.confirm(`هل أنت متأكد من اعتماد تحصيل عدد ${unpaidCompleted.length} أوردر دفعة واحدة؟ سيتم تصفير عداد التحصيل المعلق.`)) return;
    
    setIsSubmitting(true);
    try {
      const ids = unpaidCompleted.map(o => o.id);
      const { error } = await supabase
        .from('orders')
        .update({ is_paid: true })
        .in('id', ids);
        
      if (error) throw error;
      
      showToast(`تم اعتماد تحصيل ${ids.length} أوردر بنجاح`, "success");
      fetchData();
    } catch (err) {
      console.error(err);
      showToast("تعذر اعتماد التحصيل الجماعي", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hideOldManualCollections = async () => {
    if (!isAdmin) return showToast('هذا الإجراء متاح لمدير النظام فقط', 'error');
    const candidates = pendingCollectionOrders.filter(order => !isManualCollectionClosed(order));
    if (candidates.length === 0) return showToast('لا توجد أوردرات تحصيل ظاهرة للإخفاء', 'info');
    const confirmation = window.prompt(`سيتم إخفاء ${candidates.length} أوردر الظاهرة حالياً من قائمة التأكيد فقط، دون تعديل الخزنة أو تسجيل تحصيل جديد. اكتب: إخفاء التحصيل الظاهر`);
    if (confirmation?.trim() !== 'إخفاء التحصيل الظاهر') return showToast('تم إلغاء العملية للحماية', 'info');
    setIsSubmitting(true);
    try {
      await Promise.all(candidates.map(order => {
        const currentNote = String(order.technician_note || '').trim();
        return fetchAPI(`orders?id=eq.${order.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ technician_note: `${currentNote}${currentNote ? '\\n' : ''}${MANUAL_COLLECTION_CLOSED_MARKER} تم الإنهاء يدوياً` })
        });
      }));
      showToast(`تم إخفاء ${candidates.length} أوردر قديم من قائمة التحصيل`, 'success');
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast('تعذر إخفاء بعض الأوردرات القديمة', 'error');
    } finally {
      setIsSubmitting(false);
    }
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

  const confirmCompanyTransferReceipt = async (order: any) => {
    if (!isAdmin) return showToast('لا تملك صلاحية تأكيد استلام التحويل (للمدير العام فقط)', 'error');
    if (confirmingTransferId === order.id) return;
    const transfer = parseCompanyTransfer(order.technician_note);
    if (transfer?.status !== 'pending') return showToast('لا يوجد تحويل معلّق لهذا الأوردر', 'info');
    if (order.is_paid || order.profit_added_to_cash) return showToast('تم اعتماد هذا التحويل مسبقاً', 'info');

    setConfirmingTransferId(order.id);
    try {
      // نسجل التحصيل أولاً، ثم نستخدم المسار المالي الموجود لإضافة نصيب الشركة للخزنة.
      await fetchAPI(`orders?id=eq.${order.id}`, { method: 'PATCH', body: JSON.stringify({ is_paid: true }) });
      const addedToTreasury = await addCompanyProfitToCash({ ...order, company_share: Number(order.company_share) || 0, is_paid: true, profit_added_to_cash: false });
      if (!addedToTreasury) {
        await fetchAPI(`orders?id=eq.${order.id}`, { method: 'PATCH', body: JSON.stringify({ is_paid: false }) });
        return;
      }

      const confirmedNote = mergeCompanyTransferMarker(order.technician_note, {
        status: 'confirmed',
        amount: Number(transfer.amount ?? order.company_share) || 0,
        technician: transfer.technician || order.technician,
        at: new Date().toISOString()
      });
      await fetchAPI(`orders?id=eq.${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ technician_note: confirmedNote })
      });
      await addNotification('تأكيد استلام تحويل شركة', `✅ تم تأكيد استلام ${Number(transfer.amount ?? order.company_share).toLocaleString('ar-EG')} ج.م من الفني ${order.technician || 'غير محدد'} للأوردر ${order.order_number} وإضافتها إلى الخزنة`);

      const technician = technicians.find((tech: any) => tech.name === order.technician || tech.username === order.technician);
      if (technician?.id) {
        void sendExternalPush({
          event: 'system_alert',
          title: '✅ تم اعتماد تحويل نصيب الشركة',
          message: `تم تأكيد استلام ${Number(transfer.amount ?? order.company_share).toLocaleString('ar-EG')} ج.م للأوردر ${order.order_number}.`,
          targetUserIds: [`tech:${technician.id}`],
          data: { order_id: order.id, order_number: order.order_number, transfer_status: 'confirmed' }
        });
      }
      await fetchData();
      await fetchCashLedger();
      showToast('✅ تم تأكيد الاستلام وإضافة نصيب الشركة للخزنة', 'success');
    } catch (err) {
      console.error('فشل تأكيد تحويل الشركة:', err);
      showToast('تعذر تأكيد التحويل. لم يتم اعتماد العملية بالكامل.', 'error');
    } finally {
      setConfirmingTransferId(null);
    }
  };

  const togglePaidStatus = async (id: number, currentStatus: boolean) => {
    if (!isAdmin) return showToast("ليس لديك صلاحية التحصيل (للمدير العام فقط)", "error");
    const order = [...orders, ...archivedOrders].find(o => o.id === id);
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

  const permanentlyDeleteOrder = async (id: number) => {
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
    const order = deletedOrders.find(o => o.id === id);
    if (!order) return;
    const confirmation = prompt(
      `⚠️ حذف نهائي لا يمكن التراجع عنه\n\nالعميل: ${order.customer_name}\nرقم الأوردر: ${order.order_number}\n\nاكتب "حذف نهائي" للتأكيد:`
    );
    if (confirmation !== "حذف نهائي") {
      showToast("تم إلغاء الحذف النهائي", "info");
      return;
    }
    try {
      await fetchAPI(`orders?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف نهائي', `تم حذف أوردر ${order.customer_name} (رقم ${order.order_number}) نهائياً`);
      await fetchData();
      showToast('تم حذف الأوردر نهائياً', 'error');
    } catch (err) {
      console.error(err);
      showToast('تعذر تنفيذ الحذف النهائي', 'error');
    }
  };

  const permanentlyDeleteAllOrders = async () => {
    if (!canEditDelete()) return showToast("ليس لديك صلاحية", "error");
    if (deletedOrders.length === 0) return showToast("سلة المحذوفات فارغة", "info");
    const confirmation = prompt(
      `⚠️ تحذير شديد: سيتم حذف ${deletedOrders.length} أوردر نهائياً من قاعدة البيانات ولا يمكن استعادتها.\n\nاكتب "حذف الكل نهائياً" للتأكيد:`
    );
    if (confirmation !== "حذف الكل نهائياً") {
      showToast("تم إلغاء مسح سلة المحذوفات", "info");
      return;
    }
    try {
      await Promise.all(deletedOrders.map(order => fetchAPI(`orders?id=eq.${order.id}`, { method: 'DELETE' })));
      await addNotification('مسح سلة المحذوفات', `تم حذف ${deletedOrders.length} أوردر نهائياً`);
      await fetchData();
      showToast('تم مسح سلة المحذوفات نهائياً', 'error');
    } catch (err) {
      console.error(err);
      showToast('تعذر إكمال مسح سلة المحذوفات بالكامل', 'error');
      await fetchData();
    }
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

  const getTrackingUrl = (order: any) => `${window.location.origin}/track/${encodeURIComponent(String(order.order_number || order.id))}`;

  const sendTrackingLinkToCustomer = (order: any) => {
    const trackingUrl = getTrackingUrl(order);
    const message = `أ/ ${order.customer_name || 'العميل'}،

يمكنك متابعة حالة طلب الصيانة رقم ${order.order_number || order.id} من خلال الرابط التالي:
${trackingUrl}

مع تحيات Maintenance Guide`;
    sendWhatsApp(order.phone, message);
    setTrackingShareOrderId(null);
    showToast('✅ تم فتح واتساب برابط التتبع', 'success');
  };

  const copyTrackingLink = async (order: any) => {
    const trackingUrl = getTrackingUrl(order);
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopiedId(order.id);
      setTimeout(() => setCopiedId(null), 2500);
      showToast('✅ تم نسخ رابط التتبع', 'success');
    } catch (err) {
      console.error('فشل نسخ رابط التتبع:', err);
      showToast('تعذر نسخ الرابط، حاول مرة أخرى', 'error');
    }
    setTrackingShareOrderId(null);
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
    const orderToSave: any = { ...formData, device_type: finalDevice, brand: finalBrand, order_number: editingOrder ? editingOrder.order_number : `MG-${Date.now()}` };
    try {
      if (editingOrder) {
        const oldOrder = [...orders, ...archivedOrders].find(o => o.id === editingOrder.id);
        if (oldOrder?.status === 'completed' && oldOrder?.is_paid && oldOrder?.profit_added_to_cash) await deleteOrderProfitFromCash(oldOrder);
        await fetchAPI(`orders?id=eq.${editingOrder.id}`, { method: 'PATCH', body: JSON.stringify(orderToSave) });
        await addNotification('تعديل أوردر', `تم تعديل أوردر ${formData.customer_name}`);
        const technicianChanged = String(oldOrder?.technician || '').trim().toLowerCase() !== String(orderToSave.technician || '').trim().toLowerCase();
        if (technicianChanged && orderToSave.technician) sendTechnicianAssignmentToCustomer({ ...orderToSave, id: editingOrder.id }, orderToSave.technician);

        if (orderToSave.technician) {
          const tech = findTechnicianByIdentity(technicians, orderToSave.technician);
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
                const savedOrderResult = await fetchAPI('orders', { method: 'POST', body: JSON.stringify(orderToSave) });
        if (savedOrderResult === null) throw new Error('تعذر حفظ الأوردر بسبب مشكلة اتصال');
        // التنبيه لا ينتظر أي طلب فرعي؛ يجب أن يبدأ فور نجاح حفظ الأوردر.
        startUrgentAlert();
        void addNotification('new_order_alert', `تم إضافة أوردر جديد للعميل ${formData.customer_name} — ${orderToSave.order_number}`);
        const adminMsg = `🆕 *إشعار: طلب صيانة جديد* 🆕\n━━━━━━━━━━━━━━━━━━━━━━\n🔢 *رقم الطلب:* ${orderToSave.order_number}\n👤 *العميل:* ${formData.customer_name}\n📱 *الهاتف:* ${formData.phone}\n🔧 *الجهاز:* ${finalDevice} - ${finalBrand}\n📍 *العنوان:* ${formData.address}\n👨‍🔧 *الفني:* ${orderToSave.technician || 'غير معين'}\n📝 *المشكلة:* ${formData.problem_description || 'لا يوجد وصف'}\n━━━━━━━━━━━━━━━━━━━━━━`;
        notifyAdmin(adminMsg);
        const pushResult = await sendExternalPush({
          event: 'new_order',
          title: '🆕 أوردر جديد',
          message: adminMsg,
          // استهداف مباشر للحسابين الإداريين حتى لا يعتمد الإرسال على وسوم OneSignal القديمة.
          targetUserIds: ['staff:admin:1', 'staff:manager:5'],
          data: { order_number: orderToSave.order_number }
        });
        if (!pushResult.ok) {
          console.warn('New order push failed:', pushResult.error);
          showToast(`تم حفظ الأوردر والتنبيه الداخلي، لكن فشل Push: ${pushResult.error || 'خطأ غير معروف'}`, 'error');
        }

        if (orderToSave.technician) {
          const tech = findTechnicianByIdentity(technicians, orderToSave.technician);
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
        if (orderToSave.technician) sendTechnicianAssignmentToCustomer(orderToSave, orderToSave.technician);
        else sendWhatsAppToCustomerOnCreate(orderToSave);
      }
      setShowOrderModal(false); setEditingOrder(null);
      setFormData({ customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '', status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false, invoice_approved: false, warranty_period: '6 أشهر', invoice_date: new Date().toISOString().split('T')[0], parts_used: '', date: new Date().toLocaleDateString("ar-EG") });
      setIsOtherDevice(false); setIsOtherBrand(false); setCustomDevice(''); setCustomBrand('');
      fetchData();
    } catch (err) { console.error(err); showToast("حدث خطأ أثناء الحفظ", "error"); } finally { setIsSubmitting(false); }
  };

  const updateAllPendingOrdersProfit = async (technicianName: string, newPercentage: number) => {
    if (!canManageTechnicians) return showToast("مدير العمليات لا يملك صلاحية تعديل بيانات الفنيين أو نسبهم", "error");
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
    if (!canManageTechnicians) return showToast("مدير العمليات لا يملك صلاحية تعديل الفنيين", "error");

    // 🛡️ حماية من التكرار
    const isDuplicate = !editingTech && technicians.some(t =>
      t.name.toLowerCase() === techForm.name.toLowerCase() ||
      (techForm.username && t.username?.toLowerCase() === techForm.username.toLowerCase())
    );
    if (isDuplicate) return showToast("⚠️ هذا الفني موجود بالفعل بنفس الاسم", "error");

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
    if (!canManageTechnicians) return showToast("مدير العمليات لا يملك صلاحية حذف الفنيين", "error");
    if (confirm(`حذف الفني ${name}؟`)) {
      await fetchAPI(`technicians?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف فني', `تم حذف الفني ${name}`);
      fetchData();
    }
  };

  const toggleTechnicianActive = async (tech: any) => {
    if (!canManageTechnicians) return showToast("مدير العمليات لا يملك صلاحية تعديل الفنيين", "error");
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

  const sendOldOrdersReminderToTechnician = async (tech: any) => {
    if (!['admin', 'manager'].includes(userRole?.toLowerCase() || '')) {
      return showToast('لا تملك صلاحية إرسال تنبيه للفني', 'error');
    }
    if (!tech?.phone) return showToast(`لا يوجد رقم واتساب مسجل للفني ${tech?.name || ''}`, 'error');

    const openOrders = getOpenOrdersForTechnician(tech);
    const oldOrders = openOrders.filter((order: any) => order.ageDays > 2).sort((a: any, b: any) => b.ageDays - a.ageDays);
    if (oldOrders.length === 0) {
      return showToast(openOrders.length > 0
        ? `لدى ${tech.name} ${openOrders.length} أوردر مفتوح، لكنها لم تتجاوز يومين بعد`
        : `لا توجد أوردرات مفتوحة مسجلة باسم ${tech.name}`, 'info');
    }

    const statusLabels: Record<string, string> = {
      pending: 'انتظار',
      'in-progress': 'قيد التنفيذ',
      in_progress: 'قيد التنفيذ',
      deferred: 'مؤجل'
    };
    const orderLines = oldOrders.map((order: any, index: number) =>
      `${index + 1}. ${order.order_number || `#${order.id}`} — ${statusLabels[order.status] || order.status} — متأخر ${order.ageDays} يوم`
    ).join('\n');
    const message = `🚨 *تنبيه عاجل — إغلاق الأوردرات القديمة* 🚨\n━━━━━━━━━━━━━━━━━━━━━━\n👨‍🔧 *الفني:* ${tech.name}\n📋 *عدد الأوردرات المطلوب متابعتها:* ${oldOrders.length}\n\n${orderLines}\n\n⚠️ يرجى فتح كل أوردر الآن وتحديث حالته بدقة: إكمال وتصفية، أو تسجيل كشف، أو إلغاء بسبب واضح. لا تترك أي أوردر مفتوحاً دون إجراء.\n\n✅ بعد الانتهاء، تأكد من حفظ كل تحديث داخل البرنامج وإبلاغ الإدارة.\n🏢 *Maintenance Guide (MG)*`;
    const pushMessage = `لديك ${oldOrders.length} أوردر قديم مفتوح. يرجى مراجعتها وإغلاقها أو تحديث حالتها فوراً.`;
    void sendExternalPush({
      event: 'system_alert',
      title: '🚨 إجراء عاجل: إغلاق الأوردرات القديمة',
      message: pushMessage,
      targetUserIds: tech.id ? [`tech:${tech.id}`] : undefined,
      data: { technician: tech.name, old_orders_count: oldOrders.length, order_numbers: oldOrders.map((order: any) => order.order_number).join(', ') }
    });
    
    // v3.8.7: تفعيل فتح واتساب فعلياً للفني
    openWhatsApp(tech.phone, message);
    
    await addNotification('تنبيه إغلاق أوردرات قديمة', `تم إرسال تنبيه واتساب للفني ${tech.name} بخصوص ${oldOrders.length} أوردر مفتوح قديم: ${oldOrders.map((order: any) => order.order_number).join(', ')}`);
    showToast(`✅ تم فتح واتساب وإرسال التنبيه للفني ${tech.name}`, 'success');
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

  const markNotificationRead = (id: number) => {
    setReadNotificationIds(previous => {
      const next = new Set(previous);
      next.add(id);
      try { localStorage.setItem('mg_read_notification_ids', JSON.stringify(Array.from(next).slice(-1000))); } catch { /* storage unavailable */ }
      return next;
    });
  };
  const openNotificationTarget = (notif: any) => {
    if (notif?.id != null) markNotificationRead(Number(notif.id));
    const details = String(notif?.details || '');
    const explicitOrderNumber = String(
      notif?.order_number || notif?.orderNumber || notif?.data?.order_number || notif?.metadata?.order_number || ''
    ).trim();
    const orderTokens = [
      explicitOrderNumber,
      ...(details.match(/MG-\d{3,}|(?:الأوردر|الأوردر رقم|طلب)[:\s-]*\d{3,}/gi) || [])
    ].filter(Boolean);
    const targetOrder = [...orders, ...archivedOrders, ...deletedOrders].find((order) => {
      if (notif?.order_id && String(order.id) === String(notif.order_id)) return true;
      const orderValue = String(order.order_number || '').toLowerCase();
      return orderTokens.some((token) => {
        const normalized = String(token).replace(/.*?(MG-\d{3,}|\d{3,})/i, '$1').toLowerCase();
        return orderValue === normalized || orderValue.endsWith(normalized) || normalized.endsWith(orderValue.replace(/^mg-/, ''));
      });
    });
    const orderNumber = explicitOrderNumber || orderTokens[0] || '';

    if (!targetOrder) {
      setActiveTab('orders');
      if (orderNumber) setSearchTerm(orderNumber);
      showToast(orderNumber ? `تم فتح قائمة الأوردر للبحث عن ${orderNumber}` : 'هذا الإشعار لا يحتوي على رقم أوردر مرتبط', 'info');
      return;
    }

    stopUrgentAlert();
    setActiveTab('orders');
    setEditingOrder(targetOrder);
    setFormData(targetOrder);
    setFormStep(1);
    setShowOrderModal(true);
    showToast(`تم فتح الحدث: ${notif.action || 'نشاط فني'} — ${targetOrder.order_number}`, 'success');
  };

  const deleteNotification = async (id: number) => {
    if (userRole !== 'admin') return showToast("ليس لديك صلاحية", "error");
    const notification = notifications.find((item) => item.id === id);
    if (notification?.action === 'تقييم عميل') {
      return showToast("لا يمكن حذف تقييمات العملاء من سجل الإشعارات حفاظاً على التقارير", "error");
    }
    await fetchAPI(`notifications?id=eq.${id}`, { method: 'DELETE' });
    fetchNotifications();
  };
  const deleteAllNotifications = async () => {
    if (userRole !== 'admin') return showToast("ليس لديك صلاحية", "error");
    if (confirm('هل أنت متأكد من حذف جميع الإشعارات نهائياً؟')) {
      try {
        // ✅ مسح الإشعارات التشغيلية فقط مع الحفاظ على تقييمات العملاء للأرشيف والتقارير.
        const feedbackAction = encodeURIComponent('تقييم عميل');
        const chatAction = encodeURIComponent('employee_chat');
        await fetchAPI(`notifications?action=neq.${feedbackAction}&action=neq.${chatAction}`, { method: 'DELETE' });
        showToast("✅ تم مسح الإشعارات التشغيلية مع الحفاظ على تقييمات العملاء", "success");
        fetchNotifications();
      } catch (err) {
        console.error(err);
        showToast("❌ حدث خطأ أثناء مسح الإشعارات", "error");
      }
    }
  };
  const clearFilters = () => { setSearchTerm(''); setFilterStatus('live'); setFilterTechnician(''); setFilterDeviceType(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterDelay('all'); setFilterWarranty('all'); };

  // علامة صريحة للأوردرات التي تم إنهاء تحصيلها يدوياً خارج البرنامج.
  const MANUAL_COLLECTION_CLOSED_MARKER = '[COLLECTION_MANUAL_CLOSED]';
  const isManualCollectionClosed = (order: any) => String(order.technician_note || '').includes(MANUAL_COLLECTION_CLOSED_MARKER);
  // الكشف يعني زيارة وتشخيصاً مدفوعاً عند رفض الإصلاح، ولذلك يخضع للتحصيل مثل المكتمل دون اعتباره إصلاحاً منفذاً.
  const isCollectionPending = (order: any) => ['completed', 'inspected'].includes(order.status) && !order.is_paid && !isManualCollectionClosed(order);
  const isOlderThan30Days = (order: any) => {
    const createdAt = new Date(order.created_at || order.createdAt || order.date).getTime();
    return Number.isFinite(createdAt) && Date.now() - createdAt > 30 * 24 * 60 * 60 * 1000;
  };

  const dateFilteredOrders = [...orders, ...archivedOrders].filter(o => {
    if (deferredSearchTerm) {
      const searchLower = deferredSearchTerm.toLowerCase();
      const matchesName = o.customer_name?.toLowerCase().includes(searchLower);
      const matchesPhone = o.phone?.includes(deferredSearchTerm);
      const matchesOrderNum = String(o.order_number).includes(deferredSearchTerm);
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

  const allFilteredOrders = dateFilteredOrders.filter(o => {
    // ✅ أرشفة تلقائية: إخفاء أي أوردر مر عليه أكثر من 30 يوماً من العرض العام (Live/All)
    // إلا إذا كان هناك بحث نشط أو فلترة يدوية بالتاريخ أو الفني
    const isManualFilterActive = deferredSearchTerm || filterTechnician || filterDateFrom || filterDateTo || filterDeviceType || filterDelay !== 'all' || filterWarranty !== 'all';
    
    if ((filterStatus === 'live' || filterStatus === 'all') && !isManualFilterActive) {
      const orderDate = new Date(o.created_at || o.createdAt);
      const today = new Date();
      const diffDays = Math.ceil(Math.abs(today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // إذا مر أكثر من 30 يوم، يعتبر مؤرشفاً تلقائياً
      if (diffDays > 30) return false;
    }

    // ✅ إخفاء الملغي تماماً من العرض العام (Live/All) إلا إذا تم اختياره صراحة
    if ((filterStatus === 'live' || filterStatus === 'all') && (o.status === 'cancelled' || o.status === 'canceled')) return false;

    // وضع التركيز المباشر (الافتراضي)
    if (filterStatus === 'live') {
      // كل أوردر مكتمل غير محصل يظهر في وضع التركيز ليصل للمدير أولاً.
      if (isCollectionPending(o)) return true;
      // دائماً أظهر الأوردرات المثبتة
      if (pinnedOrderIds.has(o.id)) return true;
      
      // أظهر فقط الأوردرات النشطة (انتظار، تنفيذ، مرتجع، بدون فني)
      const isLive = (o.status === 'in-progress' || o.status === 'in_progress' || o.status === 'pending' || o.status === 'returned' || !o.technician || o.technician === '-' || o.technician === '');

      // أي فلتر إضافي يستدعي فقط النتائج المطابقة بعد تطبيق البحث والفترة والفني والجهاز.
      if (deferredSearchTerm || filterTechnician || filterDateFrom || filterDateTo || filterDeviceType || filterDelay !== 'all' || filterWarranty !== 'all') return true;
      
      return isLive;
    }

    if (filterStatus === '__UNPAID__') {
      if (o.status !== 'completed' || o.is_paid) return false;
      return true;
    } else if (filterStatus !== 'all' && o.status !== filterStatus) {
      return false;
    }

    // عند «جميع الحالات» أو وضع التركيز نعرض التحصيل المعلق حتى لو كان المكتمل مخفياً افتراضياً.
    if (isCollectionPending(o) && (filterStatus === 'all' || filterStatus === 'live')) return true;
    if (o.status === 'completed' && filterStatus !== 'completed') return showCompletedOrders;
    if (filterStatus !== 'all' || filterTechnician || filterDeviceType || filterDateFrom || filterDateTo || filterDelay !== 'all' || filterWarranty !== 'all' || deferredSearchTerm) return true;
    return (o.status === 'in-progress' || o.status === 'pending' || o.status === 'returned' || !o.technician || o.technician === '-' || o.technician === '');
  });

  const getOrderActivityTime = (order: any) => {
    const candidates = [
      order.updated_at,
      order.updatedAt,
      order.last_action_at,
      order.completed_at,
      order.created_at,
      order.createdAt,
      order.date,
    ];

    for (const value of candidates) {
      if (!value) continue;
      const parsed = parseOrderDate(value)?.getTime() ?? new Date(value).getTime();
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return 0;
  };

  const filteredOrders = useMemo(() => {
    // أوردرات انتظار تأكيد التحصيل أولاً، ثم المثبتة، ثم الأحدث تحديثاً.
    const needsCollectionConfirmation = isCollectionPending;
    const sortByPriority = (a: any, b: any) => {
      const aNeedsCollection = needsCollectionConfirmation(a);
      const bNeedsCollection = needsCollectionConfirmation(b);
      if (aNeedsCollection !== bNeedsCollection) return aNeedsCollection ? -1 : 1;

      const aPinned = pinnedOrderIds.has(a.id);
      const bPinned = pinnedOrderIds.has(b.id);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;

      const activityDiff = getOrderActivityTime(b) - getOrderActivityTime(a);
      if (activityDiff !== 0) return activityDiff;
      return Number(b.id || 0) - Number(a.id || 0);
    };

    const sorted = [...allFilteredOrders].sort(sortByPriority);

    if (!deferredSearchTerm) {
      if (filterStatus === 'completed') {
        return sorted.slice(0, visibleCompletedCount);
      }
      return sorted.slice(0, visibleOrdersCount);
    }
    return sorted;
  }, [allFilteredOrders, filterStatus, deferredSearchTerm, visibleCompletedCount, visibleOrdersCount, pinnedOrderIds]);

  const pendingCollectionOrders = [...dateFilteredOrders]
    .filter(isCollectionPending)
    .sort((a, b) => getOrderActivityTime(b) - getOrderActivityTime(a));
  const showCollectionBanner = ['live', 'all', 'completed', '__UNPAID__'].includes(filterStatus);

  const togglePinOrder = (e: React.MouseEvent, orderId: number) => {
    e.stopPropagation();
    setPinnedOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const allFilteredArchivedOrders = archivedOrders.filter(o => {
    const query = archiveSearchTerm.trim().toLowerCase();
    if (query) {
      const customerName = String(o.customer_name || '').toLowerCase();
      const technicianName = String(o.technician || '').toLowerCase();
      const orderNumber = String(o.order_number || '').toLowerCase();
      const phoneDigits = normalizeArabicDigits(o.phone).replace(/\D/g, '');
      const queryDigits = normalizeArabicDigits(query).replace(/\D/g, '');
      const matchesName = customerName.includes(query);
      const matchesTechnician = technicianName.includes(query);
      const matchesPhone = queryDigits.length >= 3 && phoneDigits.includes(queryDigits);
      const matchesOrderNum = orderNumber.includes(query);
      if (!matchesName && !matchesTechnician && !matchesPhone && !matchesOrderNum) return false;
    }
    if (filterStatus !== 'all' && filterStatus !== 'live' && o.status !== filterStatus) return false;
    if (filterTechnician && o.technician !== filterTechnician) return false;
    if (archiveDateFilter) {
      const orderDate = String(o.created_at || '').slice(0, 10);
      if (orderDate !== archiveDateFilter) return false;
    }
    return true;
    });
  const archiveSummary = useMemo(() => ({
    completed: allFilteredArchivedOrders.filter(order => order.status === 'completed').length,
    cancelled: allFilteredArchivedOrders.filter(order => order.status === 'cancelled').length,
    withTechnician: allFilteredArchivedOrders.filter(order => order.technician && order.technician !== '-').length,
  }), [allFilteredArchivedOrders]);
  const filteredArchivedOrders = useMemo(() => {
    if (!archiveSearchTerm) {
      return allFilteredArchivedOrders.slice(0, visibleArchivedCount);
    }
    return allFilteredArchivedOrders;
  }, [allFilteredArchivedOrders, visibleArchivedCount, archiveSearchTerm]);


    const filteredTechnicians = technicians.filter(t => filterTechStatus === 'all' ? true : filterTechStatus === 'active' ? t.is_active !== false : t.is_active === false);
  const technicianOrderCards = useMemo(() => {
    const assigned = new Map<string, { total: number; pending: number; active: number; collection: number }>();
    let unassigned = 0;
    let unassignedCollection = 0;
    for (const order of filteredOrders) {
      const technician = String(order.technician || '').trim();
      if (!technician || technician === '-') {
        unassigned += 1;
        if (isCollectionPending(order)) unassignedCollection += 1;
        continue;
      }
      const stats = assigned.get(technician) || { total: 0, pending: 0, active: 0, collection: 0 };
      stats.total += 1;
      if (order.status === 'pending') stats.pending += 1;
      if (order.status === 'in-progress' || order.status === 'in_progress') stats.active += 1;
      if (isCollectionPending(order)) stats.collection += 1;
      assigned.set(technician, stats);
    }
    return {
      unassigned: { total: unassigned, collection: unassignedCollection },
      technicians: technicians
        .filter(tech => tech.is_active !== false)
        .map(tech => ({ tech, stats: assigned.get(String(tech.name).trim()) || { total: 0, pending: 0, active: 0, collection: 0 } }))
        .sort((a, b) => b.stats.total - a.stats.total || String(a.tech.name).localeCompare(String(b.tech.name), 'ar'))
    };
  }, [filteredOrders, technicians]);
  const visibleCashLedger = useMemo(() => {
    if (!cashFilterDate) return cashLedger;
    return cashLedger.filter((entry: any) => entry.date === cashFilterDate);
  }, [cashLedger, cashFilterDate]);
  const getCashEntryTechnician = (entry: any) => {
    const source = `${entry.order_id || ''} ${entry.description || ''}`;
    const orderNumber = source.match(/MG-?\d{6,}/i)?.[0]?.toLowerCase().replace(/^mg-?/, 'mg-');
    const order = [...orders, ...archivedOrders, ...deletedOrders].find((item: any) =>
      (entry.order_id && String(item.id) === String(entry.order_id)) ||
      (orderNumber && String(item.order_number || '').toLowerCase() === orderNumber)
    );
    return order?.technician && order.technician !== '-' ? String(order.technician) : '';
  };
  const smartNotifications = useMemo(() => {
    const query = notificationSearch.trim().toLowerCase();
    const classify = (notification: any) => {
      const text = `${notification.action || ''} ${notification.details || ''}`.toLowerCase();
      if (text.includes('تحصيل') || text.includes('متأخر') || text.includes('عاجل') || text.includes('بدون فني')) return 'urgent';
      if (text.includes('أوردر') || text.includes('طلب') || text.includes('فني')) return 'orders';
      if (text.includes('خزنة') || text.includes('أرباح') || text.includes('تصفية') || text.includes('مصروف')) return 'money';
      return 'system';
    };
    return notifications
      .filter(notification => notificationCategory === 'all' || classify(notification) === notificationCategory)
      .filter(notification => !query || `${notification.action || ''} ${notification.details || ''}`.toLowerCase().includes(query))
      .sort((a, b) => {
        const unreadDiff = Number(readNotificationIds.has(Number(a.id))) - Number(readNotificationIds.has(Number(b.id)));
        if (unreadDiff !== 0) return unreadDiff;
        const priority = { urgent: 0, orders: 1, money: 2, system: 3 } as Record<string, number>;
        const priorityDiff = priority[classify(a)] - priority[classify(b)];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
  }, [notifications, notificationCategory, notificationSearch, readNotificationIds]);
  const invoiceReviewOrders = useMemo(() => {
    const query = invoiceSearchTerm.trim().toLowerCase();
    return [...orders, ...archivedOrders]
      .filter(order => order.status === 'completed' && !order.invoice_approved)
      .filter(order => {
        if (invoiceDateFilter && String(order.created_at || '').slice(0, 10) !== invoiceDateFilter) return false;
        if (!query) return true;
        return `${order.customer_name || ''} ${order.phone || ''} ${order.order_number || ''} ${order.technician || ''}`.toLowerCase().includes(query);
      })
      .sort((a, b) => (getOrderActivityTime(b) || 0) - (getOrderActivityTime(a) || 0));
  }, [orders, archivedOrders, invoiceSearchTerm, invoiceDateFilter]);
  const commandCenterStats = useMemo(() => ({
    unassigned: filteredOrders.filter(order => !order.technician || order.technician === '-' || order.technician === '').length,
    collection: filteredOrders.filter(isCollectionPending).length,
    delayed: filteredOrders.filter(isDelayed).length,
    active: filteredOrders.filter(order => order.status === 'in-progress' || order.status === 'in_progress').length,
  }), [filteredOrders]);
  const openCommandCenter = (type: 'unassigned' | 'collection' | 'delayed' | 'active') => {
    setSearchTerm('');
    setFilterTechnician('');
    setFilterDeviceType('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterWarranty('all');
    if (type === 'unassigned') {
      setFilterDelay('all');
      setFilterStatus('live');
      setFilterTechnician('__NONE__');
    } else if (type === 'collection') {
      setFilterDelay('all');
      setFilterStatus('__UNPAID__');
    } else if (type === 'delayed') {
      setFilterDelay('delayed');
      setFilterStatus('live');
    } else {
      setFilterDelay('all');
      setFilterStatus('in-progress');
    }
  };
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
      let query: any = supabase
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
      const reportRows: any[] = (data || []) as any[];
      const filteredData = reportRows.filter((order: any) => {
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

      const start = parseOrderDate(startDate);
      const end = parseOrderDate(`${endDate}T23:59:59`);
      if (!start || !end) throw new Error('نطاق التاريخ غير صالح');

      const dateFiltered = filteredData.filter((order: any) => {
        const orderDate = parseOrderDate(order.created_at);
        return Boolean(orderDate && orderDate >= start && orderDate <= end);
      });

      const finalData = dateFiltered.filter((order: any) => {
        const orderDate = parseOrderDate(order.created_at);
        const diffDays = orderDate ? Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        return diffDays > 3;
      });

      setReportColumns(isViewer
        ? ['رقم الأوردر', 'العميل', 'الجهاز', 'الماركة', 'الفني', 'الحالة', 'التاريخ']
        : ['رقم الأوردر', 'العميل', 'الهاتف', 'الجهاز', 'الماركة', 'الفني', 'الحالة', 'التاريخ']);
      setReportData(finalData.map(order => ({ ...order, date: formatOrderDateTime(order.created_at) })));
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
      let query: any = supabase
        .from('orders')
        .select(reportOrderFields)
        .eq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (filterTechnicianReport) query = query.eq('technician', filterTechnicianReport);

      const { data, error } = await query;
      if (error) throw error;

      const start = parseOrderDate(startDate);
      const end = parseOrderDate(`${endDate}T23:59:59`);
      if (!start || !end) throw new Error('نطاق التاريخ غير صالح');

      const reportRows: any[] = (data || []) as any[];
      const filtered = reportRows.filter((order: any) => {
        const orderDate = parseOrderDate(order.created_at);
        return Boolean(orderDate && orderDate >= start && orderDate <= end);
      });

      setReportColumns(isViewer
        ? ['رقم الأوردر', 'العميل', 'الجهاز', 'الماركة', 'الفني', 'سبب الإلغاء', 'التاريخ']
        : ['رقم الأوردر', 'العميل', 'الهاتف', 'الجهاز', 'الماركة', 'الفني', 'سبب الإلغاء', 'التاريخ']);
      setReportData(filtered.map(order => ({ ...order, date: formatOrderDateTime(order.created_at) })));
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

  const fetchCompanyProfitReport = async () => {
    setReportLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('order_number, technician, total_amount, parts_cost, transport_cost, technician_share, status, created_at')
        .eq('status', 'completed')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false });
      if (filterTechnicianReport) query = query.eq('technician', filterTechnicianReport);
      const { data, error } = await query;
      if (error) throw error;

      const rows = data || [];
      const totals = rows.reduce((summary: any, order: any) => {
        summary.totalInvoice += Number(order.total_amount) || 0;
        summary.partsCost += Number(order.parts_cost) || 0;
        summary.transportCost += Number(order.transport_cost) || 0;
        summary.technicianShare += Number(order.technician_share) || 0;
        return summary;
      }, { totalInvoice: 0, partsCost: 0, transportCost: 0, technicianShare: 0 });
      const companyProfit = totals.totalInvoice - totals.partsCost - totals.transportCost - totals.technicianShare;

      setReportColumns(['عدد الأوردرات', 'إجمالي الفواتير (ج.م)', 'قطع الغيار (ج.م)', 'المواصلات (ج.م)', 'نصيب الفني (ج.م)', 'صافي ربح الشركة (ج.م)']);
      setReportData([{
        total_orders: rows.length,
        total_invoice: totals.totalInvoice,
        parts_cost: totals.partsCost,
        transport_cost: totals.transportCost,
        technician_share: totals.technicianShare,
        company_profit: companyProfit
      }]);
    } catch (err) {
      console.error(err);
      showToast("فشل تنفيذ تقرير ربح الشركة", "error");
    } finally {
      setReportLoading(false);
    }
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
      case 'company_profit': fetchCompanyProfitReport(); break;
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
                          else if (col === 'عدد الأوردرات') val = row.total_orders || '';
                          else if (col === 'إجمالي الفواتير (ج.م)') val = row.total_invoice || '';
                          else if (col === 'قطع الغيار (ج.م)') val = row.parts_cost || '';
                          else if (col === 'المواصلات (ج.م)') val = row.transport_cost || '';
                          else if (col === 'نصيب الفني (ج.م)') val = row.technician_share || '';
                          else if (col === 'صافي ربح الشركة (ج.م)') val = row.company_profit || '';
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

  const technicianExpenseStats = technicians.map((tech) => {
    const techOrders = [...orders, ...archivedOrders].filter((order) => order.technician === tech.name);
    const invoicedOrders = techOrders.filter((order) => Number(order.total_amount) > 0);
    const totalInvoice = invoicedOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
    const totalParts = invoicedOrders.reduce((sum, order) => sum + (Number(order.parts_cost) || 0), 0);
    const totalTransport = invoicedOrders.reduce((sum, order) => sum + (Number(order.transport_cost) || 0), 0);
    const partsPercent = totalInvoice > 0 ? (totalParts / totalInvoice) * 100 : 0;
    const transportPercent = totalInvoice > 0 ? (totalTransport / totalInvoice) * 100 : 0;
    const total = techOrders.length;
    const completed = techOrders.filter((order) => order.status === 'completed').length;
    const archived = techOrders.filter((order) => isOldAndShouldArchive(order)).length;
    const partsAlert = partsPercent > 40;
    const transportAlert = transportPercent > 15;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const successAlert = total > 0 && successRate < 70;
    return {
      ...tech,
      total,
      completed,
      archived,
      percentage: successRate,
      successRate,
      successAlert,
      totalInvoice,
      totalParts,
      totalTransport,
      partsPercent,
      transportPercent,
      partsAlert,
      transportAlert,
    };
  }).sort((a, b) => b.percentage - a.percentage || b.completed - a.completed);

  const sendExpenseWarning = async (tech: any) => {
    if (!isAdmin) return showToast("إرسال إنذار المصروفات متاح لمدير النظام فقط", "error");
    const warnings = [
      tech.partsAlert ? `قطع الغيار ${tech.partsPercent.toFixed(1)}%` : '',
      tech.transportAlert ? `المواصلات ${tech.transportPercent.toFixed(1)}%` : '',
      tech.successAlert ? `نسبة النجاح ${tech.successRate}% (المطلوب 70% أو أكثر)` : '',
    ].filter(Boolean).join('، ');
    if (!warnings) return showToast("مصروفات الفني ضمن الحدود المحددة", "info");

    const message = `تنبيه متابعة أداء الفني\nالفني: ${tech.name}\nإجمالي الأوردرات: ${tech.total}\nنسبة النجاح الحالية: ${tech.successRate}%\nإجمالي الفواتير: ${tech.totalInvoice.toLocaleString()} ج.م\n${warnings}\nيرجى مراجعة المؤشرات وتصحيح البيانات أو استكمال الأوردرات المفتوحة.`;
    const pushResult = await sendExternalPush({
      event: 'system_alert',
      title: '⚠️ تنبيه مراجعة المصروفات',
      message,
      targetTags: [{ key: 'tech_name', value: tech.name }],
      data: { technician: tech.name, total_invoice: tech.totalInvoice, parts_percent: tech.partsPercent, transport_percent: tech.transportPercent },
    });
    await addNotification(tech.partsAlert || tech.transportAlert ? 'إنذار مصروفات فني' : 'إنذار أداء فني', message);
    showToast(pushResult.ok ? `✅ تم إرسال إنذار إلى ${tech.name}` : `⚠️ تم تسجيل الإنذار ولم يصل Push إلى ${tech.name}`, pushResult.ok ? 'success' : 'error');
  };

    const handleManualPushSend = async () => {
    if (userRole !== 'admin') {
      showToast('إرسال الإشعارات اليدوية متاح لمدير النظام فقط', 'error');
      return;
    }
    const title = manualPushTitle.trim();
    const message = manualPushMessage.trim();
    if (!title || !message) {
      showToast('اكتب عنوان الرسالة ونصها أولاً', 'error');
      return;
    }
    setManualPushSending(true);
    try {
      const result = await sendExternalPush({
        event: 'system_alert',
        title,
        message,
        ...(manualPushTarget === 'all' ? { targetRoles: ['tech'] } : { targetUserIds: [`tech:${manualPushTarget}`] }),
        data: { manual: true, sent_by: 'admin' },
        url: '/tech-portal',
      });
      if (!result.ok) {
        showToast(`تعذر إرسال الإشعار: ${result.error || 'خطأ غير معروف'}`, 'error');
        return;
      }
      showToast(manualPushTarget === 'all' ? 'تم إرسال الإشعار للفنيين المشتركين' : 'تم إرسال الإشعار للفني المحدد', 'success');
      setManualPushMessage('');
      setShowManualPushModal(false);
    } catch (error) {
      console.error('Manual push failed:', error);
      showToast('تعذر إرسال الإشعار', 'error');
    } finally {
      setManualPushSending(false);
    }
  };

    if (!initialLoadComplete) {
      return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300" dir="rtl"><div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5 text-sm font-black shadow-2xl">جاري تحميل بيانات لوحة المدير…</div></div>;
    }
    return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 transition-all duration-500 ${isUrgentAlert ? 'ring-inset ring-[12px] ring-red-600/50' : ''}`}>
      {loading && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[210] rounded-full border border-blue-400/40 bg-slate-900/95 px-4 py-2 text-xs font-black text-blue-200 shadow-xl" role="status">
          جاري تحديث البيانات…
        </div>
      )}
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
            <p className="text-[10px] text-slate-600 mt-6 uppercase tracking-widest font-bold">Maintenance Guide Admin v4.3.8</p>
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
      <IOSPushEnablePrompt />
      {toast && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-white font-bold shadow-lg ${
          toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {toast.message}
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

	          <div className="flex items-center gap-2">
	            <button
	              type="button"
	              onClick={toggleWakeLock}
              disabled={!wakeLockSupported}
              title={wakeLockSupported ? (wakeLockEnabled ? 'إيقاف إبقاء الشاشة مستيقظة' : 'تشغيل إبقاء الشاشة مستيقظة') : 'المتصفح لا يدعم إبقاء الشاشة مستيقظة'}
              className={`px-2.5 py-2 rounded-xl border text-[9px] font-black flex items-center gap-1.5 transition-all ${wakeLockSupported && wakeLockEnabled ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-500'} disabled:opacity-50`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${wakeLockActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
              {wakeLockActive ? 'الشاشة يقظة' : wakeLockEnabled ? 'إبقاء الشاشة' : 'الشاشة مغلقة'}
            </button>
            <button onClick={handleLogout} title="تسجيل الخروج" aria-label="تسجيل الخروج" className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"><LogOut className="w-5 h-5" /></button>
          </div>
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

      {/* Modern Slim Navigation Bar */}
      <div className="sticky top-[60px] z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-2 py-2 overflow-x-auto no-scrollbar flex gap-1.5 shadow-xl">
        {[
          { id: 'orders', label: 'الأوردرات', icon: <ClipboardList size={16} />, color: 'orange' },
	          { id: 'archived', label: `الأرشيف (${archivedOrders.length})`, icon: <LayoutDashboard size={16} />, color: 'indigo' },
          { id: 'technicians', label: 'الفنيين', icon: <Users size={16} />, color: 'orange', hide: userRole === 'viewer' },
          { id: 'reports', label: 'التقارير', icon: <FileCheck size={16} />, color: 'orange', hide: userRole === 'viewer' },
          { id: 'repeatCustomers', label: `المتكررون (${repeatCustomers.length})`, icon: <Star size={16} />, color: 'emerald', hide: userRole === 'viewer' },
          { id: 'invoicesReview', label: 'الفواتير', icon: <Printer size={16} />, color: 'orange', hide: userRole === 'viewer' },
          { id: 'cash', label: 'الخزنة', icon: <Wallet size={16} />, color: 'emerald' },
          { id: 'partners', label: 'الشركاء', icon: <Users size={16} />, color: 'orange', hide: userRole === 'viewer' },
          { id: 'notifications', label: `الإشعارات (${notifications.length})`, icon: <Bell size={16} />, color: 'blue' },
          { id: 'feedback', label: 'التقييمات', icon: <Star size={16} />, color: 'yellow', hide: !canEditDelete() },
          { id: 'permissions', label: 'الصلاحيات', icon: <ShieldCheck size={16} />, color: 'orange', hide: userRole !== 'admin' },
          { id: 'analytics', label: 'الإحصائيات', icon: <LayoutDashboard size={16} />, color: 'orange' },
          { id: 'performance', label: 'أداء الفنيين', icon: <SlidersHorizontal size={16} />, color: 'orange', hide: userRole === 'viewer' }
        ].filter(tab => !tab.hide).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all duration-300 active:scale-90 ${
              activeTab === tab.id 
                ? `bg-${tab.color}-600 text-white shadow-lg shadow-${tab.color}-900/20` 
                : 'bg-slate-800/50 text-slate-500 hover:text-slate-300 hover:bg-slate-800 border border-slate-700/50'
            }`}
          >
            {tab.icon}
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>

	      <div className="p-4">
		        {/* تبويب الأوردرات */}
		        {activeTab === 'orders' && (
		          			          <div className="space-y-6">
	              {/* Operations Center Header */}
	              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-6 sm:p-8 border border-slate-700 shadow-2xl relative overflow-hidden">
	                <div className="absolute top-0 left-0 w-3 h-full bg-orange-600"></div>
	                <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl"></div>
	                
	                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
	                  <div>
	                    <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
	                      <LayoutDashboard className="text-orange-500 w-8 h-8 sm:w-10 sm:h-10" /> مركز العمليات
	                    </h2>
	                    <div className="flex items-center gap-3 mt-2">
	                      <div className="text-3xl sm:text-4xl font-black text-emerald-400 tabular-nums">{cashBalance.toLocaleString()} <span className="text-sm text-emerald-600/70">ج.م</span></div>
	                      <div className="h-6 w-[1px] bg-slate-700 mx-1"></div>
	                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">الرصيد المتاح</p>
	                    </div>
	                  </div>
	                  
	                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
	                    <button onClick={() => { void sendDailyReportToApp(); }} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20 active:scale-95">
	                      <Send size={18} /> تقرير اليوم
	                    </button>
	                    {isAdmin && (
	                      <button type="button" onClick={() => setShowManualPushModal(true)} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-95">
	                        <Bell size={18} /> رسالة للفنيين
	                      </button>
	                    )}
	                    <button onClick={() => setActiveTab('cash')} className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-3 rounded-2xl text-xs font-black transition-all border border-slate-700 flex items-center justify-center gap-2 active:scale-95">
	                      <Wallet size={18} /> الخزنة
	                    </button>
	                    <button onClick={() => { void fetchData(); }} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-2xl border border-slate-700 transition-all active:scale-95" aria-label="تحديث">
	                      <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
	                    </button>
	                  </div>
	                </div>

	                {/* Smart Stats Grid */}
		                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-8">
		                  <button type="button" className="bg-slate-950/60 p-4 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all group text-right active:scale-95" onClick={() => { clearFilters(); const today = getEgyptTodayString(); setFilterDateFrom(today); setFilterDateTo(today); }}>
		                    <div className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest flex items-center gap-1.5"><Clock size={12}/> أوردرات اليوم</div>
		                    <div className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">{orders.filter(isOrderToday).length}</div>
		                  </button>
		                  <button type="button" className="bg-slate-950/60 p-4 rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all group text-right active:scale-95" onClick={() => { clearFilters(); setFilterTechnician('__NONE__'); }}>
		                    <div className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest flex items-center gap-1.5"><UserPlus size={12}/> بدون فني</div>
		                    <div className={`text-2xl font-black ${orders.filter(o => !o.technician || o.technician === '-' || o.technician === '').length > 0 ? 'text-orange-500 animate-pulse' : 'text-white'}`}>
		                      {orders.filter(o => !o.technician || o.technician === '-' || o.technician === '').length}
		                    </div>
		                  </button>
		                  <button type="button" className="bg-slate-950/60 p-4 rounded-3xl border border-white/5 hover:border-red-500/30 transition-all group text-right active:scale-95" onClick={() => { clearFilters(); setFilterDelay('delayed'); }}>
		                    <div className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest flex items-center gap-1.5"><AlertCircle size={12}/> متأخرة 🚨</div>
		                    <div className={`text-2xl font-black ${orders.filter(o => isDelayed(o)).length > 0 ? 'text-red-500' : 'text-white'}`}>
		                      {orders.filter(o => isDelayed(o)).length}
		                    </div>
		                  </button>
		                  <button type="button" className="bg-slate-950/60 p-4 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all group text-right active:scale-95" onClick={() => { clearFilters(); setFilterStatus('__UNPAID__'); }}>
		                    <div className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest flex items-center gap-1.5"><DollarSign size={12}/> تحصيل معلق</div>
<div className={`text-2xl font-black ${pendingCollectionOrders.length > 0 ? 'text-amber-500' : 'text-white'}`}>
	                      {pendingCollectionOrders.length}
		                    </div>
		                  </button>
		                  <button type="button" className="bg-slate-950/60 p-4 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all group text-right active:scale-95 sm:col-span-2 lg:col-span-1" onClick={() => { clearFilters(); setShowCompletedOrders(true); setFilterWarranty('active'); setFilterStatus('completed'); }}>
		                    <div className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck size={12}/> ضمان ساري</div>
		                    <div className="text-2xl font-black text-emerald-400">{[...orders, ...archivedOrders].filter(o => getWarrantyStatus(o).status === 'active').length}</div>
		                  </button>
		                </div>
	              </div>

	              {showCollectionBanner && pendingCollectionOrders.length > 0 && (
	                <div className="relative overflow-hidden rounded-[2rem] border-2 border-amber-300/70 bg-gradient-to-l from-amber-500/25 via-orange-500/10 to-slate-900 p-4 shadow-[0_0_28px_rgba(245,158,11,0.22)] animate-in fade-in slide-in-from-top-2 duration-300">
	                  <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-amber-300/20 blur-2xl" />
	                  <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
	                    <div className="flex items-center gap-3">
	                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-300/25 text-amber-100 border border-amber-200/50 animate-pulse"><Wallet size={22} /></div>
	                      <div>
	                        <p className="text-sm font-black text-amber-100">تحصيل يحتاج تأكيدك الآن</p>
	                        <p className="mt-1 text-[10px] font-bold text-amber-200/70">{pendingCollectionOrders.length} أوردر ينتظر اعتماد استلام نصيب الشركة، ويشمل كشف/زيارة عند وجوده</p>
	                      </div>
	                    </div>
	                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                          <button type="button" onClick={() => { setShowCompletedOrders(true); setFilterStatus('__UNPAID__'); }} className="w-full rounded-xl bg-amber-300 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-200 active:scale-95">فتح قائمة التحصيل</button>
                          {isAdmin && <button type="button" disabled={isSubmitting} onClick={hideOldManualCollections} className="w-full rounded-xl border border-amber-200/40 bg-slate-950/40 px-3 py-2.5 text-[10px] font-black text-amber-100 transition-all hover:bg-slate-950/70 disabled:opacity-50">إنهاء التحصيل الظاهر يدوياً</button>}
                        </div>
	                  </div>
	                </div>
	              )}

	              {/* Unified Filter Bar */}
	              <div className="bg-slate-900 rounded-[2rem] p-4 border border-slate-800 shadow-xl space-y-4">
	                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
	                  <div className="relative flex-1">
	                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
	                    <input 
	                      type="text" 
	                      placeholder={isViewer ? "بحث بالاسم أو رقم الأوردر..." : "بحث بالاسم أو الهاتف أو رقم الأوردر..."} 
	                      className="w-full pr-12 pl-4 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl text-white font-bold focus:border-orange-500 outline-none transition-all" 
	                      value={searchTerm} 
	                      onChange={e => setSearchTerm(e.target.value)} 
	                    />
	                  </div>
	                  
	                  <div className="flex gap-2">
	                    <button 
	                      type="button" 
	                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} 
	                      className={`flex-1 lg:flex-none flex items-center justify-center gap-2 rounded-2xl border px-6 py-3 text-sm font-black transition-all ${showAdvancedFilters ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-900/20' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-orange-500'}`}
	                    >
	                      <SlidersHorizontal size={18} /> تصفية {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
	                    </button>
	                    
	                    {canEditDelete() && (
	                      <button 
	                        onClick={() => { setEditingOrder(null); setFormData({ customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '', status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false, invoice_approved: false, warranty_period: '6 أشهر', invoice_date: '', parts_used: '', date: new Date().toLocaleDateString("ar-EG") }); setShowOrderModal(true); }}
	                        className="flex-1 lg:flex-none bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-orange-900/20 transition-all flex items-center justify-center gap-2 active:scale-95"
	                      >
	                        <Plus size={20} /> أوردر جديد
	                      </button>
	                    )}
	                  </div>
	                </div>

	                {/* Advanced Filters Panel */}
	                {showAdvancedFilters && (
	                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-950/30 rounded-3xl border border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
	                    <div className="space-y-1.5">
	                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">الحالة</label>
	                      <select value={filterStatus} onChange={e => { const nextStatus = e.target.value; setFilterStatus(nextStatus); if (nextStatus === 'completed') setShowCompletedOrders(true); }} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-bold outline-none focus:border-orange-500 transition-all">
	                        <option value="live">⚡ العمل الحالي (النشط)</option>
	                        <option value="all">جميع الحالات</option>
	                        <option value="pending">⏳ قيد الانتظار</option>
	                        <option value="in-progress">🔧 قيد التنفيذ</option>
	                        <option value="inspected">🔍 تم الكشف</option>
	                        <option value="completed">✅ مكتمل</option>
	                        <option value="__UNPAID__">💰 يحتاج تأكيد التحصيل</option>
	                        <option value="cancelled">❌ ملغي</option>
	                        <option value="deferred">⏰ مؤجل</option>
                            <option value="returned">⚠️ المرتجعات</option>
	                      </select>
	                    </div>
	                    <div className="space-y-1.5">
	                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">الفني</label>
	                      <select value={filterTechnician} onChange={e => setFilterTechnician(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-bold outline-none focus:border-orange-500 transition-all">
	                        <option value="">جميع الفنيين</option>
	                        {technicians.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
	                      </select>
	                    </div>
	                    <div className="space-y-1.5">
	                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">نوع الجهاز</label>
	                      <select value={filterDeviceType} onChange={e => setFilterDeviceType(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-bold outline-none focus:border-orange-500 transition-all">
	                        <option value="">جميع الأجهزة</option>
	                        {DEVICE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
	                      </select>
	                    </div>
	                    <div className="space-y-1.5">
	                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">الفترة الزمنية</label>
	                      <div className="flex gap-2">
	                        <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="flex-1 p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-[10px] font-bold outline-none focus:border-orange-500 transition-all" />
	                        <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="flex-1 p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-[10px] font-bold outline-none focus:border-orange-500 transition-all" />
	                      </div>
	                    </div>
	                  </div>
	                )}

	                {/* Active Filter Tags */}
	                <div className="flex flex-wrap gap-2 items-center">
	                  <div className="flex items-center gap-2">
	                    {!isViewer && (
	                      <button 
	                        onClick={() => setShowCompletedOrders(!showCompletedOrders)} 
	                        className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all flex items-center gap-2 border ${showCompletedOrders ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-300'}`}
	                      >
	                        {showCompletedOrders ? <EyeOff size={12} /> : <Eye size={12} />} {showCompletedOrders ? 'إخفاء المكتمل' : 'استدعاء المكتمل'}
	                      </button>
	                    )}
	                    <button 
	                      onClick={() => setShowDeleted(!showDeleted)} 
	                      className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all flex items-center gap-2 border ${showDeleted ? 'bg-red-600/20 border-red-500/50 text-red-400' : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-300'}`}
	                    >
	                      <Trash2 size={12} /> {showDeleted ? 'إخفاء المحذوفة' : `المحذوفة (${deletedOrders.length})`}
	                    </button>
	                  </div>
	                  
	                  <div className="h-4 w-[1px] bg-slate-800 mx-1"></div>
	                  
	                  {/* Smart Pills */}
	                  {(searchTerm || filterStatus !== 'all' || filterTechnician || filterDeviceType || filterDateFrom || filterDateTo || filterDelay === 'delayed') ? (
	                    <>
	                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">النتائج لـ:</span>
	                      {searchTerm && <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full text-[9px] font-black flex items-center gap-1.5">🔍 {searchTerm} <X size={10} className="cursor-pointer" onClick={() => setSearchTerm('')}/></span>}
	                      {filterStatus !== 'live' && <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[9px] font-black flex items-center gap-1.5">🏷️ {filterStatus === 'all' ? 'الكل' : filterStatus === '__UNPAID__' ? 'يحتاج تأكيد التحصيل' : filterStatus} <X size={10} className="cursor-pointer" onClick={() => setFilterStatus('live')}/></span>}
	                      {filterTechnician && <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-[9px] font-black flex items-center gap-1.5">👨‍🔧 {filterTechnician === '__NONE__' ? 'بدون فني' : filterTechnician} <X size={10} className="cursor-pointer" onClick={() => setFilterTechnician('')}/></span>}
	                      {filterDelay === 'delayed' && <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-[9px] font-black flex items-center gap-1.5">🚨 متأخر <X size={10} className="cursor-pointer" onClick={() => setFilterDelay('all')}/></span>}
	                      
                        {filterStatus === '__UNPAID__' && isAdmin && filteredOrders.length > 0 && (
                          <button 
                            onClick={handleBatchConfirmPaid}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black flex items-center gap-1.5 shadow-lg animate-pulse"
                          >
                            <CheckCircle2 size={12} /> اعتماد تحصيل الكل ({filteredOrders.length})
                          </button>
                        )}

                        <button onClick={clearFilters} className="text-[10px] font-black text-slate-500 hover:text-white transition-colors underline decoration-slate-700 underline-offset-4">مسح الكل</button>
	                    </>
	                  ) : (
	                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">لا توجد فلاتر نشطة</span>
	                  )}
	                </div>
	              </div>

	            {!showDeleted && filteredOrders.length === 0 && !showCompletedOrders && (
	              <div className="bg-slate-900/50 rounded-[2rem] border border-slate-800 border-dashed py-16 text-center animate-in fade-in zoom-in duration-500">
	                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
	                  <Search size={40} />
	                </div>
	                <h3 className="text-lg font-black text-white">لا توجد أوردرات مفتوحة حالياً</h3>
	                <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">جرب استخدام أيقونة العين لاستدعاء الأوردرات المكتملة أو قم بإضافة أوردر جديد.</p>
	              </div>
	            )}

		            {!showDeleted && filteredOrders.length > 0 && (
		              <div className="space-y-6 mb-10">
	                  {/* Quick Analysis Grid */}
		                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
			                  <button type="button" onClick={() => setFilterStatus('in-progress')} className="bg-blue-600/10 border border-blue-600/20 rounded-[2rem] p-5 text-center hover:bg-blue-600/20 transition-all group shadow-lg shadow-blue-900/5 active:scale-95">
			                    <div className="text-4xl font-black text-blue-400 group-hover:scale-110 transition-transform tabular-nums">{filteredOrders.filter(o => o.status === 'in-progress').length}</div>
			                    <div className="text-[10px] font-black text-blue-300/60 mt-2 uppercase tracking-widest flex items-center justify-center gap-1.5"><Wrench size={12}/> قيد التنفيذ</div>
			                  </button>
			                  <button type="button" onClick={() => setFilterDelay('delayed')} className="bg-red-600/10 border border-red-600/20 rounded-[2rem] p-5 text-center hover:bg-red-600/20 transition-all group shadow-lg shadow-red-900/5 active:scale-95">
			                    <div className="text-4xl font-black text-red-400 group-hover:scale-110 transition-transform tabular-nums">{filteredOrders.filter(o => isDelayed(o)).length}</div>
			                    <div className="text-[10px] font-black text-red-300/60 mt-2 uppercase tracking-widest flex items-center justify-center gap-1.5"><AlertCircle size={12}/> متأخرة</div>
			                  </button>
			                  <button type="button" onClick={() => { setShowCompletedOrders(true); setFilterStatus('completed'); }} className="bg-emerald-600/10 border border-emerald-600/20 rounded-[2rem] p-5 text-center hover:bg-emerald-600/20 transition-all group shadow-lg shadow-emerald-900/5 active:scale-95">
				                    <div className="text-4xl font-black text-emerald-400 group-hover:scale-110 transition-transform tabular-nums">{allFilteredOrders.filter(o => o.status === 'completed').length}</div>
				                    <div className="text-[10px] font-black text-emerald-300/60 mt-2 uppercase tracking-widest flex items-center justify-center gap-1.5"><CheckCircle2 size={12}/> مكتملة</div>
				                  </button>
					                  <button type="button" onClick={() => setFilterStatus('all')} className="bg-slate-800/50 border border-slate-700/50 rounded-[2rem] p-5 text-center hover:bg-slate-800 transition-all group shadow-lg active:scale-95">
					                    <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform tabular-nums">{allFilteredOrders.length}</div>
					                    <div className="text-[10px] font-black text-slate-500 mt-2 uppercase tracking-widest flex items-center justify-center gap-1.5"><ClipboardList size={12}/> {filterStatus === 'live' ? 'العمل الحالي' : 'الإجمالي'}</div>
					                  </button>
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
	                        const count = allFilteredOrders.filter(o => o.status === status).length;
	                        const percentage = allFilteredOrders.length > 0 ? (count / allFilteredOrders.length) * 100 : 0;
                        const color = status === 'completed' ? 'bg-green-500' : status === 'in-progress' ? 'bg-blue-500' : status === 'pending' ? 'bg-yellow-500' : 'bg-red-500';
                        const label = status === 'completed' ? 'مكتمل' : status === 'in-progress' ? 'قيد التنفيذ' : status === 'pending' ? 'قيد الانتظار' : 'ملغي';

	                        return (
	                          <button 
                              key={status} 
                              type="button"
                              onClick={() => {
                                if (status === 'completed') setShowCompletedOrders(true);
                                setFilterStatus(status);
                              }}
                              className="w-full text-right space-y-1 group active:scale-[0.98] transition-all"
                            >
	                            <div className="flex justify-between text-[10px] font-bold group-hover:text-white transition-colors">
	                              <span className="text-slate-400 group-hover:text-slate-200">{label}</span>
	                              <span className="text-slate-200">{count} أوردر ({Math.round(percentage)}%)</span>
	                            </div>
	                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-white/5">
	                              <div
	                                className={`${color} h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
	                                style={{ width: `${percentage}%` }}
	                              ></div>
	                            </div>
	                          </button>
	                        );
                      })}
                    </div>
                  </div>
	              </div>
	            )}

            {/* نظام التبويبات الذكي (Kanban Mobile) */}
	                <div className="flex flex-nowrap gap-3 overflow-x-auto no-scrollbar pb-3 mb-4 sticky top-[60px] z-30 bg-slate-950/80 backdrop-blur-md py-2 -mx-4 px-4">
	                  {[
	                    { id: 'live', label: 'العمل الحالي ⚡', color: 'emerald' },
	                    { id: 'all', label: 'الكل', color: 'slate' },
	                    { id: 'pending', label: 'قيد الانتظار', color: 'amber' },
                    { id: 'in-progress', label: 'قيد التنفيذ', color: 'blue' },
                    { id: 'inspected', label: 'كشف / زيارة', color: 'cyan' },
                    { id: 'completed', label: 'مكتمل', color: 'emerald' },
                    { id: 'returned', label: 'المرتجع ⚠️', color: 'rose' },
                    { id: 'cancelled', label: 'ملغي', color: 'rose' },
                    { id: 'deferred', label: 'مؤجل', color: 'purple' }
	                  ].map(tab => {
	                    let count = 0;
	                    if (tab.id === 'all') {
	                      count = dateFilteredOrders.length;
	                    } else if (tab.id === 'live') {
	                      // حساب الأوردرات النشطة فقط (نفس منطق الفلترة الفعلي)
	                      count = dateFilteredOrders.filter(o => 
	                        isCollectionPending(o) || 
	                        pinnedOrderIds.has(o.id) || 
	                        ['in-progress', 'in_progress', 'pending', 'returned'].includes(o.status) || 
	                        !o.technician || o.technician === '-' || o.technician === ''
	                      ).length;
	                    } else {
	                      count = dateFilteredOrders.filter(o => o.status === tab.id).length;
	                    }
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
                {!showDeleted && !searchTerm && !filterTechnician && (
                  <>
                  <section className="mb-5 rounded-3xl border border-white/10 bg-slate-950/40 p-4" aria-label="مركز قيادة الأوردرات">
                    <div className="mb-3 flex items-center justify-between">
                      <div><h3 className="text-sm font-black text-white">مركز قيادة الأوردرات</h3><p className="mt-1 text-[10px] font-bold text-slate-500">الأولوية أولًا، ثم توزيع الحمل على الفنيين</p></div>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black text-slate-500">تحديث مباشر</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                      <button type="button" onClick={() => openCommandCenter('unassigned')} className="rounded-2xl border border-amber-400/50 bg-amber-500/10 p-3 text-right transition hover:-translate-y-0.5 hover:bg-amber-500/20"><div className="flex items-center justify-between text-[10px] font-black text-amber-200"><span>بدون فني</span><AlertCircle size={15} /></div><div className="mt-2 text-2xl font-black text-amber-300">{commandCenterStats.unassigned}</div><div className="text-[9px] font-bold text-amber-200/60">أولوية التعيين</div></button>
                      <button type="button" onClick={() => openCommandCenter('collection')} className="rounded-2xl border border-rose-400/50 bg-rose-500/10 p-3 text-right transition hover:-translate-y-0.5 hover:bg-rose-500/20"><div className="flex items-center justify-between text-[10px] font-black text-rose-200"><span>يحتاج تحصيل</span><Wallet size={15} /></div><div className="mt-2 text-2xl font-black text-rose-300">{commandCenterStats.collection}</div><div className="text-[9px] font-bold text-rose-200/60">تأكيد مطلوب</div></button>
                      <button type="button" onClick={() => openCommandCenter('delayed')} className="rounded-2xl border border-red-400/50 bg-red-500/10 p-3 text-right transition hover:-translate-y-0.5 hover:bg-red-500/20"><div className="flex items-center justify-between text-[10px] font-black text-red-200"><span>متأخر</span><Clock size={15} /></div><div className="mt-2 text-2xl font-black text-red-300">{commandCenterStats.delayed}</div><div className="text-[9px] font-bold text-red-200/60">يحتاج متابعة</div></button>
                      <button type="button" onClick={() => openCommandCenter('active')} className="rounded-2xl border border-blue-400/50 bg-blue-500/10 p-3 text-right transition hover:-translate-y-0.5 hover:bg-blue-500/20"><div className="flex items-center justify-between text-[10px] font-black text-blue-200"><span>نشط الآن</span><Wrench size={15} /></div><div className="mt-2 text-2xl font-black text-blue-300">{commandCenterStats.active}</div><div className="text-[9px] font-bold text-blue-200/60">قيد التنفيذ</div></button>
                    </div>
                  </section>
                  <section className="mb-6 rounded-3xl border border-white/10 bg-slate-950/40 p-4" aria-label="ملخص أوردرات الفنيين">
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-black text-white"><Users size={17} className="text-orange-400" /> توزيع الأوردرات على الفنيين</h3>
                        <p className="mt-1 text-[10px] font-bold text-slate-500">اضغط على أي كارت لعرض أوردرات الفني فقط</p>
                      </div>
                      {filterStatus !== 'live' && <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[10px] font-bold text-slate-400">حسب الفلتر الحالي</span>}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {technicianOrderCards.unassigned.total > 0 && (
                        <button type="button" onClick={() => setFilterTechnician('__NONE__')} className="rounded-2xl border border-amber-400/60 bg-amber-500/10 p-4 text-right transition hover:-translate-y-0.5 hover:bg-amber-500/20">
                          <div className="flex items-center justify-between"><span className="text-xs font-black text-amber-200">بدون فني</span><AlertCircle size={18} className="text-amber-300" /></div>
                          <div className="mt-3 text-3xl font-black text-amber-300">{technicianOrderCards.unassigned.total}</div>
                          <div className="mt-1 text-[10px] font-bold text-amber-200/70">أوردر يحتاج تعيين{technicianOrderCards.unassigned.collection ? ` · ${technicianOrderCards.unassigned.collection} تحصيل` : ''}</div>
                        </button>
                      )}
                      {technicianOrderCards.technicians.filter(({ stats }) => stats.total > 0).map(({ tech, stats }) => (
                        <button type="button" key={tech.id} onClick={() => setFilterTechnician(tech.name)} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-right transition hover:-translate-y-0.5 hover:border-orange-500/60 hover:bg-slate-900">
                          <div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-black text-white">{tech.name}</span><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tech.is_active === false ? 'bg-slate-600' : 'bg-emerald-400'}`} /></div>
                          <div className="mt-3 flex items-end justify-between"><span className="text-3xl font-black text-orange-300">{stats.total}</span><span className="text-[10px] font-bold text-slate-500">أوردر</span></div>
                          <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] font-bold"><span className="rounded-full bg-blue-500/10 px-2 py-1 text-blue-300">تنفيذ {stats.active}</span><span className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-300">انتظار {stats.pending}</span>{stats.collection > 0 && <span className="rounded-full bg-rose-500/10 px-2 py-1 text-rose-300">تحصيل {stats.collection}</span>}</div>
                        </button>
                      ))}
                    </div>
                  </section>
                  </>
                )}
                {!showDeleted && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map(order => {
                  const delayed = isDelayed(order);
                  const noTechnician = !order.technician || order.technician === '-' || order.technician === '';
                  const statusConfig: Record<string, any> = {
                    pending: { label: 'قيد الانتظار', Icon: Clock, card: 'bg-amber-950/30 border-amber-400/50 hover:border-amber-300 hover:shadow-amber-500/20', badge: 'bg-amber-500/15 text-amber-300 border-amber-400/40', icon: 'bg-amber-500/20 text-amber-300', pulse: 'animate-pulse' },
                    'in-progress': { label: 'قيد التنفيذ', Icon: Wrench, card: 'bg-blue-950/30 border-blue-400/50 hover:border-blue-300 hover:shadow-blue-500/20', badge: 'bg-blue-500/15 text-blue-300 border-blue-400/40', icon: 'bg-blue-500/20 text-blue-300', pulse: '' },
                    in_progress: { label: 'قيد التنفيذ', Icon: Wrench, card: 'bg-blue-950/30 border-blue-400/50 hover:border-blue-300 hover:shadow-blue-500/20', badge: 'bg-blue-500/15 text-blue-300 border-blue-400/40', icon: 'bg-blue-500/20 text-blue-300', pulse: '' },
                    completed: { label: 'مكتمل', Icon: CheckCircle2, card: 'bg-emerald-950/30 border-emerald-400/50 hover:border-emerald-300 hover:shadow-emerald-500/20', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40', icon: 'bg-emerald-500/20 text-emerald-300', pulse: '' },
                    cancelled: { label: 'ملغي', Icon: AlertCircle, card: 'bg-rose-950/30 border-rose-400/50 hover:border-rose-300 hover:shadow-rose-500/20', badge: 'bg-rose-500/15 text-rose-300 border-rose-400/40', icon: 'bg-rose-500/20 text-rose-300', pulse: '' },
                    deferred: { label: 'مؤجل', Icon: Clock, card: 'bg-purple-950/30 border-purple-400/50 hover:border-purple-300 hover:shadow-purple-500/20', badge: 'bg-purple-500/15 text-purple-300 border-purple-400/40', icon: 'bg-purple-500/20 text-purple-300', pulse: '' },
                    inspected: { label: 'كشف / زيارة', Icon: Search, card: 'bg-cyan-950/30 border-cyan-400/50 hover:border-cyan-300 hover:shadow-cyan-500/20', badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40', icon: 'bg-cyan-500/20 text-cyan-300', pulse: '' },
                    returned: { label: 'مرتجع صيانة', Icon: RotateCcw, card: 'bg-rose-950/40 border-rose-500/70 hover:border-rose-300 hover:shadow-rose-500/30', badge: 'bg-rose-600 text-white border-rose-400/50', icon: 'bg-rose-500/20 text-rose-300', pulse: 'animate-pulse' },
                    delayed: { label: 'متأخر', Icon: AlertCircle, card: 'bg-red-950/40 border-red-500/70 hover:border-red-300 hover:shadow-red-500/30', badge: 'bg-red-500/20 text-red-300 border-red-400/50', icon: 'bg-red-500/20 text-red-300', pulse: 'animate-pulse' }
                  };
                  const baseConfig = statusConfig[order.status] || { label: order.status, Icon: AlertCircle, card: 'bg-slate-900 border-slate-700 hover:border-slate-500 hover:shadow-slate-500/10', badge: 'bg-slate-500/15 text-slate-300 border-slate-500/40', icon: 'bg-slate-500/20 text-slate-300', pulse: '' };
                  const config = delayed ? statusConfig.delayed : baseConfig;
                  const StatusIcon = config.Icon;
                  const orderCreatedValue = getOrderCreatedValue(order);
                  const activityTime = getOrderActivityTime(order);
                  const activityAge = clockNow - activityTime;
                  const recentlyUpdated = activityTime > 0 && activityAge >= -5 * 60 * 1000 && activityAge <= 30 * 60 * 1000;
                  const elapsedTone = getElapsedTone(orderCreatedValue, clockNow);
                  const pickup = parsePickupReceipt(order);
                  const companyTransfer = parseCompanyTransfer(order.technician_note);
                  const collectionPending = isCollectionPending(order);
                  const transferPending = collectionPending && companyTransfer?.status === 'pending';
                  const orderWorkflow = [
                    { key: 'pending', label: 'جديد' },
                    { key: 'in-progress', label: 'تنفيذ' },
                    { key: 'inspected', label: 'كشف' },
                    { key: 'completed', label: 'مكتمل' }
                  ];
                  const normalizedStatus = order.status === 'in_progress' ? 'in-progress' : order.status;
                  const workflowIndex = normalizedStatus === 'returned' || normalizedStatus === 'deferred'
                    ? 1
                    : Math.max(0, orderWorkflow.findIndex((step) => step.key === normalizedStatus));
                  const shortOrderNumber = String(order.order_number || '').match(/\d{3,}$/)?.[0] || String(order.order_number || '').slice(-6);
                  const elapsedToneClass = elapsedTone === 'urgent' ? 'text-rose-200 bg-rose-500/20 border-rose-400/50 shadow-lg shadow-rose-500/20 animate-pulse' : elapsedTone === 'warning' ? 'text-amber-200 bg-amber-500/20 border-amber-400/40 shadow-lg shadow-amber-500/10' : 'text-slate-200 bg-slate-950/70 border-slate-700';
                  const cardTone = collectionPending ? 'bg-amber-950/40 border-amber-300 shadow-amber-400/30 animate-pulse' : config.card;
                  
                  // تحديد لون التوهج بناءً على الحالة
                  const glowColors: Record<string, string> = {
                    'pending': 'group-hover:shadow-blue-500/20 border-blue-500/20',
                    'in-progress': 'group-hover:shadow-orange-500/20 border-orange-500/20',
                    'completed': 'group-hover:shadow-emerald-500/20 border-emerald-500/20',
                    'cancelled': 'group-hover:shadow-rose-500/20 border-rose-500/20',
                    'returned': 'group-hover:shadow-rose-600/30 border-rose-600/30 shadow-rose-900/20',
                    'inspected': 'group-hover:shadow-cyan-500/20 border-cyan-500/20'
                  };
                  const statusGlow = delayed ? 'shadow-red-900/40 border-red-500/40' : glowColors[order.status] || 'border-slate-700/30';

                  return (
	                                          <div 
		                      key={order.id} 
		                      role="button"
		                      tabIndex={0}
		                      aria-label={`تعديل أوردر ${order.customer_name}`}
		                      onClick={() => { stopUrgentAlert(); setEditingOrder(order); setFormData(order); setFormStep(1); setShowOrderModal(true); }}
		                      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); stopUrgentAlert(); setEditingOrder(order); setFormData(order); setFormStep(1); setShowOrderModal(true); } }}
		                      className={`group order-card-3d ${cardTone} ${statusGlow} ${recentlyUpdated ? 'ring-2 ring-emerald-300/70 shadow-[0_0_26px_rgba(52,211,153,0.28)]' : ''} rounded-[1.5rem] border p-4 transition-all hover:shadow-2xl active:scale-[0.98] cursor-pointer relative overflow-hidden ${config.pulse} bg-slate-900/60 backdrop-blur-md border-opacity-30 hover:border-opacity-100`}
	                    >
	                      {collectionPending && <div className="absolute inset-0 pointer-events-none rounded-[1.5rem] border border-amber-300/50 shadow-[0_0_20px_rgba(251,191,36,0.2)]"></div>}
	                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/10 transition-all"></div>

		                      {/* Header Section */}
		                      <div className="flex justify-between items-start mb-3 relative z-10">
                            {/* Pin Button */}
                            <button 
                              onClick={(e) => togglePinOrder(e, order.id)}
                              className={`absolute -left-2 -top-2 w-8 h-8 rounded-full flex items-center justify-center transition-all z-20 ${pinnedOrderIds.has(order.id) ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40 scale-110' : 'bg-slate-800/50 text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-slate-700'}`}
                            >
                              {pinnedOrderIds.has(order.id) ? <Pin size={14} fill="currentColor" /> : <PinOff size={14} />}
                            </button>

	                        <div className="flex flex-col gap-1">
			                          <div className="flex flex-wrap items-center gap-1.5">
		                            <h3 className="text-lg font-black text-white group-hover:text-orange-400 transition-colors leading-tight">{order.customer_name}</h3>
		                            <div className="flex gap-1">
		                              {previousCustomerPhones.has(normalizeCustomerPhone(order.phone)) && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-black text-emerald-300">✨ عميل سابق</span>}
		                              {isNewOrder(order) && <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-500/20 px-1.5 py-0.5 text-[8px] font-black text-blue-300 animate-pulse">🆕 جديد الآن</span>}
		                            </div>
			                          </div>
	                          <div className="flex items-center gap-1.5">
	                            <span className="text-[8px] font-black text-slate-500 tracking-tighter uppercase bg-slate-800/80 px-1.5 py-0.5 rounded shadow-inner">#{order.order_number}</span>
                            {shortOrderNumber && shortOrderNumber !== String(order.order_number) && <span className="text-[9px] font-black text-orange-300 bg-orange-500/10 border border-orange-400/20 px-1.5 py-0.5 rounded-md">#{shortOrderNumber}</span>}
	                            {getWarrantyStatus(order).status !== 'none' && (
	                              <div className={`px-1.5 py-0.5 rounded-full text-[7px] font-black bg-${getWarrantyStatus(order).color}-500/20 text-${getWarrantyStatus(order).color}-400 border border-${getWarrantyStatus(order).color}-500/30 flex items-center gap-1`}>
	                                <ShieldCheck size={8} /> {getWarrantyStatus(order).text}
	                              </div>
	                            )}
	                          </div>
	                        </div>
	                        
	                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-1.5">
                            {collectionPending && <span className="px-2 py-1 rounded-lg text-[8px] font-black border border-amber-200/80 bg-amber-300/30 text-amber-100 shadow-sm animate-pulse">تحتاج تأكيد التحصيل</span>}
                            {!transferPending && recentlyUpdated && <span className="px-2 py-1 rounded-lg text-[8px] font-black border border-emerald-300/50 bg-emerald-400/20 text-emerald-200 shadow-sm animate-pulse">تم التحديث الآن</span>}
                            <div className={`px-2 py-1 rounded-lg text-[9px] font-black border flex items-center gap-1 shadow-sm ${config.badge}`}>
                              <StatusIcon size={12} strokeWidth={3} />
                              {config.label}
                            </div>
                          </div>
	                          
	                          {(order.status === 'completed' || order.status === 'returned') && canEditDelete() && (
	                            <button 
	                              onClick={(e) => { e.stopPropagation(); setSelectedOrderForReturn(order); setShowReturnModal(true); }} 
	                              className="bg-rose-600/90 hover:bg-rose-600 text-white px-2 py-1 rounded-lg text-[8px] font-black flex items-center gap-1 shadow-md animate-pulse transition-all active:scale-90"
	                            >
	                              <RotateCcw size={10} /> إرجاع ⚠️
	                            </button>
	                          )}
	                        </div>
	                      </div>

		                      {/* Last Action Insight & Pulse */}
                            <div className="mb-3 relative z-10 flex items-center justify-between gap-2 bg-slate-950/30 px-3 py-1.5 rounded-xl border border-white/5">
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                <History size={10} className="text-blue-400 shrink-0" />
	                                <span className="text-[10px] font-black text-slate-300 truncate">
	                                  {order.status === 'returned' ? '⚠️ مرتجع: ' + (order.technician_note?.split('⚠️')[1]?.split('\n')[0] || 'بانتظار الفحص') : 
	                                   order.status === 'completed' ? '✅ تم الاعتماد والإغلاق' :
	                                   order.technician_note?.includes('OLD') ? '📸 تم رفع صور المعاينة' :
	                                   order.technician ? `👨‍🔧 الفني: ${order.technician}` : '⏳ بانتظار تعيين فني فوري'}
	                                </span>
                              </div>
		                              {/* Quick Action Button for Assignment */}
		                              {noTechnician && order.status === 'pending' && (
		                                <button 
		                                  onClick={(e) => { 
		                                    e.stopPropagation(); 
		                                    setEditingOrder(order); 
		                                    setFormData(order); 
		                                    setFormStep(3); // الانتقال مباشرة لخطوة التكليف
		                                    setShowOrderModal(true); 
		                                  }}
		                                  className="bg-orange-600 hover:bg-orange-500 text-white px-2 py-1 rounded-lg text-[9px] font-black flex items-center gap-1 shadow-lg shadow-orange-900/20 transition-all active:scale-90"
		                                >
		                                  <UserPlus size={10} /> تعيين فني
		                                </button>
		                              )}
	                              
	                              {/* Priority Pulse Indicator */}
	                              {(!order.technician_note || new Date().getTime() - new Date(order.updated_at || order.created_at).getTime() > 4 * 60 * 60 * 1000) && order.status !== 'completed' && !noTechnician && (
	                                <div className="flex items-center gap-1 shrink-0">
	                                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></div>
	                                  <span className="text-[7px] font-black text-orange-400 uppercase tracking-tighter">متابعة</span>
	                                </div>
	                              )}
                            </div>

                            {/* Smart workflow progress */}
                            <div className="mb-4 relative z-10 rounded-xl border border-white/5 bg-slate-950/40 px-3 py-2.5">
                              <div className="flex items-center justify-between gap-1">
                                {orderWorkflow.map((step, index) => {
                                  const completedStep = index <= workflowIndex;
                                  const currentStep = index === workflowIndex;
                                  return (
                                    <React.Fragment key={step.key}>
                                      <button type="button" onClick={(event) => { event.stopPropagation(); setEditingOrder(order); setFormData(order); setFormStep(1); setShowOrderModal(true); }} className={`flex min-w-0 flex-col items-center gap-1 transition-colors ${currentStep ? 'text-orange-300' : completedStep ? 'text-emerald-300' : 'text-slate-600'}`} title="فتح تفاصيل المرحلة">
                                        <span className={`h-2.5 w-2.5 rounded-full border ${currentStep ? 'border-orange-200 bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.8)]' : completedStep ? 'border-emerald-300 bg-emerald-400' : 'border-slate-600 bg-slate-800'}`} />
                                        <span className="truncate text-[8px] font-black">{step.label}</span>
                                      </button>
                                      {index < orderWorkflow.length - 1 && <span className={`h-px flex-1 ${index < workflowIndex ? 'bg-emerald-400/70' : 'bg-slate-700'}`} />}
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </div>

			                      {/* Alerts Section */}
		                      {transferPending && isAdmin && (
	                        <div className="mb-5 relative z-10 rounded-2xl border border-amber-300/70 bg-gradient-to-l from-amber-500/20 via-yellow-500/10 to-transparent p-4 shadow-lg shadow-amber-500/20 animate-in zoom-in-95 duration-300">
	                          <div className="flex items-center justify-between gap-3">
	                            <div className="flex min-w-0 items-center gap-3 text-amber-100">
	                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-200 border border-amber-400/30"><Wallet size={20} /></div>
	                              <div className="min-w-0">
	                                <p className="text-[12px] font-black">تحويل بانتظار تأكيد الاستلام</p>
	                                <p className="mt-0.5 truncate text-[10px] font-bold text-amber-200/80">نصيب الشركة: {Number(companyTransfer.amount ?? order.company_share ?? 0).toLocaleString('ar-EG')} ج.م</p>
	                              </div>
	                            </div>
	                            <button type="button" disabled={confirmingTransferId === order.id} onClick={() => confirmCompanyTransferReceipt(order)} className="shrink-0 rounded-xl bg-amber-400 px-4 py-2.5 text-[11px] font-black text-slate-950 shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-300 active:scale-95 disabled:cursor-wait disabled:opacity-60">{confirmingTransferId === order.id ? 'جارٍ الاعتماد…' : 'تأكيد الاستلام'}</button>
	                          </div>
	                        </div>
	                      )}
	                      
	                      {pickup && pickup.status === 'active' && (
	                        <div className="mb-5 relative z-10 flex items-center justify-between gap-2 rounded-2xl border border-purple-400/40 bg-purple-500/10 px-4 py-3 text-purple-200 shadow-inner">
	                          <span className="flex items-center gap-2 text-[11px] font-black"><ClipboardList size={16} className="text-purple-400" /> {getPickupTypeLabel(pickup.type)}</span>
	                          <button type="button" onClick={() => window.open(`/pickup-receipt?id=${order.id}`, '_blank')} className="text-[10px] font-black text-purple-100 bg-purple-600/30 px-3 py-1.5 rounded-lg border border-purple-500/20 hover:bg-purple-600/50 transition-all">فتح الإيصال</button>
	                        </div>
	                      )}

	                      {/* Main Info Grid */}
	                      <div className="grid grid-cols-2 gap-2 mb-4 relative z-10">
	                        <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-white/5 flex items-center gap-2.5 shadow-inner group/info hover:border-orange-500/30 transition-colors">
	                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border border-white/5 ${config.icon} shadow-md shadow-black/20`}><Cpu size={16} /></div>
	                          <div className="min-w-0">
	                            <p className="text-[8px] font-black text-slate-500 mb-0.5 uppercase tracking-tighter">الجهاز</p>
	                            <p className="text-[11px] font-black text-slate-200 truncate">{order.device_type}</p>
	                            <p className="text-[9px] font-bold text-slate-400 truncate">{order.brand}</p>
	                          </div>
	                        </div>
	                        <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-white/5 flex items-center gap-2.5 shadow-inner group/info hover:border-emerald-500/30 transition-colors">
	                          <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/5 bg-emerald-500/10 text-emerald-400 shadow-md shadow-black/20"><DollarSign size={16} /></div>
	                          <div className="min-w-0">
	                            <p className="text-[8px] font-black text-slate-500 mb-0.5 uppercase tracking-tighter">المبلغ</p>
	                            <p className="text-[12px] font-black text-orange-400 tracking-tight">{Number(order.total_amount).toLocaleString('ar-EG')} <span className="text-[8px]">ج.م</span></p>
	                          </div>
	                        </div>
	                      </div>

	                      {/* Photos Section */}
	                      {(getPhotoUrl(order.technician_note, 'OLD') || getPhotoUrl(order.technician_note, 'NEW')) && (
	                        <div className="grid grid-cols-2 gap-2 mb-4 relative z-10">
	                          {getPhotoUrl(order.technician_note, 'OLD') && (
		                            <div className="relative rounded-xl overflow-hidden border border-rose-500/20 h-16 shadow-sm group/photo">
		                              <img src={getPhotoUrl(order.technician_note, 'OLD') || undefined} className="w-full h-full object-cover" loading="lazy" decoding="async" />
		                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity cursor-pointer" onClick={() => window.open(getPhotoUrl(order.technician_note, 'OLD') || '', '_blank')}><Camera size={14} className="text-white" /></div>
		                              <div className="absolute bottom-0 left-0 right-0 bg-rose-600/80 text-[7px] font-black text-white text-center py-0.5">قديم</div>
		                            </div>
		                          )}
		                          {getPhotoUrl(order.technician_note, 'NEW') && (
		                            <div className="relative rounded-xl overflow-hidden border border-emerald-500/20 h-16 shadow-sm group/photo">
		                              <img src={getPhotoUrl(order.technician_note, 'NEW') || undefined} className="w-full h-full object-cover" loading="lazy" decoding="async" />
	                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity cursor-pointer" onClick={() => window.open(getPhotoUrl(order.technician_note, 'NEW') || '', '_blank')}><Camera size={14} className="text-white" /></div>
	                              <div className="absolute bottom-0 left-0 right-0 bg-emerald-600/80 text-[7px] font-black text-white text-center py-0.5">جديد</div>
	                            </div>
	                          )}
	                        </div>
	                      )}

	                      {/* Compact Meta Info */}
	                      <div className="space-y-2 mb-4 relative z-10 bg-slate-950/40 p-3 rounded-2xl border border-white/5 shadow-inner">
	                        <div className="flex items-start gap-2.5 text-[11px] text-slate-300">
	                          <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400 shrink-0 shadow-sm"><MapPin size={14} /></div>
	                          <div className="min-w-0 flex-1">
	                            <span className="line-clamp-1 font-bold leading-tight">{order.address || 'بدون عنوان'}</span>
	                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter mt-0.5">الموقع</p>
	                          </div>
	                          {order.address && (
	                              <button
	                                onClick={(e) => {
	                                  e.stopPropagation();
	                                  const addr = order.address || '';
	                                  const query = addr.includes('http') ? addr : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr + (addr.includes('الساحل') || addr.includes('ك ') ? ' Egypt' : ' Alexandria Egypt'))}`;
	                                  window.open(query, '_blank');
	                                }}
	                                className="w-7 h-7 bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-lg flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all active:scale-90 shadow-sm"
	                                title="GPS"
	                              >
	                                <Navigation size={12} />
	                              </button>
	                          )}
	                        </div>
	                        
	                        <div className="flex items-center gap-2.5 text-[11px] text-slate-300">
	                          <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400 shrink-0 shadow-sm"><Users size={14} /></div>
	                          <div className="flex-1 min-w-0">
	                            <div className="flex items-center justify-between">
	                              <span className={`font-black truncate max-w-[120px] ${noTechnician ? 'text-orange-500 animate-pulse' : 'text-slate-200'}`}>{order.technician || 'لم يتم التعيين'}</span>
	                              {!noTechnician && canEditDelete() && (
	                                <button onClick={(e) => { e.stopPropagation(); pingTechnician(order.technician); }} className="w-6 h-6 bg-orange-600/20 text-orange-500 rounded-lg border border-orange-500/20 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all active:scale-90"><Bell size={10} className="animate-pulse" /></button>
	                              )}
	                            </div>
	                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter mt-0.5">الفني</p>
	                          </div>
	                        </div>

	                        <div className="flex items-center gap-2.5 text-[11px] text-slate-300">
	                          <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400 shrink-0 shadow-sm"><Clock size={14} /></div>
	                          <div className="flex-1 min-w-0">
	                            <div className="flex items-center justify-between">
	                              <span className="font-bold text-slate-300 text-[10px]">{formatOrderDateTime(orderCreatedValue)}</span>
	                              <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[9px] font-black tracking-tighter shadow-sm ${elapsedToneClass}`}>منذ {formatElapsed(orderCreatedValue, clockNow)}</span>
	                            </div>
	                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter mt-0.5">التوقيت</p>
	                          </div>
	                        </div>
	                      </div>

	                      {/* Modern Icon Actions Section */}
	                      {!isViewer && (
	                        <div className="space-y-3 relative z-10 pt-3 border-t border-white/5">
	                          {/* Primary Actions Row */}
	                          <div className="flex items-center justify-between gap-2">
	                            <div className="flex gap-2">
	                              <a onClick={(e) => e.stopPropagation()} href={`tel:${order.phone}`} className="w-9 h-9 bg-blue-600/90 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-all border border-white/10" title="اتصال"><Phone size={16} /></a>
	                              <button onClick={(e) => { e.stopPropagation(); sendWhatsApp(order.phone, `مرحباً أ/ ${order.customer_name}، معك مركز الصيانة بخصوص طلبك رقم ${order.order_number}`); }} className="w-9 h-9 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-all border border-white/10" title="واتساب"><Send size={16} /></button>
                              {canEditDelete() && (
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTrackingShareOrderId((current) => current === order.id ? null : order.id);
                                    }}
                                    className="w-9 h-9 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-all border border-white/10"
                                    title="فتح خيارات رابط التتبع"
                                    aria-label="خيارات رابط التتبع"
                                  >
                                    <ExternalLink size={16} />
                                  </button>
                                  {trackingShareOrderId === order.id && (
                                    <div className="absolute left-0 top-11 z-50 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                      <button onClick={() => window.open(getTrackingUrl(order), '_blank')} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-right text-xs font-black text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"><ExternalLink size={15} /> فتح التتبع</button>
                                      <button onClick={() => sendTrackingLinkToCustomer(order)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-right text-xs font-black text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"><Send size={15} /> إرسال واتساب</button>
                                      <button onClick={() => { void copyTrackingLink(order); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-right text-xs font-black text-slate-700 hover:bg-purple-50 hover:text-purple-700"><Copy size={15} /> نسخ الرابط</button>
                                    </div>
                                  )}
                                </div>
                              )}
	                            </div>
	                            
	                            <div className="flex gap-2">
	                              {canEditDelete() && (
	                                <button 
	                                  onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }} 
	                                  className="w-9 h-9 bg-slate-800/80 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-all border border-white/5" 
	                                  title="حذف الأوردر"
	                                >
	                                  <Trash2 size={16} />
	                                </button>
	                              )}
	                            </div>
	                          </div>

	                          {/* Secondary Actions Row (Status & Payment) */}
	                          {canEditDelete() && (
	                            <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
	                               <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)} className="h-9 text-[9px] font-black bg-slate-950/60 border border-slate-800 rounded-lg px-2 text-white flex-1 outline-none shadow-inner">
	                                 <option value="pending">الحالة...</option>
	                                 <option value="in-progress">🔧 تنفيذ</option>
	                                 <option value="inspected">🔍 كشف</option>
	                                 <option value="completed">✅ مكتمل</option>
	                                 <option value="cancelled">❌ ملغي</option>
	                                 <option value="deferred">⏰ مؤجل</option>
	                               </select>
	                               
                               {transferPending ? (
                                 isAdmin ? (
                                   <button type="button" disabled={confirmingTransferId === order.id} onClick={() => confirmCompanyTransferReceipt(order)} className="h-9 px-3 rounded-lg bg-amber-400 text-[9px] font-black text-slate-950 shadow-md active:scale-90 transition-all flex items-center gap-1"><Wallet size={12} /> تأكيد</button>
                                 ) : (
                                   <div className="h-9 px-3 rounded-lg bg-slate-800 text-[9px] font-black text-amber-300 border border-amber-500/20 flex items-center gap-1" title="تأكيد التحصيل متاح لمدير النظام فقط"><Wallet size={12} /> بانتظار مدير النظام</div>
                                 )
                               ) : (
	                                 isAdmin ? (
	                                   <button onClick={() => togglePaidStatus(order.id, order.is_paid)} className={`h-9 px-3 rounded-lg text-[9px] font-black shadow-md active:scale-90 transition-all ${order.is_paid ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white animate-pulse'}`}>
	                                     {order.is_paid ? 'محصل ✅' : 'تحصيل؟ 💰'}
	                                   </button>
	                                 ) : (
	                                   <div className={`h-9 px-3 rounded-lg text-[9px] font-black flex items-center justify-center border ${order.is_paid ? 'bg-emerald-500/10 text-emerald-500/70 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
	                                     {order.is_paid ? 'تم ✅' : 'لم يتم'}
	                                   </div>
	                                 )
	                               )}
	                            </div>
	                          )}

	                          {/* Footer Buttons Row */}
	                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
	                            {order.status === 'completed' ? (
	                              <button onClick={() => window.open(`/invoice?id=${order.id}`, '_blank')} className="flex-1 h-9 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-[9px] font-black border border-blue-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"><FileCheck size={14} /> فاتورة</button>
	                            ) : (
	                              <button onClick={() => { void openManagerPickupReceipt(order); }} className="flex-1 h-9 bg-purple-600/20 hover:bg-purple-700 text-purple-400 hover:text-white rounded-lg text-[9px] font-black border border-purple-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"><ClipboardList size={14} /> إيصال</button>
	                            )}
	                            
		                            {order.status === 'completed' && canEditDelete() && (
		                              <div className="flex gap-2">
		                                <button 
		                                  onClick={(e) => {
		                                    e.stopPropagation();
		                                    const invoiceUrl = `${window.location.origin}/invoice?id=${order.id}`;
		                                    const message = `شكراً لتعاملك مع مركز الصيانة أ/ ${order.customer_name} ✨\n\nتم إتمام صيانة جهازك (${order.device_type}) بنجاح.\n\n📄 رابط الفاتورة والضمان الرقمي الخاص بك:\n${invoiceUrl}\n\nنرجو منك تقييم الخدمة من خلال الرابط بأسفل الفاتورة لضمان تقديم أفضل جودة دائماً. 🌹`;
		                                    sendWhatsApp(order.phone, message);
		                                  }} 
		                                  className="w-9 h-9 bg-emerald-500/20 text-emerald-500 rounded-lg border border-emerald-500/20 flex items-center justify-center active:scale-90 transition-all" 
		                                  title="إرسال شكر وفاتورة واتساب"
		                                >
		                                  <MessageCircle size={16} />
		                                </button>
		                                <button onClick={() => sendFeedbackRequest(order)} className="w-9 h-9 bg-amber-500/20 text-amber-500 rounded-lg border border-amber-500/20 flex items-center justify-center active:scale-90 transition-all" title="طلب تقييم سريع"><Star size={16} /></button>
		                              </div>
		                            )}

	                            {order.status === 'in-progress' && canEditDelete() && (
	                              <button onClick={() => { setSelectedOrder(order); setSettleForm({ total_amount: order.total_amount || 0, parts_cost: order.parts_cost || 0, transport_cost: order.transport_cost || 0, net_amount: order.net_amount || 0, technician_share: order.technician_share || 0, company_share: order.company_share || 0 }); setShowSettleModal(true); }} className="flex-[2] h-9 bg-orange-600 text-white rounded-lg text-[10px] font-black shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"><DollarSign size={14} /> تصفية</button>
	                            )}
	                          </div>
	                        </div>
	                      )}
	                      
	                      {delayed && (
	                        <div className="absolute top-4 left-4 bg-rose-600 text-white text-[9px] font-black px-3 py-1 rounded-full animate-bounce shadow-xl border border-white/20 z-20">متأخر ⚠️</div>
	                      )}
	                    </div>
                  );
                })}
	              </div>
	            )}

              {filterStatus !== 'completed' && allFilteredOrders.length > visibleOrdersCount && !searchTerm && (
                <div className="flex justify-center py-8">
                  <button 
                    onClick={() => setVisibleOrdersCount(prev => prev + 15)}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-2xl font-black shadow-lg border border-slate-700 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <ChevronDown size={18} /> عرض المزيد من الأوردرات ({allFilteredOrders.length - visibleOrdersCount} متبقي)
                  </button>
                </div>
              )}

              {filterStatus === 'completed' && allFilteredOrders.length > visibleCompletedCount && !searchTerm && (
                <div className="flex justify-center py-8">
                  <button 
                    onClick={() => setVisibleCompletedCount(prev => prev + 15)}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-2xl font-black shadow-lg border border-slate-700 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <ChevronDown size={18} /> عرض المزيد من الأوردرات المكتملة ({allFilteredOrders.length - visibleCompletedCount} متبقي)
                  </button>
                </div>
              )}
	
	            {showDeleted && (
              <div className="space-y-4">
                {deletedOrders.length > 0 && canEditDelete() && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4">
                    <div>
                      <h3 className="font-black text-white">سلة المحذوفات</h3>
                      <p className="text-[11px] text-rose-200/70 mt-1">الاستعادة ممكنة حالياً، أما الحذف النهائي فلا يمكن التراجع عنه.</p>
                    </div>
                    <button
                      type="button"
                      onClick={permanentlyDeleteAllOrders}
                      className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-rose-900/30 transition hover:bg-rose-700 active:scale-95"
                      title="حذف جميع الأوردرات المحذوفة نهائياً"
                    >
                      <Trash2 size={14} className="inline ml-1" /> مسح الكل ({deletedOrders.length}) — حذف نهائي
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deletedOrders.length === 0 && <div className="col-span-full text-center py-8 text-slate-400">لا توجد أوردرات محذوفة</div>}
                {deletedOrders.map(order => (
                  <div key={order.id} className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 opacity-70">
                    <div className="flex justify-between items-start">
                      <div><h3 className="font-bold text-white">{order.customer_name}</h3><p className="text-xs text-slate-400">رقم: {order.order_number}</p><p className="text-xs text-red-400">🗑️ محذوف في {new Date(order.deleted_at).toLocaleDateString('ar-EG')}</p></div>
                      {canEditDelete() && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => restoreOrder(order.id)} className="p-1 text-green-500 hover:text-green-400" title="استعادة"><RotateCcw size={16} /></button>
                          <button onClick={() => permanentlyDeleteOrder(order.id)} className="p-1 text-rose-500 hover:text-rose-400" title="حذف نهائي"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-2 text-sm">{!isViewer && <div className="text-slate-300">📞 {order.phone}</div>}<div className="text-slate-300">🔧 {order.device_type} - {order.brand}</div><div className="col-span-2 text-slate-300">📍 {order.address}</div><div className="col-span-2 text-slate-300">📝 {order.problem_description}</div><div className="text-slate-300">💰 {order.total_amount} ج.م</div><div className="text-slate-300">👨‍🔧 {order.technician || '-'}</div></div>
                  </div>
                ))}
                </div>
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

            <div className="bg-slate-900/70 border border-indigo-500/20 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300" size={18} />
                  <input
                    type="search"
                    value={archiveSearchTerm}
                    onChange={(event) => setArchiveSearchTerm(event.target.value)}
                    placeholder="ابحث باسم العميل أو الفني أو رقم الهاتف..."
                    aria-label="البحث في الأرشيف باسم العميل أو الفني أو رقم الهاتف"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pr-10 pl-3 text-sm font-bold text-white outline-none transition focus:border-indigo-400"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 whitespace-nowrap">
                  <span className="rounded-full bg-indigo-500/15 px-3 py-2 text-indigo-300">نتائج البحث: {filteredArchivedOrders.length}</span>
                  {archiveSearchTerm && <button type="button" onClick={() => setArchiveSearchTerm('')} className="rounded-xl bg-slate-800 px-3 py-2 text-slate-300 transition hover:bg-slate-700">مسح البحث</button>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3">
                <span className="text-[10px] font-black text-slate-500">تصفية زمنية:</span>
                <input type="date" value={archiveDateFilter} onChange={event => { setArchiveDateFilter(event.target.value); setVisibleArchivedCount(15); }} className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-white" aria-label="اختيار تاريخ الأرشيف" />
                <button type="button" onClick={() => { setArchiveDateFilter(''); setVisibleArchivedCount(15); }} className="rounded-xl bg-slate-800 px-3 py-2 text-[10px] font-black text-slate-300 hover:bg-slate-700">كل التواريخ</button>
                <span className="mr-auto text-[10px] font-bold text-slate-500">مكتمل: {archiveSummary.completed} · ملغي: {archiveSummary.cancelled} · بفني: {archiveSummary.withTechnician}</span>
              </div>
              <p className="text-[10px] text-slate-500">يمكنك كتابة جزء من الاسم أو آخر أرقام الهاتف أو اسم الفني للوصول إلى الأوردر بسرعة، أو اختر تاريخًا لاستدعاء أرشيف يوم محدد.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArchivedOrders.length === 0 && (
                <div className="col-span-full text-center py-20 bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-800">
                  <Plus className="w-12 h-12 text-slate-700 mx-auto mb-4 rotate-45" />
                  <p className="text-slate-500 font-bold">لا توجد أوردرات في الأرشيف حالياً</p>
                </div>
              )}
              {filteredArchivedOrders.map(order => {
                  const statusConfig: Record<string, { color: string; label: string }> = {
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
	                          onClick={() => { stopUrgentAlert(); setEditingOrder(order); setFormData(order); setFormStep(1); setShowOrderModal(true); }}
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
              {canManageTechnicians && <button onClick={() => { setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true, username: '', password: '', profit_percentage: 50 }); setShowTechModal(true); }} className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> إضافة فني</button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTechnicians.map(tech => (
                <div key={tech.id} className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700 relative overflow-hidden">
                  {/* مؤشر حالة الإشعارات الذكي */}
                  {(() => {
                    const lastHeartbeat = notifications.find(n => n.user_name === tech.name && n.action === "🔔 جاهز للاستلام");
                    const isActiveNotif = lastHeartbeat && (new Date().getTime() - new Date(lastHeartbeat.created_at).getTime() < 24 * 60 * 60 * 1000);
                    return (
                      <div className={`absolute top-2 right-2 p-1.5 rounded-lg border ${isActiveNotif ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-700/30 border-slate-600/30 text-slate-500'}`} title={isActiveNotif ? 'الإشعارات نشطة ومفعلة' : 'الإشعارات غير مفعلة أو لم يتم استقبال إشارة منذ 24 ساعة'}>
                        <Bell size={12} className={isActiveNotif ? 'animate-bounce' : ''} />
                      </div>
                    );
                  })()}
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3"><Users className="w-8 h-8 text-orange-500" /></div>
                  <h3 className="font-bold text-white">{tech.name}</h3>
                  <p className="text-xs text-slate-400">{tech.specialization}</p>
                  <p className="text-xs text-slate-400 mt-1">نسبة الأرباح: {tech.profit_percentage ?? 50}%</p>
                   <div className="mt-3 space-y-2">
                     <div className="flex gap-2">
                       <button onClick={() => copyTechLink(tech)} className="flex-1 bg-slate-700 text-slate-300 py-2 rounded text-[10px] flex items-center justify-center gap-1"><span>{copiedId===tech.id?<Check size={14}/>:<Copy size={14}/>}</span> نسخ</button>
                       {canEditDelete() && <button onClick={() => sendOldOrdersReminderToTechnician(tech)} disabled={!tech.phone} className="flex-[1.5] bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 py-2 rounded text-[10px] font-black flex items-center justify-center gap-1" title={tech.phone ? 'إرسال قائمة الأوردرات القديمة للفني عبر واتساب' : 'لا يوجد رقم هاتف مسجل'}><Send size={13} /> واتساب المتأخرات</button>}
                     </div>
                     {canManageTechnicians && <div className="flex items-center justify-center gap-3 border-t border-slate-700/50 pt-2">
                       <button onClick={() => { setEditingTech(tech); setTechForm(tech); setShowTechModal(true); }} className="p-1 text-blue-500"><Edit size={16} /></button>
                       <button onClick={() => deleteTechnician(tech.id, tech.name)} className="p-1 text-red-500"><Trash2 size={16} /></button>
                       <button onClick={() => toggleTechnicianActive(tech)} className={`p-1 ${tech.is_active!==false?'text-green-500':'text-red-500'}`}>{tech.is_active!==false?'نشط':'تعطيل'}</button>
                       <button onClick={() => updateAllPendingOrdersProfit(tech.name, tech.profit_percentage ?? 50)} className="p-1 text-purple-500 hover:text-purple-400" title="تحديث نسب الأوردرات غير المكتملة لهذا الفني"><RefreshCw size={16}/></button>
                     </div>}
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
                  <option value="tech_performance">أداء الفنيين</option><option value="profits">💰 أرباح الشركاء</option><option value="expenses">💸 المصروفات</option><option value="comparison">📊 مقارنة (إيرادات / مصروفات / أرباح)</option><option value="company_profit">🏢 صافي ربح الشركة</option>
                </select>
              </div>
              <div><label className="block text-sm text-slate-400 mb-1">من تاريخ</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" /></div>
              <div><label className="block text-sm text-slate-400 mb-1">إلى تاريخ</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" /></div>
              <div><label className="block text-sm text-slate-400 mb-1">الفني</label><select value={filterTechnicianReport} onChange={(e) => setFilterTechnicianReport(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-white min-w-[150px]"><option value="">الكل</option>{technicians.map(tech => <option key={tech.id} value={tech.name}>{tech.name}</option>)}</select></div>
              <button onClick={generateReport} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold">عرض التقرير</button>
              <button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold">📎 تصدير CSV</button>
            </div>

            <div className="rounded-2xl border border-orange-500/20 bg-slate-950/50 p-4 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="text-base font-black text-white">تحليل الشهر والسنة</h3>
                  <p className="text-[11px] text-slate-500 mt-1">اختر الشهر والفترة لمعرفة ضغط التسجيل ومقارنة الشهور</p>
                </div>
                <span className="text-[11px] font-black text-orange-300">أعلى شهر: {monthlyStats.busiestMonth?.label || '-'} ({monthlyStats.busiestMonth?.count || 0})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="text-xs text-slate-400">السنة<select value={monthlyYear} onChange={(event) => setMonthlyYear(Number(event.target.value))} className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"><option value={new Date().getFullYear() - 2}>{new Date().getFullYear() - 2}</option><option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option><option value={new Date().getFullYear()}>{new Date().getFullYear()}</option><option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option></select></label>
                <label className="text-xs text-slate-400">الشهر<select value={monthlyMonth} onChange={(event) => setMonthlyMonth(Number(event.target.value))} className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white">{['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'].map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label>
                <label className="text-xs text-slate-400">الفترة<select value={monthlyPeriod} onChange={(event) => setMonthlyPeriod(event.target.value as typeof monthlyPeriod)} className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"><option value="all">الشهر بالكامل</option><option value="start">بداية الشهر (1 - 10)</option><option value="middle">منتصف الشهر (11 - 20)</option><option value="end">نهاية الشهر (21 - آخر الشهر)</option></select></label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-3"><p className="text-[10px] text-slate-500">الفترة المحددة</p><p className="text-sm font-black text-white mt-1">{monthlyStats.monthName}</p><p className="text-[10px] text-orange-300">{monthlyStats.periodStart} - {monthlyStats.periodEnd}</p></div>
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-3"><p className="text-[10px] text-slate-500">إجمالي الأوردرات</p><p className="text-xl font-black text-orange-400 mt-1">{monthlyStats.total}</p></div>
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-3"><p className="text-[10px] text-slate-500">مكتمل</p><p className="text-xl font-black text-emerald-400 mt-1">{monthlyStats.completed}</p></div>
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-3"><p className="text-[10px] text-slate-500">قيد المتابعة</p><p className="text-xl font-black text-blue-400 mt-1">{monthlyStats.pending}</p></div>
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-3"><p className="text-[10px] text-slate-500">أكثر يوم</p><p className="text-xl font-black text-purple-400 mt-1">{monthlyStats.busiestDay ? `يوم ${monthlyStats.busiestDay}` : '-'}</p></div>
              </div>
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
                <h4 className="text-sm font-black text-slate-200 mb-3">الأوردرات خلال شهور {monthlyYear}</h4>
                <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2 items-end min-h-[150px]">
                  {monthlyStats.monthCounts.map((item) => {
                    const height = monthlyStats.busiestMonth?.count ? Math.max(8, (item.count / monthlyStats.busiestMonth.count) * 100) : 8;
                    return <div key={item.month} className="flex flex-col items-center justify-end gap-1 h-32"><span className="text-[9px] text-slate-400">{item.count}</span><div className="w-full max-w-8 rounded-t-lg bg-gradient-to-t from-orange-600 to-amber-300" style={{ height: `${height}%` }} title={`${item.label}: ${item.count}`} /><span className="text-[9px] text-slate-500 truncate max-w-full">{item.label.slice(0, 3)}</span></div>;
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-500/20 bg-slate-950/50 p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2"><Clock size={18} className="text-orange-400" /> أوقات تسجيل الأوردرات</h3>
                  <p className="text-[11px] text-slate-500 mt-1">تحليل تلقائي من تاريخ تسجيل الأوردر، بتوقيت القاهرة</p>
                </div>
                <div className="text-[11px] text-slate-400">{peakTimes.totalWithTime} أوردر له وقت تسجيل</div>
              </div>
              {peakTimes.totalWithTime === 0 ? (
                <div className="rounded-xl bg-slate-900 p-4 text-center text-sm text-slate-500">لا توجد تواريخ تسجيل تحتوي على وقت يمكن تحليله.</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
                    <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-black text-slate-200">أكثر الأيام ازدحاماً</h4><span className="text-[10px] text-orange-400">الأعلى: {peakTimes.days[0]?.label}</span></div>
                    <div className="space-y-2">
                      {peakTimes.days.map((item) => {
                        const width = peakTimes.days[0]?.count ? Math.max(4, (item.count / peakTimes.days[0].count) * 100) : 0;
                        return <div key={item.label} className="flex items-center gap-2 text-xs"><span className="w-16 text-slate-400">{item.label}</span><div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-l from-orange-500 to-amber-300" style={{ width: `${width}%` }} /></div><span className="w-8 text-left font-black text-slate-200">{item.count}</span></div>;
                      })}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
                    <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-black text-slate-200">ساعات الذروة</h4><span className="text-[10px] text-indigo-300">الأعلى: {peakTimes.hours[0] ? `${peakTimes.hours[0].hour}:00` : '-'}</span></div>
                    <div className="space-y-2">
                      {peakTimes.hours.slice(0, 8).map((item) => {
                        const width = peakTimes.hours[0]?.count ? Math.max(4, (item.count / peakTimes.hours[0].count) * 100) : 0;
                        const hourLabel = item.hour === 0 ? '12 ص' : item.hour < 12 ? `${item.hour} ص` : item.hour === 12 ? '12 م' : `${item.hour - 12} م`;
                        return <div key={item.hour} className="flex items-center gap-2 text-xs"><span className="w-12 text-slate-400">{hourLabel}</span><div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-l from-indigo-500 to-cyan-300" style={{ width: `${width}%` }} /></div><span className="w-8 text-left font-black text-slate-200">{item.count}</span></div>;
                      })}
                    </div>
                  </div>
                </div>
              )}
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
                          else if (col === 'عدد الأوردرات') val = row.total_orders || '';
                          else if (col === 'إجمالي الفواتير (ج.م)') val = row.total_invoice || '';
                          else if (col === 'قطع الغيار (ج.م)') val = row.parts_cost || '';
                          else if (col === 'المواصلات (ج.م)') val = row.transport_cost || '';
                          else if (col === 'نصيب الفني (ج.م)') val = row.technician_share || '';
                          else if (col === 'صافي ربح الشركة (ج.م)') val = row.company_profit || '';
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

        {activeTab === 'repeatCustomers' && userRole !== 'viewer' && (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2"><Users className="text-emerald-400" /> العملاء المتكررون</h2>
                <p className="text-sm text-slate-400 mt-1">عملاء سجلوا أكثر من طلب صيانة، مرتبين حسب عدد الزيارات</p>
              </div>
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-center"><span className="block text-2xl font-black text-emerald-300">{repeatCustomers.length}</span><span className="text-xs text-emerald-200">عميل متكرر</span></div>
            </div>
            <div className="relative"><Search className="absolute right-3 top-3 text-slate-500" size={18} /><input value={repeatCustomerSearch} onChange={(event) => setRepeatCustomerSearch(event.target.value)} placeholder="ابحث باسم العميل أو رقم الهاتف" className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 pr-10 pl-4 text-white outline-none focus:border-emerald-500" /></div>
            {filteredRepeatCustomers.length === 0 ? <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-400">لا توجد بيانات لعملاء متكررين حتى الآن</div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredRepeatCustomers.map((customer) => {
                const latest = customer.orders[0];
                const completed = customer.orders.filter((order) => order.status === 'completed').length;
                return <div key={customer.phone} className="rounded-2xl border border-emerald-500/20 bg-slate-900/70 p-4 space-y-4 hover:border-emerald-400/50 transition-all">
                  <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-black text-white">{customer.name}</h3><p className="text-xs text-slate-500 mt-1" dir="ltr">{customer.phone}</p></div><span className="shrink-0 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 text-xs font-black text-emerald-300">✨ {customer.orders.length} أوردر</span></div>
                  <div className="grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3"><span className="block text-slate-500 mb-1">مكتمل</span><strong className="text-emerald-300 text-lg">{completed}</strong></div><div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3"><span className="block text-slate-500 mb-1">آخر حالة</span><strong className="text-slate-200">{latest?.status === 'completed' ? 'مكتمل' : latest?.status === 'in-progress' ? 'قيد التنفيذ' : latest?.status === 'cancelled' ? 'ملغي' : 'قيد الانتظار'}</strong></div></div>
                  <div className="border-t border-slate-800 pt-3 text-xs text-slate-400 space-y-1"><p>آخر أوردر: <span className="text-slate-200">{latest?.order_number || '-'}</span></p><p>آخر زيارة: <span className="text-slate-200">{latest?.created_at ? new Date(latest.created_at).toLocaleDateString('ar-EG') : latest?.date || '-'}</span></p></div>
                  <details className="text-xs"><summary className="cursor-pointer text-emerald-300 font-bold">عرض سجل الأوردرات</summary><div className="mt-2 space-y-2">{customer.orders.map((order) => <div key={order.id} className="flex items-center justify-between rounded-lg bg-slate-950/50 px-3 py-2"><span className="text-slate-300">{order.order_number}</span><span className="text-slate-500">{order.status === 'completed' ? 'مكتمل' : order.status === 'cancelled' ? 'ملغي' : 'قيد المتابعة'}</span></div>)}</div></details>
                </div>;
              })}
            </div>}
          </div>
        )}

        {activeTab === 'invoicesReview' && userRole !== 'viewer' && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-orange-500/20 bg-slate-900/70 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div><h2 className="flex items-center gap-2 text-xl font-black text-white"><Printer className="text-orange-400" /> مركز الفواتير</h2><p className="mt-1 text-xs font-bold text-slate-500">الفواتير المكتملة التي تحتاج اعتماد المدير قبل إرسالها للعميل</p></div>
                <div className="flex flex-wrap gap-2 text-[10px] font-black"><span className="rounded-full bg-orange-500/15 px-3 py-2 text-orange-300">تحتاج مراجعة: {invoiceReviewOrders.length}</span><span className="rounded-full bg-slate-800 px-3 py-2 text-slate-400">المحتوى للعميل: المبلغ والضمان فقط</span></div>
              </div>
              <div className="mt-4 flex flex-col gap-2 md:flex-row">
                <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-300" size={17} /><input value={invoiceSearchTerm} onChange={event => setInvoiceSearchTerm(event.target.value)} placeholder="ابحث باسم العميل أو الهاتف أو رقم الأوردر أو الفني..." className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pr-10 pl-3 text-xs font-bold text-white outline-none focus:border-orange-400" /></div>
                <input type="date" value={invoiceDateFilter} onChange={event => setInvoiceDateFilter(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-white" aria-label="تصفية فواتير بتاريخ" />
                <button type="button" onClick={() => { setInvoiceSearchTerm(''); setInvoiceDateFilter(''); }} className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-black text-slate-300 hover:bg-slate-700">مسح الفلاتر</button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {invoiceReviewOrders.map(order => (
                <div key={order.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-orange-500/50">
                  <div className="flex items-start justify-between gap-3"><div><p className="font-black text-white">{order.customer_name}</p><p className="mt-1 text-[10px] font-bold text-slate-500">{order.order_number || `#${order.id}`} · {order.device_type} - {order.brand}</p></div><span className="rounded-full bg-amber-500/15 px-2 py-1 text-[9px] font-black text-amber-300">تحتاج اعتماد</span></div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-slate-950/60 p-2"><span className="text-slate-500">الفني</span><p className="mt-1 font-black text-orange-300">{order.technician || 'غير محدد'}</p></div><div className="rounded-xl bg-slate-950/60 p-2"><span className="text-slate-500">المبلغ</span><p className="mt-1 font-black text-emerald-300">{Number(order.total_amount || 0).toLocaleString()} ج.م</p></div></div>
                  <div className="mt-3 flex items-center justify-between gap-2"><span className="text-[10px] font-bold text-slate-500">تاريخ التسجيل: {new Date(order.created_at || order.date).toLocaleDateString('ar-EG')}</span>{canEditDelete() && <button onClick={() => printAndSendInvoice(order)} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-lg hover:bg-blue-500"><Printer size={15} className="ml-1 inline" /> اعتماد وطباعة</button>}</div>
                </div>
              ))}
            </div>
            {invoiceReviewOrders.length === 0 && <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 py-12 text-center"><Printer size={48} className="mx-auto mb-4 text-slate-700 opacity-20" /><p className="font-bold text-slate-400">لا توجد فواتير مطابقة أو بانتظار المراجعة</p></div>}
          </div>
        )}

        {activeTab === 'cash' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div className="bg-emerald-500/20 p-4 rounded-xl border border-emerald-500/20"><p className="text-slate-400">صافي نصيب الخزنة (المحل)</p><p className="text-3xl font-bold text-emerald-400">{cashBalance.toLocaleString()} ج.م</p><p className="text-[11px] text-slate-500 mt-1">الربع المخصص للخزنة بعد خصم المصروفات والتوزيعات</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-slate-400">عرض الخزنة:</span>
                <input type="date" value={cashFilterDate} onChange={e=>setCashFilterDate(e.target.value)} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"/>
                <button onClick={()=>setCashFilterDate(getEgyptTodayString())} className="bg-emerald-700/70 text-white px-3 py-2 rounded-lg text-sm">اليوم</button>
                <button onClick={()=>setCashFilterDate('')} className="bg-slate-700 text-white px-3 py-2 rounded-lg text-sm">كل السجل</button>
                {canManageCash && <button onClick={()=>{setEditingCash(null); setCashForm({type:'expense',amount:0,description:'',date:new Date().toISOString().split('T')[0]}); setShowCashModal(true);}} className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={16}/> حركة جديدة</button>}
              </div>
            </div>
            <div className="bg-purple-600/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 border border-purple-500/30">
              <div className="flex flex-col gap-1"><p className="text-sm font-semibold text-purple-300">📅 توزيع أرباح الشركاء</p><p className="text-xs text-slate-400">يتم توزيع صافي دخل اليوم على الشركاء حسب النسب، ويبقى ربع الخزنة للمحل وتُخصم المصروفات منه.</p></div>
              <div className="flex flex-wrap items-center gap-3"><input type="date" value={selectedProfitDate} onChange={e=>setSelectedProfitDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"/>{canManageCash && <button onClick={handleDistributeSelectedProfit} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><DollarSign size={16}/> توزيع أرباح التاريخ المحدد</button>}</div>
            </div>
            <div className="bg-blue-600/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 border border-blue-500/30">
              <div className="flex flex-col gap-1"><p className="text-sm font-semibold text-blue-300">📊 إرسال تقرير الخزنة للشركاء</p><p className="text-xs text-slate-400">اختر التاريخ ثم اضغط زر الإرسال ليظهر التقرير داخل البرنامج فقط</p></div>
              <div className="flex flex-wrap items-center gap-3"><input type="date" value={reportDate} onChange={e=>setReportDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"/>{canEditDelete() && <button onClick={handleSendReportForDate} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Send size={16}/> حفظ التقرير داخل البرنامج</button>}</div>
            </div>
            <div className="bg-slate-900 rounded-xl overflow-x-auto">
              <table className="w-full text-sm"><thead className="bg-slate-800"><tr><th className="p-3">التاريخ</th><th>النوع</th><th>المبلغ</th><th>الفني</th><th>الوصف</th><th>إجراءات</th></tr></thead>
              <tbody>{visibleCashLedger.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-800">
                  <td className="p-3 text-slate-300">{entry.date}</td>
                  <td className="text-slate-300">{entry.type==='income'?'💰 دخل':entry.type==='expense'?'💸 مصروف':'📤 توزيع أرباح'}</td>
                  <td className={entry.type==='income'?'text-green-400':'text-red-400'}>{entry.amount} ج.م</td>
                  <td className="whitespace-nowrap text-orange-300 font-black">{getCashEntryTechnician(entry) || '—'}</td>
                  <td className="max-w-xs break-words text-slate-300">{entry.description}</td>
                  <td>{canManageCash && <button onClick={()=>deleteCashEntry(entry.id)} className="text-red-400"><Trash2 size={16}/></button>}</td>
                </tr>
              ))}</tbody></table>
            </div>
          </div>
        )}

        {activeTab === 'partners' && userRole !== 'viewer' && (
          <div className="space-y-4">
            <div className="flex justify-end">{canManagePartners && <button onClick={()=>{setEditingPartner(null); setPartnerForm({name:'',share_percentage:0,phone:'',is_active:true}); setShowPartnerModal(true);}} className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><UserPlus size={16}/> إضافة شريك</button>}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partners.map(partner => (
                <div key={partner.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                  <div className="flex justify-between"><h3 className="font-bold text-white">{partner.name}</h3><span className={`text-xs px-2 py-1 rounded-full ${partner.is_active?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}`}>{partner.is_active?'نشط':'غير نشط'}</span></div>
                  <p className="text-2xl font-bold text-orange-500 mt-2">{partner.share_percentage}%</p>
                  <p className="text-sm text-slate-400">📞 {partner.phone||'لا يوجد'}</p>
                  {canManagePartners && <div className="flex gap-2 mt-3"><button onClick={()=>{setEditingPartner(partner); setPartnerForm(partner); setShowPartnerModal(true);}} className="text-blue-500"><Edit size={16}/></button><button onClick={()=>deletePartner(partner.id, partner.name)} className="text-red-500"><Trash2 size={16}/></button></div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-3 w-full max-w-full overflow-hidden">
            <div className="flex justify-between items-center bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
              <div><h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">🔔 مركز الإشعارات الذكي</h2><p className="mt-1 text-[10px] font-bold text-slate-500">الجديد يظهر أولًا، واضغط على الإشعار لفتح الحدث المرتبط</p></div>
              {userRole === 'admin' && notifications.length > 0 && (
                <button
                  onClick={deleteAllNotifications}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
                >
                  <Trash size={14}/> مسح الكل (فوري)
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className="rounded-2xl border border-orange-400/30 bg-orange-500/10 p-3"><div className="text-2xl font-black text-orange-300">{notifications.filter(n => !readNotificationIds.has(Number(n.id))).length}</div><div className="text-[10px] font-bold text-orange-200/70">غير مقروء</div></div>
              <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3"><div className="text-2xl font-black text-rose-300">{notifications.filter(n => `${n.action || ''} ${n.details || ''}`.includes('تحصيل') || `${n.action || ''} ${n.details || ''}`.includes('متأخر')).length}</div><div className="text-[10px] font-bold text-rose-200/70">عاجل</div></div>
              <div className="rounded-2xl border border-blue-400/30 bg-blue-500/10 p-3"><div className="text-2xl font-black text-blue-300">{notifications.filter(n => `${n.action || ''} ${n.details || ''}`.includes('أوردر') || `${n.action || ''} ${n.details || ''}`.includes('طلب')).length}</div><div className="text-[10px] font-bold text-blue-200/70">أوردرات</div></div>
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3"><div className="text-2xl font-black text-emerald-300">{notifications.length}</div><div className="text-[10px] font-bold text-emerald-200/70">كل السجل</div></div>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-3 md:flex-row md:items-center">
              <input value={notificationSearch} onChange={event => { setNotificationSearch(event.target.value); setVisibleNotificationsCount(20); }} placeholder="ابحث برقم الأوردر أو اسم الفني أو نوع الحدث..." className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-orange-500" />
              <div className="flex flex-wrap gap-1.5">{([['all','الكل'],['urgent','عاجل'],['orders','أوردرات'],['money','مالي'],['system','نظام']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => { setNotificationCategory(value); setVisibleNotificationsCount(20); }} className={`rounded-xl px-3 py-2 text-[10px] font-black transition ${notificationCategory === value ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{label}</button>)}</div>
            </div>
            <div className="space-y-2.5">
              {smartNotifications.slice(0, visibleNotificationsCount).map(notif=>{
                const isLogin = notif.action?.includes('دخول');
                const isOrder = notif.action?.includes('أوردر') || notif.action?.includes('طلب');
                const isMoney = notif.action?.includes('خزنة') || notif.action?.includes('أرباح');

                return (
                  <div key={notif.id} onClick={() => openNotificationTarget(notif)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openNotificationTarget(notif); }} className={`${readNotificationIds.has(Number(notif.id)) ? 'bg-slate-900/60 opacity-80' : 'bg-slate-900'} rounded-2xl p-4 flex justify-between items-center border-l-4 w-full cursor-pointer hover:bg-slate-800/90 active:scale-[0.99] transition-all ${
                    isLogin ? 'border-blue-500' : isOrder ? 'border-orange-500' : isMoney ? 'border-emerald-500' : 'border-slate-700'
                  }`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
                        isLogin ? 'bg-blue-500/10 text-blue-400' : isOrder ? 'bg-orange-500/10 text-orange-400' : isMoney ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isLogin ? <LogIn size={18} /> : isMoney ? <DollarSign size={18} /> : <Bell size={18} />}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isLogin ? 'bg-blue-500/20 text-blue-400' : isOrder ? 'bg-orange-500/20 text-orange-400' : isMoney ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {notif.action}
                          </span>
                          <span className="text-[9px] text-slate-500">{new Date(notif.created_at).toLocaleString('ar-EG')}</span>{!readNotificationIds.has(Number(notif.id)) && <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[9px] font-black text-orange-300">جديد</span>}
                        </div>
                        <p className="text-xs md:text-sm text-slate-300 mt-1 font-medium truncate">{notif.details}</p>
                      </div>
                    </div>
                    {userRole === 'admin' && (
                      <button onClick={(event)=>{ event.stopPropagation(); deleteNotification(notif.id); }} className="w-8 h-8 shrink-0 rounded-lg bg-slate-800 text-slate-500 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center ml-2" title="حذف الإشعار">
                        <Trash2 size={14}/>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {smartNotifications.length === 0 && <div className="text-center py-12 text-slate-500 text-sm">لا توجد إشعارات مطابقة</div>}
            {smartNotifications.length > visibleNotificationsCount && <button type="button" onClick={() => setVisibleNotificationsCount(count => count + 20)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 py-3 text-xs font-black text-orange-300 hover:bg-slate-800">عرض المزيد ({smartNotifications.length - visibleNotificationsCount})</button>}
          </div>
        )}


        {/* تبويب الإحصائيات الذكية */}
        {activeTab === 'feedback' && canEditDelete() && (
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-white">⭐ تقييمات العملاء</h2>
                <p className="text-sm text-slate-400 mt-2">تظهر هنا التقييمات التي يرسلها العملاء من رابط التقييم بعد إتمام الخدمة.</p>
              </div>
              <button
                onClick={() => { fetchNotifications(); showToast("🔄 جاري تحديث التقييمات...", "info"); }}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-orange-500 rounded-xl transition-all active:scale-95"
                title="تحديث البيانات"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
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
                    {feedbackItems.map((notification) => {
                      const details = notification.details || '';
                      const ratingMatch = details.match(/(\d+)\/5/);
                      const orderMatch = details.match(/الأوردر\s+([^:]+):/);
                      const commentMatch = details.match(/التعليق:\s*([\s\S]*)$/);
                      const ratingValue = ratingMatch?.[1] || '-';
                      const orderValue = orderMatch?.[1]?.trim() || '';
                      const commentValue = commentMatch?.[1]?.trim() || '';
                      return (
                        <div key={notification.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
                          <div className="flex flex-wrap justify-between gap-2 items-start">
                            <span className="text-yellow-400 font-black">{ratingValue} / 5 ⭐</span>
                            <span className="text-xs text-slate-500">{new Date(notification.created_at).toLocaleString('ar-EG')}</span>
                          </div>
                          {orderValue && <div className="text-xs text-orange-400 mt-2">رقم الأوردر: {orderValue}</div>}
                          <div className="mt-3 rounded-xl bg-slate-800/70 border border-slate-700/70 p-3">
                            <p className="text-[10px] text-slate-500 mb-1">تعليق العميل</p>
                            <p className="text-slate-200 leading-7 break-words">{commentValue || 'لم يكتب العميل تعليقاً نصياً.'}</p>
                          </div>
                        </div>
                      );
                    })}
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
                  <div className="max-h-[780px] overflow-y-auto space-y-4 pr-1">
                  {technicianExpenseStats.map((t) => (
	                      <button type="button" onClick={() => { clearFilters(); setFilterTechnician(t.name); setActiveTab('orders'); }} key={t.id || t.name} className={`w-full text-right flex flex-col gap-3 bg-slate-950/50 p-4 rounded-2xl border ${t.partsAlert || t.transportAlert || t.successAlert ? 'border-rose-500/50' : 'border-slate-800/50'} hover:border-blue-500/50 transition-all active:scale-[0.98] group`}>
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white">{t.name}</span>
                            {t.archived > 0 && <span className="text-[9px] text-rose-500 font-bold">⚠️ {t.archived} مهمل (أرشيف)</span>}
                          </div>
                          <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black">{t.completed} / {t.total} مكتمل</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${t.percentage}%` }}></div>
                          </div>
                          <span className="text-[10px] font-black text-slate-400">{t.percentage}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[9px] text-slate-500">
                          <span>إجمالي الفواتير: <b className="text-slate-300">{t.totalInvoice.toLocaleString()} ج.م</b></span>
                          <span>{t.total} أوردر</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className={`bg-slate-900/50 p-2 rounded-xl border ${t.partsAlert ? 'border-rose-500/60' : 'border-slate-800/30'} relative overflow-hidden`}>
                            <div className="absolute bottom-0 left-0 h-0.5 bg-rose-500/30" style={{ width: `${t.partsPercent}%` }}></div>
                            <div className="flex justify-between items-start">
                              <p className="text-[8px] font-bold text-slate-500 mb-0.5">⚙️ قطع غيار</p>
                              <span className={`text-[7px] font-black ${t.partsAlert ? 'text-rose-400' : 'text-rose-500/50'}`}>{t.partsPercent.toFixed(1)}%</span>
                            </div>
                            <p className="text-[10px] font-black text-rose-400">{t.totalParts.toLocaleString()} ج.م</p>
                          </div>
                          <div className={`bg-slate-900/50 p-2 rounded-xl border ${t.transportAlert ? 'border-amber-500/60' : 'border-slate-800/30'} relative overflow-hidden`}>
                            <div className="absolute bottom-0 left-0 h-0.5 bg-amber-500/30" style={{ width: `${t.transportPercent}%` }}></div>
                            <div className="flex justify-between items-start">
                              <p className="text-[8px] font-bold text-slate-500 mb-0.5">🚗 مواصلات</p>
                              <span className={`text-[7px] font-black ${t.transportAlert ? 'text-amber-300' : 'text-amber-500/50'}`}>{t.transportPercent.toFixed(1)}%</span>
                            </div>
                            <p className="text-[10px] font-black text-amber-400">{t.totalTransport.toLocaleString()} ج.م</p>
                          </div>
                        </div>
                        {(t.partsAlert || t.transportAlert || t.successAlert) && (
                          <div className="flex items-center justify-between gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 px-3 py-2">
                            <div className="flex items-center gap-2 text-[9px] text-rose-300 font-bold">
                              <AlertCircle size={14} />
                              <span>{[
                                t.partsAlert ? 'قطع الغيار أعلى من 40%' : '',
                                t.transportAlert ? 'المواصلات أعلى من 15%' : '',
                                t.successAlert ? `نسبة النجاح ${t.successRate}% (أقل من 70%)` : ''
                              ].filter(Boolean).join('، ')}</span>
                            </div>
                            {isAdmin && <button onClick={(e) => { e.stopPropagation(); sendExpenseWarning(t); }} className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white px-2 py-1.5 rounded-lg text-[9px] font-black flex items-center gap-1"><Send size={12} /> إرسال إنذار</button>}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {technicians.length === 0 && <p className="text-center text-slate-500 py-4">لا يوجد فنيون مسجلون</p>}
                </div>
              </div>

              {/* توزيع الأجهزة */}
              <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-2xl">
                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3"><Cpu className="text-orange-500" /> توزيع الأجهزة</h3>
                <div className="space-y-4">
                  {['غسالة', 'ثلاجة', 'بوتاجاز', 'سخان', 'تكييف', 'ميكروويف'].map(device => {
                    const allValidOrders = [...orders, ...archivedOrders];
                    const count = allValidOrders.filter(o => o.device_type === device).length;
                    const percentage = allValidOrders.length > 0 ? (count / allValidOrders.length) * 100 : 0;
                    if (count === 0) return null;
                    return (
	                      <button type="button" onClick={() => { clearFilters(); setFilterDeviceType(device); setActiveTab('orders'); }} key={device} className="w-full text-right space-y-2 group active:scale-[0.98] transition-all">
	                        <div className="flex justify-between text-xs font-bold group-hover:text-white transition-colors">
	                          <span className="text-slate-400 group-hover:text-slate-200">{device}</span>
	                          <span className="text-slate-200">{count} ({Math.round(percentage)}%)</span>
	                        </div>
	                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-white/5">
	                          <div className="bg-orange-500 h-full transition-all duration-1000 shadow-[0_0_8px_rgba(249,115,22,0.4)]" style={{ width: `${percentage}%` }}></div>
	                        </div>
	                      </button>
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
                    const count = [...orders, ...archivedOrders].filter(o => o.brand === brand).length;
                    if (count === 0) return null;
	                    return (
	                      <button type="button" onClick={() => { clearFilters(); setSearchTerm(brand); setActiveTab('orders'); }} key={brand} className="bg-slate-950/50 border border-slate-800 hover:border-yellow-500/50 px-4 py-3 rounded-2xl flex flex-col items-center min-w-[80px] flex-1 transition-all active:scale-95 group">
	                        <span className="text-[10px] text-slate-500 font-bold group-hover:text-yellow-500 transition-colors">{brand}</span>
	                        <span className="text-lg font-black text-white">{count}</span>
	                      </button>
	                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && userRole !== 'viewer' && (
          <TechnicianPerformanceAdmin 
            orders={[...orders, ...archivedOrders]} 
            technicians={technicians} 
            onFilter={(type, value) => {
              clearFilters();
              if (type === 'status') {
                if (value === 'completed') setShowCompletedOrders(true);
                setFilterStatus(value);
              } else if (type === 'technician') {
                setFilterTechnician(value);
              } else if (type === 'tech-status') {
                if (value.status === 'completed') setShowCompletedOrders(true);
                setFilterTechnician(value.tech);
                setFilterStatus(value.status);
              } else if (type === 'tech-delay') {
                setFilterTechnician(value);
                setFilterDelay('delayed');
              }
              setActiveTab('orders');
            }}
          />
        )}
        {activeTab === 'permissions' && userRole === 'admin' && (
          <AdminPermissions
            users={users}
            canEdit={userRole === 'admin'}
            onEdit={(u) => { setEditingUserAccount(u); setUserForm(u || { name: '', username: '', password: '', role: 'viewer', is_active: true }); setShowUserModal(true); }}
            onDelete={deleteUserAccount}
            onToggle={toggleUserAccountStatus}
            onSync={syncTechniciansToUsers}
          />
        )}
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="text-[10px] text-slate-500 opacity-20 mt-4">
            Maintenance Guide © 2026 - All Rights Reserved
          </div>
          <div className="text-[10px] text-orange-500/30 mt-1 font-mono">
            System Time: {new Date().toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo' })}
          </div>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-black tracking-wide text-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.12)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]" />
            إصدار النظام: v4.3.8
          </div>
        </div>
        <ScrollButtons />
      </div>

      {showManualPushModal && isAdmin && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-blue-500/30 bg-slate-900 p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">إرسال إشعار خارجي للفنيين</h3>
                <p className="mt-1 text-xs text-slate-400">سيصل إلى الأجهزة المشتركة حتى إذا كان البرنامج مغلقًا.</p>
              </div>
              <button type="button" onClick={() => setShowManualPushModal(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="إغلاق"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <label className="block text-right text-xs font-black text-slate-300">المستلم
                <select value={manualPushTarget} onChange={(e) => setManualPushTarget(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none focus:border-blue-500">
                  <option value="all">كل الفنيين المشتركين</option>
                  {technicians.filter((tech: any) => tech.is_active !== false).map((tech: any) => <option key={tech.id} value={String(tech.id)}>{tech.name || `فني ${tech.id}`}</option>)}
                </select>
              </label>
              <label className="block text-right text-xs font-black text-slate-300">عنوان الرسالة
                <input value={manualPushTitle} onChange={(e) => setManualPushTitle(e.target.value)} maxLength={120} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none focus:border-blue-500" />
              </label>
              <label className="block text-right text-xs font-black text-slate-300">نص الرسالة
                <textarea value={manualPushMessage} onChange={(e) => setManualPushMessage(e.target.value)} maxLength={1000} rows={4} placeholder="اكتب الرسالة التي تريد إرسالها..." className="mt-1 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none focus:border-blue-500" />
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowManualPushModal(false)} className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-black text-slate-300 hover:bg-slate-700">إلغاء</button>
                <button type="button" disabled={manualPushSending} onClick={() => { void handleManualPushSend(); }} className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/30 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">{manualPushSending ? 'جاري الإرسال...' : 'إرسال الإشعار'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && selectedOrderForReturn && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-rose-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-rose-900/20">
            <div className="flex items-center gap-3 mb-4 text-rose-400">
              <RotateCcw size={24} />
              <h3 className="text-xl font-black">إعادة الأوردر كمرتجع</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">سيتم إرجاع الأوردر للفني <strong className="text-white">{selectedOrderForReturn.technician}</strong> وتنبيهه بوجود مشكلة صيانة. يرجى كتابة التحذير أو سبب الإرجاع:</p>
            <textarea
              rows={4}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="مثلاً: الجهاز لا يبرد جيداً، العميل يشتكي من صوت عالي..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-rose-500 transition-all mb-4"
              required
            />
            <div className="flex gap-3">
              <button
                onClick={handleReturnOrder}
                disabled={isSubmitting || !returnReason.trim()}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال للفني ⚠️'}
              </button>
              <button
                onClick={() => { setShowReturnModal(false); setReturnReason(""); }}
                className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-700 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {showOrderModal && canEditDelete() && (
        <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div ref={orderModalScrollRef} id="order-edit-modal-scroll" className="bg-slate-900 rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[calc(100vh-1.5rem)] overflow-y-auto shadow-xl">
            <div className="flex justify-between mb-4 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10 pb-3 border-b border-slate-800"><h3 className="text-xl font-bold text-white">{editingOrder ? 'تعديل أوردر' : 'أوردر جديد'}</h3><button type="button" onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-white" aria-label="إغلاق نافذة الأوردر"><X size={20} /></button></div>
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-6 px-2">
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center gap-1.5 relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${formStep >= step ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                      {formStep > step ? <Check size={14} /> : step}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-tighter ${formStep >= step ? 'text-orange-400' : 'text-slate-600'}`}>
                      {step === 1 ? 'العميل' : step === 2 ? 'الجهاز' : 'التكليف'}
                    </span>
                  </div>
                  {step < 3 && <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${formStep > step ? 'bg-orange-600' : 'bg-slate-800'}`}></div>}
                </React.Fragment>
              ))}
            </div>

            <div className="space-y-5">
              <form id="order-main-form" onSubmit={(e) => { e.preventDefault(); if (formStep === 3) saveOrder(e); }} className="space-y-5">
                {/* Step 1: Customer Details */}
                {formStep === 1 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="bg-slate-800/40 p-4 rounded-2xl border border-white/5 space-y-4">
                      <div>
                        <label className="text-[11px] font-black text-slate-500 uppercase mb-1.5 block">رقم الهاتف</label>
                        <div className="relative">
                          <input type="tel" value={formData.phone || ''} onChange={e => handleFormChange('phone', e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-white font-bold focus:border-orange-500 outline-none transition-colors" placeholder="01xxxxxxxxx" required />
                          {customerLookupLoading && <div className="absolute left-3 top-3"><RefreshCw size={16} className="animate-spin text-orange-500" /></div>}
                        </div>
                        {previousCustomer && (
                          <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between gap-3 animate-in zoom-in-95">
                            <div className="min-w-0">
                              <p className="text-[10px] font-black text-emerald-300">✨ عميل سابق: {previousCustomer.customer_name}</p>
                              <p className="text-[9px] text-emerald-400/80 truncate">{previousCustomer.address}</p>
                            </div>
                            <button type="button" onClick={() => setFormData(c => ({ ...c, customer_name: previousCustomer.customer_name || c.customer_name, address: previousCustomer.address || c.address }))} className="shrink-0 bg-emerald-600 text-white px-2 py-1 rounded-lg text-[9px] font-black">استخدام</button>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-slate-500 uppercase mb-1.5 block">اسم العميل</label>
                        <input type="text" value={formData.customer_name || ''} onChange={e => handleFormChange('customer_name', e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-white font-bold focus:border-orange-500 outline-none transition-colors" placeholder="الاسم بالكامل" required />
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-slate-500 uppercase mb-1.5 block">العنوان</label>
                        <div className="relative">
                          <textarea rows={2} value={formData.address || ''} onChange={e => handleFormChange('address', e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-white font-bold focus:border-orange-500 outline-none transition-colors" placeholder="العنوان بالتفصيل" />
                          <MapPin size={16} className="absolute left-3 top-3 text-slate-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Device & Problem */}
                {formStep === 2 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="bg-slate-800/40 p-4 rounded-2xl border border-white/5 space-y-4">
                      <div>
                        <label className="text-[11px] font-black text-slate-500 uppercase mb-3 block">نوع الجهاز</label>
                        <div className="grid grid-cols-3 gap-2">
                          {DEVICE_TYPES.map(d => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => handleFormChange('device_type', d)}
                              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${formData.device_type === d ? 'bg-orange-600 border-orange-500 text-white shadow-lg' : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                            >
                              <span className="text-xl">{DEVICE_ICONS[d] || '⚙️'}</span>
                              <span className="text-[9px] font-black">{d}</span>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleFormChange('device_type', 'other')}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${isOtherDevice ? 'bg-orange-600 border-orange-500 text-white shadow-lg' : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                          >
                            <span className="text-xl">✨</span>
                            <span className="text-[9px] font-black">أخرى</span>
                          </button>
                        </div>
                        {isOtherDevice && <input type="text" placeholder="اكتب نوع الجهاز هنا..." value={customDevice} onChange={e => setCustomDevice(e.target.value)} className="w-full bg-slate-950/50 border border-orange-500/30 rounded-xl p-3 mt-3 text-white font-bold outline-none" required />}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-black text-slate-500 uppercase mb-1.5 block">الماركة</label>
                          <select value={formData.brand} onChange={e => handleFormChange('brand', e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-white font-bold outline-none focus:border-orange-500 transition-colors">
                            <option value="">اختر الماركة</option>
                            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                            <option value="other">أخرى</option>
                          </select>
                        </div>
                        {isOtherBrand && <div className="self-end"><input type="text" placeholder="ماركة مخصصة" value={customBrand} onChange={e => setCustomBrand(e.target.value)} className="w-full bg-slate-950/50 border border-orange-500/30 rounded-xl p-3 text-white font-bold outline-none" required /></div>}
                      </div>

                      <div>
                        <label className="text-[11px] font-black text-slate-500 uppercase mb-1.5 block">وصف المشكلة</label>
                        <textarea rows={3} value={formData.problem_description || ''} onChange={e => handleFormChange('problem_description', e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-white font-bold focus:border-orange-500 outline-none transition-colors" placeholder="ما هي مشكلة الجهاز؟" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Assignment & Financials */}
                {formStep === 3 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="bg-slate-800/40 p-4 rounded-2xl border border-white/5 space-y-4">
                      <div>
                        <label className="text-[11px] font-black text-slate-500 uppercase mb-1.5 block">الفني المسؤول</label>
                        <div className="relative">
                          <select value={formData.technician} onChange={e => handleFormChange('technician', e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-white font-bold outline-none focus:border-orange-500 transition-colors appearance-none">
                            <option value="">لم يتم التعيين بعد</option>
                            {technicians.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                          <Users size={16} className="absolute left-3 top-3.5 text-slate-600 pointer-events-none" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-black text-slate-500 uppercase mb-1.5 block">إجمالي المبلغ</label>
                          <div className="relative">
                            <input type="number" value={formData.total_amount || 0} onChange={e => handleFormChange('total_amount', parseFloat(e.target.value) || 0)} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-white font-bold outline-none focus:border-emerald-500 transition-colors" />
                            <span className="absolute left-3 top-3 text-[10px] font-black text-slate-600">ج.م</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-black text-slate-500 uppercase mb-1.5 block">الحالة</label>
                          <select value={formData.status} onChange={e => handleFormChange('status', e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-white font-bold outline-none focus:border-orange-500 transition-colors">
                            <option value="pending">معلق</option>
                            <option value="in-progress">قيد التنفيذ</option>
                            <option value="inspected">تم الكشف</option>
                            <option value="completed">مكتمل</option>
                            <option value="cancelled">ملغي</option>
                          </select>
                        </div>
                      </div>

                      {/* v3.9.2: Financial fields now universal for all orders */}
                      <div className="pt-4 border-t border-white/5 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-black text-slate-500 uppercase mb-1.5 block">ثمن قطع الغيار</label>
                            <div className="relative">
                              <input type="number" value={formData.parts_cost || 0} onChange={e => handleFormChange('parts_cost', parseFloat(e.target.value) || 0)} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-white font-bold outline-none focus:border-orange-500 transition-colors" />
                              <span className="absolute left-3 top-3 text-[10px] font-black text-slate-600">ج.م</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-black text-slate-500 uppercase mb-1.5 block">المواصلات</label>
                            <div className="relative">
                              <input type="number" value={formData.transport_cost || 0} onChange={e => handleFormChange('transport_cost', parseFloat(e.target.value) || 0)} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-white font-bold outline-none focus:border-orange-500 transition-colors" />
                              <span className="absolute left-3 top-3 text-[10px] font-black text-slate-600">ج.م</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-xs font-black text-slate-300 cursor-pointer"><input type="checkbox" checked={formData.is_paid} onChange={e => handleFormChange('is_paid', e.target.checked)} className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-600" /> تم التحصيل</label>
                          <label className="flex items-center gap-2 text-xs font-black text-slate-300 cursor-pointer"><input type="checkbox" checked={formData.invoice_approved} onChange={e => handleFormChange('invoice_approved', e.target.checked)} className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600" /> اعتماد الفاتورة</label>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-black text-slate-500 uppercase mb-1.5 block">فترة الضمان</label>
                            <select value={formData.warranty_period || '6 أشهر'} onChange={e => handleFormChange('warranty_period', e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-[11px] text-white font-bold outline-none">
                              <option value="بدون ضمان">بدون ضمان</option>
                              <option value="1 شهر">1 شهر</option>
                              <option value="3 أشهر">3 أشهر</option>
                              <option value="6 أشهر">6 أشهر</option>
                              <option value="1 سنة">1 سنة</option>
                              <option value="custom">مخصص...</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-black text-slate-500 uppercase mb-1.5 block">تاريخ الفاتورة</label>
                            <input type="date" value={formData.invoice_date || new Date().toISOString().split('T')[0]} onChange={e => handleFormChange('invoice_date', e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-[11px] text-white font-bold outline-none" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-black text-slate-500 uppercase mb-1.5 block">قطع الغيار المستخدمة (للفاتورة)</label>
                          <textarea rows={2} value={formData.parts_used || ''} onChange={e => handleFormChange('parts_used', e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-[11px] text-white font-bold outline-none" placeholder="مثلاً: طلمبة طرد، سير موتور..." />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form>

              {/* Navigation Buttons (v3.9.2: Moved outside form to prevent accidental submission) */}
              <div className="flex gap-3 pt-4 sticky bottom-0 bg-slate-900 py-3 border-t border-slate-800">
                {formStep > 1 && (
                  <button type="button" onClick={() => setFormStep(s => s - 1)} className="flex-1 h-12 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-95">
                    <ChevronRight size={18} /> السابق
                  </button>
                )}
                
                {formStep < 3 ? (
                  <button 
                    type="button" 
                    onClick={() => {
                      if (formStep === 1 && (!formData.customer_name || !formData.phone)) return showToast("يرجى إكمال بيانات العميل", "error");
                      setFormStep(s => s + 1);
                    }} 
                    className="flex-[2] h-12 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-orange-900/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    التالي <ChevronLeft size={18} />
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => {
                      const form = document.getElementById('order-main-form') as HTMLFormElement;
                      if (form) form.requestSubmit();
                    }}
                    disabled={isSubmitting} 
                    className="flex-[2] h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
                    {editingOrder ? 'حفظ التعديلات' : 'تأكيد وحفظ الأوردر'}
                  </button>
                )}
              </div>
            </div>
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
              if (!canManagePartners) return showToast("مدير العمليات لا يملك صلاحية تعديل الشركاء", "error");
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
                  <option value="tech">فني (يفتح برنامج الفنيين)</option>
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
