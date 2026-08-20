import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Info, ChevronDown, CheckCircle2, ShieldAlert, RefreshCw, Lock, RotateCcw } from 'lucide-react';

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
      
      const win = window as any;
      let optedIn = false;
      if (win.OneSignal?.User?.PushSubscription) {
        optedIn = await win.OneSignal.User.PushSubscription.optedIn;
      }
      
      // إذا كان المتصفح يعطي سماح ولكن OneSignal لا يرى الاشتراك
      setIsBlocked(currentPerm === 'denied');
      setIsSubscribed(optedIn);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    setLoading(true);
    try {
      // 1. مسح كافة الـ Service Workers المسجلة (حل جذري للتعليق)
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
        console.log("Service Workers Unregistered");
      }

      const win = window as any;
      if (win.OneSignal) {
        // 2. إعادة تهيئة OneSignal
        await win.OneSignal.User.PushSubscription.optOut();
        setTimeout(async () => {
          await win.OneSignal.User.PushSubscription.optIn();
          await checkStatus();
          setLoading(false);
          alert("تمت إعادة ضبط المحرك بنجاح. يرجى محاولة التفعيل الآن.");
        }, 1500);
      } else {
        setLoading(false);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("حدث خطأ أثناء إعادة الضبط. يرجى تحديث الصفحة يدوياً.");
    }
  };

  const handleEnable = async () => {
    const win = window as any;
    if (!win.OneSignal) {
      alert("محرك الإشعارات لم يكتمل تحميله بعد.");
      return;
    }

    setLoading(true);
    
    // مؤقت أمان لمنع التعليق اللانهائي
    const timeoutId = setTimeout(() => {
      setLoading(false);
      alert("استغرق الطلب وقتاً طويلاً. يرجى الضغط على 'إعادة ضبط المحرك' ثم المحاولة مرة أخرى.");
    }, 8000);

    try {
      if ('Notification' in window && Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
      
      await win.OneSignal.User.PushSubscription.optIn();
      
      // محاولة إظهار النافذة إذا لم يتم التفعيل صامتاً
      const status = await win.OneSignal.User.PushSubscription.optedIn;
      if (!status) {
        await win.OneSignal.Slidedown.promptPush();
        if (win.OneSignal.showNativePrompt) {
          await win.OneSignal.showNativePrompt();
        }
      }
      
      await checkStatus();
    } catch (err) {
      console.error(err);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 py-4 border-t border-slate-800/50 mt-4 w-full max-w-xs mx-auto">
      <div className="flex flex-col items-center gap-2 text-[11px] font-bold w-full">
        {permission === 'granted' && isSubscribed ? (
          <div className="flex items-center gap-1.5 text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
            <CheckCircle2 size={12} />
            <span>جرس التنبيهات نشط</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-full px-4">
            <button 
              onClick={handleEnable}
              disabled={loading}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border transition-all ${
                loading 
                  ? "text-slate-400 bg-slate-800 border-slate-700 cursor-wait" 
                  : "text-orange-500 bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20 animate-pulse"
              }`}
            >
              {loading ? <RefreshCw size={12} className="animate-spin" /> : <BellOff size={12} />}
              <span>{loading ? "جاري المعالجة..." : "تفعيل جرس التنبيهات"}</span>
            </button>

            <button 
              onClick={handleReset}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-white transition-all text-[10px]"
            >
              <RotateCcw size={12} />
              <span>إعادة ضبط المحرك (حل التعليق)</span>
            </button>
          </div>
        )}
      </div>

      {isBlocked && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-[10px] text-red-400 text-center w-full mx-4">
          <ShieldAlert size={12} className="inline mb-1 mr-1" />
          الإشعارات محظورة في إعدادات Chrome. اضغط على علامة القفل 🔒 بالأعلى لتفعيلها.
        </div>
      )}

      <button 
        onClick={() => setShowHelp(!showHelp)}
        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-orange-400 transition-colors"
      >
        <Info size={10} />
        <span>دليل حل مشاكل Chrome Android</span>
        <ChevronDown size={10} className={`transition-transform ${showHelp ? 'rotate-180' : ''}`} />
      </button>

      {showHelp && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-[11px] text-right leading-relaxed animate-in slide-in-from-top-2 duration-200 w-full">
          <p className="font-bold text-orange-400 mb-2">💡 ملاحظة هامة لإعدادات هاتفك:</p>
          <ul className="space-y-2 text-slate-300">
            <li>1. تأكد من تفعيل خيار <b>"شعار" (Banner)</b> في إعدادات إشعارات Chrome لتظهر التنبيهات بوضوح.</li>
            <li>2. إذا ظل الزر يعلق، اضغط على <b>إعادة ضبط المحرك</b> ثم انتظر رسالة النجاح.</li>
            <li>3. تأكد أنك لا تستخدم "وضع التصفح الخفي".</li>
          </ul>
        </div>
      )}
    </div>
  );
}
