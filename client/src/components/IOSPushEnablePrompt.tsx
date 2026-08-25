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

  // يظهر هذا الزر داخل لوحة الموظف فقط، ويختفي تلقائيًا بعد إنشاء Push Token.
  if (subscribed) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 z-[70] mx-auto flex max-w-sm items-center justify-between gap-3 rounded-2xl border border-orange-500/30 bg-slate-950/95 px-4 py-3 text-right shadow-2xl backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        <Smartphone className="shrink-0 text-orange-400" size={18} />
        <span className="text-[11px] font-bold leading-5 text-slate-200">إشعارات الهاتف غير مفعّلة</span>
      </div>
      <button type="button" onClick={() => { void enable(); }} disabled={loading} className="shrink-0 rounded-xl bg-orange-600 px-3 py-2 text-[10px] font-black text-white transition hover:bg-orange-500 disabled:opacity-60">
        {loading ? 'جاري التفعيل...' : 'تفعيل الآن'}
      </button>
      {message && <span className="sr-only">{message}</span>}
    </div>
  );
}

export function IOSPushEnabledBadge() {
  return <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400"><CheckCircle2 size={14} /> الإشعارات مفعّلة</span>;
}

