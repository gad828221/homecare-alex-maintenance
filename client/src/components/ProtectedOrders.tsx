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

// ========== دالة الإشعارات النهائية (عبر Netlify Function) ==========
const sendPushToExternalId = async (externalId: string | string[], title: string, message: string) => {
  try {
    const ids = Array.isArray(externalId) ? externalId : [externalId];
    const response = await fetch('/.netlify/functions/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        message,
        external_ids: ids
      })
    });
    const result = await response.json();
    console.log(`✅ نتيجة الإرسال:`, result);
    return result.success;
  } catch (err) {
    console.error('Push Error:', err);
    return false;
  }
};

const notifyAllAdmins = async (title: string, message: string) => {
  try {
    await fetch('/.netlify/functions/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message, tags: true })
    });
  } catch (err) { console.error(err); }
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const ordersData = await fetchAPI('orders?select=*&order=date.desc,created_at.desc');
      const techData = await fetchAPI('technicians?select=*&order=name.asc');
      setOrders(ordersData || []);
      setTechnicians(techData || []);
      
      const deletedData = await fetchAPI('orders?select=*&deleted_at=not.is.null&order=deleted_at.desc');
      setDeletedOrders(deletedData || []);
      
      const s = { pending: 0, inProgress: 0, completed: 0, cancelled: 0, totalIncome: 0 };
      (ordersData || []).forEach((o: any) => {
        if (o.deleted_at) return;
        if (o.status === 'pending') s.pending++;
        else if (o.status === 'in-progress' || o.status === 'inspected') s.inProgress++;
        else if (o.status === 'completed') { s.completed++; s.totalIncome += (o.company_share || 0); }
        else if (o.status === 'cancelled') s.cancelled++;
      });
      setStats(s);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); fetchNotifications(); fetchPartners(); fetchCashLedger(); }, [fetchData, fetchNotifications, fetchPartners, fetchCashLedger]);

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

  const updateOrderStatus = async (id: number, newStatus: string, extraData = {}) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    try {
      await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus, ...extraData }) });
      await addNotification('تغيير حالة أوردر', `🔄 تم تغيير حالة أوردر ${order.customer_name} إلى ${newStatus}`);
      fetchData();
      
      // ✅ إشعار خارجي قوي
      const statusAr = newStatus === 'completed' ? 'تم التنفيذ' : newStatus === 'in-progress' ? 'قيد العمل' : newStatus;
      await notifyAllAdmins(`🔄 تحديث حالة`, `أوردر ${order.customer_name} أصبح الآن: ${statusAr}`);
      
      if (order.technician) {
        const tech = technicians.find(t => t.name === order.technician);
        if (tech) await sendPushToExternalId(tech.id.toString(), `🔧 تحديث أوردر`, `تم تغيير حالة أوردر العميل ${order.customer_name} إلى ${statusAr}`);
      }
    } catch (err) { console.error(err); }
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
        await fetchAPI(`orders?id=eq.${editingOrder.id}`, { method: 'PATCH', body: JSON.stringify(orderToSave) });
        await addNotification('تعديل أوردر', `تم تعديل أوردر ${formData.customer_name}`);
        alert("✅ تم تعديل الأوردر بنجاح");
      } else {
        await fetchAPI('orders', { method: 'POST', body: JSON.stringify(orderToSave) });
        await addNotification('إضافة أوردر', `تم إضافة أوردر جديد للعميل ${formData.customer_name}`);
        alert("✅ تم إضافة الأوردر بنجاح");
        
        // ✅ إشعار خارجي فوري للمديرين
        await notifyAllAdmins('📋 أوردر جديد', `تم إضافة أوردر جديد للعميل ${formData.customer_name} - ${finalDevice}`);
        
        if (orderToSave.technician) {
          const tech = technicians.find(t => t.name === orderToSave.technician);
          if (tech) await sendPushToExternalId(tech.id.toString(), '🔧 أوردر جديد', `تم تعيين أوردر جديد لك: ${formData.customer_name}`);
        }
      }
      setShowOrderModal(false); setEditingOrder(null);
      fetchData();
    } catch (err) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

  // ... (باقي الكود المختصر للحفاظ على الحجم)
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* واجهة المدير والأوردرات */}
      <div className="p-4">
         <h1 className="text-2xl font-bold mb-4">لوحة تحكم الأوردرات</h1>
         {/* باقي محتوى الصفحة */}
      </div>
    </div>
  );
}
