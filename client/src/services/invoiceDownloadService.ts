import jsPDF from 'jspdf';

export const invoiceDownloadService = {
  // PDF مباشر من البيانات (بدون html2canvas)
  downloadAsPDF: async (invoice: any, orderNumber: string) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // العنوان
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("فاتورة الصيانة والضمان", pageWidth / 2, y, { align: "center" });
      y += 12;

      doc.setFontSize(10);
      doc.text(`رقم الفاتورة: ${orderNumber}`, 10, y);
      doc.text(`التاريخ: ${new Date().toLocaleDateString('ar-EG')}`, pageWidth - 50, y);
      y += 10;
      doc.line(10, y, pageWidth - 10, y);
      y += 10;

      // العميل
      doc.setFont("helvetica", "bold");
      doc.text("بيانات العميل:", 10, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.text(`الاسم: ${invoice.customer_name || ''}`, 15, y);
      y += 6;
      doc.text(`الهاتف: ${invoice.phone || ''}`, 15, y);
      y += 6;
      doc.text(`العنوان: ${invoice.address || 'غير محدد'}`, 15, y);
      y += 10;

      // الخدمة
      doc.setFont("helvetica", "bold");
      doc.text("تفاصيل الخدمة:", 10, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.text(`الجهاز: ${invoice.device_type || invoice.device || ''} - ${invoice.brand || ''}`, 15, y);
      y += 6;
      doc.text(`المشكلة: ${invoice.problem_description || invoice.problem || 'غير محددة'}`, 15, y);
      y += 6;
      if (invoice.parts_used) doc.text(`قطع الغيار: ${invoice.parts_used}`, 15, y);
      y += 10;

      // المبلغ والضمان
      doc.setFont("helvetica", "bold");
      doc.text("المبلغ والضمان:", 10, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.text(`المبلغ الإجمالي: ${invoice.total_amount || 0} ج.م`, 15, y);
      y += 6;
      doc.text(`الضمان: ${invoice.warranty_period || '6 أشهر'}`, 15, y);
      y += 15;

      // الشروط
      doc.setFontSize(9);
      doc.text("شروط الضمان:", 10, y);
      y += 5;
      doc.text("• يغطي جميع الأعطال المفاجئة والعيوب الصناعية", 15, y);
      y += 5;
      doc.text("• لا يغطي الأعطال الناتجة عن الاستخدام الخاطئ", 15, y);
      y += 5;
      doc.text("• خدمة الصيانة متاحة 24 ساعة طوال أيام الأسبوع", 15, y);
      y += 10;

      // التذييل
      doc.setFontSize(8);
      doc.text("للاستفسار: 01278885772 | 01558625259", pageWidth / 2, y, { align: "center" });

      doc.save(`فاتورة_${orderNumber}_${new Date().toLocaleDateString('ar-EG')}.pdf`);
      return true;
    } catch (error) {
      console.error('[PDF] Error:', error);
      alert('حدث خطأ في إنشاء PDF');
      return false;
    }
  },

  // صورة (ستظل تحتاج html2canvas، لكن مع رسالة خطأ أوضح)
  downloadAsImage: async (invoiceElement: HTMLElement, orderNumber: string) => {
    try {
      if (!invoiceElement) throw new Error('عنصر الفاتورة غير موجود');
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `فاتورة_${orderNumber}_${new Date().toLocaleDateString('ar-EG')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      return true;
    } catch (error) {
      console.error('[Image] Error:', error);
      alert('فشل تحميل الصورة، استخدم PDF بدلاً من ذلك.');
      return false;
    }
  },

  // طباعة
  printInvoice: (invoiceElement: HTMLElement) => {
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) throw new Error('فشل فتح نافذة الطباعة');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head><meta charset="UTF-8"><title>فاتورة</title>
        <style>body { font-family: Arial, sans-serif; padding: 20px; }</style>
        </head>
        <body>${invoiceElement.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      return true;
    } catch (error) {
      console.error('[Print] Error:', error);
      return false;
    }
  },

  // مشاركة رابط الفاتورة عبر واتساب
  shareViaWhatsApp: (phone: string, invoiceLink: string, customerName: string, orderNumber: string) => {
    const formattedPhone = phone.toString().replace(/[^\d]/g, '');
    let finalPhone = formattedPhone;
    if (finalPhone.startsWith('0')) finalPhone = finalPhone.substring(1);
    if (finalPhone.length === 10) finalPhone = '20' + finalPhone;
    const message = `📄 *فاتورة الصيانة والضمان* 📄\n\n👤 العميل: ${customerName}\n🔢 رقم الفاتورة: ${orderNumber}\n\n📎 رابط الفاتورة:\n${invoiceLink}\n\n📞 للاستفسار: 01278885772`;
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
  }
};
