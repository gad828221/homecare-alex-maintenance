import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import { Star, CheckCircle, Zap } from "lucide-react";

export default function HooverService() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative h-96 overflow-hidden bg-gradient-to-r from-red-600 to-red-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">صيانة هوفر في الإسكندرية</h1>
            <p className="text-xl md:text-2xl mb-8">خدمة متخصصة لجميع أجهزة هوفر - غسالات، مكانس، ثلاجات</p>
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

      {/* About Hoover Service */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-8">عن خدمات صيانة هوفر</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-700 mb-4">
                هوفر من الشركات العريقة في صناعة الأجهزة المنزلية والتنظيف. نحن متخصصون في صيانة جميع أجهزة هوفر بخدمة احترافية وسريعة.
              </p>
              <p className="text-gray-700 mb-4">
                فريقنا مدرب على أحدث تقنيات إصلاح أجهزة هوفر ويستخدم قطع غيار أصلية معتمدة.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>فنيون معتمدون من هوفر</span>
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
            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 text-red-600">أجهزة هوفر التي نصلحها:</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-600" />
                  <span>غسالات هوفر الأوتوماتيكية</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-600" />
                  <span>مكانس هوفر الكهربائية</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-600" />
                  <span>ثلاجات هوفر بجميع الموديلات</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-600" />
                  <span>مجففات هوفر للملابس</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Common Issues */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-8">المشاكل الشائعة في أجهزة هوفر</h2>
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
              <h3 className="text-xl font-bold mb-3">المكنسة لا تشفط</h3>
              <p className="text-gray-700">قد تكون مشكلة في المحرك أو الفلتر. نقوم بتنظيف وإصلاح.</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-3">صوت عالي من الغسالة</h3>
              <p className="text-gray-700">قد تشير إلى مشكلة في الرومان بلى. نقوم بفحص وإصلاح.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="contact" className="py-12 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-8 text-white">احجز خدمة صيانة هوفر الآن</h2>
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
              <p className="font-bold">علي محمود</p>
            </Card>
            <Card className="p-6">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">أسعار منافسة وخدمة سريعة. شكراً لكم على الخدمة الممتازة.</p>
              <p className="font-bold">نور أحمد</p>
            </Card>
            <Card className="p-6">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">فنيون محترفون جداً. استخدموا قطع غيار أصلية وأعطوا ضمان على الإصلاح.</p>
              <p className="font-bold">سارة علي</p>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
