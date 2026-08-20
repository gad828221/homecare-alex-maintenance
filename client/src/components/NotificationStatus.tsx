import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Info, ChevronDown, CheckCircle2, ShieldAlert, RefreshCw, Lock } from 'lucide-react';

export default function NotificationStatus() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const checkStatus = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const currentPerm = Notification.permission;
      setPermission(currentPerm);
      if (currentPerm === 'denied') setIsBlocked(true);
    }
    
    const win = window as any;
    if (win.OneSignal && win.OneSignal.User && win.OneSignal.User.PushSubscription) {
      const status = await win.OneSignal.User.PushSubscription.optedIn;
      setIsSubscribed(!!status);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleEnable = async () => {
    const win = window as any;
    if (!win.OneSignal) {
      alert("محرك الإشعارات لم يكتمل تحميله بعد.");
      return;
    }

    if (permission === 'denied') {
      setShowHelp(true);
      alert("الإشعارات محظورة في إعدادات متصفحك. يرجى اتباع التعليمات أسفل الزر لفك الحظر.");
      return;
    }

    setLoading(true);
    
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setIsBlocked(true);
      setShowHelp(true);
    }, 5000);

    try {
      // طلب الصلاحية الأصلية
      if ('Notification' in window) {
        const res = await Notification.requestPermission();
        if (res === 'denied') setIsBlocked(true);
      }

      await win.OneSignal.User.PushSubscription.optIn();
      await win.OneSignal.Slidedown.promptPush();
      
      if (win.OneSignal.showNativePrompt) {
        await win.OneSignal.showNativePrompt();
      }

      await checkStatus();
    } catch (err) {
      console.error("OneSignal Enable Error:", err);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 py-4 border-t border-slate-800/50 mt-4 w-full max-w-xs mx-auto">
      <div className="flex items-center gap-2 text-[11px] font-bold">
        {permission === 'granted' && isSubscribed ? (
          <div className="flex items-center gap-1.5 text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
            <CheckCircle2 size={12} />
            <span>جرس التنبيهات نشط</span>
          </div>
        ) : isBlocked ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
              <ShieldAlert size={12} />
              <span>الإشعارات محظورة في Chrome</span>
            </div>
          </div>
        ) : (
          <button 
            onClick={handleEnable}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
              loading 
                ? "text-slate-400 bg-slate-800 border-slate-700 cursor-wait" 
                : "text-orange-500 bg-orange-500/10 border-orange-500/20 animate-pulse hover:bg-orange-500/20"
            }`}
          >
            {loading ? <RefreshCw size={12} className="animate-spin" /> : <BellOff size={12} />}
            <span>{loading ? "جاري التفعيل..." : "تفعيل جرس التنبيهات الآن"}</span>
          </button>
        )}
      </div>

      <button 
        onClick={() => setShowHelp(!showHelp)}
        className={`flex items-center gap-1 text-[10px] transition-colors ${isBlocked ? 'text-red-400 animate-bounce' : 'text-slate-400 hover:text-orange-400'}`}
      >
        <Lock size={10} />
        <span>{isBlocked ? "اضغط هنا لفك حظر الإشعارات يدويًا" : "لماذا لا تظهر تفاصيل الرسالة في Chrome؟"}</span>
        <ChevronDown size={10} className={`transition-transform ${showHelp ? 'rotate-180' : ''}`} />
      </button>

      {showHelp && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-[11px] text-right leading-relaxed animate-in slide-in-from-top-2 duration-200 w-full">
          <p className="font-bold text-red-400 mb-3 flex items-center gap-1">
            <Lock size={12} /> طريقة فك الحظر في Chrome Android:
          </p>
          <div className="space-y-3 text-slate-300">
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700">
              1. انظر لأعلى المتصفح بجانب الرابط، ستجد علامة <b>قفل 🔒</b> أو <b>إعدادات ⚙️</b>. اضغط عليها.
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700">
              2. ابحث عن كلمة <b>"الإشعارات" (Notifications)</b>.
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700">
              3. قم بتفعيل المفتاح ليصبح باللون الأزرق (مفعل).
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700">
              4. ارجع للبرنامج وقم بعمل تحديث (Refresh).
            </div>
            <p className="text-blue-400 font-bold mt-2 pt-2 border-t border-slate-700">
              💡 إذا استمرت المشكلة، ننصح بشدة باستخدام <b>Firefox</b> لأنه يدعم الإشعارات بقوة وبدون تعقيدات Chrome.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
