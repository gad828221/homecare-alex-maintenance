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

  if (!isIOS || subscribed) return null;

  return (
    <section className="mx-auto mb-4 max-w-7xl rounded-2xl border border-orange-500/40 bg-orange-500/10 p-4 text-right shadow-lg" dir="rtl">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-orange-500/20 p-2 text-orange-300"><Bell size={22} /></div>
        <div className="flex-1">
          <h2 className="font-black text-white">تفعيل إشعارات مدير العمليات على iPhone</h2>
          {!isStandalone ? (
            <p className="mt-1 text-sm text-orange-100/80">افتح الرابط في Safari، اضغط مشاركة، ثم «إضافة إلى الشاشة الرئيسية»، وبعدها افتح بوابة الموظفين من الأيقونة الجديدة.</p>
          ) : (
            <p className="mt-1 text-sm text-orange-100/80">البوابة مثبتة. اضغط الزر لتفعيل استقبال إشعارات الأوردرات.</p>
          )}
          {isStandalone && (
            <button type="button" onClick={enable} disabled={loading} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 font-bold text-white disabled:opacity-60">
              {loading ? <Smartphone size={16} className="animate-pulse" /> : <Bell size={16} />}
              {loading ? 'جاري التفعيل...' : 'تفعيل الإشعارات'}
            </button>
          )}
          {message && <p className="mt-2 text-xs font-bold text-orange-200">{message}</p>}
        </div>
      </div>
    </section>
  );
}

export function IOSPushEnabledBadge() {
  return <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400"><CheckCircle2 size={14} /> الإشعارات مفعّلة</span>;
}

