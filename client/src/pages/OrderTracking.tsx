import React, { useState, useEffect } from 'react';
import { useRoute } from "wouter";
import { 
  CheckCircle2, Clock, MapPin, Wrench, Phone, MessageCircle, 
  ChevronLeft, ShieldCheck, AlertCircle, RotateCcw, LayoutDashboard,
  Star
} from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { Helmet } from 'react-helmet-async';
import { formatOrderDateTime } from '../utils/orderTiming';
import { getTechnicianDisplayName, getTechnicianPhotoUrl, getTechnicianSpecialty } from '../utils/technicianProfile';

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function OrderTracking() {
  const [, params] = useRoute("/track/:orderNumber");
  const orderNumber = params?.orderNumber;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) return;
    
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', orderNumber)
          .single();
          
        if (err) throw err;
        if (!data) throw new Error("لم يتم العثور على الأوردر");
        
        setOrder(data);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "حدث خطأ أثناء تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    
    // الاشتراك في التحديثات اللحظية
    const channel = supabase
      .channel(`track-${orderNumber}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `order_number=eq.${orderNumber}` }, (payload) => {
        setOrder(payload.new);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-bold">جاري تتبع طلبك...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">عذراً!</h2>
          <p className="text-slate-500 font-bold mb-8">{error || "رقم الأوردر غير صحيح أو تم حذفه"}</p>
          <a href="/" className="block w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg">العودة للرئيسية</a>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'تم استلام الطلب', icon: <Clock />, color: 'blue', step: 1 };
      case 'in-progress': return { label: 'جاري العمل', icon: <Wrench />, color: 'orange', step: 2 };
      case 'inspected': return { label: 'تم الكشف', icon: <ShieldCheck />, color: 'indigo', step: 2 };
      case 'completed': return { label: 'تم الإصلاح بنجاح', icon: <CheckCircle2 />, color: 'emerald', step: 3 };
      case 'returned': return { label: 'مرتجع صيانة', icon: <RotateCcw />, color: 'rose', step: 2 };
      case 'cancelled': return { label: 'تم الإلغاء', icon: <AlertCircle />, color: 'slate', step: 0 };
      default: return { label: 'قيد المعالجة', icon: <Clock />, color: 'slate', step: 1 };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const techPhoto = getTechnicianPhotoUrl({ name: order.technician });

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20" dir="rtl">
      <Helmet>
        <title>تتبع الأوردر | {order.order_number}</title>
      </Helmet>

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-5 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-200">MG</div>
            <div>
              <h1 className="text-lg font-black text-slate-900">تتبع حالة الصيانة</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{order.order_number}</p>
            </div>
          </div>
          <button onClick={() => window.location.reload()} className="p-2 text-slate-400 hover:text-orange-600 transition-colors">
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Live Status Card */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-32 h-32 bg-${statusInfo.color}-500/5 rounded-full -mr-16 -mt-16 blur-2xl`}></div>
          
          <div className="relative z-10 text-center">
            <div className={`w-20 h-20 bg-${statusInfo.color}-500/10 text-${statusInfo.color}-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse`}>
              {React.cloneElement(statusInfo.icon as React.ReactElement, { size: 40 })}
            </div>
            <h2 className={`text-2xl font-black text-${statusInfo.color}-600 mb-1`}>{statusInfo.label}</h2>
            <p className="text-slate-400 text-xs font-bold italic">آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}</p>
          </div>

          {/* Timeline Steps */}
          <div className="mt-12 flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
            <div 
              className={`absolute top-1/2 left-0 h-1 bg-${statusInfo.color}-500 -translate-y-1/2 z-0 transition-all duration-1000`} 
              style={{ width: `${(statusInfo.step / 3) * 100}%` }}
            ></div>
            
            {[
              { id: 1, label: 'الطلب', icon: <Clock size={16}/> },
              { id: 2, label: 'التنفيذ', icon: <Wrench size={16}/> },
              { id: 3, label: 'الاكتمال', icon: <CheckCircle2 size={16}/> }
            ].map((step) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-md transition-all duration-500 ${
                  statusInfo.step >= step.id ? `bg-${statusInfo.color}-500 text-white` : 'bg-slate-200 text-slate-400'
                }`}>
                  {step.icon}
                </div>
                <span className={`text-[10px] font-black ${statusInfo.step >= step.id ? `text-${statusInfo.color}-600` : 'text-slate-400'}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100">
          <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
            <LayoutDashboard size={18} className="text-orange-600" /> تفاصيل الطلب
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold mb-1">نوع الجهاز</p>
              <p className="text-sm font-black text-slate-800">{order.device_type}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold mb-1">الماركة</p>
              <p className="text-sm font-black text-slate-800">{order.brand}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 col-span-2">
              <p className="text-[10px] text-slate-400 font-bold mb-1">تاريخ الطلب</p>
              <p className="text-sm font-black text-slate-800">{formatOrderDateTime(order.created_at || order.date)}</p>
            </div>
          </div>
        </div>

        {/* Technician Info */}
        {order.technician && order.technician !== '-' && (
          <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100">
            <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
              <Wrench size={18} className="text-orange-600" /> الفني المكلف بالطلب
            </h3>
            
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-3xl bg-slate-100 border border-slate-100 overflow-hidden shadow-inner">
                {techPhoto ? (
                  <img src={techPhoto} alt={order.technician} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Wrench size={32} />
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900">{order.technician}</h4>
                <p className="text-xs text-orange-600 font-bold">متخصص {order.device_type || 'صيانة معتمد'}</p>
                <div className="mt-3 flex gap-2">
                  <a href={`tel:${order.technician_phone || '01278885772'}`} className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-200 active:scale-90 transition-all">
                    <Phone size={18} />
                  </a>
                  <a href={`https://wa.me/201558625259`} target="_blank" className="bg-green-600 text-white p-2 rounded-xl shadow-lg shadow-green-200 active:scale-90 transition-all">
                    <MessageCircle size={18} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Support Card */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-600/20 to-transparent"></div>
          <h3 className="text-xl font-black mb-2 relative z-10">هل تحتاج مساعدة؟</h3>
          <p className="text-slate-400 text-xs font-bold mb-6 relative z-10 leading-relaxed">فريق الدعم الفني متواجد لخدمتك على مدار الساعة للإجابة على أي استفسار.</p>
          <div className="flex flex-col sm:flex-row gap-3 relative z-10">
            <a href="tel:01278885772" className="flex-1 bg-white text-slate-900 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
              <Phone size={18} /> اتصل بنا
            </a>
            <a href="https://wa.me/201558625259" target="_blank" className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
              <MessageCircle size={18} /> واتساب
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Maintenance Guide © 2026</p>
          <p className="text-[9px] text-slate-300 mt-1">جميع الحقوق محفوظة لمركز الصيانة المعتمد</p>
        </div>
      </div>

      {/* Action Bar (Only when completed) */}
      {order.status === 'completed' && (
        <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 z-20 animate-in slide-in-from-bottom duration-500">
          <a 
            href={`/feedback?order=${order.order_number}`} 
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-orange-200 transition-all active:scale-95"
          >
            <Star size={20} /> تقييم جودة الخدمة
          </a>
        </div>
      )}
    </div>
  );
}
