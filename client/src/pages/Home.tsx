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
    
    const serviceName = serviceNames[formData.service] || formData.service;
    const message = `مرحباً، أنا ${formData.name}\nرقم الهاتف: ${formData.phone}\nالخدمة المطلوبة: ${serviceName}\nالتاريخ المفضل: ${formData.date}\n\nأرجو تأكيد الحجز في أقرب وقت.`;
    const whatsappUrl = `https://wa.me/201558625259?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, "_blank");
    
    alert("تم إرسال طلب الحجز عبر WhatsApp! سيتم التواصل معك قريباً.");
    
    setFormData({ name: "", phone: "", service: "", date: "" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[500px] bg-cover bg-center" style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}>
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">خبراء صيانة الأجهزة المنزلية بالإسكندرية</h1>
            <p className="text-lg md:text-2xl mb-8 font-light">نقدم حلول صيانة شاملة وموثوقة لجميع أجهزتك المنزلية بأسعار تنافسية.</p>
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 text-lg rounded-full transition-transform transform hover:scale-105"
              onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
            >
              احجز الآن
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-16 bg-white">
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">اطلب خدمة الصيانة الآن</h2>
          <p className="text-center text-gray-600 mb-8">املأ النموذج وسنتواصل معك فوراً لتأكيد الحجز.</p>
          <Card className="p-8 shadow-xl rounded-lg">
            <form name="contact" method="POST" data-netlify="true" className="space-y-6">
              <input type="hidden" name="form-name" value="contact" />
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700">الاسم الكامل</label>
                <input id="name" type="text" name="name" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="مثال: محمد أحمد" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2 text-gray-700">رقم الهاتف</label>
                <input id="phone" type="tel" name="phone" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="مثال: 01234567890" />
              </div>
              <div>
                <label htmlFor="service" className="block text-sm font-medium mb-2 text-gray-700">نوع الخدمة المطلوبة</label>
                <select id="service" name="service" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">اختر الخدمة</option>
                  <option value="fridge">صيانة ثلاجات</option>
                  <option value="washer">صيانة غسالات</option>
                  <option value="ac">صيانة تكييفات</option>
                  <option value="oven">صيانة أفران وبوتاجازات</option>
                  <option value="heater">صيانة سخانات</option>
                </select>
              </div>
              <Button type="submit" size="lg" className="w-full bg-green-500 hover:bg-green-600 text-white font-bold text-lg py-3 rounded-full">
                <MessageCircle className="w-5 h-5 ml-2" />
                أرسل الطلب الآن
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* Floating WhatsApp and Call Buttons */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
          <a href="https://wa.me/201558625259" target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-transform transform hover:scale-110">
              <MessageCircle className="w-6 h-6" />
          </a>
          <a href="tel:01278885772" className="bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-transform transform hover:scale-110">
              <Phone className="w-6 h-6" />
          </a>
      </div>

      <Footer />
    </div>
  );
}
