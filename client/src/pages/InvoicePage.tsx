import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
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

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
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

  if (loading) return <div className="p-8 text-center">جاري تحميل الفاتورة...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!invoice) return <div className="p-8 text-center">لا توجد بيانات</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* الفاتورة */}
        <div ref={invoiceRef} className="bg-white rounded-3xl shadow-2xl overflow-hidden" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
          
          {/* Header */}
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
          
          {/* عنوان الفاتورة */}
          <div className="text-center py-8 border-b-4 border-orange-200 bg-gradient-to-b from-orange-50 to-white">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">📄 فاتورة الصيانة والضمان</h2>
            <div className="flex justify-center gap-12 text-sm text-gray-700 mt-4">
              <div className="bg-orange-100 px-4 py-2 rounded-lg">
                <span className="text-gray-600">رقم الفاتورة:</span>
                <p className="font-bold text-orange-600 text-lg">{invoice.order_number || invoice.id}</p>
              </div>
              <div className="bg-blue-100 px-4 py-2 rounded-lg">
                <span className="text-gray-600">التاريخ:</span>
                <p className="font-bold text-blue-600">{new Date().toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
          </div>
          
          {/* المحتوى */}
          <div className="p-8 space-y-6">
            {/* العميل */}
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
            
            {/* الخدمة */}
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
            
            {/* المبلغ والضمان */}
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
              </div>
            </div>
            
            {/* شروط الضمان */}
            <div className="bg-gradient-to-l from-purple-50 to-white p-4 rounded-lg border-r-4 border-purple-500">
              <h3 className="font-bold text-purple-700 mb-2 text-lg">📋 شروط الضمان</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>الضمان يغطي جميع الأعطال المفاجئة والعيوب الصناعية</li>
                <li>الضمان لا يغطي الأعطال الناتجة عن الاستخدام الخاطئ</li>
                <li>خدمة الصيانة متاحة 24 ساعة طوال أيام الأسبوع</li>
                <li>يرجى الاتصال بنا فوراً عند ظهور أي مشكلة</li>
              </ul>
            </div>
            
            {/* توقيعات */}
            <div className="flex justify-between pt-6 border-t-2 border-gray-300">
              <div className="text-center">
                <div className="w-24 h-12 border-2 border-dashed border-gray-400 rounded mb-2"></div>
                <p className="text-xs text-gray-600 font-bold">ختم الشركة</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-0.5 bg-gray-400 mt-8"></div>
                <p className="text-xs text-gray-600 font-bold">توقيع الفني</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-0.5 bg-gray-400 mt-8"></div>
                <p className="text-xs text-gray-600 font-bold">توقيع العميل</p>
              </div>
            </div>
            
            {/* شكر */}
            <div className="text-center pt-6 text-gray-600 text-sm border-t-2 border-gray-200">
              <p className="font-bold mb-2">✨ شكراً لثقتك بنا ✨</p>
              <p>للاستفسار والدعم الفني: 01278885772</p>
              <p className="text-xs text-gray-500 mt-2">خدمة صيانة 24 ساعة بالمنزل - Maintenance Guide</p>
            </div>
          </div>
        </div>
        
        {/* أزرار الإجراءات */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button
          <button
            onClick={downloadAsImage}
            className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            <Download className="w-5 h-5" /> تحميل صورة
          </button>
            onClick={downloadPDF}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            <Download className="w-5 h-5" /> تحميل PDF
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            <Printer className="w-5 h-5" /> طباعة
          </button>
          <button
            onClick={sendViaWhatsApp}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            <Send className="w-5 h-5" /> إرسال واتساب
          </button>
          <button
            onClick={copyToClipboard}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" /> تم النسخ
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" /> نسخ
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
