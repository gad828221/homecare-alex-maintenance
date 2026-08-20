import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNotification } from './EnhancedNotificationSystem';

export default function ManusRealtimeAlerts() {
  const { addNotification } = useNotification();

  useEffect(() => {
    // 1. الاستماع للأوردرات الجديدة
    const ordersChannel = supabase
      .channel('manus-realtime-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          const newOrder = payload.new as any;
          const title = '📋 أوردر جديد وصل!';
          const message = `عميل: ${newOrder.customer_name} - جهاز: ${newOrder.device_type}`;
          
          // إرسال تنبيه داخلي
          addNotification({
            type: 'success',
            title,
            message,
            duration: 10000
          });

          // إرسال تنبيه متصفح مباشر (المفتاح السحري)
          await triggerBrowserNotification(title, message);
        }
      )
      .subscribe();

    // 2. الاستماع لرسائل الشات الجديدة للموظفين
    const chatChannel = supabase
      .channel('manus-realtime-chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'employee_messages' },
        async (payload) => {
          const newMessage = payload.new as any;
          const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
          
          // لا تنبه المرسل نفسه
          if (newMessage.sender_id === currentUser.id) return;

          const title = `💬 رسالة جديدة من ${newMessage.sender_name || 'زميل'}`;
          const message = newMessage.message_text;

          addNotification({
            type: 'info',
            title,
            message,
            duration: 7000
          });

          await triggerBrowserNotification(title, message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [addNotification]);

  return null; // مكون صامت يعمل في الخلفية
}

async function triggerBrowserNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.showNotification(title, {
        body,
        icon: '/pwa-192.png',
        badge: '/pwa-192.png',
        vibrate: [200, 100, 200],
        tag: 'manus-alert',
        renotify: true,
        data: { url: '/orders' }
      });
    }
  } catch (err) {
    console.error('Manus Realtime Alert Error:', err);
  }
}
