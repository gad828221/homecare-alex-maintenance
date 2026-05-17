import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import { Star, CheckCircle, Zap, ShieldCheck, Clock, Award, Phone, MessageCircle, MapPin } from "lucide-react";

export default function ZanussiService() {
  useEffect(() => {
    // Dynamic SEO Update - Policy Compliant
    document.title = "صيانة زانوسي الإسكندرية | مركز خدمة Zanussi المتخصص 01278885772";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", "خدمة صيانة زانوسي بالإسكندرية. نحن مركز خدمة متخصص لصيانة كافة أجهزة Zanussi (ثلاجات، غسالات، تكييفات) بالمنزل بقطع غيار أصلية وضمان سنة.");
    
    // Schema Markup for Google Ads Quality Score
    const schema = {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "صيانة زانوسي الإسكندرية",
      "serviceType": "Appliance Repair Service",
      "provider": {
        "@type": "LocalBusiness",
        "name": "Maintenance Guide",
        "telephone": "+201278885772",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Alexandria",
          "addressCountry": "EG"
        }
      },
      "areaServed": "Alexandria",
      "description": "خدمة صيانة زانوسي المتخصصة في الإسكندرية بقطع غيار أصلية."
    };
    
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.innerHTML = JSON.stringify(schema);
    document.head.appendChild(script);
    
    return () => { 
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) document.head.removeChild(existingScript); 
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">
      <Header />

      {/* HERO SECTION - GOOGLE ADS HIGH CONVERSION */}
      <section className="relative min-h-[75vh] flex items-center overflow-hidden bg-yellow-900">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero-bg-new.jpg" 
            alt="صيانة زانوسي المتخصصة بالإسكندرية" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-900 via-yellow-900/70 to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 px-4 py-2 rounded-full mb-6 animate-pulse">
              <ShieldCheck className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-sm uppercase tracking-wider">مركز خدمة Zanussi المتخصص - الإسكندرية</span>
            </div>
            
            <h1 className="text-4xl md:text-7xl font-black text-white leading-tight mb-6">
              رقم صيانة <span className="text-yellow-400">زانوسي</span> <br />
              <span className="text-white">بمنزلك الآن</span> <br />
              <span className="text-2xl md:text-4xl text-slate-300">قطع غيار أصلية 100% + ضمان سنة</span>
            </h1>

            <p className="text-xl text-slate-200 mb-10 font-medium leading-relaxed max-w-2xl">
              نحن الخيار الأول لصيانة أجهزة Zanussi في الإسكندرية. نغطي كافة المناطق (سموحة، لوران، العجمي، السيوف) ونصلك خلال 60 دقيقة.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button
                size="lg"
                className="bg-yellow-600 hover:bg-yellow-700 text-white text-xl font-black px-10 py-8 rounded-2xl shadow-2xl shadow-yellow-900/40 transition-all transform hover:scale-105"
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              >
                اطلب فني زانوسي
              </Button>
              <a
                href="tel:+201278885772"
                className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white text-xl font-black px-10 py-4 rounded-2xl transition-all"
              >
                <Phone className="w-6 h-6" />
                01278885772
              </a>
            </div>
            
            <div className="flex flex-wrap gap-4 text-white/80 font-bold text-sm">
              <div className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> كشف فوري</div>
              <div className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> فاتورة رسمية</div>
              <div className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> أرخص سعر</div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST & LOCAL SIGNALS */}
      <div className="bg-white py-16 border-b border-slate-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-slate-50 rounded-3xl text-center group hover:bg-yellow-600 transition-all duration-300">
              <Clock className="w-10 h-10 text-yellow-600 mx-auto mb-4 group-hover:text-white" />
              <h4 className="font-black text-slate-900 mb-1 group-hover:text-white">وصول سريع</h4>
              <p className="text-slate-500 text-xs font-bold group-hover:text-white/80">خلال 60 دقيقة</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl text-center group hover:bg-yellow-600 transition-all duration-300">
              <ShieldCheck className="w-10 h-10 text-yellow-600 mx-auto mb-4 group-hover:text-white" />
              <h4 className="font-black text-slate-900 mb-1 group-hover:text-white">قطع أصلية</h4>
              <p className="text-slate-500 text-xs font-bold group-hover:text-white/80">بالضمان الشامل</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl text-center group hover:bg-yellow-600 transition-all duration-300">
              <Award className="w-10 h-10 text-yellow-600 mx-auto mb-4 group-hover:text-white" />
              <h4 className="font-black text-slate-900 mb-1 group-hover:text-white">ضمان عام</h4>
              <p className="text-slate-500 text-xs font-bold group-hover:text-white/80">على كافة الإصلاحات</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl text-center group hover:bg-yellow-600 transition-all duration-300">
              <MapPin className="w-10 h-10 text-yellow-600 mx-auto mb-4 group-hover:text-white" />
              <h4 className="font-black text-slate-900 mb-1 group-hover:text-white">تغطية شاملة</h4>
              <p className="text-slate-500 text-xs font-bold group-hover:text-white/80">لكافة مناطق الإسكندرية</p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SECTION - LOCAL SEO OPTIMIZED */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 leading-tight">
                أفضل مركز خدمة <span className="text-yellow-600">زانوسي</span> <br />في الإسكندرية
              </h2>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed font-medium">
                هل تعاني من أعطال في أجهزة Zanussi؟ لا داعي للقلق. نحن نوفر لك خدمة صيانة منزلية فورية باستخدام أحدث معدات الفحص الإلكتروني لتحديد العطل بدقة متناهية وتوفير التكلفة.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                {[
                  'صيانة ثلاجات زانوسي',
                  'تصليح غسالات زانوسي',
                  'صيانة تكييفات زانوسي',
                  'صيانة بوتاجازات زانوسي',
                  'فنيين متخصصين وخبراء',
                  'دعم فني 24 ساعة'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 font-black text-slate-700 bg-slate-50 p-4 rounded-2xl">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="bg-yellow-600 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-yellow-900/20">
                <h4 className="text-3xl font-black mb-4">تواصل مباشر مع الفني</h4>
                <p className="font-bold opacity-90 mb-8 text-lg">تحدث مع مهندس الصيانة الآن واعرف تكلفة الإصلاح التقريبية مجاناً.</p>
                <div className="flex flex-wrap gap-4">
                  <a href="https://wa.me/201558625259" className="inline-flex items-center gap-2 bg-white text-yellow-600 px-8 py-4 rounded-2xl font-black transition-transform hover:scale-105">
                    <MessageCircle className="w-6 h-6" />
                    واتساب
                  </a>
                  <a href="tel:+201278885772" className="inline-flex items-center gap-2 bg-yellow-800 text-white px-8 py-4 rounded-2xl font-black transition-transform hover:scale-105 border border-yellow-400/30">
                    <Phone className="w-6 h-6" />
                    اتصال فوري
                  </a>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-yellow-600/10 rounded-[3rem] blur-3xl"></div>
              <img src="/images/services/washing-machine-repair-pro.jpg" alt="فني صيانة زانوسي الإسكندرية" className="relative rounded-[3rem] shadow-2xl w-full h-[600px] object-cover" />
              <div className="absolute top-10 -right-10 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 hidden md:block animate-bounce">
                <div className="flex items-center gap-2 mb-2">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="font-black text-slate-900">أفضل خدمة في 2026</p>
                <p className="text-xs text-slate-500 font-bold">بناءً على تقييمات العملاء</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOCAL COVERAGE SECTION */}
      <section className="py-20 bg-slate-900 text-white overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-black mb-12">نغطي كافة أحياء الإسكندرية</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['سموحة', 'سيدي جابر', 'لوران', 'العجمي', 'السيوف', 'المنتزه', 'جليم', 'الإبراهيمية', 'محرم بك', 'سيدي بشر'].map(area => (
              <span key={area} className="px-6 py-3 bg-white/5 border border-white/10 rounded-full font-bold hover:bg-yellow-600 transition-colors">
                صيانة زانوسي {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING SECTION - HIGH CONVERSION */}
      <section id="contact" className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">احجز موعدك الآن</h2>
            <p className="text-xl text-slate-600 font-bold">سيقوم الفني بالتواصل معك خلال 5 دقائق فقط</p>
            <div className="w-24 h-2 bg-yellow-600 mx-auto rounded-full mt-6"></div>
          </div>
          <div className="bg-white p-2 rounded-[3rem] shadow-2xl border border-slate-200">
            <BookingForm defaultService="صيانة زانوسي" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
