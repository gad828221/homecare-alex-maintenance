export const invoiceService = {
  sendInvoiceViaWhatsApp: (invoice: any): void => {
    // رابط صفحة الفاتورة (حيث يمكن العميل تحميل PDF أو صورة)
    const invoiceLink = `${window.location.origin}/invoice?id=${invoice.id}`;
    
    // رسالة قصيرة تحتوي على الرابط
    const message = `📄 *فاتورة الصيانة والضمان* 📄\n\n` +
      `👤 العميل: ${invoice.customerName}\n` +
      `🔢 رقم الفاتورة: ${invoice.orderNumber}\n` +
      `💰 المبلغ: ${invoice.totalAmount} ج.م\n` +
      `🛡️ الضمان: ${invoice.warranty}\n\n` +
      `📎 لعرض الفاتورة وتحميلها كـ PDF أو صورة، اضغط على الرابط:\n` +
      `${invoiceLink}\n\n` +
      `📞 للاستفسار: 01278885772`;

    // تنسيق رقم الهاتف
    const phone = invoice.phone.toString().replace(/[^\d]/g, '');
    let formattedPhone = phone;
    if (formattedPhone.startsWith('0')) formattedPhone = formattedPhone.substring(1);
    if (formattedPhone.length === 10) formattedPhone = '20' + formattedPhone;
    
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }
};
