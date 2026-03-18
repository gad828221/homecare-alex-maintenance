import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import { Star, CheckCircle, Zap } from "lucide-react";

export default function FreshService() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative h-96 overflow-hidden bg-gradient-to-r from-purple-600 to-purple-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">صيانة فريش في الإسكندرية</h1>
            <p className="text-xl md:text-2xl mb-8">خدمة متخصصة لجميع أجهزة فريش - سخانات، غسالات، بوتاجازات</p>
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

      {/* About Fresh Service */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-8">عن خدمات صيانة فريش</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-700 mb-4">
                فريش علامة تجارية مصرية رائدة في صناعة الأجهزة المنزلية. نحن متخصصون في صيانة جميع منتجات فريش.
              </p>
              <p className="text-gray-700 mb-4">
                فريقنا مدرب على أحدث تقنيات إصلاح أجهزة فريش ويستخدم قطع غيار أصلية.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>فنيون معتمدون من فريش</span>
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
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 text-purple-700">أجهزة فريش التي نصلحها:</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-700" />
                  <span>سخانات فريش الكهربائية والغاز</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-700" />
                  <span>غسالات فريش الأوتوماتيكية</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-700" />
                  <span>بوتاجازات فريش الغاز والكهرباء</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-700" />
                  <span>مكانس فريش الكهربائية</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-700" />
                  <span>مراوح فريش بجميع الأنواع</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Common Problems */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">المشاكل الشائعة في أجهزة فريش</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-3">السخان لا يسخن</h3>
              <p className="text-gray-600">قد تكون مشكلة في الترموستات أو الماريك. نقوم بفحص وإصلاح فوري.</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-3">تسريب مياه من السخان</h3>
              <p className="text-gray-600">قد يكون تلف في الخراطيم أو الصمامات. نقوم باستبدال القطع التالفة.</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-3">الغسالة لا تعمل</h3>
              <p className="text-gray-600">قد تكون مشكلة في لوحة التحكم أو المحرك. نقوم بفحص شامل وإصلاح فوري.</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-3">البوتاجاز لا يشعل</h3>
              <p className="text-gray-600">قد تكون مشكلة في الشعلات أو في النظام الكهربائي. نقوم بفحص وإصلاح.</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-3">الغسالة لا تعصر</h3>
              <p className="text-gray-600">قد تكون مشكلة في المحرك أو حساس الباب. نقوم بفحص شامل وإصلاح فوري.</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-3">صوت عالي من الغسالة</h3>
              <p className="text-gray-600">قد تشير إلى مشكلة في الرومان بلى. نقوم بفحص وإصلاح.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section id="contact">
        <BookingForm title="احجز خدمة صيانة فريش الآن" />
      </section>

      {/* Testimonials */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">آراء عملائنا</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "أحمد عبدالعال",
                text: "خدمة ممتازة جداً! الفني كان محترف وأصلح السخان بسرعة.",
                rating: 5,
              },
              {
                name: "منى سعيد",
                text: "أسعار منافسة وخدمة سريعة. شكراً لكم على الخدمة الممتازة.",
                rating: 5,
              },
              {
                name: "هشام عبدالله",
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
