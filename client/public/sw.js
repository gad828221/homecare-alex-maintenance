// OneSignal + PWA Unified Worker v2.7.0
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

const CACHE_NAME = 'maintenance-guide-v2.7.9-staff-launch';
const APP_SHELL = [
  '/manifest.webmanifest',
  '/pwa-192.png',
  '/pwa-512.png',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/rest/') || url.pathname.startsWith('/functions/') || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/') || caches.match('/index.html'))
    );
    return;
  }

  if (url.pathname.startsWith('/assets/') || APP_SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fresh = fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
        return cached || fresh;
      })
    );
  }
});


// Backup Push Handler for Chrome "Privacy" fallback fix
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    // If it's a OneSignal push, we usually let the SDK handle it.
    // But if Chrome is showing "Enter to view content", we can force show it here.
    if (data.custom && data.custom.a) {
      const payload = data.custom.a;
      const title = data.title || payload.title || "تنبيه جديد - Maintenance Guide";
      const body = data.alert || data.body || payload.message || "لديك تحديث جديد في النظام";
      
      event.waitUntil(
        self.registration.showNotification(title, {
          body: body,
          icon: '/pwa-192.png',
          badge: '/pwa-192.png',
          data: { url: payload.url || '/orders?source=pwa' },
          tag: data.custom.i || 'maintenance-alert',
          renotify: true
        })
      );
    }
  } catch (e) {
    console.warn("Push data parse failed, letting SDK handle it");
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/orders?source=pwa';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(c => c.navigate(urlToOpen));
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(urlToOpen);
    })
  );
});
