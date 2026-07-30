import { useEffect, useState, useCallback } from "react";
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
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-red-800">
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
    <div>
      {/* Real-time Notification Badge */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-pulse">
          <Bell className="w-5 h-5" />
          <span className="font-bold">{newOrdersCount} أوردر جديد!</span>
        </div>
      )}

      {/* Header with refresh button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">الأوردرات ({orders.length})</h2>
        <button 
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      {/* Loading state */}
      {loading && orders.length === 0 ? (
        <TableSkeleton />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 border-b">
              <tr>
                <th className="px-6 py-3 text-right font-bold">رقم الأوردر</th>
                <th className="px-6 py-3 text-right font-bold">العميل</th>
                <th className="px-6 py-3 text-right font-bold">الجهاز</th>
                <th className="px-6 py-3 text-right font-bold">الحالة</th>
                <th className="px-6 py-3 text-right font-bold">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-mono text-sm">{order.order_number}</td>
                  <td className="px-6 py-3">{order.customer_name}</td>
                  <td className="px-6 py-3">{order.device_type}</td>
                  <td className="px-6 py-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm">{order.created_at?.split('T')[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!loading && orders.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <p className="text-slate-600 font-bold text-lg">لا توجد أوردرات حالياً</p>
        </div>
      )}
    </div>
  );
}
