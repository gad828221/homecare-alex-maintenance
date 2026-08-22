import { motion } from "framer-motion";
import { Clock, AlertCircle, Zap, CheckCircle2, User, Phone, MapPin, Wrench, Badge } from "lucide-react";
import { formatOrderDateTime, parseOrderDate } from '../utils/orderTiming';

interface OrderCardProps {
  order: any;
  onSelect?: (order: any) => void;
  onAssignTech?: (order: any) => void;
}

export function OrderCard({ order, onSelect, onAssignTech }: OrderCardProps) {
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
      pending: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800', icon: AlertCircle, label: 'قيد الانتظار' },
      inProgress: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', icon: Zap, label: 'قيد المعالجة' },
      completed: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', icon: CheckCircle2, label: 'مكتمل' },
      cancelled: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', icon: AlertCircle, label: 'ملغى' },
      inspected: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', icon: CheckCircle2, label: 'تم الفحص' }
    };
    return styles[status] || styles.pending;
  };

  const statusStyle = getStatusStyle(order.status);
  const StatusIcon = statusStyle.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
      transition={{ duration: 0.3 }}
      onClick={() => onSelect?.(order)}
      className="bg-white rounded-2xl border-2 border-slate-200 hover:border-orange-300 overflow-hidden cursor-pointer transition-all shadow-lg hover:shadow-2xl"
    >
      {/* Header with badges */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-black text-slate-900">{order.customer_name}</h3>
            <p className="text-sm text-slate-500 font-bold">#{order.order_number}</p>
          </div>
          <div className="flex gap-2">
            {/* New Badge */}
            {isNew() && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-lg"
              >
                <Badge className="w-3 h-3" /> جديد
              </motion.div>
            )}
            
            {/* No Tech Badge */}
            {noTechAssigned && (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-lg"
              >
                <AlertCircle className="w-3 h-3" /> بدون فني
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-6 py-5 space-y-4">
        {/* Device info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold">الجهاز</p>
              <p className="text-sm font-black text-slate-900">{order.device_type}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Badge className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold">الماركة</p>
              <p className="text-sm font-black text-slate-900">{order.brand}</p>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-xl">
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="font-mono font-bold text-slate-900">{order.phone}</span>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="w-4 h-4 text-red-600 flex-shrink-0 mt-1" />
            <span className="font-bold text-slate-900">{order.address}</span>
          </div>
        </div>

        {/* Problem description */}
        {order.problem_description && (
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
            <p className="text-xs text-yellow-700 font-bold mb-2">وصف العطل:</p>
            <p className="text-sm text-slate-900 font-bold line-clamp-2">{order.problem_description}</p>
          </div>
        )}

        {/* Date and time */}
        <div className="flex items-center gap-3 bg-slate-100 p-4 rounded-xl">
          <Clock className="w-5 h-5 text-slate-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-500 font-bold">تاريخ الطلب</p>
            <p className="text-sm font-black text-slate-900">{formatOrderDateTime(order.created_at)}</p>
          </div>
        </div>

        {/* Status */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${statusStyle.bg} ${statusStyle.border}`}>
          <StatusIcon className={`w-5 h-5 ${statusStyle.text} flex-shrink-0`} />
          <div>
            <p className={`text-xs font-bold ${statusStyle.text}`}>الحالة</p>
            <p className={`text-sm font-black ${statusStyle.text}`}>{statusStyle.label}</p>
          </div>
        </div>

        {/* Technician info */}
        {order.technician && (
          <div className="flex items-center gap-3 bg-green-50 p-4 rounded-xl border border-green-200">
            <User className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-green-700 font-bold">الفني المعين</p>
              <p className="text-sm font-black text-green-900">{order.technician}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex gap-3">
        {noTechAssigned && onAssignTech && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onAssignTech(order);
            }}
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black py-2 rounded-lg transition-all text-sm"
          >
            تعيين فني
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(order);
          }}
          className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-black py-2 rounded-lg transition-all text-sm"
        >
          التفاصيل
        </motion.button>
      </div>
    </motion.div>
  );
}
