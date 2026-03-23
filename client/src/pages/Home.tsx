import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import { Zap, Droplet, Wind, Flame, Star, Clock, Shield, Users } from "lucide-react";

// استيراد الصور مباشرة
import heroBgNew from "/images/hero-bg-new.jpg";
import heroBgPro from "/images/hero-bg-pro.jpg";
import heroBg from "/images/hero-bg.jpg";
import fridgeRepair from "/images/services/refrigerator-repair-pro.jpg";
import washerRepair from "/images/services/washing-machine-repair-pro.jpg";
import acRepair from "/images/services/ac-repair-pro.jpg";
import stoveRepair from "/images/services/stove-repair-pro.jpg";

// تنسيقات شريط الماركات (يمكن نقلها إلى ملف CSS عام لاحقاً)
const brandsStripStyles = `
.brands-strip {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 15px 25px;
  background: white;
  padding: 15px 25px;
  border-radius: 60px;
  margin: 30px auto;
  max-width: 1100px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.03);
}

.brands-strip span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 700;
  color: #0A2647;
  transition: transform 0.3s ease;
}

.brands-strip span i {
  color: #FF5F1F;
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.brands-strip span:hover {
  transform: translateY(-2px);
}

.brands-strip span:hover i {
  transform: scale(1.1);
  color: #FF8A4F;
}

@media (max-width: 768px) {
  .brands-strip {
    gap: 10px 15px;
    padding: 12px 20px;
  }
  .brands-strip span {
    font-size: 0.9rem;
  }
}
`;

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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <style>{brandsStripStyles}</style>
      <Header />

      {/* Hero Section */}
      <section className="relative h-96 overflow-hidden">
  
          <img
  src={heroBgNew}
  alt="صيانة احترافية"
  className="w-full h-full object-contain"
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

      {/* Contact Section */}
      <section id="contact">
        <BookingForm />
      </section>

      {/* ===== شريط الماركات ===== */}
      <section className="container mx-auto px-4">
        <div className="brands-strip">
          <span><i className="fas fa-check-circle"></i> سامسونج</span>
          <span><i className="fas fa-check-circle"></i> LG</span>
          <span><i className="fas fa-check-circle"></i> توشيبا</span>
          <span><i className="fas fa-check-circle"></i> شارب</span>
          <span><i className="fas fa-check-circle"></i> زانوسي</span>
          <span><i className="fas fa-check-circle"></i> وايت ويل</span>
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
            <img src={fridgeRepair} alt="صيانة الثلاجات" className="rounded-lg shadow-lg" />
          </div>

          {/* Washing Machines */}
          <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <img src={washerRepair} alt="صيانة الغسالات" className="rounded-lg shadow-lg order-2 md:order-1" />
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
            <img src={acRepair} alt="صيانة المكيفات" className="rounded-lg shadow-lg" />
          </div>

          {/* Stoves and Ovens */}
          <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <img src={stoveRepair} alt="صيانة البوتاجاز" className="rounded-lg shadow-lg order-2 md:order-1" />
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
            <img src={heroBg} alt="صيانة السخانات" className="rounded-lg shadow-lg" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
