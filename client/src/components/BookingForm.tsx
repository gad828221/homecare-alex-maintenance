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

  // تحميل كود Google Tag مرة واحدة عند تحميل المكون
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

      // ✅ تسجيل التحويل في Google Ads
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
    <section className="py-6 bg-transparent">
      <div className="container max-w-4xl px-0">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black mb-2 text-white">{title}</h2>
          <p className="text-sm text-slate-400 font-bold">{description}</p>
        </div>
        
        <Card className="p-4 md:p-10 shadow-2xl border-2 border-slate-800 bg-slate-900 rounded-[2.5rem]">
          {submitMessage && (
            <div className={`mb-8 p-5 rounded-2xl flex items-center gap-3 border-2 ${submitMessage.includes("✅") ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
              <span className="font-black text-sm">{submitMessage}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase pr-2 flex items-center gap-2">
                  <User className="w-3 h-3 text-orange-500" />
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-800 border-2 border-slate-700 text-white rounded-2xl focus:outline-none focus:border-orange-500 transition-all"
                  placeholder="أدخل اسم العميل"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase pr-2 flex items-center gap-2">
                  <Phone className="w-3 h-3 text-orange-500" />
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-800 border-2 border-slate-700 text-white rounded-2xl focus:outline-none focus:border-orange-500 transition-all"
                  placeholder="01234567890"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase pr-2 flex items-center gap-2">
                <Wrench className="w-3 h-3 text-orange-500" />
                نوع الخدمة
              </label>
              <select
                required
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-5 py-3.5 bg-slate-800 border-2 border-slate-700 text-white rounded-2xl focus:outline-none focus:border-orange-500 transition-all appearance-none"
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
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase pr-2">ماركة الجهاز</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-800 border-2 border-slate-700 text-white rounded-2xl focus:outline-none focus:border-orange-500 transition-all"
                  placeholder="مثال: سامسونج، LG"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase pr-2">وصف المشكلة</label>
                <input
                  type="text"
                  value={formData.problem}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-800 border-2 border-slate-700 text-white rounded-2xl focus:outline-none focus:border-orange-500 transition-all"
                  placeholder="مثال: الغسالة لا تعمل"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase pr-2 flex items-center gap-2">
                <MapPin className="w-3 h-3 text-orange-500" />
                العنوان
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-5 py-3.5 bg-slate-800 border-2 border-slate-700 text-white rounded-2xl focus:outline-none focus:border-orange-500 transition-all"
                placeholder="العنوان بالتفصيل"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg shadow-orange-900/20"
            >
              <MessageCircle className="w-6 h-6" />
              {isSubmitting ? "جاري الإرسال..." : "إرسال الطلب وحفظه"}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t-2 border-slate-800">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-slate-800 rounded-2xl text-center border border-slate-700">
                <Zap className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-lg font-black text-white leading-none">60 د</p>
                <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">سرعة</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-2xl text-center border border-slate-700">
                <Shield className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-lg font-black text-white leading-none">ضمان</p>
                <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">أمان</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-2xl text-center border border-slate-700">
                <Gift className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-lg font-black text-white leading-none">20%</p>
                <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">خصم</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
