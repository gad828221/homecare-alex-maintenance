import { Phone, MapPin, Clock, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">أسرع صيانة بالإسكندرية</h3>
            <p className="text-gray-300 text-sm">
              نقدم خدمات صيانة احترافية لجميع الأجهزة المنزلية بأسعار منافسة وضمان الجودة.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold mb-4">تواصل معنا</h4>
            <div className="space-y-3">
              <a href="tel:+201234567890" className="flex items-center gap-2 hover:text-orange-400 transition-colors">
                <Phone className="w-4 h-4" />
                <span>01234567890</span>
              </a>
              <a href="mailto:info@maintenance.com" className="flex items-center gap-2 hover:text-orange-400 transition-colors">
                <Mail className="w-4 h-4" />
                <span>info@maintenance.com</span>
              </a>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>الإسكندرية، مصر</span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-bold mb-4">ساعات العمل</h4>
            <div className="space-y-2 text-sm">
              <p>السبت - الخميس: 8:00 - 20:00</p>
              <p>الجمعة: 10:00 - 18:00</p>
              <p className="text-orange-400 font-medium">خدمة طوارئ 24/7</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8">
          <div className="text-center text-gray-400 text-sm">
            <p>&copy; 2026 أسرع صيانة بالإسكندرية. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
