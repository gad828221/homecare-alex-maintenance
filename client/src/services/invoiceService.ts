import { openWhatsAppDirectly } from '../utils/whatsapp';

export const invoiceService = {
  sendInvoiceViaWhatsApp: (invoice: any): void => {
    // رابط صفحة الفاتورة (حيث يمكن العميل تحميل PDF أو صورة)
    const invoiceLink = `${window.location.origin}/invoice?id=${invoice.id}`;
    
    // رسالة قصيرة تحتوي على الرابط
    const message = `🛡️ *بطاقة الضمان والفاتورة الرقمية* 🛡️\n━━━━━━━━━━━━━━━━━━━━━━\n👤 *العميل:* ${invoice.customerName}\n🔢 *رقم الطلب:* ${invoice.orderNumber}\n🔧 *الجهاز:* ${invoice.device}\n💵 *إجمالي المبلغ:* ${invoice.totalAmount.toLocaleString()} ج.م\n📅 *تاريخ الخدمة:* ${invoice.date}\n🛡️ *فترة الضمان:* ${invoice.warranty}\n\n📎 *رابط الضمان والفاتورة الإلكترونية:* \n${invoiceLink}\n━━━━━━━━━━━━━━━━━━━━━━\n✨ *HomeCare Maintenance - جودة نثق بها* ✨`;

    // تنسيق رقم الهاتف
    const phone = invoice.phone.toString().replace(/[^\d]/g, '');
    let formattedPhone = phone;
    if (formattedPhone.startsWith('0')) formattedPhone = formattedPhone.substring(1);
    if (formattedPhone.length === 10) formattedPhone = '20' + formattedPhone;
    
    openWhatsAppDirectly(formattedPhone, message);
  }
};
