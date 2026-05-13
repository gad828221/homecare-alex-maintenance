import { Link } from "wouter";
import { Phone, MessageCircle, Clock, Menu, X, ChevronDown, ShieldCheck } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [brandsOpen, setBrandsOpen] = useState(false);

  const brands = [
    { name: "Samsung", path: "/samsung-service" },
    { name: "LG", path: "/lg-service" },
    { name: "Sharp", path: "/sharp-service" },
    { name: "Toshiba", path: "/toshiba-service" },
    { name: "Zanussi", path: "/zanussi-service" },
    { name: "Unionaire", path: "/unionaire-service" },
    { name: "Fresh", path: "/fresh-service" },
    { name: "White Whale", path: "/white-whale-service" },
    { name: "Ariston", path: "/ariston-service" },
    { name: "Beko", path: "/beko-service" },
    { name: "Hoover", path: "/hoover-service" },
    { name: "Indesit", path: "/indesit-service" },
  ];

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-orange-500/50 shadow-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Trust Signal */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-orange-500/50 transition-all">
              ⚙️
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg text-white leading-none group-hover:text-orange-400 transition-colors">Maintenance Guide</span>
              <span className="text-[10px] text-orange-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> مركز صيانة معتمد
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/" className="text-gray-200 hover:text-orange-400 font-bold transition-colors">الرئيسية</Link>
            
            {/* Brands Dropdown */}
            <div className="relative group">
              <button className="text-gray-200 hover:text-orange-400 font-bold transition-colors flex items-center gap-2">
                الماركات
                <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute left-0 mt-0 w-64 bg-slate-800 border border-orange-500/30 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-3 grid grid-cols-2 gap-1 px-2">
                {brands.map((brand) => (
                  <Link
                    key={brand.path}
                    href={brand.path}
                    className="block px-3 py-2 text-gray-300 hover:text-orange-400 hover:bg-slate-700/50 rounded-lg transition-colors text-xs font-bold"
                  >
                    {brand.name}
                  </Link>
                ))}
              </div>
            </div>
            <button onClick={scrollToContact} className="text-gray-200 hover:text-orange-400 font-bold transition-colors">اتصل بنا</button>
          </nav>

          {/* CTA Buttons - Optimized for Google Ads */}
          <div className="flex items-center gap-2">
            <a
              href="tel:+201278885772"
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-full font-black text-sm transition-all transform hover:scale-105 shadow-lg shadow-orange-900/20"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">01278885772</span>
              <span className="sm:hidden">اتصل</span>
            </a>
            
            <a
              href="https://wa.me/201558625259"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-full font-black text-sm transition-all transform hover:scale-105 shadow-lg shadow-green-900/20"
            >
              <MessageCircle className="w-4 h-4" />
              واتساب
            </a>

            {/* Mobile Menu Button */}
            <button className="lg:hidden p-2 text-white bg-slate-800 rounded-lg" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="lg:hidden bg-slate-800 rounded-2xl mt-2 p-4 border border-orange-500/30 shadow-2xl animate-in slide-in-from-top duration-300">
            <div className="space-y-2">
              <Link href="/" onClick={() => setIsOpen(false)} className="block text-white font-bold p-3 hover:bg-slate-700 rounded-xl">الرئيسية</Link>
              
              <button
                onClick={() => setBrandsOpen(!brandsOpen)}
                className="w-full text-right text-white font-bold p-3 hover:bg-slate-700 rounded-xl flex items-center justify-between"
              >
                الماركات
                <ChevronDown className={`w-4 h-4 transition-transform ${brandsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {brandsOpen && (
                <div className="grid grid-cols-2 gap-2 p-2 bg-slate-900/50 rounded-xl">
                  {brands.map((brand) => (
                    <Link
                      key={brand.path}
                      href={brand.path}
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 text-gray-300 hover:text-orange-400 text-xs font-bold"
                    >
                      {brand.name}
                    </Link>
                  ))}
                </div>
              )}
              
              <button onClick={scrollToContact} className="w-full text-right text-white font-bold p-3 hover:bg-slate-700 rounded-xl">اتصل بنا</button>
              
              <div className="grid grid-cols-2 gap-2 pt-4">
                <a href="tel:+201278885772" className="flex items-center justify-center gap-2 bg-orange-600 text-white p-3 rounded-xl font-bold text-sm">
                  <Phone className="w-4 h-4" /> اتصل الآن
                </a>
                <a href="https://wa.me/201558625259" className="flex items-center justify-center gap-2 bg-green-600 text-white p-3 rounded-xl font-bold text-sm">
                  <MessageCircle className="w-4 h-4" /> واتساب
                </a>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
