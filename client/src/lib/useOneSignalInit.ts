import { useEffect } from 'react';

export const useOneSignalInit = (userRole: string, userId: string | number) => {
  useEffect(() => {
    if (!userId || !userRole) return;

    const initOneSignal = async () => {
      try {
        // تأكد من أن OneSignal محمل
        if (!window.OneSignal) {
          console.warn('[OneSignal] OneSignal SDK not loaded yet');
          setTimeout(() => initOneSignal(), 1000);
          return;
        }

        console.log(`[OneSignal] Initializing for user: ${userId}, role: ${userRole}`);

        // طلب صلاحيات الإشعارات من المتصفح
        const permission = await window.OneSignal.Notifications.requestPermission();
        console.log(`[OneSignal] Notification permission: ${permission}`);

        // ربط المستخدم بـ OneSignal باستخدام معرفات متعددة
        const userIdStr = userId.toString();
        
        // تسجيل الدخول بالمعرف الأساسي
        await window.OneSignal.login(userIdStr);
        console.log(`[OneSignal] Logged in with ID: ${userIdStr}`);

        // إضافة معرفات إضافية حسب الدور
        if (userRole === 'admin' || userRole === 'manager') {
          // تسجيل دخول إضافي للمديرين
          await window.OneSignal.login(`admin_${userIdStr}`);
          await window.OneSignal.login(`manager_${userIdStr}`);
          console.log(`[OneSignal] Added admin/manager IDs for user: ${userIdStr}`);
          
          // تعيين tags للمديرين
          await window.OneSignal.User.addTag('role', 'admin');
          await window.OneSignal.User.addTag('user_id', userIdStr);
          console.log(`[OneSignal] Tags added for admin user`);
        } else if (userRole === 'tech') {
          // تسجيل دخول إضافي للفنيين
          await window.OneSignal.login(`tech_${userIdStr}`);
          console.log(`[OneSignal] Added tech ID for user: ${userIdStr}`);
          
          // تعيين tags للفنيين
          await window.OneSignal.User.addTag('role', 'tech');
          await window.OneSignal.User.addTag('user_id', userIdStr);
          console.log(`[OneSignal] Tags added for tech user`);
        }

        console.log(`[OneSignal] Initialization completed successfully`);
      } catch (error) {
        console.error('[OneSignal] Initialization error:', error);
      }
    };

    initOneSignal();
  }, [userRole, userId]);
};
