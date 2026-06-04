importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration (Placeholder - will be replaced by actual config)
const firebaseConfig = {
  apiKey: "AIzaSyB-placeholder",
  authDomain: "homecare-alex.firebaseapp.com",
  projectId: "homecare-alex",
  storageBucket: "homecare-alex.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'new-order',
    renotify: true,
    data: payload.data,
    actions: [
      { action: 'open', title: 'فتح الطلب' }
    ]
  };

  // Play sound logic (limited in SW, but we can try to use a notification sound)
  // Most browsers support sound in notifications if not muted
  
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
