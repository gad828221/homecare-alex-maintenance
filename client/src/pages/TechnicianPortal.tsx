import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wrench, LogOut, Clock, CheckCircle2, AlertCircle,
  RefreshCw, Phone, MapPin, ClipboardList,
  Calendar, X, Trash2, Eye, ClockArrowUp, StickyNote,
  Play, FileCheck, DollarSign, CalendarX, Ban, MessageSquare, Search,
  Camera, TrendingUp, Award, Wallet, Send, ExternalLink, Bell
} from "lucide-react";
import { useLocation } from "wouter";
import { useNotification } from "../components/EnhancedNotificationSystem";
import TechnicianPerformance from "../components/TechnicianPerformance";
import { createClient } from '@supabase/supabase-js';
import { openWhatsAppDirectly } from '../utils/whatsapp';


const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';
const supabase = createClient(supabaseUrl, supabaseKey);

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

export default function TechnicianPortal() {
  const { addNotification } = useNotification();
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [techName, setTechName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isUrgentAlert, setIsUrgentAlert] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alertInterval = useRef<any>(null);
  const [stats, setStats] = useState({ active: 0, completed: 0, earnings: 0 });
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedOrderForActions, setSelectedOrderForActions] = useState<any>(null);
  const [actionType, setActionType] = useState<'cancel' | 'inspect' | 'defer' | 'note'>('note');
  const [actionValue, setActionValue] = useState("");
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'performance'>('orders');

  // ✅ إضافة متغيرات الفلتر
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [technicianPercentage, setTechnicianPercentage] = useState(50);
    const [oldPartsPhoto, setOldPartsPhoto] = useState("");
  const [newPartsPhoto, setNewPartsPhoto] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [settleForm, setSettleForm] = useState({
    total_amount: 0,
    parts_cost: 0,
    transport_cost: 0,
    net_amount: 0,
    technician_share: 0,
    company_share: 0,
    warranty_period: '6 أشهر',
    parts_used: ''
  });

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const currentUser = localStorage.getItem("currentUser");
    if (userRole === "tech" && currentUser) {
      const user = JSON.parse(currentUser);
      if (user.techName) setTechName(user.techName);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const nameFromUrl = params.get("name");
    if (nameFromUrl) {
      setTechName(decodeURIComponent(nameFromUrl));
    } else {
      window.location.href = "/login";
    }
  }, []);

  const isPhoneHidden = (order: any) => {
    return order.status === 'completed';
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0')) cleaned = '+20' + cleaned.substring(1);
    else if (cleaned.startsWith('1') && cleaned.length === 10) cleaned = '+20' + cleaned;
    else if (!cleaned.startsWith('+')) cleaned = '+20' + cleaned;
    return cleaned;
  };

  const notifyAdmin = async (action: string, order: any, details: string = "") => {
    try {
      await fetch(`${supabaseUrl}/rest/v1/notifications`, {
        method: 'POST',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action,
          details: `الفني: ${techName}\nالأوردر: ${order.order_number}\nالعميل: ${order.customer_name}\n${details}`,
          user_name: 'نظام',
          created_at: new Date().toISOString()
        })
      });
    } catch (err) { console.error(err); }
    const message = `🔔 *تنبيه إداري* 🔔\n━━━━━━━━━━━━━━━━━━━━━━\n👤 *الفني:* ${techName}\n🔢 *كود الأوردر:* ${order.order_number}\n👤 *العميل:* ${order.customer_name}\n📋 *الإجراء:* ${action}\n${details ? `📝 *التفاصيل:* ${details}\n` : ''}\n⏰ *الوقت:* ${new Date().toLocaleString("ar-EG")}\n\nيرجى المراجعة من لوحة التحكم.`;
    openWhatsAppDirectly('201558625259', message);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role === "tech" && user.techName) {
        setTechName(user.techName);
        
        // ✅ التحقق إذا كان الصوت قد تم تفعيله مسبقاً في هذه الجلسة
        if (sessionStorage.getItem('audio_forced_enabled') === 'true') {
          setAudioEnabled(true);
          // محاولة تنشيط السياق تلقائياً
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = ctx;
          if (ctx.state === 'suspended') ctx.resume();
        }

        // ✅ إضافة وسم OneSignal للفني لضمان وصول الإشعارات
        if (typeof window !== 'undefined') {
          const win = window as any;
          win.OneSignalDeferred = win.OneSignalDeferred || [];
          win.OneSignalDeferred.push(async (OneSignal: any) => {
            await OneSignal.User.addTag('role', 'tech');
            await OneSignal.User.addTag('tech_id', user.id?.toString());
            await OneSignal.User.addTag('tech_name', user.techName);
            console.log("✅ OneSignal Tags Set for Tech:", user.techName);
          });
        }
      }
    }
  }, []);

  useEffect(() => {
    const checkActiveStatus = async () => {
      if (!techName) return;
      try {
        const data = await fetchAPI(`technicians?select=is_active&name=eq.${encodeURIComponent(techName)}`);
        if (data && data[0]) setIsActive(data[0].is_active !== false);
      } catch (err) { console.error(err); }
    };
    checkActiveStatus();
  }, [techName]);

  const fetchTechnicianPercentage = useCallback(async () => {
    if (!techName) return;
    try {
      const data = await fetchAPI(`technicians?select=profit_percentage&name=eq.${encodeURIComponent(techName)}`);
      if (data && data[0] && typeof data[0].profit_percentage === 'number') setTechnicianPercentage(data[0].profit_percentage);
      else setTechnicianPercentage(50);
    } catch (err) { console.error(err); }
  }, [techName]);

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
      playDing(false); // تجربة صوت بسيطة للتأكيد
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

  const fetchData = useCallback(async () => {
    if (!techName || !isActive) return;
    try {
      // ✅ إضافة شرط deleted_at=is.null لاستبعاد الأوردرات المحذوفة
      const data = await fetchAPI(`orders?select=*&technician=eq.${encodeURIComponent(techName)}&deleted_at=is.null&order=created_at.desc`);
      setOrders(data);
      const active = data.filter((o: any) => o.status === 'pending' || o.status === 'in-progress').length;
      const completed = data.filter((o: any) => o.status === 'completed').length;
      const earnings = data.filter((o: any) => o.status === 'completed').reduce((acc: number, o: any) => acc + (o.technician_share || 0), 0);
      setStats({ active, completed, earnings });

      // إنذار المتأخرات للفني
      const delayedOrders = data.filter((o: any) => isDelayed(o));
      if (delayedOrders.length > 0) {
        console.log("🚨 Technician has delayed orders!", delayedOrders.length);
        startUrgentAlert();

        // إرسال إشعار خارجي للفني نفسه (مرة واحدة كل ساعة)
        const lastAlert = localStorage.getItem('last_delay_alert_tech');
        const now = new Date().getTime();
        if (!lastAlert || (now - parseInt(lastAlert)) > 3600000) {
          void sendExternalPush({
            event: 'system_alert',
            title: '⚠️ تنبيه أوردرات متأخرة',
            message: `⚠️ تنبيه: يوجد لديك ${delayedOrders.length} طلب صيانة متأخر لأكثر من 48 ساعة. يرجى اتخاذ إجراء فوراً.`,
            targetUserIds: [`tech:${currentUser?.id}`]
          });
          localStorage.setItem('last_delay_alert_tech', now.toString());
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [techName, isActive]);

  useEffect(() => {
    if (isActive) {
      fetchData();
      fetchTechnicianPercentage();
    }
    const interval = setInterval(() => { if (isActive) { fetchData(); fetchTechnicianPercentage(); } }, 30000);
    return () => clearInterval(interval);
  }, [fetchData, fetchTechnicianPercentage, isActive]);

  useEffect(() => {
    if (!techName) return;
    const subscription = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `technician=eq.${techName}`
        },
        (payload) => {
          console.log('تغيير في الأوردرات:', payload);
          fetchData();
          if (payload.eventType === 'INSERT') {
            addNotification({
              type: 'error',
              title: '📢 أوردر جديد',
              message: `تم إضافة أوردر جديد للعميل ${payload.new.customer_name}`,
              duration: 0
            });
          } else if (payload.eventType === 'UPDATE') {
            addNotification({
              type: 'warning',
              title: '🔄 تحديث أوردر',
              message: `تم تحديث بيانات الأوردر رقم ${payload.new.order_number}`,
              duration: 5000
            });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [techName, addNotification, fetchData]);

  useEffect(() => {
    if (!techName) return;
    
    // اشتراك حي لتنبيهات المدير المباشرة (Ping)
    const pingChannel = supabase
      .channel('tech-pings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `action=eq.tech_ping`
        },
        (payload) => {
          if (payload.new.details === techName) {
            console.log('🔔 استلام تنبيه مباشر من المدير!');
            startUrgentAlert();
          }
        }
      )
      .subscribe();
      
    return () => { supabase.removeChannel(pingChannel); };
  }, [techName]);

  const updateStatus = async (id: number, newStatus: string, extraData = {}) => {
    try {
      const oldOrder = orders.find(o => o.id === id);
      const updateData: any = { status: newStatus, ...extraData };
      if (newStatus === 'completed' && oldOrder?.status !== 'completed') updateData.completed_at = new Date().toISOString();
      await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(updateData) });
      addNotification({ type: 'success', title: '✅ تم التحديث', message: 'تم حفظ التغييرات وإرسال إشعار للمدير', duration: 3000 });
      fetchData();
      if (oldOrder && oldOrder.status !== newStatus) {
        let statusAr = newStatus;
        if (newStatus === 'completed') statusAr = "تم التنفيذ ✅";
        if (newStatus === 'cancelled') statusAr = "ملغي ❌";
        if (newStatus === 'inspected') statusAr = "تم الكشف 💰";
        if (newStatus === 'deferred') statusAr = "مؤجل ⏰";
        notifyAdmin(`تغيير حالة الأوردر إلى: ${statusAr}`, oldOrder);


      }
    } catch (err) { console.error(err); }
  };

  const handleInspection = (order: any, amount: number) => {
    const total = amount;
    const companyShare = Math.round(total * (100 - technicianPercentage) / 100);
    const techShare = total - companyShare;
    updateStatus(order.id, 'inspected', {
      total_amount: total, parts_cost: 0, transport_cost: 0, net_amount: total,
      company_share: companyShare, technician_share: techShare,
      technician_note: `كشف بقيمة ${total} ج.م`, action_date: new Date().toLocaleString("ar-EG"), invoice_approved: false
    });
    notifyAdmin("💰 كشف جديد", order, `المبلغ: ${total} ج.م`);
  };

  const handleCancel = (order: any, reason: string) => {
    updateStatus(order.id, 'cancelled', { technician_note: `إلغاء: ${reason}`, action_date: new Date().toISOString() });
    notifyAdmin("✖️ إلغاء الطلب", order, `السبب: ${reason}`);
  };

  const handleDefer = (order: any, reason: string) => {
    updateStatus(order.id, 'deferred', { technician_note: `تأجيل: ${reason}`, action_date: new Date().toISOString() });
    notifyAdmin("⏰ تأجيل الطلب", order, `السبب: ${reason}`);
  };

  const handleNote = async (order: any, note: string) => {
    const oldNote = order.technician_note || '';
    const newNote = oldNote ? `${oldNote}\n${note}` : note;
    try {
      await fetchAPI(`orders?id=eq.${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ technician_note: newNote })
      });
      await addNotification('📝 ملاحظة فنية', `أضاف الفني ملاحظة للأوردر رقم ${order.order_number}: ${note}`);

      // إشعار Push للمدير


      await fetchData();
      addNotification({ type: 'success', title: '✅ تم الإضافة', message: 'تم حفظ الملاحظة', duration: 3000 });
    } catch (err) { console.error(err); }
  };

  const handleSettleChange = (field: string, value: any) => {
    if (field === 'warranty_period' || field === 'parts_used') {
      setSettleForm(prev => ({ ...prev, [field]: value }));
      return;
    }
    const numValue = parseFloat(value) || 0;
    const updated = { ...settleForm, [field]: numValue };
    const net = updated.total_amount - updated.parts_cost - updated.transport_cost;
    const techShare = Math.round(net * (technicianPercentage / 100));
    const companyShare = net - techShare;
    setSettleForm({ ...updated, net_amount: net, technician_share: techShare, company_share: companyShare });
  };

  const openSettleModal = async (order: any) => {
    await fetchTechnicianPercentage();
    setSelectedOrder(order);
    setSettleForm({
      total_amount: order.total_amount || 0, parts_cost: order.parts_cost || 0, transport_cost: order.transport_cost || 0,
      net_amount: order.net_amount || 0, technician_share: order.technician_share || 0, company_share: order.company_share || 0,
      warranty_period: '6 أشهر',
      parts_used: ''
    });
    setShowSettleModal(true);
  };

    const submitSettlement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPartsPhoto || !newPartsPhoto) {
      addNotification({
        type: 'critical',
        title: '🚫 تنبيه هام جداً',
        message: 'يجب تصوير قطع الغيار القديمة والجديدة قبل إكمال الأوردر! لن يتم قبول التصفية بدون صور.',
        duration: 0
      });
      return;
    }

    const photoNotes = `
[OLD_PARTS:${oldPartsPhoto}]
[NEW_PARTS:${newPartsPhoto}]`;
    const finalNote = (selectedOrder.technician_note || '') + photoNotes;

    const settlementData = {
      ...settleForm,
      invoice_approved: true,
      invoice_date: new Date().toISOString().split('T')[0],
      technician_note: finalNote
    };

    await updateStatus(selectedOrder.id, 'completed', settlementData);

    setShowSettleModal(false);

    // إنذار قوي للمدير
    try {
      await fetch(`${supabaseUrl}/rest/v1/notifications`, {
        method: 'POST',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'new_order_alert', // نستخدم هذا الأكشن لإطلاق الإنذار الصوتي عند المدير
          details: `💰 تصفية أوردر وتسليم ضمان!\nالفني: ${techName}\nالعميل: ${selectedOrder.customer_name}\nالجهاز: ${selectedOrder.device_type}\nالمبلغ: ${settleForm.total_amount} ج.م`,
          user_name: techName,
          created_at: new Date().toISOString()
        })
      });
    } catch (e) { console.error(e); }

    const details = `المبلغ: ${settleForm.total_amount} ج.م | قطع غيار: ${settleForm.parts_cost} ج.م | مواصلات: ${settleForm.transport_cost} ج.م
🛡️ الضمان: ${settleForm.warranty_period}
🖼️ صورة القديم: ${oldPartsPhoto}
🖼️ صورة الجديد: ${newPartsPhoto}`;
    notifyAdmin("✅ تصفية وتسليم ضمان", selectedOrder, details);

    // إرسال رابط الضمان للعميل تلقائياً
    const invoiceLink = `${window.location.origin}/invoice?id=${selectedOrder.id}`;
    const customerMsg = `🛡️ *بطاقة الضمان الرقمية - Maintenance Guide* 🛡️\n\n` +
      `👤 *العميل:* ${selectedOrder.customer_name}\n` +
      `🔢 *رقم الأوردر:* ${selectedOrder.order_number}\n` +
      `🔧 *الجهاز:* ${selectedOrder.device_type}\n` +
      `💰 *المبلغ:* ${settleForm.total_amount} ج.م\n` +
      `🛡️ *فترة الضمان:* ${settleForm.warranty_period}\n\n` +
      `📎 *رابط الضمان والفاتورة الإلكترونية:* \n` +
      `${invoiceLink}\n\n` +
      `✨ *شكراً لثقتك بنا. نحن دائماً في خدمتك.* ✨`;
    
    const customerPhone = formatPhoneForWhatsApp(selectedOrder.phone);
    openWhatsAppDirectly(customerPhone, customerMsg);

    setOldPartsPhoto("");
    setNewPartsPhoto("");
    addNotification({ type: 'success', title: '✅ تم الإكمال', message: 'تم إكمال الأوردر بنجاح، بانتظار موافقة المدير على الفاتورة.', duration: 5000 });
  };


  const openActionModal = (order: any, type: 'cancel' | 'inspect' | 'defer' | 'note') => {
    setCurrentOrder(order);
    setActionType(type);
    setActionValue('');
    setShowActionModal(true);
  };

  const confirmAction = () => {
    if (!currentOrder) return;
    switch (actionType) {
      case 'cancel': if (actionValue.trim()) handleCancel(currentOrder, actionValue); break;
      case 'inspect': const amount = parseFloat(actionValue); if (!isNaN(amount) && amount > 0) handleInspection(currentOrder, amount); break;
      case 'defer': if (actionValue.trim()) handleDefer(currentOrder, actionValue); break;
      case 'note': if (actionValue.trim()) handleNote(currentOrder, actionValue); break;
    }
    setShowActionModal(false);
    setActionValue("");
    setCurrentOrder(null);
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
    // استخدام حقل date أو created_at
    return getDaysDifference(order.date || order.created_at, order.status) > 2;
  };

  const isNewOrder = (order: any) => {
    if (!order.created_at) return false;
    const created = new Date(order.created_at);
    const now = new Date();
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffHours < 2; // أوردر جديد خلال آخر ساعتين
  };

      const handlePhotoUpload = async (orderId: number, e: React.ChangeEvent<HTMLInputElement>, type: 'old' | 'new' | 'general' = 'general') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // فحص حجم الملف (أقصى حجم 5 ميجا)
    if (file.size > 5 * 1024 * 1024) {
      addNotification({ type: 'error', title: '❌ ملف كبير جداً', message: 'أقصى حجم للصورة هو 5 ميجابايت', duration: 5000 });
      return;
    }

    setIsUploadingPhoto(true);
    addNotification({ type: 'info', title: '📸 جاري الرفع', message: 'يتم الآن رفع الصورة...', duration: 2000 });

    try {
      const fileName = `${Date.now()}_${type}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const { data, error } = await supabase.storage.from('order-photos').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

      if (error) {
        console.error('Supabase Storage Error:', error);
        if (error.message.includes('bucket not found') || error.message.includes('does not exist')) {
          addNotification({
            type: 'critical',
            title: '❌ خطأ في الإعدادات',
            message: 'مجلد الصور (order-photos) غير موجود في Supabase. يرجى إنشاؤه أولاً من لوحة تحكم Supabase.',
            duration: 0
          });
        } else {
          addNotification({ type: 'error', title: '❌ فشل الرفع', message: `خطأ: ${error.message}`, duration: 5000 });
        }
        return;
      }

      let photoUrl = "";
      if (data) {
        const { data: publicUrlData } = supabase.storage.from('order-photos').getPublicUrl(fileName);
        photoUrl = publicUrlData.publicUrl;
      }

      if (type === 'old') setOldPartsPhoto(photoUrl);
      else if (type === 'new') setNewPartsPhoto(photoUrl);

      if (type === 'general') {
        const order = orders.find(o => o.id === orderId);
        const oldNote = order?.technician_note || '';
        const newNote = oldNote ? `${oldNote}
[صورة مرفقة]` : '[صورة مرفقة]';

        await fetchAPI(`orders?id=eq.${orderId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            technician_note: newNote,
            attachment_url: photoUrl
          })
        });
        fetchData();
      }

      addNotification({ type: 'success', title: '✅ تم الرفع', message: 'تم حفظ الصورة بنجاح', duration: 3000 });
    } catch (err) {
      console.error('Upload Catch Error:', err);
      addNotification({ type: 'error', title: '❌ حدث خطأ', message: 'فشل الاتصال بخادم الصور', duration: 3000 });
    } finally {
      setIsUploadingPhoto(false);
    }
  };



  // ✅ دالة الفلترة للأوردرات

  const searchFilteredOrders = orders.filter(order => {
    if (searchTerm && !order.customer_name?.includes(searchTerm) && !order.order_number?.includes(searchTerm) && !order.phone?.includes(searchTerm)) return false;
    return true;
  });

  const filteredOrders = searchFilteredOrders.filter(order => {
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    return true;
  });


  if (!isActive) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-6 rounded-2xl text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">حساب غير نشط</h2>
          <p>حسابك غير نشط حالياً. يرجى التواصل مع الإدارة لتفعيله.</p>
        </div>
      </div>
    );
  }

  if (loading && orders.length === 0) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
    </div>
  );

  return (
    <div className={`min-h-screen bg-slate-900 text-slate-200 transition-all duration-500 ${isUrgentAlert ? 'ring-inset ring-[12px] ring-red-600/50' : ''}`}>
      
      {/* ✅ قفل الشاشة الإجباري لتفعيل الصوت */}
      {!audioEnabled && (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-6 text-center backdrop-blur-xl">
          <div className="max-w-md w-full bg-slate-900 border border-orange-500/30 p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-900/40 animate-pulse">
              <Bell className="text-white w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-white mb-4">تفعيل نظام التنبيهات</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              لضمان استقبال أوردرات الصيانة الجديدة فوراً، يجب تفعيل التنبيهات الصوتية الإجبارية للعمل.
            </p>
            <button 
              onClick={initAudio}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-black py-5 rounded-2xl transition-all active:scale-95 shadow-xl shadow-orange-900/20 text-lg flex items-center justify-center gap-3"
            >
              <Play fill="currentColor" size={20} /> بدء العمل واستقبال الأوردرات
            </button>
            <p className="text-[10px] text-slate-600 mt-6 uppercase tracking-widest font-bold">Maintenance Guide OS v1.5.9</p>
          </div>
        </div>
      )}

      {isUrgentAlert && (
        <div className="fixed top-0 left-0 w-full z-[100] animate-bounce pt-4 flex justify-center pointer-events-none">
          <button 
            onClick={(e) => { e.stopPropagation(); stopUrgentAlert(); }} 
            className="pointer-events-auto bg-red-600 text-white px-8 py-4 rounded-full font-black shadow-2xl flex items-center gap-3 border-4 border-white animate-pulse text-xl"
          >
            <Bell className="animate-spin" /> تنبيه من المدير! اضغط للإيقاف
          </button>
        </div>
      )}
      <div className="bg-slate-800/80 border-b border-slate-700 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Wrench className="w-6 h-6 text-orange-400" />
            <div>
              <h1 className="text-lg font-bold text-white">بوابة الفنيين</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-xs text-orange-400">{techName}</p>
              </div>
            </div>
          </div>
          <button onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.href = "/login"; }} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><LogOut className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-700 px-4 pt-4 max-w-4xl mx-auto">
        <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition ${activeTab === 'orders' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>📋 الأوردرات</button>
        <button onClick={() => setActiveTab('performance')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition ${activeTab === 'performance' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>📊 أداء الفني</button>
      </div>

      <main className="max-w-4xl mx-auto p-4 space-y-5">
        {!audioEnabled && (
          <div className="bg-orange-600/20 border border-orange-500/50 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                <Bell className="text-white w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">تنبيهات الصوت معطلة</p>
                <p className="text-[10px] text-slate-400">اضغط على الزر لتفعيل صوت الإنذار للأوردرات الجديدة</p>
              </div>
            </div>
            <button 
              onClick={initAudio}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-xl text-xs font-black transition-all shadow-lg shadow-orange-900/20 active:scale-95"
            >
              تفعيل التنبيهات الصوتية 🔊
            </button>
          </div>
        )}

        {activeTab === 'orders' && (
          <>
            {/* لوحة إنجازات الفني الاحترافية */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 border border-slate-700 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Award className="text-orange-500" /> لوحة إنجازاتي
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-1">أداءك اليومي ومستحقاتك المالية</p>
                </div>
                <div className="bg-orange-500/10 p-2 rounded-xl">
                  <TrendingUp className="text-orange-500 w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 text-center">
                  <div className="text-2xl font-black text-blue-400">{stats.active}</div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">أوردرات نشطة</div>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 text-center">
                  <div className="text-2xl font-black text-green-400">{stats.completed}</div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">تم إنجازه</div>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 text-center">
                  <div className="text-lg font-black text-emerald-400">{stats.earnings.toLocaleString()}</div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">أرباحي (ج.م)</div>
                </div>
              </div>

              {stats.active > 0 && (
                <div className="mt-4 bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 flex items-center gap-2 animate-pulse">
                  <AlertCircle size={14} className="text-orange-500" />
                  <span className="text-[10px] text-orange-200 font-bold">لديك {stats.active} أوردرات تحتاج لإنهاء اليوم!</span>
                </div>
              )}
            </div>

            {/* ✅ شريط الفلتر */}
            <div className="bg-slate-800 rounded-xl p-3 flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="بحث بالعميل أو الرقم أو الهاتف"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pr-9 p-2 text-sm text-white"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm text-white"
              >
                <option value="all">كل الحالات</option>
                <option value="pending">قيد الانتظار</option>
                <option value="in-progress">جاري العمل</option>
                <option value="inspected">تم الكشف</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
                <option value="deferred">مؤجل</option>
              </select>
              <button
                onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded-lg text-sm transition"
              >
                مسح الفلتر
              </button>
            </div>

            {/* نظام التبويبات الذكي للفني */}
            <div className="flex flex-nowrap gap-3 overflow-x-auto no-scrollbar pb-3 mb-4 sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md py-2 -mx-4 px-4">
              {[
                { id: 'all', label: 'الكل', color: 'slate' },
                { id: 'pending', label: 'جديد', color: 'amber' },
                { id: 'in-progress', label: 'جاري', color: 'blue' },
                { id: 'inspected', label: 'كشف', color: 'cyan' },
                { id: 'completed', label: 'تم', color: 'emerald' }
              ].map(tab => {
                const count = tab.id === 'all' ? searchFilteredOrders.length : searchFilteredOrders.filter(o => o.status === tab.id).length;
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
            <div className="space-y-3">
              <h2 className="text-md font-semibold text-white flex items-center gap-2"><ClipboardList className="w-4 h-4 text-orange-400" /> أوردراتي</h2>
              {filteredOrders.map(order => {
                const isNew = isNewOrder(order);
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

                return (
                    <div key={order.id} className={`group bg-${cardColor}-950/10 rounded-[1.5rem] border-2 border-${cardColor}-500/30 p-5 transition-all hover:border-${cardColor}-500 hover:shadow-2xl hover:shadow-${cardColor}-500/20 relative overflow-hidden ${config.pulse} ${isNewOrder(order) ? "ring-4 ring-blue-500/50" : ""}`}>
                      {/* Status Background */}
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-orange-500/10 transition-all`}></div>

                      {/* Header */}
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-white group-hover:text-orange-400 transition-colors">{order.customer_name}</h3>
                            {isNewOrder(order) && <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping"></span>}
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">#{order.order_number}</span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black border border-${cardColor}-500/30 bg-${cardColor}-500/10 text-${cardColor}-400`}>{config.label}</div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
                        <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50">
                          <p className="text-[9px] font-bold text-slate-500 mb-1">الجهاز والماركة</p>
                          <p className="text-xs font-black text-slate-200">{order.device_type} - {order.brand}</p>
                        </div>
                        <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50">
                          <p className="text-[9px] font-bold text-slate-500 mb-1">تاريخ الأوردر</p>
                          <p className="text-xs font-black text-slate-200">{new Date(order.created_at || order.date).toLocaleDateString('ar-EG')}</p>
                        </div>
                      </div>

                      {/* Location and Notes */}
                      <div className="space-y-2.5 mb-6 relative z-10">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500"><MapPin size={12} /></div>
                          <span className="line-clamp-1 flex-1">{order.address || 'لا يوجد عنوان مسجل'}</span>
                          {order.address && (
                            <button
                              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address + ' Alexandria Egypt')}`, '_blank')}
                              className="p-1.5 bg-blue-600/10 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                              title="فتح في الخرائط"
                            >
                              <MapPin size={14} />
                            </button>
                          )}
                        </div>
                        {order.problem_description && (
                          <div className="flex items-start gap-2 text-[11px] text-slate-400">
                            <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0"><StickyNote size={12} /></div>
                            <span className="line-clamp-2">{order.problem_description}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="space-y-3 relative z-10 pt-4 border-t border-slate-800/50">
                        <div className="flex gap-2">
                          {isPhoneHidden(order) ? (
                            <div className="flex-1 h-10 bg-slate-800/50 text-slate-500 rounded-xl flex items-center justify-center gap-2 border border-slate-700/30">
                              <Ban size={14} /> <span className="text-[10px] font-black italic tracking-tighter">الرقم مخفي بعد الإتمام</span>
                            </div>
                          ) : (
                            <a href={`tel:${order.phone}`} className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95">
                              <Phone size={14} /> <span className="text-[10px] font-black">اتصال بالعميل</span>
                            </a>
                          )}
                          <button onClick={() => { setSelectedOrderForActions(order); setShowActionsModal(true); }} className="h-10 w-10 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all active:scale-95">
                            <Eye size={16} />
                          </button>
                        </div>

                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <button onClick={() => updateStatus(order.id, 'in-progress')} className="w-full h-10 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-black transition-all active:scale-95">
                              🚀 بدء العمل
                            </button>
                          )}
                          {order.status === 'in-progress' && (
                            <button onClick={() => openSettleModal(order)} className="w-full h-10 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-black transition-all active:scale-95">
                              💰 تصفية الأوردر
                            </button>
                          )}
                          {(order.status === 'inspected' || order.status === 'deferred') && (
                            <button onClick={() => openSettleModal(order)} className="w-full h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-[10px] font-black transition-all active:scale-95">
                              📝 تحديث التصفية
                            </button>
                          )}
                        </div>

                        <div className="flex gap-2">
                           <button onClick={() => openActionModal(order, 'inspect')} className="flex-1 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 rounded-lg text-[9px] font-bold transition-all">🔍 كشف</button>
                           <button onClick={() => openActionModal(order, 'defer')} className="flex-1 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 rounded-lg text-[9px] font-bold transition-all">⏰ تأجيل</button>
                           <button onClick={() => openActionModal(order, 'cancel')} className="flex-1 py-2 bg-slate-800/50 hover:bg-slate-800 text-rose-500/50 hover:text-rose-500 rounded-lg text-[9px] font-bold transition-all">❌ إلغاء</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {filteredOrders.length === 0 && <div className="text-center py-8 text-slate-400">لا توجد أوردرات</div>}
            </div>
          </>
        )}

        {activeTab === 'performance' && (
          <TechnicianPerformance technicians={[{ name: techName }]} orders={orders} />
        )}
      </main>

      {showActionsModal && selectedOrderForActions && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between mb-4"><h3 className="text-xl font-bold text-white">إجراءات الأوردر</h3><button onClick={() => setShowActionsModal(false)} className="text-slate-400"><X className="w-5 h-5" /></button></div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setShowActionsModal(false); openActionModal(selectedOrderForActions, 'inspect'); }} className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 p-3 rounded-xl flex flex-col items-center gap-1 transition"><DollarSign className="w-6 h-6" /><span className="text-xs">كشف بقيمة</span></button>
              <button onClick={() => { setShowActionsModal(false); openActionModal(selectedOrderForActions, 'cancel'); }} className="bg-red-600/20 hover:bg-red-600/30 text-red-400 p-3 rounded-xl flex flex-col items-center gap-1 transition"><Ban className="w-6 h-6" /><span className="text-xs">إلغاء</span></button>
              <button onClick={() => { setShowActionsModal(false); openActionModal(selectedOrderForActions, 'defer'); }} className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 p-3 rounded-xl flex flex-col items-center gap-1 transition"><CalendarX className="w-6 h-6" /><span className="text-xs">تأجيل</span></button>
              <button onClick={() => { setShowActionsModal(false); openActionModal(selectedOrderForActions, 'note'); }} className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 p-3 rounded-xl flex flex-col items-center gap-1 transition"><MessageSquare className="w-6 h-6" /><span className="text-xs">ملاحظة</span></button>
            </div>
          </div>
        </div>
      )}

      {showActionModal && currentOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between mb-4"><h3 className="text-xl font-bold text-white">
              {actionType === 'cancel' && 'إلغاء الأوردر'}
              {actionType === 'inspect' && 'كشف بقيمة'}
              {actionType === 'defer' && 'تأجيل الأوردر'}
              {actionType === 'note' && 'إضافة ملاحظة'}
            </h3><button onClick={() => setShowActionModal(false)} className="text-slate-400"><X className="w-5 h-5" /></button></div>
            <div className="space-y-4">
              {actionType === 'inspect' ? (
                <input type="number" placeholder="المبلغ (ج.م)" value={actionValue} onChange={e => setActionValue(e.target.value)} className="w-full p-2 bg-slate-700 rounded-lg text-white" autoFocus />
              ) : (
                <textarea placeholder={actionType === 'cancel' ? 'سبب الإلغاء' : actionType === 'defer' ? 'سبب التأجيل' : 'نص الملاحظة'} rows={3} value={actionValue} onChange={e => setActionValue(e.target.value)} className="w-full p-2 bg-slate-700 rounded-lg text-white" autoFocus />
              )}
              <button onClick={confirmAction} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-bold">تأكيد</button>
            </div>
          </div>
        </div>
      )}

            {showSettleModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-3xl p-6 w-full max-w-md border border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white">💰 تصفية الأوردر</h3>
              <button onClick={() => setShowSettleModal(false)} className="p-2 bg-slate-700 rounded-full text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            
            <form onSubmit={submitSettlement} className="space-y-5">
              {/* Photos Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-rose-400 block text-center">📸 القطع القديمة</label>
                  <div className="relative h-28 bg-slate-900 rounded-2xl border-2 border-dashed border-rose-500/20 flex items-center justify-center overflow-hidden hover:border-rose-500/50 transition-all">
                    {oldPartsPhoto ? (
                      <img src={oldPartsPhoto} alt="Old" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="text-rose-500/30 w-8 h-8" />
                    )}
                    <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotoUpload(selectedOrder.id, e, 'old')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-emerald-400 block text-center">📸 القطع الجديدة</label>
                  <div className="relative h-28 bg-slate-900 rounded-2xl border-2 border-dashed border-emerald-500/20 flex items-center justify-center overflow-hidden hover:border-emerald-500/50 transition-all">
                    {newPartsPhoto ? (
                      <img src={newPartsPhoto} alt="New" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="text-emerald-500/30 w-8 h-8" />
                    )}
                    <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotoUpload(selectedOrder.id, e, 'new')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>
              </div>

              {/* Financial Inputs */}
              <div className="space-y-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1.5 block">إجمالي الفاتورة (المبلغ المحصل)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      required 
                      value={settleForm.total_amount || ''} 
                      onChange={e => handleSettleChange('total_amount', e.target.value)} 
                      className="w-full bg-slate-800 rounded-xl px-4 py-3 text-white border-2 border-orange-500/30 focus:border-orange-500 outline-none transition-all font-black text-lg" 
                      placeholder="0" 
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">ج.م</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 mb-1 block">قطع غيار</label>
                    <input type="number" value={settleForm.parts_cost || ''} onChange={e => handleSettleChange('parts_cost', e.target.value)} className="w-full bg-slate-800 rounded-xl px-3 py-2 text-white border border-slate-700 outline-none" placeholder="0" />
                  </div>
	                  <div>
	                    <label className="text-[11px] font-bold text-slate-500 mb-1 block">مواصلات</label>
	                    <input type="number" value={settleForm.transport_cost || ''} onChange={e => handleSettleChange('transport_cost', e.target.value)} className="w-full bg-slate-800 rounded-xl px-3 py-2 text-white border border-slate-700 outline-none" placeholder="0" />
	                  </div>
	                </div>

                  <div className="pt-2 border-t border-slate-700/30">
                    <label className="text-xs font-bold text-orange-400 mb-1.5 block">🛡️ تفاصيل الضمان والفاتورة</label>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">فترة الضمان</label>
                        <select 
                          value={settleForm.warranty_period} 
                          onChange={e => handleSettleChange('warranty_period', e.target.value)}
                          className="w-full bg-slate-800 rounded-xl px-3 py-2 text-white border border-slate-700 outline-none text-sm"
                        >
                          <option value="بدون ضمان">بدون ضمان</option>
                          <option value="3 أشهر">3 أشهر</option>
                          <option value="6 أشهر">6 أشهر</option>
                          <option value="1 سنة">1 سنة</option>
                          <option value="2 سنة">2 سنة</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">قطع الغيار (تظهر في الفاتورة)</label>
                        <textarea 
                          value={settleForm.parts_used} 
                          onChange={e => handleSettleChange('parts_used', e.target.value)}
                          className="w-full bg-slate-800 rounded-xl px-3 py-2 text-white border border-slate-700 outline-none text-sm"
                          placeholder="مثلاً: طلمبة طرد، سير موتور..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
	              </div>

              {/* Summary */}
              <div className="bg-slate-950/50 p-4 rounded-2xl space-y-3 border border-slate-800">
                <div className="flex justify-between items-center"><span className="text-xs text-slate-500">الصافي للشركة والفني:</span><span className="text-sm font-black text-white">{settleForm.net_amount} ج.م</span></div>
                <div className="flex justify-between items-center"><span className="text-xs text-slate-500">نصيب الفني ({technicianPercentage}%):</span><span className="text-sm font-black text-emerald-400">{settleForm.technician_share} ج.م</span></div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800"><span className="text-xs text-slate-400 font-bold">المستحق للشركة:</span><span className="text-lg font-black text-orange-500">{settleForm.company_share} ج.م</span></div>
              </div>

              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-orange-900/20 transition-all active:scale-95">
                تأكيد وإكمال الأوردر ✅
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
