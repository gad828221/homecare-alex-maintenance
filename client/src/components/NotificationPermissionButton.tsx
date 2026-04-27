import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

export default function NotificationPermissionButton() {
  const location = useLocation();
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default' | 'loading'>('default');
  const [isVisible, setIsVisible] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  // ✅ التحقق من دور المستخدم المسموح له برؤية هذا الزر
  const allowedRoles = ['admin', 'manager', 'viewer', 'tech'];
  const userRole = localStorage.getItem('userRole');
  const isAllowedUser = userRole && allowedRoles.includes(userRole);

  // ❌ إذا المستخدم ليس من الأدوار المطلوبة، لا نعرض أي شيء
  if (!isAllowedUser) {
    return null;
  }

  // ❌ أيضاً نمنع الظهور في الصفحة الرئيسية إذا كان هناك دور مسموح (اختياري للاحتياط)
  if (location.pathname === '/') {
    return null;
  }

  useEffect(() => {
    checkNotificationPermission();
    const handlePermissionGranted = () => {
      setPermissionStatus('granted');
      setTimeout(() => setIsVisible(false), 2000);
    };
    window.addEventListener('onesignal-permission-granted', handlePermissionGranted);
    return () => window.removeEventListener('onesignal-permission-granted', handlePermissionGranted);
  }, []);

  const checkNotificationPermission = async () => {
    try {
      if (!window.OneSignal) return;
      const isSubscribed = await window.OneSignal.User.getOnesignalId();
      if (isSubscribed) setPermissionStatus('granted');
      else setPermissionStatus(Notification.permission === 'denied' ? 'denied' : 'default');
    } catch (error) {
      console.error(error);
    }
  };

  const handleEnableNotifications = async () => {
    setPermissionStatus('loading');
    try {
      if (!window.OneSignal) return;
      const permission = await window.OneSignal.Notifications.requestPermission();
      if (permission) {
        setPermissionStatus('granted');
        setTimeout(() => setIsVisible(false), 2000);
      } else setPermissionStatus('denied');
    } catch (error) {
      console.error(error);
      setPermissionStatus('denied');
    }
  };

  if (!isVisible || permissionStatus === 'granted') return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm w-[calc(100%-2rem)] md:w-96">
      <div className={`p-4 rounded-xl shadow-2xl border-2 flex flex-col gap-3 transition-all ${
        permissionStatus === 'denied' 
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
              {permissionStatus === 'denied' ? 'الإشعارات محظورة!' : 'فعّل إشعارات الموبايل'}
            </p>
            <p className="text-sm opacity-90 leading-relaxed">
              {permissionStatus === 'denied'
                ? 'لقد قمت بحظر الإشعارات سابقاً. لن تصلك تنبيهات الأوردرات الجديدة حتى تقوم بتفعيلها يدوياً.'
                : 'احصل على تنبيه فوري بصوت قوي على هاتفك عند إضافة أي أوردر جديد.'}
            </p>
          </div>
          <button onClick={() => setIsVisible(false)} className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>

        {permissionStatus === 'denied' ? (
          <div className="flex flex-col gap-2">
            <button onClick={() => setShowInstructions(!showInstructions)} className="flex items-center justify-between w-full px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg font-bold text-sm transition-colors">
              <span className="flex items-center gap-2"><Info className="w-4 h-4" /> طريقة التفعيل يدوياً</span>
              {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showInstructions && (
              <div className="bg-white p-3 rounded-lg text-xs border border-red-100 shadow-inner flex flex-col gap-2 leading-relaxed">
                <p><strong>لأجهزة أندرويد (Chrome):</strong></p>
                <ol className="list-decimal list-inside pl-1 flex flex-col gap-1">
                  <li>اضغط على 🔒 بجانب رابط الموقع في الأعلى.</li>
                  <li>اختر <strong>إعدادات المواقع</strong> أو <strong>Permissions</strong>.</li>
                  <li>ابحث عن <strong>الإشعارات</strong> واجعلها <strong>سماح (Allow)</strong>.</li>
                </ol>
                <hr className="border-red-50" />
                <p><strong>لأجهزة آيفون (Safari):</strong></p>
                <ol className="list-decimal list-inside pl-1 flex flex-col gap-1">
                  <li>اضغط على زر المشاركة (المربع والسهم).</li>
                  <li>اختر <strong>إضافة للشاشة الرئيسية</strong>.</li>
                  <li>افتح الموقع من الأيقونة الجديدة وفعّل الإشعارات.</li>
                </ol>
              </div>
            )}
          </div>
        ) : (
          <button onClick={handleEnableNotifications} disabled={permissionStatus === 'loading'} className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all active:scale-95 ${
            permissionStatus === 'loading' ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}>
            {permissionStatus === 'loading' ? 'جاري التفعيل...' : 'تفعيل الإشعارات الآن 🔔'}
          </button>
        )}
      </div>
    </div>
  );
}
