import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, AlertCircle, Zap, CheckCircle2, User, Phone, Badge, ChevronDown, ChevronUp, History, Share2, Send, Trash2 } from "lucide-react";
import { formatOrderDateTime, parseOrderDate } from '../utils/orderTiming';

interface OrderCardProps {
  order: any;
  onSelect?: (order: any) => void;
  onAssignTech?: (order: any) => void;
  onDelete?: (order: any) => void;
}

export function OrderCard({ order, onSelect, onAssignTech, onDelete }: OrderCardProps) {
  // حالة التفاصيل وسجل المراحل (مخفية افتراضياً)
  const [showDetails, setShowDetails] = useState(false);

  // معرفة هل الطلب جديد (أقل من 5 دقائق)
  const isNew = () => {
    const createdTime = parseOrderDate(order.created_at)?.getTime();
    if (!createdTime) return false;
    const now = Date.now();
    const diffMinutes = (now - createdTime) / (1000 * 60);
    return diffMinutes >= 0 && diffMinutes < 5;
  };

  // تنسيقات حالة الأوردر
  const getStatusStyle = (status: string) => {
    const styles: Record<string, any> = {
      pending: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', icon: AlertCircle, label: 'قيد الانتظار' },
      inProgress: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', icon: Zap, label: 'قيد المعالجة' },
      completed: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', icon: CheckCircle2, label: 'مكتمل' },
      cancelled: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', icon: AlertCircle, label: 'ملغى' },
      inspected: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', icon: CheckCircle2, label: 'تم الفحص' }
    };
    return styles[status] || styles.pending;
  };

  const statusStyle = getStatusStyle(order.status);
  const StatusIcon = statusStyle.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`order-card-3d bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden ${
        showDetails ? 'details-open' : ''
      }`}
    >
      {/* 1. رأس البطاقة (Header) */}
      <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">{order.customer_name}</h3>
              {order.is_previous_customer && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  ✨ عميل سابق
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono font-bold">
                #{order.order_number}
              </span>
              <span className="text-[10px] text-slate-600 font-semibold">
                سجل بواسطة: <span className="text-slate-900 font-bold">{order.created_by || 'مدير العمليات'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isNew() && (
              <span className="bg-rose-600 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm animate-pulse">
                جديد
              </span>
            )}
            
            <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{statusStyle.label}</span>
            </div>

            {/* زر فتح وإغلاق باقي التفاصيل والسجل */}
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 border border-slate-300"
              title={showDetails ? "إخفاء التفاصيل" : "عرض التفاصيل"}
            >
              <span>{showDetails ? "إخفاء" : "تفاصيل"}</span>
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. الجزء الظاهر دائماً (معلومات العميل والجهاز + أزرار التواصل) */}
      <div className="p-4 space-y-3.5">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* العميل */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-none">
            <p className="text-[10px] text-slate-500 font-bold mb-0.5">العميل</p>
            <p className="font-extrabold text-slate-900 truncate">{order.customer_name}</p>
          </div>

          {/* الفني - مميز بخلفية زرقاء فاتحة وخط أزرق واضح جداً */}
          <div className="bg-blue-50/80 p-2.5 rounded-xl border border-blue-200 shadow-none">
            <p className="text-[10px] text-blue-600 font-bold mb-0.5">الفني المكلف</p>
            <p className="font-black text-blue-900 text-xs truncate">
              {order.technician ? (
                <span className="text-blue-900 font-black">{order.technician}</span>
              ) : (
                <span className="text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded">غير محدد</span>
              )}
            </p>
          </div>

          {/* الجهاز */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-none">
            <p className="text-[10px] text-slate-500 font-bold mb-0.5">الجهاز</p>
            <p className="font-extrabold text-slate-900 truncate">
              {order.device_type} {order.brand ? `· ${order.brand}` : ''}
            </p>
          </div>

          {/* التاريخ والوقت */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-none">
            <p className="text-[10px] text-slate-500 font-bold mb-0.5">التاريخ والوقت</p>
            <p className="font-bold text-slate-800 text-[11px] truncate">
              {formatOrderDateTime(order.created_at)}
            </p>
          </div>
        </div>

        {/* أزرار التواصل السريعة */}
        <div className="flex items-center gap-2 pt-1">
          <button type="button" className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors">
            <Phone className="w-4 h-4" />
          </button>
          <button type="button" className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors">
            <Send className="w-4 h-4" />
          </button>
          <button type="button" className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          {onDelete && (
            <button 
              type="button"
              onClick={() => onDelete(order)}
              className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors mr-auto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. الجزء المخفي (سجل المراحل والأزرار - لا ينزل ويظهر إلا عند الضغط على تفاصيل) */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="order-details-section overflow-hidden border-t border-slate-200 bg-slate-50"
          >
            <div className="p-4 space-y-3.5">
              {/* سجل مراحل الأوردر */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <History className="w-4 h-4 text-slate-600" />
                    <span>سجل مراحل الأوردر</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">
                    آخر تحديث: {formatOrderDateTime(order.updated_at || order.created_at)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* مرحلة التواصل */}
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-1 font-extrabold text-emerald-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>تواصل</span>
                    </div>
                    <p className="text-[10px] font-bold text-emerald-700 mt-0.5">
                      {formatOrderDateTime(order.created_at)}
                    </p>
                  </div>

                  {/* مرحلة الموعد */}
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-1 font-extrabold text-emerald-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>موعد</span>
                    </div>
                    <p className="text-[10px] font-bold text-emerald-700 mt-0.5">
                      {formatOrderDateTime(order.created_at)}
                    </p>
                  </div>

                  {/* مرحلة التنفيذ */}
                  <div className={`p-2 rounded-xl text-center border ${
                    order.status === 'completed' || order.status === 'inProgress'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}>
                    <div className="flex items-center justify-center gap-1 font-bold">
                      <span className={`w-2 h-2 rounded-full ${order.status === 'completed' ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                      <span>تنفيذ</span>
                    </div>
                    <p className="text-[10px] font-semibold mt-0.5">
                      {order.status === 'completed' ? formatOrderDateTime(order.updated_at) : 'لم تكتمل بعد'}
                    </p>
                  </div>

                  {/* مرحلة التحصيل والإغلاق */}
                  <div className={`p-2 rounded-xl text-center border ${
                    order.is_paid 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}>
                    <div className="flex items-center justify-center gap-1 font-bold">
                      <span className={`w-2 h-2 rounded-full ${order.is_paid ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                      <span>التحصيل والإغلاق</span>
                    </div>
                    <p className="text-[10px] font-semibold mt-0.5">
                      {order.is_paid ? 'تم التحصيل' : 'لم تكتمل بعد'}
                    </p>
                  </div>
                </div>
              </div>

              {/* أزرار الإجراءات السفلية */}
              <div className="flex gap-2 pt-1">
                {onAssignTech && (
                  <button
                    type="button"
                    onClick={() => onAssignTech(order)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <User className="w-4 h-4" />
                    <span>تحويل لفني آخر</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelect?.(order)}
                  className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-200 font-bold py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5"
                >
                  <Badge className="w-4 h-4" />
                  <span>إيصال</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
