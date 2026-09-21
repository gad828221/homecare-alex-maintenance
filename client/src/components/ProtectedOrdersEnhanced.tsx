import { useEffect, useState } from "react";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { TableSkeleton } from "@/components/SkeletonLoader";
import { Bell, RefreshCw } from "lucide-react";

/**
 * Enhanced ProtectedOrders component with Real-time updates
 * This component wraps the original ProtectedOrders with real-time capabilities
 */
export function ProtectedOrdersEnhanced() {
  const { orders, loading, error, refetch } = useRealtimeOrders();
  const [showNotification, setShowNotification] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [previousOrdersCount, setPreviousOrdersCount] = useState(0);

  // Detect new orders and show notification
  useEffect(() => {
    if (orders.length > previousOrdersCount) {
      const newCount = orders.length - previousOrdersCount;
      setNewOrdersCount(newCount);
      setShowNotification(true);
      
      // Play notification sound
      playNotificationSound();
      
      // Hide notification after 5 seconds
      const timer = setTimeout(() => setShowNotification(false), 5000);
      return () => clearTimeout(timer);
    }
    setPreviousOrdersCount(orders.length);
  }, [orders.length, previousOrdersCount]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => console.log('Audio playback failed'));
    } catch (err) {
      console.error('Error playing notification:', err);
    }
  };

  if (error) {
    return (
      <div className="manager-light-theme p-6 rounded-lg bg-red-50 text-red-800">
        <h3 className="font-bold mb-2">خطأ في تحميل البيانات</h3>
        <p>{error}</p>
        <button 
          onClick={refetch}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          إعادة محاولة
        </button>
      </div>
    );
  }

  return (
    <div className="manager-light-theme min-h-screen p-4 sm:p-6">
      {/* Real-time Notification Badge */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-pulse">
          <Bell className="w-5 h-5" />
          <span className="font-bold">{newOrdersCount} أوردر جديد!</span>
        </div>
      )}

      {/* Header with refresh button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900">الأوردرات ({orders.length})</h2>
        <button 
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm font-bold text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      {/* Loading state / Table */}
      {loading && orders.length === 0 ? (
        <TableSkeleton />
      ) : (
        <div className="order-card-3d overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-6 py-3.5 font-extrabold text-sm">رقم الأوردر</th>
                  <th className="px-6 py-3.5 font-extrabold text-sm">العميل</th>
                  <th className="px-6 py-3.5 font-extrabold text-sm">الجهاز</th>
                  <th className="px-6 py-3.5 font-extrabold text-sm">الحالة</th>
                  <th className="px-6 py-3.5 font-extrabold text-sm">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-sm text-slate-900">{order.order_number}</td>
                    <td className="px-6 py-4 font-bold text-sm text-slate-800">{order.customer_name}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">{order.device_type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold inline-block ${
                        order.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        order.status === 'pending' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        order.status === 'cancelled' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                        'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{order.created_at?.split('T')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && orders.length === 0 && (
        <div className="order-card-3d text-center py-12">
          <p className="text-slate-600 font-bold text-lg">لا توجد أوردرات حالياً</p>
        </div>
      )}
    </div>
  );
}
