export type DiagnosticStatus = 'ok' | 'warning' | 'error';

export type NotificationDiagnostic = {
  key: string;
  label: string;
  status: DiagnosticStatus;
  detail: string;
};

type StoredUser = {
  id?: string | number;
  username?: string;
  role?: string;
  techName?: string;
};

const getStoredUser = (): StoredUser | null => {
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

const withTimeout = async <T>(promise: Promise<T>, timeoutMs = 5000): Promise<T> => {
  let timer: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error('timeout')), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) window.clearTimeout(timer);
  }
};

const runWithOneSignal = (callback: (OneSignal: any) => void | Promise<void>, timeoutMs = 15000) => {
  if (typeof window === 'undefined') return Promise.resolve();
  const win = window as any;
  win.OneSignalDeferred = win.OneSignalDeferred || [];
  
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('محرك الإشعارات (OneSignal) معلق تماماً في المتصفح (Timeout)'));
    }, timeoutMs);

    win.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        if (!OneSignal) throw new Error('فشل تحميل كائن OneSignal');
        await callback(OneSignal);
        clearTimeout(timer);
        resolve();
      } catch (e) {
        clearTimeout(timer);
        reject(e);
      }
    });
  });
};

const browserLabel = () => {
  const ua = navigator.userAgent || '';
  if (/FBAN|FBAV|WhatsApp|Instagram|Line|Messenger/i.test(ua)) return 'متصفح داخل تطبيق آخر';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Edg/i.test(ua)) return 'Edge';
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua)) return 'Safari';
  return 'متصفح غير معروف';
};

export const diagnoseNotifications = async (): Promise<NotificationDiagnostic[]> => {
  const checks: NotificationDiagnostic[] = [];
  const secure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  const inAppBrowser = /FBAN|FBAV|WhatsApp|Instagram|Line|Messenger/i.test(navigator.userAgent || '');
  const hasNotification = 'Notification' in window;
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasPush = 'PushManager' in window;

  checks.push({
    key: 'browser',
    label: 'المتصفح والاتصال الآمن',
    status: secure && !inAppBrowser ? 'ok' : 'error',
    detail: !secure
      ? 'يجب فتح الموقع من رابط HTTPS.'
      : inAppBrowser
        ? `تم اكتشاف ${browserLabel()}. افتح الرابط في Chrome أو Firefox مباشرة.`
        : `${browserLabel()} يعمل من اتصال آمن.`
  });

  checks.push({
    key: 'support',
    label: 'دعم إشعارات Push',
    status: hasNotification && hasServiceWorker && hasPush ? 'ok' : 'error',
    detail: hasNotification && hasServiceWorker && hasPush
      ? 'المتصفح يدعم الإشعارات والعمل في الخلفية.'
      : 'هذا المتصفح لا يدعم كل مكونات الإشعارات المطلوبة.'
  });

  const permission = hasNotification ? Notification.permission : 'unsupported';
  checks.push({
    key: 'permission',
    label: 'إذن الإشعارات',
    status: permission === 'granted' ? 'ok' : permission === 'default' ? 'warning' : 'error',
    detail: permission === 'granted'
      ? 'الإذن مسموح.'
      : permission === 'default'
        ? 'لم يتم اختيار السماح بعد. اضغط إصلاح وتفعيل.'
        : 'الإشعارات محظورة من إعدادات المتصفح أو الهاتف.'
  });

  let registration: ServiceWorkerRegistration | null = null;
  if (hasServiceWorker) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const unifiedWorker = registrations.find(r => r.active?.scriptURL.includes('sw.js'));
      const active = Boolean(unifiedWorker && unifiedWorker.active);
      
      checks.push({
        key: 'service-worker',
        label: 'محرك التطبيق في الخلفية',
        status: active ? 'ok' : 'warning',
        detail: active ? 'يعمل بشكل سليم (sw.js).' : 'المحرك الموحد غير نشط حالياً. اضغط "إصلاح وتفعيل".'
      });

      const subscription = await withTimeout(registration.pushManager.getSubscription());
      checks.push({
        key: 'push-subscription',
        label: 'اشتراك الجهاز',
        status: subscription ? 'ok' : 'warning',
        detail: subscription ? 'الجهاز مشترك في Push.' : 'لا يوجد اشتراك Push لهذا المتصفح.'
      });
    } catch {
      checks.push({
        key: 'service-worker',
        label: 'محرك التطبيق في الخلفية',
        status: 'error',
        detail: 'لم يتم العثور على Service Worker نشط. افتح الموقع من Chrome أو Firefox ثم حدّث الصفحة.'
      });
    }
  }

  const user = getStoredUser();
  const externalId = getExternalId(user);
  checks.push({
    key: 'identity',
    label: 'هوية الموظف',
    status: externalId ? 'ok' : 'error',
    detail: externalId ? `تم التعرف على الحساب: ${externalId}` : 'لم يتم العثور على حساب موظف محفوظ في هذا المتصفح.'
  });

  let oneSignalInitialized = false;
  let oneSignalOptedIn = false;
  let oneSignalSubscriptionId = '';
  await runWithOneSignal(async (OneSignal) => {
    oneSignalInitialized = Boolean(OneSignal);
    oneSignalOptedIn = Boolean(OneSignal?.User?.PushSubscription?.optedIn || OneSignal?.Notifications?.permission === true);
    oneSignalSubscriptionId = String(OneSignal?.User?.PushSubscription?.id || '');
    if (externalId && OneSignal?.login) {
      await OneSignal.login(externalId).catch(() => undefined);
    }
  });

  let oneSignalUserId = '';
  await runWithOneSignal((OneSignal) => {
    oneSignalUserId = OneSignal?.User?.onesignalId || '';
  });

  checks.push({
    key: 'onesignal',
    label: 'ربط OneSignal',
    status: !oneSignalInitialized ? 'error' : oneSignalOptedIn ? 'ok' : 'warning',
    detail: !oneSignalInitialized
      ? 'لم يتم تحميل محرك الإشعارات بعد. حدّث الصفحة بعد ثوانٍ.'
      : oneSignalOptedIn
        ? `الاشتراك فعال.
           - OneSignal ID: ${oneSignalUserId || 'غير متوفر'}
           - Subscription ID: ${oneSignalSubscriptionId || 'غير متوفر'}`
        : `OneSignal يعمل لكن الجهاز غير مشترك حالياً.
           - OneSignal ID: ${oneSignalUserId || 'غير متوفر'}`
  });

  return checks;
};

export const repairNotifications = async (): Promise<string> => {
  const user = getStoredUser();
  const externalId = getExternalId(user);
  let result = 'تم البدء في الإصلاح القسري...';

  // 1. تنظيف شامل وإعادة تسجيل المحرك الموحد
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
      // تسجيل المحرك الموحد sw.js
      const newReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await newReg.update();
      // انتظار بسيط لتفعيل المحرك
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.error('SW Repair Error:', e);
    }
  }

  // 2. إصلاح OneSignal قسرياً مع حماية ضد خطأ Qe
  await runWithOneSignal(async (OneSignal) => {
    try {
      // انتظار بسيط للتأكد من استقرار المحرك
      await new Promise(r => setTimeout(r, 800));

      // التحقق من وجود الكائنات الأساسية قبل لمسها
      if (!OneSignal || !OneSignal.Notifications) {
        throw new Error('محرك الإشعارات لم يكتمل تحميله بعد.');
      }

      // إجبار الدخول بالهوية (آمن)
      if (externalId && typeof OneSignal.login === 'function') {
        await OneSignal.login(externalId).catch(() => undefined);
      }

      // محاولة إعادة الاشتراك القسري بطريقة v16 الرسمية والآمنة
      const permission = Notification.permission;
      
      if (permission === 'granted') {
        try {
          // بدلاً من الوصول المباشر لـ User.PushSubscription الذي يسبب خطأ Qe
          // سنستخدم دوال الطبقة العليا الأكثر استقراراً
          
          if (OneSignal.Notifications.requestPermission) {
            await OneSignal.Notifications.requestPermission();
          }

          // محاولة تحديث الوسوم (Tags) بشكل مستقل
          if (user && OneSignal.User && typeof OneSignal.User.addTags === 'function') {
            const stableId = user.id ?? user.username ?? user.techName;
            await OneSignal.User.addTags({ 
              role: user.role || localStorage.getItem('userRole') || 'user', 
              user_id: String(stableId || ''),
              ...(user.techName ? { tech_name: user.techName } : {})
            }).catch(() => undefined);
          }

          result = 'تم تنشيط نظام التنبيهات وتحديث الهوية بنجاح ✅';
        } catch (subErr: any) {
          console.error('OneSignal v16 Stable Repair Error:', subErr);
          result = `⚠️ تنبيه: المتصفح يرفض الربط التلقائي (${subErr.message || 'Error'}). يرجى استخدام "المسح الشامل" بالأسفل.`;
        }
      } else if (permission === 'default') {
        if (OneSignal.Slidedown && typeof OneSignal.Slidedown.promptPush === 'function') {
          await OneSignal.Slidedown.promptPush().catch(() => undefined);
        }
        result = 'يرجى الموافقة على نافذة "السماح" التي ستظهر الآن.';
      } else {
        result = '❌ الإشعارات محظورة من إعدادات الهاتف. يجب السماح بها يدوياً من إعدادات الموقع.';
      }
    } catch (err: any) {
      console.error('OneSignal Repair Error:', err);
      result = `❌ فشل الإصلاح: ${err.message || 'خطأ في النظام'}. حاول استخدام "المسح الشامل".`;
    }
  });

  return result;
};

export const hardResetNotifications = async (): Promise<void> => {
  // 1. مسح كافة بيانات التخزين المرتبطة بـ OneSignal و Push
  if (typeof window !== 'undefined') {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.toLowerCase().includes('onesignal') || key?.toLowerCase().includes('push')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    // مسح الـ IndexedDB (مهم جداً لـ OneSignal v16)
    try {
      if (window.indexedDB.deleteDatabase) {
        window.indexedDB.deleteDatabase('OneSignalSDK');
      }
    } catch (e) { console.error('DB Clear Error:', e); }
  }

  // 2. إلغاء تسجيل كافة الـ Service Workers فوراً
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    } catch (e) { console.error('SW Unregister Error:', e); }
  }

  // 3. مسح الكاش بالكامل
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    } catch (e) { console.error('Cache Clear Error:', e); }
  }

  // 4. إعادة تحميل الصفحة من الخادم (بدون كاش)
  const url = new URL(window.location.href);
  url.searchParams.set('reset', Date.now().toString());
  window.location.href = url.toString();
};

export const diagnosticsSummary = (checks: NotificationDiagnostic[]) => {
  const errors = checks.filter(check => check.status === 'error').length;
  const warnings = checks.filter(check => check.status === 'warning').length;
  if (errors > 0) return `يوجد ${errors} خلل يحتاج إلى إصلاح.`;
  if (warnings > 0) return `النظام قريب من العمل، لكن يوجد ${warnings} تنبيه يحتاج إلى مراجعة.`;
  return 'كل مكونات الإشعارات تعمل بشكل صحيح.';
};

export const hasDiagnosticProblems = (checks: NotificationDiagnostic[]) => checks.some(check => check.status !== 'ok');

export const getStoredExternalId = () => getExternalId(getStoredUser());

export const getDiagnosticStatusIcon = (status: DiagnosticStatus) => status === 'ok' ? '✅' : status === 'warning' ? '⚠️' : '❌';

export const getDiagnosticStatusClass = (status: DiagnosticStatus) => status === 'ok'
  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
  : status === 'warning'
    ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
    : 'border-red-500/30 bg-red-500/10 text-red-200';

export const getDiagnosticStatusLabel = (status: DiagnosticStatus) => status === 'ok' ? 'سليم' : status === 'warning' ? 'يحتاج مراجعة' : 'مغلق أو به خطأ';

export const getNotificationSettingsHint = () => 'من إعدادات الهاتف: التطبيقات > Chrome أو Firefox > الإشعارات > فعّل السماح والصوت، ثم أعد الفحص.';

export const getNotificationSupportHint = () => 'استخدم Chrome أو Firefox مباشرة، وليس متصفح واتساب أو فيسبوك الداخلي.';

export const getServiceWorkerHint = () => 'أغلق الصفحة وافتح الرابط من جديد، ثم اضغط فحص الحالة مرة أخرى.';

export const getPermissionHint = () => 'اضغط إصلاح وتفعيل. إذا كان الإذن محظوراً، افتح إعدادات الموقع واختر السماح بالإشعارات.';

export const getSubscriptionHint = () => 'اضغط إصلاح وتفعيل ثم وافق على نافذة الإشعارات.';

export const getIdentityHint = () => 'سجّل الدخول بالحساب الصحيح من نفس المتصفح ثم أعد الفحص.';

export const getDiagnosticHint = (key: string) => ({
  browser: getNotificationSupportHint(),
  support: getNotificationSupportHint(),
  permission: getPermissionHint(),
  'service-worker': getServiceWorkerHint(),
  'push-subscription': getSubscriptionHint(),
  onesignal: getSubscriptionHint(),
  identity: getIdentityHint(),
}[key] || 'اضغط إصلاح وتفعيل ثم أعد الفحص.');

export const unusedRegistrationTypeGuard = (registration: ServiceWorkerRegistration | null) => Boolean(registration);
