import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Snowflake, Phone, CheckCircle, Wrench, AlertTriangle } from "lucide-react";

const title = "التلاجة مش بتبرد كويس؟ الأسباب وإمتى تحتاج فني";
const h1 = "التلاجة مش بتبرد كويس: الأسباب وإمتى تحتاج فني؟";
const description =
  "أسباب ضعف تبريد التلاجة وخطوات فحص بسيطة قبل الفني: الترموستات وكاوتشة الباب والتهوية، وخدمة فني لحد البيت في الإسكندرية.";

const slug = "fridge-not-cooling";

type Block = { heading: string; intro?: string; items?: string[]; ordered?: boolean; outro?: string };

const blocks: Block[] = [
  {
    heading: "قبل ما تتصل بفني",
    intro: "لو حاسس إن التبريد ضعف، في حاجات بسيطة تتشيك بنفسك قبل ما تكلم حد:",
    items: [
      "اتأكد من درجة الترموستات: المقترح 4 درجات مئوية أو أقل للتلاجة وحوالي 18 تحت الصفر للفريزر. لو المؤشر اتحرك بالغلط، التبريد هيقل.",
      "جرّب كاوتشة الباب: اقفل الباب على ورقة؛ لو بتتسحب بسهولة يبقى الباب مش بيقفل محكم والهوا السخن بيدخل.",
      "سيب مسافة تهوية ورا التلاجة وجنبها زي ما مكتوب في الكتالوج؛ اللزق في الحيطة بيرفع حرارة الضاغط وبيقلل التبريد.",
      "متملاش التلاجة أوي ومتسدش فتحات التهوية الداخلية بالأطباق؛ الهوا محتاج يعدي بين الحاجات.",
      "لو الكويلات ورا التلاجة متغطية تراب، افصل الفيشة ونضفها بفرشاة ناعمة أو مكنسة؛ التراب بيخلي الضاغط يشتغل أطول ويبرد أقل.",
    ],
  },
  {
    heading: "تلج متجمع على حيطة الفريزر؟",
    intro: "حسب الدعم الرسمي لسامسونج، أشهر أسباب تكوّن التلج إن الباب بيفضل مفتوح شوية أو مش بيقفل محكم، أو التلاجة متمليانة لدرجة إن الأكل بيمنع الباب يقفل، أو أكل سخن اتحط جوه. اتأكد الأول إن الباب بيقفل تمام ومفيش حاجة حاجزاه. لو التلج بيرجع يتكون بسرعة رغم قفل الباب كويس، ساعتها ممكن تكون مشكلة في نظام إذابة التلج (الديفروست)، ودي محتاجة فني.",
  },
  {
    heading: "ميه بتسرب تحت التلاجة؟",
    intro: "أشهر سبب انسداد مجرى تصريف ميه الديفروست: الميه بدل ما تنزل لصحن التبخير اللي ورا، بتقع جوه التلاجة أو تحتها. طريقة التنضيف بتختلف من موديل للتاني، وحالات كتير محتاجة فني.",
  },
  {
    heading: "صوت غريب؟",
    intro: "طنين المروحة والضاغط طبيعي. لو في خبط أو صوت حتة بتتكحت، ممكن تكون المروحة لاقية في تلج، أو التلاجة مش متظبطة على الأرض. ظبط الرجول بحيث التلاجة تميل لورا شوية بيساعد الباب يقفل لوحده وبيقلل الصوت.",
  },
  {
    heading: "لو التبريد وقف، إيه مصير الأكل؟",
    intro: "قاعدة إدارة الغذاء والدواء الأمريكية: التلاجة المفروض تكون 4 درجات مئوية أو أقل. لو التبريد وقف، قلل فتح الباب قد ما تقدر عشان تحافظ على البرودة. الأكل سريع الفساد (لحوم وفراخ وأسماك وألبان وبيض) اللي فضل فوق 4 درجات لأكتر من ساعتين متعتمدوش، ولو شاك في أي حاجة ارميها.",
  },
];

const techSigns = [
  "التلاجة مش بتبرد خالص والضاغط ساكت، أو بيعمل صوت طقطقة ويفصل.",
  "في أثر زيت أو ريحة غاز: ده مؤشر تسريب في دائرة التبريد.",
  "الضاغط شغال من غير توقف والتبريد ضعيف.",
  "ريحة حرق أو شرارة: افصل الفيشة فورًا وكلم فني.",
];

const faqs = [
  { q: "التلاجة شغالة بس مش بتبرد، ليه؟", a: "ابدأ بالترموستات وكاوتشة الباب والتهوية وتنضيف الكويلات. لو كل ده تمام والتبريد ضعيف، غالبًا المشكلة في دورة التبريد ومحتاجة فني." },
  { q: "إيه درجة الحرارة المناسبة؟", a: "4 درجات مئوية أو أقل للتلاجة، وحوالي 18 تحت الصفر للفريزر." },
  { q: "كل قد إيه أنضف الكويلات ورا التلاجة؟", a: "مرة أو اتنين في السنة، وأكتر لو في تراب أو حيوانات أليفة في البيت." },
  { q: "التلاجة النوفروست بتعمل تلج في الفريزر، ده طبيعي؟", a: "لأ، النوفروست المفروض ميعملش تلج ظاهر. لو في تلج بيتجمع، غالبًا في مشكلة في نظام الديفروست." },
];

const sources = [
  { href: "https://www.lg.com/us/experience/refrigerator-maintenance-tips", label: "نصائح إل جي لصيانة التلاجة" },
  { href: "https://www.samsung.com/us/support/troubleshoot/TSG10007222", label: "دليل سامسونج لتكوّن التلج" },
  { href: "https://www.fda.gov/food/buy-store-serve-safe-food/refrigerator-thermometers-cold-facts-about-food-safety", label: "إدارة الغذاء والدواء الأمريكية عن حرارة التلاجة وسلامة الأكل" },
];

const SERVICE_HREF = "/refrigerator-service";
const SERVICE_LABEL = "صيانة ثلاجات بالإسكندرية";
const KEYWORDS = "التلاجة مش بتبرد, تلاجة لا تبرد, صيانة ثلاجات الإسكندرية, تلج في الفريزر, تنضيف كويلات التلاجة";
const SERVICE_NAME = "الثلاجات";

export default function ArticleFridgeNotCooling() {
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
              <Snowflake className="h-5 w-5" /> دليل أعطال {SERVICE_NAME}
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
                الفني بيفحص في البيت ويحدد سبب العطل، ضاغط أو ثرموستات أو مروحة أو دائرة تبريد، ويوضحلك التكلفة ونوع القطعة قبل ما يبدأ الإصلاح. وبنعرفك تكلفة الكشف قبل الزيارة، وبتتخصم من الإصلاح لو وافقت عليه.
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
