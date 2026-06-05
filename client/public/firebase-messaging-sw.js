// client/public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAahbcsz5j1-Wd8iqXJ7VPFeq_wehqus-U",
  authDomain: "maintenanceguide-push.firebaseapp.com",
  projectId: "maintenanceguide-push",
  storageBucket: "maintenanceguide-push.firebasestorage.app",
  messagingSenderId: "927790656979",
  appId: "1:927790656979:web:25bab5fcff53eff1301326"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('إشعار في الخلفية:', payload);
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/logo.png'
  });
});
