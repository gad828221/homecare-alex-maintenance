import { useState } from "react";
import { MessageCircle, CheckCircle, User, Phone, Wrench, MapPin } from "lucide-react";

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

// نفس القوائم الموجودة في لوحة التحكم
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    // إنشاء رقم أوردر فريد
    const orderNumber = `MG-${Date.now()}`;
    const orderDate = new Date().toLocaleDateString("ar-EG");

    // البيانات المرسلة إلى قاعدة البيانات (متوافقة مع جدول orders)
    const orderToSave = {
      order_number: orderNumber,
      customer_name: formData.customer_name,
      phone: formData.phone,
      device_type: formData.device_type,
      address: formData.address,
      brand: formData.brand,
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

      // رسالة واتساب للعميل (تأكيد الطلب)
      const message = `🔧 *طلب صيانة جديد*\n\n🆔 *رقم الأوردر:* ${orderNumber}\n👤 *الاسم:* ${formData.customer_name}\n📞 *الهاتف:* ${formData.phone}\n🔨 *نوع الجهاز:* ${formData.device_type}\n🏷️ *الماركة:* ${formData.brand}\n⚠️ *المشكلة:* ${formData.problem_description}\n📍 *العنوان:* ${formData.address}\n\n📌 سيتم التواصل معك قريباً لتحديد موعد المعاينة.`;
      
      const whatsappUrl = `https://wa.me/201558625259?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

      setSubmitMessage("✅ تم استلام طلبك بنجاح! سيتم التواصل معك قريباً.");
      setFormData({
        customer_name: "",
        phone: "",
        device_type: "",
        address: "",
        brand: "",
        problem_description: "",
      });
      
    } catch (err: any) {
      setSubmitMessage(`❌ خطأ في الاتصال: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitMessage(""), 5000);
    }
  };

  return (
    <section className="py-12 px-4 bg-gradient-to-br from-orange-50 via-white to-amber-50">
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

            {/* نوع الجهاز */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-500" />
                نوع الجهاز <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.device_type}
                onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              >
                <option value="">-- اختر نوع الجهاز --</option>
                {DEVICE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* ماركة الجهاز */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">ماركة الجهاز</label>
              <select
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              >
                <option value="">-- اختر الماركة --</option>
                {BRANDS.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
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
