# تشخيص إشعارات Chrome — 2026-08-20

## الأدلة من OneSignal
- توثيق Service Worker الرسمي: https://documentation.onesignal.com/docs/en/onesignal-service-worker
- توثيق Custom Code: https://documentation.onesignal.com/docs/en/web-push-custom-code-setup
- توثيق SDK Reference: https://documentation.onesignal.com/docs/en/web-sdk-reference
- توثيق Troubleshooting: https://documentation.onesignal.com/docs/en/troubleshooting-web-push
- OneSignal يطلب ملفاً عاماً باسم `OneSignalSDKWorker.js` يحتوي على:
  `importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");`
- عند وجود Service Worker آخر، يمكن الفصل بينهما بمسارين مختلفين أو دمجهما. إعدادات `serviceWorkerPath` و`serviceWorkerParam.scope` يجب أن تطابق الملف المنشور.
- في إجابة OneSignal الرسمية على GitHub Issue #1172: ملف `OneSignalSDKUpdaterWorker.js` قديم وغير مستخدم منذ 2021، لكن يُنصح بتركه بنفس importScripts الخاص بـ v16 لتغطية المشتركين القدامى. المصدر: https://github.com/OneSignal/OneSignal-Website-SDK/issues/1172

## فحص النسخة المنشورة فعلياً
- `https://maintenanceguide.life/sw.js` كان يعرض Service Worker مخصصاً يجمع OneSignal مع PWA caching.
- `https://maintenanceguide.life/OneSignalSDKWorker.js` كان يعرض صفحة تسجيل الدخول HTML بدلاً من JavaScript؛ هذا دليل مباشر على أن OneSignal/Chrome كان يجد fallback للـ SPA وليس Service Worker صالحاً.
- `staff-manifest.webmanifest` يبدأ من `/login?source=pwa&portal=staff`، والصفحة العامة من `/`.
- `client/index.html` كان يهيئ OneSignal على `sw.js`، بينما الموقع المنشور كان يفتقد الملف الرسمي الجذري `OneSignalSDKWorker.js`.
- `client/src/main.tsx` كان يسجل `/sw.js` يدوياً على scope `/` بالتوازي مع OneSignal، ما يزيد احتمال التنافس على نفس scope.
- `client/src/App.tsx` كان يحتوي على Origin canonical قديم لـ `https://www.maintenanceguide.life`، بينما الاستخدام الفعلي والصور كان على `https://maintenanceguide.life`. التحويل القسري إلى www كان معلقاً، لكن API deep links كانت لا تزال تستخدم www.

## الإصلاح الجاري
- إنشاء `client/public/OneSignalSDKWorker.js` بالـ importScripts الرسمي.
- إنشاء `client/public/OneSignalSDKUpdaterWorker.js` بنفس importScripts لتغطية المشتركين القدامى.
- توجيه index.html إلى OneSignalSDKWorker.js مع defer وorigin click navigation.
- قصر تهيئة OneSignal على مسارات الموظفين، وإزالة التسجيل اليدوي المتنافس في main.tsx.
- توحيد deep links وCORS إلى `https://maintenanceguide.life` مع إبقاء www مسموحاً للتوافق القديم.

## التحقق النهائي بعد النشر
- رؤوس HTTP على `https://maintenanceguide.life/OneSignalSDKWorker.js` تعيد 307 إلى `https://www.maintenanceguide.life/OneSignalSDKWorker.js` ثم 200.
- النطاق www يعيد `Content-Type: application/javascript; charset=utf-8` و`Service-Worker-Allowed: /`، والجسم هو importScripts الرسمي v16، وليس HTML.
- ملف Updater منشور كذلك بنفس محتوى OneSignal الرسمي.
- الموقع يعمل على Vercel فعلياً، وليس Netlify؛ لذلك كان فحص Netlify مضللاً. النشر الحالي من Vercel أصبح يحتوي الملفين الصحيحين.
