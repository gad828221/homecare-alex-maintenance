import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Smartphone } from 'lucide-react';

export default function IOSPushEnablePrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = async () => {
    if (typeof window === 'undefined') return;
    const win = window as any;
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || win.navigator.standalone === true;
    setIsIOS(ios);
    setIsStandalone(Boolean(standalone));
    try {
      const push = win.OneSignal?.User?.PushSubscription;
      if (push) setSubscribed(Boolean(await push.optedIn));
    } catch {
      setSubscribed(false);
    }
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  const enable = async () => {
    const win = window as any;
    setLoading(true);
    setMessage('');
    try {
      if (!win.OneSignal) throw new Error('OneSignal غير جاهز بعد');
      if ('Notification' in window && Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') throw new Error('لم يتم السماح بالإشعارات');
      }
      await win.OneSignal.User.PushSubscription.optIn();
      await refresh();
      setMessage('تم تفعيل إشعارات مدير العمليات');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تفعيل الإشعارات');
    } finally {
      setLoading(false);
    }
  };

  // The subscription and OneSignal identity sync run in the effect above.
  // Keep this component mounted but intentionally render no banner in the manager UI.
  return null;
}

export function IOSPushEnabledBadge() {
  return <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400"><CheckCircle2 size={14} /> الإشعارات مفعّلة</span>;
}

