import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const invoiceDownloadService = {
  // تحميل الفاتورة كـ PDF (من عنصر HTML)
  downloadAsPDF: async (invoiceElement: HTMLElement, orderNumber: string) => {
    try {
      if (!invoiceElement) {
        throw new Error('عنصر الفاتورة غير موجود');
      }

      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // عرض A4
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      const filename = `فاتورة_${orderNumber}_${new Date().toLocaleDateString('ar-EG')}.pdf`;
      pdf.save(filename);
      return true;
    } catch (error) {
      console.error('[Invoice] Error downloading PDF:', error);
      alert('حدث خطأ في تحميل PDF، تأكد من اتصال الإنترنت وحاول مرة أخرى.');
      return false;
    }
  },

  // تحميل الفاتورة كـ صورة PNG
  downloadAsImage: async (invoiceElement: HTMLElement, orderNumber: string) => {
    try {
      if (!invoiceElement) {
        throw new Error('عنصر الفاتورة غير موجود');
      }

      const canvas = await html2canvas(invoiceElement, {
        scale: 3,
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
      console.error('[Invoice] Error downloading image:', error);
      alert('حدث خطأ في تحميل الصورة، تأكد من اتصال الإنترنت وحاول مرة أخرى.');
      return false;
    }
  },

  // طباعة الفاتورة
  printInvoice: (invoiceElement: HTMLElement) => {
    try {
      if (!invoiceElement) return;
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        alert('تعذر فتح نافذة الطباعة، السماح بالنوافذ المنبثقة مطلوب.');
        return false;
      }
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
      console.error('[Invoice] Print error:', error);
      return false;
    }
  },

  // مشاركة رابط الفاتورة (بدلاً من الصورة مباشرة)
  shareViaWhatsApp: (phone: string, invoiceLink: string, customerName: string, orderNumber: string) => {
    const formattedPhone = phone.toString().replace(/[^\d]/g, '');
    let finalPhone = formattedPhone;
    if (finalPhone.startsWith('0')) finalPhone = finalPhone.substring(1);
    if (finalPhone.length === 10) finalPhone = '20' + finalPhone;
    const message = `📄 *فاتورة الصيانة والضمان* 📄\n\n👤 العميل: ${customerName}\n🔢 رقم الفاتورة: ${orderNumber}\n\n📎 رابط الفاتورة (يمكنك تحميلها كـ PDF أو صورة):\n${invoiceLink}\n\n📞 للاستفسار: 01278885772`;
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
  }
};
