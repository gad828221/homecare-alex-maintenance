import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { User, Phone, MapPin, Wrench, AlertCircle, Trash2, Plus, CheckCircle, Clock } from "lucide-react";

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
  date: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    address: "",
    device: "",
    brand: "",
    problem: "",
  });
  const [submitMessage, setSubmitMessage] = useState("");

  // تحميل الأوردرات من Local Storage عند فتح الصفحة
  useEffect(() => {
    const savedOrders = localStorage.getItem("maintenanceOrders");
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  }, []);

  // حفظ الأوردرات في Local Storage
  const saveOrdersToStorage = (updatedOrders: Order[]) => {
    localStorage.setItem("maintenanceOrders", JSON.stringify(updatedOrders));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newOrder: Order = {
      id: Date.now().toString(),
      orderNumber: `MG-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 10000)}`,
      customerName: formData.customerName,
      phone: formData.phone,
      address: formData.address,
      device: formData.device,
      brand: formData.brand,
      problem: formData.problem,
      status: "pending",
      date: new Date().toLocaleString("ar-EG"),
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    saveOrdersToStorage(updatedOrders);

    setFormData({
      customerName: "",
      phone: "",
      address: "",
      device: "",
      brand: "",
      problem: "",
    });

    setSubmitMessage("✅ تم إضافة الأوردر بنجاح!");
    setTimeout(() => setSubmitMessage(""), 3000);
  };

  const deleteOrder = (id: string) => {
    const updatedOrders = orders.filter((order) => order.id !== id);
    setOrders(updatedOrders);
    saveOrdersToStorage(updatedOrders);
  };

  const updateOrderStatus = (id: string, newStatus: "pending" | "in-progress" | "completed") => {
    const updatedOrders = orders.map((order) =>
      order.id === id ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    saveOrdersToStorage(updatedOrders);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "قيد الانتظار";
      case "in-progress":
        return "قيد التنفيذ";
      case "completed":
        return "مكتمل";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-orange-50 py-12">
      <div className="container max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-orange-600 bg-clip-text text-transparent">
            📋 إدارة الأوردرات
          </h1>
          <p className="text-2xl text-gray-700 font-semibold">استقبال وإدارة أوردرات الصيانة</p>
          <div className="w-32 h-1 bg-gradient-to-r from-orange-400 to-red-500 mx-auto mt-6 rounded-full"></div>
          <p className="text-gray-600 mt-4 text-lg">إجمالي الأوردرات: <span className="font-bold text-orange-600 text-2xl">{orders.length}</span></p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <Card className="p-10 shadow-2xl border-3 border-orange-300 bg-gradient-to-br from-white to-blue-50/50 sticky top-8 rounded-2xl">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                أوردر جديد
              </h2>

              {submitMessage && (
                <div className="mb-6 p-4 bg-green-100 border-2 border-green-400 text-green-800 rounded-lg text-center font-semibold">
                  {submitMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-orange-500" />
                    اسم العميل
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-5 py-3 bg-white border-2 border-orange-200 text-gray-800 rounded-lg focus:outline-none focus:ring-3 focus:ring-orange-500 focus:border-transparent transition-all text-base font-semibold placeholder-gray-400"
                    placeholder="اسم العميل"
                  />
                </div>

                <div>
                  <label className="block text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-orange-500" />
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-5 py-3 bg-white border-2 border-orange-200 text-gray-800 rounded-lg focus:outline-none focus:ring-3 focus:ring-orange-500 focus:border-transparent transition-all text-base font-semibold placeholder-gray-400"
                    placeholder="01234567890"
                  />
                </div>

                <div>
                  <label className="block text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    العنوان
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-5 py-3 bg-white border-2 border-orange-200 text-gray-800 rounded-lg focus:outline-none focus:ring-3 focus:ring-orange-500 focus:border-transparent transition-all text-base font-semibold placeholder-gray-400"
                    placeholder="العنوان بالتفصيل"
                  />
                </div>

                <div>
                  <label className="block text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-orange-500" />
                    نوع الجهاز
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.device}
                    onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                    className="w-full px-5 py-3 bg-white border-2 border-orange-200 text-gray-800 rounded-lg focus:outline-none focus:ring-3 focus:ring-orange-500 focus:border-transparent transition-all text-base font-semibold placeholder-gray-400"
                    placeholder="ثلاجة، غسالة، إلخ"
                  />
                </div>

                <div>
                  <label className="block text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-orange-500" />
                    الماركة
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-5 py-3 bg-white border-2 border-orange-200 text-gray-800 rounded-lg focus:outline-none focus:ring-3 focus:ring-orange-500 focus:border-transparent transition-all text-base font-semibold placeholder-gray-400"
                    placeholder="Samsung, LG, إلخ"
                  />
                </div>

                <div>
                  <label className="block text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    المشكلة
                  </label>
                  <textarea
                    required
                    value={formData.problem}
                    onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                    className="w-full px-5 py-3 bg-white border-2 border-orange-200 text-gray-800 rounded-lg focus:outline-none focus:ring-3 focus:ring-orange-500 focus:border-transparent transition-all text-base font-semibold placeholder-gray-400"
                    placeholder="وصف المشكلة"
                    rows={4}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg rounded-xl hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 shadow-lg active:scale-95"
                >
                  ➕ إضافة أوردر جديد
                </button>
              </form>
            </Card>
          </div>

          {/* Orders List Section */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {orders.length === 0 ? (
                <Card className="p-12 text-center border-2 border-orange-200 bg-gradient-to-br from-white to-blue-50/50">
                  <p className="text-gray-500 text-lg">لا توجد أوردرات حالياً</p>
                </Card>
              ) : (
                orders.map((order) => (
                  <Card
                    key={order.id}
                    className="p-6 shadow-lg border-2 border-orange-200 bg-gradient-to-br from-white to-blue-50/50 hover:shadow-orange-500/30 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">#{order.orderNumber}</h3>
                        <p className="text-sm text-gray-500">{order.date}</p>
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                          className={`px-3 py-1 rounded-lg font-semibold border-2 text-sm cursor-pointer ${getStatusColor(order.status)}`}
                        >
                          <option value="pending">قيد الانتظار</option>
                          <option value="in-progress">قيد التنفيذ</option>
                          <option value="completed">مكتمل</option>
                        </select>
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-orange-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">العميل</p>
                          <p className="font-semibold text-gray-800">{order.customerName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-orange-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">الهاتف</p>
                          <p className="font-semibold text-gray-800">{order.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">العنوان</p>
                          <p className="font-semibold text-gray-800 text-sm">{order.address}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Wrench className="w-5 h-5 text-orange-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">الجهاز</p>
                          <p className="font-semibold text-gray-800">{order.device} - {order.brand}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                      <p className="text-xs text-gray-500 mb-1">المشكلة:</p>
                      <p className="text-gray-800 font-medium">{order.problem}</p>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
