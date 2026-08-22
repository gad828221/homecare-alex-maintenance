import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Wrench, LogOut, Clock, CheckCircle2, AlertCircle, RotateCcw,
  RefreshCw, Phone, MapPin, ClipboardList,
  Calendar, X, Trash2, Eye, EyeOff, ClockArrowUp, StickyNote,
  Play, FileCheck, DollarSign, CalendarX, Ban, MessageSquare, Search, MessageCircle,
  Camera,   TrendingUp, Award, Wallet, Send, ExternalLink, Bell, Upload, Cpu, UserCircle, ImagePlus, Navigation, ChevronDown
} from "lucide-react";
import { useLocation } from "wouter";
import { useNotification } from "../components/EnhancedNotificationSystem";
import TechnicianPerformance from "../components/TechnicianPerformance";
import NotificationStatus from "../components/NotificationStatus";

import { clearAuthSession } from "../utils/authSession";
import { createClient } from '@supabase/supabase-js';
import { openWhatsAppDirectly } from '../utils/whatsapp';
import { sendExternalPush } from '../utils/pushNotifications';
import { useScreenWakeLock } from '../hooks/useScreenWakeLock';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { formatElapsed, formatOrderDay, formatOrderDateTime, getElapsedTone, getOrderCreatedValue, parseOrderDate } from '../utils/orderTiming';
import { createPickupMarker, getPickupTypeLabel } from '../utils/pickupReceipt';
import { mergeCompanyTransferMarker } from '../utils/companyTransfer';
import { getTechnicianDisplayName, getTechnicianPhotoUrl, parseTechnicianProfileNotification, profileNotificationPayload } from '../utils/technicianProfile';



const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';
const supabase = createClient(supabaseUrl, supabaseKey);
const normalizeCustomerPhone = (phone: any) => {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.startsWith('20') ? `0${digits.slice(2)}` : digits;
};

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
  const { enabled: wakeLockEnabled, isLocked: wakeLockActive, supported: wakeLockSupported, toggle: toggleWakeLock } = useScreenWakeLock();
  const { isInstalled, installCompleted, canInstall, isIos, isFirefox, install } = usePwaInstall();
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<any[]>([]);
  const [clockNow, setClockNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const previousCustomerPhones = useMemo(() => {
    const counts = new Map<string, number>();
    orders.forEach((order) => {
      const phone = normalizeCustomerPhone(order.phone);
      if (phone.length >= 10) counts.set(phone, (counts.get(phone) || 0) + 1);
    });
    return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([phone]) => phone));
  }, [orders]);
  const [loading, setLoading] = useState(true);
  const [techName, setTechName] = useState("");
  const [techProfilePhoto, setTechProfilePhoto] = useState('');
  const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isUrgentAlert, setIsUrgentAlert] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alertInterval = useRef<any>(null);
  const alertBaselineReadyRef = useRef(false);
  const delayedAlertIdsRef = useRef<Set<number>>(new Set());
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    cancelled: 0,
    inspected: 0,
    earnings: 0,
    totalOrders: 0,
    successRate: 0,
    totalInvoice: 0,
    partsPercent: 0,
    transportPercent: 0
  });
  const [adminWarnings, setAdminWarnings] = useState<any[]>([]);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedOrderForActions, setSelectedOrderForActions] = useState<any>(null);
  const [actionType, setActionType] = useState<'cancel' | 'inspect' | 'defer' | 'note' | 'pickup'>('note');
  const [actionValue, setActionValue] = useState("");
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'performance'>('orders');

  // ✅ إضافة متغيرات الفلتر
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCompletedOrders, setShowCompletedOrders] = useState(false);
  const [visibleCompletedCount, setVisibleCompletedCount] = useState(10);

  const [technicianPercentage, setTechnicianPercentage] = useState(50);
    const [oldPartsPhoto, setOldPartsPhoto] = useState("");
  const [newPartsPhoto, setNewPartsPhoto] = useState("");
  const [oldPartsPreview, setOldPartsPreview] = useState("");
  const [newPartsPreview, setNewPartsPreview] = useState("");
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
  const [companyTransferConfirmed, setCompanyTransferConfirmed] = useState(false);

  const [pickupForm, setPickupForm] = useState({
    type: 'full_device',
    part_name: '',
    deposit: 0,
    notes: '',
    photos: [] as string[]
  });
  const [isUploadingPickupPhoto, setIsUploadingPickupPhoto] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const currentUser = localStorage.getItem("currentUser");
    if (userRole === "tech" && currentUser) {
      const user = JSON.parse(currentUser);
      if (user.techName || user.name) setTechName(user.techName || user.name);
      setTechProfilePhoto(getTechnicianPhotoUrl(user));
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const nameFromUrl = params.get("name");
    if (nameFromUrl) {
      setTechName(decodeURIComponent(nameFromUrl));
    }
    // App.tsx handles the missing session redirect.
  }, []);

  const isPhoneHidden = (order: any) => {
    return order.status === 'completed';
  };

  const extractPartsPhoto = (note: string | undefined, type: 'OLD' | 'NEW') => {
    if (!note) return '';
    const match = note.match(new RegExp(`\\[${type}_PARTS:(.*?)\\]`));
    return match?.[1] || '';
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
    // تم إيقاف واتساب الإداري؛ تسجيل الحدث داخل notifications هو قناة الإدارة المعتمدة.
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role === "tech" && user.techName) {
        setTechName(user.techName);
        
        // إرسال إشارة نجاح (Heartbeat) لتأكيد جاهزية الإشعارات للمدير
        const sendHeartbeat = async () => {
          try {
            await fetch(`${supabaseUrl}/rest/v1/notifications`, {
              method: 'POST',
              headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: "🔔 جاهز للاستلام",
                details: `الفني ${user.techName} متصل الآن وجاهز لاستقبال التنبيهات.`,
                user_name: user.techName,
                created_at: new Date().toISOString()
              })
            });
          } catch (e) { console.error('Heartbeat error:', e); }
        };
        sendHeartbeat();
        
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
        const data = await fetchAPI(`technicians?select=*&name=eq.${encodeURIComponent(techName)}`);
        if (data && data[0]) {
          setIsActive(data[0].is_active !== false);
          setTechProfilePhoto((currentPhoto) => currentPhoto || getTechnicianPhotoUrl(data[0]));
        }
        const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const profileRows = await fetchAPI('notifications?select=action,details,created_at&action=eq.technician_profile_updated&order=created_at.desc&limit=100');
        const matchingProfile = (Array.isArray(profileRows) ? profileRows : []).map(parseTechnicianProfileNotification).filter(Boolean).find((profile: any) => {
          return [profile.id, profile.code, profile.username, profile.name].filter(Boolean).some((value) => String(value).trim().toLowerCase() === String(storedUser.id || storedUser.username || techName).trim().toLowerCase());
        });
        if (matchingProfile?.photoUrl) setTechProfilePhoto((currentPhoto) => currentPhoto || matchingProfile.photoUrl);
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
      setAudioEnabled(true);
    }
  };

  const playDing = (isUrgent = false) => {
    try {
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtor) return;
      
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtor();
      }
      const ctx = audioContextRef.current;
      
      if (ctx.state === 'suspended') {
        void ctx.resume().catch(() => undefined);
      }

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
    playDing(true);
    alertInterval.current = window.setInterval(() => playDing(true), 1500);
  };

  const stopUrgentAlert = () => {
    if (alertInterval.current) {
      clearInterval(alertInterval.current);
      alertInterval.current = null;
    }
    navigator.vibrate?.(0);
    setIsUrgentAlert(false);
  };

  const fetchAdminWarnings = useCallback(async () => {
    if (!techName) return;
    try {
      const data = await fetchAPI('notifications?select=id,action,details,created_at&action=neq.employee_chat&order=created_at.desc&limit=100');
      const warningActions = new Set(['إنذار مصروفات فني', 'إنذار أداء فني', 'تنبيه إغلاق أوردرات قديمة']);
      const technicianMarker = `الفني: ${techName}`;
      setAdminWarnings((data || []).filter((notification: any) => {
        const details = String(notification.details || '');
        return warningActions.has(notification.action) && details.includes(technicianMarker);
      }));
    } catch (err) {
      console.error('Failed to load technician warnings:', err);
    }
  }, [techName]);

  const fetchData = useCallback(async () => {
    if (!techName || !isActive) return;
    try {
      // ✅ إضافة شرط deleted_at=is.null لاستبعاد الأوردرات المحذوفة
      const data = await fetchAPI(`orders?select=*&technician=eq.${encodeURIComponent(techName)}&deleted_at=is.null&order=created_at.desc`);
      const visibleOrders = (Array.isArray(data) ? data : []).filter((o: any) => {
        const status = String(o.status || '').trim().toLowerCase();
        return !['cancelled', 'canceled', 'inspected'].includes(status) || status === 'returned';
      });
      // نحتفظ بالسجل الكامل للأداء والنتائج، بينما تُفلتر قائمة العمل أسفل الصفحة فقط.
      setOrders(Array.isArray(data) ? data : []);
      const active = visibleOrders.filter((o: any) => ['pending', 'in-progress', 'deferred'].includes(String(o.status || '').toLowerCase())).length;
      const completed = data.filter((o: any) => String(o.status || '').toLowerCase() === 'completed').length;
      const cancelled = data.filter((o: any) => ['cancelled', 'canceled'].includes(String(o.status || '').toLowerCase())).length;
      const inspected = data.filter((o: any) => String(o.status || '').toLowerCase() === 'inspected').length;
      const earnings = data.filter((o: any) => String(o.status || '').toLowerCase() === 'completed').reduce((acc: number, o: any) => acc + (Number(o.technician_share) || 0), 0);
      const invoicedOrders = visibleOrders.filter((o: any) => Number(o.total_amount) > 0);
      const totalInvoice = invoicedOrders.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0);
      const totalParts = invoicedOrders.reduce((sum: number, o: any) => sum + (Number(o.parts_cost) || 0), 0);
      const totalTransport = invoicedOrders.reduce((sum: number, o: any) => sum + (Number(o.transport_cost) || 0), 0);
      const successRate = data.length > 0 ? Math.round((completed / data.length) * 100) : 0;
      setStats({
        active,
        completed,
        cancelled,
        inspected,
        earnings,
        totalOrders: data.length,
        successRate,
        totalInvoice,
        partsPercent: totalInvoice > 0 ? (totalParts / totalInvoice) * 100 : 0,
        transportPercent: totalInvoice > 0 ? (totalTransport / totalInvoice) * 100 : 0
      });
      void fetchAdminWarnings();

      // إنذار المتأخرات للفني: لا نعيد تنبيه الحالات القديمة عند فتح البوابة
      const delayedOrders = data.filter((o: any) => isDelayed(o));
      const delayedIds = new Set<number>(delayedOrders.map((order: any) => Number(order.id)));
      const newDelayedOrders = delayedOrders.filter((order: any) => !delayedAlertIdsRef.current.has(Number(order.id)));
      const canEmitLiveAlerts = alertBaselineReadyRef.current;
      delayedAlertIdsRef.current = delayedIds;
      if (canEmitLiveAlerts && newDelayedOrders.length > 0) {
        console.log("🚨 Technician has new delayed orders!", newDelayedOrders.length);
        startUrgentAlert();

        // إرسال إشعار خارجي للفني نفسه (مرة واحدة كل ساعة)
        const lastAlert = localStorage.getItem('last_delay_alert_tech');
        const currentUserRaw = localStorage.getItem('currentUser');
        let currentUser: any = null;
        try { currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null; } catch { currentUser = null; }
        const now = new Date().getTime();
        if (!lastAlert || (now - parseInt(lastAlert)) > 3600000) {
          void sendExternalPush({
            event: 'system_alert',
            title: '⚠️ تنبيه أوردر دخل مرحلة التأخير',
            message: `⚠️ يوجد لديك ${newDelayedOrders.length} طلب صيانة دخل مرحلة التأخير الآن. يرجى اتخاذ إجراء فوراً.`,
            targetUserIds: [`tech:${currentUser?.id}`]
          });
          localStorage.setItem('last_delay_alert_tech', now.toString());
        }
      }
      alertBaselineReadyRef.current = true;
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [techName, isActive, fetchAdminWarnings]);

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

    // تحديث إنذارات المدير فور تسجيلها في لوحة التحكم
    const warningChannel = supabase
      .channel('technician-warning-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const notification = payload.new as any;
        const details = String(notification?.details || '');
        const isForThisTechnician = details.includes(`الفني: ${techName}`);
        const isWarning = notification?.action === 'إنذار مصروفات فني' || notification?.action === 'إنذار أداء فني';
        if (isWarning && isForThisTechnician) {
          void fetchAdminWarnings();
          startUrgentAlert();
          addNotification({
            type: 'warning',
            title: notification?.action === 'تنبيه إغلاق أوردرات قديمة' ? '🚨 الإدارة تطلب إغلاق الأوردرات القديمة' : '⚠️ إنذار من الإدارة',
            message: notification?.action === 'تنبيه إغلاق أوردرات قديمة' ? 'راجع الأوردرات القديمة المفتوحة واتخذ إجراءً على كل أوردر فوراً.' : 'لديك إنذار يحتاج إلى مراجعة المصاريف أو نسبة الإنجاز.',
            duration: 0
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(warningChannel); };
  }, [techName, fetchAdminWarnings, addNotification]);

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

  const getCurrentLocation = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  const updateStatus = async (id: number, newStatus: string, extraData = {}, options: { notifyManagers?: boolean } = {}) => {
    try {
      const oldOrder = orders.find(o => o.id === id);
      
      // التقاط الموقع الجغرافي عند بدء العمل أو التصفية
      let gpsMarker = "";
      if (newStatus === 'in-progress' || newStatus === 'completed') {
        const loc = await getCurrentLocation();
        if (loc) {
          gpsMarker = `\n[📍 موقع الفني GPS: https://www.google.com/maps?q=${loc.lat},${loc.lng}]`;
        }
      }

      const updateData: any = { status: newStatus, ...extraData };
      if (gpsMarker) {
        updateData.technician_note = `${oldOrder?.technician_note || ''}${gpsMarker}`;
      }
      if (newStatus === 'completed' && oldOrder?.status !== 'completed') updateData.completed_at = new Date().toISOString();
      await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(updateData) });
      addNotification({ type: 'success', title: '✅ تم التحديث', message: 'تم حفظ التغييرات وإرسال إشعار للمدير', duration: 3000 });
      fetchData();
      if (options.notifyManagers !== false && oldOrder && oldOrder.status !== newStatus) {
        let statusAr = newStatus;
        if (newStatus === 'completed') statusAr = "تم التنفيذ ✅";
        if (newStatus === 'cancelled') statusAr = "ملغي ❌";
        if (newStatus === 'inspected') statusAr = "تم الكشف 💰";
        if (newStatus === 'deferred') statusAr = "مؤجل ⏰";
        if (newStatus === 'in-progress') statusAr = "بدء العمل 🚀";
        
        const actionTitle = `تغيير حالة الأوردر إلى: ${statusAr}`;
        notifyAdmin(actionTitle, oldOrder);
        
        // إرسال Push للمديرين ومدير العمليات
        void sendExternalPush({
          event: 'system_alert',
          title: `🛠️ تحديث أوردر: ${statusAr}`,
          message: `الفني ${techName} قام بتغيير حالة الأوردر #${oldOrder.order_number} للعميل ${oldOrder.customer_name} إلى ${statusAr}.`,
          targetRoles: ['admin', 'manager'],
          data: { order_id: id, order_number: oldOrder.order_number, customer_name: oldOrder.customer_name, status: newStatus, technician: techName }
        });
      }
    } catch (err) { console.error(err); }
  };

  const notifyCustomerContact = async (order: any, method: 'phone' | 'whatsapp') => {
    const methodAr = method === 'phone' ? 'اتصال هاتفي' : 'واتساب';
    const actionTitle = `📞 محاولة تواصل مع العميل (${methodAr})`;
    notifyAdmin(actionTitle, order);
    
    void sendExternalPush({
      event: 'system_alert',
      title: actionTitle,
      message: `الفني ${techName} يقوم الآن بالاتصال بالعميل ${order.customer_name} عبر ${methodAr} للأوردر #${order.order_number}.`,
      targetRoles: ['admin', 'manager'],
          data: { order_id: order.id, order_number: order.order_number, customer_name: order.customer_name, method, action: 'customer_contact', technician: techName }
    });
  };

  const handleInspection = (order: any, amount: number) => {
    const total = amount;
    const companyShare = Math.round(total * (100 - technicianPercentage) / 100);
    const techShare = total - companyShare;
    const statusChanged = order.status !== 'inspected';
    void updateStatus(order.id, 'inspected', {
      total_amount: total, parts_cost: 0, transport_cost: 0, net_amount: total,
      company_share: companyShare, technician_share: techShare,
      technician_note: `كشف بقيمة ${total} ج.م`, action_date: new Date().toLocaleString("ar-EG"), invoice_approved: false
    });
    notifyAdmin("💰 كشف جديد", order, `المبلغ: ${total} ج.م`);
    if (!statusChanged) {
      void sendExternalPush({
        event: 'system_alert',
        title: '💰 تحديث كشف الأوردر',
        message: `الفني ${techName} حدّث كشف الأوردر #${order.order_number} للعميل ${order.customer_name} بمبلغ ${total} ج.م.`,
        targetRoles: ['admin', 'manager'],
        data: { order_id: order.id, order_number: order.order_number, customer_name: order.customer_name, action: 'inspection_update', technician: techName }
      });
    }
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
      void notifyAdmin('📝 ملاحظة فنية جديدة', order, `النص: ${note}`);
      void sendExternalPush({
        event: 'system_alert',
        title: '📝 ملاحظة فنية جديدة',
        message: `الفني ${techName} أضاف ملاحظة للأوردر #${order.order_number} للعميل ${order.customer_name}: ${note}`,
        targetRoles: ['admin', 'manager'],
        data: { order_id: order.id, order_number: order.order_number, customer_name: order.customer_name, action: 'technician_note', technician: techName }
      });
      await fetchData();
      addNotification({ type: 'success', title: '✅ تم الإضافة', message: 'تم حفظ الملاحظة', duration: 3000 });
    } catch (err) { console.error(err); }
  };

  const handlePickup = async (order: any) => {
    const typeAr = getPickupTypeLabel(pickupForm.type);
    const partName = pickupForm.part_name.trim();
    if (pickupForm.type !== 'full_device' && !partName) {
      addNotification({ type: 'error', title: '⚠️ اسم القطعة مطلوب', message: 'اكتب اسم أو وصف قطعة الغيار المسحوبة أولاً.', duration: 4000 });
      return;
    }
    if (pickupForm.photos.length === 0) {
      addNotification({ type: 'error', title: '📸 الصور مطلوبة', message: 'أرفق صورة واحدة على الأقل لحالة الجهاز أو القطعة قبل السحب.', duration: 5000 });
      return;
    }

    const pickupDate = new Date().toISOString();
    const pickupRecord = {
      type: pickupForm.type,
      partName,
      deposit: Number(pickupForm.deposit) || 0,
      notes: pickupForm.notes.trim(),
      photos: pickupForm.photos,
      pickupDate,
      status: 'active' as const
    };
    const previousNotes = order.technician_notes || order.technician_note || '';
    const marker = createPickupMarker(pickupRecord);
    const mergedNotes = previousNotes.replace(/\n?\[PICKUP_RECEIPT\][\s\S]*?\[\/PICKUP_RECEIPT\]/g, '').trim();
    const finalNotes = `${mergedNotes}${mergedNotes ? '\\n' : ''}${marker}`;

    try {
      // حفظ أساسي يعتمد على الحقول الموجودة بالفعل في النظام.
      await fetchAPI(`orders?id=eq.${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ technician_notes: finalNotes, status: 'in-progress' })
      });

      // حفظ الحقول الجديدة عند توفرها، مع بقاء العلامة النصية كخطة توافق احتياطية.
      try {
        await fetchAPI(`orders?id=eq.${order.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            pickup_type: pickupForm.type,
            pickup_part_name: partName,
            pickup_notes: pickupForm.notes.trim(),
            pickup_photos: pickupForm.photos,
            pickup_date: pickupDate,
            pickup_status: 'active',
            deposit_amount: Number(pickupForm.deposit) || 0
          })
        });
      } catch (optionalError) {
        console.warn('Optional pickup columns are not available; marker data was saved in technician_notes.', optionalError);
      }

      const details = `نوع السحب: ${typeAr}${partName ? `\\nالقطعة: ${partName}` : ''}\\nالعربون: ${Number(pickupForm.deposit) || 0} ج.م\\nعدد الصور: ${pickupForm.photos.length}\\nرابط الإيصال: ${window.location.origin}/pickup-receipt?id=${order.id}`;
      notifyAdmin('📋 إيصال سحب جديد', order, details);
      void sendExternalPush({
        event: 'system_alert',
        title: '📋 إيصال سحب جديد',
        message: `تم تسجيل ${typeAr} للأوردر ${order.order_number} بواسطة الفني ${techName}.`,
        targetRoles: ['admin', 'manager'],
        data: { order_id: order.id, pickup_type: pickupForm.type, pickup_photos: pickupForm.photos.length }
      });

      await fetchData();
      setShowActionModal(false);
      setPickupForm({ type: 'full_device', part_name: '', deposit: 0, notes: '', photos: [] });
      addNotification({ type: 'success', title: '✅ تم تسجيل السحب', message: 'تم حفظ إيصال السحب وإبلاغ الإدارة. يمكن للمدير إرسال الرابط للعميل.', duration: 5000 });
    } catch (err) {
      console.error(err);
      addNotification({ type: 'error', title: '❌ تعذر حفظ الإيصال', message: 'حدث خطأ أثناء تسجيل إيصال السحب، حاول مرة أخرى.', duration: 5000 });
    }
  };

  const handlePickupPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const selectedFiles = Array.from(files);
    const invalidFile = selectedFiles.find((file) => !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024);
    if (invalidFile) {
      addNotification({ type: 'error', title: '❌ صورة غير صالحة', message: 'اختر صوراً بصيغة JPG أو PNG أو WEBP وبحجم لا يتجاوز 5 ميجابايت للصورة.', duration: 5000 });
      e.target.value = '';
      return;
    }
    if (pickupForm.photos.length + selectedFiles.length > 8) {
      addNotification({ type: 'error', title: '⚠️ عدد الصور كبير', message: 'يمكن إرفاق 8 صور كحد أقصى لإيصال السحب.', duration: 4000 });
      e.target.value = '';
      return;
    }

    setIsUploadingPickupPhoto(true);
    addNotification({ type: 'info', title: '📸 جاري الرفع', message: 'يتم الآن رفع صور السحب...', duration: 2000 });

    try {
      const uploadedUrls: string[] = [...pickupForm.photos];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileName = `${Date.now()}_pickup_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const { data, error } = await supabase.storage.from('order-photos').upload(fileName, file);
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage.from('order-photos').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }
      
      setPickupForm(prev => ({ ...prev, photos: uploadedUrls }));
      addNotification({ type: 'success', title: '✅ تم الرفع', message: `تم رفع ${selectedFiles.length} صورة بنجاح`, duration: 3000 });
    } catch (err) {
      console.error(err);
      addNotification({ type: 'error', title: '❌ خطأ في الرفع', message: 'فشل رفع بعض الصور', duration: 5000 });
    } finally {
      setIsUploadingPickupPhoto(false);
      e.target.value = '';
    }
  };

  const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      addNotification({ type: 'error', title: '❌ صورة غير صالحة', message: 'اختر صورة JPG أو PNG أو WEBP بحجم لا يتجاوز 5 ميجابايت.', duration: 5000 });
      event.target.value = '';
      return;
    }

    setIsUploadingProfilePhoto(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const profileId = storedUser.id || storedUser.username || techName;
      const safeName = String(techName || 'technician').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filePath = `technician_profiles/${String(profileId)}_${safeName}.${file.name.split('.').pop() || 'jpg'}`;
      const { error: uploadError } = await supabase.storage.from('order-photos').upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from('order-photos').getPublicUrl(filePath);
      const photoUrl = publicData.publicUrl;
      const displayName = getTechnicianDisplayName({ ...storedUser, name: techName, techName });
      setTechProfilePhoto(photoUrl);
      localStorage.setItem('currentUser', JSON.stringify({ ...storedUser, profile_photo: photoUrl }));

      // الحقل الاختياري يحفظ الصورة في سجل الفني عند توفره.
      try {
        await fetchAPI(`technicians?name=eq.${encodeURIComponent(techName)}`, { method: 'PATCH', body: JSON.stringify({ profile_photo: photoUrl }) });
      } catch (optionalError) {
        console.warn('حقل profile_photo غير متاح؛ سيتم الاعتماد على سجل الملف الشخصي.', optionalError);
      }

      await fetchAPI('notifications', {
        method: 'POST',
        body: JSON.stringify({
          action: 'technician_profile_updated',
          details: profileNotificationPayload({ id: storedUser.id, code: storedUser.username || techName, username: storedUser.username, name: displayName, photoUrl }),
          user_name: displayName,
          created_at: new Date().toISOString()
        })
      });
      addNotification({ type: 'success', title: '✅ تم تحديث صورتك', message: 'ستظهر صورتك للإدارة وللعميل عند تعيينك على أوردر جديد.', duration: 5000 });
    } catch (error) {
      console.error(error);
      addNotification({ type: 'error', title: '❌ تعذر رفع الصورة', message: 'تحقق من الاتصال وحاول مرة أخرى.', duration: 5000 });
    } finally {
      setIsUploadingProfilePhoto(false);
      event.target.value = '';
    }
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
    const savedOldPhoto = extractPartsPhoto(order.technician_note, 'OLD');
    const savedNewPhoto = extractPartsPhoto(order.technician_note, 'NEW');
    setOldPartsPhoto(savedOldPhoto);
    setNewPartsPhoto(savedNewPhoto);
    setOldPartsPreview(savedOldPhoto);
    setNewPartsPreview(savedNewPhoto);
    setSettleForm({
      total_amount: order.total_amount || 0, parts_cost: order.parts_cost || 0, transport_cost: order.transport_cost || 0,
      net_amount: order.net_amount || 0, technician_share: order.technician_share || 0, company_share: order.company_share || 0,
      warranty_period: '6 أشهر',
      parts_used: ''
    });
    setCompanyTransferConfirmed(false);
    setShowSettleModal(true);
  };

    const submitSettlement = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ تم إلغاء شرط تصوير قطع الغيار بناءً على طلب المدير
    /* 
    if (!oldPartsPhoto || !newPartsPhoto) {
      addNotification({
        type: 'error',
        title: '🚫 تنبيه هام جداً',
        message: 'يجب تصوير قطع الغيار القديمة والجديدة قبل إكمال الأوردر! لن يتم قبول التصفية بدون صور.',
        duration: 0
      });
      return;
    }
    */

    if (!companyTransferConfirmed) {
      addNotification({
        type: 'error',
        title: '💰 يجب تأكيد تحويل نصيب الشركة',
        message: `بعد تحويل ${Number(settleForm.company_share || 0).toLocaleString('ar-EG')} ج.م نصيب الشركة للمدير، اضغط على مربع الإقرار ثم أرسل التصفية. لن يتم اعتماد التحصيل أو إضافة المبلغ للخزنة قبل مراجعة المدير.`,
        duration: 0
      });
      return;
    }

    const photoNotes = (oldPartsPhoto || newPartsPhoto) ? `\n[OLD_PARTS:${oldPartsPhoto || ''}]\n[NEW_PARTS:${newPartsPhoto || ''}]` : '';
    const transferAt = new Date().toISOString();
    const finalNote = mergeCompanyTransferMarker(`${selectedOrder.technician_note || ''}${photoNotes}`, {
      status: 'pending',
      amount: Number(settleForm.company_share) || 0,
      technician: techName,
      at: transferAt
    });

    const settlementData = {
      ...settleForm,
      invoice_approved: true,
      invoice_date: new Date().toISOString().split('T')[0],
      is_paid: false,
      profit_added_to_cash: false,
      technician_note: finalNote
    };

    await updateStatus(selectedOrder.id, 'completed', settlementData, { notifyManagers: false });

    setShowSettleModal(false);

    // إشعار تصفية فاتورة فوري ومستمر للمديرين مع رادار نسب المصروفات
    const settlementTotal = Number(settleForm.total_amount) || 0;
    const partsPercent = settlementTotal > 0 ? ((Number(settleForm.parts_cost) || 0) / settlementTotal) * 100 : 0;
    const transportPercent = settlementTotal > 0 ? ((Number(settleForm.transport_cost) || 0) / settlementTotal) * 100 : 0;
    const expenseWarnings = [
      partsPercent > 40 ? `⚠️ قطع الغيار ${partsPercent.toFixed(1)}% من الإجمالي (الحد 40%)` : '',
      transportPercent > 15 ? `⚠️ المواصلات ${transportPercent.toFixed(1)}% من الإجمالي (الحد 15%)` : ''
    ].filter(Boolean);
    const settlementTitle = expenseWarnings.length > 0 ? '⚠️ تصفية بمصاريف مرتفعة — تحويل بانتظار التأكيد' : '💰 الفني أكد تحويل نصيب الشركة';
    const settlementDetails = `${settlementTitle}\nالفني: ${techName}\nرقم الأوردر: ${selectedOrder.order_number}\nالعميل: ${selectedOrder.customer_name}\nالجهاز: ${selectedOrder.device_type}\nإجمالي الفاتورة: ${settlementTotal} ج.م\nنصيب الشركة المحول: ${Number(settleForm.company_share) || 0} ج.م\nالحالة: بانتظار تأكيد استلام المدير\nقطع الغيار: ${settleForm.parts_cost} ج.م (${partsPercent.toFixed(1)}%)\nالمواصلات: ${settleForm.transport_cost} ج.م (${transportPercent.toFixed(1)}%)${expenseWarnings.length > 0 ? `\n${expenseWarnings.join('\n')}` : ''}\nالوقت: ${new Date().toLocaleString('ar-EG')}`;
    try {
      await fetch(`${supabaseUrl}/rest/v1/notifications`, {
        method: 'POST',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify({
          action: 'settlement_alert',
          details: settlementDetails,
          user_name: techName,
          created_at: new Date().toISOString()
        })
      });
      void sendExternalPush({
        event: 'system_alert',
        title: settlementTitle,
        message: settlementDetails,
        targetRoles: ['admin', 'manager'],
          data: { focus: 'order', order_id: selectedOrder.id, order_number: selectedOrder.order_number, total_amount: settlementTotal, company_share: Number(settleForm.company_share) || 0, parts_percent: partsPercent, transport_percent: transportPercent, high_expense: expenseWarnings.length > 0, transfer_status: 'pending', technician: techName }
      });
    } catch (e) { console.error('Settlement alert error:', e); }

    const details = `المبلغ: ${settleForm.total_amount} ج.م | قطع غيار: ${settleForm.parts_cost} ج.م | مواصلات: ${settleForm.transport_cost} ج.م
💰 نصيب الشركة المحول: ${settleForm.company_share} ج.م
⏳ الحالة: بانتظار تأكيد استلام المدير
🛡️ الضمان: ${settleForm.warranty_period}
🖼️ صورة القديم: ${oldPartsPhoto}
🖼️ صورة الجديد: ${newPartsPhoto}`;
    notifyAdmin("💰 تحويل نصيب الشركة بانتظار التأكيد", selectedOrder, details);

    // تم دمج إشعار التصفية في إشعار واحد مفصل لمنع وصول إشعارين متطابقين للمدير.

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
    setOldPartsPreview("");
    setNewPartsPreview("");
    setCompanyTransferConfirmed(false);
    addNotification({ type: 'success', title: '✅ تم إرسال التصفية', message: 'تم تسجيل تحويل نصيب الشركة وإبلاغ المدير. ستتم إضافة المبلغ للخزنة بعد تأكيد استلامه من الإدارة.', duration: 7000 });
  };


  const openActionModal = (order: any, type: 'cancel' | 'inspect' | 'defer' | 'note' | 'pickup') => {
    setCurrentOrder(order);
    setActionType(type);
    setActionValue('');
    if (type === 'pickup') {
      setPickupForm({ type: 'full_device', part_name: '', deposit: Number(order.deposit_amount) || 0, notes: '', photos: [] });
    }
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

  const normalizeArabicDigits = (value: unknown) => String(value ?? '')
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .trim();

  const getDaysDifference = (dateStr: string, status: string) => {
    if (status === 'inspected') return 0;
    const normalizedDate = normalizeArabicDigits(dateStr);
    if (!normalizedDate) return 0;
    let orderDate: Date;
    if (normalizedDate.includes('/')) {
      const parts = normalizedDate.split('/').map((part) => parseInt(part.trim(), 10));
      if (parts.length === 3) {
        const [day, month, year] = parts;
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) orderDate = new Date(year, month - 1, day);
        else return 0;
      } else return 0;
    } else {
      orderDate = new Date(normalizedDate);
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
    return getDaysDifference(order.created_at || order.createdAt || order.date, order.status) > 2;
  };

  const isNewOrder = (order: any) => {
    if (!order.created_at) return false;
    const created = parseOrderDate(order.created_at);
    if (!created) return false;
    const now = new Date();
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours < 2; // أوردر جديد خلال آخر ساعتين
  };

      const handlePhotoUpload = async (orderId: number, e: React.ChangeEvent<HTMLInputElement>, type: 'old' | 'new' | 'general' = 'general') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addNotification({ type: 'error', title: '❌ نوع ملف غير مدعوم', message: 'يرجى اختيار صورة من الهاتف بصيغة JPG أو PNG أو WEBP', duration: 5000 });
      return;
    }

    // فحص حجم الملف (أقصى حجم 5 ميجا)
    if (file.size > 5 * 1024 * 1024) {
      addNotification({ type: 'error', title: '❌ ملف كبير جداً', message: 'أقصى حجم للصورة هو 5 ميجابايت', duration: 5000 });
      return;
    }

    const previousPreview = type === 'old' ? (oldPartsPhoto || oldPartsPreview) : (newPartsPhoto || newPartsPreview);
    const localPreview = URL.createObjectURL(file);
    if (type === 'old') setOldPartsPreview(localPreview);
    if (type === 'new') setNewPartsPreview(localPreview);
    setIsUploadingPhoto(true);
    addNotification({ type: 'info', title: '📸 جاري الرفع', message: 'يتم الآن رفع الصورة من الهاتف، يرجى الانتظار...', duration: 2500 });

    try {
      const fileName = `${Date.now()}_${type}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const { data, error } = await supabase.storage.from('order-photos').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

        if (error) {
        console.error('Supabase Storage Error:', error);
        if (type === 'old') setOldPartsPreview(previousPreview);
        if (type === 'new') setNewPartsPreview(previousPreview);
        URL.revokeObjectURL(localPreview);
        if (error.message.includes('bucket not found') || error.message.includes('does not exist')) {
          addNotification({
            type: 'error',
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

      if (type === 'old') {
        setOldPartsPhoto(photoUrl);
        setOldPartsPreview(photoUrl);
      } else if (type === 'new') {
        setNewPartsPhoto(photoUrl);
        setNewPartsPreview(photoUrl);
      }
      URL.revokeObjectURL(localPreview);

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
      if (type === 'old') setOldPartsPreview(previousPreview);
      if (type === 'new') setNewPartsPreview(previousPreview);
      URL.revokeObjectURL(localPreview);
      addNotification({ type: 'error', title: '❌ حدث خطأ', message: 'فشل الاتصال بخادم الصور. تأكد من الإنترنت وحاول مرة أخرى.', duration: 5000 });
    } finally {
      setIsUploadingPhoto(false);
    }
  };



  // ✅ دالة الفلترة للأوردرات

  const operationalOrders = orders.filter((order) => {
    const status = String(order.status || '').trim().toLowerCase();
    return !['cancelled', 'canceled', 'inspected'].includes(status) && (showCompletedOrders || status !== 'completed');
  });

  const searchFilteredOrders = operationalOrders.filter(order => {
    if (searchTerm && !order.customer_name?.includes(searchTerm) && !order.order_number?.includes(searchTerm) && !order.phone?.includes(searchTerm)) return false;
    return true;
  });

  const allFilteredOrders = searchFilteredOrders.filter(order => {
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    return true;
  });

  const filteredOrders = useMemo(() => {
    if (filterStatus === 'completed' && !searchTerm) {
      return allFilteredOrders.slice(0, visibleCompletedCount);
    }
    return allFilteredOrders;
  }, [allFilteredOrders, filterStatus, searchTerm, visibleCompletedCount]);

  const oldOpenOrders = orders
    .filter((order: any) => ['pending', 'in-progress', 'in_progress', 'deferred'].includes(String(order.status || '').toLowerCase()))
    .map((order: any) => ({ ...order, ageDays: getDaysDifference(order.created_at || order.createdAt || order.date, order.status) }))
    .filter((order: any) => order.ageDays > 2)
    .sort((a: any, b: any) => b.ageDays - a.ageDays);

  const adminWarningTypes = new Set<string>();
  adminWarnings.forEach((notification: any) => {
    const text = `${notification.action || ''} ${notification.details || ''}`;
    if (text.includes('قطع الغيار')) adminWarningTypes.add('parts');
    if (text.includes('المواصلات')) adminWarningTypes.add('transport');
    if (text.includes('نسبة النجاح') || text.includes('أداء الفني')) adminWarningTypes.add('success');
    if (notification.action === 'تنبيه إغلاق أوردرات قديمة') adminWarningTypes.add('old-orders');
  });

  const technicianWarnings = [
    ...(oldOpenOrders.length > 0 ? [{
      id: 'old-open-orders',
      type: 'old-orders',
      title: '🚨 أوردرات قديمة تحتاج إلى إجراء فوري',
      message: `${adminWarningTypes.has('old-orders') ? 'تم إرسال تنبيه مباشر من الإدارة. ' : ''}لديك ${oldOpenOrders.length} أوردر مفتوحاً منذ أكثر من يومين. راجع كل أوردر وسجّل الإجراء الصحيح: تصفية، كشف، إلغاء، أو تحديث واضح. ${oldOpenOrders.slice(0, 4).map((order: any) => order.order_number || `#${order.id}`).join('، ')}${oldOpenOrders.length > 4 ? '…' : ''}`,
      value: Math.min(100, oldOpenOrders.length * 20),
      source: adminWarningTypes.has('old-orders') ? 'تنبيه مباشر من الإدارة' : 'متابعة تلقائية'
    }] : []),
    ...(stats.totalInvoice > 0 && stats.partsPercent > 40 ? [{
      id: 'parts-expense',
      type: 'parts',
      title: 'مراجعة مصاريف قطع الغيار',
      message: `قطع الغيار تمثل ${stats.partsPercent.toFixed(1)}% من إجمالي الفواتير، بينما الحد المسموح 40%.`,
      value: stats.partsPercent,
      source: adminWarningTypes.has('parts') ? 'إنذار مرسل من الإدارة' : 'مراقبة تلقائية'
    }] : []),
    ...(stats.totalInvoice > 0 && stats.transportPercent > 15 ? [{
      id: 'transport-expense',
      type: 'transport',
      title: 'مراجعة مصاريف المواصلات',
      message: `المواصلات تمثل ${stats.transportPercent.toFixed(1)}% من إجمالي الفواتير، بينما الحد المسموح 15%.`,
      value: stats.transportPercent,
      source: adminWarningTypes.has('transport') ? 'إنذار مرسل من الإدارة' : 'مراقبة تلقائية'
    }] : []),
    ...(stats.totalOrders > 0 && stats.successRate < 70 ? [{
      id: 'success-rate',
      type: 'success',
      title: 'نسبة إنجاز الأوردرات منخفضة',
      message: `نسبة نجاح أوردراتك الحالية ${stats.successRate}%، والمطلوب الوصول إلى 70% أو أكثر.`,
      value: stats.successRate,
      source: adminWarningTypes.has('success') ? 'إنذار مرسل من الإدارة' : 'مراقبة تلقائية'
    }] : [])
  ];

  if (!isInstalled) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md bg-slate-900 border-2 border-orange-500/40 rounded-[2rem] p-6 shadow-2xl text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center animate-pulse">
            <Wrench className="text-orange-400" size={38} />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">تثبيت برنامج الفني مطلوب</h1>
          <p className="text-sm text-slate-300 leading-7 mb-5">
            لا يمكن فتح بوابة الفني من المتصفح العادي. ثبّت البرنامج على الهاتف أولاً حتى تظل التنبيهات والإشعارات مرتبطة ببوابة العمل.
          </p>
          {canInstall && !/FBAN|FBAV|WhatsApp|Instagram|Line|Messenger/i.test(navigator.userAgent) ? (
            <button
              type="button"
              onClick={() => { void install(); }}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl py-4 font-black text-base shadow-xl active:scale-95 transition-transform"
            >
              تثبيت البرنامج الآن ✅
            </button>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + '/tech-portal');
                  alert(`✅ تم نسخ رابط بوابة الموظفين. افتحه في ${isFirefox ? 'Firefox' : 'المتصفح الذي تستخدمه'} ثم اختر إضافة إلى الشاشة الرئيسية.`);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 font-black text-base shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <ExternalLink size={20} /> نسخ رابط بوابة الموظفين
              </button>
              
              <div className="bg-slate-950/70 border border-slate-700 rounded-2xl p-4 text-right space-y-3">
                {isIos ? (
                  <>
                    <p className="text-sm font-black text-white">طريقة التثبيت على iPhone 🍎</p>
                    <p className="text-xs text-slate-300 leading-6">1. افتح الرابط في متصفح **Safari**.<br/>2. اضغط زر المشاركة (المربع بسهم).<br/>3. اختر **إضافة إلى الشاشة الرئيسية**.</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-black text-white">طريقة التثبيت على Android 🤖</p>
                    <p className="text-xs text-slate-300 leading-6">1. افتح الرابط في {isFirefox ? <b className="text-orange-300">Firefox</b> : 'المتصفح'}.<br/>2. افتح القائمة واختر "تثبيت" أو "إضافة إلى الشاشة الرئيسية".<br/>3. افتح بوابة الفني من الأيقونة الجديدة.</p>
                  </>
                )}
              </div>
            </div>
          )}
          {installCompleted && <p className="mt-4 text-xs text-emerald-300 font-bold">تم قبول التثبيت. افتح البرنامج من الأيقونة المثبتة لإكمال الدخول.</p>}
          <button type="button" onClick={() => window.location.reload()} className="mt-5 text-xs text-slate-400 hover:text-white flex items-center justify-center gap-2 mx-auto"><RefreshCw size={14} /> فحص التثبيت مرة أخرى</button>
          <p className="mt-5 text-[10px] text-slate-500">يجب فتح الموقع عبر HTTPS ومن متصفح يدعم تطبيقات الويب.</p>
        </div>
      </div>
    );
  }

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
            <p className="text-[10px] text-slate-600 mt-6 uppercase tracking-widest font-bold mb-4">Maintenance Guide OS v3.3.3-technician-live-status</p>
            <NotificationStatus />

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
      {/* تنبيه البقاء مسجلاً لضمان الإشعارات */}
      <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-center text-[10px] font-black tracking-tight shadow-lg z-[50] relative">
        ⚠️ تنبيه للفني: لا تقم بتسجيل الخروج من البرنامج لضمان استقبال الأوردرات الجديدة فوراً.
      </div>

      <div className="bg-slate-800/80 border-b border-slate-700 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <label htmlFor="technician-profile-gallery" className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-700 border-2 border-orange-500/50 flex items-center justify-center cursor-pointer group shadow-lg" title="اختيار صورة من معرض الهاتف">
                {techProfilePhoto ? <img src={techProfilePhoto} alt={`صورة ${getTechnicianDisplayName({ name: techName })}`} className="w-full h-full object-cover" /> : <UserCircle className="w-8 h-8 text-slate-300" />}
                <span className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><ImagePlus size={17} className="text-white" /></span>
                {isUploadingProfilePhoto && <span className="absolute inset-0 bg-slate-950/80 flex items-center justify-center"><RefreshCw size={16} className="animate-spin text-orange-300" /></span>}
              </label>
              <div className="flex gap-1">
                <label htmlFor="technician-profile-gallery" className="cursor-pointer rounded-md bg-slate-700 px-1.5 py-0.5 text-[8px] font-black text-slate-200">المعرض</label>
                <label htmlFor="technician-profile-camera" className="cursor-pointer rounded-md bg-orange-600/80 px-1.5 py-0.5 text-[8px] font-black text-white">الكاميرا</label>
              </div>
            </div>
            <input id="technician-profile-gallery" type="file" accept="image/*" onChange={handleProfilePhotoUpload} className="sr-only" disabled={isUploadingProfilePhoto} />
            <input id="technician-profile-camera" type="file" accept="image/*" capture="user" onChange={handleProfilePhotoUpload} className="sr-only" disabled={isUploadingProfilePhoto} />
	            <div>
	              <h1 className="text-lg font-bold text-white">بوابة الفنيين</h1>
	              <div className="flex items-center gap-1.5">
	                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
	                <p className="text-xs text-orange-400">{getTechnicianDisplayName({ name: techName })}</p>
	              </div>
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
            <button 
              onClick={() => { 
                if (confirm('⚠️ تنبيه هام جداً:\n\nعند تسجيل الخروج، لن تتمكن من استقبال إشعارات الأوردرات الجديدة في الوقت الحقيقي.\n\nهل أنت متأكد أنك تريد تسجيل الخروج؟')) {
                  clearAuthSession(); 
                  window.location.replace('/login'); 
                }
              }} 
              title="تسجيل الخروج" 
              aria-label="تسجيل الخروج" 
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-700 px-4 pt-4 max-w-4xl mx-auto">
        <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition ${activeTab === 'orders' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>📋 الأوردرات</button>
        <button onClick={() => setActiveTab('performance')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition ${activeTab === 'performance' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>📊 أداء الفني</button>
      </div>

      <main className="max-w-4xl mx-auto p-4 space-y-5">


        {technicianWarnings.length > 0 && (
          <section className="bg-gradient-to-br from-rose-950/70 via-slate-900 to-slate-900 border-2 border-rose-500/60 rounded-[1.5rem] p-4 shadow-xl shadow-rose-950/30 animate-in fade-in slide-in-from-top-3 duration-500" aria-live="assertive">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center animate-pulse">
                  <AlertCircle className="text-rose-400" size={22} />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">إنذارات تحتاج إلى مراجعة</h2>
                  <p className="text-[10px] text-rose-200/80 mt-1">تختفي هذه الإنذارات تلقائياً عند تحسن المؤشرات.</p>
                </div>
              </div>
              <span className="rounded-full bg-rose-500/20 text-rose-300 px-2.5 py-1 text-[10px] font-black">{technicianWarnings.length}</span>
            </div>
            <div className="space-y-3">
              {technicianWarnings.map((warning: any) => (
                <div key={warning.id} className="bg-slate-950/60 border border-rose-500/30 rounded-2xl p-3 flex items-start gap-3">
                  <div className="mt-0.5 text-rose-400"><Bell size={16} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-white">{warning.title}</h3>
                      <span className="text-[9px] font-bold text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-full">{warning.source}</span>
                    </div>
                    <p className="text-xs leading-6 text-slate-300 mt-1">{warning.message}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, warning.value))}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
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

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
                <div className="bg-rose-950/30 p-3 rounded-xl border border-rose-500/20 text-center">
                  <div className="text-2xl font-black text-rose-300">{stats.cancelled}</div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">ملغي محسوب</div>
                </div>
                <div className="bg-yellow-950/30 p-3 rounded-xl border border-yellow-500/20 text-center">
                  <div className="text-2xl font-black text-yellow-300">{stats.inspected}</div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">كشف محسوب</div>
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
                type="button"
                onClick={() => setShowCompletedOrders(!showCompletedOrders)}
                title={showCompletedOrders ? 'إخفاء الأوردرات المكتملة' : 'استدعاء الأوردرات المكتملة'}
                aria-label={showCompletedOrders ? 'إخفاء الأوردرات المكتملة' : 'استدعاء الأوردرات المكتملة'}
                className={`px-3 py-2 rounded-lg text-sm font-black transition flex items-center gap-2 ${showCompletedOrders ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600'}`}
              >
                {showCompletedOrders ? <EyeOff size={17} /> : <Eye size={17} />}
                {showCompletedOrders ? 'إخفاء المكتمل' : 'استدعاء المكتمل'}
              </button>
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
                    onClick={() => { setFilterStatus(tab.id); if (tab.id === 'completed') setShowCompletedOrders(true); }}
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
                const delayed = isDelayed(order);
                const statusConfig: Record<string, any> = {
                  pending: { label: 'قيد الانتظار', Icon: Clock, card: 'bg-amber-950/30 border-amber-400/50 hover:border-amber-300 hover:shadow-amber-500/20', badge: 'bg-amber-500/15 text-amber-300 border-amber-400/40', icon: 'bg-amber-500/20 text-amber-300', pulse: 'animate-pulse' },
                  'in-progress': { label: 'قيد التنفيذ', Icon: Wrench, card: 'bg-blue-950/30 border-blue-400/50 hover:border-blue-300 hover:shadow-blue-500/20', badge: 'bg-blue-500/15 text-blue-300 border-blue-400/40', icon: 'bg-blue-500/20 text-blue-300', pulse: '' },
                  in_progress: { label: 'قيد التنفيذ', Icon: Wrench, card: 'bg-blue-950/30 border-blue-400/50 hover:border-blue-300 hover:shadow-blue-500/20', badge: 'bg-blue-500/15 text-blue-300 border-blue-400/40', icon: 'bg-blue-500/20 text-blue-300', pulse: '' },
                  completed: { label: 'مكتمل', Icon: CheckCircle2, card: 'bg-emerald-950/30 border-emerald-400/50 hover:border-emerald-300 hover:shadow-emerald-500/20', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40', icon: 'bg-emerald-500/20 text-emerald-300', pulse: '' },
                  cancelled: { label: 'ملغي', Icon: AlertCircle, card: 'bg-rose-950/30 border-rose-400/50 hover:border-rose-300 hover:shadow-rose-500/20', badge: 'bg-rose-500/15 text-rose-300 border-rose-400/40', icon: 'bg-rose-500/20 text-rose-300', pulse: '' },
                  deferred: { label: 'مؤجل', Icon: Clock, card: 'bg-purple-950/30 border-purple-400/50 hover:border-purple-300 hover:shadow-purple-500/20', badge: 'bg-purple-500/15 text-purple-300 border-purple-400/40', icon: 'bg-purple-500/20 text-purple-300', pulse: '' },
                  inspected: { label: 'تم الكشف', Icon: Search, card: 'bg-cyan-950/30 border-cyan-400/50 hover:border-cyan-300 hover:shadow-cyan-500/20', badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40', icon: 'bg-cyan-500/20 text-cyan-300', pulse: '' },
                  returned: { label: 'مرتجع صيانة', Icon: RotateCcw, card: 'bg-rose-950/40 border-rose-500/70 hover:border-rose-300 hover:shadow-rose-500/30', badge: 'bg-rose-600 text-white border-rose-400/50', icon: 'bg-rose-500/20 text-rose-300', pulse: 'animate-pulse' },
                  delayed: { label: 'متأخر', Icon: AlertCircle, card: 'bg-red-950/40 border-red-500/70 hover:border-red-300 hover:shadow-red-500/30', badge: 'bg-red-500/20 text-red-300 border-red-400/50', icon: 'bg-red-500/20 text-red-300', pulse: 'animate-pulse' }
                };
                const baseConfig = statusConfig[order.status] || { label: order.status, Icon: AlertCircle, card: 'bg-slate-900 border-slate-700 hover:border-slate-500 hover:shadow-slate-500/10', badge: 'bg-slate-500/15 text-slate-300 border-slate-500/40', icon: 'bg-slate-500/20 text-slate-300', pulse: '' };
                const config = delayed ? statusConfig.delayed : baseConfig;
                const StatusIcon = config.Icon;
                const orderCreatedValue = getOrderCreatedValue(order);
                const elapsedTone = getElapsedTone(orderCreatedValue, clockNow);
                const elapsedToneClass = elapsedTone === 'urgent' ? 'text-rose-200 bg-rose-500/20 border-rose-400/50 shadow-lg shadow-rose-500/20 animate-pulse' : elapsedTone === 'warning' ? 'text-amber-200 bg-amber-500/20 border-amber-400/40 shadow-lg shadow-amber-500/10' : 'text-slate-200 bg-slate-950/70 border-slate-700';

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
                    <div key={order.id} className={`group ${config.card} ${statusGlow} rounded-[1.5rem] border-2 p-5 transition-all hover:shadow-2xl relative overflow-hidden ${config.pulse} ${isNew ? "ring-4 ring-blue-500/50" : ""}`}>
                      {/* Status Background */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/10 transition-all"></div>

                      {/* Header */}
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-white group-hover:text-orange-400 transition-colors">{order.customer_name}</h3>
                            {previousCustomerPhones.has(normalizeCustomerPhone(order.phone)) && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black text-emerald-300" title="عميل سابق">✨ سابق</span>}
                            {isNewOrder(order) && <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping"></span>}
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">#{order.order_number}</span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black border flex items-center gap-1.5 ${config.badge}`}><StatusIcon size={13} strokeWidth={2.5} />{config.label}</div>
                      </div>

                      {order.status === 'returned' && (
                        <div className="mb-4 bg-rose-600/20 border-2 border-rose-500/40 rounded-2xl p-3 animate-pulse relative z-10">
                          <div className="flex items-center gap-2 text-rose-400 mb-1">
                            <AlertCircle size={16} />
                            <span className="text-xs font-black">تحذير: أوردر مرتجع</span>
                          </div>
                          <p className="text-[11px] text-rose-200 leading-relaxed font-bold">
                            {order.technician_note?.includes('[⚠️ مرتجع صيانة:') 
                              ? order.technician_note.split('[⚠️ مرتجع صيانة:').pop()?.split(']')[0] 
                              : 'يرجى مراجعة العميل فوراً لوجود مشكلة في الصيانة السابقة'}
                          </p>
                        </div>
                      )}

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
                        <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/10 flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${config.icon}`}><Cpu size={17} /></div>
                          <div className="min-w-0"><p className="text-[9px] font-bold text-slate-500 mb-1">الجهاز والماركة</p><p className="text-xs font-black text-slate-200 truncate">{order.device_type} - {order.brand}</p></div>
                        </div>
                        <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50">
                          <p className="text-[9px] font-bold text-slate-500 mb-1">تاريخ ووقت الأوردر</p>
                          <p className="text-xs font-black text-slate-200">{formatOrderDay(orderCreatedValue)} - {formatOrderDateTime(orderCreatedValue)}</p>
                          <span className={`mt-2 inline-flex min-w-[145px] justify-center items-center gap-1.5 rounded-xl border px-3 py-2 text-xs sm:text-sm font-black tracking-wide ${elapsedToneClass}`} title="المدة منذ تسجيل الأوردر"><Clock size={14} /> منذ {formatElapsed(orderCreatedValue, clockNow)}</span>
                        </div>
                      </div>

                      {/* Location and Notes */}
                      <div className="space-y-2.5 mb-6 relative z-10">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500"><MapPin size={12} /></div>
                          <span className="line-clamp-1 flex-1">{order.address || 'لا يوجد عنوان مسجل'}</span>
                          {order.address && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  const addr = order.address || '';
                                  const query = addr.includes('http') ? addr : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr + (addr.includes('الساحل') || addr.includes('ك ') ? ' Egypt' : ' Alexandria Egypt'))}`;
                                  window.open(query, '_blank');
                                }}
                                className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2 shadow-sm active:scale-95"
                                title="فتح موقع العميل GPS"
                              >
                                <Navigation size={15} className="animate-pulse" />
                                <span className="text-[10px] font-black">موقع العميل GPS</span>
                              </button>
                            </div>
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
                            <div className="flex-1 flex gap-2">
                              <a 
                                href={`tel:${order.phone}`} 
                                onClick={() => notifyCustomerContact(order, 'phone')}
                                className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                              >
                                <Phone size={14} /> <span className="text-[10px] font-black">اتصال</span>
                              </a>
                              <a 
                                href={`https://wa.me/20${order.phone?.replace(/^0/, '')}?text=${encodeURIComponent(`📢 *تحديث من مركز الصيانة*\n━━━━━━━━━━━━━━━━━━━━━━\n🔢 *رقم الطلب:* ${order.order_number}\n👤 *عزيزنا العميل:* ${order.customer_name}\n\n📍 *يمكنك تتبع حالة طلبك مباشرة من هنا:*\nhttps://www.maintenanceguide.life/track/${order.order_number}\n\n🌟 *شكراً لثقتكم في HomeCare Maintenance.*`)}`}
                                onClick={() => notifyCustomerContact(order, 'whatsapp')}
                                target="_blank"
                                className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                              >
                                <MessageCircle size={14} /> <span className="text-[10px] font-black">واتساب</span>
                              </a>
                            </div>
                          )}
                          <button onClick={() => { setSelectedOrderForActions(order); setShowActionsModal(true); }} className="h-10 w-10 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all active:scale-95">
                            <Eye size={16} />
                          </button>
                        </div>

                        <div className="flex gap-2">
                          {(order.status === 'pending' || order.status === 'returned') && (
                            <button onClick={() => updateStatus(order.id, 'in-progress')} className="w-full h-10 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-black transition-all active:scale-95">
                              {order.status === 'returned' ? '🛠️ إعادة الفحص' : '🚀 بدء العمل'}
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
                           <button onClick={() => openActionModal(order, 'pickup')} className="flex-1 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded-lg text-[9px] font-black transition-all border border-purple-500/20">📋 إيصال سحب</button>
                        </div>
                      </div>
                    </div>
                  );
	                })}
	              {filteredOrders.length === 0 && <div className="text-center py-8 text-slate-400">لا توجد أوردرات</div>}

                {filterStatus === 'completed' && allFilteredOrders.length > visibleCompletedCount && (
                  <div className="flex justify-center py-6">
                    <button 
                      onClick={() => setVisibleCompletedCount(prev => prev + 10)}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-2xl font-black shadow-lg border border-slate-700 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <ChevronDown size={18} /> عرض المزيد من الأوردرات المكتملة
                    </button>
                  </div>
                )}
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
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
            <div className="flex justify-between mb-4"><h3 className="text-xl font-bold text-white">
              {actionType === 'cancel' && 'إلغاء الأوردر'}
              {actionType === 'inspect' && 'كشف بقيمة'}
              {actionType === 'defer' && 'تأجيل الأوردر'}
              {actionType === 'note' && 'إضافة ملاحظة'}
              {actionType === 'pickup' && '📋 إيصال سحب جهاز أو قطعة'}
            </h3><button onClick={() => setShowActionModal(false)} className="text-slate-400"><X className="w-5 h-5" /></button></div>
            {actionType === 'pickup' ? (
              <form onSubmit={(e) => { e.preventDefault(); void handlePickup(currentOrder); }} className="space-y-4">
                <div className="rounded-2xl bg-purple-950/40 border border-purple-500/30 p-3">
                  <p className="text-xs text-purple-200 font-bold leading-6">سجّل حالة الجهاز أو القطعة قبل خروجها من موقع العميل، وأرفق صوراً واضحة لتوثيق الاستلام.</p>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-2">نوع السحب</label>
                  <select value={pickupForm.type} onChange={(e) => setPickupForm(prev => ({ ...prev, type: e.target.value as typeof prev.type, part_name: e.target.value === 'full_device' ? '' : prev.part_name }))} className="w-full bg-slate-700 rounded-xl px-3 py-3 text-white border border-slate-600 outline-none">
                    <option value="full_device">سحب الجهاز بالكامل</option>
                    <option value="part_repair">سحب قطعة للإصلاح</option>
                    <option value="part_replacement">سحب قطعة للاستبدال</option>
                  </select>
                </div>
                {pickupForm.type !== 'full_device' && (
                  <div>
                    <label className="block text-xs font-black text-slate-300 mb-2">اسم أو وصف قطعة الغيار</label>
                    <input required value={pickupForm.part_name} onChange={(e) => setPickupForm(prev => ({ ...prev, part_name: e.target.value }))} placeholder="مثال: كارتة تشغيل / موتور / طلمبة" className="w-full bg-slate-700 rounded-xl px-3 py-3 text-white border border-slate-600 outline-none" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-2">العربون أو المبلغ المستلم (اختياري)</label>
                  <input type="number" min="0" value={pickupForm.deposit || ''} onChange={(e) => setPickupForm(prev => ({ ...prev, deposit: Number(e.target.value) || 0 }))} placeholder="0" className="w-full bg-slate-700 rounded-xl px-3 py-3 text-white border border-slate-600 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-2">صور الحالة قبل السحب <span className="text-rose-300">(مطلوبة)</span></label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <label htmlFor={`pickup-camera-${currentOrder.id}`} className="cursor-pointer rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-100 py-3 text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-transform"><Camera size={15} /> تصوير الآن</label>
                    <label htmlFor={`pickup-gallery-${currentOrder.id}`} className="cursor-pointer rounded-xl bg-slate-700 border border-slate-600 text-slate-200 py-3 text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-transform"><Upload size={15} /> من الهاتف</label>
                    <input id={`pickup-camera-${currentOrder.id}`} type="file" accept="image/*" capture="environment" onChange={handlePickupPhotoUpload} className="sr-only" disabled={isUploadingPickupPhoto} />
                    <input id={`pickup-gallery-${currentOrder.id}`} type="file" accept="image/*" multiple onChange={handlePickupPhotoUpload} className="sr-only" disabled={isUploadingPickupPhoto} />
                  </div>
                  {isUploadingPickupPhoto && <div className="flex items-center justify-center gap-2 text-xs text-orange-300 py-2"><RefreshCw size={15} className="animate-spin" /> جاري رفع الصور...</div>}
                  {pickupForm.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {pickupForm.photos.map((photo, index) => (
                        <div key={`${photo}-${index}`} className="relative aspect-square rounded-xl overflow-hidden border border-slate-600 bg-slate-950">
                          <img src={photo} alt={`صورة السحب ${index + 1}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setPickupForm(prev => ({ ...prev, photos: prev.photos.filter((_, photoIndex) => photoIndex !== index) }))} className="absolute top-1 left-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center" aria-label="حذف الصورة"><X size={13} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 mt-2">يمكن اختيار أكثر من صورة من المعرض، بحد أقصى 5 ميجابايت للصورة.</p>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-2">ملاحظات حالة الجهاز أو القطعة</label>
                  <textarea rows={3} value={pickupForm.notes} onChange={(e) => setPickupForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="خدوش، كسر، ملحقات، رقم مسلسل أو أي ملاحظة مهمة" className="w-full bg-slate-700 rounded-xl px-3 py-3 text-white border border-slate-600 outline-none resize-none" />
                </div>
                <button type="submit" disabled={isUploadingPickupPhoto} className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-3 rounded-xl font-black shadow-lg active:scale-95 transition-all">تأكيد تسجيل إيصال السحب</button>
              </form>
            ) : (
              <div className="space-y-4">
                {actionType === 'inspect' ? (
                  <input type="number" placeholder="المبلغ (ج.م)" value={actionValue} onChange={e => setActionValue(e.target.value)} className="w-full p-2 bg-slate-700 rounded-lg text-white" autoFocus />
                ) : (
                  <textarea placeholder={actionType === 'cancel' ? 'سبب الإلغاء' : actionType === 'defer' ? 'سبب التأجيل' : 'نص الملاحظة'} rows={3} value={actionValue} onChange={e => setActionValue(e.target.value)} className="w-full p-2 bg-slate-700 rounded-lg text-white" autoFocus />
                )}
                <button onClick={confirmAction} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-bold">تأكيد</button>
              </div>
            )}
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
	              {/* ✅ تم إخفاء قسم الصور بناءً على طلب المدير لتبسيط التصفية */}
	              {/* 
	              <div className="rounded-2xl border border-orange-500/20 bg-slate-900/40 p-3">
	                ...
	              </div>
	              */}

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
                          <option value="1 شهر">1 شهر</option>
                          <option value="شهرين">شهرين</option>
                          <option value="3 أشهر">3 أشهر</option>
                          <option value="4 أشهر">4 أشهر</option>
                          <option value="6 أشهر">6 أشهر</option>
                          <option value="1 سنة">1 سنة</option>
                          <option value="2 سنة">2 سنة</option>
                          <option value="custom">مخصص (يدوي)...</option>
                        </select>
                        {settleForm.warranty_period === 'custom' && (
                          <div className="mt-2">
                            <input 
                              type="text" 
                              placeholder="اكتب مدة الضمان هنا..." 
                              className="w-full bg-slate-800 border border-orange-500/50 rounded-xl px-3 py-2 text-white text-xs"
                              onChange={(e) => handleSettleChange('warranty_period', e.target.value)}
                            />
                          </div>
                        )}
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

              <div className={`rounded-2xl border-2 p-4 transition-all ${companyTransferConfirmed ? 'border-emerald-400/70 bg-emerald-500/10 shadow-lg shadow-emerald-500/10' : 'border-amber-400/80 bg-amber-500/10 shadow-lg shadow-amber-500/10 animate-pulse'}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${companyTransferConfirmed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    <Wallet size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-amber-200">⚠️ إجراء مالي إلزامي قبل إرسال التصفية</p>
                    <p className="mt-1 text-[11px] leading-5 text-slate-300">
                      بعد تحويل <strong className="text-white">{Number(settleForm.company_share || 0).toLocaleString('ar-EG')} ج.م</strong> نصيب الشركة إلى المدير، يجب تأكيد ذلك هنا. سيظهر الأوردر للإدارة بانتظار مراجعة الاستلام، ولن يُضاف المبلغ إلى الخزنة إلا بعد اعتماد المدير.
                    </p>
                  </div>
                </div>
                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3 hover:bg-slate-950/70">
                  <input
                    type="checkbox"
                    required
                    checked={companyTransferConfirmed}
                    onChange={(event) => setCompanyTransferConfirmed(event.target.checked)}
                    className="mt-1 h-5 w-5 shrink-0 accent-emerald-500"
                  />
                  <span className="text-xs font-black leading-5 text-white">
                    أقرّ بأنني حوّلت نصيب الشركة الموضح أعلاه للمدير، وأطلب من الإدارة تأكيد الاستلام.
                  </span>
                </label>
                {companyTransferConfirmed && <p className="mt-2 text-center text-[10px] font-black text-emerald-300">✅ تم تسجيل إقرار التحويل — اضغط إرسال التصفية</p>}
              </div>

              <button type="submit" className={`w-full py-4 rounded-2xl text-white font-black text-lg shadow-xl transition-all active:scale-95 ${companyTransferConfirmed ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-900/20' : 'bg-slate-700 cursor-not-allowed opacity-80'}`}>
                {companyTransferConfirmed ? 'إرسال التصفية وانتظار اعتماد المدير ✅' : 'أكد تحويل نصيب الشركة أولاً'}
              </button>
            </form>
          </div>
        </div>
      )}
      <div className="text-center pb-8">
        <NotificationStatus />
        <div className="text-[11px] text-white font-black opacity-90 mt-4 tracking-widest bg-slate-800/50 px-3 py-1 rounded-full inline-block border border-white/10">v4.1.7-radar-notifications-stable</div>
      </div>
    </div>
  );
}
