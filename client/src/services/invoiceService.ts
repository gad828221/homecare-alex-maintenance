export const invoiceService = {
  sendInvoiceViaWhatsApp: (invoice: any): void => {
    // رابط صفحة الفاتورة (حيث يمكن العميل تحميل PDF أو صورة)
    const invoiceLink = `${window.location.origin}/invoice?id=${invoice.id}`;
    
    // رسالة قصيرة تحتوي على الرابط
    const message = `🛡️ *بطاقة الضمان الرقمية - Maintenance Guide* 🛡️\n\n` +
      `👤 *العميل:* ${invoice.customerName}\n` +
      `🔢 *رقم الأوردر:* ${invoice.orderNumber}\n` +
      `🔧 *الجهاز:* ${invoice.device}\n` +
      `💰 *المبلغ:* ${invoice.totalAmount} ج.م\n` +
      `📅 *تاريخ الفاتورة:* ${invoice.date}\n` +
      `🛡️ *فترة الضمان:* ${invoice.warranty}\n\n` +
      `📎 *رابط الضمان والفاتورة الإلكترونية:* \n` +
      `${invoiceLink}\n\n` +
      `✨ *شكراً لثقتك بنا. نحن دائماً في خدمتك.* ✨`;

    // تنسيق رقم الهاتف
    const phone = invoice.phone.toString().replace(/[^\d]/g, '');
    let formattedPhone = phone;
    if (formattedPhone.startsWith('0')) formattedPhone = formattedPhone.substring(1);
    if (formattedPhone.length === 10) formattedPhone = '20' + formattedPhone;
    
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }
};
