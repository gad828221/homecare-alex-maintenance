import { Card } from "@/components/ui/card";
import { MessageCircle, CheckCircle, User, Phone, Wrench, MapPin, Zap, Shield, Gift } from "lucide-react";
import { useState } from "react";

interface BookingFormProps {
  title?: string;
  description?: string;
  defaultService?: string;
}

export default function BookingForm({ 
  title = "احجز خدمتك الآن", 
  description = "استجابة سريعة وخدمة احترافية",
  defaultService = ""
}: BookingFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    service: defaultService,
    address: "",
    brand: "",
    problem: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const serviceNames: { [key: string]: string } = {
    fridge: "صيانة الثلاجات",
    washer: "صيانة الغسالات",
    ac: "صيانة المكيفات",
    oven: "صيانة الأفران",
    heater: "صيانة السخانات",
    dishwasher: "صيانة غسالات الأطباق",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 1️⃣ حفظ البيانات تلقائياً في صفحة الأوردرات
      const newOrder = {
        id: Date.now().toString(),
        orderNumber: `MG-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 10000)}`,
        customerName: formData.name,
        phone: formData.phone,
        address: formData.address,
        device: serviceNames[formData.service] || formData.service,
        brand: formData.brand,
        problem: formData.problem,
        status: "pending",
        assignedTechnician: null,
        date: new Date().toLocaleString("ar-EG"),
      };

      // حفظ في Local Storage
      const savedOrders = localStorage.getItem("maintenanceOrders");
      const orders = savedOrders ? JSON.parse(savedOrders) : [];
      orders.unshift(newOrder);
      localStorage.setItem("maintenanceOrders", JSON.stringify(orders));

      // 2️⃣ إرسال البيانات إلى Netlify Forms
      const formElement = e.currentTarget as HTMLFormElement;
      const formDataObj = new FormData(formElement);
      
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formDataObj as any).toString(),
      });

      if (response.ok) {
        setSubmitMessage("✅ تم حفظ طلبك! جاري التوجيه إلى WhatsApp...");
      }
    } catch (error) {
      console.error("Error:", error);
    }

    // 3️⃣ إرسال رسالة WhatsApp
    const serviceName = serviceNames[formData.service] || formData.service;
    const message = `🔧 *طلب صيانة جديد*\n\n👤 *الاسم:* ${formData.name}\n📞 *الهاتف:* ${formData.phone}\n🔨 *الخدمة:* ${serviceName}\n🏷️ *الماركة:* ${formData.brand}\n⚠️ *المشكلة:* ${formData.problem}\n📍 *العنوان:* ${formData.address}\n\n⏰ *الوقت:* ${new Date().toLocaleString("ar-EG")}`;
    const whatsappUrl = `https://wa.me/201558625259?text=${encodeURIComponent(message)}`;
    
    // فتح WhatsApp
    window.open(whatsappUrl, "_blank");
    
    // إظهار رسالة تأكيد
    if (!submitMessage) {
      setSubmitMessage("✅ تم حفظ طلبك وإرساله عبر WhatsApp! سيتم التواصل معك قريباً.");
    }
    
    // إعادة تعيين النموذج
    setTimeout(() => {
      setFormData({ name: "", phone: "", service: defaultService, address: "", brand: "", problem: "" });
      setIsSubmitting(false);
      setSubmitMessage("");
    }, 3000);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-blue-50 via-white to-orange-50">
      <div className="container max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-orange-600 bg-clip-text text-transparent">{title}</h2>
          <p className="text-xl text-gray-700">{description}</p>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-500 mx-auto mt-6 rounded-full"></div>
        </div>
        
        <Card className="p-10 shadow-2xl border-2 border-orange-200 bg-gradient-to-br from-white to-blue-50/50 hover:shadow-orange-500/30 transition-all duration-300">
          {submitMessage && (
            <div className="mb-8 p-5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400 text-green-300 rounded-xl flex items-center gap-3 animate-pulse">
              <CheckCircle className="w-6 h-6 flex-shrink-0 text-green-400" />
              <span className="font-semibold text-lg">{submitMessage}</span>
            </div>
          )}
          
          <form 
            onSubmit={handleSubmit} 
            className="space-y-6"
            name="booking"
            method="POST"
            netlify
          >
            <input type="hidden" name="form-name" value="booking" />
            
            {/* Row 1: Name and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group">
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-5 py-3 bg-white border-2 border-orange-200 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all group-hover:border-orange-400"
                  placeholder="أدخل اسمك الكامل"
                />
              </div>

              <div className="group">
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-orange-500" />
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-5 py-3 bg-white border-2 border-orange-200 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all group-hover:border-orange-400"
                  placeholder="01234567890"
                />
              </div>
            </div>

            {/* Row 2: Service Only */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <div className="group">
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-orange-500" />
                  نوع الخدمة المطلوبة
                </label>
                <select
                  name="service"
                  required
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-5 py-3 bg-white border-2 border-orange-200 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all group-hover:border-orange-400"
                >
                  <option value="">اختر الخدمة</option>
                  <option value="fridge">❄️ صيانة الثلاجات</option>
                  <option value="washer">🌊 صيانة الغسالات</option>
                  <option value="ac">❄️ صيانة المكيفات</option>
                  <option value="oven">🔥 صيانة الأفران</option>
                  <option value="heater">🌡️ صيانة السخانات</option>
                  <option value="dishwasher">🍽️ صيانة غسالات الأطباق</option>
                </select>
              </div>
            </div>

            {/* Row 3: Brand and Problem */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group">
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-orange-500" />
                  ماركة الجهاز
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-5 py-3 bg-white border-2 border-orange-200 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all group-hover:border-orange-400"
                  placeholder="مثال: سامسونج، LG، توشيبا"
                />
              </div>

              <div className="group">
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  وصف المشكلة (اختياري)
                </label>
                <input
                  type="text"
                  name="problem"
                  value={formData.problem}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                  className="w-full px-5 py-3 bg-white border-2 border-orange-200 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all group-hover:border-orange-400"
                  placeholder="مثال: الغسالة بتسرب مياه"
                />
              </div>
            </div>

            {/* Address */}
            <div className="group">
              <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                العنوان بالتفصيل
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-5 py-3 bg-white border-2 border-orange-200 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all group-hover:border-orange-400"
                placeholder="مثال: سموحة، شارع عزيز كحيل"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 hover:from-orange-600 hover:via-orange-700 hover:to-red-700 text-white font-bold text-lg py-4 transition-all transform hover:scale-105 shadow-xl hover:shadow-orange-500/50 rounded-lg flex items-center justify-center gap-3"
            >
              <MessageCircle className="w-6 h-6" />
              {isSubmitting ? "جاري الإرسال..." : "احجز الآن عبر WhatsApp"}
            </button>
          </form>

          {/* Additional Info - Enhanced */}
          <div className="mt-10 pt-10 border-t-2 border-slate-600">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-2 border-orange-500/30 rounded-xl hover:border-orange-500/60 transition-all transform hover:scale-105">
                <div className="flex items-center justify-center mb-3">
                  <Zap className="w-8 h-8 text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-orange-400 text-center">60 دقيقة</p>
                <p className="text-sm text-gray-300 text-center mt-2">وصول الفني</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-2 border-blue-500/30 rounded-xl hover:border-blue-500/60 transition-all transform hover:scale-105">
                <div className="flex items-center justify-center mb-3">
                  <Shield className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-blue-400 text-center">ضمان</p>
                <p className="text-sm text-gray-300 text-center mt-2">على جميع الإصلاحات</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/30 rounded-xl hover:border-green-500/60 transition-all transform hover:scale-105">
                <div className="flex items-center justify-center mb-3">
                  <Gift className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-green-400 text-center">خصم 20%</p>
                <p className="text-sm text-gray-300 text-center mt-2">للعملاء الجدد</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
