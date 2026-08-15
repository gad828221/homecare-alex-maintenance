import SEO from '../components/SEO';
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import { Star, CheckCircle, Zap, ShieldCheck, Clock, Award, Phone, MessageCircle, MapPin } from "lucide-react";
import { updateSEO, brandSEOData } from "@/utils/seoUtils";

export default function SamsungService() {
  useEffect(() => {
    // Update SEO Meta Tags
    updateSEO({
      ...brandSEOData.samsung,
      canonicalUrl: "https://www.maintenanceguide.life/samsung-service"
    });

    // Schema Markup for Google Ads Quality Score
    const schema = {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "صيانة سامسونج الإسكندرية",
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
      "description": "خدمة صيانة سامسونج المتخصصة في الإسكندرية بقطع غيار أصلية."
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
    <>
      <SEO title="صيانة Samsung الإسكندرية | مركز خدمة معتمد" description="مركز صيانة Samsung المتخصص في الإسكندرية. خدمة سريعة وضمان معتمد على قطع الغيار الأصلية لجميع أجهزة Samsung." keywords="صيانة Samsung, توكيل Samsung الاسكندرية, اصلاح Samsung" />
      <div className="min-h-screen flex flex-col bg-white overflow-x-hidden" dir="rtl">
      <Header />

      {/* HERO SECTION */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-slate-900 pt-20">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/brands/samsung-hero.jpg"
            alt="صيانة أجهزة سامسونج بالإسكندرية"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-slate-900 via-slate-900/60 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-right">
              <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-8">
                صيانة <span className="text-blue-400">سامسونج</span> <br />
                احترافية بالإسكندرية
              </h1>
              <p className="text-xl md:text-2xl text-slate-300 mb-8 font-bold">
                متخصصون في إصلاح جميع أجهزة سامسونج (ثلاجات، غسالات، تكييفات) بقطع غيار أصلية وضمان معتمد.
              </p>
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xl font-black px-12 py-8 rounded-2xl"
                onClick={() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" })}
              >
                احجز فني سامسونج الآن
              </Button>
            </div>

            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-2 rounded-3xl shadow-2xl">
                <BookingForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 text-center mb-16">خدمات صيانة سامسونج</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "صيانة الثلاجات", desc: "إصلاح فوري لجميع مشاكل الثلاجات والديب فريزر" },
              { icon: ShieldCheck, title: "صيانة الغسالات", desc: "تصليح غسالات الملابس والأطباق الأوتوماتيك" },
              { icon: Clock, title: "صيانة التكييفات", desc: "تنظيف وشحن فريون وإصلاح جميع أنواع التكييفات" },
            ].map((service, i) => (
              <Card key={i} className="p-8 text-center hover:shadow-xl transition-all">
                <service.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-slate-900 mb-3">{service.title}</h3>
                <p className="text-slate-600 font-bold">{service.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 text-center mb-16">لماذا نحن؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[
              { icon: Award, title: "ضمان معتمد", desc: "ضمان شامل لمدة عام على جميع الإصلاحات" },
              { icon: Clock, title: "وصول سريع", desc: "وصول الفني خلال 60 دقيقة من الطلب" },
              { icon: CheckCircle, title: "قطع أصلية", desc: "استخدام قطع غيار أصلية من الوكيل" },
              { icon: ShieldCheck, title: "فنيين خبراء", desc: "فريق متخصص ومدرب على أحدث الموديلات" },
            ].map((item, i) => (
              <div key={i} className="flex gap-6">
                <item.icon className="w-12 h-12 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 font-bold">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16">آراء عملائنا</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "أحمد محمد", comment: "خدمة ممتازة وسريعة جداً. الفني وصل في الموعد وصلح الثلاجة بسرعة." },
              { name: "فاطمة علي", comment: "أفضل مركز صيانة تعاملت معه. احترافية وضمان حقيقي على الإصلاح." },
              { name: "محمود حسن", comment: "الغسالة كانت معطلة والفني أصلحها في أقل من ساعة. شكراً لكم!" },
            ].map((t, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-5 h-5 fill-yellow-300 text-yellow-300" />)}
                </div>
                <p className="text-lg font-bold mb-4">"{t.comment}"</p>
                <p className="font-black text-lg">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING SECTION */}
      <section id="booking" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 text-center mb-12">احجز موعدك الآن</h2>
          <div className="max-w-2xl mx-auto">
            <BookingForm />
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8">تواصل معنا الآن</h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a href="tel:01278885772" className="flex items-center justify-center gap-3 bg-white text-blue-600 font-black px-10 py-6 rounded-2xl hover:bg-slate-100 transition-all text-xl">
              <Phone className="w-6 h-6" /> اتصل الآن
            </a>
            <a href="https://wa.me/201558625259" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 bg-green-500 text-white font-black px-10 py-6 rounded-2xl hover:bg-green-600 transition-all text-xl">
              <MessageCircle className="w-6 h-6" /> واتساب
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
    </>
  );
}
