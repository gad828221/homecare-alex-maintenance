import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, CheckCircle } from "lucide-react";
import { useState } from "react";

interface BookingFormProps {
  title?: string;
  description?: string;
  defaultService?: string;
  defaultBrand?: string; // القيمة الافتراضية للماركة (عندما تكون الصفحة خاصة بماركة معينة)
}

export default function BookingForm({ 
  title = "احجز خدمتك الآن", 
  description = "استجابة سريعة وخدمة احترافية",
  defaultService = "",
  defaultBrand = "" // إذا كانت الصفحة خاصة بماركة (مثل LG) نمرر اسم الماركة هنا
}: BookingFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    service: defaultService,
    address: "",
    brand: defaultBrand, // ماركة الجهاز (يكتبها العميل أو تأتي افتراضية)
    problemDesc: "", // وصف المشكلة
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
      // إرسال البيانات إلى Netlify Forms
      const formElement = e.currentTarget as HTMLFormElement;
      const formDataObj = new FormData(formElement);
      
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formDataObj as any).toString(),
      });

      if (response.ok) {
        setSubmitMessage("تم استقبال طلبك بنجاح! سيتم التواصل معك قريباً.");
      }
    } catch (error) {
      console.error("Error submitting form to Netlify:", error);
    }

    // إرسال رسالة WhatsApp
    const serviceName = serviceNames[formData.service] || formData.service;
    const brandText = formData.brand || "غير محدد";
    const problemText = formData.problemDesc || "(بدون وصف)";
    const message = `مرحباً، أنا ${formData.name}\nرقم الهاتف: ${formData.phone}\nالخدمة المطلوبة: ${serviceName}\nماركة الجهاز: ${brandText}\nوصف المشكلة: ${problemText}\nالعنوان: ${formData.address}\n\nأرجو تأكيد الحجز في أقرب وقت.`;
    const whatsappUrl = `https://wa.me/201558625259?text=${encodeURIComponent(message)}`;
    
    // فتح WhatsApp
    window.open(whatsappUrl, "_blank");
    
    // إظهار رسالة تأكيد
    if (!submitMessage) {
      setSubmitMessage("تم إرسال طلب الحجز عبر WhatsApp! سيتم التواصل معك قريباً.");
    }
    
    // إعادة تعيين النموذج (مع الاحتفاظ بالقيم الافتراضية)
    setTimeout(() => {
      setFormData({ 
        name: "", 
        phone: "", 
        service: defaultService, 
        address: "", 
        brand: defaultBrand, // نعيد تعيينها إلى القيمة الافتراضية
        problemDesc: "" 
      });
      setIsSubmitting(false);
      setSubmitMessage("");
    }, 2000);
  };

  return (
    <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
      <div className="container max-w-2xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-slate-900 to-orange-600 bg-clip-text text-transparent">{title}</h2>
          <p className="text-lg text-gray-600">{description}</p>
        </div>
        <Card className="p-8 shadow-2xl border-2 border-orange-100 hover:border-orange-300 transition-all">
          {submitMessage && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 text-green-700 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{submitMessage}</span>
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
            
            {/* الاسم */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">👤 الاسم الكامل</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="أدخل اسمك الكامل"
              />
            </div>

            {/* رقم الهاتف */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">📱 رقم الهاتف</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="01234567890"
              />
            </div>

            {/* نوع الخدمة (كما هو) */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">🔧 نوع الخدمة المطلوبة</label>
              <select
                name="service"
                required
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
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

            {/* ماركة الجهاز (حقل نصي جديد) */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">📱 ماركة الجهاز</label>
              <input
                type="text"
                name="brand"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="مثال: سامسونج، LG، توشيبا، إلخ"
              />
              {formData.brand && formData.brand === defaultBrand && defaultBrand && (
                <p className="text-xs text-gray-500 mt-1">* يمكنك تغيير الماركة إذا لزم الأمر</p>
              )}
            </div>

            {/* وصف المشكلة */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">📝 وصف المشكلة (اختياري)</label>
              <textarea
                name="problemDesc"
                value={formData.problemDesc}
                onChange={(e) => setFormData({ ...formData, problemDesc: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="مثال: الغسالة بتسرب مياه، التكييف مش بيبرد"
                rows={3}
              />
            </div>

            {/* العنوان */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">📍 العنوان بالتفصيل</label>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="مثال: سموحة، شارع عزيز كحيل"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg py-3 transition-all transform hover:scale-105 shadow-lg hover:shadow-green-500/50"
            >
              <MessageCircle className="w-5 h-5 ml-2" />
              {isSubmitting ? "جاري الإرسال..." : "احجز الآن عبر WhatsApp"}
            </Button>
          </form>

          {/* معلومات إضافية (ثابتة) */}
          <div className="mt-8 pt-8 border-t-2 border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">⚡ 60 دقيقة</p>
                <p className="text-sm text-gray-600">وصول الفني</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">✅ ضمان</p>
                <p className="text-sm text-gray-600">على جميع الإصلاحات</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">🎁 خصم 20%</p>
                <p className="text-sm text-gray-600">على أول زيارة</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
