import { useState } from "react";
import { MessageCircle, CheckCircle, User, Phone, Wrench, MapPin } from "lucide-react";
import { notifyAdmins } from "../lib/onesignal";

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

// القوائم الأساسية
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
  
  // حالات خيار "أخرى"
  const [isOtherDevice, setIsOtherDevice] = useState(false);
  const [customDevice, setCustomDevice] = useState("");
  const [isOtherBrand, setIsOtherBrand] = useState(false);
  const [customBrand, setCustomBrand] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  // تحديد القيمة النهائية لنوع الجهاز
  const getFinalDeviceType = () => {
    if (isOtherDevice) return customDevice.trim() || "جهاز آخر";
    return formData.device_type;
  };

  // تحديد القيمة النهائية للماركة
  const getFinalBrand = () => {
    if (isOtherBrand) return customBrand.trim() || "ماركة أخرى";
    return formData.brand;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    const finalDeviceType = getFinalDeviceType();
    const finalBrand = getFinalBrand();
    
    // التحقق من إدخال قيمة عند اختيار "أخرى"
    if (isOtherDevice && !customDevice.trim()) {
      setSubmitMessage("❌ الرجاء إدخال نوع الجهاز");
      setIsSubmitting(false);
      return;
    }
    if (isOtherBrand && !customBrand.trim()) {
      setSubmitMessage("❌ الرجاء إدخال الماركة");
      setIsSubmitting(false);
      return;
    }

    const orderNumber = `MG-${Date.now()}`;
    const orderDate = new Date().toLocaleDateString("ar-EG");

    const orderToSave = {
      order_number: orderNumber,
      customer_name: formData.customer_name,
      phone: formData.phone,
      device_type: finalDeviceType,
      address: formData.address,
      brand: finalBrand,
      problem_description: formData.problem_description,
      status: 'pending',
      is_paid: false,
      total_amount: 0,
      parts_cost: 0,
      transport_cost: 0,
      net_amount: 0,
      company_share: 0,
      technician_share: 0,
      technician: '',
      date: orderDate,
      created_at: new Date().toISOString()
    };

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(orderToSave)
      });

      if (!response.ok) {
        const errorText = await response.text();
        setSubmitMessage(`❌ فشل الحفظ: ${errorText}`);
        return;
      }

      const message = `🔧 *طلب صيانة جديد*\n\n🆔 *رقم الأوردر:* ${orderNumber}\n👤 *الاسم:* ${formData.customer_name}\n📞 *الهاتف:* ${formData.phone}\n🔨 *نوع الجهاز:* ${finalDeviceType}\n🏷️ *الماركة:* ${finalBrand}\n⚠️ *المشكلة:* ${formData.problem_description}\n📍 *العنوان:* ${formData.address}\n\n📌 سيتم التواصل معك قريباً لتحديد موعد المعاينة.`;
      
       const whatsappUrl = `https://wa.me/201558625259?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
      
      // إرسال إشعار قوي للمديرين من الخادم
      try {
        await fetch('/api/notify-new-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber,
            customerName: formData.customer_name,
            phone: formData.phone,
            deviceType: finalDeviceType,
            brand: finalBrand,
            address: formData.address,
            totalAmount: 0
          })
        });
        console.log('[BookingForm] Server notification sent');
      } catch (notifyError) {
        console.error('[BookingForm] Failed to send server notification:', notifyError);
      }
      
      // إشعار Push من المتصفح أيضاً (احتياطي)
      notifyAdmins('أوردر جديد من الموقع', `عميل جديد: ${formData.customer_name} طلب صيانة ${finalDeviceType}`);
      
      setSubmitMessage("✅ تم استلام طلبك بنجاح! سيتم التواصل معك قريباً.");
      
      // إعادة تعيين النموذج
      setFormData({
        customer_name: "",
        phone: "",
        device_type: "",
        address: "",
        brand: "",
        problem_description: "",
      });
      setIsOtherDevice(false);
      setCustomDevice("");
      setIsOtherBrand(false);
      setCustomBrand("");
      
    } catch (err: any) {
      setSubmitMessage(`❌ خطأ في الاتصال: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitMessage(""), 5000);
    }
  };

  return (
    <section className="py-12 px-4 bg-gradient-to-br from-orange-50 via-white to-amber-50 min-h-screen">
      <div className="container max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            احجز خدمتك الآن
          </h1>
          <p className="text-lg text-slate-600">استجابة سريعة وخدمة احترافية</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {submitMessage && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              submitMessage.includes("✅") 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}>
              <CheckCircle className="w-5 h-5" />
              <span>{submitMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* الاسم */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-orange-500" />
                الاسم الكامل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                placeholder="أدخل اسمك بالكامل"
              />
            </div>

            {/* رقم الهاتف */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-500" />
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                placeholder="مثال: 01234567890"
              />
            </div>

            {/* نوع الجهاز - مع خيار أخرى */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-500" />
                نوع الجهاز <span className="text-red-500">*</span>
              </label>
              
              {!isOtherDevice ? (
                <div className="flex gap-2">
                  <select
                    required
                    value={formData.device_type}
                    onChange={(e) => {
                      if (e.target.value === 'other') {
                        setIsOtherDevice(true);
                        setFormData({ ...formData, device_type: '' });
                      } else {
                        setFormData({ ...formData, device_type: e.target.value });
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  >
                    <option value="">-- اختر نوع الجهاز --</option>
                    {DEVICE_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                    <option value="other">➕ أخرى (أدخل يدوياً)</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customDevice}
                    onChange={(e) => setCustomDevice(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    placeholder="أدخل نوع الجهاز"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsOtherDevice(false);
                      setCustomDevice("");
                    }}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition"
                  >
                    رجوع
                  </button>
                </div>
              )}
            </div>

            {/* ماركة الجهاز - مع خيار أخرى */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">ماركة الجهاز</label>
              
              {!isOtherBrand ? (
                <div className="flex gap-2">
                  <select
                    value={formData.brand}
                    onChange={(e) => {
                      if (e.target.value === 'other') {
                        setIsOtherBrand(true);
                        setFormData({ ...formData, brand: '' });
                      } else {
                        setFormData({ ...formData, brand: e.target.value });
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  >
                    <option value="">-- اختر الماركة --</option>
                    {BRANDS.map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                    <option value="other">➕ أخرى (أدخل يدوياً)</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    placeholder="أدخل الماركة"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsOtherBrand(false);
                      setCustomBrand("");
                    }}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition"
                  >
                    رجوع
                  </button>
                </div>
              )}
            </div>

            {/* وصف المشكلة */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">وصف المشكلة</label>
              <textarea
                rows={3}
                value={formData.problem_description}
                onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                placeholder="مثال: الثلاجة لا تبرد - الغسالة لا تعمل"
              />
            </div>

            {/* العنوان */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                العنوان <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                placeholder="العنوان بالتفصيل (المنطقة، الشارع، رقم العمارة)"
              />
            </div>

            {/* زر الإرسال */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-orange-500/30 mt-6"
            >
              <MessageCircle className="w-5 h-5" />
              {isSubmitting ? "جاري الإرسال..." : "إرسال الطلب"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
