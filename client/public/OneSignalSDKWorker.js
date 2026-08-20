importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// v3.1.4: تخصيص سلوك الضغط على الإشعار لفتح التطبيق المثبت (PWA)
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // إغلاق الإشعار فور الضغط

  const targetUrl = event.notification.data?.url || '/orders?source=pwa';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // 1. البحث عن أي نافذة مفتوحة للموقع
      for (let client of clientList) {
        if (client.url.includes('maintenanceguide.life') && 'focus' in client) {
          return client.focus();
        }
      }
      // 2. إذا لم يجد نافذة مفتوحة، يفتح التطبيق في وضعية standalone
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
