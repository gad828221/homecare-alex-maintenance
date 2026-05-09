import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import { Zap, Droplet, Wind, Flame, Star, Clock, Shield, Users, Phone, MessageCircle, CheckCircle, Award, Truck } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const services = [
    {
      icon: Zap,
      title: "صيانة الثلاجات",
      description: "إصلاح وصيانة شاملة لجميع أنواع الثلاجات",
    },
    {
      icon: Droplet,
      title: "صيانة الغسالات",
      description: "خدمات متخصصة لغسالات الملابس والأطباق",
    },
    {
      icon: Wind,
      title: "صيانة المكيفات",
      description: "تنظيف وإصلاح أجهزة التكييف والتهوية",
    },
    {
      icon: Flame,
      title: "صيانة الأفران",
      description: "إصلاح وتنظيف أفران الطهي والميكروويف",
    },
  ];

  const features = [
    {
      icon: Truck,
      title: "خدمة سريعة",
      description: "وصول الفني في أقل من ساعة",
    },
    {
      icon: Award,
      title: "ضمان معتمد",
      description: "ضمان على جميع الإصلاحات والقطع",
    },
    {
      icon: Users,
      title: "فنيون محترفون",
      description: "فريق مدرب بخبرة عملية عالية",
    },
    {
      icon: Star,
      title: "أسعار منافسة",
      description: "أفضل الأسعار مع جودة عالية",
    },
  ];

  const testimonials = [
    {
      text: "خدمة ممتازة وفني محترف جداً. أنصح الجميع بهم.",
      name: "أحمد محمد",
      rating: 5,
    },
    {
      text: "سرعة في الوصول وجودة في العمل. شكراً لكم.",
      name: "فاطمة علي",
      rating: 5,
    },
    {
      text: "أسعار منافسة وضمان على الإصلاح. ممتاز جداً.",
      name: "محمود حسن",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* HERO SECTION - OPTIMIZED FOR GOOGLE ADS */}
      <section className="relative min-h-screen md:min-h-96 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900">
        <img
          src="/images/hero-bg-new.jpg"
          alt="صيانة احترافية للأجهزة المنزلية بالإسكندرية"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40"></div>
        
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-black mb-6 text-white leading-tight">
              صيانة احترافية معتمدة
              <br />
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                لجميع الأجهزة المنزلية
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-200 mb-8 font-semibold">
              صيانة متخصصة بقطع غيار أصلية • ضمان معتمد • فنيون محترفون
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">قطع غيار أصلية</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <Award className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-medium">ضمان شامل</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <Truck className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">وصول سريع</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg font-bold px-8 py-6 rounded-lg shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
                onClick={() => document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" })}
              >
                <MessageCircle className="w-6 h-6 ml-2" />
                احجز خدمتك الآن
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 text-lg font-bold px-8 py-6 rounded-lg"
                onClick={() => window.location.href = "tel:+201278885772"}
              >
                <Phone className="w-6 h-6 ml-2" />
                اتصل بنا: 01278885772
              </Button>
            </div>

            <p className="text-gray-300 text-sm">
              ✓ خدمة 24/7 • ✓ بدون تكاليف إضافية • ✓ ضمان 100%
            </p>
          </div>
        </div>
      </section>

      {/* BOOKING FORM SECTION */}
      <section id="booking-form" className="py-8 md:py-12 bg-gray-50">
        <BookingForm />
      </section>

      {/* FEATURES SECTION */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900">لماذا تختارنا؟</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              نقدم خدمات صيانة احترافية معتمدة بأسعار منافسة مع ضمان الجودة والاحترافية
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-orange-600 mx-auto rounded-full mt-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-all transform hover:-translate-y-1 border border-gray-200 bg-gradient-to-br from-white to-gray-50">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* SERVICES OVERVIEW */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">خدماتنا المتخصصة</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-xl transition-all transform hover:-translate-y-2 border-0 bg-white shadow-md">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </Card>
              );
            })}
          </div>

          {/* Detailed Services Grid */}
          <div className="space-y-12">
            {/* Refrigerators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl font-bold text-orange-600 mb-4">صيانة الثلاجات والفريزرات</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  نوفر خدمات صيانة متخصصة لجميع ماركات الثلاجات والفريزرات المشهورة. فريقنا مدرب على إصلاح جميع الأعطال الشائعة مثل عدم التبريد، تسرب المياه، وأعطال الضاغط.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> صيانة جميع الماركات والموديلات</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> إصلاح أعطال التبريد والضاغط</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> تنظيف شامل وصيانة دورية</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> استبدال قطع الغيار الأصلية</li>
                </ul>
              </div>
              <img src="/images/services/refrigerator-repair-pro.jpg" alt="صيانة الثلاجات والفريزرات" className="rounded-lg shadow-lg w-full h-80 object-cover" />
            </div>

            {/* Washing Machines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <img src="/images/services/washing-machine-repair-pro.jpg" alt="صيانة الغسالات" className="rounded-lg shadow-lg w-full h-80 object-cover order-2 md:order-1" />
              <div className="order-1 md:order-2">
                <h3 className="text-3xl font-bold text-orange-600 mb-4">صيانة الغسالات (ملابس وأطباق)</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  متخصصون في صيانة غسالات الملابس الأوتوماتيكية والعادية وغسالات الأطباق. نقدم حلول سريعة وفعالة لجميع الأعطال.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> إصلاح أعطال الدوران والعصر</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> تصليح تسرب المياه</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> استبدال المحركات والمضخات</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> صيانة دورية وتنظيف شامل</li>
                </ul>
              </div>
            </div>

            {/* Air Conditioners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl font-bold text-orange-600 mb-4">صيانة المكيفات والتكييفات</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  خدمات متكاملة لصيانة جميع أنواع المكيفات والتكييفات. نوفر تنظيف شامل وإصلاح سريع لجميع الأعطال.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> تنظيف الفلاتر والمكثفات</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> إصلاح أعطال التبريد</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> شحن الفريون والغاز</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> صيانة الوحدات الداخلية والخارجية</li>
                </ul>
              </div>
              <img src="/images/services/ac-repair-pro.jpg" alt="صيانة المكيفات والتكييفات" className="rounded-lg shadow-lg w-full h-80 object-cover" />
            </div>

            {/* Stoves and Ovens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <img src="/images/services/stove-repair-pro.jpg" alt="صيانة البوتاجاز والأفران" className="rounded-lg shadow-lg w-full h-80 object-cover order-2 md:order-1" />
              <div className="order-1 md:order-2">
                <h3 className="text-3xl font-bold text-orange-600 mb-4">صيانة البوتاجاز والأفران</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  متخصصون في إصلاح وصيانة البوتاجاز والأفران الكهربائية والغازية. نقدم خدمات تنظيف شاملة وإصلاح سريع.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> إصلاح الشعلات والفرن</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> تنظيف عميق من الدهون والأوساخ</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> استبدال القطع التالفة</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> صيانة الفرن الكهربائي والميكروويف</li>
                </ul>
              </div>
            </div>

            {/* Water Heaters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl font-bold text-orange-600 mb-4">صيانة السخانات والبويلرات</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  خدمات متخصصة لصيانة السخانات الكهربائية والغازية والبويلرات. نوفر صيانة دورية وإصلاح سريع.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> إصلاح أعطال التسخين</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> تنظيف وإزالة الترسبات</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> استبدال المحاريك والمكونات</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> صيانة دورية وفحص شامل</li>
                </ul>
              </div>
              <img src="/images/hero-bg.jpg" alt="صيانة السخانات والبويلرات" className="rounded-lg shadow-lg w-full h-80 object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">آراء عملائنا</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 border border-gray-200 hover:shadow-lg transition-all">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <p className="font-bold text-slate-900">{testimonial.name}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">هل أنت مستعد للحصول على خدمة احترافية؟</h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            احجز موعد صيانتك الآن وتمتع بخدمة سريعة واحترافية مع ضمان معتمد
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-orange-600 hover:bg-gray-100 font-bold text-lg px-8 py-6"
              onClick={() => document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" })}
            >
              احجز الآن
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 font-bold text-lg px-8 py-6"
              onClick={() => window.location.href = "tel:+201278885772"}
            >
              اتصل بنا
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
