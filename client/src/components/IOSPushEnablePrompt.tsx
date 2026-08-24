import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Smartphone } from 'lucide-react';
import { sendExternalPush } from '../utils/pushNotifications';

export default function IOSPushEnablePrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [testLoading, setTestLoading] = useState(false);

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

  const testNotifications = async () => {
    setTestLoading(true);
    setMessage('');
    try {
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtor) {
        const ctx = new AudioCtor();
        if (ctx.state === 'suspended') await ctx.resume();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.5);
      }
      const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
      const role = String(localStorage.getItem('userRole') || user?.role || '').toLowerCase();
      const identity = String(user?.id ?? user?.username ?? '').trim();
      const result = await sendExternalPush({
        event: 'system_alert',
        title: '🔔 اختبار إشعارات Maintenance Guide',
        message: 'تم إرسال اختبار الإشعار بنجاح إلى جهاز المدير.',
        targetUserIds: role && identity ? [`staff:${role}:${identity}`] : undefined,
        targetRoles: role === 'admin' || role === 'manager' ? [role] : ['admin'],
        data: { test: true, sent_at: new Date().toISOString() }
      });
      if (!result.ok) throw new Error(result.error || 'فشل إرسال Push');
      setMessage('تم إرسال الاختبار. تحقق من صوت النغمة ومن إشعار Chrome خارج الصفحة.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تنفيذ اختبار الإشعارات');
    } finally {
      setTestLoading(false);
    }
  };

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

  return (
    <section className={`mx-auto mb-4 max-w-7xl rounded-2xl border p-4 text-right shadow-lg ${subscribed ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-orange-500/40 bg-orange-500/10'}`} dir="rtl">
      <div className="flex items-start gap-3">
        <div className={`rounded-xl p-2 ${subscribed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-orange-500/20 text-orange-300'}`}><Bell size={22} /></div>
        <div className="flex-1">
          <h2 className="font-black text-white">{subscribed ? 'إشعارات الأوردرات مفعّلة' : 'تفعيل إشعارات الأوردرات'}</h2>
          {subscribed ? (
            <p className="mt-1 text-sm text-emerald-100/80">هذا الجهاز مشترك الآن في OneSignal ويستقبل إشعارات الأوردرات الخارجية.</p>
          ) : isIOS && !isStandalone ? (
            <p className="mt-1 text-sm text-orange-100/80">افتح الرابط في Safari، اضغط مشاركة، ثم «إضافة إلى الشاشة الرئيسية»، وبعدها افتح البرنامج من الأيقونة الجديدة.</p>
          ) : (
            <p className="mt-1 text-sm text-orange-100/80">الإشعارات غير مفعّلة على هذا الجهاز. اضغط الزر للسماح بإشعارات الأوردرات الجديدة والصوت الخارجي.</p>
          )}
          {(!subscribed && (!isIOS || isStandalone)) && (
            <button type="button" onClick={enable} disabled={loading} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 font-bold text-white disabled:opacity-60">
              {loading ? <Smartphone size={16} className="animate-pulse" /> : <Bell size={16} />}
              {loading ? 'جاري التفعيل...' : 'تفعيل الإشعارات الآن'}
            </button>
          )}
          {subscribed && <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => { void testNotifications(); }} disabled={testLoading} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-bold text-white disabled:opacity-60">{testLoading ? 'جاري الاختبار...' : 'اختبار الصوت والإشعار'}</button>
            <button type="button" onClick={() => { void refresh(); }} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white">إعادة التحقق</button>
          </div>}
          {message && <p className="mt-2 text-xs font-bold text-orange-200">{message}</p>}
        </div>
      </div>
    </section>
  );
}

export function IOSPushEnabledBadge() {
  return <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400"><CheckCircle2 size={14} /> الإشعارات مفعّلة</span>;
}

