import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import { Zap, Droplet, Wind, Flame, Star, Clock, Shield, Users, Phone, MessageCircle } from "lucide-react";
import { useState } from "react";

export default function Home() {
  // Booking form is now in a separate component

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
      icon: Clock,
      title: "خدمة سريعة",
      description: "وصول الفني في أقل من ساعة",
    },
    {
      icon: Shield,
      title: "ضمان الجودة",
      description: "ضمان على جميع الإصلاحات",
    },
    {
      icon: Users,
      title: "فنيون محترفون",
      description: "فريق متدرب وذو خبرة",
    },
    {
      icon: Star,
      title: "أسعار منافسة",
      description: "أفضل الأسعار في السوق",
    },
  ];

  // Booking form logic moved to BookingForm component

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-orange-50">
      <Header />

      {/* Hero Section */}
      <section className="relative h-96 overflow-hidden">
        <img
          src="/images/hero-bg-new.jpg"
          alt="صيانة احترافية"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">خدمات صيانة احترافية بالإسكندرية</h1>
            <p className="text-xl md:text-2xl mb-8">صيانة متخصصة لجميع الأجهزة المنزلية - ثلاجات، غسالات، تكييفات، سخانات، بوتاجاز</p>
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
            >
              احجز خدمتك الآن
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section - Using BookingForm Component */}
      <section id="contact">
        <BookingForm />
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-b from-blue-100/50 to-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-orange-600 bg-clip-text text-transparent">لماذا تختارنا؟</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              const colors = ['from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-600', 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-600', 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-600', 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-600'];
              const colorClass = colors[index % colors.length];
              return (
                <Card key={index} className={`p-8 text-center hover:shadow-xl transition-all transform hover:scale-105 bg-gradient-to-br ${colorClass} border-2`}>
                  <IconComponent className="w-14 h-14 mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-3 text-slate-900">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gradient-to-b from-white to-orange-50/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-orange-600 bg-clip-text text-transparent">خدماتنا</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              const bgColors = ['from-red-500/20 to-red-600/10 border-red-500/30', 'from-blue-500/20 to-blue-600/10 border-blue-500/30', 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30', 'from-orange-500/20 to-orange-600/10 border-orange-500/30'];
              const bgColor = bgColors[index % bgColors.length];
              return (
                <Card
                  key={index}
                  className={`p-8 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer transform bg-gradient-to-br ${bgColor} border-2`}
                >
                  <IconComponent className="w-16 h-16 text-orange-500 mb-4" />
                  <h3 className="font-bold text-lg mb-3 text-slate-900">{service.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gradient-to-b from-yellow-50/50 to-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-orange-600 bg-clip-text text-transparent">آراء عملائنا</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "أحمد محمد",
                text: "خدمة ممتازة وفني محترف جداً. أنصح الجميع بهم.",
                rating: 5,
              },
              {
                name: "فاطمة علي",
                text: "سرعة في الوصول وجودة في العمل. شكراً لكم.",
                rating: 5,
              },
              {
                name: "محمود حسن",
                text: "أسعار منافسة وضمان على الإصلاح. ممتاز جداً.",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex gap-1 mb-3">
                  {Array(testimonial.rating)
                    .fill(0)
                    .map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                </div>
                <p className="text-gray-600 mb-4">{testimonial.text}</p>
                <p className="font-bold">{testimonial.name}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Services Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <h2 className="text-4xl font-bold text-center mb-12">خدماتنا المتخصصة</h2>
          
          {/* Refrigerators */}
          <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-orange-600 mb-4">صيانة الثلاجات والفريزرات</h3>
              <p className="text-gray-700 mb-4">نوفر خدمات صيانة متخصصة لجميع ماركات الثلاجات والفريزرات المشهورة. فريقنا مدرب على إصلاح جميع الأعطال الشائعة مثل عدم التبريد، تسرب المياه، وأعطال الضاغط.</p>
              <ul className="space-y-2 text-gray-600">
                <li>✓ صيانة جميع الماركات والموديلات</li>
                <li>✓ إصلاح أعطال التبريد والضاغط</li>
                <li>✓ تنظيف شامل وصيانة دورية</li>
                <li>✓ استبدال قطع الغيار الأصلية</li>
              </ul>
            </div>
            <img src="/images/services/refrigerator-repair-pro.jpg" alt="صيانة الثلاجات" className="rounded-lg shadow-lg" />
          </div>

          {/* Washing Machines */}
          <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <img src="/images/services/washing-machine-repair-pro.jpg" alt="صيانة الغسالات" className="rounded-lg shadow-lg order-2 md:order-1" />
            <div className="order-1 md:order-2">
              <h3 className="text-2xl font-bold text-orange-600 mb-4">صيانة الغسالات (ملابس وأطباق)</h3>
              <p className="text-gray-700 mb-4">متخصصون في صيانة غسالات الملابس الأوتوماتيكية والعادية وغسالات الأطباق. نقدم حلول سريعة وفعالة لجميع الأعطال.</p>
              <ul className="space-y-2 text-gray-600">
                <li>✓ إصلاح أعطال الدوران والعصر</li>
                <li>✓ تصليح تسرب المياه</li>
                <li>✓ استبدال المحركات والمضخات</li>
                <li>✓ صيانة دورية وتنظيف شامل</li>
              </ul>
            </div>
          </div>

          {/* Air Conditioners */}
          <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-orange-600 mb-4">صيانة المكيفات والتكييفات</h3>
              <p className="text-gray-700 mb-4">خدمات متكاملة لصيانة جميع أنواع المكيفات والتكييفات. نوفر تنظيف شامل وإصلاح سريع لجميع الأعطال.</p>
              <ul className="space-y-2 text-gray-600">
                <li>✓ تنظيف الفلاتر والمكثفات</li>
                <li>✓ إصلاح أعطال التبريد</li>
                <li>✓ شحن الفريون والغاز</li>
                <li>✓ صيانة الوحدات الداخلية والخارجية</li>
              </ul>
            </div>
            <img src="/images/services/ac-repair-pro.jpg" alt="صيانة المكيفات" className="rounded-lg shadow-lg" />
          </div>

          {/* Stoves and Ovens */}
          <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <img src="/images/services/stove-repair-pro.jpg" alt="صيانة البوتاجاز" className="rounded-lg shadow-lg order-2 md:order-1" />
            <div className="order-1 md:order-2">
              <h3 className="text-2xl font-bold text-orange-600 mb-4">صيانة البوتاجاز والأفران</h3>
              <p className="text-gray-700 mb-4">متخصصون في إصلاح وصيانة البوتاجاز والأفران الكهربائية والغازية. نقدم خدمات تنظيف شاملة وإصلاح سريع.</p>
              <ul className="space-y-2 text-gray-600">
                <li>✓ إصلاح الشعلات والفرن</li>
                <li>✓ تنظيف عميق من الدهون والأوساخ</li>
                <li>✓ استبدال القطع التالفة</li>
                <li>✓ صيانة الفرن الكهربائي والميكروويف</li>
              </ul>
            </div>
          </div>

          {/* Water Heaters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-orange-600 mb-4">صيانة السخانات والبويلرات</h3>
              <p className="text-gray-700 mb-4">خدمات متخصصة لصيانة السخانات الكهربائية والغازية والبويلرات. نوفر صيانة دورية وإصلاح سريع.</p>
              <ul className="space-y-2 text-gray-600">
                <li>✓ إصلاح أعطال التسخين</li>
                <li>✓ تنظيف وإزالة الترسبات</li>
                <li>✓ استبدال المحاريك والمكونات</li>
                <li>✓ صيانة دورية وفحص شامل</li>
              </ul>
            </div>
            <img src="/images/hero-bg.jpg" alt="صيانة السخانات" className="rounded-lg shadow-lg" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
