import { useState, useEffect } from "react";
import { MessageCircle, CheckCircle, User, Phone, Wrench, MapPin, AlertCircle, Star, ShieldCheck } from "lucide-react";

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

const DEVICE_TYPES = ['غسالة', 'ثلاجة', 'بوتاجاز', 'سخان', 'تكييف', 'ميكروويف', 'غسالة أطباق'];
const BRANDS = ['سامسونج', 'LG', 'شارب', 'توشيبا', 'زانوسي', 'يونيون إير', 'فريش', 'وايت ويل', 'أريستون', 'بيكو', 'هوفر', 'إنديست'];

interface BookingFormProps {
  defaultService?: string;
  title?: string;
}

export default function BookingForm({ defaultService, title }: BookingFormProps) {
  const [formData, setFormData] = useState({
    customer_name: "",
    phone: "",
    device_type: "",
    address: "",
    brand: "",
    problem_description: "",
  });
  
  useEffect(() => {
    if (defaultService) {
      // Extract brand if defaultService contains it
      const foundBrand = BRANDS.find(b => defaultService.includes(b));
      if (foundBrand) setFormData(prev => ({ ...prev, brand: foundBrand }));
    }
  }, [defaultService]);

  const [isOtherDevice, setIsOtherDevice] = useState(false);
  const [customDevice, setCustomDevice] = useState("");
  const [isOtherBrand, setIsOtherBrand] = useState(false);
  const [customBrand, setCustomBrand] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    const finalDeviceType = isOtherDevice ? customDevice : formData.device_type;
    const finalBrand = isOtherBrand ? customBrand : formData.brand;
    
    const orderNumber = `MG-${Date.now()}`;
    const orderToSave = {
      order_number: orderNumber,
      customer_name: formData.customer_name,
      phone: formData.phone,
      device_type: finalDeviceType,
      address: formData.address,
      brand: finalBrand,
      problem_description: formData.problem_description,
      status: 'pending',
      date: new Date().toLocaleDateString("ar-EG"),
      created_at: new Date().toISOString()
    };

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify(orderToSave)
      });

      if (response.ok) {
        setSubmitMessage("✅ تم استلام طلبك بنجاح! سنتواصل معك خلال 5 دقائق.");
        setFormData({
          customer_name: "",
          phone: "",
          device_type: "",
          address: "",
          brand: "",
          problem_description: "",
        });
        
        // إرسال إشعار للمديرين
        try {
          await fetch('/.netlify/functions/send-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: '📋 أوردر جديد من الموقع',
              message: `عميل جديد: ${formData.customer_name} - جهاز: ${finalDeviceType}`,
              tags: true
            })
          });
        } catch (err) { console.error('Push Error:', err); }

        const whatsappUrl = `https://wa.me/201558625259?text=${encodeURIComponent(`أوردر جديد: ${orderNumber}\nالاسم: ${formData.customer_name}\nالجهاز: ${finalDeviceType}\nالعنوان: ${formData.address}`)}`;
        window.open(whatsappUrl, "_blank");
      } else {
        throw new Error("فشل في إرسال الطلب");
      }
    } catch (err: any) {
      setSubmitMessage(`❌ خطأ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-10 border border-slate-100 w-full" dir="rtl">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-4 py-1.5 rounded-full mb-4 text-xs font-black">
          <ShieldCheck className="w-4 h-4" /> اتصال آمن ومشفر
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">{title || "احجز موعد الصيانة"}</h2>
        <p className="text-slate-500 font-bold">نصلك في منزلك بالإسكندرية خلال ساعة واحدة</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700 flex items-center gap-2 mr-1">
              <User className="w-4 h-4 text-orange-600" /> الاسم بالكامل
            </label>
            <input
              type="text"
              required
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-orange-500 focus:bg-white transition-all font-bold"
              placeholder="مثال: أحمد محمد"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700 flex items-center gap-2 mr-1">
              <Phone className="w-4 h-4 text-orange-600" /> رقم الموبايل
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-orange-500 focus:bg-white transition-all font-bold"
              placeholder="01xxxxxxxxx"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700 flex items-center gap-2 mr-1">
              <Wrench className="w-4 h-4 text-orange-600" /> نوع الجهاز
            </label>
            <select
              required
              value={isOtherDevice ? "other" : formData.device_type}
              onChange={(e) => {
                if (e.target.value === "other") {
                  setIsOtherDevice(true);
                  setFormData({ ...formData, device_type: "" });
                } else {
                  setIsOtherDevice(false);
                  setFormData({ ...formData, device_type: e.target.value });
                }
              }}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-orange-500 focus:bg-white transition-all font-bold appearance-none cursor-pointer"
            >
              <option value="">اختر الجهاز</option>
              {DEVICE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              <option value="other">أخرى...</option>
            </select>
            {isOtherDevice && (
              <input
                type="text"
                required
                value={customDevice}
                onChange={(e) => setCustomDevice(e.target.value)}
                className="w-full mt-2 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-orange-500 transition-all font-bold"
                placeholder="اكتب نوع الجهاز"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700 flex items-center gap-2 mr-1">
              <Star className="w-4 h-4 text-orange-600" /> الماركة
            </label>
            <select
              required
              value={isOtherBrand ? "other" : formData.brand}
              onChange={(e) => {
                if (e.target.value === "other") {
                  setIsOtherBrand(true);
                  setFormData({ ...formData, brand: "" });
                } else {
                  setIsOtherBrand(false);
                  setFormData({ ...formData, brand: e.target.value });
                }
              }}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-orange-500 focus:bg-white transition-all font-bold appearance-none cursor-pointer"
            >
              <option value="">اختر الماركة</option>
              {BRANDS.map(brand => <option key={brand} value={brand}>{brand}</option>)}
              <option value="other">أخرى...</option>
            </select>
            {isOtherBrand && (
              <input
                type="text"
                required
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                className="w-full mt-2 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-orange-500 transition-all font-bold"
                placeholder="اكتب الماركة"
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700 flex items-center gap-2 mr-1">
            <MapPin className="w-4 h-4 text-orange-600" /> العنوان بالإسكندرية
          </label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-orange-500 focus:bg-white transition-all font-bold"
            placeholder="مثال: سموحة - شارع فوزي معاذ"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700 flex items-center gap-2 mr-1">
            <MessageCircle className="w-4 h-4 text-orange-600" /> وصف العطل (اختياري)
          </label>
          <textarea
            value={formData.problem_description}
            onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-orange-500 focus:bg-white transition-all h-24 resize-none font-bold"
            placeholder="اشرح المشكلة باختصار..."
          ></textarea>
        </div>

        {submitMessage && (
          <div className={`p-5 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 ${submitMessage.includes('✅') ? 'bg-green-50 text-green-700 border-2 border-green-100' : 'bg-red-50 text-red-700 border-2 border-red-100'}`}>
            {submitMessage.includes('✅') ? <CheckCircle className="w-6 h-6 flex-shrink-0" /> : <AlertCircle className="w-6 h-6 flex-shrink-0" />}
            <span className="font-black text-sm">{submitMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-black py-5 rounded-2xl transition-all active:scale-95 shadow-2xl shadow-orange-900/20 disabled:opacity-50 flex items-center justify-center gap-3 text-xl"
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>تأكيد الحجز الآن</>
          )}
        </button>
        
        <div className="flex justify-center gap-4 text-[10px] text-slate-400 font-bold">
          <span>✓ ضمان شامل</span>
          <span>•</span>
          <span>✓ قطع غيار أصلية</span>
          <span>•</span>
          <span>✓ فنيين متخصصين</span>
        </div>
      </form>
    </div>
  );
}
