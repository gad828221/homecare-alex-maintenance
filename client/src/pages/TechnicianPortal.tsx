import { useState, useEffect } from "react";
import { CheckCircle, Clock, AlertCircle, LogOut, Phone, MapPin, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  device: string;
  brand: string;
  problem: string;
  status: "pending" | "in-progress" | "completed";
  assignedTechnician: string | null;
  date: string;
  technicianNotes?: string;
}

interface Technician {
  id: string;
  name: string;
  phone: string;
}

export default function TechnicianPortal() {
  const navigate = useNavigate();
  const [techPhone, setTechPhone] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [currentTech, setCurrentTech] = useState<Technician | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedNotes = localStorage.getItem("technicianNotes");
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const technicians = JSON.parse(localStorage.getItem("technicians") || "[]");
    const tech = technicians.find((t: Technician) => t.phone === techPhone);
    
    if (tech) {
      setCurrentTech(tech);
      setIsAuthenticated(true);
      
      // جلب الأوردرات المعينة لهذا الفني
      const allOrders = JSON.parse(localStorage.getItem("maintenanceOrders") || "[]");
      const techOrders = allOrders.filter((o: Order) => o.assignedTechnician === tech.id);
      setMyOrders(techOrders);
    } else {
      alert("رقم الهاتف غير مسجل في النظام");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentTech(null);
    setTechPhone("");
    setMyOrders([]);
  };

  const updateOrderStatus = (orderId: string, newStatus: "pending" | "in-progress" | "completed") => {
    const allOrders = JSON.parse(localStorage.getItem("maintenanceOrders") || "[]");
    const updatedOrders = allOrders.map((o: Order) => 
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    localStorage.setItem("maintenanceOrders", JSON.stringify(updatedOrders));
    
    setMyOrders(myOrders.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ));
  };

  const updateNotes = (orderId: string, note: string) => {
    const newNotes = { ...notes, [orderId]: note };
    setNotes(newNotes);
    localStorage.setItem("technicianNotes", JSON.stringify(newNotes));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border-2 border-orange-500/30 max-w-md w-full shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">بوابة الفنيين</h1>
            <p className="text-slate-400 mt-2">أدخل رقم هاتفك لعرض أوردراتك</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-3">رقم الهاتف</label>
              <input
                type="tel"
                value={techPhone}
                onChange={(e) => setTechPhone(e.target.value)}
                placeholder="01234567890"
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border-2 border-orange-500/30 focus:border-orange-500 focus:outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-600 hover:from-blue-600 hover:via-blue-700 hover:to-cyan-700 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg"
            >
              دخول
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-500/10 border-2 border-blue-500/30 rounded-lg">
            <p className="text-xs text-slate-300 text-center">
              🔐 ستحتاج إلى رقم الهاتف المسجل في النظام للدخول.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const pendingOrders = myOrders.filter(o => o.status === "pending");
  const inProgressOrders = myOrders.filter(o => o.status === "in-progress");
  const completedOrders = myOrders.filter(o => o.status === "completed");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b-2 border-blue-500/30 p-4 sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">🔧 {currentTech?.name}</h1>
            <p className="text-slate-400 text-sm mt-1">أوردراتك المعينة</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            تسجيل خروج
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-yellow-500/10 border-2 border-yellow-500/30 p-6 rounded-lg">
            <p className="text-sm text-slate-400">قيد الانتظار</p>
            <p className="text-4xl font-bold text-yellow-400">{pendingOrders.length}</p>
          </div>
          <div className="bg-blue-500/10 border-2 border-blue-500/30 p-6 rounded-lg">
            <p className="text-sm text-slate-400">قيد التنفيذ</p>
            <p className="text-4xl font-bold text-blue-400">{inProgressOrders.length}</p>
          </div>
          <div className="bg-green-500/10 border-2 border-green-500/30 p-6 rounded-lg">
            <p className="text-sm text-slate-400">مكتملة</p>
            <p className="text-4xl font-bold text-green-400">{completedOrders.length}</p>
          </div>
        </div>

        {/* Orders */}
        {myOrders.length === 0 ? (
          <div className="bg-slate-800 p-12 rounded-lg border-2 border-slate-700 text-center">
            <AlertCircle className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-xl text-slate-300">لا توجد أوردرات معينة لك حالياً</p>
            <p className="text-slate-400 mt-2">سيتم إضافة الأوردرات هنا عند تعيينها لك</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myOrders.map(order => (
              <div
                key={order.id}
                className="bg-slate-800 rounded-lg border-2 border-slate-700 hover:border-blue-500/50 transition-all overflow-hidden"
              >
                <div
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="p-6 cursor-pointer hover:bg-slate-700/50 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-slate-400">#{order.orderNumber}</p>
                      <p className="text-lg font-bold text-white">{order.customerName}</p>
                      <p className="text-sm text-slate-400 mt-1">{order.device} - {order.brand}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        order.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                        order.status === "in-progress" ? "bg-blue-500/20 text-blue-400" :
                        "bg-green-500/20 text-green-400"
                      }`}>
                        {order.status === "pending" && "⏳ قيد الانتظار"}
                        {order.status === "in-progress" && "🔧 قيد التنفيذ"}
                        {order.status === "completed" && "✅ مكتمل"}
                      </span>
                    </div>
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div className="border-t border-slate-700 p-6 bg-slate-700/30 space-y-4">
                    {/* Order Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-orange-400 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-xs text-slate-400">رقم الهاتف</p>
                          <p className="text-white font-semibold">{order.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-orange-400 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-xs text-slate-400">الموقع</p>
                          <p className="text-white font-semibold">{order.address}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">المشكلة</p>
                      <p className="text-white bg-slate-800 p-3 rounded mt-1">{order.problem}</p>
                    </div>

                    {/* Status Update */}
                    <div>
                      <p className="text-sm font-bold text-slate-300 mb-3">تحديث الحالة</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateOrderStatus(order.id, "pending")}
                          className={`flex-1 px-3 py-2 rounded text-sm font-bold transition-all ${
                            order.status === "pending"
                              ? "bg-yellow-500/30 text-yellow-300 border-2 border-yellow-500"
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          }`}
                        >
                          ⏳ قيد الانتظار
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, "in-progress")}
                          className={`flex-1 px-3 py-2 rounded text-sm font-bold transition-all ${
                            order.status === "in-progress"
                              ? "bg-blue-500/30 text-blue-300 border-2 border-blue-500"
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          }`}
                        >
                          🔧 قيد التنفيذ
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, "completed")}
                          className={`flex-1 px-3 py-2 rounded text-sm font-bold transition-all ${
                            order.status === "completed"
                              ? "bg-green-500/30 text-green-300 border-2 border-green-500"
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          }`}
                        >
                          ✅ مكتمل
                        </button>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <p className="text-sm font-bold text-slate-300 mb-2">ملاحظاتك (اختياري)</p>
                      <textarea
                        value={notes[order.id] || ""}
                        onChange={(e) => updateNotes(order.id, e.target.value)}
                        placeholder="أضف ملاحظات عن العمل (قطع الغيار المستخدمة، المشاكل الإضافية، إلخ)"
                        className="w-full px-3 py-2 bg-slate-800 text-white rounded border-2 border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
