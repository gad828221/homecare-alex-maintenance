import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

if ('serviceWorker' in navigator) {
  // تسجيل المحرك فوراً لضمان عمل الـ PWA والإشعارات
  navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
    .then((registration) => {
      // إجبار التحديث إذا كانت هناك نسخة جديدة
      registration.update();
      
      // التأكد من تفعيل المحرك الجديد فوراً
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    })
    .catch((error) => {
      console.error('SW Registration Error:', error);
    });

  // متابعة التغييرات في المحرك
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Service Worker updated and controlled.');
  });
}

// Stable rollback to 7a1c8b3
