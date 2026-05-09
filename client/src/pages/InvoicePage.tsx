import { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import { Download, Printer, Send, Copy, Check } from "lucide-react";
import { invoiceDownloadService } from "../services/invoiceDownload";

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

export default function InvoicePageNew() {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("id");
    if (!orderId) {
      setError("رقم الأوردر غير موجود");
      setLoading(false);
      return;
    }

    const fetchInvoice = async () => {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const data = await response.json();
        if (data && data.length > 0) {
          setInvoice(data[0]);
        } else {
          setError("الفاتورة غير موجودة");
        }
      } catch (err) {
        console.error(err);
        setError("حدث خطأ في الاتصال بقاعدة البيانات");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, []);

  const formatPhoneForWhatsApp = (phone: string) => {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/[^\d]/g, '');
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    if (cleaned.length === 10) cleaned = '20' + cleaned;
    return cleaned;
  };

  const calculateWarrantyEndDate = (warrantyPeriod: string) => {
    const orderDate = new Date(invoice?.created_at || new Date());
    let months = 6;
    
    if (warrantyPeriod?.includes('سنة')) months = 12;
    else if (warrantyPeriod?.includes('شهر')) {
      const match = warrantyPeriod.match(/(\d+)/);
      if (match) months = parseInt(match[1]);
    }
    
    const endDate = new Date(orderDate);
    endDate.setMonth(endDate.getMonth() + months);
    return endDate;
  };

  const getWarrantyRemaining = () => {
    const endDate = calculateWarrantyEndDate(invoice?.warranty_period);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (today > end) return "انتهى الضمان";

    let months = (end.getFullYear() - today.getFullYear()) * 12;
    months += end.getMonth() - today.getMonth();
    let days = end.getDate() - today.getDate();

    if (days < 0) {
        months--;
        const prevMonthDate = new Date(end.getFullYear(), end.getMonth(), 0);
        days = prevMonthDate.getDate() + days;
    }

    if (months === 0 && days === 0) return "ينتهي اليوم";
    if (months === 0) return `${days} يوم`;
    if (days === 0) return `${months} شهر`;
    return `${months} شهر و ${days} يوم`;
  };

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 10;

      pdf.setFillColor(230, 100, 50);
      pdf.rect(0, 0, pageWidth, 35, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text("🔧 Maintenance Guide", pageWidth / 2, 12, { align: "center" });
      pdf.setFontSize(12);
      pdf.text("فاتورة صيانة وضمان الأجهزة المنزلية", pageWidth / 2, 22, { align: "center" });
      pdf.setFontSize(10);
      pdf.text("خدمة صيانة 24 ساعة بالمنزل | 01278885772 | 01558625259", pageWidth / 2, 30, { align: "center" });
      yPosition = 40;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.text("📄 فاتورة الصيانة والضمان", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");
      pdf.text(`رقم الفاتورة: ${invoice?.order_number || invoice?.id}`, 15, yPosition);
      pdf.text(`التاريخ: ${new Date(invoice?.created_at || new Date()).toLocaleDateString('ar-EG')}`, pageWidth - 15, yPosition, { align: "right" });
      yPosition += 10;

      pdf.setFont(undefined, "bold");
      pdf.text("👤 بيانات العميل", 15, yPosition);
      yPosition += 7;
      pdf.setFont(undefined, "normal");
      pdf.text(`الاسم: ${invoice?.customer_name || '-'}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`الهاتف: ${invoice?.phone || '-'}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`العنوان: ${invoice?.address || '-'}`, 20, yPosition);
      yPosition += 10;

      pdf.setFont(undefined, "bold");
      pdf.text("🔧 تفاصيل الخدمة", 15, yPosition);
      yPosition += 7;
      pdf.setFont(undefined, "normal");
      pdf.text(`الجهاز: ${invoice?.device_type || invoice?.device || '-'} - ${invoice?.brand || '-'}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`المشكلة: ${invoice?.problem_description || invoice?.problem || '-'}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`قطع الغيار: ${invoice?.parts_used || 'لا توجد'}`, 20, yPosition);
      yPosition += 10;

      pdf.setFont(undefined, "bold");
      pdf.text("💰 المبلغ والضمان", 15, yPosition);
      yPosition += 7;
      pdf.setFont(undefined, "normal");
      pdf.text(`المبلغ الإجمالي: ${invoice?.total_amount || 0} ج.م`, 20, yPosition);
      yPosition += 5;
      pdf.text(`فترة الضمان: 🛡️ ${invoice?.warranty_period || '6 أشهر'}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`تاريخ انتهاء الضمان: ${calculateWarrantyEndDate(invoice?.warranty_period).toLocaleDateString('ar-EG')}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`المتبقي من الضمان: ${getWarrantyRemaining()}`, 20, yPosition);
      yPosition += 10;

      pdf.setFont(undefined, "bold");
      pdf.text("📋 شروط الضمان", 15, yPosition);
      yPosition += 7;
      pdf.setFont(undefined, "normal");
      const warrantyTerms = [
        "الضمان يغطي جميع الأعطال المفاجئة والعيوب الصناعية",
        "الضمان لا يغطي الأعطال الناتجة عن الاستخدام الخاطئ",
        "خدمة الصيانة متاحة 24 ساعة طوال أيام الأسبوع",
        "يرجى الاتصال بنا فوراً عند ظهور أي مشكلة"
      ];
      warrantyTerms.forEach(term => {
        pdf.text(`• ${term}`, 20, yPosition);
        yPosition += 5;
      });
      yPosition += 5;

      pdf.setFont(undefined, "bold");
      pdf.text("✨ شكراً لثقتك بنا ✨", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 7;
      pdf.setFont(undefined, "normal");
      pdf.text("للاستفسار والدعم الفني: 01278885772", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 5;
      pdf.text("خدمة صيانة 24 ساعة بالمنزل - Maintenance Guide", pageWidth / 2, yPosition, { align: "center" });

      pdf.save(`فاتورة_${invoice?.order_number || "order"}.pdf`);
    } catch (err) {
      alert("❌ حدث خطأ في تحميل PDF");
    }
  };

  const sendViaWhatsApp = () => {
    if (!invoice.phone) {
      alert("❌ رقم الهاتف غير موجود");
      return;
    }

    const phone = formatPhoneForWhatsApp(invoice.phone);
    const warrantyEndDate = calculateWarrantyEndDate(invoice?.warranty_period).toLocaleDateString('ar-EG');
    const message = `📄 *فاتورة الصيانة والضمان* 📄\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ شكراً لثقتك بنا\n\n` +
      `🔢 *رقم الفاتورة:* ${invoice.order_number || invoice.id}\n` +
      `📅 *تاريخ الخدمة:* ${new Date(invoice?.created_at || new Date()).toLocaleDateString('ar-EG')}\n\n` +
      `👤 *بيانات العميل:*\n` +
      `  • الاسم: ${invoice.customer_name}\n` +
      `  • الهاتف: ${invoice.phone}\n` +
      `  • العنوان: ${invoice.address || 'غير محدد'}\n\n` +
      `🔧 *تفاصيل الخدمة:*\n` +
      `  • الجهاز: ${invoice.device_type || invoice.device} - ${invoice.brand}\n` +
      `  • المشكلة: ${invoice.problem_description || invoice.problem || 'غير محددة'}\n` +
      `  • قطع الغيار: ${invoice.parts_used || 'لا توجد'}\n\n` +
      `💰 *المبلغ والضمان:*\n` +
      `  • المبلغ: ${invoice.total_amount || 0} ج.م\n` +
      `  • الضمان: 🛡️ ${invoice.warranty_period || '6 أشهر'}\n` +
      `  • تاريخ انتهاء الضمان: ${warrantyEndDate}\n` +
      `  • المتبقي من الضمان: ${getWarrantyRemaining()}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📞 للاستفسار والدعم الفني:\n` +
      `  📱 01278885772\n` +
      `  📲 01558625259\n\n` +
      `✨ شكراً لثقتك بنا - خدمة صيانة 24 ساعة بالمنزل`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const copyToClipboard = async () => {
    if (!invoiceRef.current) return;
    try {
      const text = invoiceRef.current.innerText;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("فشل نسخ الفاتورة");
    }
  };

  if (loading) return <div className="p-8 text-center">جاري تحميل الفاتورة...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!invoice) return <div className="p-8 text-center">لا توجد بيانات</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div ref={invoiceRef} className="bg-white rounded-3xl shadow-2xl overflow-hidden" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
          
          <div className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full -ml-20 -mb-20"></div>
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-2">🔧 Maintenance Guide</h1>
              <p className="text-orange-100 text-lg mb-1">فاتورة صيانة وضمان الأجهزة المنزلية</p>
              <p className="text-orange-100 text-sm mb-4">خدمة صيانة 24 ساعة بالمنزل</p>
              <div className="flex justify-center gap-8 mt-4 text-sm border-t border-orange-400 pt-4">
                <span className="flex items-center gap-1">📞 01278885772</span>
                <span className="flex items-center gap-1">📲 01558625259</span>
                <span className="flex items-center gap-1">📍 الإسكندرية</span>
              </div>
            </div>
          </div>
          
          <div className="text-center py-8 border-b-4 border-orange-200 bg-gradient-to-b from-orange-50 to-white">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">📄 فاتورة الصيانة والضمان</h2>
            <div className="flex justify-center gap-12 text-sm text-gray-700 mt-4">
              <div className="bg-orange-100 px-4 py-2 rounded-lg">
                <span className="text-gray-600">رقم الفاتورة:</span>
                <p className="font-bold text-orange-600 text-lg">{invoice.order_number || invoice.id}</p>
              </div>
                <div className="bg-blue-100 px-4 py-2 rounded-lg">
                <span className="text-gray-600">التاريخ:</span>
                <p className="font-bold text-blue-600">{new Date(invoice?.created_at || new Date()).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="border-r-4 border-orange-500 bg-gradient-to-l from-orange-50 to-white p-4 rounded-lg">
              <h3 className="font-bold text-orange-700 mb-3 text-lg">👤 بيانات العميل</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white p-2 rounded">
                  <span className="text-gray-500 text-xs">الاسم</span>
                  <p className="font-bold text-gray-800">{invoice.customer_name}</p>
                </div>
                <div className="bg-white p-2 rounded">
                  <span className="text-gray-500 text-xs">الهاتف</span>
                  <p className="font-bold text-gray-800">{invoice.phone}</p>
                </div>
                <div className="col-span-2 bg-white p-2 rounded">
                  <span className="text-gray-500 text-xs">العنوان</span>
                  <p className="font-bold text-gray-800">{invoice.address || 'غير محدد'}</p>
                </div>
              </div>
            </div>
            
            <div className="border-r-4 border-green-500 bg-gradient-to-l from-green-50 to-white p-4 rounded-lg">
              <h3 className="font-bold text-green-700 mb-3 text-lg">🔧 تفاصيل الخدمة</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white p-2 rounded">
                  <span className="text-gray-500 text-xs">الجهاز</span>
                  <p className="font-bold text-gray-800">{invoice.device_type || invoice.device}</p>
                </div>
                <div className="bg-white p-2 rounded">
                  <span className="text-gray-500 text-xs">الماركة</span>
                  <p className="font-bold text-gray-800">{invoice.brand}</p>
                </div>
                <div className="col-span-2 bg-white p-2 rounded">
                  <span className="text-gray-500 text-xs">المشكلة</span>
                  <p className="font-bold text-gray-800">{invoice.problem_description || invoice.problem || '-'}</p>
                </div>
                <div className="col-span-2 bg-white p-2 rounded">
                  <span className="text-gray-500 text-xs">قطع الغيار المستخدمة</span>
                  <p className="font-bold text-gray-800">{invoice.parts_used || 'لا توجد'}</p>
                </div>
              </div>
            </div>
            
            <div className="border-r-4 border-blue-500 bg-gradient-to-l from-blue-50 to-white p-4 rounded-lg">
              <h3 className="font-bold text-blue-700 mb-3 text-lg">💰 المبلغ والضمان</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg text-center">
                  <span className="text-gray-500 text-xs block mb-1">المبلغ الإجمالي</span>
                  <p className="text-3xl font-bold text-green-600">{invoice.total_amount || 0} ج.م</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <span className="text-gray-500 text-xs block mb-1">فترة الضمان</span>
                  <p className="text-2xl font-bold text-blue-600">🛡️ {invoice.warranty_period || '6 أشهر'}</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center col-span-2">
                  <span className="text-gray-500 text-xs block mb-1">تاريخ انتهاء الضمان</span>
                  <p className="text-xl font-bold text-red-600">{calculateWarrantyEndDate(invoice?.warranty_period).toLocaleDateString('ar-EG')}</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center col-span-2">
                  <span className="text-gray-500 text-xs block mb-1">المتبقي من الضمان</span>
                  <p className="text-xl font-bold text-purple-600">{getWarrantyRemaining()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-l from-purple-50 to-white p-4 rounded-lg border-r-4 border-purple-500">
              <h3 className="font-bold text-purple-700 mb-2 text-lg">📋 شروط الضمان</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>الضمان يغطي جميع الأعطال المفاجئة والعيوب الصناعية</li>
                <li>الضمان لا يغطي الأعطال الناتجة عن الاستخدام الخاطئ</li>
                <li>خدمة الصيانة متاحة 24 ساعة طوال أيام الأسبوع</li>
                <li>يرجى الاتصال بنا فوراً عند ظهور أي مشكلة</li>
              </ul>
            </div>
            
            <div className="text-center pt-6 text-gray-600 text-sm border-t-2 border-gray-200">
              <p className="font-bold mb-2">✨ شكراً لثقتك بنا ✨</p>
              <p>للاستفسار والدعم الفني: 01278885772</p>
              <p className="text-xs text-gray-500 mt-2">خدمة صيانة 24 ساعة بالمنزل - Maintenance Guide</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button onClick={downloadPDF} className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all">
            <Download className="w-5 h-5" /> تحميل PDF
          </button>
          <button onClick={() => window.print()} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all">
            <Printer className="w-5 h-5" /> طباعة
          </button>
          <button onClick={sendViaWhatsApp} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all">
            <Send className="w-5 h-5" /> إرسال واتساب
          </button>
          <button onClick={copyToClipboard} className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all">
            {copied ? ( <><Check className="w-5 h-5" /> تم النسخ</> ) : ( <><Copy className="w-5 h-5" /> نسخ</> )}
          </button>
        </div>
      </div>
    </div>
  );
}
