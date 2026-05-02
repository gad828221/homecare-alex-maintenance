import { useState } from "react";
import { useNotification } from "./EnhancedNotificationSystem";
import { notifyAdmin } from "../lib/whatsapp";

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

const DEVICE_TYPES = ['غسالة', 'ثلاجة', 'بوتاجاز', 'سخان', 'تكييف', 'ميكروويف', 'غسالة أطباق'];
const BRANDS = ['سامسونج', 'LG', 'شارب', 'توشيبا', 'زانوسي', 'يونيون إير', 'فريش', 'وايت ويل', 'أريستون', 'بيكو', 'هوفر', 'إنديست'];

export default function BookingForm() {
  const { addNotification } = useNotification();

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
        // إشعار واتساب للمديرين
        const adminMsg = `🔔 *أوردر جديد* 🔔\n\n👤 العميل: ${formData.customer_name}\n📞 الهاتف: ${formData.phone}\n🔧 الجهاز: ${finalDeviceType} - ${finalBrand}\n📍 العنوان: ${formData.address}\n🔢 رقم الأوردر: ${orderNumber}\n📝 المشكلة: ${formData.problem_description || "بدون"}`;
        notifyAdmin(adminMsg);

        setSubmitMessage("✅ تم استلام طلبك بنجاح!");
        setTimeout(() => setSubmitMessage(""), 5000);

        addNotification({
          type: 'success',
          title: '📋 أوردر جديد',
          message: `تم استلام طلب جديد من ${formData.customer_name} - جهاز: ${finalDeviceType}`,
          duration: 8000
        });

        setFormData({
          customer_name: "", phone: "", device_type: "", address: "", brand: "", problem_description: ""
        });
        setIsOtherDevice(false); setIsOtherBrand(false);
        setCustomDevice(""); setCustomBrand("");

        // واتساب للعميل (تأكيد)
        const customerWhatsapp = formData.phone.replace(/[^\d]/g, '');
        const customerMessage = `📝 مرحباً ${formData.customer_name}، تم استلام طلب الصيانة الخاص بك بنجاح. رقم الأوردر: ${orderNumber}. سيتم التواصل معك قريباً.`;
        window.open(`https://wa.me/${customerWhatsapp}?text=${encodeURIComponent(customerMessage)}`, '_blank');
        
        // واتساب لرقم الدعم
        const supportWhatsapp = "201558625259";
        const supportMessage = `أوردر جديد: ${orderNumber}\nالاسم: ${formData.customer_name}\nالجهاز: ${finalDeviceType}`;
        window.open(`https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(supportMessage)}`, '_blank');
      } else {
        setSubmitMessage("❌ حدث خطأ، حاول مرة أخرى");
        addNotification({
          type: 'error',
          title: '❌ فشل الحجز',
          message: 'حدث خطأ أثناء إرسال طلبك، حاول مرة أخرى',
          duration: 5000
        });
      }
    } catch (err: any) {
      setSubmitMessage(`❌ خطأ: ${err.message}`);
      addNotification({
        type: 'error',
        title: '❌ خطأ في الاتصال',
        message: 'تعذر الاتصال بقاعدة البيانات',
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8">
      <h2 className="text-3xl font-bold text-center mb-6 text-slate-800">📝 احجز موعد صيانة الآن</h2>
      {submitMessage && (
        <div className={`mb-4 p-3 rounded-lg text-center ${submitMessage.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {submitMessage}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 mb-1">الاسم *</label>
            <input type="text" required className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800" value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} />
          </div>
          <div>
            <label className="block text-slate-700 mb-1">رقم الهاتف *</label>
            <input type="tel" required className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div>
            <label className="block text-slate-700 mb-1">نوع الجهاز</label>
            <select className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800" value={formData.device_type} onChange={e => { if (e.target.value === 'other') { setIsOtherDevice(true); setFormData({...formData, device_type: ''}); } else { setIsOtherDevice(false); setFormData({...formData, device_type: e.target.value}); } }}>
              <option value="">اختر</option>
              {DEVICE_TYPES.map(d => <option key={d}>{d}</option>)}
              <option value="other">أخرى</option>
            </select>
            {isOtherDevice && <input type="text" placeholder="أدخل النوع" className="w-full mt-2 bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800" value={customDevice} onChange={e => setCustomDevice(e.target.value)} required />}
          </div>
          <div>
            <label className="block text-slate-700 mb-1">الماركة</label>
            <select className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800" value={formData.brand} onChange={e => { if (e.target.value === 'other') { setIsOtherBrand(true); setFormData({...formData, brand: ''}); } else { setIsOtherBrand(false); setFormData({...formData, brand: e.target.value}); } }}>
              <option value="">اختر</option>
              {BRANDS.map(b => <option key={b}>{b}</option>)}
              <option value="other">أخرى</option>
            </select>
            {isOtherBrand && <input type="text" placeholder="أدخل الماركة" className="w-full mt-2 bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800" value={customBrand} onChange={e => setCustomBrand(e.target.value)} required />}
          </div>
          <div className="md:col-span-2">
            <label className="block text-slate-700 mb-1">العنوان</label>
            <input type="text" required className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-slate-700 mb-1">وصف المشكلة (اختياري)</label>
            <textarea rows={2} className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800" value={formData.problem_description} onChange={e => setFormData({...formData, problem_description: e.target.value})} />
          </div>
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold text-lg transition-all disabled:opacity-50">
          {isSubmitting ? "جاري الإرسال..." : "📅 تأكيد الحجز"}
        </button>
      </form>
    </div>
  );
}
