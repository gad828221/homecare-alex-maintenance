import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProtectedOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // تأكد من وجود userRole
    const userRole = localStorage.getItem("userRole");
    console.log("userRole:", userRole);
    
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      console.log("Orders loaded:", data);
      setOrders(data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
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
              <p className="text-white font-bold">{order.customer_name}</p>
              <p className="text-slate-400 text-sm">{order.phone}</p>
              <p className="text-slate-400 text-sm">{order.device}</p>
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
