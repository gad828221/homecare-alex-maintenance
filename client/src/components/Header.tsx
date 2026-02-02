import { Link } from "wouter";
import { Phone, MessageCircle, Clock } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-md">
      <div className="container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
              ⚙️
            </div>
            <span className="font-bold text-xl text-foreground hidden sm:inline">أسرع صيانة</span>
          </Link>

          {/* Contact Info - Professional Icons */}
          <div className="flex items-center gap-4">
            {/* WhatsApp */}
            <a
              href="https://wa.me/201558625259"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full transition-all transform hover:scale-110 shadow-lg"
              title="تواصل عبر WhatsApp"
            >
              <MessageCircle className="w-6 h-6" />
            </a>

            {/* Phone Call */}
            <a
              href="tel:+201278885772"
              className="flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all transform hover:scale-110 shadow-lg"
              title="اتصل بنا"
            >
              <Phone className="w-6 h-6" />
            </a>

            {/* Hours */}
            <div
              className="flex items-center justify-center w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-all transform hover:scale-110 shadow-lg cursor-help"
              title="ساعات العمل: السبت-الخميس 8:00-20:00، الجمعة 10:00-18:00"
            >
              <Clock className="w-6 h-6" />
            </div>

            {/* Book Now Button */}
            <a
              href="#contact"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg hidden sm:inline-block"
            >
              احجز الآن
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
