import { useState } from "react";
import { MessageCircle, CheckCircle, User, Phone, Wrench, MapPin, AlertCircle } from "lucide-react";

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

const DEVICE_TYPES = ['غسالة', 'ثلاجة', 'بوتاجاز', 'سخان', 'تكييف', 'ميكروويف', 'غسالة أطباق'];
const BRANDS = ['سامسونج', 'LG', 'شارب', 'توشيبا', 'زانوسي', 'يونيون إير', 'فريش', 'وايت ويل', 'أريستون', 'بيكو', 'هوفر', 'إنديست'];

export default function BookingForm() {
  const [formData, setFormData] = useState({
    customer_name: "",
    phone: "",
    device_type: "",
    address: "",
    brand: "",
    problem_description: "",
  });
  
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
        setSubmitMessage("✅ تم استلام طلبك بنجاح! سنتواصل معك قريباً.");
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
    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 max-w-2xl mx-auto my-12" dir="rtl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">احجز موعد صيانة الآن</h2>
        <p className="text-slate-500">سجل بياناتك وسيتواصل معك فني متخصص خلال دقائق</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-orange-600" /> اسم العميل
            </label>
            <input
              type="text"
              required
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all"
              placeholder="الاسم بالكامل"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-600" /> رقم الهاتف
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all"
              placeholder="رقم الموبايل"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all"
            >
              <option value="">اختر نوع الجهاز</option>
              {DEVICE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              <option value="other">أخرى...</option>
            </select>
            {isOtherDevice && (
              <input
                type="text"
                required
                value={customDevice}
                onChange={(e) => setCustomDevice(e.target.value)}
                className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all"
                placeholder="اكتب نوع الجهاز"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all"
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
                className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all"
                placeholder="اكتب الماركة"
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-600" /> العنوان بالتفصيل
          </label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all"
            placeholder="المنطقة - الشارع - رقم العقار"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-orange-600" /> وصف المشكلة
          </label>
          <textarea
            value={formData.problem_description}
            onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all h-24 resize-none"
            placeholder="اشرح العطل باختصار..."
          ></textarea>
        </div>

        {submitMessage && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${submitMessage.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {submitMessage.includes('✅') ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold">{submitMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-xl shadow-orange-900/20 disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
        >
          {isSubmitting ? (
            <>جاري الإرسال...</>
          ) : (
            <>تأكيد طلب الصيانة الآن</>
          )}
        </button>
      </form>
    </div>
  );
}
