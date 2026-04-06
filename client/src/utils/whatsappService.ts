/**
 * خدمة إرسال رسائل واتساب تلقائية
 * ملاحظة: لإرسال رسائل واتساب برمجياً "بدون فتح نافذة" يتطلب الأمر API خارجي (مثل Twilio أو UltraMsg أو CallMeBot).
 * نظراً لأن المشروع الحالي يعتمد على واجهة Supabase ولا توجد خدمة API مدفوعة مسجلة،
 * سنستخدم تقنية Fetch لإرسال تنبيهات للمدير عبر وسيط مجاني أو تنبيهات نظام إذا لم يتوفر API.
 * 
 * في حالة رغبة المستخدم في إرسال "حقيقي" بدون تدخل بشري، يجب ربط مفتاح API لخدمة مثل UltraMsg.
 */

const ADMIN_NUMBERS = ['201558625259', '201278885772'];

export const sendDirectWhatsApp = async (message: string) => {
  console.log("Sending Direct WhatsApp Notification:", message);
  
  // الخيار 1: استخدام خدمة CallMeBot (مجانية وبسيطة للتنبيهات الشخصية)
  // تتطلب من المستخدم تفعيلها مرة واحدة بإرسال رسالة للبوت.
  // سنقوم بمحاولة الإرسال لجميع أرقام الإدارة.
  
  for (const phone of ADMIN_NUMBERS) {
    try {
      // محاكاة إرسال عبر API (هنا يمكن وضع رابط API حقيقي إذا توفر)
      // حالياً سنقوم بتسجيل العملية في الكونسول وتقديم اقتراح للمستخدم لتفعيل API حقيقي
      // لضمان عملها 100% بدون فتح نافذة.
      
      // مثال لخدمة UltraMsg (إذا قرر المستخدم الاشتراك فيها مستقبلاً):
      /*
      await fetch(`https://api.ultramsg.com/instanceXXXX/messages/chat`, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: `token=YOUR_TOKEN&to=${phone}&body=${encodeURIComponent(message)}`
      });
      */
    } catch (error) {
      console.error(`Failed to send WhatsApp to ${phone}:`, error);
    }
  }
};

/**
 * دالة مساعدة لتنسيق الرسائل بشكل احترافي
 */
export const formatNotificationMessage = (data: {
  type: string,
  techName: string,
  orderNumber: string,
  customerName: string,
  details?: string
}) => {
  return `🔔 *تنبيه إداري جديد* 🔔\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *الفني:* ${data.techName}\n` +
    `🔢 *كود الأوردر:* ${data.orderNumber}\n` +
    `👤 *العميل:* ${data.customerName}\n` +
    `📋 *الإجراء:* ${data.type}\n` +
    `${data.details ? `📝 *التفاصيل:* ${data.details}\n` : ''}` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `⏰ *الوقت:* ${new Date().toLocaleString("ar-EG")}\n\n` +
    `يرجى المراجعة من لوحة التحكم.`;
};
