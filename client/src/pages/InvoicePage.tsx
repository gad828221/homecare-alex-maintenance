import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, Printer, Send, Copy, Check, FileText, Phone, MapPin, Calendar, Hash, User, Wrench, CreditCard, Shield } from "lucide-react";

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

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 0, imgWidth, imgHeight);
      pdf.save(`فاتورة_${invoice?.order_number || "order"}.pdf`);
    } catch (err) {
      alert("حدث خطأ في تحميل PDF");
    }
  };

  const downloadAsImage = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `فاتورة_${invoice?.order_number || "order"}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      alert("حدث خطأ في تحميل الصورة");
    }
  };

  const sendViaWhatsApp = () => {
    if (!invoice.phone) {
      alert("❌ رقم الهاتف غير موجود");
      return;
    }

    const phone = formatPhoneForWhatsApp(invoice.phone);
    const message = `📄 *فاتورة الصيانة والضمان* 📄\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ شكراً لثقتك بنا\n\n` +
      `🔢 *رقم الفاتورة:* ${invoice.order_number || invoice.id}\n` +
      `📅 *التاريخ:* ${new Date().toLocaleDateString('ar-EG')}\n\n` +
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
      `  • الضمان: 🛡️ ${invoice.warranty_period || '6 أشهر'}\n\n` +
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

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-100"><div className="text-xl text-gray-600">جاري تحميل الفاتورة...</div></div>;
  if (error) return <div className="flex items-center justify-center min-h-screen bg-gray-100"><div className="text-xl text-red-500">{error}</div></div>;
  if (!invoice) return <div className="flex items-center justify-center min-h-screen bg-gray-100"><div className="text-xl text-gray-500">لا توجد بيانات</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* الفاتورة - تصميم عصري */}
        <div ref={invoiceRef} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100" style={{ fontFamily: 'Cairo, Tahoma, sans-serif' }}>
          
          {/* رأس الفاتورة بشعار بسيط */}
          <div className="bg-white px-8 pt-8 pb-6 border-b border-gray-200 flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">فاتورة صيانة</h1>
              <p className="text-gray-500 text-sm mt-1">Maintenance Guide</p>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{new Date().toLocaleDateString('ar-EG')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                <Hash className="w-4 h-4" />
                <span>رقم الفاتورة: <strong>{invoice.order_number || invoice.id}</strong></span>
              </div>
            </div>
          </div>
          
          {/* معلومات العميل */}
          <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> بيانات العميل
            </h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">الاسم</p>
                <p className="font-medium text-gray-800">{invoice.customer_name}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">الهاتف</p>
                <p className="font-medium text-gray-800 dir-ltr">{invoice.phone}</p>
              </div>
              <div className="md:col-span-1">
                <p className="text-gray-500 text-xs">العنوان</p>
                <p className="font-medium text-gray-800">{invoice.address || 'غير محدد'}</p>
              </div>
            </div>
          </div>
          
          {/* تفاصيل الخدمة */}
          <div className="px-8 py-6 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Wrench className="w-4 h-4" /> تفاصيل الخدمة
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">الجهاز</p>
                <p className="font-medium text-gray-800">{invoice.device_type || invoice.device}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">الماركة</p>
                <p className="font-medium text-gray-800">{invoice.brand}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500 text-xs">المشكلة</p>
                <p className="font-medium text-gray-800">{invoice.problem_description || invoice.problem || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500 text-xs">قطع الغيار المستخدمة</p>
                <p className="font-medium text-gray-800">{invoice.parts_used || 'لا توجد'}</p>
              </div>
            </div>
          </div>
          
          {/* المبلغ والضمان */}
          <div className="px-8 py-6 bg-gradient-to-r from-blue-50/50 to-white border-b border-gray-100">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">المبلغ الإجمالي</p>
                  <p className="text-2xl font-bold text-green-600">{invoice.total_amount || 0} <span className="text-sm">ج.م</span></p>
                </div>
                <CreditCard className="w-8 h-8 text-green-500 opacity-70" />
              </div>
              <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">فترة الضمان</p>
                  <p className="text-2xl font-bold text-blue-600">🛡️ {invoice.warranty_period || '6 أشهر'}</p>
                </div>
                <Shield className="w-8 h-8 text-blue-500 opacity-70" />
              </div>
            </div>
          </div>
          
          {/* شروط الضمان */}
          <div className="px-8 py-6 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">شروط الضمان</h3>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>الضمان يغطي جميع الأعطال المفاجئة والعيوب الصناعية</li>
              <li>الضمان لا يغطي الأعطال الناتجة عن الاستخدام الخاطئ</li>
              <li>خدمة الصيانة متاحة 24 ساعة طوال أيام الأسبوع</li>
              <li>يرجى الاتصال بنا فوراً عند ظهور أي مشكلة</li>
            </ul>
          </div>
          
          {/* تذييل */}
          <div className="px-8 py-6 bg-gray-50 text-center">
            <p className="text-sm font-medium text-gray-700">✨ شكراً لثقتك بنا ✨</p>
            <div className="flex justify-center gap-6 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> 01278885772</span>
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> 01558625259</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> الإسكندرية</span>
            </div>
            <p className="text-xs text-gray-400 mt-3">خدمة صيانة 24 ساعة بالمنزل - Maintenance Guide</p>
          </div>
        </div>
        
        {/* أزرار الإجراءات */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button
            onClick={downloadAsImage}
            className="bg-white hover:bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-md border border-gray-200 transition-all"
          >
            <Download className="w-4 h-4" /> تحميل صورة
          </button>
          <button
            onClick={downloadPDF}
            className="bg-white hover:bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-md border border-gray-200 transition-all"
          >
            <FileText className="w-4 h-4" /> تحميل PDF
          </button>
          <button
            onClick={() => window.print()}
            className="bg-white hover:bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-md border border-gray-200 transition-all"
          >
            <Printer className="w-4 h-4" /> طباعة
          </button>
          <button
            onClick={sendViaWhatsApp}
            className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-md transition-all"
          >
            <Send className="w-4 h-4" /> إرسال واتساب
          </button>
          <button
            onClick={copyToClipboard}
            className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-md transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "تم النسخ" : "نسخ النص"}
          </button>
        </div>
      </div>
    </div>
  );
}
