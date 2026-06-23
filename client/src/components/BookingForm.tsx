import { useState, useEffect } from "react";
import { 
  MessageCircle, CheckCircle, User, Phone, Wrench, MapPin, 
  AlertCircle, Star, ShieldCheck, Clock, Users, Award, 
  Sparkles, ChevronLeft, ChevronRight, Calendar, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

const DEVICE_TYPES = ['غسالة', 'ثلاجة', 'بوتاجاز', 'سخان', 'تكييف', 'ميكروويف', 'غسالة أطباق'];
const BRANDS = ['سامسونج', 'LG', 'شارب', 'توشيبا', 'زانوسي', 'يونيون إير', 'فريش', 'وايت ويل', 'أريستون', 'بيكو', 'هوفر', 'إنديست'];

export default function BookingForm() {
  const [step, setStep] = useState(1);
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

  const nextStep = () => {
    if (step === 1 && (!formData.device_type && !isOtherDevice)) return alert("يرجى اختيار نوع الجهاز");
    if (step === 1 && (!formData.brand && !isOtherBrand)) return alert("يرجى اختيار الماركة");
    if (step === 2 && (!formData.customer_name || !formData.phone || !formData.address)) return alert("يرجى إكمال البيانات المطلوبة");
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

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
        setStep(4); // Success step
        
        // Notification to Admin
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
    <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-10 border border-slate-100 w-full max-w-2xl mx-auto overflow-hidden" dir="rtl">
      {/* Progress Bar */}
      {step < 4 && (
        <div className="mb-10">
          <div className="flex justify-between mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex flex-col items-center gap-2 ${step >= s ? 'text-orange-600' : 'text-slate-300'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg transition-all ${step >= s ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'bg-slate-100 text-slate-400'}`}>
                  {step > s ? <CheckCircle className="w-6 h-6" /> : s}
                </div>
                <span className="text-xs font-black">
                  {s === 1 ? "نوع الجهاز" : s === 2 ? "بياناتك" : "تأكيد"}
                </span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-orange-600"
              initial={{ width: "0%" }}
              animate={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 mb-2">ما هو الجهاز الذي يحتاج صيانة؟</h3>
              <p className="text-slate-500 font-bold">اختر نوع الجهاز والماركة للبدء</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <Wrench className="w-5 h-5 text-orange-600" /> نوع الجهاز
                </label>
                <select 
                  required 
                  value={isOtherDevice ? "other" : formData.device_type} 
                  onChange={e => { 
                    if(e.target.value === "other") { 
                      setIsOtherDevice(true); 
                      setFormData({...formData, device_type: ""}); 
                    } else { 
                      setIsOtherDevice(false); 
                      setFormData({...formData, device_type: e.target.value}); 
                    } 
                  }} 
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-orange-500 appearance-none transition-all"
                >
                  <option value="">اختر الجهاز</option>
                  {DEVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  <option value="other">أخرى...</option>
                </select>
                {isOtherDevice && (
                  <motion.input 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    type="text" 
                    required 
                    value={customDevice} 
                    onChange={e => setCustomDevice(e.target.value)} 
                    className="w-full mt-3 bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-orange-500" 
                    placeholder="اكتب نوع الجهاز" 
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <Star className="w-5 h-5 text-orange-600" /> الماركة
                </label>
                <select 
                  required 
                  value={isOtherBrand ? "other" : formData.brand} 
                  onChange={e => { 
                    if(e.target.value === "other") { 
                      setIsOtherBrand(true); 
                      setFormData({...formData, brand: ""}); 
                    } else { 
                      setIsOtherBrand(false); 
                      setFormData({...formData, brand: e.target.value}); 
                    } 
                  }} 
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-orange-500 appearance-none transition-all"
                >
                  <option value="">اختر الماركة</option>
                  {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  <option value="other">أخرى...</option>
                </select>
                {isOtherBrand && (
                  <motion.input 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    type="text" 
                    required 
                    value={customBrand} 
                    onChange={e => setCustomBrand(e.target.value)} 
                    className="w-full mt-3 bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-orange-500" 
                    placeholder="اكتب الماركة" 
                  />
                )}
              </div>
            </div>

            <button 
              onClick={nextStep}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-xl shadow-xl shadow-orange-900/20"
            >
              التالي <ArrowRight className="w-6 h-6" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 mb-2">بيانات التواصل</h3>
              <p className="text-slate-500 font-bold">كيف يمكننا الوصول إليك؟</p>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                    <User className="w-5 h-5 text-orange-600" /> الاسم بالكامل
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formData.customer_name} 
                    onChange={e => setFormData({...formData, customer_name: e.target.value})} 
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-orange-500 transition-all" 
                    placeholder="أحمد محمد" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                    <Phone className="w-5 h-5 text-orange-600" /> رقم الموبايل
                  </label>
                  <input 
                    type="tel" 
                    required 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-orange-500 transition-all text-left" 
                    placeholder="01xxxxxxxxx" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <MapPin className="w-5 h-5 text-orange-600" /> العنوان بالإسكندرية
                </label>
                <input 
                  type="text" 
                  required 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-orange-500 transition-all" 
                  placeholder="مثال: سموحة - شارع فوزي معاذ" 
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={prevStep}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-xl"
              >
                السابق
              </button>
              <button 
                onClick={nextStep}
                className="flex-[2] bg-orange-600 hover:bg-orange-700 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-xl shadow-xl shadow-orange-900/20"
              >
                التالي <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 mb-2">تأكيد الطلب</h3>
              <p className="text-slate-500 font-bold">أخبرنا بمشكلة الجهاز باختصار</p>
            </div>

            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-bold">الجهاز:</span>
                  <span className="text-slate-900 font-black">{isOtherDevice ? customDevice : formData.device_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-bold">الماركة:</span>
                  <span className="text-slate-900 font-black">{isOtherBrand ? customBrand : formData.brand}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <MessageCircle className="w-5 h-5 text-orange-600" /> وصف العطل (اختياري)
                </label>
                <textarea 
                  rows={4} 
                  value={formData.problem_description} 
                  onChange={e => setFormData({...formData, problem_description: e.target.value})} 
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-orange-500 resize-none transition-all" 
                  placeholder="مثال: الجهاز لا يعمل، أو يصدر صوتاً عالياً..."
                ></textarea>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={prevStep}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-xl"
              >
                السابق
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-xl shadow-xl shadow-green-900/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-7 h-7 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>✅ تأكيد الحجز الآن</>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="success"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-10 space-y-6"
          >
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <h3 className="text-3xl font-black text-slate-900">تم استلام طلبك!</h3>
            <p className="text-xl text-slate-600 font-bold leading-relaxed">
              شكراً لك يا {formData.customer_name.split(' ')[0]}، <br />
              سيتواصل معك أحد مهندسينا خلال <span className="text-orange-600 font-black">5 دقائق</span> لتأكيد الموعد.
            </p>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-right space-y-3">
              <div className="flex items-center gap-3 text-green-700 font-bold">
                <ShieldCheck className="w-5 h-5" /> ضمان معتمد لمدة عام
              </div>
              <div className="flex items-center gap-3 text-blue-700 font-bold">
                <Clock className="w-5 h-5" /> فني متخصص يصلك خلال ساعة
              </div>
            </div>
            <button 
              onClick={() => setStep(1)}
              className="text-orange-600 font-black hover:underline"
            >
              حجز طلب آخر؟
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trust badges footer */}
      {step < 4 && (
        <div className="mt-10 flex flex-wrap justify-center gap-4 text-xs text-slate-400 font-bold border-t border-slate-50 pt-6">
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-orange-400" /> ضمان شامل</span>
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-orange-400" /> قطع غيار أصلية</span>
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-orange-400" /> فنيين معتمدين</span>
        </div>
      )}
    </div>
  );
}
