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
    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; max-width: 800px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh;">
      <div style="background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); border-top: 5px solid #ff6b35;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #ff6b35;">
          <h1 style="margin: 0; color: #ff6b35; font-size: 32px; font-weight: bold;">🔧 Maintenance Guide</h1>
          <p style="margin: 5px 0; color: #333; font-size: 16px; font-weight: 600;">دليل الصيانة - خدمة صيانة 24 ساعة بالمنزل</p>
          <p style="margin: 5px 0; color: #666; font-size: 13px;">فاتورة صيانة وضمان الأجهزة المنزلية</p>
        </div>

        <!-- Invoice Title -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="margin: 0; color: #333; font-size: 28px; font-weight: bold;">📄 فاتورة الصيانة والضمان</h2>
        </div>

        <!-- Invoice Info -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div style="background: linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%); padding: 15px; border-radius: 10px; color: white; text-align: center;">
            <p style="margin: 0; font-size: 12px; opacity: 0.9;">رقم الفاتورة</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold;">${invoice.orderNumber}</p>
          </div>
          <div style="background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%); padding: 15px; border-radius: 10px; color: white; text-align: center;">
            <p style="margin: 0; font-size: 12px; opacity: 0.9;">التاريخ</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold;">${invoice.date}</p>
          </div>
        </div>

        <!-- Customer Info -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-right: 4px solid #ff6b35;">
          <h3 style="margin: 0 0 15px 0; color: #ff6b35; font-size: 16px; font-weight: bold;">👤 بيانات العميل</h3>
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="padding: 8px; color: #666; font-weight: 500; width: 30%;">الاسم:</td>
              <td style="padding: 8px; font-weight: bold; color: #333;">${invoice.customerName}</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 8px; color: #666; font-weight: 500;">الهاتف:</td>
              <td style="padding: 8px; font-weight: bold; color: #333;">${invoice.phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #666; font-weight: 500;">العنوان:</td>
              <td style="padding: 8px; font-weight: bold; color: #333;">${invoice.address || 'غير محدد'}</td>
            </tr>
          </table>
        </div>

        <!-- Service Details -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-right: 4px solid #4a90e2;">
          <h3 style="margin: 0 0 15px 0; color: #4a90e2; font-size: 16px; font-weight: bold;">🔧 تفاصيل الخدمة</h3>
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="padding: 8px; color: #666; font-weight: 500; width: 30%;">الجهاز:</td>
              <td style="padding: 8px; font-weight: bold; color: #333;">${invoice.device}</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 8px; color: #666; font-weight: 500;">الماركة:</td>
              <td style="padding: 8px; font-weight: bold; color: #333;">${invoice.brand}</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #666; font-weight: 500;">المشكلة:</td>
              <td style="padding: 8px; font-weight: bold; color: #333;">${invoice.problem}</td>
            </tr>
            ${invoice.partsUsed ? `
            <tr style="background: white;">
              <td style="padding: 8px; color: #666; font-weight: 500;">قطع الغيار:</td>
              <td style="padding: 8px; font-weight: bold; color: #333;">${invoice.partsUsed}</td>
            </tr>
            ` : ''}
            ${invoice.technicianName ? `
            <tr>
              <td style="padding: 8px; color: #666; font-weight: 500;">الفني:</td>
              <td style="padding: 8px; font-weight: bold; color: #333;">${invoice.technicianName}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <!-- Amount -->
        <div style="background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); padding: 25px; border-radius: 10px; margin-bottom: 20px; text-align: center; color: white;">
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">💰 المبلغ الإجمالي</p>
          <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: bold;">${invoice.totalAmount} ج.م</p>
        </div>

        <!-- Warranty -->
        <div style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); padding: 20px; border-radius: 10px; margin-bottom: 20px; color: white;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">🛡️ الضمان</h3>
          <p style="margin: 0; font-size: 15px; font-weight: 600;">${invoice.warranty}</p>
        </div>

        <!-- Contact Info -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center; border-top: 3px solid #ff6b35;">
          <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px; font-weight: bold;">📞 للاستفسار والدعم</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 13px;">
            <div>
              <p style="margin: 0; color: #666;">☎️ الهاتف</p>
              <p style="margin: 5px 0 0 0; font-weight: bold; color: #ff6b35;">01278885772</p>
            </div>
            <div>
              <p style="margin: 0; color: #666;">📱 الواتس</p>
              <p style="margin: 5px 0 0 0; font-weight: bold; color: #25d366;">01558625259</p>
            </div>
            <div>
              <p style="margin: 0; color: #666;">📍 المدينة</p>
              <p style="margin: 5px 0 0 0; font-weight: bold; color: #333;">الإسكندرية</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding-top: 20px; border-top: 2px solid #eee;">
          <p style="margin: 0; color: #666; font-size: 14px;">✨ شكراً لتعاملك معنا! 🙏</p>
          <p style="margin: 8px 0 0 0; color: #999; font-size: 12px;">نتمنى لك الاستفادة القصوى من خدماتنا</p>
          <p style="margin: 8px 0 0 0; color: #999; font-size: 11px;">جميع الحقوق محفوظة © Maintenance Guide 2026</p>
        </div>
      </div>
    </div>
    `;
  },

  sendInvoiceViaWhatsApp: (invoice: Invoice): void => {
    const message = `📄 *فاتورة الصيانة والضمان* 📄\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ شكراً لثقتك بنا - Maintenance Guide\n\n` +
      `🔢 *رقم الفاتورة:* ${invoice.orderNumber}\n` +
      `📅 *التاريخ:* ${invoice.date}\n\n` +
      `👤 *بيانات العميل:*\n` +
      `  • الاسم: ${invoice.customerName}\n` +
      `  • الهاتف: ${invoice.phone}\n` +
      `  • العنوان: ${invoice.address || 'غير محدد'}\n\n` +
      `🔧 *تفاصيل الخدمة:*\n` +
      `  • الجهاز: ${invoice.device} - ${invoice.brand}\n` +
      `  • المشكلة: ${invoice.problem}\n` +
      `${invoice.partsUsed ? `  • قطع الغيار: ${invoice.partsUsed}\n` : ''}` +
      `${invoice.technicianName ? `  • الفني: ${invoice.technicianName}\n` : ''}` +
      `\n💰 *المبلغ والضمان:*\n` +
      `  • المبلغ الإجمالي: ${invoice.totalAmount} ج.م\n` +
      `  • الضمان: 🛡️ ${invoice.warranty}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📞 *للاستفسار والدعم الفني:*\n` +
      `  📱 01278885772\n` +
      `  📲 01558625259\n\n` +
      `✨ شكراً لثقتك بنا - خدمة صيانة 24 ساعة بالمنزل`;

    const phone = invoice.phone.toString().replace(/[^\d]/g, '');
    let formattedPhone = phone;
    if (formattedPhone.startsWith('0')) formattedPhone = formattedPhone.substring(1);
    if (formattedPhone.length === 10) formattedPhone = '20' + formattedPhone;

    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }
};
