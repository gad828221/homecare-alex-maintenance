import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Info, ChevronDown, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function NotificationStatus() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
      }
      
      const win = window as any;
      if (win.OneSignal) {
        setIsSubscribed(await win.OneSignal.User.PushSubscription.optedIn);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleEnable = async () => {
    const win = window as any;
    if (win.OneSignal) {
      try {
        // محاولة التفعيل المباشر (Direct Opt-in)
        await win.OneSignal.User.PushSubscription.optIn();
        
        // إذا لم ينجح التفعيل الصامت، نظهر نافذة الطلب الرسمية
        const isOptedIn = await win.OneSignal.User.PushSubscription.optedIn;
        if (!isOptedIn) {
          await win.OneSignal.Slidedown.promptPush();
        }
        
        // تحديث الحالة فوراً
        const currentStatus = await win.OneSignal.User.PushSubscription.optedIn;
        setIsSubscribed(currentStatus);
      } catch (err) {
        console.error("OneSignal Enable Error:", err);
        // محاولة أخيرة عبر النافذة التقليدية
        win.OneSignal.showNativePrompt?.();
      }
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
        ) : (
          <button 
            onClick={handleEnable}
            className="flex items-center gap-1.5 text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 animate-pulse hover:bg-orange-500/20 transition-all"
          >
            <BellOff size={12} />
            <span>تفعيل جرس التنبيهات الآن</span>
          </button>
        )}
      </div>

      <button 
        onClick={() => setShowHelp(!showHelp)}
        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-orange-400 transition-colors"
      >
        <Info size={10} />
        <span>لماذا لا تظهر تفاصيل الرسالة في Chrome؟</span>
        <ChevronDown size={10} className={`transition-transform ${showHelp ? 'rotate-180' : ''}`} />
      </button>

      {showHelp && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-[11px] text-right leading-relaxed animate-in slide-in-from-top-2 duration-200">
          <p className="font-bold text-orange-400 mb-2 flex items-center gap-1">
            <ShieldAlert size={12} /> حل مشكلة إخفاء المحتوى في Chrome:
          </p>
          <ul className="space-y-2 text-slate-300">
            <li>1. افتح إعدادات هاتفك (Settings) ثم <strong>التطبيقات</strong>.</li>
            <li>2. اختر <strong>Chrome</strong> ثم <strong>إدارة التنبيهات</strong>.</li>
            <li>3. ابحث عن <strong>إشعارات المواقع (Sites)</strong> واضغط عليها.</li>
            <li>4. تأكد من تفعيل <strong>إظهار المحتوى</strong> وإلغاء "إخفاء المحتوى الحساس".</li>
            <li className="text-blue-400 font-bold mt-2">💡 نصيحة: استخدم متصفح Firefox لضمان أفضل أداء للإشعارات دون تعقيدات.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
