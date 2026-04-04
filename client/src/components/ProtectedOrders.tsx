import { useState, useEffect } from "react";

export default function ProtectedOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';
        
        const response = await fetch(`${supabaseUrl}/rest/v1/orders?select=*`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        
        const data = await response.json();
        console.log("Orders:", data);
        setOrders(data || []);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  if (loading) return <div className="p-8 text-white text-center">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="container max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">📋 الأوردرات ({orders.length})</h1>
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-slate-800 p-4 rounded-lg border border-orange-500/30">
              <p className="text-white font-bold">{order.customer_name || "غير معروف"}</p>
              <p className="text-slate-400 text-sm">{order.phone || "رقم غير متوفر"}</p>
              <p className="text-slate-400 text-sm">{order.device || "جهاز غير محدد"}</p>
              <p className="text-slate-500 text-xs mt-1">{order.date || "تاريخ غير محدد"}</p>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-12 text-slate-400">لا توجد أوردرات حالياً</div>
          )}
        </div>
      </div>
    </div>
  );
}
