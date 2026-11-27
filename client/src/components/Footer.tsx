import {Phone, MapPin, Clock, Mail, MessageCircle, Star, Bell} from "lucide-react";

const WHATSAPP_MSG = `أهلًا، أنا جاي من موقع Maintenance Guide ومحتاج صيانة جهاز منزلي في الإسكندرية.
اسم العميل:
نوع الجهاز:
العنوان:
وصف العطل:`;
const WHATSAPP_URL = `https://wa.me/201558625259?text=${encodeURIComponent(WHATSAPP_MSG)}`;

const GOOGLE_BUSINESS_PROFILE_URL = "https://www.google.com/maps/place/Service+guide+Montaza+2/data=!4m2!3m1!1s0x14f5db723bebbd65:0xd4108ebedaac095e";

const SOCIAL_LINKS = [
  { label: "فيسبوك", href: "https://www.facebook.com/Maintenance.Guide", className: "bg-[#1877F2] hover:bg-[#0f63d0]" },
  { label: "انستجرام", href: "https://www.instagram.com/maintenanceguide", className: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-90" },
  { label: "تيك توك", href: "https://www.tiktok.com/@maintenance.guide", className: "bg-black hover:bg-slate-700 ring-1 ring-slate-600" },
  { label: "يوتيوب", href: "https://www.youtube.com/@maintenance-guide", className: "bg-[#FF0000] hover:bg-[#d90000]" },
];

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-slate-800 to-slate-900 text-white border-t-4 border-orange-500 shadow-2xl pb-28 md:pb-24">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <img src="/images/logo-80.webp" srcSet="/images/logo-80.webp 80w, /images/logo-120.webp 120w" sizes="40px" width="40" height="40" loading="lazy" decoding="async" alt="Maintenance Guide logo" className="w-10 h-10 rounded-lg object-contain bg-white p-0.5" />
              <h3 className="font-bold text-lg">Maintenance Guide</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              نقدم خدمات صيانة احترافية وشاملة لجميع الأجهزة المنزلية بأسعار منافسة مع ضمان الجودة الشامل. فريقنا الفني مدرب على أعلى مستوى، واستقبال الطلبات متاح ٢٤ ساعة.
            </p>
            <div className="flex gap-3 pt-4">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="التواصل عبر واتساب" className="w-10 h-10 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-all transform hover:scale-110">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="tel:01278885772" aria-label="الاتصال بمركز الصيانة" className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all transform hover:scale-110">
                <Phone className="w-5 h-5" />
              </a>
              <a
                href={GOOGLE_BUSINESS_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="مشاهدة ملفنا التجاري وتقييماتنا على Google"
                title="ملفنا التجاري على Google"
                className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-all transform hover:scale-110"
              >
                <Star className="w-5 h-5 fill-current" />
              </a>
            </div>
            <a
              href={GOOGLE_BUSINESS_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-yellow-300 hover:text-yellow-200 transition-colors"
            >
              <Star className="w-4 h-4 fill-current" />
              شاهد ملفنا التجاري وتقييمات العملاء على Google
            </a>
            <div className="pt-5">
              <p className="text-xs font-bold text-gray-400 mb-2">تابعنا</p>
              <div className="flex flex-wrap gap-2">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`صفحتنا على ${link.label}`}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold text-white transition-colors ${link.className}`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-orange-400">تواصل معنا</h4>
            <div className="space-y-4">
              <a href="tel:01278885772" className="flex items-center gap-3 hover:text-orange-400 transition-colors group">
                <div className="w-10 h-10 bg-slate-800 group-hover:bg-orange-500 rounded-lg flex items-center justify-center transition-all">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">الهاتف</p>
                  <span className="font-medium">01278885772</span>
                </div>
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-green-400 transition-colors group">
                <div className="w-10 h-10 bg-slate-800 group-hover:bg-green-500 rounded-lg flex items-center justify-center transition-all">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">WhatsApp</p>
                  <span className="font-medium">01558625259</span>
                </div>
              </a>
              <div className="space-y-4">
                <div className="flex items-start gap-3 group">
                  <div className="w-8 h-8 bg-slate-800 group-hover:bg-orange-500 rounded-lg flex items-center justify-center transition-all flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">فرع سان ستيفانو (الرئيسي)</p>
                    <a href="https://maps.app.goo.gl/TFccizUnkw4YeZBm6" target="_blank" rel="noopener noreferrer" className="text-xs font-medium hover:text-orange-400 transition-colors">سان ستيفانو، الإسكندرية</a>
                  </div>
                </div>
                <div className="flex items-start gap-3 group">
                  <div className="w-8 h-8 bg-slate-800 group-hover:bg-blue-500 rounded-lg flex items-center justify-center transition-all flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">فرع سيدي بشر</p>
                    <a href="https://maps.app.goo.gl/TFccizUnkw4YeZBm6" target="_blank" rel="noopener noreferrer" className="text-xs font-medium hover:text-blue-400 transition-colors">العاشر - سيدي بشر، الإسكندرية</a>
                  </div>
                </div>
                <div className="flex items-start gap-3 group">
                  <div className="w-8 h-8 bg-slate-800 group-hover:bg-green-500 rounded-lg flex items-center justify-center transition-all flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">فرع 45 بحر</p>
                    <a href="https://maps.app.goo.gl/MgH5xfjExHg1UwLE8" target="_blank" rel="noopener noreferrer" className="text-xs font-medium hover:text-green-400 transition-colors">شارع 45 بحر - جاد، الإسكندرية</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-orange-400">استقبال الطلبات</h4>
            <div className="bg-slate-800 rounded-lg p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">كل أيام الأسبوع</span>
                <span className="font-bold text-orange-400">٢٤ ساعة</span>
              </div>
              <div className="border-t border-slate-700 pt-3 mt-3">
                <p className="text-orange-400 font-bold text-sm flex items-center gap-2"><Bell className="w-4 h-4" /> ابعت طلبك في أي وقت وهنرجعلك نأكد الموعد</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 pt-12">
          <nav aria-label="أدلة مفيدة" className="text-center text-sm text-gray-300 mb-8">
            <p className="font-semibold text-orange-400 mb-3">أدلة مفيدة</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <a href="/articles/fridge-not-cooling" className="hover:text-orange-400 underline underline-offset-4">التلاجة مش بتبرد كويس؟ الأسباب وإمتى تحتاج فني</a>
              <a href="/articles/washer-not-draining" className="hover:text-orange-400 underline underline-offset-4">الغسالة مش بتصرف الميه؟ الأسباب وإمتى تحتاج فني</a>
            </div>
          </nav>
          <div className="text-center text-gray-400 text-sm mb-8">
            <p>&copy; 2026 Maintenance Guide - جميع الحقوق محفوظة</p>
          </div>

          {/* Professional Disclaimer */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-lg p-6 text-xs text-gray-300 leading-relaxed border border-slate-700">
            <p className="font-semibold text-orange-400 mb-3">📋 تنويه هام:</p>
            <p className="mb-3">
              نحن شركة متخصصة مستقلة في صيانة الأجهزة المنزلية. نقدم خدمات صيانة احترافية وإصلاح لجميع أنواع الأجهزة المنزلية بما في ذلك الثلاجات والغسالات والمكيفات والسخانات والبوتاجاز وغسالات الأطباق.
            </p>
            <p className="mb-3">
              نحن لسنا تابعين أو ممثلين رسميين لأي ماركات أو شركات مصنعة. خدماتنا متاحة لجميع الماركات والموديلات المختلفة. جميع الخدمات المقدمة من قبل فنيين مدربين وذوي خبرة في مجال الصيانة والإصلاح.
            </p>
            <p>
              نلتزم بأعلى معايير الجودة والاحترافية في كل خدمة نقدمها. نستخدم قطع غيار أصلية أو بديلة حسب الحالة، مع توضيح النوع والتكلفة قبل الإصلاح.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

