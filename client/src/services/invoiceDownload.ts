import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const invoiceDownloadService = {
  // تحميل الفاتورة كـ PDF
  downloadAsPDF: async (invoiceElement: HTMLElement, orderNumber: string) => {
    try {
      if (!invoiceElement) {
        throw new Error('عنصر الفاتورة غير موجود');
      }

      // تحويل الفاتورة إلى صورة
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // إنشاء ملف PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // عرض A4
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // إضافة الصورة إلى PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // حفظ الملف
      const filename = `فاتورة_${orderNumber}_${new Date().toLocaleDateString('ar-EG')}.pdf`;
      pdf.save(filename);

      console.log(`[Invoice] PDF downloaded: ${filename}`);
      return true;
    } catch (error) {
      console.error('[Invoice] Error downloading PDF:', error);
      throw error;
    }
  },

  // تحميل الفاتورة كـ صورة PNG
  downloadAsImage: async (invoiceElement: HTMLElement, orderNumber: string) => {
    try {
      if (!invoiceElement) {
        throw new Error('عنصر الفاتورة غير موجود');
      }

      // تحويل الفاتورة إلى صورة بجودة عالية
      const canvas = await html2canvas(invoiceElement, {
        scale: 3, // جودة أعلى
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // تحويل الـ Canvas إلى Blob
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('فشل تحويل الفاتورة إلى صورة');
        }

        // إنشاء رابط التحميل
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `فاتورة_${orderNumber}_${new Date().toLocaleDateString('ar-EG')}.png`;
        
        // تحميل الملف
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // تحرير الذاكرة
        URL.revokeObjectURL(url);

        console.log(`[Invoice] Image downloaded: ${link.download}`);
      }, 'image/png', 1.0);

      return true;
    } catch (error) {
      console.error('[Invoice] Error downloading image:', error);
      throw error;
    }
  },

  // طباعة الفاتورة
  printInvoice: (invoiceElement: HTMLElement) => {
    try {
      if (!invoiceElement) {
        throw new Error('عنصر الفاتورة غير موجود');
      }

      // إنشاء نافذة طباعة
      const printWindow = window.open('', '', 'height=600,width=800');
      if (!printWindow) {
        throw new Error('فشل فتح نافذة الطباعة');
      }

      // كتابة محتوى الفاتورة
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>طباعة الفاتورة</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            @media print {
              body { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          ${invoiceElement.innerHTML}
        </body>
        </html>
      `);

      printWindow.document.close();
      
      // انتظر تحميل المحتوى ثم اطبع
      setTimeout(() => {
        printWindow.print();
      }, 250);

      console.log('[Invoice] Print dialog opened');
      return true;
    } catch (error) {
      console.error('[Invoice] Error printing invoice:', error);
      throw error;
    }
  },

  // مشاركة الفاتورة عبر الواتس
  shareViaWhatsApp: async (invoiceElement: HTMLElement, phone: string, customerName: string, orderNumber: string) => {
    try {
      // تحويل الفاتورة إلى صورة
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // تحويل الصورة إلى Blob
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('فشل تحويل الفاتورة إلى صورة');
        }

        // إنشاء رابط الواتس
        const formattedPhone = phone.toString().replace(/[^\d]/g, '');
        let finalPhone = formattedPhone;
        if (finalPhone.startsWith('0')) finalPhone = finalPhone.substring(1);
        if (finalPhone.length === 10) finalPhone = '20' + finalPhone;

        const message = `📄 *فاتورة الصيانة والضمان* 📄\n\nشكراً لثقتك بنا\n\n👤 العميل: ${customerName}\n🔢 رقم الفاتورة: ${orderNumber}\n\n📞 للاستفسار: 01278885772`;

        const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

        console.log(`[Invoice] WhatsApp share link created for: ${finalPhone}`);
      }, 'image/png', 1.0);

      return true;
    } catch (error) {
      console.error('[Invoice] Error sharing via WhatsApp:', error);
      throw error;
    }
  }
};
