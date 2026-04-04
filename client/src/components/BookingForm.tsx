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
      const serviceName = serviceNames[formData.service] || formData.service;
      
      const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';
      
      const response = await fetch(`${supabaseUrl}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          customer_name: formData.name,
          phone: formData.phone,
          address: formData.address,
          device: serviceName,
          brand: formData.brand,
          problem: formData.problem,
          status: 'pending',
          date: new Date().toLocaleString("ar-EG")
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Supabase error:', error);
        setSubmitMessage("❌ خطأ في الحفظ: " + error);
        setIsSubmitting(false);
        return;
      }

      // واتساب
      const message = `🔧 *طلب صيانة جديد*\n\n👤 *الاسم:* ${formData.name}\n📞 *الهاتف:* ${formData.phone}\n🔨 *الخدمة:* ${serviceName}\n🏷️ *الماركة:* ${formData.brand}\n⚠️ *المشكلة:* ${formData.problem}\n📍 *العنوان:* ${formData.address}`;
      const whatsappUrl = `https://wa.me/201558625259?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

      setSubmitMessage("✅ تم حفظ طلبك وإرساله عبر WhatsApp!");
      
      setTimeout(() => {
        setFormData({ name: "", phone: "", service: defaultService, address: "", brand: "", problem: "" });
        setIsSubmitting(false);
        setSubmitMessage("");
      }, 3000);
      
    } catch (err: any) {
      console.error("Error:", err);
      setSubmitMessage("❌ خطأ: " + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-blue-50 via-white to-orange-50">
      <div className="container max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-orange-600 bg-clip-text text-transparent">{title}</h2>
          <p className="text-xl text-gray-700">{description}</p>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-500 mx-auto mt-6 rounded-full"></div>
        </div>
        
        <Card className="p-10 shadow-2xl border-2 border-orange-200 bg-gradient-to-br from-white to-blue-50/50">
          {submitMessage && (
            <div className="mb-8 p-5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400 text-green-300 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <span className="font-semibold text-lg">{submitMessage}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-5 py-3 bg-white border-2 border-orange-200 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="أدخل اسمك الكامل"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-orange-500" />
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-5 py-3 bg-white border-2 border-orange-200 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="01234567890"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-500" />
                نوع الخدمة
              </label>
              <select
                required
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-5 py-3 bg-white border-2 border-orange-200 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">ماركة الجهاز</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-5 py-3 bg-white border-2 border-orange-200 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="مثال: سامسونج، LG"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">وصف المشكلة</label>
                <input
                  type="text"
                  value={formData.problem}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                  className="w-full px-5 py-3 bg-white border-2 border-orange-200 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="مثال: الغسالة لا تعمل"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                العنوان
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-5 py-3 bg-white border-2 border-orange-200 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="العنوان بالتفصيل"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-lg py-4 rounded-lg flex items-center justify-center gap-3"
            >
              <MessageCircle className="w-6 h-6" />
              {isSubmitting ? "جاري الإرسال..." : "احجز الآن عبر WhatsApp"}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t-2 border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-orange-500/10 border border-orange-500/30 rounded-xl text-center">
                <Zap className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-600">60 دقيقة</p>
                <p className="text-sm text-gray-600">وصول الفني</p>
              </div>
              <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl text-center">
                <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">ضمان</p>
                <p className="text-sm text-gray-600">على الإصلاحات</p>
              </div>
              <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
                <Gift className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">خصم 20%</p>
                <p className="text-sm text-gray-600">للعملاء الجدد</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
