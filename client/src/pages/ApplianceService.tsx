import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Phone, ShieldCheck, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ApplianceServiceData = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  keywords: string;
  image: string;
  icon: LucideIcon;
  problems: string[];
  details: string;
  faqs: { question: string; answer: string }[];
};

export const applianceServices: Record<string, ApplianceServiceData> = {
  refrigerator: {
    slug: "refrigerator-service",
    title: "صيانة ثلاجات بالإسكندرية | فني ثلاجات في المنزل",
    shortTitle: "صيانة الثلاجات",
    description: "اطلب فني ثلاجات في الإسكندرية لإصلاح ضعف التبريد وتسريب المياه وتراكم الثلج وأعطال الديب فريزر في المنزل، مع فحص واضح وضمان على الخدمة.",
    keywords: "صيانة ثلاجات الإسكندرية, فني ثلاجات, تصليح ثلاجة في المنزل, صيانة ديب فريزر, ضعف تبريد الثلاجة",
    image: "/images/services/refrigerator-repair-pro.webp",
    icon: Wrench,
    problems: ["الثلاجة لا تبرد أو التبريد ضعيف", "تسريب مياه أو تراكم ثلج", "الثلاجة تصدر صوتًا مرتفعًا", "الديب فريزر لا يجمد بشكل جيد"],
    details: "نفحص دورة التبريد والثرموستات والمروحة والضاغط ونحدد سبب العطل قبل اعتماد الإصلاح.",
    faqs: [{ question: "هل يصل فني الثلاجات إلى المنزل؟", answer: "نعم، نحدد الموعد والمنطقة ثم يصل الفني إلى منزلك داخل الإسكندرية لفحص العطل." }, { question: "هل أعرف التكلفة قبل الإصلاح؟", answer: "يتم شرح سبب العطل والتكلفة المتوقعة قبل بدء الإصلاح." }],
  },
  washing: {
    slug: "washing-machine-service",
    title: "صيانة غسالات بالإسكندرية | تصليح غسالات في المنزل",
    shortTitle: "صيانة الغسالات",
    description: "خدمة تصليح غسالات في الإسكندرية للغسالات الأوتوماتيك وفوق الأوتوماتيك وغسالات الأطباق. فني متخصص يصل إلى المنزل لفحص العطل وتأكيد التكلفة.",
    keywords: "صيانة غسالات الإسكندرية, تصليح غسالات في المنزل, فني غسالات, صيانة غسالة أوتوماتيك, إصلاح غسالة لا تعصر",
    image: "/images/services/washing-machine-repair-pro.webp",
    icon: Wrench,
    problems: ["الغسالة لا تعمل أو لا تسحب المياه", "الغسالة لا تعصر أو تهتز", "تسريب مياه من الغسالة", "الغسالة تصدر صوتًا غير طبيعي"],
    details: "نراجع دورة التشغيل والطلمبة والحساسات والسير واللوحة حسب نوع الغسالة والماركة.",
    faqs: [{ question: "هل تصلحون الغسالات الأوتوماتيك؟", answer: "نعم، نفحص الغسالات الأوتوماتيك وفوق الأوتوماتيك ونحدد سبب العطل قبل الإصلاح." }, { question: "هل يمكن حجز موعد مناسب؟", answer: "نراجع بياناتك ونتواصل معك لتأكيد المنطقة والموعد المناسب للزيارة." }],
  },
  airConditioner: {
    slug: "air-conditioner-service",
    title: "صيانة تكييفات بالإسكندرية | فني تكييف وشحن فريون",
    shortTitle: "صيانة المكيفات",
    description: "اطلب فني تكييف في الإسكندرية لتنظيف وصيانة التكييفات والسبليت، وفحص ضعف التبريد وتسريب الفريون والأعطال الكهربائية في المنزل.",
    keywords: "صيانة تكييفات الإسكندرية, فني تكييف, شحن فريون بالإسكندرية, تصليح تكييف سبليت, تنظيف تكييف",
    image: "/images/services/ac-repair-pro.webp",
    icon: Wrench,
    problems: ["التكييف لا يبرد جيدًا", "الحاجة إلى تنظيف الوحدة الداخلية", "تسريب مياه من التكييف", "فحص أو شحن الفريون"],
    details: "نفحص الفلاتر والوحدتين الداخلية والخارجية والضغوط والتوصيلات قبل تنفيذ التنظيف أو الإصلاح.",
    faqs: [{ question: "هل تقدمون صيانة تكييف سبليت؟", answer: "نعم، نقدم فحص وتنظيف وصيانة تكييفات السبليت داخل الإسكندرية." }, { question: "هل يتم شحن الفريون عند الحاجة فقط؟", answer: "نعم، نفحص سبب ضعف التبريد والتسريب أولًا، ثم نوضح الحاجة إلى الشحن قبل التنفيذ." }],
  },
  stove: {
    slug: "stove-service",
    title: "صيانة بوتاجازات وأفران بالإسكندرية | فني في المنزل",
    shortTitle: "صيانة الأفران والبوتاجازات",
    description: "خدمة صيانة بوتاجازات وأفران في الإسكندرية لفحص ضعف اللهب ومشاكل الإشعال وتسريب الغاز وأعطال الأفران والميكروويف مع مراعاة عوامل الأمان.",
    keywords: "صيانة بوتاجازات الإسكندرية, تصليح بوتاجاز في المنزل, فني أفران, صيانة فرن كهربائي, إصلاح إشعال البوتاجاز",
    image: "/images/services/stove-repair-pro.webp",
    icon: Wrench,
    problems: ["ضعف اللهب أو عدم ثباته", "الإشعال لا يعمل", "الفرن لا يسخن بدرجة كافية", "فحص تسريب أو مشكلة أمان"],
    details: "نفحص الإشعال والصمامات ومكونات التسخين والتوصيلات مع توضيح العطل قبل الإصلاح.",
    faqs: [{ question: "هل تفحصون مشاكل الإشعال والغاز؟", answer: "نعم، نفحص الإشعال والصمامات والتوصيلات مع مراعاة إجراءات الأمان." }, { question: "هل يصل الفني إلى المنزل؟", answer: "نعم، يتم تحديد الموعد ثم يصل الفني إلى العنوان داخل الإسكندرية." }],
  },
  waterHeater: {
    slug: "water-heater-service",
    title: "صيانة سخانات بالإسكندرية | فني سخانات في المنزل",
    shortTitle: "صيانة السخانات",
    description: "اطلب فني سخانات في الإسكندرية لفحص السخان الكهربائي أو الغاز ومشاكل عدم التسخين وتسريب المياه والثرموستات في المنزل.",
    keywords: "صيانة سخانات الإسكندرية, فني سخانات, تصليح سخان في المنزل, السخان لا يسخن, صيانة سخان كهرباء",
    image: "/images/services/stove-repair-pro.webp",
    icon: Wrench,
    problems: ["السخان لا يسخن المياه", "المياه تسخن ببطء", "تسريب مياه من السخان", "فحص الثرموستات والتوصيلات"],
    details: "نراجع عناصر التسخين والثرموستات والصمام والتوصيلات، ونوضح الخيارات المناسبة للإصلاح.",
    faqs: [{ question: "هل تصلحون السخان الكهربائي والغاز؟", answer: "نعم، نحدد نوع السخان والعطل ونرسل الفني المناسب للفحص." }, { question: "ما سبب ضعف تسخين المياه؟", answer: "قد يكون السبب عنصر التسخين أو الثرموستات أو التوصيلات، ويتم تحديده بالفحص." }],
  },
};

export default function ApplianceService({ service }: { service: ApplianceServiceData }) {
  const Icon = service.icon;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.shortTitle + " بالإسكندرية",
    serviceType: "Appliance Repair Service",
    provider: { "@type": "LocalBusiness", name: "Maintenance Guide", telephone: "+201278885772" },
    areaServed: { "@type": "City", name: "Alexandria" },
    description: service.description,
    url: `https://maintenanceguide.life/${service.slug}`,
  };
  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: service.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) };
  const breadcrumbSchema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "الرئيسية", item: "https://maintenanceguide.life/" }, { "@type": "ListItem", position: 2, name: service.shortTitle, item: `https://maintenanceguide.life/${service.slug}` }] };

  return (
    <div className="min-h-screen flex flex-col bg-white" dir="rtl">
      <SEO title={service.title} description={service.description} keywords={service.keywords} />
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      <Header />
      <main>
        <section className="relative overflow-hidden bg-slate-900 py-20 lg:py-28">
          <div className="absolute inset-0"><img src={service.image} alt={service.shortTitle + " بالإسكندرية"} className="h-full w-full object-cover opacity-35" loading="eager" /><div className="absolute inset-0 bg-gradient-to-l from-slate-950 via-slate-900/75 to-transparent" /></div>
          <div className="container relative z-10 mx-auto px-4">
            <div className="max-w-3xl text-right">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/20 px-4 py-2 text-sm font-black text-orange-200"><Icon className="h-5 w-5" /> خدمة منزلية داخل الإسكندرية</div>
              <h1 className="mb-7 text-4xl font-black leading-tight text-white md:text-6xl">{service.shortTitle}<br /><span className="text-orange-500">بفني يصل إلى منزلك</span></h1>
              <p className="mb-8 max-w-2xl text-lg font-bold leading-relaxed text-slate-200 md:text-2xl">{service.description}</p>
              <div className="flex flex-wrap gap-4"><a href="#booking" className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-8 py-5 text-lg font-black text-white shadow-xl hover:bg-orange-700">احجز فني الآن</a><a href="tel:01278885772" className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/20 bg-white/10 px-8 py-5 text-lg font-black text-white hover:bg-white/20"><Phone className="h-5 w-5" /> اتصل الآن</a></div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-20"><div className="container mx-auto px-4"><div className="mx-auto mb-14 max-w-3xl text-center"><h2 className="mb-5 text-4xl font-black text-slate-900">أعطال {service.shortTitle.replace("صيانة ", "")} التي نعالجها</h2><p className="text-lg font-bold leading-relaxed text-slate-600">{service.details}</p></div><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">{service.problems.map((problem) => <div key={problem} className="rounded-3xl bg-white p-7 text-right shadow-lg shadow-slate-200/50"><CheckCircle className="mb-5 h-9 w-9 text-orange-600" /><h3 className="text-lg font-black leading-relaxed text-slate-900">{problem}</h3></div>)}</div></div></section>

        <section className="bg-white py-20"><div className="container mx-auto px-4"><div className="grid gap-8 md:grid-cols-3"><div className="rounded-3xl border border-slate-100 p-8 text-center shadow-lg"><Clock className="mx-auto mb-4 h-10 w-10 text-orange-600" /><h3 className="mb-2 text-xl font-black">حجز سريع</h3><p className="font-bold text-slate-600">نراجع بياناتك ونتواصل لتأكيد الموعد.</p></div><div className="rounded-3xl border border-slate-100 p-8 text-center shadow-lg"><ShieldCheck className="mx-auto mb-4 h-10 w-10 text-orange-600" /><h3 className="mb-2 text-xl font-black">ضمان على الخدمة</h3><p className="font-bold text-slate-600">نوضح تفاصيل الضمان قبل بدء الإصلاح.</p></div><div className="rounded-3xl border border-slate-100 p-8 text-center shadow-lg"><Wrench className="mx-auto mb-4 h-10 w-10 text-orange-600" /><h3 className="mb-2 text-xl font-black">فني متخصص</h3><p className="font-bold text-slate-600">فحص مناسب لنوع الجهاز والعطل والماركة.</p></div></div></div></section>
        <section className="bg-slate-50 py-16"><div className="container mx-auto px-4"><div className="mx-auto max-w-3xl"><h2 className="mb-8 text-center text-3xl font-black text-slate-900">أسئلة شائعة عن {service.shortTitle}</h2><div className="space-y-4">{service.faqs.map((faq) => <details key={faq.question} className="rounded-2xl bg-white p-5 shadow-sm"><summary className="cursor-pointer text-lg font-black text-slate-900">{faq.question}</summary><p className="mt-3 leading-8 font-bold text-slate-600">{faq.answer}</p></details>)}</div></div></div></section>

        <section id="booking" className="bg-slate-50 py-20 scroll-mt-20"><div className="container mx-auto px-4"><h2 className="mb-5 text-center text-4xl font-black text-slate-900">احجز {service.shortTitle} الآن</h2><p className="mx-auto mb-8 max-w-2xl text-center font-bold leading-relaxed text-slate-600">أرسل بياناتك وسنتواصل معك لتأكيد المنطقة والموعد والتفاصيل قبل بدء الإصلاح.</p><div className="mx-auto max-w-2xl rounded-3xl bg-white p-2 shadow-2xl"><div className="grid grid-cols-3 gap-2 px-3 pt-3 text-center text-[10px] font-black text-slate-600 sm:text-xs"><span>فحص واضح</span><span>موعد مناسب</span><span>تأكيد قبل الإصلاح</span></div><BookingForm defaultService={service.shortTitle} /></div></div></section>
      </main>
      <Footer />
    </div>
  );
}
