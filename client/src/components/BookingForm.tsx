import { Card } from "@/components/ui/card";
import { MessageCircle, CheckCircle, User, Phone, Wrench, MapPin, Zap, Shield, Gift } from "lucide-react";
import { useState, useEffect } from "react";

interface BookingFormProps {
  title?: string;
  description?: string;
  defaultService?: string;
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
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

  // تحميل كود Google Tag مرة واحدة
  useEffect(() => {
    if (!document.querySelector('script[src*="googletagmanager/gtag/js?id=AW-16803756129"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=AW-16803756129';
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(){ window.dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', 'AW-16803756129');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    const serviceName = serviceNames[formData.service] || formData.service;
    
    const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
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
        const errorText = await response.text();
        setSubmitMessage(`❌ فشل الحفظ: ${errorText}`);
        return;
      }

      // تسجيل التحويل في Google Ads
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'conversion', {
          'send_to': 'AW-16803756129/A-hqCJ31ip0cEOHw08w-',
          'value': 1.0,
          'currency': 'EGP'
        });
      }

      const message = `🔧 *طلب صيانة جديد*\n\n👤 *الاسم:* ${formData.name}\n📞 *الهاتف:* ${formData.phone}\n🔨 *الخدمة:* ${serviceName}\n🏷️ *الماركة:* ${formData.brand}\n⚠️ *المشكلة:* ${formData.problem}\n📍 *العنوان:* ${formData.address}`;
      const whatsappUrl = `https://wa.me/201558625259?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

      setSubmitMessage("✅ تم حفظ طلبك وإرساله بنجاح!");
      setFormData({ name: "", phone: "", service: defaultService, address: "", brand: "", problem: "" });
      
    } catch (err: any) {
      setSubmitMessage(`❌ خطأ في الاتصال: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitMessage(""), 5000);
    }
  };

  return (
    <section className="py-12 px-4 bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="container max-w-5xl mx-auto">
        {/* Header Section - تحسين الألوان */}
        <div className="text-center mb-10">
          <div className="inline-block px-4 py-1 bg-orange-100 rounded-full mb-4">
            <span className="text-orange-700 font-bold text-xs tracking-wider">خدمة عملاء 24/7</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
            {description}
          </p>
        </div>
        
        {/* Card Section - تصميم عصري وواضح */}
        <Card className="p-6 md:p-10 shadow-2xl border-0 bg-white rounded-3xl ring-1 ring-slate-100">
          {submitMessage && (
            <div className={`mb-8 p-5 rounded-2xl flex items-center gap-3 ${
              submitMessage.includes("✅") 
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700" 
                : "bg-rose-50 border border-rose-200 text-rose-700"
            }`}>
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
              <span className="font-semibold text-sm">{submitMessage}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Name & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-orange-500" />
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all"
                  placeholder="أدخل اسم العميل"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-orange-500" />
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all"
                  placeholder="01234567890"
                />
              </div>
            </div>

            {/* Service Type - Full Width */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-orange-500" />
                نوع الخدمة
              </label>
              <select
                required
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all appearance-none cursor-pointer"
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

            {/* Row 3: Brand & Problem */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">ماركة الجهاز</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all"
                  placeholder="مثال: سامسونج، LG، توشيبا"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">وصف المشكلة</label>
                <input
                  type="text"
                  value={formData.problem}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all"
                  placeholder="مثال: الغسالة لا تعمل / الثلاجة لا تبرد"
                />
              </div>
            </div>

            {/* Address - Full Width */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                العنوان
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all"
                placeholder="العنوان بالتفصيل (المنطقة، الشارع، رقم العمارة)"
              />
            </div>

            {/* Submit Button - تحسين اللون والتباين */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-lg py-5 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-orange-500/30"
            >
              <MessageCircle className="w-6 h-6" />
              {isSubmitting ? "جاري الإرسال..." : "إرسال الطلب وحفظه"}
            </button>
          </form>

          {/* Features Section - تحسين الألوان */}
          <div className="mt-10 pt-10 border-t-2 border-slate-100">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl text-center hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-xl font-black text-slate-800 leading-none">60 د</p>
                <p className="text-xs text-slate-500 font-bold uppercase mt-2">استجابة سريعة</p>
              </div>
              <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl text-center hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-xl font-black text-slate-800 leading-none">ضمان</p>
                <p className="text-xs text-slate-500 font-bold uppercase mt-2">على جميع الخدمات</p>
              </div>
              <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl text-center hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Gift className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-xl font-black text-slate-800 leading-none">20%</p>
                <p className="text-xs text-slate-500 font-bold uppercase mt-2">خصم أول خدمة</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
