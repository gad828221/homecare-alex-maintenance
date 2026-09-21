import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, AlertCircle, Zap, CheckCircle2, User, Phone, MapPin, Wrench, Badge, ChevronDown, ChevronUp, History } from "lucide-react";
import { formatOrderDateTime, parseOrderDate } from '../utils/orderTiming';

interface OrderCardProps {
  order: any;
  onSelect?: (order: any) => void;
  onAssignTech?: (order: any) => void;
}

export function OrderCard({ order, onSelect, onAssignTech }: OrderCardProps) {
  // حالة التحكم في إظهار وإخفاء التفاصيل وسجل المراحل
  const [showDetails, setShowDetails] = useState(false);

  // Check if order is new (created within last 5 minutes)
  const isNew = () => {
    const createdTime = parseOrderDate(order.created_at)?.getTime();
    if (!createdTime) return false;
    const now = Date.now();
    const diffMinutes = (now - createdTime) / (1000 * 60);
    return diffMinutes >= 0 && diffMinutes < 5;
  };

  // Check if technician is not assigned
  const noTechAssigned = !order.technician || order.technician === '';

  // Get status color and icon
  const getStatusStyle = (status: string) => {
    const styles: Record<string, any> = {
      pending: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-900', icon: AlertCircle, label: 'قيد الانتظار' },
      inProgress: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900', icon: Zap, label: 'قيد المعالجة' },
      completed: { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-900', icon: CheckCircle2, label: 'مكتمل' },
      cancelled: { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-900', icon: AlertCircle, label: 'ملغى' },
      inspected: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900', icon: CheckCircle2, label: 'تم الفحص' }
    };
    return styles[status] || styles.pending;
  };

  const statusStyle = getStatusStyle(order.status);
  const StatusIcon = statusStyle.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 overflow-hidden shadow-sm hover:shadow-md transition-all"
    >
      {/* Header (دائماً ظاهر) */}
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900">{order.customer_name}</h3>
            <p className="text-xs text-slate-600 font-mono font-bold">#{order.order_number}</p>
          </div>
          <div className="flex gap-2 items-center">
            {/* New Badge */}
            {isNew() && (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-rose-600 text-white px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <Badge className="w-3 h-3" /> جديد
              </motion.div>
            )}
            
            {/* No Tech Badge */}
            {noTechAssigned && (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-amber-600 text-white px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <AlertCircle className="w-3 h-3" /> بدون فني
              </motion.div>
            )}

            {/* زر التبديل للتفاصيل */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(!showDetails);
              }}
              className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-800 font-bold px-3 py-1.5 rounded-lg border border-slate-300 text-xs shadow-sm transition-colors"
            >
              <span>التفاصيل</span>
              {showDetails ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* Body Section (يحتوي التفاصيل والسجل - يظهر عند النقر على زر التفاصيل) */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 space-y-4 border-b border-slate-200">
              {/* Device info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-4 h-4 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">الجهاز</p>
                    <p className="text-xs font-bold text-slate-900">{order.device_type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Badge className="w-4 h-4 text-purple-700" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">الماركة</p>
                    <p className="text-xs font-bold text-slate-900">{order.brand}</p>
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-2 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div className="flex items-center gap-2.5 text-xs">
                  <Phone className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span className="font-mono font-bold text-slate-900">{order.phone}</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs">
                  <MapPin className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
                  <span className="font-bold text-slate-800">{order.address}</span>
                </div>
              </div>

              {/* Problem description */}
              {order.problem_description && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <p className="text-xs text-amber-900 font-bold mb-1">وصف العطل:</p>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">{order.problem_description}</p>
                </div>
              )}

              {/* Date and Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <Clock className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">تاريخ الطلب</p>
                    <p className="text-xs font-bold text-slate-900">{formatOrderDateTime(order.created_at)}</p>
                  </div>
                </div>

                <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${statusStyle.bg} ${statusStyle.border}`}>
                  <StatusIcon className={`w-4 h-4 ${statusStyle.text} flex-shrink-0`} />
                  <div>
                    <p className={`text-[10px] font-bold ${statusStyle.text}`}>الحالة</p>
                    <p className={`text-xs font-bold ${statusStyle.text}`}>{statusStyle.label}</p>
                  </div>
                </div>
              </div>

              {/* Technician info */}
              {order.technician && (
                <div className="flex items-center gap-2.5 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <User className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-emerald-800 font-bold">الفني المعين</p>
                    <p className="text-xs font-bold text-emerald-950">{order.technician}</p>
                  </div>
                </div>
              )}

              {/* =========================================
                  سجل مراحل الأوردر
                 ========================================= */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <History className="w-4 h-4 text-slate-600" />
                    <span>سجل مراحل الأوردر</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {formatOrderDateTime(order.updated_at || order.created_at)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-lg text-center">
                    <p className="font-bold">● تواصل</p>
                    <p className="text-[10px] text-emerald-800 font-semibold">مكتمل</p>
                  </div>

                  <div className="p-2 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-lg text-center">
                    <p className="font-bold">● موعد</p>
                    <p className="text-[10px] text-emerald-800 font-semibold">مكتمل</p>
                  </div>

                  <div className="p-2 bg-slate-200/80 border border-slate-300 text-slate-800 rounded-lg text-center">
                    <p className="font-bold">● تنفيذ</p>
                    <p className="text-[10px] text-slate-600 font-semibold">لم تكتمل</p>
                  </div>

                  <div className="p-2 bg-slate-200/80 border border-slate-300 text-slate-800 rounded-lg text-center">
                    <p className="font-bold">● الإغلاق والتحصيل</p>
                    <p className="text-[10px] text-slate-600 font-semibold">لم تكتمل</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer actions */}
      <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex gap-2">
        {noTechAssigned && onAssignTech && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              onAssignTech(order);
            }}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg transition-all text-xs"
          >
            تعيين فني
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(order);
          }}
          className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 rounded-lg transition-all text-xs"
        >
          عرض الملف
        </motion.button>
      </div>
    </motion.div>
  );
}
