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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div ref={invoiceRef} className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white text-center">
            <h1 className="text-2xl font-bold">فاتورة صيانة</h1>
            <p className="text-sm">رقم الأوردر: {getValue('order_number')}</p>
          </div>
          <div className="p-6 space-y-4">
            <div><h2 className="text-lg font-bold">بيانات العميل</h2><p>الاسم: {getValue('customer_name')}</p><p>الهاتف: {getValue('phone')}</p><p>العنوان: {getValue('address')}</p></div>
            <div><h2 className="text-lg font-bold">تفاصيل الخدمة</h2><p>الجهاز: {getDevice()} {getBrand() ? `- ${getBrand()}` : ''}</p><p>المشكلة: {getProblem()}</p><p>الحالة: {getValue('status') === 'completed' ? 'مكتمل' : 'قيد التنفيذ'}</p></div>
            <div><h2 className="text-lg font-bold">المبلغ المدفوع</h2><p className="text-3xl font-black text-green-600">{getTotalAmount() === "غير محدد" ? "غير محدد" : `${getTotalAmount()} ج.م`}</p></div>
            <div className="text-center pt-4"><p className="text-sm">شكراً لثقتك بنا</p></div>
          </div>
        </div>
        <div className="flex justify-center gap-4 mt-6">
          <button onClick={downloadPDF} className="bg-orange-600 text-white px-6 py-2 rounded-lg">📄 تحميل PDF</button>
          <button onClick={() => window.print()} className="bg-gray-600 text-white px-6 py-2 rounded-lg">🖨️ طباعة</button>
        </div>
      </div>
    </div>
  );
}
