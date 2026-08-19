# تشخيص إشعارات Chrome — 2026-08-19

## النتائج المؤكدة

1. المشروع يسجل `client/public/sw.js` بنطاق `/` من `client/src/main.tsx`.
2. المشروع يهيئ OneSignal أيضاً مع `serviceWorkerPath: "/OneSignalSDKWorker.js"`، ويستخدم ملفاً آخر في الجذر. هذا يعني وجود ملفي Service Worker متنافسين على نفس نطاق `/`.
3. وثائق OneSignal الحديثة توصي عند وجود PWA بوضع عامل OneSignal في مجلد فرعي مستقل، وتعيين `serviceWorkerPath` و`serviceWorkerParam.scope` إلى ذلك المجلد. كما تؤكد أن ملفي Service Worker منفصلين على نفس النطاق قد يتعارضان، وأنه لا يعمل إلا عامل واحد لكل نطاق.
4. النسخة المنشورة على `https://www.maintenanceguide.life/OneSignalSDKWorker.js` و`/sw.js` تعيد 200 و`Content-Type: application/javascript`. النطاق غير www كان متعثراً مؤقتاً في فحص الشبكة، لذلك يجب اعتماد أصل واحد ثابت.
5. خصائص `priority`, `android_visibility`, `android_sound`, `vibrate`, و`renotify` ليست حلاً موثوقاً لإجبار صوت إشعار Web Push في Chrome؛ الصوت ودرجة الأهمية على Android تُداران من قناة الإشعار وإعدادات المتصفح/الجهاز. خصائص Android channel مثل `android_channel_id` تخص تطبيقات Android الأصلية، وليست آلية تحكم مباشرة في Web Push الخاص بـChrome.
6. OneSignal يذكر أن قناة Android تُقفل إعداداتها بعد إنشائها على الجهاز، وتغيير الأهمية أو الصوت لا يطبق بأثر رجعي؛ يلزم إنشاء قناة جديدة أو مسح بيانات/إعادة الاشتراك أثناء الاختبار.

## الاستنتاج التشغيلي

المشكلة البرمجية الأوضح هي تسجيل `sw.js` و`OneSignalSDKWorker.js` بنفس النطاق `/`. الإصلاح الآمن هو دمج سطر OneSignal داخل عامل الـPWA الوحيد `sw.js`، وتوجيه تهيئة OneSignal إلى `sw.js` نفسه، ثم إزالة التسجيل المنفصل لعامل OneSignal من النطاق الجذري. بعد ذلك يلزم إعادة الاشتراك/مسح بيانات الموقع في Chrome لأن التسجيل القديم قد يظل مخزناً.

## المراجع

[1]: https://documentation.onesignal.com/docs/en/onesignal-service-worker — OneSignal service worker
[2]: https://documentation.onesignal.com/docs/en/notifications-not-shown-web-push — Web push: Notifications not shown
[3]: https://documentation.onesignal.com/docs/en/android-notification-categories — Android notification categories
[4]: https://documentation.onesignal.com/reference/create-message — Sending messages with the OneSignal API
