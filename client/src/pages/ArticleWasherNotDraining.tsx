import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Droplets, Phone, CheckCircle, Wrench, AlertTriangle } from "lucide-react";

const title = "الغسالة مش بتصرف الميه؟ الأسباب وإمتى تحتاج فني";
const h1 = "الغسالة مش بتصرف الميه: الأسباب وإمتى تحتاج فني؟";
const description =
  "خطوات بسيطة تفحصها بنفسك قبل الفني: الفلتر وخرطوم الصرف والطلمبة، وإمتى تحتاج فني متخصص في الإسكندرية.";

const slug = "washer-not-draining";

type Block = { heading: string; intro?: string; items?: string[]; ordered?: boolean; outro?: string };

const blocks: Block[] = [
  {
    heading: "قبل ما تتصل بفني",
    intro: "لو الغسالة وقفت وفيها ميه، في حاجات بسيطة تقدر تلاحظها بنفسك من غير ما تفك أي جزء. دي أول حاجات اللي بينصح بيها الدعم الرسمي للشركات زي سامسونج وإل جي:",
    items: [
      "افصل فيشة الغسالة قبل أي فحص. ولو الميه سخنة من دورة سخنة، استنى حوالي ساعة تبرد عشان متكويّش إيدك.",
      "اتأكد إن البرنامج وصل فعلًا لمرحلة الصرف: لو الغسالة واقفة في نص البرنامج، جرّب تشغل برنامج «عصر/صرف» لوحده وشوف الميه بتنزل ولا لأ.",
      "بص على خرطوم الصرف من غير ما تفك أو تحرك حاجة: مش مثني ولا مضغوط ورا الغسالة، ومفيهوش قطع ظاهر، وده في الحدود اللي تقدر توصلها بأمان.",
      "اتأكد إن خرطوم الصرف متثبت على الارتفاع المكتوب في كتالوج الموديل؛ تركيبه واطي أوي أو عالي أوي بيأثر على الصرف.",
    ],
  },
  {
    heading: "الغسالة بتصرف بس ببطء؟",
    intro: "لو الميه بتنزل بس ببطء أو البرنامج بياخد وقت أطول من المعتاد، غالبًا في انسداد جزئي: فلتر الطلمبة محتاج تنضيف، أو خرطوم الصرف فيه ترسبات، أو حاجة صغيرة زي عملة معدنية أو جورب داخلة في مجرى الصرف. الصرف البطيء بيتحل غالبًا بتنضيف الفلتر، ومش شرط يكون عطل في الطلمبة نفسها.",
  },
  {
    heading: "مش بتصرف ولا بتعصر؟ اعرف الفرق",
    items: [
      "لو الغسالة مش بتصرف ولا بتعصر خالص، ممكن يكون السبب تحميل زيادة أو غير متوازن؛ قلل الحمل ووزع الهدوم وجرّب برنامج العصر لوحده.",
      "لو بتعصر عادي بس الميه مش بتنزل، المشكلة غالبًا في مجرى الصرف أو الطلمبة.",
      "لو الميه واقفة وفي صوت طنين من ناحية الطلمبة، ده مؤشر إن الطلمبة شغالة بس مش قادرة تدفع الميه، وغالبًا في انسداد أو تلف فيها.",
    ],
  },
  {
    heading: "تنضيف فلتر الطلمبة بنفسك (خطوات عامة)",
    intro: "مهم قبل أي حاجة: مش كل غسالة ليها فلتر مخصص ينضفه المستخدم بنفسه؛ موديلات كتير، ومنها أغلب غسالات الحوض العلوي، مفيهاش فلتر تقدر توصله من غير فني. راجع كتالوج الموديل الأول: لو مذكور فيه فلتر طلمبة قابل للتنضيف، الخطوات العامة في أغلب الغسالات الفوق أوتوماتيك بتكون:",
    items: [
      "افصل الفيشة، وحط فوطة وحلة واطية تحت غطاء الفلتر (غالبًا أسفل وش الغسالة).",
      "لو فيه خرطوم تفريغ صغير جنب الفلتر، افتحه وفرّغ الميه في الحلة الأول.",
      "لف الفلتر عكس عقارب الساعة وطلعه بهدوء؛ هينزل شوية ميه وده طبيعي.",
      "نضف الفلتر من الوبر والحاجات العالقة، وبص جوه التجويف لو في حاجة سادّة مروحة الطلمبة، من غير ما تدخل إيدك بعمق.",
      "ركب الفلتر بالراحة لحد ما يقفل، وقفل الغطاء، وجرّب برنامج صرف قصير.",
    ],
    ordered: true,
    outro: "لو الفلتر مش بيلف أو محتاج مجهود، متجبرش عليه وسيب الخطوة للفني.",
  },
  {
    heading: "الأسباب الشائعة لوقف الصرف",
    items: [
      "انسداد فلتر الطلمبة بالوبر والعملات والأزرار.",
      "خرطوم صرف مثني أو مسدود أو متثبت غلط.",
      "عطل في طلمبة الصرف: مروحة مكسورة أو ملف تالف.",
      "مشكلة في حساس أو لوحة التحكم.",
      "تحميل زيادة عن سعة الغسالة بيمنع العصر والصرف الصح.",
    ],
  },
];

const techSigns = [
  "عملت اللي فوق والميه لسه واقفة.",
  "صوت طنين من ناحية الطلمبة والميه مش بتتحرك.",
  "كود خطأ ظاهر على الشاشة.",
  "تسريب ميه من جسم الغسالة أو ريحة حرق، سيبها فاصلة وكلم فني.",
];

const faqs = [
  { q: "الغسالة مش بتصرف المياه، أعمل إيه؟", a: "ابدأ بالخطوات البسيطة فوق: افصل الفيشة، اتأكد من خرطوم الصرف، ونضف الفلتر. لو الميه لسه واقفة، كلم فني." },
  { q: "هل تنضيف الفلتر آمن أعمله بنفسي؟", a: "آه، بس بشرط يكون موديلك فعلًا فيه فلتر مخصص للمستخدم حسب الكتالوج، لأن مش كل الغسالات فيها. الخطوات بتختلف من موديل للتاني، وحط فوطة لأن ميه هتنزل." },
  { q: "الغسالة بتعصر بس مش بتصرف، إيه السبب؟", a: "غالبًا انسداد في الفلتر أو خرطوم الصرف، ومش شرط عطل كبير." },
  { q: "كل قد إيه أنضف فلتر الغسالة؟", a: "حوالي مرة في الشهر زي توصية الصانع، وأكتر لو بتغسل حاجات بتسيب وبر كتير." },
];

const sources = [
  { href: "https://www.samsung.com/uk/support/home-appliances/how-to-resolve-a-5e-or-5c-error-code-on-a-washing-machine", label: "دليل سامسونج لأخطاء الصرف 5E/5C" },
  { href: "https://www.lg.com/us/support/help-library/lg-washer-how-to-clean-the-drain-pump-filter--20150206838321", label: "دليل إل جي لتنضيف فلتر طلمبة الصرف" },
];

const SERVICE_HREF = "/washing-machine-service";
const SERVICE_LABEL = "صيانة غسالات بالإسكندرية";
const KEYWORDS = "الغسالة لا تصرف الماء, غسالة لا تصرف, صيانة غسالات الإسكندرية, طلمبة صرف الغسالة, تنضيف فلتر الغسالة";
const SERVICE_NAME = "الغسالات";

export default function ArticleWasherNotDraining() {
  const url = `https://www.maintenanceguide.life/articles/${slug}`;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: h1,
    description,
    inLanguage: "ar",
    author: { "@type": "Organization", name: "Maintenance Guide" },
    publisher: { "@type": "Organization", name: "Maintenance Guide" },
    mainEntityOfPage: url,
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: "https://www.maintenanceguide.life/" },
      { "@type": "ListItem", position: 2, name: h1, item: url },
    ],
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-white" dir="rtl">
      <SEO title={title} description={description} keywords={KEYWORDS} />
      <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      <Header />
      <main>
        <section className="bg-slate-900 py-20 lg:py-28">
          <div className="container mx-auto px-4 text-right">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/20 px-4 py-2 font-black text-orange-200">
              <Droplets className="h-5 w-5" /> دليل أعطال {SERVICE_NAME}
            </div>
            <h1 className="mb-7 max-w-4xl text-4xl font-black leading-tight text-white md:text-5xl">{h1}</h1>
          </div>
        </section>

        <article className="bg-white py-16">
          <div className="container mx-auto max-w-3xl px-4 space-y-14">
            {blocks.map((block) => (
              <section key={block.heading}>
                <h2 className="mb-4 text-3xl font-black text-slate-900">{block.heading}</h2>
                {block.intro && (
                  <p className="mb-6 text-lg font-bold leading-relaxed text-slate-600">{block.intro}</p>
                )}
                {block.items && (block.ordered ? (
                  <ol className="space-y-4">
                    {block.items.map((item, i) => (
                      <li key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 font-bold leading-relaxed text-slate-800">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-600 text-sm font-black text-white">{i + 1}</span>
                        {item}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <ul className="space-y-4">
                    {block.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 font-bold leading-relaxed text-slate-800">
                        <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-orange-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ))}
                {block.outro && (
                  <p className="mt-6 text-lg font-bold leading-relaxed text-slate-600">{block.outro}</p>
                )}
              </section>
            ))}

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
                href={SERVICE_HREF}
                className="inline-flex items-center gap-3 rounded-2xl bg-orange-600 px-8 py-5 text-lg font-black text-white shadow-xl transition-colors hover:bg-orange-700"
              >
                <Wrench className="h-6 w-6" /> {SERVICE_LABEL}
              </a>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-slate-900">أسئلة شائعة</h2>
              <div className="space-y-4">
                {faqs.map((f) => (
                  <div key={f.q} className="rounded-2xl bg-slate-50 p-5">
                    <h3 className="mb-2 text-xl font-black text-slate-900">{f.q}</h3>
                    <p className="font-bold leading-relaxed text-slate-700">{f.a}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <p className="text-sm font-bold leading-relaxed text-slate-500">
                الجزء الإرشادي مبني على إرشادات الصانعين والجهات الرسمية:{" "}
                {sources.map((s, i) => (
                  <span key={s.href}>
                    {i > 0 && " و"}
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-orange-700 underline decoration-orange-400 underline-offset-4">
                      {s.label}
                    </a>
                  </span>
                ))}
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
