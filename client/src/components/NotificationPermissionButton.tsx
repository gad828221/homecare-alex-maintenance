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
      
      // الكشف عن المتصفحات داخل التطبيقات (In-App Browsers) التي غالباً لا تدعم الإشعارات
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

      const optedIn = Boolean(OneSignal?.User?.PushSubscription?.optedIn);
      const osPermission = OneSignal?.Notifications?.permission; // boolean in v16
      const nativePermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';

      if (optedIn || osPermission === true || nativePermission === 'granted') {
        setPermissionStatus('granted');
      } else if (nativePermission === 'denied') {
        setPermissionStatus('denied');
      } else {
        setPermissionStatus('default');
      }
    };

    runWithOneSignal(async (OneSignal) => {
      try {
        const storedUser = readStoredUser();
        const externalId = getExternalId(storedUser);
        if (externalId && OneSignal?.login) await OneSignal.login(externalId);
        const stableId = storedUser?.id ?? storedUser?.username ?? storedUser?.techName;
        if (stableId !== undefined && stableId !== null && OneSignal?.User?.addTags) {
          await OneSignal.User.addTags({
            role: storedUser?.role || userRole,
            user_id: String(stableId),
            ...(storedUser?.username ? { username: String(storedUser.username) } : {}),
            ...(storedUser?.techName ? { tech_name: String(storedUser.techName) } : {})
          });
        }
        syncStatus(OneSignal);

        const subscription = OneSignal?.User?.PushSubscription;
        const handleSubscriptionChange = () => syncStatus(OneSignal);
        subscription?.addEventListener?.('change', handleSubscriptionChange);

        if (mounted && subscription?.optedIn) {
          setPermissionStatus('granted');
          setTimeout(() => mounted && setIsVisible(false), 2000);
        }
      } catch (error) {
        console.error('OneSignal initialization error:', error);
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
        const stableId = storedUser?.id ?? storedUser?.username ?? storedUser?.techName;
        if (stableId !== undefined && stableId !== null && OneSignal?.User?.addTags) {
          await OneSignal.User.addTags({
            role: storedUser?.role || userRole,
            user_id: String(stableId)
          });
        }

        const permission = await OneSignal?.Notifications?.requestPermission?.();
        if (permission) {
          await OneSignal?.User?.PushSubscription?.optIn?.();
          setPermissionStatus('granted');
          setTimeout(() => setIsVisible(false), 2000);
        } else {
          setPermissionStatus('denied');
        }
      } catch (error) {
        console.error('OneSignal permission error:', error);
        setPermissionStatus('denied');
      }
    });
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
            ) : permissionStatus === 'denied' ? (
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
                <p><strong>لأجهزة أندرويد (Chrome):</strong></p>
                <ol className="list-decimal list-inside pl-1 flex flex-col gap-1">
                  <li>اضغط على رمز الإعدادات 🔒 بجانب الرابط.</li>
                  <li>اختر <strong>Permissions</strong> أو <strong>إعدادات الموقع</strong>.</li>
                  <li>اجعل <strong>Notifications</strong> على <strong>Allow</strong> أو <strong>سماح</strong>.</li>
                </ol>
                <hr className="border-red-50" />
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-1 text-blue-600 font-bold underline text-center"
                >
                  بعد السماح، اضغط هنا لتحديث الصفحة
                </button>
              </div>
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
