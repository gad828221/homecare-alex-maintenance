import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MapPin, Phone, CheckCircle } from "lucide-react";

const areas = [
  "سموحة", "سيدي جابر", "سيدي بشر", "لوران", "سان ستيفانو", "ميامي",
  "العصافرة", "المندرة", "المنتزه", "العجمي", "محرم بك", "محطة الرمل",
  "كليوباترا", "كامب شيزار", "رشدي", "فلمنج", "الإبراهيمية", "المنشية",
];

export default function ServiceAreas() {
  return (
    <div className="min-h-screen flex flex-col bg-white" dir="rtl">
      <SEO
        title="مناطق خدمة الصيانة في الإسكندرية | فني أجهزة منزلية قريب منك"
        description="نقدم صيانة أجهزة منزلية في سموحة وسيدي جابر وسيدي بشر ولوران وسان ستيفانو وميامي والعجمي ومناطق الإسكندرية. احجز فني ثلاجات أو غسالات أو تكييفات في المنزل."
        keywords="صيانة سموحة, صيانة سيدي بشر, صيانة سيدي جابر, صيانة لوران, صيانة سان ستيفانو, صيانة ميامي, صيانة العجمي, فني صيانة قريب مني"
      />
      <Header />
      <main>
        <section className="bg-slate-900 py-20 lg:py-28"><div className="container mx-auto px-4 text-right"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/20 px-4 py-2 font-black text-orange-200"><MapPin className="h-5 w-5" /> تغطية واسعة داخل الإسكندرية</div><h1 className="mb-7 max-w-4xl text-4xl font-black leading-tight text-white md:text-6xl">فني صيانة قريب منك<br /><span className="text-orange-500">في مناطق الإسكندرية</span></h1><p className="max-w-3xl text-lg font-bold leading-relaxed text-slate-300 md:text-2xl">ننسق زيارة الفني إلى منزلك حسب المنطقة ونوع الجهاز والموعد المناسب، مع فحص واضح وتأكيد التفاصيل قبل بدء الخدمة.</p></div></section>
        <section className="bg-slate-50 py-20"><div className="container mx-auto px-4"><div className="mx-auto mb-12 max-w-3xl text-center"><h2 className="mb-5 text-4xl font-black text-slate-900">المناطق التي نخدمها</h2><p className="text-lg font-bold leading-relaxed text-slate-600">إذا لم تجد منطقتك في القائمة، تواصل معنا وسنتحقق من إمكانية إرسال الفني إليك.</p></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{areas.map((area) => <div key={area} className="flex items-center gap-2 rounded-2xl bg-white p-4 font-black text-slate-800 shadow-sm"><CheckCircle className="h-5 w-5 shrink-0 text-orange-600" />{area}</div>)}</div></div></section>
        <section className="bg-white py-20"><div className="container mx-auto px-4"><div className="mx-auto max-w-3xl text-center"><h2 className="mb-6 text-4xl font-black text-slate-900">ما الخدمة التي تحتاجها؟</h2><p className="mb-8 text-lg font-bold text-slate-600">صيانة ثلاجات، غسالات، تكييفات، بوتاجازات وسخانات في المنزل داخل الإسكندرية.</p><a href="tel:01278885772" className="inline-flex items-center gap-3 rounded-2xl bg-orange-600 px-8 py-5 text-lg font-black text-white shadow-xl hover:bg-orange-700"><Phone className="h-6 w-6" /> اتصل واحجز موعدك</a></div></div></section>
      </main>
      <Footer />
    </div>
  );
}
