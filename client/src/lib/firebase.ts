// client/src/lib/firebase.ts
// تم تعطيل Firebase مؤقتاً لحل مشكلة الصفحة البيضاء
// import { initializeApp } from 'firebase/app';
// import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID,
//   measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
// };

// const app = initializeApp(firebaseConfig);
// const messaging = getMessaging(app);

// export const requestNotificationPermission = async () => {
//   try {
//     const permission = await Notification.requestPermission();
//     if (permission === 'granted') {
//       const token = await getToken(messaging, {
//         vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
//       });
//       console.log('✅ FCM Token:', token);
//       return token;
//     } else {
//       console.warn('❌ لم يتم منح الإذن');
//       return null;
//     }
//   } catch (error) {
//     console.error('خطأ في الإذن:', error);
//     return null;
//   }
// };

// export const onForegroundMessage = (callback: (payload: any) => void) => {
//   onMessage(messaging, (payload) => {
//     console.log('📩 إشعار:', payload);
//     callback(payload);
//   });
// };

// دالة فارغة عشان الكود اللي بيستخدمها ميفشلش
export const requestNotificationPermission = async () => null;
export const onForegroundMessage = () => {};
