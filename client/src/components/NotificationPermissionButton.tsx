import { useEffect, useState } from 'react';
import { Bell, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

type PermissionStatus = 'granted' | 'denied' | 'default' | 'loading' | 'unsupported';

type StoredUser = {
  id?: string | number;
  username?: string;
  role?: string;
  techName?: string;
};

const runWithOneSignal = (callback: (OneSignal: any) => void | Promise<void>) => {
  if (typeof window === 'undefined') return;
  const win = window as any;
  win.OneSignalDeferred = win.OneSignalDeferred || [];
  win.OneSignalDeferred.push(callback);
};

const readStoredUser = (): StoredUser | null => {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getExternalId = (user: StoredUser | null) => {
  if (!user) return null;
  const role = user.role || localStorage.getItem('userRole') || 'user';
  const stableId = user.id ?? user.username ?? user.techName;
  return stableId === undefined || stableId === null ? null : `${role}:${stableId}`;
};

export default function NotificationPermissionButton() {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('default');
  const [isVisible, setIsVisible] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
  const isAllowedUser = userRole === 'admin' || userRole === 'manager' || userRole === 'tech';
  const shouldRender = isAllowedUser && currentPath !== '/';

  useEffect(() => {
    if (!shouldRender) return;

    let mounted = true;

    const checkSupport = () => {
      if (typeof window === 'undefined') return true;
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      const hasSupport = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
      const ua = navigator.userAgent || '';
      const isInApp = /FBAN|FBAV|WhatsApp|Instagram|Line|Messenger/i.test(ua);
      if (!isSecure || (!hasSupport && !isInApp)) return false;
      return true;
    };

    const syncStatus = (OneSignal: any) => {
      if (!mounted) return;
      
      if (!checkSupport()) {
        setPermissionStatus('unsupported');
        return;
      }

      const nativePermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
      
      // إذا كان المتصفح أعطى الإذن، نعتبر الحالة مقبولة فوراً لتجنب إزعاج المستخدم
      if (nativePermission === 'granted') {
        setPermissionStatus('granted');
        setTimeout(() => mounted && setIsVisible(false), 3000);
        return;
      }

      const optedIn = Boolean(OneSignal?.User?.PushSubscription?.optedIn);
      const osPermission = OneSignal?.Notifications?.permission;

      if (optedIn || osPermission === true) {
        setPermissionStatus('granted');
        setTimeout(() => mounted && setIsVisible(false), 3000);
      } else if (nativePermission === 'denied') {
        setPermissionStatus('denied');
      } else {
        setPermissionStatus('default');
      }
    };

    runWithOneSignal(async (OneSignal) => {
      try {
        syncStatus(OneSignal);

        const storedUser = readStoredUser();
        const externalId = getExternalId(storedUser);
        
        if (externalId && OneSignal?.login) {
          await OneSignal.login(externalId).catch((e: any) => console.warn('OS Login failed:', e));
        }

        const stableId = storedUser?.id ?? storedUser?.username ?? storedUser?.techName;
        if (stableId !== undefined && stableId !== null && OneSignal?.User?.addTags) {
          await OneSignal.User.addTags({
            role: storedUser?.role || userRole,
            user_id: String(stableId)
          }).catch((e: any) => console.warn('OS Tags failed:', e));
        }

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          await OneSignal?.User?.PushSubscription?.optIn?.().catch(() => {});
        }

        syncStatus(OneSignal);

        const subscription = OneSignal?.User?.PushSubscription;
        subscription?.addEventListener?.('change', () => syncStatus(OneSignal));
      } catch (error) {
        console.error('OneSignal background init error:', error);
      }
    });

    return () => {
      mounted = false;
    };
  }, [shouldRender, userRole, currentPath]);

  const handleEnable = () => {
    setPermissionStatus('loading');
    runWithOneSignal(async (OneSignal) => {
      try {
        const storedUser = readStoredUser();
        const externalId = getExternalId(storedUser);
        if (externalId && OneSignal?.login) await OneSignal.login(externalId);
        
        if (OneSignal?.slidedown) {
          await OneSignal.slidedown.promptPush();
        }

        const permission = await OneSignal?.Notifications?.requestPermission?.();
        if (permission) {
          await OneSignal?.User?.PushSubscription?.optIn?.();
          setPermissionStatus('granted');
          setTimeout(() => setIsVisible(false), 2000);
        } else {
          const currentPermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
          if (currentPermission === 'denied') {
            setPermissionStatus('denied');
          } else {
            setPermissionStatus('default');
          }
        }
      } catch (error) {
        console.error('OneSignal permission error:', error);
        // لا نغير الحالة لـ denied إلا إذا كان المتصفح يرفض فعلاً
        if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
          setPermissionStatus('denied');
        } else {
          setPermissionStatus('default');
        }
      }
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('تم نسخ الرابط. افتحه في متصفح Chrome الآن.');
  };

  if (!shouldRender || !isVisible || permissionStatus === 'granted') return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm w-[calc(100%-2rem)] md:w-96" dir="rtl">
      <div className={`p-4 rounded-xl shadow-2xl border-2 flex flex-col gap-3 transition-all ${
        permissionStatus === 'denied' || permissionStatus === 'unsupported'
          ? 'bg-red-50 border-red-200 text-red-900'
          : 'bg-blue-50 border-blue-200 text-blue-900'
      }`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {permissionStatus === 'loading' ? (
              <div className="animate-spin"><Bell className="w-6 h-6 text-blue-600" /></div>
            ) : permissionStatus === 'denied' || permissionStatus === 'unsupported' ? (
              <AlertCircle className="w-6 h-6 text-red-600" />
            ) : (
              <Bell className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">
              {permissionStatus === 'unsupported' ? 'المتصفح غير مدعوم!' : 
               permissionStatus === 'denied' ? 'الإشعارات محظورة!' : 'فعّل إشعارات الموبايل'}
            </p>
            <p className="text-sm opacity-90 leading-relaxed">
              {permissionStatus === 'unsupported'
                ? 'متصفحك الحالي لا يدعم الإشعارات. يرجى فتح الموقع في متصفح Google Chrome أو Safari مباشرة.'
                : permissionStatus === 'denied'
                ? 'لقد تم حظر الإشعارات من إعدادات المتصفح. يرجى السماح بها يدوياً لتصلك تنبيهات الأوردرات.'
                : 'احصل على تنبيه فوري بصوت على هاتفك عند إضافة أوردر أو تغيير حالته.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
            aria-label="إغلاق تنبيه الإشعارات"
          >
            ✕
          </button>
        </div>

        {permissionStatus === 'unsupported' ? (
          <button
            type="button"
            onClick={() => window.open(window.location.href, '_blank')}
            className="w-full py-3 rounded-lg font-bold bg-slate-800 text-white shadow-lg hover:bg-slate-700 transition-colors"
          >
            فتح في المتصفح الخارجي 🌐
          </button>
        ) : permissionStatus === 'denied' ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center justify-between w-full px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg font-bold text-sm transition-colors"
              aria-expanded={showInstructions}
            >
              <span className="flex items-center gap-2"><Info className="w-4 h-4" /> طريقة التفعيل يدوياً</span>
              {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showInstructions && (
              <div className="bg-white p-3 rounded-lg text-xs border border-red-100 shadow-inner flex flex-col gap-2 leading-relaxed">
                <p className="font-bold text-blue-800 mb-1">💡 الحل السريع لفك الحظر:</p>
                
                <div className="space-y-3">
                  <div>
                    <p className="font-bold">1️⃣ أندرويد (Chrome):</p>
                    <p className="pr-4">اضغط على رمز 🔒 أو الإعدادات بجانب الرابط في الأعلى ⬅️ اختر **إعدادات الموقع** ⬅️ اضغط **حذف البيانات وإعادة ضبط الأذونات** ⬅️ ثم حدّث الصفحة.</p>
                  </div>
                  
                  <hr className="border-slate-100" />
                  
                  <div>
                    <p className="font-bold">2️⃣ آيفون (Safari):</p>
                    <p className="pr-4">تأكد من **إضافة الموقع للشاشة الرئيسية** أولاً ⬅️ افتح التطبيق من الأيقونة ⬅️ اذهب للإعدادات ⬅️ الإشعارات ⬅️ تأكد أنها مفعلة للموقع.</p>
                  </div>
                </div>

                <hr className="border-red-50" />
                <button 
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-1 py-2 bg-blue-50 text-blue-700 rounded-lg font-bold text-center active:bg-blue-100 transition-colors"
                >
                  بعد الضبط، اضغط هنا لتحديث الصفحة 🔄
                </button>
              </div>
            )}
            
            <button
              type="button"
              onClick={copyLink}
              className="mt-2 w-full py-2 border-2 border-dashed border-red-200 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
            >
              نسخ الرابط لفتحه في Chrome 🔗
            </button>

            <div className="mt-2 p-2 bg-black/5 rounded text-[10px] font-mono opacity-50 break-all">
              Diagnostic: {permissionStatus} | {typeof Notification !== 'undefined' ? Notification.permission : 'N/A'} | {window.location.hostname}
            </div>
            
            {window.location.hostname.includes('www') && (
              <p className="mt-2 text-[10px] text-red-600 font-bold">
                ⚠️ تنبيه: جرب فتح الموقع بدون www إذا استمرت المشكلة.
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleEnable}
            disabled={permissionStatus === 'loading'}
            className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-colors ${
              permissionStatus === 'loading' ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {permissionStatus === 'loading' ? 'جاري التفعيل...' : 'تفعيل الإشعارات الآن 🔔'}
          </button>
        )}
      </div>
    </div>
  );
}
