import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Eye, Search, Phone, MapPin, Wrench, CheckCircle, Clock, XCircle, User, Package } from "lucide-react";

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  phone: string;
  address: string;
  device: string;
  brand: string;
  problem: string;
  status: string;
  assigned_technician: string;
  date: string;
  created_at: string;
}

export default function ProtectedOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating status:", error);
    } else {
      fetchOrders();
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.customer_name.includes(searchTerm) || 
                          order.phone.includes(searchTerm) ||
                          order.order_number.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> قيد الانتظار</span>;
      case "in-progress":
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center gap-1"><Package className="w-3 h-3" /> قيد التنفيذ</span>;
      case "completed":
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> مكتمل</span>;
      case "cancelled":
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> ملغي</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b-2 border-orange-500/30 p-4 sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Eye className="w-6 h-6 text-orange-400" />
            لوحة تحكم الأوردرات
          </h1>
          <p className="text-slate-400 text-sm mt-1">إدارة ومتابعة طلبات الصيانة</p>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto p-6">
        {/* Filters */}
        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="بحث باسم العميل، رقم الهاتف، أو رقم الأوردر..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="in-progress">قيد التنفيذ</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
            <p className="text-2xl font-bold text-white">{orders.length}</p>
            <p className="text-xs text-slate-400">إجمالي الأوردرات</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
            <p className="text-2xl font-bold text-yellow-400">{orders.filter(o => o.status === "pending").length}</p>
            <p className="text-xs text-slate-400">قيد الانتظار</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
            <p className="text-2xl font-bold text-green-400">{orders.filter(o => o.status === "completed").length}</p>
            <p className="text-xs text-slate-400">مكتمل</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
            <p className="text-2xl font-bold text-blue-400">{orders.filter(o => o.status === "in-progress").length}</p>
            <p className="text-xs text-slate-400">قيد التنفيذ</p>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-slate-400 mt-4">جاري تحميل الأوردرات...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">لا توجد أوردرات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr className="border-b border-slate-700">
                  <th className="text-right p-3 text-slate-400 font-medium">رقم الأوردر</th>
                  <th className="text-right p-3 text-slate-400 font-medium">العميل</th>
                  <th className="text-right p-3 text-slate-400 font-medium">الهاتف</th>
                  <th className="text-right p-3 text-slate-400 font-medium">الجهاز</th>
                  <th className="text-right p-3 text-slate-400 font-medium">الحالة</th>
                  <th className="text-right p-3 text-slate-400 font-medium">التاريخ</th>
                  <th className="text-right p-3 text-slate-400 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                    <td className="p-3 text-white font-mono text-sm">{order.order_number}</td>
                    <td className="p-3 text-white">{order.customer_name}</td>
                    <td className="p-3 text-white dir-ltr">{order.phone}</td>
                    <td className="p-3 text-white">
                      <div className="flex flex-col">
                        <span className="text-sm">{order.device}</span>
                        {order.brand && <span className="text-xs text-slate-400">{order.brand}</span>}
                      </div>
                    </td>
                    <td className="p-3">{getStatusBadge(order.status)}</td>
                    <td className="p-3 text-slate-400 text-sm">{order.date}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 text-sm"
                        >
                          تفاصيل
                        </button>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="px-2 py-1 bg-slate-700 text-white rounded-lg border border-slate-600 text-sm"
                        >
                          <option value="pending">قيد الانتظار</option>
                          <option value="in-progress">قيد التنفيذ</option>
                          <option value="completed">مكتمل</option>
                          <option value="cancelled">ملغي</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full p-6 border border-orange-500/30" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">تفاصيل الأوردر</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-slate-400 text-sm">رقم الأوردر</p><p className="text-white font-mono">{selectedOrder.order_number}</p></div>
                <div><p className="text-slate-400 text-sm">التاريخ</p><p className="text-white">{selectedOrder.date}</p></div>
                <div><p className="text-slate-400 text-sm">العميل</p><p className="text-white">{selectedOrder.customer_name}</p></div>
                <div><p className="text-slate-400 text-sm">الهاتف</p><p className="text-white dir-ltr">{selectedOrder.phone}</p></div>
                <div className="col-span-2"><p className="text-slate-400 text-sm">العنوان</p><p className="text-white">{selectedOrder.address}</p></div>
                <div><p className="text-slate-400 text-sm">الجهاز</p><p className="text-white">{selectedOrder.device}</p></div>
                <div><p className="text-slate-400 text-sm">الماركة</p><p className="text-white">{selectedOrder.brand || "غير محدد"}</p></div>
                <div className="col-span-2"><p className="text-slate-400 text-sm">المشكلة</p><p className="text-white">{selectedOrder.problem || "غير محددة"}</p></div>
                <div><p className="text-slate-400 text-sm">الحالة</p>{getStatusBadge(selectedOrder.status)}</div>
                {selectedOrder.assigned_technician && <div><p className="text-slate-400 text-sm">الفني المسند</p><p className="text-white">{selectedOrder.assigned_technician}</p></div>}
              </div>
            </div>
            <button onClick={() => setSelectedOrder(null)} className="mt-6 w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
