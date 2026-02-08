import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Zap, Droplet, Wind, Flame, Star, Clock, Shield, Users, Phone, MessageCircle } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    service: "",
    date: "",
  });

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

  const serviceNames: { [key: string]: string } = {
    fridge: "صيانة الثلاجات",
    washer: "صيانة الغسالات",
    ac: "صيانة المكيفات",
    oven: "صيانة الأفران",
    heater: "صيانة السخانات",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // إنشاء رسالة WhatsApp
    const serviceName = serviceNames[formData.service] || formData.service;
    const message = `مرحباً، أنا ${formData.name}\nرقم الهاتف: ${formData.phone}\nالخدمة المطلوبة: ${serviceName}\nالتاريخ المفضل: ${formData.date}\n\nأرجو تأكيد الحجز في أقرب وقت.`;
    const whatsappUrl = `https://wa.me/201558625259?text=${encodeURIComponent(message)}`;
    
    // فتح WhatsApp
    window.open(whatsappUrl, "_blank");
    
    // إظهار رسالة تأكيد
    alert("تم إرسال طلب الحجز عبر WhatsApp! سيتم التواصل معك قريباً.");
    
    // إعادة تعيين النموذج
    setFormData({ name: "", phone: "", service: "", date: "" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative h-96 overflow-hidden">
        <img
          src="/images/hero-bg.jpg"
          alt="صيانة احترافية"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
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

      {/* Contact Section - Moved to Top */}
      <section id="contact" className="py-12 bg-orange-50">
        <div className="container max-w-2xl">
          <h2 className="text-3xl font-bold text-center mb-2">احجز خدمتك الآن</h2>
          <p className="text-center text-gray-600 mb-8">استجابة سريعة وخدمة احترافية</p>
          <Card className="p-8 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">الاسم</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="أدخل اسمك"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="01234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">نوع الخدمة</label>
                <select
                  required
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">اختر الخدمة</option>
                  <option value="fridge">صيانة الثلاجات</option>
                  <option value="washer">صيانة الغسالات</option>
                  <option value="ac">صيانة المكيفات</option>
                  <option value="oven">صيانة الأفران</option>
                  <option value="heater">صيانة السخانات</option>
                  <option value="heater">صيانة السخانات</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">التاريخ المفضل</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold text-lg"
              >
                <MessageCircle className="w-5 h-5 ml-2" />
                إرسال عبر WhatsApp
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">لماذا تختارنا؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <IconComponent className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">خدماتنا</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card
                  key={index}
                  className="p-6 hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                >
                  <IconComponent className="w-12 h-12 text-orange-500 mb-4" />
                  <h3 className="font-bold text-lg mb-2">{service.title}</h3>
                  <p className="text-gray-600 text-sm">{service.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">آراء عملائنا</h2>
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
            <img src="/images/hero-bg.jpg" alt="صيانة الثلاجات" className="rounded-lg shadow-lg" />
          </div>

          {/* Washing Machines */}
          <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <img src="/images/hero-bg.jpg" alt="صيانة الغسالات" className="rounded-lg shadow-lg order-2 md:order-1" />
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
            <img src="/images/hero-bg.jpg" alt="صيانة المكيفات" className="rounded-lg shadow-lg" />
          </div>

          {/* Stoves and Ovens */}
          <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <img src="/images/hero-bg.jpg" alt="صيانة البوتاجاز" className="rounded-lg shadow-lg order-2 md:order-1" />
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
