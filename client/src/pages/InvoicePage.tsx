import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

export default function InvoicePage() {
  const [, setLocation] = useLocation();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 0, imgWidth, imgHeight);
      pdf.save(`فاتورة_${invoice?.order_number || "order"}.pdf`);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ في تحميل PDF");
    }
  };

  if (loading) return <div className="p-8 text-center">جاري تحميل الفاتورة...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!invoice) return <div className="p-8 text-center">لا توجد بيانات</div>;

  const getValue = (key: string, defaultValue: string = "غير محدد") => invoice?.[key] || defaultValue;
  const getDevice = () => invoice?.device_type || invoice?.device || invoice?.appliance_type || "جهاز غير محدد";
  const getBrand = () => invoice?.brand || "";
  const getProblem = () => invoice?.problem_description || invoice?.problem || "لا يوجد وصف";
  const getTotalAmount = () => (invoice?.total_amount && invoice.total_amount > 0) ? invoice.total_amount : (invoice?.cost || "غير محدد");
  const getWarranty = () => invoice?.warranty_period || invoice?.warranty || "6 أشهر";
  const getParts = () => invoice?.parts_used || "لا توجد";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8">
      <div className="max-w-4xl mx-auto">
        {/* الفاتورة */}
        <div ref={invoiceRef} className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Header - شعار وبيانات الشركة */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-8 text-white text-center relative">
            <div className="absolute top-4 left-4 opacity-20">
              <svg width="80" height="80" viewBox="0 0 100 100" fill="white">
                <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="2" fill="none" />
                <path d="M50 20 L65 45 L60 45 L55 35 L50 50 L45 35 L40 45 L35 45 L50 20Z" fill="white" />
                <path d="M30 55 L70 55 L65 65 L35 65 L30 55Z" fill="white" />
                <rect x="45" y="65" width="10" height="15" fill="white" />
              </svg>
            </div>
            <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-2">🔧 Maintenance Guide</h1>
              <p className="text-orange-100">صيانة فورية بالمنزل - خدمة 24 ساعة</p>
              <div className="mt-4 pt-4 border-t border-orange-400/30 flex justify-center gap-6 text-sm">
                <span>📞 01278885772</span>
                <span>📍 الإسكندرية</span>
                <span>🌐 maintenanceguide.life</span>
              </div>
            </div>
          </div>

          {/* عنوان الفاتورة */}
          <div className="text-center py-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-800">فاتورة صيانة</h2>
            <p className="text-gray-500 text-sm mt-1">رقم الأوردر: <span className="font-bold text-orange-600">{getValue('order_number')}</span></p>
            <p className="text-gray-500 text-sm">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
          </div>

          {/* محتوى الفاتورة */}
          <div className="p-8 space-y-6">
            {/* بيانات العميل */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border-r-4 border-blue-500">
              <h3 className="text-lg font-bold text-blue-700 mb-3 flex items-center gap-2">👤 بيانات العميل</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">الاسم:</span> <span className="font-semibold">{getValue('customer_name')}</span></div>
                <div><span className="text-gray-500">الهاتف:</span> <span className="font-semibold ltr">{getValue('phone')}</span></div>
                <div className="col-span-2"><span className="text-gray-500">العنوان:</span> <span className="font-semibold">{getValue('address') || 'غير محدد'}</span></div>
              </div>
            </div>

            {/* تفاصيل الخدمة */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-2xl border-r-4 border-green-500">
              <h3 className="text-lg font-bold text-green-700 mb-3 flex items-center gap-2">🔧 تفاصيل الخدمة</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">الجهاز:</span> <span className="font-semibold">{getDevice()} {getBrand() ? `- ${getBrand()}` : ''}</span></div>
                <div><span className="text-gray-500">الحالة:</span> <span className="font-semibold text-green-600">✅ مكتمل</span></div>
                <div className="col-span-2"><span className="text-gray-500">المشكلة:</span> <span className="font-semibold">{getProblem()}</span></div>
                <div className="col-span-2"><span className="text-gray-500">قطع الغيار المستخدمة:</span> <span className="font-semibold">{getParts()}</span></div>
              </div>
            </div>

            {/* المبلغ والضمان */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-5 rounded-2xl border-r-4 border-amber-500">
              <h3 className="text-lg font-bold text-amber-700 mb-3 flex items-center gap-2">💰 المبلغ المدفوع</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">المبلغ الإجمالي:</span> <span className="text-2xl font-black text-green-600">{getTotalAmount() === "غير محدد" ? "غير محدد" : `${getTotalAmount()} ج.م`}</span></div>
                <div><span className="text-gray-500">الضمان:</span> <span className="font-semibold text-amber-700">🛡️ {getWarranty()}</span></div>
              </div>
            </div>

            {/* توقيع وختم */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4">
              <div className="text-center">
                <div className="w-32 h-16 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400">
                  ختم الشركة
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">توقيع الفني</p>
                <div className="w-32 h-0.5 bg-gray-300 mt-2"></div>
                <p className="text-xs text-gray-400 mt-1">{invoice?.technician || '...............'}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">توقيع العميل</p>
                <div className="w-32 h-0.5 bg-gray-300 mt-2"></div>
                <p className="text-xs text-gray-400 mt-1">................</p>
              </div>
            </div>

            {/* رسالة شكر */}
            <div className="text-center pt-4">
              <p className="text-gray-500 text-sm">📞 للاستفسار: 01278885772</p>
              <p className="text-gray-400 text-xs mt-1">شكراً لثقتك بنا - نتمنى لك خدمة ممتعة</p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t border-gray-200">
            هذه الفاتورة إلكترونية وتعتبر سنداً قانونياً معتمداً
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex justify-center gap-4 mt-8">
          <button onClick={downloadPDF} className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            تحميل PDF
          </button>
          <button onClick={() => window.print()} className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            طباعة
          </button>
        </div>
      </div>
    </div>
  );
}
