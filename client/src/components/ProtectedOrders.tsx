import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProtectedOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error:", error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="p-8 text-white text-center">جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="container max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">📋 الأوردرات ({orders.length})</h1>
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-slate-800 p-4 rounded-lg border border-orange-500/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-bold">{order.customer_name}</p>
                  <p className="text-slate-400 text-sm">{order.phone}</p>
                  <p className="text-slate-400 text-sm">{order.device}</p>
                  {order.brand && <p className="text-slate-500 text-xs">ماركة: {order.brand}</p>}
                </div>
                <div className="text-left">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {order.status === 'pending' ? 'قيد الانتظار' : 
                     order.status === 'completed' ? 'مكتمل' : 'قيد التنفيذ'}
                  </span>
                  <p className="text-slate-500 text-xs mt-2">{order.date}</p>
                </div>
              </div>
              {order.address && (
                <p className="text-slate-500 text-sm mt-2 border-t border-slate-700 pt-2">
                  📍 {order.address}
                </p>
              )}
              {order.problem && (
                <p className="text-slate-500 text-sm mt-1">
                  ⚠️ {order.problem}
                </p>
              )}
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              لا توجد أوردرات حالياً
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
