export interface Invoice {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  device: string;
  brand: string;
  problem: string;
  totalAmount: number;
  warranty: string;
  date: string;
  address?: string;
  partsUsed?: string;
  technicianName?: string;
  companyShare?: number;
  technicianShare?: number;
}

export const invoiceService = {
  generateInvoiceText: (invoice: Invoice): string => {
    return `
╔════════════════════════════════════════════════════════════╗
║                   فاتورة الصيانة والضمان                    ║
║              Maintenance Guide - دليل الصيانة              ║
║                  خدمة صيانة 24 ساعة بالمنزل                 ║
╚════════════════════════════════════════════════════════════╝

📋 بيانات الفاتورة:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
رقم الفاتورة: ${invoice.orderNumber}
التاريخ: ${invoice.date}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 بيانات العميل:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
الاسم: ${invoice.customerName}
الهاتف: ${invoice.phone}
العنوان: ${invoice.address || 'غير محدد'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 تفاصيل الخدمة:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
الجهاز: ${invoice.device}
الماركة: ${invoice.brand}
المشكلة: ${invoice.problem}
${invoice.partsUsed ? `قطع الغيار المستخدمة: ${invoice.partsUsed}` : ''}
${invoice.technicianName ? `الفني: ${invoice.technicianName}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 التفاصيل المالية:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
المبلغ الإجمالي: ${invoice.totalAmount} ج.م
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛡️ الضمان:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${invoice.warranty}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 بيانات التواصل:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
الهاتف: 01278885772
الواتس: 01558625259
المدينة: الإسكندرية
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ شكراً لتعاملك معنا! 🙏
نتمنى لك الاستفادة القصوى من خدماتنا
    `.trim();
  },

  generateInvoiceHTML: (invoice: Invoice): string => {
    // ... (HTML الجميل الذي أرسلته سابقاً، يمكنك الاحتفاظ به)
    return `<div>...</div>`;
  },

  sendInvoiceViaWhatsApp: (invoice: Invoice): void => {
    const message = invoiceService.generateInvoiceText(invoice);
    const phone = invoice.phone.toString().replace(/[^\d]/g, '');
    let formattedPhone = phone;
    if (formattedPhone.startsWith('0')) formattedPhone = formattedPhone.substring(1);
    if (formattedPhone.length === 10) formattedPhone = '20' + formattedPhone;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }
};
