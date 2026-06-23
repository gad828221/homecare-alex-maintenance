import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import { 
  Zap, Droplet, Wind, Flame, Star, Clock, Shield, Users, 
  Phone, MessageCircle, CheckCircle, Award, Truck, 
  Settings, Heart, MapPin, Sparkles, ChevronDown, ShieldCheck, Headphones,
  Calendar
} from "lucide-react";
import { useEffect, useState } from "react";
import { requestNotificationPermission, onForegroundMessage } from "../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const services = [
    { icon: Zap, title: "صيانة الثلاجات", description: "إصلاح فوري لجميع أنواع الثلاجات والديب فريزر بقطع غيار أصلية وضمان معتمد." },
    { icon: Droplet, title: "صيانة الغسالات", description: "تصليح غسالات الملابس والأطباق، أوتوماتيك وفوق أوتوماتيك، بأحدث المعدات." },
    { icon: Wind, title: "صيانة المكيفات", description: "تنظيف، شحن فريون، وإصلاح جميع أنواع التكييفات والسبليت لضمان أفضل أداء." },
    { icon: Flame, title: "صيانة الأفران", description: "صيانة شاملة للبوتاجازات والأفران الكهربائية والميكروويف مع فحص الأمان." },
  ];

  const features = [
    { icon: Truck, title: "وصول خلال ساعة", description: "نصلك في أي مكان بالإسكندرية خلال 60 دقيقة فقط من طلب الخدمة." },
    { icon: Award, title: "ضمان لمدة عام", description: "شهادة ضمان شاملة وموثقة على كافة أعمال الصيانة وقطع الغيار المستبدلة." },
    { icon: Users, title: "مهندسون خبراء", description: "طاقم فني متخصص ومدرب على أحدث الموديلات العالمية لضمان جودة الإصلاح." },
    { icon: Shield, title: "قطع غيار أصلية", description: "نستخدم فقط قطع الغيار الأصلية من الوكيل لضمان طول عمر جهازك وكفاءته." },
  ];

  const testimonials = [
    { name: "محمد أحمد", city: "سموحة", comment: "خدمة ممتازة وسريعة جداً. الفني وصل في الموعد وصلح الغسالة في أقل من ساعة. شكراً لكم!", rating: 5 },
    { name: "سارة محمود", city: "لوران", comment: "أفضل مركز صيانة تعاملت معه في الإسكندرية. احترافية في التعامل وضمان حقيقي على التصليح.", rating: 5 },
    { name: "إبراهيم علي", city: "العجمي", comment: "الثلاجة كانت بتسرب فريون والمهندس شحنها وغير الفلتر وشغالة زي الجديدة تماماً. أنصح بهم بشدة.", rating: 5 },
  ];

  const faqs = [
    { q: "ما هي المناطق التي تغطيها خدمة الصيانة؟", a: "نحن نغطي كافة مناطق الإسكندرية (سموحة، سيدي جابر، لوران، العجمي، السيوف، المنتزه، العصافرة، محرم بك، وكافة المناطق المجاورة)." },
    { q: "هل تقدمون ضماناً على الصيانة؟", a: "نعم، نقدم ضماناً معتمداً لمدة تصل إلى عام كامل على قطع الغيار المستبدلة وأعمال الصيانة التي قام بها فريقنا." },
    { q: "كم يستغرق الفني للوصول إلى منزلي؟", a: "نلتزم بالوصول خلال 60 دقيقة من تأكيد الطلب، أو في الموعد الذي يحدده العميل بما يناسب وقته." },
    { q: "هل قطع الغيار المستخدمة أصلية؟", a: "بكل تأكيد، نستخدم قطع غيار أصلية 100% لضمان كفاءة الجهاز وعدم تكرار العطل مرة أخرى." }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      requestNotificationPermission().catch(console.error);
    }, 5000);

    onForegroundMessage((payload) => {
      alert(`${payload.notification.title}\n${payload.notification.body}`);
    });

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden font-sans" dir="rtl">
      <Header />

      {/* HERO SECTION - RE-DESIGNED */}
      <section className="relative min-h-[95vh] flex items-center overflow-hidden bg-slate-900 pt-20">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-bg-professional.jpg"
            alt="صيانة أجهزة منزلية احترافية بالإسكندرية"
            className="w-full h-full object-cover opacity-40 scale-105 animate-pulse-slow"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-slate-900 via-slate-900/60 to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-right"
            >
              <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 px-4 py-2 rounded-full mb-8">
                <Sparkles className="w-5 h-5 text-orange-400" />
                <span className="text-orange-400 font-black text-sm md:text-base">المركز الأول المعتمد في الإسكندرية 2026</span>
              </div>
              
              <h1 className="text-5xl md:text-8xl font-black text-white leading-[1.1] mb-8">
                صيانة أجهزتك <br />
                <span className="text-orange-500">في منزلك اليوم</span> <br />
                <span className="text-3xl md:text-5xl text-slate-300">بقطع غيار أصلية وضمان عام</span>
              </h1>

              <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl font-bold leading-relaxed">
                لا داعي لنقل جهازك! مهندسونا المتخصصون يصلون إليك خلال ساعة لإصلاح (الثلاجات، الغسالات، المكيفات) بجميع الماركات العالمية.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 mb-12">
                <Button
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700 text-white text-2xl font-black px-12 py-10 rounded-3xl shadow-3xl shadow-orange-900/40 transition-all transform hover:scale-105 group"
                  onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <Calendar className="w-8 h-8 ml-3 group-hover:rotate-12 transition-transform" />
                  احجز موعدك الآن
                </Button>
                
                <a
                  href="tel:+201278885772"
                  className="flex items-center justify-center gap-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl border-2 border-white/20 text-white text-2xl font-black px-12 py-6 rounded-3xl transition-all"
                >
                  <Phone className="w-7 h-7 animate-bounce" />
                  01278885772
                </a>
              </div>

              <div className="flex flex-wrap gap-8">
                <div className="flex items-center gap-3 text-white font-black">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  فحص فوري
                </div>
                <div className="flex items-center gap-3 text-white font-black">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center border border-orange-500/30">
                    <ShieldCheck className="w-6 h-6 text-orange-500" />
                  </div>
                  ضمان معتمد
                </div>
                <div className="flex items-center gap-3 text-white font-black">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  فنيين خبراء
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block relative"
            >
              <div className="absolute -inset-4 bg-orange-500/20 rounded-[3rem] blur-3xl"></div>
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-2 rounded-[3rem] shadow-2xl">
                <BookingForm />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* QUICK TRUST BAR */}
      <div className="bg-white py-10 border-b border-slate-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            {['SAMSUNG', 'LG', 'SHARP', 'TOSHIBA', 'ZANUSSI', 'FRESH', 'BEKO', 'ARISTON'].map(brand => (
              <span key={brand} className="text-2xl md:text-4xl font-black tracking-tighter text-slate-900">{brand}</span>
            ))}
          </div>
        </div>
      </div>

      {/* WHY US SECTION */}
      <section className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-8">لماذا نحن الخيار الأول بالإسكندرية؟</h2>
            <p className="text-xl text-slate-600 font-bold">نجمع بين الخبرة الهندسية والسرعة في التنفيذ لنقدم لك تجربة صيانة لا مثيل لها.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                whileHover={{ y: -10 }}
                key={index} 
                className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group transition-all"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-orange-600 transition-colors duration-500 shadow-inner">
                  <feature.icon className="w-10 h-10 text-orange-600 group-hover:text-white transition-colors duration-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-500 font-bold leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES SHOWCASE */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-end justify-between mb-24 gap-8">
            <div className="max-w-2xl text-right">
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-8">خدماتنا المتخصصة</h2>
              <p className="text-xl text-slate-600 font-bold leading-relaxed">نقدم حلولاً متكاملة لكافة الأجهزة المنزلية بأعلى معايير الجودة العالمية وقطع غيار أصلية.</p>
            </div>
            <Button 
              size="lg" 
              className="bg-slate-900 hover:bg-slate-800 text-white font-black px-10 py-8 rounded-2xl text-xl"
              onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
            >
              اطلب فني الآن
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div key={index} className="group relative overflow-hidden rounded-[3rem] bg-slate-900 h-[400px]">
                <img 
                  src={`/images/services/${index === 0 ? 'refrigerator-repair-pro.jpg' : index === 1 ? 'washing-machine-repair-pro.jpg' : index === 2 ? 'ac-repair-pro.jpg' : 'stove-repair-pro.jpg'}`} 
                  alt={service.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                <div className="absolute bottom-0 right-0 p-12 text-right">
                  <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mb-6">
                    <service.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-4">{service.title}</h3>
                  <p className="text-slate-300 font-bold text-lg max-w-md">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-32 bg-orange-600 rounded-[4rem] md:rounded-[6rem] mx-4 md:mx-10 my-20 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <Sparkles className="absolute top-10 right-20 w-20 h-20" />
          <Sparkles className="absolute bottom-20 left-10 w-32 h-32" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8">ماذا يقول عملاؤنا؟</h2>
            <div className="flex justify-center gap-2">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-8 h-8 text-yellow-300 fill-yellow-300" />)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[3rem] text-white">
                <div className="flex gap-1 mb-6">
                  {[1,2,3,4,5].map(star => <Star key={star} className="w-5 h-5 text-yellow-300 fill-yellow-300" />)}
                </div>
                <p className="text-xl font-bold mb-8 leading-relaxed italic">"{t.comment}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center font-black text-2xl">
                    {t.name[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-xl">{t.name}</h4>
                    <p className="text-orange-200 font-bold">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">الأسئلة الشائعة</h2>
            <p className="text-xl text-slate-600 font-bold">كل ما تريد معرفته عن خدماتنا</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-2 border-slate-100 rounded-[2rem] overflow-hidden transition-all">
                <button 
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-8 text-right bg-white hover:bg-slate-50 transition-colors"
                >
                  <span className="text-xl font-black text-slate-900">{faq.q}</span>
                  <ChevronDown className={`w-6 h-6 text-orange-600 transition-transform duration-300 ${activeFaq === index ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeFaq === index && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-slate-50 px-8 pb-8 text-lg text-slate-600 font-bold leading-relaxed"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section id="contact" className="py-32 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.2),transparent_70%)]"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="text-right">
              <h2 className="text-5xl md:text-7xl font-black mb-10 leading-tight">جاهز لإصلاح جهازك؟</h2>
              <p className="text-2xl text-slate-400 font-bold mb-12 leading-relaxed">
                انضم إلى أكثر من 50,000 عميل سعيد في الإسكندرية. احجز الآن وسنصلك خلال 60 دقيقة فقط بقطع غيار أصلية وضمان معتمد.
              </p>
              
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/40">
                    <Headphones className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black">دعم فني 24/7</h4>
                    <p className="text-slate-500 font-bold">نحن معك في أي وقت، حتى في العطلات الرسمية.</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-900/40">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black">شهادة ضمان موثقة</h4>
                    <p className="text-slate-500 font-bold">تضمن لك حقك في إعادة الصيانة مجاناً خلال فترة الضمان.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-2 rounded-[3.5rem] shadow-3xl">
              <BookingForm />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
