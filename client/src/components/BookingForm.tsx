import { useState, useEffect } from "react";
import { MessageCircle, CheckCircle, User, Phone, Wrench, MapPin, AlertCircle, Star, ShieldCheck, Clock, Users, Award, Sparkles } from "lucide-react";

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
        setSubmitMessage("✅ تم استلام طلبك بنجاح! سنتواصل معك خلال 5 دقائق.");
        setFormData({
          customer_name: "",
          phone: "",
          device_type: "",
          address: "",
          brand: "",
          problem_description: "",
        });
        // إشعار للمدير عبر Netlify Function
        try {
          await fetch('/.netlify/functions/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: '📋 أوردر جديد من الموقع',
              message: `عميل جديد: ${formData.customer_name}\nالجهاز: ${finalDeviceType}\nالعنوان: ${formData.address}\nالرقم: ${orderNumber}`
            })
          });
        } catch (err) { console.error('Notification Error:', err); }
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
    <div className="bg-white rounded-[2.5rem] shadow-3xl p-8 md:p-12 border border-slate-100 w-full max-w-4xl mx-auto transition-all duration-300 hover:shadow-3xl" dir="rtl">
      {/* Trust badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-orange-50 rounded-2xl p-4 text-center border border-orange-100"><Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" /><p className="text-sm font-bold text-slate-600">وصول خلال</p><p className="text-2xl font-black text-orange-600">60 دقيقة</p></div>
        <div className="bg-green-50 rounded-2xl p-4 text-center border border-green-100"><ShieldCheck className="w-8 h-8 text-green-600 mx-auto mb-2" /><p className="text-sm font-bold text-slate-600">ضمان</p><p className="text-2xl font-black text-green-600">سنة كاملة</p></div>
        <div className="bg-purple-50 rounded-2xl p-4 text-center border border-purple-100"><Users className="w-8 h-8 text-purple-600 mx-auto mb-2" /><p className="text-sm font-bold text-slate-600">عملاء سعداء</p><p className="text-2xl font-black text-purple-600">50k+</p></div>
        <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100"><Award className="w-8 h-8 text-blue-600 mx-auto mb-2" /><p className="text-sm font-bold text-slate-600">خبرة</p><p className="text-2xl font-black text-blue-600">15+ سنة</p></div>
      </div>

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-5 py-2 rounded-full mb-5 text-sm font-black">
          <ShieldCheck className="w-4 h-4" /> اتصال آمن ومشفر
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">احجز موعد الصيانة الآن</h2>
        <p className="text-xl text-slate-600 font-bold">نصلك في منزلك بالإسكندرية خلال 60 دقيقة فقط</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div><label className="flex items-center gap-2 text-sm font-black text-slate-700 mb-2"><User className="w-5 h-5 text-orange-600" /> الاسم بالكامل</label><input type="text" required value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-5 text-lg outline-none focus:border-orange-500 transition-all" placeholder="مثال: أحمد محمد" /></div>
          <div><label className="flex items-center gap-2 text-sm font-black text-slate-700 mb-2"><Phone className="w-5 h-5 text-orange-600" /> رقم الموبايل</label><input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-5 text-lg outline-none focus:border-orange-500 transition-all" placeholder="01xxxxxxxxx" /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div><label className="flex items-center gap-2 text-sm font-black text-slate-700 mb-2"><Wrench className="w-5 h-5 text-orange-600" /> نوع الجهاز</label><select required value={isOtherDevice ? "other" : formData.device_type} onChange={e => { if(e.target.value === "other") { setIsOtherDevice(true); setFormData({...formData, device_type: ""}); } else { setIsOtherDevice(false); setFormData({...formData, device_type: e.target.value}); } }} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-5 text-lg outline-none focus:border-orange-500 appearance-none"><option value="">اختر الجهاز</option>{DEVICE_TYPES.map(t => <option key={t}>{t}</option>)}<option value="other">أخرى...</option></select>{isOtherDevice && <input type="text" required value={customDevice} onChange={e => setCustomDevice(e.target.value)} className="w-full mt-3 bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-orange-500" placeholder="اكتب نوع الجهاز" />}</div>
          <div><label className="flex items-center gap-2 text-sm font-black text-slate-700 mb-2"><Star className="w-5 h-5 text-orange-600" /> الماركة</label><select required value={isOtherBrand ? "other" : formData.brand} onChange={e => { if(e.target.value === "other") { setIsOtherBrand(true); setFormData({...formData, brand: ""}); } else { setIsOtherBrand(false); setFormData({...formData, brand: e.target.value}); } }} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-5 text-lg outline-none focus:border-orange-500 appearance-none"><option value="">اختر الماركة</option>{BRANDS.map(b => <option key={b}>{b}</option>)}<option value="other">أخرى...</option></select>{isOtherBrand && <input type="text" required value={customBrand} onChange={e => setCustomBrand(e.target.value)} className="w-full mt-3 bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-orange-500" placeholder="اكتب الماركة" />}</div>
        </div>
        <div><label className="flex items-center gap-2 text-sm font-black text-slate-700 mb-2"><MapPin className="w-5 h-5 text-orange-600" /> العنوان بالإسكندرية</label><input type="text" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-5 text-lg outline-none focus:border-orange-500 transition-all" placeholder="مثال: سموحة - شارع فوزي معاذ" /></div>
        <div><label className="flex items-center gap-2 text-sm font-black text-slate-700 mb-2"><MessageCircle className="w-5 h-5 text-orange-600" /> وصف العطل (اختياري)</label><textarea rows={4} value={formData.problem_description} onChange={e => setFormData({...formData, problem_description: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-5 text-lg outline-none focus:border-orange-500 resize-none" placeholder="اشرح المشكلة باختصار..."></textarea></div>
        {submitMessage && <div className={`p-5 rounded-2xl flex items-center gap-4 ${submitMessage.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{submitMessage.includes('✅') ? <CheckCircle className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}<span className="font-bold text-base">{submitMessage}</span></div>}
        <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-black py-6 rounded-2xl transition-all active:scale-95 shadow-2xl shadow-orange-900/30 disabled:opacity-50 flex items-center justify-center gap-3 text-2xl">{isSubmitting ? <div className="w-7 h-7 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : <>✅ تأكيد الحجز الآن</>}</button>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500 font-bold pt-2"><span className="flex items-center gap-1"><Sparkles className="w-4 h-4 text-orange-500" /> ✓ ضمان شامل</span><span className="hidden md:inline">•</span><span className="flex items-center gap-1"><Sparkles className="w-4 h-4 text-orange-500" /> ✓ قطع غيار أصلية</span><span className="hidden md:inline">•</span><span className="flex items-center gap-1"><Sparkles className="w-4 h-4 text-orange-500" /> ✓ فنيين متخصصين</span><span className="hidden md:inline">•</span><span className="flex items-center gap-1"><Sparkles className="w-4 h-4 text-orange-500" /> ⭐ خدمة 24 ساعة</span></div>
      </form>
    </div>
  );
}
