import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import { Star, CheckCircle, Zap } from "lucide-react";

export default function SamsungService() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Hero Section */}
<section className="relative h-96 overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 mix-blend-multiply" />
  <img 
    src="/images/brands/samsung-hero.jpg" 
    alt="صيانة سامسونج" 
    className="absolute inset-0 w-full h-full object-cover"
  />
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="text-center text-white px-4">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">صيانة سامسونج في الإسكندرية</h1>
      <p className="text-xl md:text-2xl mb-8">خدمة متخصصة لجميع أجهزة سامسونج - ثلاجات، غسالات، تكييفات</p>
      <Button
        size="lg"
        className="bg-green-500 hover:bg-green-600 text-white"
        onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
      >
        احجز الآن
      </Button>
    </div>
  </div>
</section>

      {/* About Samsung Service */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-8">عن خدمات صيانة سامسونج</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-700 mb-4">
                سامسونج من أشهر الماركات العالمية في مجال الأجهزة المنزلية. نحن متخصصون في صيانة جميع أجهزة سامسونج بخدمة احترافية وسريعة.
              </p>
              <p className="text-gray-700 mb-4">
                فريقنا مدرب على أحدث تقنيات إصلاح أجهزة سامسونج ويستخدم قطع غيار أصلية معتمدة من الشركة الأم.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>فنيون معتمدون من سامسونج</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>قطع غيار أصلية مضمونة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>ضمان على جميع الإصلاحات</span>
                </li>
              </ul>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 text-blue-600">أجهزة سامسونج التي نصلحها:</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span>ثلاجات سامسونج بجميع الموديلات</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span>غسالات سامسونج الأوتوماتيكية</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span>تكييفات سامسونج بجميع الأنواع</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span>غسالات الأطباق من سامسونج</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Common Problems */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">المشاكل الشائعة في أجهزة سامسونج</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-3">الثلاجة لا تبرد</h3>
              <p className="text-gray-600">قد تكون المشكلة في الضاغط أو في نظام التبريد. نقوم بفحص شامل وإصلاح سريع.</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-3">تسرب المياه</h3>
              <p className="text-gray-600">قد يكون بسبب انسداد أنابيب التصريف. نقوم بتنظيف وإصلاح الأنابيب.</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-3">الغسالة لا تعمل</h3>
              <p className="text-gray-600">قد تكون مشكلة في لوحة التحكم أو المحرك. نقوم بفحص شامل وإصلاح فوري.</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-3">التكييف لا يبرد</h3>
              <p className="text-gray-600">قد تكون مشكلة في الفريون أو في المكثف. نقوم بتنظيف وإعادة شحن الفريون.</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-3">أصوات غريبة</h3>
              <p className="text-gray-600">قد تشير إلى مشكلة في المحرك أو المروحة. نقوم بفحص وإصلاح فوري.</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-3">استهلاك كهرباء مرتفع</h3>
              <p className="text-gray-600">قد تكون الأجهزة بحاجة إلى صيانة دورية. نقوم بتنظيف وتحسين الكفاءة.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section id="contact">
        <BookingForm title="احجز خدمة صيانة سامسونج الآن" defaultService="fridge" />
      </section>

      {/* Testimonials */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">آراء عملائنا</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "أحمد محمد",
                text: "خدمة ممتازة جداً! الفني كان احترافي جداً وأصلح الثلاجة بسرعة.",
                rating: 5,
              },
              {
                name: "فاطمة علي",
                text: "أسعار منافسة وخدمة سريعة. شكراً لكم على الخدمة الممتازة.",
                rating: 5,
              },
              {
                name: "محمود حسن",
                text: "فنيون محترفون جداً. استخدموا قطع غيار أصلية وأعطوا ضمان على الإصلاح.",
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

      <Footer />
    </div>
  );
}
