import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Users, BarChart3, TrendingUp, DollarSign } from "lucide-react";

interface Technician {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  assignedOrders: number;
  completedOrders: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  device: string;
  brand: string;
  problem: string;
  totalCost: number;
  expenses: number;
  netProfit: number;
  technicianPercentage: number;
  companyPercentage: number;
  technicianShare: number;
  companyShare: number;
  status: "pending" | "in-progress" | "completed";
  assignedTechnician: string | null;
  date: string;
}

export default function AdvancedOrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [activeTab, setActiveTab] = useState<"orders" | "technicians" | "analytics">("orders");
  const [newTechnician, setNewTechnician] = useState({ name: "", specialty: "", phone: "" });
  const [editingOrder, setEditingOrder] = useState<string | null>(null);

  // تحميل البيانات من Local Storage
  useEffect(() => {
    const savedOrders = localStorage.getItem("maintenanceOrders");
    const savedTechs = localStorage.getItem("technicians");
    
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    if (savedTechs) setTechnicians(JSON.parse(savedTechs));
  }, []);

  // حفظ الأوردرات
  useEffect(() => {
    localStorage.setItem("maintenanceOrders", JSON.stringify(orders));
  }, [orders]);

  // حفظ الفنيين
  useEffect(() => {
    localStorage.setItem("technicians", JSON.stringify(technicians));
  }, [technicians]);

  // إضافة فني جديد
  const addTechnician = () => {
    if (newTechnician.name && newTechnician.phone) {
      const tech: Technician = {
        id: Date.now().toString(),
        name: newTechnician.name,
        specialty: newTechnician.specialty,
        phone: newTechnician.phone,
        assignedOrders: 0,
        completedOrders: 0,
      };
      setTechnicians([...technicians, tech]);
      setNewTechnician({ name: "", specialty: "", phone: "" });
    }
  };

  // حذف فني
  const deleteTechnician = (id: string) => {
    setTechnicians(technicians.filter(t => t.id !== id));
  };

  // تعيين أوردر لفني
  const assignOrderToTechnician = (orderId: string, technicianId: string) => {
    setOrders(orders.map(o => 
      o.id === orderId ? { ...o, assignedTechnician: technicianId, status: "in-progress" } : o
    ));
  };

  // تغيير حالة الأوردر
  const updateOrderStatus = (orderId: string, newStatus: "pending" | "in-progress" | "completed") => {
    setOrders(orders.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ));
  };

  // حذف أوردر
  const deleteOrder = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
  };

  // إحصائيات
  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === "pending").length,
    inProgressOrders: orders.filter(o => o.status === "in-progress").length,
    completedOrders: orders.filter(o => o.status === "completed").length,
    totalTechnicians: technicians.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalCost, 0),
    totalExpenses: orders.reduce((sum, o) => sum + o.expenses, 0),
    totalProfit: orders.reduce((sum, o) => sum + o.netProfit, 0),
    technicianTotalShare: orders.reduce((sum, o) => sum + o.technicianShare, 0),
    companyTotalShare: orders.reduce((sum, o) => sum + o.companyShare, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "in-progress": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "قيد الانتظار";
      case "in-progress": return "قيد التنفيذ";
      case "completed": return "مكتمل";
      default: return status;
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white">
      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-slate-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-6 py-3 font-bold transition-all whitespace-nowrap ${
            activeTab === "orders"
              ? "border-b-2 border-orange-500 text-orange-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          📋 الأوردرات ({stats.totalOrders})
        </button>
        <button
          onClick={() => setActiveTab("technicians")}
          className={`px-6 py-3 font-bold transition-all whitespace-nowrap ${
            activeTab === "technicians"
              ? "border-b-2 border-orange-500 text-orange-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          👨‍🔧 الفنيين ({stats.totalTechnicians})
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-6 py-3 font-bold transition-all whitespace-nowrap ${
            activeTab === "analytics"
              ? "border-b-2 border-orange-500 text-orange-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          📊 التحليلات
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-4 rounded-lg border border-blue-500/30">
              <p className="text-sm text-slate-400">الإجمالي</p>
              <p className="text-3xl font-bold text-blue-400">{stats.totalOrders}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 p-4 rounded-lg border border-yellow-500/30">
              <p className="text-sm text-slate-400">قيد الانتظار</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.pendingOrders}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 p-4 rounded-lg border border-purple-500/30">
              <p className="text-sm text-slate-400">قيد التنفيذ</p>
              <p className="text-3xl font-bold text-purple-400">{stats.inProgressOrders}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 p-4 rounded-lg border border-green-500/30">
              <p className="text-sm text-slate-400">مكتمل</p>
              <p className="text-3xl font-bold text-green-400">{stats.completedOrders}</p>
            </div>
          </div>

          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-slate-800 p-6 rounded-lg border border-slate-700 hover:border-orange-500/50 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-slate-400">#{order.orderNumber}</p>
                    <p className="text-lg font-bold text-white">{order.customerName}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-slate-400">الهاتف</p>
                    <p className="text-white font-semibold">{order.phone}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">الجهاز</p>
                    <p className="text-white font-semibold">{order.device}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">الماركة</p>
                    <p className="text-white font-semibold">{order.brand}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">الموقع</p>
                    <p className="text-white font-semibold text-xs">{order.address}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-slate-400 text-sm">المشكلة:</p>
                  <p className="text-white">{order.problem || "لم يتم تحديد المشكلة"}</p>
                </div>

                {/* Financial Details */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 p-4 bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-400">التكلفة الإجمالية</p>
                    <p className="text-lg font-bold text-orange-400">{order.totalCost.toFixed(2)} ج.م</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">المصاريف</p>
                    <p className="text-lg font-bold text-red-400">{order.expenses.toFixed(2)} ج.م</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">الربح الصافي</p>
                    <p className="text-lg font-bold text-green-400">{order.netProfit.toFixed(2)} ج.م</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">نصيب الفني (40%)</p>
                    <p className="text-lg font-bold text-blue-400">{order.technicianShare.toFixed(2)} ج.م</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">نصيب الشركة (60%)</p>
                    <p className="text-lg font-bold text-purple-400">{order.companyShare.toFixed(2)} ج.م</p>
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <select
                    value={order.assignedTechnician || ""}
                    onChange={(e) => assignOrderToTechnician(order.id, e.target.value)}
                    className="px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 text-sm"
                  >
                    <option value="">تعيين فني...</option>
                    {technicians.map(tech => (
                      <option key={tech.id} value={tech.id}>{tech.name}</option>
                    ))}
                  </select>

                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                    className="px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 text-sm"
                  >
                    <option value="pending">قيد الانتظار</option>
                    <option value="in-progress">قيد التنفيذ</option>
                    <option value="completed">مكتمل</option>
                  </select>

                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="px-3 py-2 bg-red-500/20 text-red-400 rounded border border-red-500/30 hover:bg-red-500/30 transition-all text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technicians Tab */}
      {activeTab === "technicians" && (
        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-400" />
              إضافة فني جديد
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="اسم الفني"
                value={newTechnician.name}
                onChange={(e) => setNewTechnician({ ...newTechnician, name: e.target.value })}
                className="px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 placeholder-slate-500"
              />
              <input
                type="text"
                placeholder="التخصص (مثال: ثلاجات)"
                value={newTechnician.specialty}
                onChange={(e) => setNewTechnician({ ...newTechnician, specialty: e.target.value })}
                className="px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 placeholder-slate-500"
              />
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="رقم الهاتف"
                  value={newTechnician.phone}
                  onChange={(e) => setNewTechnician({ ...newTechnician, phone: e.target.value })}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 placeholder-slate-500"
                />
                <button
                  onClick={addTechnician}
                  className="px-6 py-2 bg-orange-500 text-white rounded font-bold hover:bg-orange-600 transition-all"
                >
                  إضافة
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {technicians.map(tech => {
              const techOrders = orders.filter(o => o.assignedTechnician === tech.id);
              const techTotalShare = techOrders.reduce((sum, o) => sum + o.technicianShare, 0);
              return (
                <div key={tech.id} className="bg-slate-800 p-6 rounded-lg border border-slate-700 hover:border-orange-500/50 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-lg font-bold text-white">{tech.name}</p>
                      <p className="text-sm text-slate-400">{tech.specialty}</p>
                      <p className="text-sm text-slate-400">📞 {tech.phone}</p>
                    </div>
                    <button
                      onClick={() => deleteTechnician(tech.id)}
                      className="px-3 py-2 bg-red-500/20 text-red-400 rounded border border-red-500/30 hover:bg-red-500/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-700/50 p-3 rounded">
                      <p className="text-xs text-slate-400">أوردرات معينة</p>
                      <p className="text-2xl font-bold text-orange-400">{techOrders.filter(o => o.status !== "completed").length}</p>
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded">
                      <p className="text-xs text-slate-400">مكتملة</p>
                      <p className="text-2xl font-bold text-green-400">{techOrders.filter(o => o.status === "completed").length}</p>
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded">
                      <p className="text-xs text-slate-400">إجمالي الأرباح</p>
                      <p className="text-lg font-bold text-blue-400">{techTotalShare.toFixed(2)} ج.م</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 p-8 rounded-lg border border-orange-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">إجمالي الإيرادات</p>
                  <p className="text-4xl font-bold text-orange-400">{stats.totalRevenue.toFixed(2)}</p>
                  <p className="text-xs text-slate-400 mt-1">ج.م</p>
                </div>
                <DollarSign className="w-16 h-16 text-orange-500/50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 p-8 rounded-lg border border-red-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">إجمالي المصاريف</p>
                  <p className="text-4xl font-bold text-red-400">{stats.totalExpenses.toFixed(2)}</p>
                  <p className="text-xs text-slate-400 mt-1">ج.م</p>
                </div>
                <DollarSign className="w-16 h-16 text-red-500/50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 p-8 rounded-lg border border-green-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">إجمالي الأرباح الصافية</p>
                  <p className="text-4xl font-bold text-green-400">{stats.totalProfit.toFixed(2)}</p>
                  <p className="text-xs text-slate-400 mt-1">ج.م</p>
                </div>
                <TrendingUp className="w-16 h-16 text-green-500/50" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-8 rounded-lg border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">إجمالي أرباح الفنيين</p>
                  <p className="text-4xl font-bold text-blue-400">{stats.technicianTotalShare.toFixed(2)}</p>
                  <p className="text-xs text-slate-400 mt-1">ج.م (40%)</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 p-8 rounded-lg border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">إجمالي أرباح الشركة</p>
                  <p className="text-4xl font-bold text-purple-400">{stats.companyTotalShare.toFixed(2)}</p>
                  <p className="text-xs text-slate-400 mt-1">ج.م (60%)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-bold mb-4">أكثر الأجهزة طلباً</h3>
            <div className="space-y-3">
              {Object.entries(
                orders.reduce((acc, order) => {
                  acc[order.device] = (acc[order.device] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              )
                .sort(([, a], [, b]) => b - a)
                .map(([device, count]) => (
                  <div key={device} className="flex justify-between items-center">
                    <span className="text-white">{device}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 to-red-500"
                          style={{ width: `${(count / stats.totalOrders) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-orange-400 font-bold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-bold mb-4">أداء الفنيين</h3>
            <div className="space-y-3">
              {technicians.map(tech => {
                const techOrders = orders.filter(o => o.assignedTechnician === tech.id);
                const completedByTech = techOrders.filter(o => o.status === "completed").length;
                const techTotalShare = techOrders.reduce((sum, o) => sum + o.technicianShare, 0);
                return (
                  <div key={tech.id} className="flex justify-between items-center p-3 bg-slate-700/50 rounded">
                    <div>
                      <p className="text-white font-semibold">{tech.name}</p>
                      <p className="text-xs text-slate-400">{tech.specialty}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">الأرباح</p>
                        <p className="text-lg font-bold text-green-400">{techTotalShare.toFixed(2)} ج.م</p>
                      </div>
                      <div className="w-32 h-2 bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                          style={{ width: `${techOrders.length > 0 ? (completedByTech / techOrders.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-green-400 font-bold w-12 text-right">{completedByTech}/{techOrders.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
