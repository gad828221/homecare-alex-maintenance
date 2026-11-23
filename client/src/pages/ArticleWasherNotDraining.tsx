import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Droplets, Phone, CheckCircle, Wrench, AlertTriangle } from "lucide-react";

const title = "الغسالة مش بتصرف الميه: الأسباب وإمتى تحتاج فني؟";
const description =
  "لو الغسالة وقفت وفيها ميه: خطوات ملاحظة بسيطة تقدر تعملها بنفسك بأمان، وإمتى يبقى محتاج فني صيانة غسالات بالإسكندرية.";

const selfChecks = [
  "افصل فيشة الغسالة قبل أي فحص. ولو الميه سخنة من دورة سخنة، استنى حوالي ساعة تبرد عشان متكويّش إيدك.",
  "بص على خرطوم الصرف من غير ما تفك أو تحرك حاجة: مش مثني ولا مضغوط ورا الغسالة، ومفيهوش قطع ظاهر، وده في الحدود اللي تقدر توصلها بأمان.",
  "تنظيف فلتر الطلمبة أو تفريغ الميه المحبوسة بيختلف من موديل للتاني، وممكن ينزل ميه كتير على الأرض. الأسلم تراجع كتالوج الموديل بتاعك أو تسيب الخطوة دي للفني.",
];

const techSigns = [
  "عملت اللي فوق والميه لسه واقفة.",
  "صوت طنين من ناحية الطلمبة والميه مش بتتحرك.",
  "كود خطأ ظاهر على الشاشة.",
  "تسريب ميه من جسم الغسالة أو ريحة حرق، سيبها فاصلة وكلم فني.",
];

export default function ArticleWasherNotDraining() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    inLanguage: "ar",
    author: { "@type": "Organization", name: "Maintenance Guide" },
    publisher: { "@type": "Organization", name: "Maintenance Guide" },
    mainEntityOfPage: "https://www.maintenanceguide.life/articles/washer-not-draining",
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: "https://www.maintenanceguide.life/" },
      { "@type": "ListItem", position: 2, name: title, item: "https://www.maintenanceguide.life/articles/washer-not-draining" },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-white" dir="rtl">
      <SEO title={title} description={description} keywords="الغسالة لا تصرف الماء, غسالة لا تصرف, صيانة غسالات الإسكندرية, طلمبة صرف الغسالة" />
      <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      <Header />
      <main>
        <section className="bg-slate-900 py-20 lg:py-28">
          <div className="container mx-auto px-4 text-right">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/20 px-4 py-2 font-black text-orange-200">
              <Droplets className="h-5 w-5" /> دليل أعطال الغسالات
            </div>
            <h1 className="mb-7 max-w-4xl text-4xl font-black leading-tight text-white md:text-5xl">{title}</h1>
          </div>
        </section>

        <article className="bg-white py-16">
          <div className="container mx-auto max-w-3xl px-4 space-y-14">
            <section>
              <h2 className="mb-4 text-3xl font-black text-slate-900">قبل ما تتصل بفني</h2>
              <p className="mb-6 text-lg font-bold leading-relaxed text-slate-600">
                لو الغسالة وقفت وفيها ميه، في حاجات بسيطة تقدر تلاحظها بنفسك من غير ما تفك أي جزء. دي أول حاجات اللي بينصح بيها الدعم الرسمي للشركات زي سامسونج وإل جي:
              </p>
              <ul className="space-y-4">
                {selfChecks.map((item) => (
                  <li key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 font-bold leading-relaxed text-slate-800">
                    <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-orange-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-slate-900">إمتى تحتاج فني؟</h2>
              <ul className="space-y-4">
                {techSigns.map((item) => (
                  <li key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 font-bold leading-relaxed text-slate-800">
                    <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-orange-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl bg-slate-900 p-8 text-right">
              <h2 className="mb-4 text-3xl font-black text-white">إزاي بنشتغل</h2>
              <p className="mb-4 text-lg font-bold leading-relaxed text-slate-300">
                الفني بيفحص في البيت ويحدد سبب العطل، طلمبة أو حساس أو لوحة أو انسداد، ويوضحلك التكلفة ونوع القطعة قبل ما يبدأ الإصلاح. وبنعرفك تكلفة الكشف قبل الزيارة، وبتتخصم من الإصلاح لو وافقت عليه.
              </p>
              <p className="mb-8 text-sm font-bold leading-relaxed text-slate-400">
                المقال معلومات عامة، وتحديد العطل الفعلي بيتم بالفحص.
              </p>
              <a
                href="/washing-machine-service"
                className="inline-flex items-center gap-3 rounded-2xl bg-orange-600 px-8 py-5 text-lg font-black text-white shadow-xl transition-colors hover:bg-orange-700"
              >
                <Wrench className="h-6 w-6" /> صيانة غسالات بالإسكندرية
              </a>
            </section>

            <section>
              <p className="text-sm font-bold leading-relaxed text-slate-500">
                الجزء الإرشادي مبني على{" "}
                <a href="https://www.samsung.com/ca/support/home-appliances/water-in-your-samsung-washer-is-not-draining/" target="_blank" rel="noopener noreferrer" className="text-orange-700 underline decoration-orange-400 underline-offset-4">
                  دليل سامسونج الرسمي لمشاكل صرف الغسالة
                </a>{" "}
                و
                <a href="https://www.lg.com/levant_ar/support/product-help/CT20156023-20153391865542" target="_blank" rel="noopener noreferrer" className="text-orange-700 underline decoration-orange-400 underline-offset-4">
                  مكتبة دعم إل جي العربية
                </a>
                .
              </p>
            </section>

            <section className="text-center">
              <a href="tel:01278885772" className="inline-flex items-center gap-3 rounded-2xl bg-orange-600 px-8 py-5 text-lg font-black text-white shadow-xl hover:bg-orange-700">
                <Phone className="h-6 w-6" /> اتصل واحجز موعدك
              </a>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
