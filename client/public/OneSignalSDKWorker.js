importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// v3.1.6: الحل القاطع لفتح التطبيق المثبت (PWA) ومنع فتح تبويبات المتصفح
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = data.url || '/orders?source=pwa';

  event.waitUntil(
    self.clients.claim().then(() => {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        // 1. البحث عن أي نافذة تابعة للتطبيق (PWA) أو الموقع
        for (let client of clientList) {
          const isSameOrigin = new URL(client.url).origin === self.location.origin;
          if (isSameOrigin && 'focus' in client) {
            // تحويل النافذة المفتوحة للرابط المطلوب
            if ('navigate' in client) {
              client.navigate(targetUrl);
            }
            return client.focus();
          }
        }
        // 2. إذا لم يجد أي نافذة، يفتح الرابط في وضعية التطبيق
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      });
    })
  );
});
