import { Link } from "wouter";
import { Phone, MessageCircle, Clock, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-orange-500 shadow-lg">
      <div className="container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-orange-500/50 transition-all">
              ⚙️
            </div>
            <span className="font-bold text-xl text-white hidden sm:inline group-hover:text-orange-400 transition-colors">Maintenance Guide</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-200 hover:text-orange-400 font-medium transition-colors">الرئيسية</Link>
            <Link href="/samsung-service" className="text-gray-200 hover:text-orange-400 font-medium transition-colors">Samsung</Link>
            <Link href="/lg-service" className="text-gray-200 hover:text-orange-400 font-medium transition-colors">LG</Link>
          </nav>

          {/* Contact Info - Professional Icons */}
          <div className="hidden md:flex items-center gap-3">
            {/* WhatsApp */}
            <a
              href="https://wa.me/201558625259"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-11 h-11 bg-green-500 hover:bg-green-600 text-white rounded-full transition-all transform hover:scale-110 shadow-lg hover:shadow-green-500/50"
              title="تواصل عبر WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </a>

            {/* Phone Call */}
            <a
              href="tel:+201278885772"
              className="flex items-center justify-center w-11 h-11 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all transform hover:scale-110 shadow-lg hover:shadow-red-500/50"
              title="اتصل بنا"
            >
              <Phone className="w-5 h-5" />
            </a>

            {/* Hours */}
            <div
              className="flex items-center justify-center w-11 h-11 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all transform hover:scale-110 shadow-lg hover:shadow-blue-500/50 cursor-help"
              title="ساعات العمل: السبت-الخميس 8:00-20:00، الجمعة 10:00-18:00"
            >
              <Clock className="w-5 h-5" />
            </div>

            {/* Book Now Button */}
            <a
              href="#contact"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2 rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-orange-500/50 hidden sm:inline-block"
            >
              احجز الآن
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="md:hidden bg-slate-800 border-t border-orange-500 py-4 space-y-3">
            <Link href="/" className="block text-gray-200 hover:text-orange-400 font-medium py-2 transition-colors">الرئيسية</Link>
            <Link href="/samsung-service" className="block text-gray-200 hover:text-orange-400 font-medium py-2 transition-colors">Samsung</Link>
            <Link href="/lg-service" className="block text-gray-200 hover:text-orange-400 font-medium py-2 transition-colors">LG</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
