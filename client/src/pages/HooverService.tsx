import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import { Star, CheckCircle, Zap, ShieldCheck, Clock, Award, Phone, MessageCircle } from "lucide-react";

export default function HooverService() {
  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">
      <Header />

      {/* HERO SECTION - GOOGLE ADS OPTIMIZED */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-red-900">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero-bg-new.jpg" 
            alt="صيانة Hoover المعتمدة بالإسكندرية" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-red-900 via-red-900/60 to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-full mb-6">
              <ShieldCheck className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-bold text-sm uppercase tracking-wider">مركز صيانة Hoover المعتمد</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
              صيانة Hoover <br />
              <span className="text-red-400">بالمنزل فوراً</span> <br />
              <span className="text-2xl md:text-4xl">قطع غيار أصلية وضمان سنة</span>
            </h1>

            <p className="text-xl text-slate-200 mb-10 font-medium leading-relaxed">
              نقدم خدمة صيانة احترافية لجميع أجهزة Hoover (ثلاجات، غسالات، تكييفات) في الإسكندرية. نصلك خلال ساعة واحدة فقط.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white text-xl font-black px-10 py-8 rounded-2xl shadow-2xl shadow-red-900/40 transition-all transform hover:scale-105"
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              >
                احجز فني Hoover
              </Button>
              <a
                href="tel:+201278885772"
                className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white text-xl font-black px-10 py-4 rounded-2xl transition-all"
              >
                <Phone className="w-6 h-6" />
                01278885772
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST SIGNALS */}
      <div className="bg-white py-12 border-b border-slate-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 p-6 bg-red-50 rounded-2xl">
              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-black text-red-900">سرعة في الوصول</h4>
                <p className="text-red-700 text-sm font-bold">نصلك خلال 60 دقيقة من طلبك</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-green-50 rounded-2xl">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-black text-green-900">قطع غيار أصلية</h4>
                <p className="text-green-700 text-sm font-bold">ضمان حقيقي على قطع الغيار</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-orange-50 rounded-2xl">
              <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-black text-orange-900">ضمان معتمد</h4>
                <p className="text-orange-700 text-sm font-bold">شهادة ضمان لمدة عام كامل</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-8 leading-tight">خدمة صيانة Hoover <br />بأعلى معايير الجودة</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed font-medium">
                نحن في مركز صيانة Hoover الإسكندرية، ندرك مدى أهمية أجهزتك المنزلية في حياتك اليومية. لذا، نقدم فريقاً من المهندسين المتخصصين والمدربين على أحدث تقنيات صيانة Hoover العالمية.
              </p>
              
              <div className="space-y-4 mb-10">
                {['صيانة ثلاجات Hoover بجميع الموديلات', 'تصليح غسالات Hoover أوتوماتيك وفوق أوتوماتيك', 'صيانة تكييفات Hoover سبليت وشباك', 'استخدام أجهزة فحص إلكترونية حديثة'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 font-bold text-slate-700">
                    <CheckCircle className="w-5 h-5 text-red-600" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="bg-red-600 p-8 rounded-3xl text-white">
                <h4 className="text-2xl font-black mb-4">هل لديك استفسار؟</h4>
                <p className="font-bold opacity-90 mb-6">تواصل مع الدعم الفني لـ Hoover مباشرة عبر الواتساب</p>
                <a href="https://wa.me/201558625259" className="inline-flex items-center gap-2 bg-white text-red-600 px-6 py-3 rounded-xl font-black transition-transform hover:scale-105">
                  <MessageCircle className="w-5 h-5" />
                  تحدث معنا الآن
                </a>
              </div>
            </div>
            
            <div className="relative">
              <img src="/images/services/washing-machine-repair-pro.jpg" alt="فني صيانة Hoover" className="rounded-[2.5rem] shadow-2xl w-full h-[500px] object-cover" />
              <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 hidden md:block">
                <p className="text-4xl font-black text-red-600 mb-1">98%</p>
                <p className="font-bold text-slate-500">نسبة رضا العملاء</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOOKING SECTION */}
      <section id="contact" className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-4">احجز موعد الصيانة الآن</h2>
            <p className="text-lg text-slate-600 font-bold">نصلك في منزلك خلال ساعة واحدة فقط</p>
          </div>
          <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl">
            <BookingForm defaultService="صيانة Hoover" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
