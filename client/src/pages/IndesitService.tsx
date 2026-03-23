import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import { Star, CheckCircle, Zap } from "lucide-react";

export default function IndesitService() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
{/* Hero Section */}
<section className="relative h-96 overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-800 mix-blend-multiply" />
  <img 
    src="/images/brands/indesit-hero.jpg" 
    alt="صيانة إنديسيت" 
    className="absolute inset-0 w-full h-full object-cover"
  />
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="text-center text-white px-4">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">صيانة إنديسيت في الإسكندرية</h1>
      <p className="text-xl md:text-2xl mb-8">خدمة متخصصة لجميع أجهزة إنديسيت - غسالات، ثلاجات، بوتاجازات</p>
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
      

      {/* About Indesit Service */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-8">عن خدمات صيانة إنديسيت</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-700 mb-4">
                إنديسيت من الشركات الموثوقة في مجال الأجهزة المنزلية. نحن متخصصون في صيانة جميع أجهزة إنديسيت بخدمة احترافية وسريعة.
              </p>
              <p className="text-gray-700 mb-4">
                فريقنا مدرب على أحدث تقنيات إصلاح أجهزة إنديسيت ويستخدم قطع غيار أصلية معتمدة.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>فنيون معتمدون من إنديسيت</span>
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
              <h3 className="text-2xl font-bold mb-4 text-blue-600">أجهزة إنديسيت التي نصلحها:</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span>غسالات إنديسيت الأوتوماتيكية</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span>ثلاجات إنديسيت بجميع الموديلات</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span>بوتاجازات إنديسيت الغاز والكهرباء</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span>غسالات الأطباق من إنديسيت</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Common Issues */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-8">المشاكل الشائعة في أجهزة إنديسيت</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-3">الغسالة لا تعصر</h3>
              <p className="text-gray-700">قد تكون مشكلة في المحرك أو حساس الباب. نقوم بفحص شامل وإصلاح فوري.</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-3">تسرب المياه من الغسالة</h3>
              <p className="text-gray-700">قد يكون بسبب تلف خرطوم الصرف أو طلمبة الصرف. نقوم باستبدالها.</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-3">الثلاجة لا تبرد</h3>
              <p className="text-gray-700">قد تكون المشكلة في الضاغط أو في نظام التبريد. نقوم بفحص شامل وإصلاح سريع.</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-3">البوتاجاز لا يشتعل</h3>
              <p className="text-gray-700">قد تكون مشكلة في الشمعة أو في نظام الإشعال. نقوم بفحص وإصلاح.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="contact" className="py-12 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-8 text-white">احجز خدمة صيانة إنديسيت الآن</h2>
          <BookingForm />
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-8">آراء عملائنا</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">خدمة ممتازة جداً! الفني كان احترافي جداً وأصلح الغسالة بسرعة.</p>
              <p className="font-bold">محمد أحمد</p>
            </Card>
            <Card className="p-6">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">أسعار منافسة وخدمة سريعة. شكراً لكم على الخدمة الممتازة.</p>
              <p className="font-bold">ليلى محمود</p>
            </Card>
            <Card className="p-6">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">فنيون محترفون جداً. استخدموا قطع غيار أصلية وأعطوا ضمان على الإصلاح.</p>
              <p className="font-bold">رامي علي</p>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
