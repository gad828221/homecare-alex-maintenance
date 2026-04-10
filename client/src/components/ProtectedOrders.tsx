import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Plus, Download, Search, LayoutDashboard, Users, 
  Clock, CheckCircle2, AlertCircle, XCircle, 
  Edit, Trash2, RefreshCw, Phone,
  TrendingUp, Wallet, PieChart, Calendar, Copy, Check, MapPin, Filter, MoreVertical
} from "lucide-react";
import { useNotification } from "./NotificationSystem";

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

const fetchAPI = async (endpoint: string, options?: RequestInit) => {
  const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    headers: { 
      'apikey': supabaseKey, 
      'Authorization': `Bearer ${supabaseKey}`, 
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export default function ProtectedOrders() {
  const { addNotification } = useNotification();
  const [orders, setOrders] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'technicians' | 'reports' | 'invoices'>('orders');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingTech, setEditingTech] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    customer_name: '', phone: '', device: '', address: '', brand: '', problem: '', technician: '',
    status: 'pending', total_amount: 0, expenses: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false
  });

  const [customDevice, setCustomDevice] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [isOtherDevice, setIsOtherDevice] = useState(false);
  const [isOtherBrand, setIsOtherBrand] = useState(false);
  
  const [techForm, setTechForm] = useState({ name: '', phone: '', specialization: '', is_active: true });
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, cancelled: 0, totalIncome: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // --- إعدادات الصوت والإشعارات ---
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // طلب إذن الإشعارات من المتصفح
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setBrowserNotificationsEnabled(permission === 'granted');
      if (permission === 'granted') {
        addNotification({ type: 'success', title: '🔔 تم التفعيل', message: 'ستصلك الإشعارات حتى لو كان المتصفح مصغراً', duration: 4000 });
      }
    }
  };

  // إرسال إشعار متصفح (يعمل حتى لو التطبيق في الخلفية)
  const sendBrowserNotification = (title: string, body: string) => {
    if (browserNotificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico', silent: false });
    }
  };

  // تشغيل الصوت
  const playSound = () => {
    if (audioEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("الصوت يحتاج تفاعل:", e));
    }
  };

  // إشعار موحد (منبثق + صوت + متصفح)
  const showUnifiedNotification = (type: 'success' | 'error' | 'info', title: string, message: string, duration: number = 4000) => {
    playSound();
    sendBrowserNotification(title, message);
    addNotification({ type, title, message, duration });
  };

  // تهيئة الصوت وطلب الإذن
  useEffect(() => {
    audioRef.current = new Audio("https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3");
    audioRef.current.load();
    requestNotificationPermission();
  }, []);

  const formatPhoneForWhatsApp = (phone: string) => {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0')) cleaned = '+20' + cleaned.substring(1);
    else if (cleaned.startsWith('1') && cleaned.length === 10) cleaned = '+20' + cleaned;
    else if (!cleaned.startsWith('+')) cleaned = '+20' + cleaned;
    return cleaned;
  };

  const fetchData = useCallback(async () => {
    try {
      const [ordersData, techsData] = await Promise.all([
        fetchAPI('orders?select=*&order=created_at.desc'),
        fetchAPI('technicians?select=*')
      ]);
      
      // التحقق من الإشعارات الجديدة (للموبايل)
      const newCount = ordersData.length;
      if (newCount > lastNotificationCount && lastNotificationCount !== 0) {
        showUnifiedNotification('info', '📦 تحديث الأوردرات', `تم إضافة ${newCount - lastNotificationCount} أوردر جديد`, 5000);
      }
      setLastNotificationCount(newCount);
      
      setOrders(ordersData);
      setTechnicians(techsData);
      
      const pending = ordersData.filter((o: any) => o.status === 'pending').length;
      const inProgress = ordersData.filter((o: any) => o.status === 'in-progress').length;
      const completed = ordersData.filter((o: any) => o.status === 'completed').length;
      const cancelled = ordersData.filter((o: any) => o.status === 'cancelled').length;
      const totalIncome = ordersData.reduce((acc: number, o: any) => acc + (o.company_share || 0), 0);
      
      setStats({ pending, inProgress, completed, cancelled, totalIncome });
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  }, [lastNotificationCount]);

  useEffect(() => {
    fetchData();
    showUnifiedNotification('info', '👋 أهلاً بك يا مدير', 'نظام الإشعارات والتنبيهات الصوتية نشط الآن', 5000);
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const calculateAmounts = (data: any) => {
    const total = parseFloat(data.total_amount) || 0;
    const expenses = parseFloat(data.expenses) || 0;
    const net = total - expenses;
    const companyShare = Math.round(net * 0.4); 
    const techShare = net - companyShare;
    return { ...data, net_amount: net, company_share: companyShare, technician_share: techShare };
  };

  const handleFormChange = (field: string, value: any) => {
    if (field === 'device') {
        if (value === 'other') {
            setIsOtherDevice(true);
            setFormData({ ...formData, device: '' });
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

  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
        ...formData,
        device: isOtherDevice ? customDevice : formData.device,
        brand: isOtherBrand ? customBrand : formData.brand
    };

    try {
      if (editingOrder) {
        await fetchAPI(`orders?id=eq.${editingOrder.id}`, { method: 'PATCH', body: JSON.stringify(finalData) });
        showUnifiedNotification('success', '✏️ تم التعديل', `تم تعديل أوردر ${formData.customer_name}`, 4000);
      } else {
        await fetchAPI('orders', { 
          method: 'POST', 
          body: JSON.stringify({ ...finalData, date: new Date().toLocaleString("ar-EG") }) 
        });
        showUnifiedNotification('success', '🎉 أوردر جديد', `تم إضافة أوردر لـ ${formData.customer_name}`, 4000);
      }
      setShowOrderModal(false);
      setEditingOrder(null);
      resetForm();
      fetchData();
    } catch (err) { 
      console.error(err);
      showUnifiedNotification('error', '❌ خطأ', 'حدث خطأ أثناء الحفظ', 4000);
    }
  };

  const resetForm = () => {
    setFormData({
        customer_name: '', phone: '', device: '', address: '', brand: '', problem: '', technician: '',
        status: 'pending', total_amount: 0, expenses: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false
    });
    setCustomDevice('');
    setCustomBrand('');
    setIsOtherDevice(false);
    setIsOtherBrand(false);
  };

  const deleteOrder = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الأوردر؟')) {
      try {
        await fetchAPI(`orders?id=eq.${id}`, { method: 'DELETE' });
        showUnifiedNotification('success', '✅ تم الحذف', 'تم حذف الأوردر بنجاح', 4000);
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  const togglePaidStatus = async (id: number, currentStatus: boolean) => {
    try {
      await fetchAPI(`orders?id=eq.${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify({ is_paid: !currentStatus }) 
      });
      showUnifiedNotification('success', '💰 تحديث الدفع', 'تم تحديث حالة التحصيل', 3000);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const saveTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTech) {
        await fetchAPI(`technicians?id=eq.${editingTech.id}`, { method: 'PATCH', body: JSON.stringify(techForm) });
        showUnifiedNotification('success', '✏️ تم التعديل', `تم تعديل بيانات ${techForm.name}`, 4000);
      } else {
        await fetchAPI('technicians', { method: 'POST', body: JSON.stringify(techForm) });
        showUnifiedNotification('success', '👨‍🔧 فني جديد', `تم إضافة ${techForm.name}`, 4000);
      }
      setShowTechModal(false);
      setEditingTech(null);
      setTechForm({ name: '', phone: '', specialization: '', is_active: true });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const deleteTechnician = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الفني؟')) {
      try {
        await fetchAPI(`technicians?id=eq.${id}`, { method: 'DELETE' });
        showUnifiedNotification('success', '✅ تم الحذف', 'تم حذف الفني بنجاح', 4000);
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  const copyTechLink = (name: string, id: number) => {
    const link = `${window.location.origin}/tech-portal?name=${encodeURIComponent(name)}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    showUnifiedNotification('success', '📋 تم النسخ', 'رابط الفني جاهز للإرسال', 2000);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.phone?.includes(searchTerm) ||
      o.technician?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading && orders.length === 0) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <RefreshCw className="w-12 h-12 text-orange-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 font-sans" dir="rtl">
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/20">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">لوحة التحكم</h1>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">Maintenance Guide</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* زر تفعيل الصوت */}
            <button 
              onClick={() => {
                setAudioEnabled(!audioEnabled);
                if (!audioEnabled && audioRef.current) {
                  audioRef.current.play().then(() => {
                    audioRef.current?.pause();
                    audioRef.current!.currentTime = 0;
                  }).catch(e => console.log(e));
                }
              }}
              className={`p-2 rounded-lg transition-all ${audioEnabled ? 'text-green-500 bg-green-500/20' : 'text-slate-400 bg-slate-800'}`}
              title={audioEnabled ? "إيقاف الصوت" : "تفعيل الصوت"}
            >
              {audioEnabled ? "🔊" : "🔇"}
            </button>
            {/* زر طلب إذن الإشعارات */}
            <button 
              onClick={requestNotificationPermission}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all"
              title="تفعيل إشعارات المتصفح"
            >
              🔔
            </button>
            <button onClick={fetchData} className="p-2 text-slate-400 hover:text-white transition-all">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* الحاوية الرئيسية - أبعاد مضبوطة للموبايل */}
      <main className="max-w-5xl mx-auto p-2 sm:p-3 md:p-4">

        {/* بطاقات الإحصائيات - متجاوبة مع الموبايل */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 mb-5">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-sm text-center">
            <p className="text-xl sm:text-2xl font-black text-white">{orders.length}</p>
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase">إجمالي الأوردرات</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-sm text-center">
            <p className="text-xl sm:text-2xl font-black text-yellow-500">{stats.pending}</p>
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase">قيد الانتظار</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-sm text-center">
            <p className="text-xl sm:text-2xl font-black text-green-500">{stats.completed}</p>
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase">مكتمل</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-sm text-center">
            <p className="text-xl sm:text-2xl font-black text-orange-500">{stats.totalIncome.toLocaleString()}</p>
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase">أرباح الشركة</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-sm text-center">
            <p className="text-xl sm:text-2xl font-black text-purple-500">{technicians.length}</p>
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase">فني متاح</p>
          </div>
        </div>

        {/* التبويبات - قابلة للتمرير على الموبايل */}
        <div className="flex gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 mb-4 md:mb-6 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('orders')} className={`px-3 sm:px-5 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap ${activeTab === 'orders' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`}>الأوردرات</button>
          <button onClick={() => setActiveTab('technicians')} className={`px-3 sm:px-5 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap ${activeTab === 'technicians' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`}>الفنيين</button>
          <button onClick={() => setActiveTab('invoices')} className={`px-3 sm:px-5 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap ${activeTab === 'invoices' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`}>الفواتير</button>
          <button onClick={() => setActiveTab('reports')} className={`px-3 sm:px-5 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap ${activeTab === 'reports' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`}>التقارير</button>
        </div>

        {/* باقي المحتوى (الأوردرات، الفنيين، الفواتير، التقارير) - كما هو في الكود السابق */}
        {/* ... لضيق المساحة، لم أكرر باقي المحتوى، لكنه موجود في الرد السابق */}
        {/* يمكنك إضافة باقي التبويبات من الكود السابق هنا */}

      </main>

      {/* مودالات الإضافة والتعديل - كما هي */}
    </div>
  );
}
