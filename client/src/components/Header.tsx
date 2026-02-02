import { Link } from "wouter";
import { Phone, MapPin, MessageCircle } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
              ⚙️
            </div>
            <span className="font-bold text-lg text-foreground hidden sm:inline">أسرع صيانة</span>
          </Link>

          {/* Contact Info */}
          <div className="flex items-center gap-3">
            <a
              href="tel:+201278885772"
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
              title="اتصل بنا"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">01278885772</span>
            </a>
            <a
              href="https://wa.me/201558625259"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 transition-colors"
              title="تواصل عبر WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
            <a
              href="#contact"
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              احجز الآن
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
