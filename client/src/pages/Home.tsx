import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import SEO from "@/components/SEO";
import {
  Star, MapPin, ShieldCheck, Headphones, Award,
  Phone, MessageCircle, ChevronDown, Truck, Users, Shield,
  Facebook
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GOOGLE_BUSINESS_PROFILE_URL = "https://www.google.com/maps/place/Service+guide+Montaza+2/data=!4m2!3m1!1s0x14f5db723bebbd65:0xd4108ebedaac095e";
const FACEBOOK_PAGE_URL = "https://www.facebook.com/Maintenance.Guide";
const PHONE_DISPLAY = "01278885772";
const PHONE_TEL = "tel:01278885772";
const WHATSAPP_MSG = `أهلًا، أنا جاي من موقع Maintenance Guide ومحتاج صيانة جهاز منزلي في الإسكندرية.
نوع الجهاز:
المنطقة:
ممكن أعرف تفاصيل الحجز وتكلفة الكشف؟`;
const WHATSAPP_URL = `https://wa.me/201558625259?text=${encodeURIComponent(WHATSAPP_MSG)}`;

const scrollToBooking = () => {
  document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
};

const deviceChooser = [
  {
    title: "غسالات",
    href: "/washing-machine-service",
    icon: <svg viewBox="0 0 40 40" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="6" y="3" width="28" height="34" rx="3" /><circle cx="20" cy="23" r="9" /><path d="M6 11h28M11 7h2m3 0h2" /></svg>,
  },
  {
    title: "ثلاجات",
    href: "/refrigerator-service",
    icon: <svg viewBox="0 0 40 40" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="9" y="2" width="22" height="36" rx="3" /><path d="M9 16h22M14 7v5m0 9v8" /></svg>,
  },
  {
    title: "تكييفات",
    href: "/air-conditioner-service",
    icon: <svg viewBox="0 0 40 40" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="2" y="7" width="36" height="17" rx="3" /><path d="M6 18h28M10 29v5m10-5v8m10-8v5" /></svg>,
  },
  {
    title: "بوتاجازات",
    href: "/stove-service",
    icon: <svg viewBox="0 0 40 40" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="6" y="4" width="28" height="33" rx="3" /><rect x="10" y="17" width="20" height="14" rx="2" /><path d="M11 10h2m6 0h2m6 0h2" /></svg>,
  },
  {
    title: "سخانات",
    href: "/water-heater-service",
    icon: <svg viewBox="0 0 40 40" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="9" y="3" width="22" height="30" rx="8" /><path d="M15 33v5m10-5v5M15 12h10M20 17v8" /></svg>,
  },
  {
    title: "غسالات أطباق",
    href: "#booking-form",
    icon: <svg viewBox="0 0 40 40" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="5" y="3" width="30" height="34" rx="3" /><path d="M5 11h30M10 7h2m4 0h2M11 19h18M11 25h18M11 31h18" /></svg>,
  },
];

const serviceCards = [
  {
    title: "الغسالات",
    href: "/washing-machine-service",
    description: "أعطال الغسيل والعصر والصرف، نحدد المشكلة ونوضح الحل.",
    img: "/images/redesign/repair.webp",
    srcSet: "/images/redesign/repair-640.webp 640w, /images/redesign/repair-1280.webp 1280w",
    sizes: "(max-width: 768px) 42vw, 360px",
    width: 1280,
    height: 720,
    featured: true,
    eager: false,
  },
  {
    title: "الثلاجات والديب فريزر",
    href: "/refrigerator-service",
    description: "مشاكل التبريد والتجميد ومتابعة أداء الجهاز.",
    img: "/images/redesign/fridge.webp",
    srcSet: "/images/redesign/fridge-360.webp 360w, /images/redesign/fridge-720.webp 720w",
    sizes: "(max-width: 768px) 42vw, 360px",
    width: 720,
    height: 540,
    featured: false,
    eager: false,
  },
  {
    title: "التكييفات",
    href: "/air-conditioner-service",
    description: "صيانة وتنظيف وفحص أعطال التكييف.",
    img: "/images/redesign/ac.webp",
    srcSet: "/images/redesign/ac-360.webp 360w, /images/redesign/ac-720.webp 720w",
    sizes: "(max-width: 768px) 42vw, 360px",
    width: 720,
    height: 540,
    featured: false,
    eager: false,
  },
  {
    title: "البوتاجازات والأفران",
    href: "/stove-service",
    description: "صيانة البوتاجازات والأفران والميكروويف.",
    img: "/images/redesign/stove.webp",
    srcSet: "/images/redesign/stove-360.webp 360w, /images/redesign/stove-720.webp 720w",
    sizes: "(max-width: 768px) 42vw, 360px",
    width: 720,
    height: 540,
    featured: false,
    eager: false,
  },
  {
    title: "السخانات",
    href: "/water-heater-service",
    description: "صيانة سخانات المياه الكهربائية والغاز.",
    img: "/images/redesign/heater.webp",
    srcSet: "/images/redesign/heater-360.webp 360w, /images/redesign/heater-720.webp 720w",
    sizes: "(max-width: 768px) 42vw, 360px",
    width: 720,
    height: 540,
    featured: false,
    eager: false,
  },
  {
    title: "غسالات الأطباق",
    href: "#booking-form",
    description: "صيانة أعطال الغسيل والصرف في غسالة الأطباق.",
    img: "/images/redesign/dishwasher.webp",
    srcSet: "/images/redesign/dishwasher-360.webp 360w, /images/redesign/dishwasher-720.webp 720w",
    sizes: "(max-width: 768px) 42vw, 360px",
    width: 720,
    height: 540,
    featured: false,
    eager: false,
  },
];

const brands = [
  { name: "SAMSUNG", path: "/samsung-service" },
  { name: "LG", path: "/lg-service" },
  { name: "SHARP", path: "/sharp-service" },
  { name: "TOSHIBA", path: "/toshiba-service" },
  { name: "ZANUSSI", path: "/zanussi-service" },
  { name: "FRESH", path: "/fresh-service" },
  { name: "BEKO", path: "/beko-service" },
  { name: "ARISTON", path: "/ariston-service" },
];

const features = [
  { icon: Truck, title: "وصول خلال ساعة", description: "نصلك في أي مكان بالإسكندرية خلال 60 دقيقة فقط من طلب الخدمة." },
  { icon: Award, title: "مدة الضمان: ٦ شهور أو سنة.", description: "شهادة ضمان شاملة وموثقة على كافة أعمال الصيانة وقطع الغيار المستبدلة." },
  { icon: Users, title: "مهندسون خبراء", description: "طاقم فني متخصص ومدرب على أحدث الموديلات العالمية لضمان جودة الإصلاح." },
  { icon: Shield, title: "قطع غيار أصلية", description: "نستخدم قطعًا أصلية أو بديلة حسب المتاح، ونوضح النوع والتكلفة قبل الإصلاح." },
];

const testimonials = [
  { name: "Coach Ahmed Elsayed", city: "تقييم على Google", comment: "عمل رائع 👏 — مقتطف مترجم من تقييم Google المنشور على ملف النشاط التجاري.", rating: 5 },
  { name: "سيد محمد", city: "تقييم على Google", comment: "من أفضل خدمات إصلاح الثلاجات في المنطقة، مع قطع غيار أصلية وضمان حقيقي — مقتطف مترجم من تقييم Google.", rating: 5 },
  { name: "Maiada Omer", city: "تقييم على Google", comment: "من أفضل الأماكن بصراحة، فريق لديه خبرة وتعامل راقٍ جدًا وخدمة ممتازة — مقتطف مترجم من تقييم Google.", rating: 5 },
];

const branches = [
  {
    name: "فرع سان ستيفانو",
    note: "المركز الرئيسي - سان ستيفانو، الإسكندرية.",
    href: "https://maps.app.goo.gl/TFccizUnkw4YeZBm6",
    color: "bg-orange-600",
  },
  {
    name: "فرع سيدي بشر",
    note: "شارع العاشر - سيدي بشر، الإسكندرية.",
    href: "https://maps.app.goo.gl/TFccizUnkw4YeZBm6",
    color: "bg-blue-600",
  },
  {
    name: "فرع 45 بحر",
    note: "شارع 45 بحر - جاد، الإسكندرية.",
    href: "https://maps.app.goo.gl/MgH5xfjExHg1UwLE8",
    color: "bg-green-600",
  },
];

const processSteps = [
  { number: "01", title: "قول لنا المشكلة", text: "نوع الجهاز والعطل اللي لاحظته، بالتليفون أو واتساب أو نموذج الحجز." },
  { number: "02", title: "نرتب الزيارة", text: "نراجع معاك بيانات الطلب والعنوان والموعد المناسب." },
  { number: "03", title: "نفحص ونوضح لك الحل", text: "تفهم العطل والتكلفة ونوع قطع الغيار قبل بدء الإصلاح." },
];

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    { q: "ما هي المناطق التي تغطيها خدمة الصيانة؟", a: "نحن نغطي كافة مناطق الإسكندرية (سموحة، سيدي جابر، لوران، العجمي، السيوف، المنتزه، العصافرة، محرم بك، وكافة المناطق المجاورة)." },
    { q: "هل تقدمون ضماناً على الصيانة؟", a: "مدة الضمان: ٦ شهور أو سنة." },
    { q: "كم يستغرق الفني للوصول إلى منزلي؟", a: "نلتزم بالوصول خلال 60 دقيقة من تأكيد الطلب، أو في الموعد الذي يحدده العميل بما يناسب وقته." },
    { q: "هل قطع الغيار المستخدمة أصلية؟", a: "نستخدم قطع غيار أصلية أو بديلة حسب المتاح وحالة الجهاز، ونوضح نوع القطعة وتكلفتها قبل الإصلاح." },
    { q: "إمتى بعرف تكلفة الكشف؟", a: "بنعرفك تكلفة الكشف قبل الزيارة، وبتتخصم من تكلفة الإصلاح لو وافقت عليه." }
  ];

  useEffect(() => {
    // Notifications disabled
  }, []);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a,
      },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f7f7] overflow-x-hidden font-sans text-[#102c42]" dir="rtl">
      <SEO
        title="صيانة أجهزة منزلية بالإسكندرية | احجز فني للمنزل الآن"
        description="احجز فني صيانة أجهزة منزلية بالإسكندرية لإصلاح الثلاجات والغسالات والتكييفات والبوتاجازات والسخانات في المنزل. فحص واضح وتأكيد للتكلفة قبل الإصلاح."
        keywords="صيانة أجهزة منزلية الإسكندرية, فني صيانة منزلية, صيانة ثلاجات الإسكندرية, صيانة غسالات الإسكندرية, صيانة تكييفات الإسكندرية, صيانة بوتاجازات, صيانة سخانات, حجز فني صيانة"
      />
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>

      {/* TOP MICRO STRIP */}
      <div className="bg-[#09283d] text-[#c1d1dc] py-2 text-[11px] tracking-wide">
        <div className="max-w-6xl mx-auto px-5 flex justify-center sm:justify-between gap-4">
          <span>صيانة أجهزة منزلية في الإسكندرية</span>
          <span dir="ltr" className="hidden sm:inline">MAINTENANCE GUIDE · ALEXANDRIA</span>
        </div>
      </div>

      <Header />

      {/* HERO */}
      <section className="bg-[#09283d] text-white relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-[47%_53%]">
          <div className="relative z-10 px-6 pt-10 pb-8 lg:py-16 lg:pl-9 lg:pr-[max(36px,calc((min(100vw,1440px)-1088px)/2))]">
            <div className="flex items-center gap-3 text-[11px] text-[#f3a06d] mb-5">
              <span className="inline-block w-7 h-0.5 bg-[#f47832]" aria-hidden="true"></span>
              MAINTENANCE GUIDE
            </div>
            <p className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.42] tracking-tight" aria-label="بيتك يكمل. وإحنا نصلّح.">
              بيتك يكمل.<br />
              <span className="text-[#fa9b61]">وإحنا نصلّح.</span>
            </p>
            <h1 className="text-[13px] leading-8 text-[#b9cbd7] max-w-sm mt-6 font-bold">
              فني صيانة أجهزة منزلية بالإسكندرية — في منزلك اليوم، بحجز سريع وضمان على الخدمة.
            </h1>
            <p className="text-[13px] leading-8 text-[#b9cbd7] max-w-sm mt-2 font-bold">
              صيانة منزلية للغسالات والثلاجات والتكييفات وباقي أجهزة البيت. نوضح لك التفاصيل والتكلفة قبل الإصلاح.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-7">
              <Button
                type="button"
                onClick={scrollToBooking}
                className="bg-[#f47832] hover:bg-[#e06a26] text-white text-[13px] font-bold px-6 py-6 rounded-[3px] shadow-lg shadow-black/20"
              >
                احجز زيارة منزلية
                <span aria-hidden="true" className="font-black">↙</span>
              </Button>
              <a
                href={PHONE_TEL}
                aria-label={`الاتصال بمركز الصيانة على ${PHONE_DISPLAY}`}
                className="text-xs font-bold text-[#e1eaf0] px-3 py-4 border-b border-[#5e7585] hover:text-white transition-colors"
              >
                اتصل بينا <bdi dir="ltr">{PHONE_DISPLAY}</bdi>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-7 text-[10px] text-[#bdcdd8] font-bold">
              <span>تكلفة واضحة قبل الإصلاح</span>
              <span className="border-r border-[#345064] pr-5">خدمة في منزلك</span>
              <span className="border-r border-[#345064] pr-5">ضمان على الإصلاح</span>
            </div>
          </div>

          <div className="relative min-h-[245px] lg:min-h-[590px] isolate">
            <img
              src="/images/redesign/repair.webp"
              srcSet="/images/redesign/repair-640.webp 640w, /images/redesign/repair-1280.webp 1280w"
              sizes="(max-width: 1024px) 100vw, 53vw"
              width="1280"
              height="720"
              alt="صورة توضيحية لأعمال صيانة أجهزة منزلية"
              className="absolute inset-0 h-full w-full object-cover object-[40%_50%]"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-l from-[#09283d] via-[#09283d]/0 to-transparent pointer-events-none" aria-hidden="true"></div>
            <div className="absolute bottom-6 right-6 lg:-right-3 w-[70px] h-[70px] lg:w-[115px] lg:h-[115px] bg-[#f47832] text-[#09283d] z-10 flex items-center justify-center -rotate-[8deg] shadow-xl" aria-hidden="true">
              <span className="rotate-[8deg] font-black text-3xl lg:text-5xl" dir="ltr">MG</span>
            </div>
            <small className="absolute bottom-3 left-3 lg:bottom-6 lg:left-7 text-[8px] lg:text-[10px] bg-[#09283d]/70 text-white px-2.5 py-1 z-10">
              صورة توضيحية مولّدة للتصميم
            </small>
          </div>
        </div>
      </section>

      {/* DEVICE CHOOSER */}
      <section className="relative z-10 bg-white border-b border-[#dce3e7]" aria-labelledby="device-chooser-heading">
        <div className="max-w-6xl mx-auto px-5 grid grid-cols-3 lg:grid-cols-[1.3fr_repeat(6,1fr)] items-stretch">
          <div className="col-span-3 lg:col-span-1 py-6 lg:py-7 self-center flex lg:block items-center justify-between">
            <small className="block text-[#bb5d2d] text-[10px] font-bold mb-1">نبدأ من هنا</small>
            <h2 id="device-chooser-heading" className="text-lg lg:text-xl font-black">أنهي جهاز محتاجنا؟</h2>
          </div>
          {deviceChooser.map((device) => (
            <a
              key={device.title}
              href={device.href}
              className="flex flex-col items-center justify-center gap-2 py-5 px-2 text-[11px] lg:text-xs font-bold text-[#102c42] lg:border-r lg:border-[#e6ebed] hover:bg-orange-50 hover:text-[#e06a26] transition-colors"
            >
              <span className="text-[#315f7d]">{device.icon}</span>
              <span>{device.title} <em className="not-italic text-[#ec752f] hidden lg:inline" aria-hidden="true">↙</em></span>
            </a>
          ))}
        </div>
      </section>

      {/* SERVICES WITH PHOTOS */}
      <section className="py-12 lg:py-20" aria-labelledby="services-heading">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8 lg:mb-9">
            <div>
              <p className="text-[10px] tracking-[2px] text-[#b65d31] font-bold mb-3">صيانة على قد احتياج بيتك</p>
              <h2 id="services-heading" className="text-3xl lg:text-4xl font-black leading-relaxed">لكل جهاز، عناية.</h2>
            </div>
            <p className="text-xs text-[#6b7e8c] max-w-xs leading-6 font-bold">اختار الخدمة المناسبة لجهازك، وابدأ حجز الزيارة بخطوات بسيطة.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceCards.map((card) => (
              <a
                key={card.title}
                href={card.href}
                className={`group bg-white overflow-hidden grid grid-cols-[42%_58%] md:block transition-shadow hover:shadow-xl ${card.featured ? "md:bg-[#e8eef2]" : ""}`}
              >
                <div className="h-full min-h-[150px] md:h-[218px] overflow-hidden">
                  <img
                    src={card.img}
                    srcSet={card.srcSet}
                    sizes={card.sizes}
                    width={card.width}
                    height={card.height}
                    alt={`صورة توضيحية لخدمة ${card.title}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-4 md:p-6 self-center">
                  <h3 className="text-base md:text-lg font-black flex items-center justify-between gap-2">
                    {card.title}
                    <span className="text-[#e97635]" aria-hidden="true">↙</span>
                  </h3>
                  <p className="text-[11px] leading-5 text-[#6b7e8c] mt-2 font-bold">{card.description}</p>
                </div>
              </a>
            ))}
          </div>
          <p className="text-[10px] text-[#81929b] mt-5 font-bold">صور الخدمات توضيحية مولّدة للتصميم، وليست صورًا لأعمال أو فريق المركز.</p>
        </div>
      </section>

      {/* PROCESS */}
      <section className="bg-white" aria-labelledby="process-heading">
        <div className="max-w-6xl mx-auto px-5 py-12 lg:py-18 grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8 lg:gap-16 lg:py-16">
          <div>
            <p className="text-[10px] tracking-[2px] text-[#b65d31] font-bold mb-3">من أول مكالمة لحد الإصلاح</p>
            <h2 id="process-heading" className="text-3xl lg:text-4xl font-black leading-relaxed">الخطوات واضحة.<br />والقرار ليك.</h2>
            <div className="w-10 h-1 bg-[#f47832] mt-6" aria-hidden="true"></div>
            <p className="text-[10px] text-[#81929b] mt-6 leading-5 font-bold hidden lg:block">نوع قطعة الغيار وتكلفتها يتوضحوا لك قبل التركيب.</p>
          </div>
          <div>
            {processSteps.map((step, index) => (
              <div key={step.number} className={`grid grid-cols-[32px_1fr] lg:grid-cols-[40px_1fr] gap-4 lg:gap-5 py-5 ${index > 0 ? "border-t border-[#e2e7ea]" : "pt-0"}`}>
                <span className="text-2xl lg:text-3xl text-[#d7753d]" aria-hidden="true">{step.number}</span>
                <div>
                  <h3 className="text-sm lg:text-base font-black">{step.title}</h3>
                  <p className="text-[11px] text-[#6a7f8e] mt-1.5 leading-5 font-bold">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING */}
      <section id="booking-form" className="bg-[#153a53] text-white scroll-mt-24" aria-labelledby="booking-heading">
        <div className="max-w-6xl mx-auto px-5 py-11 lg:py-16 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          <div>
            <p className="text-[10px] tracking-[2px] text-[#f9ab7c] font-bold mb-3">معاك في الإسكندرية</p>
            <h2 id="booking-heading" className="text-3xl lg:text-4xl font-black leading-relaxed">نرجّع يومك لطبيعته.</h2>
            <p className="text-xs text-[#bacfdd] leading-6 mt-4 font-bold max-w-md">
              احكي لنا عن الجهاز والمشكلة، وسيب بيانات التواصل لترتيب الزيارة. بنعرفك تكلفة الكشف قبل الزيارة، وبتتخصم من تكلفة الإصلاح لو وافقت عليه.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="التواصل عبر واتساب على 01558625259"
                className="inline-flex items-center gap-2 bg-white text-[#17374c] text-[13px] font-bold px-6 py-4 rounded-[3px] hover:bg-orange-50 transition-colors"
              >
                تواصل على واتساب
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href={PHONE_TEL}
                aria-label={`الاتصال بمركز الصيانة على ${PHONE_DISPLAY}`}
                className="inline-flex items-center gap-2 border border-white/40 text-white text-[13px] font-bold px-6 py-4 rounded-[3px] hover:bg-white/10 transition-colors"
              >
                <Phone className="w-4 h-4" aria-hidden="true" />
                <bdi dir="ltr">{PHONE_DISPLAY}</bdi>
              </a>
            </div>
          </div>
          <div className="bg-white text-[#153a53] rounded p-1.5 shadow-2xl">
            <BookingForm />
          </div>
        </div>
      </section>

      {/* WHY US - preserved copy */}
      <section className="py-12 lg:py-20" aria-labelledby="why-us-heading">
        <div className="max-w-6xl mx-auto px-5">
          <div className="mb-8 lg:mb-12">
            <p className="text-[10px] tracking-[2px] text-[#b65d31] font-bold mb-3">ليه Maintenance Guide؟</p>
            <h2 id="why-us-heading" className="text-3xl lg:text-4xl font-black leading-relaxed">لماذا نحن الخيار الأول بالإسكندرية؟</h2>
            <p className="text-xs text-[#6b7e8c] max-w-md leading-6 mt-3 font-bold">نجمع بين الخبرة الهندسية والسرعة في التنفيذ لنقدم لك تجربة صيانة لا مثيل لها.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white p-6 lg:p-8 border border-[#e6ebed]">
                <div className="w-12 h-12 bg-[#09283d] flex items-center justify-center mb-5">
                  <feature.icon className="w-6 h-6 text-[#f47832]" aria-hidden="true" />
                </div>
                <h3 className="text-base font-black mb-2">{feature.title}</h3>
                <p className="text-[11px] text-[#6b7e8c] font-bold leading-5">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BRANDS */}
      <section className="bg-white border-y border-[#e6ebed] py-8" aria-label="ماركات نخدمها">
        <div className="max-w-6xl mx-auto px-5 flex flex-wrap justify-center items-center gap-x-8 gap-y-3">
          {brands.map((brand) => (
            <a
              key={brand.path}
              href={brand.path}
              className="text-lg lg:text-2xl font-black tracking-tighter text-slate-300 hover:text-[#f47832] transition-colors"
              aria-label={`صيانة ${brand.name} في الإسكندرية`}
            >
              {brand.name}
            </a>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS - preserved copy */}
      <section className="py-12 lg:py-20 bg-[#09283d] text-white" aria-labelledby="testimonials-heading">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8 lg:mb-12">
            <div>
              <p className="text-[10px] tracking-[2px] text-[#f9ab7c] font-bold mb-3">آراء حقيقية</p>
              <h2 id="testimonials-heading" className="text-3xl lg:text-4xl font-black leading-relaxed">ماذا يقول عملاؤنا؟</h2>
              <p className="text-[11px] text-[#b9cbd7] font-bold mt-3">مقتطفات من التقييمات العامة المنشورة على ملفنا التجاري في Google</p>
            </div>
            <a
              href={GOOGLE_BUSINESS_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[12px] font-bold text-white border border-white/30 px-5 py-3 rounded-[3px] hover:bg-white/10 transition-colors self-start lg:self-auto"
            >
              <Star className="w-4 h-4 text-[#f9ab7c] fill-current" aria-hidden="true" />
              شاهد التقييمات الحقيقية على Google
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <figure key={t.name} className="bg-white/5 border border-white/10 p-6 lg:p-8">
                <div className="flex gap-1 mb-4" aria-label={`تقييم ${t.rating} من 5`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 text-[#f9ab7c] fill-current" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="text-[13px] font-bold leading-7 italic">"{t.comment}"</blockquote>
                <figcaption className="mt-5">
                  <p className="font-black text-sm">{t.name}</p>
                  <p className="text-[10px] text-[#b9cbd7] font-bold">{t.city}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* BRANCHES - preserved data */}
      <section className="py-12 lg:py-20" aria-labelledby="branches-heading">
        <div className="max-w-6xl mx-auto px-5">
          <div className="mb-8 lg:mb-12">
            <p className="text-[10px] tracking-[2px] text-[#b65d31] font-bold mb-3">قريبين منك</p>
            <h2 id="branches-heading" className="text-3xl lg:text-4xl font-black leading-relaxed">فروعنا في الإسكندرية</h2>
            <p className="text-xs text-[#6b7e8c] max-w-md leading-6 mt-3 font-bold">نحن قريبون منك دائماً لضمان أسرع خدمة صيانة.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {branches.map((branch) => (
              <div key={branch.name} className="bg-white border border-[#e6ebed] p-6 lg:p-8">
                <div className={`w-12 h-12 ${branch.color} flex items-center justify-center mb-5`}>
                  <MapPin className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <h3 className="text-base font-black mb-2">{branch.name}</h3>
                <p className="text-[11px] text-[#6b7e8c] font-bold leading-5 mb-4">{branch.note}</p>
                <a
                  href={branch.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[12px] font-black text-[#e06a26] hover:gap-3 transition-all"
                >
                  عرض الموقع على الخريطة
                  <span aria-hidden="true">↙</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GOOGLE MAP */}
      <section className="py-12 lg:py-16 bg-white border-y border-[#e6ebed]" aria-labelledby="map-heading">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-7">
            <div>
              <h2 id="map-heading" className="text-2xl lg:text-3xl font-black">موقعنا على خرائط Google</h2>
              <p className="text-[11px] text-[#6b7e8c] font-bold leading-5 mt-2">اعرف موقعنا وشاهد ملف النشاط التجاري والتقييمات قبل طلب الخدمة.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={GOOGLE_BUSINESS_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#f47832] hover:bg-[#e06a26] text-white text-[12px] font-bold px-5 py-3 rounded-[3px] transition-colors"
              >
                <MapPin className="w-4 h-4" aria-hidden="true" />
                فتح الاتجاهات في Google Maps
              </a>
              <a
                href={FACEBOOK_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="صفحة Maintenance Guide على فيسبوك"
                className="inline-flex items-center gap-2 bg-[#1877f2] hover:bg-[#0f66d6] text-white text-[12px] font-bold px-5 py-3 rounded-[3px] transition-colors"
              >
                <Facebook className="w-4 h-4" aria-hidden="true" />
                تابعنا على فيسبوك
              </a>
            </div>
          </div>
          <div className="overflow-hidden border-4 border-white shadow-xl">
            <iframe
              src="https://www.google.com/maps?q=Service%20guide%20Montaza%202%2C%20San%20Stefano%2C%20Alexandria%2C%20Egypt&output=embed"
              title="موقع Maintenance Guide على خرائط Google"
              className="block h-[300px] w-full md:h-[400px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* FAQ - preserved copy + schema */}
      <section className="py-12 lg:py-20" aria-labelledby="faq-heading">
        <div className="max-w-4xl mx-auto px-5">
          <div className="mb-8 lg:mb-12">
            <p className="text-[10px] tracking-[2px] text-[#b65d31] font-bold mb-3">عندك سؤال؟</p>
            <h2 id="faq-heading" className="text-3xl lg:text-4xl font-black leading-relaxed">الأسئلة الشائعة</h2>
            <p className="text-xs text-[#6b7e8c] font-bold mt-3">كل ما تريد معرفته عن خدماتنا</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={faq.q} className="bg-white border border-[#e6ebed] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  aria-expanded={activeFaq === index}
                  className="w-full flex items-center justify-between gap-4 p-5 lg:p-6 text-right hover:bg-orange-50/50 transition-colors"
                >
                  <span className="text-sm lg:text-base font-black">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-[#e06a26] shrink-0 transition-transform duration-300 ${activeFaq === index ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
                <AnimatePresence>
                  {activeFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 lg:px-6 pb-5 text-[13px] text-[#6b7e8c] font-bold leading-7"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="contact" className="py-12 lg:py-20 bg-[#09283d] text-white scroll-mt-24" aria-labelledby="contact-heading">
        <div className="max-w-6xl mx-auto px-5">
          <div className="max-w-3xl">
            <p className="text-[10px] tracking-[2px] text-[#f9ab7c] font-bold mb-3">جاهز تبدأ؟</p>
            <h2 id="contact-heading" className="text-3xl sm:text-4xl lg:text-5xl font-black leading-snug mb-5">جاهز لإصلاح جهازك؟</h2>
            <p className="text-[13px] text-[#b9cbd7] font-bold leading-7 mb-7 max-w-xl">
              احجز الآن وسنتواصل معك لتأكيد الموعد، مع خدمة منزلية وقطع غيار موثوقة وضمان على الإصلاح.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <Button
                type="button"
                onClick={scrollToBooking}
                className="bg-[#f47832] hover:bg-[#e06a26] text-white text-[13px] font-bold px-6 py-6 rounded-[3px]"
              >
                احجز موعدك الآن
              </Button>
              <a
                href={PHONE_TEL}
                aria-label={`الاتصال بمركز الصيانة على ${PHONE_DISPLAY}`}
                className="inline-flex items-center gap-2 border border-[#5e7585] hover:bg-white/10 text-white text-[13px] font-bold px-6 py-4 rounded-[3px] transition-colors"
              >
                <Phone className="w-4 h-4" aria-hidden="true" />
                اتصل الآن <bdi dir="ltr">{PHONE_DISPLAY}</bdi>
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="التواصل عبر واتساب على 01558625259"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-[13px] font-bold px-6 py-4 rounded-[3px] transition-colors"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                واتساب
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#f47832] flex items-center justify-center shrink-0">
                  <Headphones className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-black">دعم فني 24/7</h3>
                  <p className="text-[11px] text-[#b9cbd7] font-bold">نحن معك في أي وقت، حتى في العطلات الرسمية.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-black">شهادة ضمان موثقة</h3>
                  <p className="text-[11px] text-[#b9cbd7] font-bold">تضمن لك حقك في إعادة الصيانة مجاناً خلال فترة الضمان.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
