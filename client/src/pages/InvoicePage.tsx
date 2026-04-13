import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

export default function InvoicePage() {
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

  if (loading) return <div className="p-8 text-center">جاري تحميل الفاتورة...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!invoice) return <div className="p-8 text-center">لا توجد بيانات</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6" dir="rtl">
      <div className="max-w-3xl mx-auto">
        {/* الفاتورة */}
        <div ref={invoiceRef} className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white text-center">
            <h1 className="text-2xl font-bold">🔧 Maintenance Guide</h1>
            <p className="text-orange-100 text-sm">صيانة فورية بالمنزل - خدمة 24 ساعة</p>
            <div className="flex justify-center gap-4 mt-3 text-xs">
              <span>📞 01278885772</span>
              <span>📍 الإسكندرية</span>
            </div>
          </div>
          
          {/* عنوان الفاتورة */}
          <div className="text-center py-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">فاتورة صيانة</h2>
            <p className="text-gray-500 text-sm">رقم الأوردر: <span className="font-bold text-orange-600">{invoice.order_number || invoice.id}</span></p>
            <p className="text-gray-500 text-sm">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
          </div>
          
          {/* المحتوى */}
          <div className="p-6 space-y-4">
            {/* العميل */}
            <div className="border-r-4 border-orange-500 bg-orange-50 p-4 rounded">
              <h3 className="font-bold text-orange-700 mb-2">👤 بيانات العميل</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">الاسم:</span> {invoice.customer_name}</div>
                <div><span className="text-gray-500">الهاتف:</span> {invoice.phone}</div>
                <div className="col-span-2"><span className="text-gray-500">العنوان:</span> {invoice.address || 'غير محدد'}</div>
              </div>
            </div>
            
            {/* الخدمة */}
            <div className="border-r-4 border-green-500 bg-green-50 p-4 rounded">
              <h3 className="font-bold text-green-700 mb-2">🔧 تفاصيل الخدمة</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">الجهاز:</span> {invoice.device_type || invoice.device} - {invoice.brand}</div>
                <div><span className="text-gray-500">الحالة:</span> ✅ مكتمل</div>
                <div className="col-span-2"><span className="text-gray-500">المشكلة:</span> {invoice.problem_description || invoice.problem || '-'}</div>
                <div className="col-span-2"><span className="text-gray-500">قطع الغيار:</span> {invoice.parts_used || 'لا توجد'}</div>
              </div>
            </div>
            
            {/* المبلغ والضمان */}
            <div className="border-r-4 border-blue-500 bg-blue-50 p-4 rounded">
              <h3 className="font-bold text-blue-700 mb-2">💰 المبلغ والضمان</h3>
              <div className="flex justify-between items-center">
                <div><span className="text-gray-500">المبلغ:</span> <span className="text-2xl font-bold text-green-600">{invoice.total_amount || 0} ج.م</span></div>
                <div><span className="text-gray-500">الضمان:</span> <span className="font-bold text-blue-600">🛡️ {invoice.warranty_period || '6 أشهر'}</span></div>
              </div>
            </div>
            
            {/* توقيعات */}
            <div className="flex justify-between pt-4 border-t">
              <div className="text-center"><div className="w-24 h-12 border border-dashed rounded"></div><p className="text-xs mt-1">ختم الشركة</p></div>
              <div className="text-center"><div className="w-24 h-0.5 bg-gray-300 mt-6"></div><p className="text-xs mt-1">توقيع الفني</p></div>
              <div className="text-center"><div className="w-24 h-0.5 bg-gray-300 mt-6"></div><p className="text-xs mt-1">توقيع العميل</p></div>
            </div>
            
            {/* شكر */}
            <div className="text-center pt-4 text-gray-500 text-sm">شكراً لثقتك بنا - للاستفسار: 01278885772</div>
          </div>
        </div>
        
        {/* أزرار */}
        <div className="flex justify-center gap-4 mt-6">
          <button onClick={downloadPDF} className="bg-orange-600 text-white px-6 py-2 rounded-lg">📄 تحميل PDF</button>
          <button onClick={() => window.print()} className="bg-gray-600 text-white px-6 py-2 rounded-lg">🖨️ طباعة</button>
        </div>
      </div>
    </div>
  );
}
