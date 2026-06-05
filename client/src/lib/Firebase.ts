// client/src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyAahbcsz5j1-Wd8iqXJ7VPFeq_wehqus-U",
  authDomain: "maintenanceguide-push.firebaseapp.com",
  projectId: "maintenanceguide-push",
  storageBucket: "maintenanceguide-push.firebasestorage.app",
  messagingSenderId: "927790656979",
  appId: "1:927790656979:web:25bab5fcff53eff1301326",
  measurementId: "G-KZCN8MVTLL"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// دالة لطلب الإذن والحصول على token
export const requestNotificationPermission = async () => {
  try {
    // طلب إذن الإشعارات من المستخدم
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // الحصول على token من FCM
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY_HERE' // سنضيفه لاحقاً
      });
      console.log('✅ FCM Token:', token);
      // هنا سنحفظ الـ token في Supabase لاحقاً
      return token;
    } else {
      console.warn('❌ لم يتم منح إذن الإشعارات');
      return null;
    }
  } catch (error) {
    console.error('خطأ في الحصول على الإذن:', error);
    return null;
  }
};

// دالة لاستقبال الإشعارات أثناء فتح التطبيق (foreground)
export const onForegroundMessage = (callback) => {
  onMessage(messaging, (payload) => {
    console.log('📩 إشعار أثناء فتح التطبيق:', payload);
    callback(payload);
  });
};
