import { useId, useState, useEffect } from "react";
import { 
  MessageCircle, CheckCircle, User, Phone, Wrench, MapPin, 
  AlertCircle, Star, ShieldCheck, Clock, Users, Award, 
  Sparkles, ChevronLeft, ChevronRight, Calendar, ArrowRight,
  Zap, Smile, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sendExternalPush } from "../utils/pushNotifications";
import { openWhatsAppDirectly } from "../utils/whatsapp";

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

const DEVICE_TYPES = ['غسالة', 'ثلاجة', 'بوتاجاز', 'سخان', 'تكييف', 'ميكروويف', 'غسالة أطباق'];
const BRANDS = ['سامسونج', 'LG', 'شارب', 'توشيبا', 'زانوسي', 'يونيون إير', 'فريش', 'وايت ويل', 'أريستون', 'بيكو', 'هوفر', 'إنديست', 'كريازي'];

export default function BookingFormEnhanced() {
  const formId = useId().replace(/:/g, "");
  const deviceTypeId = `${formId}-device-type`;
  const brandId = `${formId}-brand`;
  const customDeviceId = `${formId}-custom-device`;
  const customBrandId = `${formId}-custom-brand`;
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
        
        await sendExternalPush({
          event: 'new_order',
          title: '📋 أوردر جديد من الموقع',
          message: `عميل جديد: ${formData.customer_name}\nالجهاز: ${finalDeviceType}\nالعنوان: ${formData.address}\nرقم الأوردر: ${orderNumber}`,
          targetRoles: ['admin', 'manager'],
          data: { order_number: orderNumber }
        });
        
        const msg = `أوردر جديد: ${orderNumber}\nالاسم: ${formData.customer_name}\nالجهاز: ${finalDeviceType}\nالعنوان: ${formData.address}`;
        openWhatsAppDirectly('201558625259', msg);
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
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-[3rem] shadow-2xl p-8 md:p-12 border border-slate-100 w-full max-w-3xl mx-auto overflow-hidden" dir="rtl">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-orange-100/30 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-100/30 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

      {/* Progress Bar */}
      {step < 4 && (
        <div className="mb-12 relative z-10">
          <div className="flex justify-between mb-6">
            {[1, 2, 3].map((s) => (
              <motion.div 
                key={s} 
                className={`flex flex-col items-center gap-3 transition-all ${step >= s ? 'text-orange-600' : 'text-slate-300'}`}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg transition-all shadow-lg ${
                    step >= s 
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange-200' 
                      : 'bg-slate-100 text-slate-400'
                  }`}
                  animate={{ scale: step === s ? 1.1 : 1 }}
                >
                  {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
                </motion.div>
                <span className="text-xs font-black text-center">
                  {s === 1 ? "نوع الجهاز" : s === 2 ? "بياناتك" : "تأكيد"}
                </span>
              </motion.div>
            ))}
          </div>
          <motion.div 
            className="h-2 bg-slate-100 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div 
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${((step - 1) / 2) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 relative z-10"
          >
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Wrench className="w-16 h-16 text-orange-600 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-3xl font-black text-slate-900 mb-3">ما هو الجهاز الذي يحتاج صيانة؟</h3>
              <p className="text-lg text-slate-500 font-bold">اختر نوع الجهاز والماركة للبدء</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div className="space-y-3" whileHover={{ y: -2 }}>
                <label htmlFor={deviceTypeId} className="flex items-center gap-2 text-sm font-black text-slate-700 mb-2">
                  <Zap className="w-5 h-5 text-orange-600" aria-hidden="true" /> نوع الجهاز
                </label>
                <select
                  id={deviceTypeId}
                  name="device_type"
                  aria-label="اختر نوع الجهاز"
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
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-orange-500 focus:shadow-lg focus:shadow-orange-200 appearance-none transition-all font-bold"
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
                    className="w-full mt-3 bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-orange-500 focus:shadow-lg focus:shadow-orange-200 transition-all font-bold" 
                    id={customDeviceId}
                    name="custom_device"
                    aria-label="اكتب نوع الجهاز الآخر"
                    placeholder="اكتب نوع الجهاز" 
                  />
                )}
              </motion.div>

              <motion.div className="space-y-3" whileHover={{ y: -2 }}>
                <label htmlFor={brandId} className="flex items-center gap-2 text-sm font-black text-slate-700 mb-2">
                  <Star className="w-5 h-5 text-orange-600" aria-hidden="true" /> الماركة
                </label>
                <select
                  id={brandId}
                  name="brand"
                  aria-label="اختر ماركة الجهاز"
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
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-orange-500 focus:shadow-lg focus:shadow-orange-200 appearance-none transition-all font-bold"
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
                    className="w-full mt-3 bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-orange-500 focus:shadow-lg focus:shadow-orange-200 transition-all font-bold" 
                    id={customBrandId}
                    name="custom_brand"
                    aria-label="اكتب الماركة الأخرى"
                    placeholder="اكتب الماركة" 
                  />
                )}
              </motion.div>
            </div>

            <motion.button 
              onClick={nextStep}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-xl shadow-xl shadow-orange-900/20"
            >
              التالي <ArrowRight className="w-6 h-6" />
            </motion.button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 relative z-10"
          >
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-3xl font-black text-slate-900 mb-3">بيانات التواصل</h3>
              <p className="text-lg text-slate-500 font-bold">كيف يمكننا الوصول إليك؟</p>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div className="space-y-3" whileHover={{ y: -2 }}>
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                    <User className="w-5 h-5 text-blue-600" /> الاسم بالكامل
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formData.customer_name} 
                    onChange={e => setFormData({...formData, customer_name: e.target.value})} 
                    className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-200 transition-all font-bold" 
                    placeholder="أحمد محمد" 
                  />
                </motion.div>
                <motion.div className="space-y-3" whileHover={{ y: -2 }}>
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                    <Phone className="w-5 h-5 text-blue-600" /> رقم الموبايل
                  </label>
                  <input 
                    type="tel" 
                    required 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-200 transition-all text-left font-bold" 
                    placeholder="01xxxxxxxxx" 
                  />
                </motion.div>
              </div>
              
              <motion.div className="space-y-3" whileHover={{ y: -2 }}>
                <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <MapPin className="w-5 h-5 text-blue-600" /> العنوان بالإسكندرية
                </label>
                <input 
                  type="text" 
                  required 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-200 transition-all font-bold" 
                  placeholder="مثال: سموحة - شارع فوزي معاذ" 
                />
              </motion.div>
            </div>

            <div className="flex gap-4">
              <motion.button 
                onClick={prevStep}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-xl"
              >
                السابق
              </motion.button>
              <motion.button 
                onClick={nextStep}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-[2] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-xl shadow-xl shadow-blue-900/20"
              >
                التالي <ArrowRight className="w-6 h-6" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 relative z-10"
          >
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-3xl font-black text-slate-900 mb-3">تأكيد الطلب</h3>
              <p className="text-lg text-slate-500 font-bold">أخبرنا بمشكلة الجهاز باختصار</p>
            </div>

            <div className="space-y-6">
              <motion.div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-2xl border-2 border-orange-200 space-y-4">
                <h4 className="text-lg font-black text-orange-900 mb-4">ملخص طلبك:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600 font-bold">الجهاز:</span>
                    <p className="text-slate-900 font-black text-lg">{isOtherDevice ? customDevice : formData.device_type}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 font-bold">الماركة:</span>
                    <p className="text-slate-900 font-black text-lg">{isOtherBrand ? customBrand : formData.brand}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 font-bold">الاسم:</span>
                    <p className="text-slate-900 font-black">{formData.customer_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 font-bold">الهاتف:</span>
                    <p className="text-slate-900 font-black">{formData.phone}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div className="space-y-3" whileHover={{ y: -2 }}>
                <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <MessageCircle className="w-5 h-5 text-green-600" /> وصف العطل (اختياري)
                </label>
                <textarea 
                  rows={4} 
                  value={formData.problem_description} 
                  onChange={e => setFormData({...formData, problem_description: e.target.value})} 
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-green-500 focus:shadow-lg focus:shadow-green-200 resize-none transition-all font-bold" 
                  placeholder="مثال: الجهاز لا يعمل، أو يصدر صوتاً عالياً..."
                ></textarea>
              </motion.div>
            </div>

            <div className="flex gap-4">
              <motion.button 
                onClick={prevStep}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-xl"
              >
                السابق
              </motion.button>
              <motion.button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-[2] bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-xl shadow-xl shadow-green-900/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-7 h-7 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>✅ تأكيد الحجز الآن</>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="success"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-12 space-y-8 relative z-10"
          >
            <motion.div 
              className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <CheckCircle className="w-16 h-16 text-green-600" />
            </motion.div>
            <div>
              <h3 className="text-4xl font-black text-slate-900 mb-4">تم استلام طلبك! 🎉</h3>
              <p className="text-2xl text-slate-600 font-bold leading-relaxed">
                شكراً لك يا <span className="text-green-600">{formData.customer_name.split(' ')[0]}</span>, <br />
                سيتواصل معك أحد مهندسينا خلال <span className="text-green-600 font-black">5 دقائق</span> لتأكيد الموعد.
              </p>
            </div>
            <motion.div 
              className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-3xl border-2 border-green-200 text-right space-y-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 text-green-700 font-black text-lg">
                <ShieldCheck className="w-6 h-6" /> ✅ ضمان معتمد لمدة عام
              </div>
              <div className="flex items-center gap-3 text-blue-700 font-black text-lg">
                <Clock className="w-6 h-6" /> ⚡ فني متخصص يصلك خلال ساعة
              </div>
              <div className="flex items-center gap-3 text-orange-700 font-black text-lg">
                <Users className="w-6 h-6" /> 👥 فريق محترف وموثوق
              </div>
            </motion.div>
            <motion.button 
              onClick={() => setStep(1)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-orange-600 font-black text-lg hover:underline transition-all"
            >
              حجز طلب آخر؟
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trust badges footer */}
      {step < 4 && (
        <motion.div 
          className="mt-12 flex flex-wrap justify-center gap-6 text-xs text-slate-500 font-black border-t border-slate-100 pt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-orange-400" /> ضمان شامل</span>
          <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-orange-400" /> قطع غيار أصلية</span>
          <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-orange-400" /> فنيين معتمدين</span>
          <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-orange-400" /> دعم 24/7</span>
        </motion.div>
      )}
    </div>
  );
}
