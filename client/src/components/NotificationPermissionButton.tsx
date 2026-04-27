import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle } from 'lucide-react';

export default function NotificationPermissionButton() {
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default' | 'loading'>('default');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // فحص حالة الإشعارات الحالية
    checkNotificationPermission();

    // الاستماع لحدث منح الصلاحيات
    const handlePermissionGranted = () => {
      setPermissionStatus('granted');
      setTimeout(() => setIsVisible(false), 2000);
    };

    window.addEventListener('onesignal-permission-granted', handlePermissionGranted);
    return () => window.removeEventListener('onesignal-permission-granted', handlePermissionGranted);
  }, []);

  const checkNotificationPermission = async () => {
    try {
      if (!window.OneSignal) {
        console.warn('[NotificationButton] OneSignal not loaded yet');
        return;
      }

      // محاولة الحصول على حالة الإشعارات
      const isSubscribed = await window.OneSignal.User.getOnesignalId();
      if (isSubscribed) {
        setPermissionStatus('granted');
      } else {
        setPermissionStatus('default');
      }
    } catch (error) {
      console.error('[NotificationButton] Error checking permission:', error);
    }
  };

  const handleEnableNotifications = async () => {
    setPermissionStatus('loading');
    try {
      if (!window.OneSignal) {
        console.error('[NotificationButton] OneSignal not loaded');
        return;
      }

      console.log('[NotificationButton] Requesting notification permission');
      const permission = await window.OneSignal.Notifications.requestPermission();
      console.log('[NotificationButton] Permission result:', permission);

      if (permission) {
        setPermissionStatus('granted');
        setTimeout(() => setIsVisible(false), 2000);
      } else {
        setPermissionStatus('denied');
      }
    } catch (error) {
      console.error('[NotificationButton] Error enabling notifications:', error);
      setPermissionStatus('denied');
    }
  };

  if (!isVisible || permissionStatus === 'granted') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className={`p-4 rounded-lg shadow-lg flex items-center gap-3 ${
        permissionStatus === 'denied' 
          ? 'bg-red-100 border border-red-300' 
          : 'bg-blue-100 border border-blue-300'
      }`}>
        <div className="flex-shrink-0">
          {permissionStatus === 'loading' ? (
            <div className="animate-spin">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          ) : permissionStatus === 'denied' ? (
            <AlertCircle className="w-6 h-6 text-red-600" />
          ) : (
            <Bell className="w-6 h-6 text-blue-600" />
          )}
        </div>

        <div className="flex-1">
          <p className={`font-bold ${
            permissionStatus === 'denied' ? 'text-red-800' : 'text-blue-800'
          }`}>
            {permissionStatus === 'denied' 
              ? 'تم رفض الإشعارات' 
              : 'فعّل الإشعارات'}
          </p>
          <p className={`text-sm ${
            permissionStatus === 'denied' ? 'text-red-700' : 'text-blue-700'
          }`}>
            {permissionStatus === 'denied'
              ? 'يرجى السماح بالإشعارات من إعدادات المتصفح'
              : 'احصل على إشعارات فورية عند وصول أوردر جديد'}
          </p>
        </div>

        {permissionStatus !== 'denied' && (
          <button
            onClick={handleEnableNotifications}
            disabled={permissionStatus === 'loading'}
            className={`flex-shrink-0 px-4 py-2 rounded font-bold text-white transition-all ${
              permissionStatus === 'loading'
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {permissionStatus === 'loading' ? 'جاري...' : 'تفعيل'}
          </button>
        )}

        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
