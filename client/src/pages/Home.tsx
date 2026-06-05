import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import { 
  Zap, Droplet, Wind, Flame, Star, Clock, Shield, Users, 
  Phone, MessageCircle, CheckCircle, Award, Truck, 
  Settings, Heart, MapPin, Sparkles 
} from "lucide-react";
import { useEffect } from "react";
import { requestNotificationPermission, onForegroundMessage } from "../lib/firebase";

export default function Home() {
  const services = [
    { icon: Zap, title: "صيانة الثلاجات", description: "إصلاح فوري لجميع أنواع الثلاجات والديب فريزر بقطع غيار أصلية." },
    { icon: Droplet, title: "صيانة الغسالات", description: "تصليح غسالات الملابس والأطباق، أوتوماتيك وفوق أوتوماتيك." },
    { icon: Wind, title: "صيانة المكيفات", description: "تنظيف، شحن فريون، وإصلاح جميع أنواع التكييفات والسبليت." },
    { icon: Flame, title: "صيانة الأفران", description: "صيانة شاملة للبوتاجازات والأفران الكهربائية والميكروويف." },
  ];

  const features = [
    { icon: Truck, title: "وصول خلال ساعة", description: "نصلك في أي مكان بالإسكندرية خلال 60 دقيقة فقط." },
    { icon: Award, title: "ضمان لمدة عام", description: "شهادة ضمان شاملة على كافة أعمال الصيانة وقطع الغيار." },
    { icon: Users, title: "مهندسون خبراء", description: "طاقم فني متخصص ومدرب على أعلى مستوى من الاحترافية." },
    { icon: Shield, title: "قطع غيار أصلية", description: "نستخدم فقط قطع الغيار الأصلية لضمان كفاءة جهازك." },
  ];

  // تفعيل الإشعارات الخارجية
  useEffect(() => {
    // نطلب الإذن بعد 3 ثوانٍ (لا نزعج المستخدم فوراً)
    const timer = setTimeout(() => {
      requestNotificationPermission().catch(console.error);
    }, 3000);

    // استقبال الإشعارات أثناء فتح التطبيق
    onForegroundMessage((payload) => {
      alert(`${payload.notification.title}\n${payload.notification.body}`);
    });

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">
      <Header />

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-bg-new.jpg"
            alt="صيانة أجهزة منزلية بالإسكندرية"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 py-12 md:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 px-4 py-2 rounded-full mb-6 animate-bounce">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 font-bold text-sm">أفضل خدمة صيانة في الإسكندرية 2026</span>
            </div>
            
            <h1 className="text-4xl md:text-7xl font-black text-white leading-tight mb-6">
              جهازك معطل؟ <br />
              <span className="text-orange-500">نحن نصلحه في منزلك</span> <br />
              <span className="text-3xl md:text-5xl">بأقل تكلفة وضمان شامل</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-2xl font-medium leading-relaxed">
              مركز خدمة متخصص لجميع الماركات العالمية (سامسونج، LG، توشيبا، شارب، زانوسي). نصلك أينما كنت في الإسكندرية بقطع غيار أصلية.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white text-xl font-black px-10 py-8 rounded-2xl shadow-2xl shadow-orange-900/40 transition-all transform hover:scale-105"
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              >
                <MessageCircle className="w-6 h-6 ml-3" />
                احجز موعدك الآن
              </Button>
              
              <a
                href="tel:+201278885772"
                className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white text-xl font-black px-10 py-4 rounded-2xl transition-all"
              >
                <Phone className="w-6 h-6" />
                01278885772
              </a>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-slate-300 font-bold">
                <CheckCircle className="w-5 h-5 text-green-500" />
                قطع غيار أصلية
              </div>
              <div className="flex items-center gap-2 text-slate-300 font-bold">
                <CheckCircle className="w-5 h-5 text-green-500" />
                ضمان سنة كاملة
              </div>
              <div className="flex items-center gap-2 text-slate-300 font-bold">
                <CheckCircle className="w-5 h-5 text-green-500" />
                كشف فوري بالمنزل
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* إحصائيات سريعة */}
      <div className="bg-orange-600 py-6 relative z-20 -mt-8 mx-4 md:mx-auto max-w-6xl rounded-3xl shadow-2xl">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-x-reverse divide-orange-500/50">
            <div>
              <p className="text-3xl md:text-4xl font-black text-white">15+</p>
              <p className="text-orange-100 text-sm font-bold">عام من الخبرة</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-black text-white">50k+</p>
              <p className="text-orange-100 text-sm font-bold">عميل سعيد</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-black text-white">100%</p>
              <p className="text-orange-100 text-sm font-bold">قطع غيار أصلية</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-black text-white">24h</p>
              <p className="text-orange-100 text-sm font-bold">خدمة طوارئ</p>
            </div>
          </div>
        </div>
      </div>

      {/* قسم النموذج البارز */}
      <section id="contact" className="py-24 bg-gradient-to-br from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="text-center lg:text-right">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">اطلب الخدمة الآن</h2>
              <p className="text-lg md:text-xl text-slate-600 mb-12 leading-relaxed max-w-lg mx-auto lg:mx-0">
                املأ النموذج وسيقوم فريقنا بالتواصل معك خلال دقائق لتحديد موعد الزيارة المنزلية. نضمن لك أفضل سعر وأعلى جودة في الإسكندرية.
              </p>
              
              <div className="space-y-8 max-w-md mx-auto lg:mx-0">
                <div className="flex items-center gap-5 p-4 bg-white rounded-2xl shadow-md border border-slate-100">
                  <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-7 h-7 text-orange-600" />
                  </div>
                  <div className="text-right">
                    <h4 className="font-black text-slate-900 text-lg">نغطي كافة مناطق الإسكندرية</h4>
                    <p className="text-slate-500">سموحة، سيدي جابر، لوران، العجمي، السيوف، المنتزه، وكافة المناطق.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-5 p-4 bg-white rounded-2xl shadow-md border border-slate-100">
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-7 h-7 text-green-600" />
                  </div>
                  <div className="text-right">
                    <h4 className="font-black text-slate-900 text-lg">مواعيد دقيقة واحترافية</h4>
                    <p className="text-slate-500">نحترم وقتك ونلتزم بالمواعيد المحددة بدقة تامة.</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 p-4 bg-white rounded-2xl shadow-md border border-slate-100">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Settings className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <h4 className="font-black text-slate-900 text-lg">أحدث أجهزة الفحص</h4>
                    <p className="text-slate-500">نستخدم أجهزة فحص إلكترونية حديثة لتحديد العطل بدقة دون تخمين.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 md:p-6 rounded-3xl shadow-2xl border border-slate-100 max-w-2xl mx-auto w-full">
              <BookingForm />
            </div>
          </div>
        </div>
      </section>

      {/* الشعارات / الماركات */}
      <section className="py-16 bg-white border-y border-slate-100 overflow-hidden">
        <div className="container mx-auto px-4 mb-10 text-center">
          <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest">نحن خبراء صيانة كافة الماركات</h3>
        </div>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {['Samsung', 'LG', 'Sharp', 'Toshiba', 'Zanussi', 'Fresh', 'Ariston', 'Beko'].map(brand => (
            <span key={brand} className="text-3xl font-black text-slate-800">{brand}</span>
          ))}
        </div>
      </section>

      {/* المميزات */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-slate-900 mb-6">لماذا يثق بنا الآلاف؟</h2>
            <div className="w-24 h-2 bg-orange-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-8 hover:shadow-2xl transition-all border-none bg-slate-50 rounded-3xl group">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-orange-500 transition-colors duration-300">
                  <feature.icon className="w-8 h-8 text-orange-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* الخدمات */}
      <section className="py-24 bg-slate-900 text-white rounded-[3rem] md:rounded-[5rem] mx-2 md:mx-6 my-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-5xl font-black mb-6">خدماتنا المتخصصة</h2>
              <p className="text-slate-400 text-xl font-medium leading-relaxed">نقدم حلولاً هندسية متكاملة لصيانة وإصلاح كافة الأجهزة المنزلية بأحدث التقنيات العالمية.</p>
            </div>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white font-black px-8 py-6 rounded-2xl" onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}>اطلب فني الآن</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div key={index} className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-orange-500 transition-all group">
                <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6"><service.icon className="w-7 h-7 text-orange-500" /></div>
                <h3 className="text-2xl font-black mb-4">{service.title}</h3>
                <p className="text-slate-400 font-medium mb-6">{service.description}</p>
                <div className="h-1 w-0 bg-orange-500 group-hover:w-full transition-all duration-500"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
