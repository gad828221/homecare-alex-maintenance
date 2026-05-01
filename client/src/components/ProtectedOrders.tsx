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

// ========== دالة الإشعارات الموجهة (عبر Netlify Function) ==========
const sendPushToExternalId = async (externalId: string | string[], title: string, message: string) => {
  try {
    const ids = Array.isArray(externalId) ? externalId : [externalId];
    const response = await fetch('/.netlify/functions/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message, external_ids: ids })
    });
    return (await response.json()).success;
  } catch (err) { return false; }
};

const notifyStaff = async (title: string, message: string, roles = ['admin', 'manager']) => {
  try {
    await fetch('/.netlify/functions/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message, target_roles: roles })
    });
  } catch (err) { console.error(err); }
};

export default function ProtectedOrders() {
  const { addNotification: toastNotification } = useNotification();
  const [orders, setOrders] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || 'user');
  }, []);

  const updateOrderStatus = async (id: number, newStatus: string, extraData = {}) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    try {
      await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus, ...extraData }) });
      const statusAr = newStatus === 'completed' ? 'تم التنفيذ' : 'قيد العمل';
      
      // إرسال للمديرين ومدير العمليات
      await notifyStaff(`🔄 تحديث حالة`, `أوردر ${order.customer_name} أصبح: ${statusAr}`);
      
      // إرسال للفني المعني فقط
      if (order.technician) {
        const tech = technicians.find(t => t.name === order.technician);
        if (tech) await sendPushToExternalId(tech.id.toString(), `🔧 تحديث أوردرك`, `تم تغيير حالة أوردر العميل ${order.customer_name} إلى ${statusAr}`);
      }
    } catch (err) { console.error(err); }
  };

  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const orderToSave = { ...formData, order_number: `MG-${Date.now()}` };
      await fetchAPI('orders', { method: 'POST', body: JSON.stringify(orderToSave) });
      
      // إرسال للمديرين ومدير العمليات فقط
      await notifyStaff('📋 أوردر جديد', `تم إضافة أوردر جديد للعميل ${formData.customer_name}`, ['admin', 'manager']);
      
      if (orderToSave.technician) {
        const tech = technicians.find(t => t.name === orderToSave.technician);
        if (tech) await sendPushToExternalId(tech.id.toString(), '🔧 أوردر جديد محول لك', `تم تعيين أوردر جديد لك: ${formData.customer_name}`);
      }
      alert("✅ تم إضافة الأوردر بنجاح");
    } catch (err) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="p-4">
      {/* محتوى الصفحة كما هو */}
    </div>
  );
}
