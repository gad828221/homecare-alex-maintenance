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
}

export const invoiceService = {
  generateInvoiceText: (invoice: Invoice): string => {
    return `
╔════════════════════════════════════════╗
║         فاتورة الخدمة                   ║
║    Maintenance Guide - دليل الصيانة    ║
╚════════════════════════════════════════╝

📋 بيانات الفاتورة:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
رقم الفاتورة: ${invoice.orderNumber}
التاريخ: ${invoice.date}
العميل: ${invoice.customerName}

🔧 تفاصيل الخدمة:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
الجهاز: ${invoice.device}
الماركة: ${invoice.brand}
المشكلة: ${invoice.problem}

💰 المبلغ المستحق:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${invoice.totalAmount} ج.م

🛡️ الضمان:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${invoice.warranty}

شكراً لتعاملك معنا! 🙏
للاستفسارات: تواصل معنا عبر الواتس
    `.trim();
  },

  generateInvoiceHTML: (invoice: Invoice): string => {
    return `
    <div style="font-family: Arial, sans-serif; direction: rtl; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; border-bottom: 3px solid #ff6b35; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="margin: 0; color: #333; font-size: 28px;">فاتورة الخدمة</h1>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Maintenance Guide - دليل الصيانة</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #ff6b35; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">📋 بيانات الفاتورة</h3>
          <table style="width: 100%; font-size: 14px;">
            <tr><td style="padding: 8px; color: #666;">رقم الفاتورة:</td><td style="padding: 8px; font-weight: bold;">${invoice.orderNumber}</td></tr>
            <tr><td style="padding: 8px; color: #666;">التاريخ:</td><td style="padding: 8px; font-weight: bold;">${invoice.date}</td></tr>
            <tr><td style="padding: 8px; color: #666;">العميل:</td><td style="padding: 8px; font-weight: bold;">${invoice.customerName}</td></tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #ff6b35; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">🔧 تفاصيل الخدمة</h3>
          <table style="width: 100%; font-size: 14px;">
            <tr><td style="padding: 8px; color: #666;">الجهاز:</td><td style="padding: 8px; font-weight: bold;">${invoice.device}</td></tr>
            <tr><td style="padding: 8px; color: #666;">الماركة:</td><td style="padding: 8px; font-weight: bold;">${invoice.brand}</td></tr>
            <tr><td style="padding: 8px; color: #666;">المشكلة:</td><td style="padding: 8px; font-weight: bold;">${invoice.problem}</td></tr>
          </table>
        </div>

        <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #2e7d32; font-size: 18px;">💰 المبلغ المستحق</h3>
          <p style="margin: 0; color: #2e7d32; font-weight: bold; font-size: 24px;">${invoice.totalAmount} ج.م</p>
        </div>

        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #856404;">🛡️ الضمان</h3>
          <p style="margin: 0; color: #856404; font-weight: bold;">${invoice.warranty}</p>
        </div>

        <div style="text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px;">
          <p style="margin: 0;">شكراً لتعاملك معنا! 🙏</p>
          <p style="margin: 5px 0 0 0;">للاستفسارات: تواصل معنا عبر الواتس</p>
        </div>
      </div>
    </div>
    `;
  }
};
