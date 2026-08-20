importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// v3.1.5: تحسين توجيه الإشعارات لفتح التطبيق المثبت (PWA) ومنع التبويبات المتكررة
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/orders?source=pwa';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // 1. البحث عن نافذة مفتوحة للموقع
      for (let client of clientList) {
        if (client.url.includes('maintenanceguide.life') && 'focus' in client) {
          // إجبار النافذة المفتوحة على الذهاب للرابط المطلوب
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // 2. إذا لم يجد نافذة، يفتح واحدة جديدة (ستفتح كتطبيق إذا كان مثبتاً)
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
