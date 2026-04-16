import { Card } from "@/components/ui/card";
import { MessageCircle, CheckCircle, User, Phone, Wrench, MapPin, Zap, Shield, Gift, Star, Clock, Award, ArrowLeft } from "lucide-react";
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const serviceNames: { [key: string]: string } = {
    fridge: "صيانة الثلاجات",
    washer: "صيانة الغسالات",
    ac: "صيانة المكيفات",
    oven: "صيانة الأفران",
    heater: "صيانة السخانات",
    dishwasher: "صيانة غسالات الأطباق",
  };

  // تحميل كود Google Tag
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

  const inputFields = [
    { name: "name", label: "الاسم الكامل", icon: User, type: "text", placeholder: "أدخل اسمك بالكامل", required: true },
    { name: "phone", label: "رقم الهاتف", icon: Phone, type: "tel", placeholder: "مثال: 01234567890", required: true },
    { name: "brand", label: "ماركة الجهاز", icon: Wrench, type: "text", placeholder: "سامسونج - LG - توشيبا - وايت ويل", required: false },
    { name: "problem", label: "وصف المشكلة", icon: Zap, type: "text", placeholder: "مثال: الثلاجة لا تبرد - الغسالة لا تعمل", required: false },
    { name: "address", label: "العنوان", icon: MapPin, type: "text", placeholder: "المنطقة، الشارع، رقم العمارة", required: true },
  ];

  return (
    <section className="py-16 px-4 min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="container max-w-4xl mx-auto">
        {/* Hero Section - تصميم جذاب */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full mb-6 shadow-sm">
            <Star className="w-4 h-4 text-orange-600 fill-orange-600" />
            <span className="text-orange-700 font-bold text-xs tracking-wider">خدمة عملاء 24/7</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
            {title}
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium">استجابة خلال 60 دقيقة</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Award className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium">ضمان على جميع الخدمات</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Shield className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium">فنيون معتمدون</span>
            </div>
          </div>
        </div>
        
        {/* Main Form Card - تصميم عصري */}
        <Card className="relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border-0">
          {/* Decorative Gradient Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500"></div>
          
          <div className="p-6 md:p-10">
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
              {/* Service Selection - مميز */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-orange-500" />
                  نوع الخدمة <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all appearance-none cursor-pointer text-right"
                >
                  <option value="">-- اختر الخدمة المطلوبة --</option>
                  <option value="fridge">❄️ صيانة الثلاجات</option>
                  <option value="washer">🌊 صيانة الغسالات</option>
                  <option value="ac">❄️ صيانة المكيفات</option>
                  <option value="oven">🔥 صيانة الأفران</option>
                  <option value="heater">🌡️ صيانة السخانات</option>
                  <option value="dishwasher">🍽️ صيانة غسالات الأطباق</option>
                </select>
              </div>

              {/* Dynamic Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {inputFields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <field.icon className="w-4 h-4 text-orange-500" />
                      {field.label}
                      {field.required && <span className="text-red-500 text-xs">*</span>}
                    </label>
                    <input
                      type={field.type}
                      required={field.required}
                      value={formData[field.name as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      onFocus={() => setFocusedField(field.name)}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-xl transition-all placeholder:text-slate-400 text-slate-800
                        ${focusedField === field.name 
                          ? "border-orange-400 ring-4 ring-orange-100 outline-none" 
                          : "border-slate-200 hover:border-slate-300"
                        }`}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>

              {/* Submit Button - مميز جداً */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full group overflow-hidden bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-lg py-5 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-orange-500/30"
              >
                <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></span>
                <MessageCircle className="w-6 h-6 relative z-10" />
                <span className="relative z-10">{isSubmitting ? "جاري الإرسال..." : "إرسال الطلب وحفظه"}</span>
                <ArrowLeft className="w-5 h-5 relative z-10 group-hover:translate-x-[-4px] transition-transform" />
              </button>
            </form>

            {/* Features Grid - محسّن */}
            <div className="mt-12 pt-8 border-t-2 border-slate-100">
              <p className="text-center text-slate-500 text-sm mb-6">لماذا تختار خدمتنا؟</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="group p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl text-center hover:shadow-lg transition-all cursor-pointer">
                  <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Zap className="w-7 h-7 text-orange-600" />
                  </div>
                  <p className="text-2xl font-black text-slate-800">60 دقيقة</p>
                  <p className="text-sm text-slate-500 font-medium mt-1">أقصى وقت للاستجابة</p>
                </div>
                <div className="group p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl text-center hover:shadow-lg transition-all cursor-pointer">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Shield className="w-7 h-7 text-blue-600" />
                  </div>
                  <p className="text-2xl font-black text-slate-800">ضمان شامل</p>
                  <p className="text-sm text-slate-500 font-medium mt-1">على قطع الغيار والخدمة</p>
                </div>
                <div className="group p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl text-center hover:shadow-lg transition-all cursor-pointer">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Gift className="w-7 h-7 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-slate-800">20% خصم</p>
                  <p className="text-sm text-slate-500 font-medium mt-1">لأول خدمة</p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mt-8 text-center">
              <p className="text-slate-400 text-xs">
                بتعبئتك لهذا النموذج، أنت توافق على سياسة الخصوصية وشروط الخدمة
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
