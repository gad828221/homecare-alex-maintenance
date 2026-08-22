import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function ScrollButtons() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-6 flex flex-col gap-3 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button
        onClick={scrollToTop}
        className="w-12 h-12 bg-slate-800/80 backdrop-blur-md text-orange-500 rounded-2xl flex items-center justify-center shadow-2xl border border-white/10 hover:bg-orange-600 hover:text-white transition-all active:scale-90 group"
        title="للأعلى"
      >
        <ChevronUp size={24} className="group-hover:-translate-y-1 transition-transform" />
      </button>
      <button
        onClick={scrollToBottom}
        className="w-12 h-12 bg-slate-800/80 backdrop-blur-md text-orange-500 rounded-2xl flex items-center justify-center shadow-2xl border border-white/10 hover:bg-orange-600 hover:text-white transition-all active:scale-90 group"
        title="للأسفل"
      >
        <ChevronDown size={24} className="group-hover:translate-y-1 transition-transform" />
      </button>
    </div>
  );
}
