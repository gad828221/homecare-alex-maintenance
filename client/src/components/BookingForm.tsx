import { useId, useState, useEffect, useRef } from "react";
import {
  MessageCircle, CheckCircle, User, Phone, Wrench, MapPin,
  AlertCircle, Star, ShieldCheck, Clock, Users, Award,
  Sparkles, ChevronLeft, ChevronRight, Calendar, ArrowRight, Plus, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sendExternalPush } from "../utils/pushNotifications";
import { trackBookingConversion, trackBookingStart } from "../utils/adTracking";
import { DEVICE_TYPES, BRAND_OPTIONS } from "../constants/catalog";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';
const supabase = createClient(supabaseUrl, supabaseKey);


export interface BookingFormProps {
  defaultService?: string;
  title?: string;
  description?: string;
}

export default function BookingForm({ defaultService, title, description }: BookingFormProps) {
  const formId = useId().replace(/:/g, "");
  const deviceTypeId = `${formId}-device-type`;
  const brandId = `${formId}-brand`;
  const customDeviceId = `${formId}-custom-device`;
  const customBrandId = `${formId}-custom-brand`;
  const defaultDeviceType = defaultService?.includes("ثلاجات")
    ? "ثلاجة"
    : defaultService?.includes("غسالات")
      ? "غسالة"
      : defaultService?.includes("مكيفات")
        ? "تكييف"
        : defaultService?.includes("أفران") || defaultService?.includes("بوتاجازات")
          ? "بوتاجاز"
          : defaultService?.includes("سخانات")
            ? "سخان"
            : "";
  const [step, setStep] = useState(defaultDeviceType ? 2 : 1);
  const [formData, setFormData] = useState({
    customer_name: "",
    phone: "",
    device_type: defaultDeviceType,
    address: "",
    brand: "",
    problem_description: "",
  });
  const [additionalPhones, setAdditionalPhones] = useState<string[]>([]);

  const [isOtherDevice, setIsOtherDevice] = useState(false);
  const [customDevice, setCustomDevice] = useState("");
  const [isOtherBrand, setIsOtherBrand] = useState(false);
  const [customBrand, setCustomBrand] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState<"rejected" | "ambiguous" | "">("");
  const [fieldError, setFieldError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [formStartedAt] = useState(() => Date.now());
  const bookingStartedRef = useRef(false);

  // The anonymous returning-customer phone lookup was removed: post-flip anon
  // has no orders SELECT, and the lookup was a customer-data oracle (any visitor
  // could probe any phone number). Returning customers retype name/address.
  const nextStep = () => {
    if (step === 1 && (!formData.device_type && !isOtherDevice)) {
      setFieldError("اختار نوع الجهاز الأول، وبعدها أكمل.");
      return;
    }
    setFieldError("");
    if ((step === 1 || (step === 2 && Boolean(defaultDeviceType))) && !bookingStartedRef.current) {
      bookingStartedRef.current = true;
      trackBookingStart({ device_type: isOtherDevice ? customDevice : formData.device_type, brand: isOtherBrand ? customBrand : formData.brand });
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setFieldError("");
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setFieldError("كمّل الاسم ورقم الموبايل والعنوان عشان نقدر نأكد طلبك.");
      return;
    }
    const digits = formData.phone.replace(/[^0-9]/g, "").replace(/^20/, "");
    if (!/^01[0-9]{9}$/.test(digits)) {
      setFieldError("رقم الموبايل لازم يكون 11 رقم ويبدأ بـ 01، مثال: 01234567890.");
      return;
    }
    setFieldError("");
    if (honeypot.trim() || Date.now() - formStartedAt < 2500) {
      setSubmitMessage("يرجى الانتظار لحظة ثم المحاولة مرة أخرى.");
      return;
    }
    setIsSubmitting(true);
    setSubmitMessage("");
    setSubmitError("");

    const finalDeviceType = isOtherDevice ? customDevice : formData.device_type;
    const finalBrand = isOtherBrand ? customBrand : formData.brand;
    const newOrderNumber = `MG-${Date.now()}`;
    const cleanAdditionalPhones = additionalPhones
      .map((phone) => phone.trim())
      .filter(Boolean)
      .filter((phone, index, phones) => phones.indexOf(phone) === index && phone !== formData.phone.trim());
    const additionalPhonesNote = cleanAdditionalPhones.length
      ? `\n[أرقام إضافية للعميل: ${cleanAdditionalPhones.join(' | ')}]`
      : '';
    const orderToSave = {
      order_number: newOrderNumber,
      customer_name: formData.customer_name,
      phone: formData.phone,
      device_type: finalDeviceType,
      address: formData.address,
      brand: finalBrand,
      problem_description: formData.problem_description,
      status: 'pending',
      date: new Date().toLocaleDateString("ar-EG"),
      created_at: new Date().toISOString(),
      admin_notes: `[مصدر التسجيل: عميل]${additionalPhonesNote}`
    };

    try {
      const { error: insertError } = await supabase.from('orders').insert([orderToSave]);

      if (!insertError) {
        setOrderNumber(newOrderNumber);
        setSubmitMessage("تم استلام طلبك بنجاح، وسيتواصل معك فريق استقبال الطلبات لتأكيد الموعد.");
        setStep(4);
        trackBookingConversion({
          device_type: finalDeviceType,
          brand: finalBrand,
          transaction_id: newOrderNumber,
        });

        const publicOrderMessage = `عميل جديد: ${formData.customer_name}\nالجهاز: ${finalDeviceType}\nالعنوان: ${formData.address}\nرقم الأوردر: ${newOrderNumber}`;
        // استهداف مباشر للاشتراكات الإدارية الحالية؛ لا نعتمد على وسوم الدور القديمة.
        const pushResult = await sendExternalPush({
          event: 'new_order',
          title: '📋 أوردر جديد من الموقع',
          message: publicOrderMessage,
          targetUserIds: ['staff:admin:1', 'staff:manager:5'],
          data: { order_number: newOrderNumber }
        });
        if (!pushResult.ok) console.error('[Public booking] Push failed:', pushResult.error);

        // إنشاء سجل التنبيه الداخلي فورًا كي يلتقطه Realtime ويشغل الصوت.
        try {
          await supabase.from('notifications').insert([{
            action: 'new_order_alert',
            details: newOrderNumber,
            user_name: 'نظام الموقع',
            created_at: new Date().toISOString()
          }]);
        } catch (err) { console.error("Realtime alert error:", err); }

        // التنبيه الداخلي تم عبر Push وقناة notifications؛ لا تُرسل تفاصيل الإدارة عبر واتساب.
      } else {
        console.error('[Public booking] Insert error:', insertError);
        // PostgREST rejection has a code: الطلب اترفض صراحة ولم يُسجَّل. بدون code (شبكة/غير مؤكد): قد يكون وصل، لا نجزم بعدم التسجيل.
        setSubmitError(insertError && (insertError as any).code ? "rejected" : "ambiguous");
      }
    } catch (err: any) {
      console.error('[Public booking] Submit failed:', err);
      setSubmitError("ambiguous");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 bg-white rounded-[2rem] shadow-2xl p-6 md:p-10 border-b-8 border-orange-600">
      {/* Honeypot field to trap bots */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(event) => setHoneypot(event.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-0 top-0 h-px w-px opacity-0 pointer-events-none"
      />
      {step < 4 && (
        <div className="mb-8">
          <div className="flex justify-center gap-16 mb-4">
            {[1, 2].map((s) => (
              <div key={s} className={`flex flex-col items-center gap-2 ${step >= s ? 'text-orange-600' : 'text-slate-300'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg transition-all ${step >= s ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'bg-slate-100 text-slate-400'}`}>
                  {step > s ? <CheckCircle className="w-6 h-6" /> : s}
                </div>
                <span className="text-xs font-black">
                  {s === 1 ? "الجهاز والمشكلة" : "بياناتك وتأكيد"}
                </span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-orange-600"
              initial={{ width: "0%" }}
              animate={{ width: `${((step - 1) / 1) * 100}%` }}
            />
          </div>
          <p className="mt-4 text-center text-sm font-bold text-slate-500">خطوتين بس، وبنعرفك تكلفة الكشف قبل الزيارة.</p>
        </div>
      )}

      {fieldError && step < 4 && (
        <div role="alert" className="mb-6 flex items-center gap-2 rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0" /> {fieldError}
        </div>
      )}

      {(submitError || (submitMessage && step < 4)) && step < 4 && (
        <div role="alert" className="mb-6 flex items-center gap-2 rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>
            {submitError === "rejected" && <>الطلب ما اتسجّلش. جرّب تاني، أو اتصل بينا على <a href="tel:01278885772" dir="ltr" className="underline">01278885772</a>.</>}
            {submitError === "ambiguous" && <>مش متأكدين إن طلبك وصل. قبل ما تجرب تاني، اتصل بينا على <a href="tel:01278885772" dir="ltr" className="underline">01278885772</a> للتأكيد.</>}
            {!submitError && submitMessage}
          </span>
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
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black text-slate-900 mb-2">ما هو الجهاز الذي يحتاج صيانة؟</h3>
              <p className="text-slate-500 font-bold">اختر الجهاز، ولو تحب احكي لنا العطل باختصار</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor={deviceTypeId} className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <Wrench className="w-5 h-5 text-orange-600" aria-hidden="true" /> نوع الجهاز
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
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg text-slate-900 font-medium outline-none focus:border-orange-500 appearance-none transition-all"
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
                    className="w-full mt-3 bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg text-slate-900 font-medium outline-none focus:border-orange-500"
                    id={customDeviceId}
                    name="custom_device"
                    aria-label="اكتب نوع الجهاز الآخر"
                    placeholder="اكتب نوع الجهاز"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor={brandId} className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <Star className="w-5 h-5 text-orange-600" aria-hidden="true" /> الماركة <span className="text-xs font-bold text-slate-400">(اختياري)</span>
                </label>
                <select
                  id={brandId}
                  name="brand"
                  aria-label="اختر ماركة الجهاز (اختياري)"
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
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg text-slate-900 font-medium outline-none focus:border-orange-500 appearance-none transition-all"
                >
                  <option value="">اختر الماركة إن رغبت</option>
                  {BRAND_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
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
                    className="w-full mt-3 bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg text-slate-900 font-medium outline-none focus:border-orange-500"
                    id={customBrandId}
                    name="custom_brand"
                    aria-label="اكتب الماركة الأخرى"
                    placeholder="اكتب الماركة"
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor={`${formId}-problem`} className="flex items-center gap-2 text-sm font-black text-slate-700">
                <MessageCircle className="w-5 h-5 text-orange-600" aria-hidden="true" /> وصف العطل <span className="text-xs font-bold text-slate-400">(اختياري)</span>
              </label>
              <textarea
                id={`${formId}-problem`}
                rows={3}
                value={formData.problem_description}
                onChange={e => setFormData({...formData, problem_description: e.target.value})}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg text-slate-900 font-medium outline-none focus:border-orange-500 resize-none transition-all"
                placeholder="مثال: الجهاز لا يعمل، أو يصدر صوتاً عالياً..."
              ></textarea>
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
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black text-slate-900 mb-2">بيانات التواصل</h3>
              <p className="text-slate-500 font-bold">آخر خطوة، سيب بياناتك وهنتواصل معاك</p>
            </div>

            <div className="bg-orange-50 px-4 py-3 rounded-2xl border border-orange-100 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
              <span className="text-slate-500 font-bold">الجهاز: <span className="text-slate-900 font-black">{isOtherDevice ? customDevice : formData.device_type}</span></span>
              {(formData.brand || customBrand) && (
                <span className="text-slate-500 font-bold">الماركة: <span className="text-slate-900 font-black">{isOtherBrand ? customBrand : formData.brand}</span></span>
              )}
            </div>

            {defaultDeviceType && (
              <div className="space-y-2">
                <label htmlFor={`${formId}-service-brand`} className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <Star className="w-5 h-5 text-orange-600" /> الماركة <span className="text-xs font-bold text-slate-400">(اختياري)</span>
                </label>
                <select
                  id={`${formId}-service-brand`}
                  value={formData.brand}
                  onChange={(event) => setFormData((current) => ({ ...current, brand: event.target.value }))}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg text-slate-900 font-medium outline-none focus:border-orange-500 appearance-none transition-all"
                >
                  <option value="">اختر الماركة إن رغبت</option>
                  {BRAND_OPTIONS.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor={`${formId}-name`} className="flex items-center gap-2 text-sm font-black text-slate-700">
                    <User className="w-5 h-5 text-orange-600" /> الاسم بالكامل
                  </label>
                  <input
                    id={`${formId}-name`}
                    type="text"
                    name="customer_name"
                    autoComplete="name"
                    required
                    value={formData.customer_name}
                    onChange={e => setFormData({...formData, customer_name: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg text-slate-900 font-medium outline-none focus:border-orange-500 transition-all"
                    placeholder="أحمد محمد"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor={`${formId}-phone`} className="flex items-center gap-2 text-sm font-black text-slate-700">
                    <Phone className="w-5 h-5 text-orange-600" /> رقم الموبايل
                  </label>
                  <input
                    id={`${formId}-phone`}
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg text-slate-900 font-medium outline-none focus:border-orange-500 transition-all text-left"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor={`${formId}-address`} className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <MapPin className="w-5 h-5 text-orange-600" /> العنوان بالإسكندرية
                </label>
                <input
                  id={`${formId}-address`}
                  type="text"
                  name="address"
                  autoComplete="street-address"
                  required
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg text-slate-900 font-medium outline-none focus:border-orange-500 transition-all"
                  placeholder="مثال: سموحة - شارع فوزي معاذ"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black text-slate-600">أرقام إضافية للعميل <span className="font-bold text-slate-400">(اختياري)</span></p>
                  {additionalPhones.length < 2 && <button type="button" onClick={() => setAdditionalPhones((current) => [...current, ""])} className="inline-flex items-center gap-1 text-xs font-black text-orange-600 hover:text-orange-700"><Plus className="w-4 h-4" /> إضافة رقم</button>}
                </div>
                {additionalPhones.map((phone, index) => <div key={`additional-phone-${index}`} className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0 text-slate-400" />
                  <input type="tel" value={phone} onChange={(event) => setAdditionalPhones((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className="min-w-0 flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-500" placeholder="رقم بديل للتواصل" aria-label={`رقم هاتف إضافي ${index + 1}`} />
                  <button type="button" onClick={() => setAdditionalPhones((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-xl p-2 text-rose-500 hover:bg-rose-50" aria-label="حذف الرقم الإضافي"><Trash2 className="w-4 h-4" /></button>
                </div>)}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
              {!defaultDeviceType && (
                <button
                  onClick={prevStep}
                  className="sm:flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 sm:py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg sm:text-xl"
                >
                  السابق
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="sm:flex-[2] bg-green-600 hover:bg-green-700 text-white font-black py-4 sm:py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg sm:text-xl shadow-xl shadow-green-900/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-7 h-7 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>إرسال طلب الحجز</>
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
            <h3 className="text-3xl font-black text-slate-900">وصلنا طلبك يا {formData.customer_name.split(' ')[0]}</h3>
            <p className="text-xl text-slate-600 font-bold leading-relaxed">
              شكراً لثقتك في Maintenance Guide. <br />
              هيتصل بيك فريق استقبال الطلبات على <bdi dir="ltr" className="text-slate-900">{formData.phone}</bdi> لتأكيد الموعد والتفاصيل.
            </p>
            {orderNumber && (
              <p className="text-sm font-black text-slate-500">
                رقم طلبك: <span dir="ltr" className="text-orange-600">{orderNumber}</span> — احتفظ بيه لأي متابعة.
              </p>
            )}
            <p className="text-xs font-bold text-slate-400">الطلب اتسجّل، والحجز النهائي بيتأكد في المكالمة.</p>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-right space-y-3">
              <div className="flex items-center gap-3 text-green-700 font-bold">
                <ShieldCheck className="w-5 h-5" /> شهادة ضمان رقمية
              </div>
              <div className="flex items-center gap-3 text-blue-700 font-bold">
                <Clock className="w-5 h-5" /> فني متخصص يصلك خلال ساعة
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400">لو محتاجنا بسرعة قبل ما نتصل:</p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href="tel:01278885772" className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-black px-5 py-3 rounded-2xl text-sm transition-colors">
                  <Phone className="w-4 h-4" /> اتصل بينا
                </a>
                <a href={`https://wa.me/201558625259?text=${encodeURIComponent(`مرحباً، معايا طلب صيانة رقم ${orderNumber}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-black px-5 py-3 rounded-2xl text-sm transition-colors">
                  <MessageCircle className="w-4 h-4" /> واتساب
                </a>
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

      {step < 4 && (
        <div className="mt-10 flex flex-wrap justify-center gap-4 text-xs text-slate-400 font-bold border-t border-slate-50 pt-6">
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-orange-400" /> ضمان شامل</span>
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-orange-400" /> قطع غيار أصلية أو بديلة</span>
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-orange-400" /> فنيين متخصصين</span>
        </div>
      )}
    </div>
  );
}
