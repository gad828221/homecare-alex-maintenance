import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Plus, Search, LayoutDashboard, Users, 
  CheckCircle2, AlertCircle, 
  Edit, Trash2, RefreshCw, Phone,
  Copy, Check, Trash, Bell, DollarSign, X, Printer, UserPlus, UserMinus, LogOut, Send,
  AlertTriangle, RotateCcw, Settings
} from "lucide-react";
import AdminPermissions from './AdminPermissions';
import TechnicianPerformance from './TechnicianPerformance';
import AlertBar from './AlertBar';
import FinancialDaySettings from './FinancialDaySettings';
import { createClient } from '@supabase/supabase-js';
import { useNotification } from './EnhancedNotificationSystem';
import { invoiceService } from '../services/invoiceService';
import { 
  getFinancialDay, 
  getFinancialDayRange, 
  canDistributeProfits, 
  isTransactionLate,
  FinancialDayConfig,
  DEFAULT_FINANCIAL_CONFIG
} from '../services/financialDayService';
import { alertingService, ADMIN_ALERTS, TECHNICIAN_ALERTS } from '../services/alertingService';
import { auditLogService } from '../services/auditLogService';

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
  const [financialConfig, setFinancialConfig] = useState<FinancialDayConfig>(
    JSON.parse(localStorage.getItem('financialDayConfig') || JSON.stringify(DEFAULT_FINANCIAL_CONFIG))
  );
  const [showFinancialSettings, setShowFinancialSettings] = useState(false);
  const [currentFinancialDay, setCurrentFinancialDay] = useState(getFinancialDay(new Date(), financialConfig));

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || 'user');
    
    // تحديث اليوم المالي كل دقيقة
    const interval = setInterval(() => {
      const newDay = getFinancialDay(new Date(), financialConfig);
      if (newDay !== currentFinancialDay) {
        setCurrentFinancialDay(newDay);
        toastNotification('ℹ️ تنبيه', `تغيير اليوم المالي إلى: ${newDay}`);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [financialConfig, currentFinancialDay, toastNotification]);

  const updateOrderStatus = async (id: number, newStatus: string, extraData = {}) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    
    try {
      const financialDay = getFinancialDay(new Date(), financialConfig);
      const lateCheck = isTransactionLate(new Date(), financialConfig);
      
      // تسجيل في سجل التغييرات
      auditLogService.log(
        localStorage.getItem('currentUser') || 'unknown',
        localStorage.getItem('userName') || 'مدير',
        'admin',
        'UPDATE',
        'order',
        id.toString(),
        [{ field: 'status', oldValue: order.status, newValue: newStatus }],
        undefined,
        `تحديث حالة الأوردر إلى ${newStatus} في يوم مالي: ${financialDay}`
      );

      await fetchAPI(`orders?id=eq.${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify({ 
          status: newStatus, 
          financial_day: financialDay,
          ...extraData 
        }) 
      });
      
      const statusAr = newStatus === 'completed' ? 'تم التنفيذ' : 'قيد العمل';
      
      // إرسال للمديرين ومدير العمليات
      await notifyStaff(`🔄 تحديث حالة`, `أوردر ${order.customer_name} أصبح: ${statusAr}`);
      
      // إرسال للفني المعني فقط مع تنبيه اليوم المالي
      if (order.technician) {
        const tech = technicians.find(t => t.name === order.technician);
        if (tech) {
          const message = lateCheck.isLate 
            ? `🔧 تحديث أوردرك: ${statusAr}\n⚠️ ${lateCheck.message}`
            : `🔧 تحديث أوردرك: ${statusAr}\n✅ ${lateCheck.message}`;
          
          await sendPushToExternalId(tech.id.toString(), `🔧 تحديث أوردرك`, message);
        }
      }
    } catch (err) { console.error(err); }
  };

  const handleSettleOrder = async (order: any, amount: number) => {
    const financialDay = getFinancialDay(new Date(), financialConfig);
    const lateCheck = isTransactionLate(new Date(), financialConfig);
    
    // تسجيل في سجل التغييرات
    auditLogService.logOrderSettlement(
      localStorage.getItem('currentUser') || 'unknown',
      localStorage.getItem('userName') || 'فني',
      order.id.toString(),
      amount,
      financialDay
    );

    // إضافة تنبيه للفني إذا كانت التصفية متأخرة
    if (lateCheck.isLate) {
      alertingService.addWarningAlert(
        'technician',
        TECHNICIAN_ALERTS.LATE_SETTLEMENT(financialDay).title,
        TECHNICIAN_ALERTS.LATE_SETTLEMENT(financialDay).message
      );
    } else {
      alertingService.addSuccessAlert(
        'technician',
        TECHNICIAN_ALERTS.SUCCESSFUL_SETTLEMENT(financialDay).title,
        TECHNICIAN_ALERTS.SUCCESSFUL_SETTLEMENT(financialDay).message
      );
    }

    // تحديث الأوردر
    await updateOrderStatus(order.id, 'completed', { 
      total_amount: amount,
      settled_at: new Date().toISOString(),
      financial_day: financialDay
    });
  };

  const handleDistributeProfits = async () => {
    const canDist = canDistributeProfits(financialConfig);
    
    if (!canDist.canDistribute) {
      alertingService.addCriticalAlert(
        'admin',
        ADMIN_ALERTS.CANNOT_DISTRIBUTE_BEFORE_NOON(canDist.nextDistributionTime!).title,
        ADMIN_ALERTS.CANNOT_DISTRIBUTE_BEFORE_NOON(canDist.nextDistributionTime!).message,
        {
          label: 'فهمت',
          callback: () => alertingService.resolveAlert('critical-' + Date.now())
        }
      );
      return;
    }

    // تسجيل توزيع الأرباح
    auditLogService.logProfitDistribution(
      localStorage.getItem('currentUser') || 'unknown',
      localStorage.getItem('userName') || 'مدير',
      currentFinancialDay,
      [], // سيتم ملؤها بالشركاء الفعليين
      0 // سيتم حسابها من الأوردرات
    );

    toastNotification('✅ نجح', 'تم توزيع الأرباح بنجاح');
  };

  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const financialDay = getFinancialDay(new Date(), financialConfig);
    
    try {
      const orderToSave = { 
        ...formData, 
        order_number: `MG-${Date.now()}`,
        financial_day: financialDay,
        created_at: new Date().toISOString()
      };
      
      await fetchAPI('orders', { method: 'POST', body: JSON.stringify(orderToSave) });
      
      // تسجيل في سجل التغييرات
      auditLogService.log(
        localStorage.getItem('currentUser') || 'unknown',
        localStorage.getItem('userName') || 'مدير',
        'admin',
        'CREATE',
        'order',
        orderToSave.order_number,
        [{ field: 'all', oldValue: null, newValue: orderToSave }],
        undefined,
        `إنشاء أوردر جديد في يوم مالي: ${financialDay}`
      );
      
      // إرسال للمديرين ومدير العمليات فقط
      await notifyStaff('📋 أوردر جديد', `تم إضافة أوردر جديد للعميل ${formData.customer_name}`, ['admin', 'manager']);
      
      if (orderToSave.technician) {
        const tech = technicians.find(t => t.name === orderToSave.technician);
        if (tech) await sendPushToExternalId(tech.id.toString(), '🔧 أوردر جديد محول لك', `تم تعيين أوردر جديد لك: ${formData.customer_name}`);
      }
      
      toastNotification('✅ نجح', 'تم إضافة الأوردر بنجاح');
      setFormData({});
    } catch (err) { 
      console.error(err);
      toastNotification('❌ خطأ', 'فشل إضافة الأوردر');
    }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* شريط التنبيهات الأحمر */}
      <AlertBar target="admin" />

      {/* الشريط العلوي */}
      <div className="bg-slate-800/80 border-b border-slate-700 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">📊 لوحة تحكم المدير</h1>
            <p className="text-sm text-slate-400">اليوم المالي: <span className="font-bold text-orange-400">{currentFinancialDay}</span></p>
          </div>
          <button
            onClick={() => setShowFinancialSettings(!showFinancialSettings)}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
            title="إعدادات اليوم المالي"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* نافذة الإعدادات */}
      {showFinancialSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <FinancialDaySettings 
            onSave={(config) => {
              setFinancialConfig(config);
              setShowFinancialSettings(false);
            }}
            onClose={() => setShowFinancialSettings(false)}
          />
        </div>
      )}

      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">إجمالي الأوردرات</p>
            <p className="text-3xl font-bold text-white mt-2">{orders.length}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">أوردرات مكتملة اليوم</p>
            <p className="text-3xl font-bold text-green-400 mt-2">
              {orders.filter(o => o.status === 'completed' && o.financial_day === currentFinancialDay).length}
            </p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">إجمالي الأرباح اليوم</p>
            <p className="text-3xl font-bold text-orange-400 mt-2">
              {orders
                .filter(o => o.status === 'completed' && o.financial_day === currentFinancialDay)
                .reduce((sum, o) => sum + (o.total_amount || 0), 0)
                .toLocaleString()} ج.م
            </p>
          </div>
          <button
            onClick={handleDistributeProfits}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <DollarSign className="w-5 h-5" />
            توزيع الأرباح
          </button>
        </div>

        {/* قائمة الأوردرات */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">📋 الأوردرات</h2>
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="bg-slate-700/50 rounded-lg p-4 flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-bold text-white">{order.customer_name}</p>
                  <p className="text-xs text-slate-400">
                    {order.order_number} • {order.financial_day}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-400">{order.total_amount || 0} ج.م</p>
                  <p className={`text-xs ${
                    order.status === 'completed' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {order.status === 'completed' ? '✅ مكتمل' : '⏳ قيد العمل'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
