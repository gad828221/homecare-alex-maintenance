import { Phone, MapPin, Clock, Mail, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-white border-t border-orange-500">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
                ⚙️
              </div>
              <h3 className="font-bold text-lg">Maintenance Guide</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              نقدم خدمات صيانة احترافية لجميع الأجهزة المنزلية بأسعار منافسة وضمان الجودة. فريقنا متخصص وذو خبرة عالية.
            </p>
            <div className="flex gap-3 pt-4">
              <a href="https://wa.me/201558625259" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-all transform hover:scale-110">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="tel:+201278885772" className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all transform hover:scale-110">
                <Phone className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-orange-400">تواصل معنا</h4>
            <div className="space-y-4">
              <a href="tel:+201278885772" className="flex items-center gap-3 hover:text-orange-400 transition-colors group">
                <div className="w-10 h-10 bg-slate-800 group-hover:bg-orange-500 rounded-lg flex items-center justify-center transition-all">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">الهاتف</p>
                  <span className="font-medium">01278885772</span>
                </div>
              </a>
              <a href="https://wa.me/201558625259" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-green-400 transition-colors group">
                <div className="w-10 h-10 bg-slate-800 group-hover:bg-green-500 rounded-lg flex items-center justify-center transition-all">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">WhatsApp</p>
                  <span className="font-medium">01558625259</span>
                </div>
              </a>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">الموقع</p>
                  <span className="font-medium">الإسكندرية، مصر</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-orange-400">ساعات العمل</h4>
            <div className="bg-slate-800 rounded-lg p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">السبت - الخميس</span>
                <span className="font-bold text-orange-400">8:00 - 20:00</span>
              </div>
              <div className="border-t border-slate-700"></div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">الجمعة</span>
                <span className="font-bold text-orange-400">10:00 - 18:00</span>
              </div>
              <div className="border-t border-slate-700 pt-3 mt-3">
                <p className="text-orange-400 font-bold text-sm">🔔 خدمة طوارئ 24/7</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 pt-12">
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
              نلتزم بأعلى معايير الجودة والاحترافية في كل خدمة نقدمها. يتم استخدام قطع غيار أصلية وموثوقة في جميع عمليات الإصلاح والاستبدال.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
