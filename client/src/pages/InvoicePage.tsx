import { useState, useEffect, useRef } from "react";
import { Download, Printer, Send, Copy, Check, FileText, Phone, MapPin, Calendar, Hash, User, Wrench, CreditCard, Shield } from "lucide-react";
import { invoiceDownloadService } from "../services/invoiceDownloadService";

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
        const res = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
        });
        const data = await res.json();
        if (data && data.length) setInvoice(data[0]);
        else setError("الفاتورة غير موجودة");
      } catch (err) {
        setError("خطأ في الاتصال");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, []);

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/[^\d]/g, '');
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    if (cleaned.length === 10) cleaned = '20' + cleaned;
    return cleaned;
  };

  const handleDownloadPDF = async () => {
    if (invoiceRef.current) {
      await invoiceDownloadService.downloadAsPDF(invoiceRef.current, invoice?.order_number || invoice?.id);
    }
  };
  const handleDownloadImage = async () => {
    if (invoiceRef.current) {
      await invoiceDownloadService.downloadAsImage(invoiceRef.current, invoice?.order_number || invoice?.id);
    }
  };
  const handlePrint = () => {
    if (invoiceRef.current) invoiceDownloadService.printInvoice(invoiceRef.current);
  };
  const handleShareWhatsApp = () => {
    if (!invoice?.phone) return alert("رقم الهاتف غير موجود");
    const link = window.location.href;
    invoiceDownloadService.shareViaWhatsApp(invoice.phone, link, invoice.customer_name, invoice.order_number || invoice.id);
  };
  const copyToClipboard = async () => {
    if (invoiceRef.current) {
      await navigator.clipboard.writeText(invoiceRef.current.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!invoice) return <div className="p-8 text-center">لا توجد بيانات</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div ref={invoiceRef} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-white px-8 pt-8 pb-6 border-b border-gray-200 flex justify-between flex-wrap">
            <div><h1 className="text-2xl font-bold text-gray-800">فاتورة صيانة</h1><p className="text-gray-500">Maintenance Guide</p></div>
            <div className="text-left"><div className="flex gap-2 text-gray-600"><Calendar size={16}/>{new Date().toLocaleDateString('ar-EG')}</div><div className="flex gap-2 text-gray-600 mt-1"><Hash size={16}/>رقم: <strong>{invoice.order_number || invoice.id}</strong></div></div>
          </div>
          {/* Customer */}
          <div className="px-8 py-4 bg-gray-50/50"><h2 className="text-sm font-semibold text-gray-500 flex gap-2"><User size={16}/>بيانات العميل</h2><div className="grid md:grid-cols-3 gap-2 text-sm mt-2"><div><span className="text-gray-400">الاسم</span><p className="font-medium">{invoice.customer_name}</p></div><div><span className="text-gray-400">الهاتف</span><p>{invoice.phone}</p></div><div><span className="text-gray-400">العنوان</span><p>{invoice.address || 'غير محدد'}</p></div></div></div>
          {/* Service */}
          <div className="px-8 py-4"><h2 className="text-sm font-semibold text-gray-500 flex gap-2"><Wrench size={16}/>تفاصيل الخدمة</h2><div className="grid md:grid-cols-2 gap-2 text-sm mt-2"><div><span className="text-gray-400">الجهاز</span><p>{invoice.device_type || invoice.device}</p></div><div><span className="text-gray-400">الماركة</span><p>{invoice.brand}</p></div><div className="md:col-span-2"><span className="text-gray-400">المشكلة</span><p>{invoice.problem_description || invoice.problem || '-'}</p></div><div className="md:col-span-2"><span className="text-gray-400">قطع الغيار</span><p>{invoice.parts_used || 'لا توجد'}</p></div></div></div>
          {/* Amount & Warranty */}
          <div className="px-8 py-4 bg-blue-50/30 flex flex-wrap gap-4 justify-between items-center border-y border-gray-100"><div><p className="text-xs text-gray-500">المبلغ الإجمالي</p><p className="text-2xl font-bold text-green-600">{invoice.total_amount || 0} ج.م</p></div><div><p className="text-xs text-gray-500">الضمان</p><p className="text-xl font-bold text-blue-600">🛡️ {invoice.warranty_period || '6 أشهر'}</p></div></div>
          {/* Terms */}
          <div className="px-8 py-4 text-sm text-gray-600 border-b"><p className="font-semibold">شروط الضمان</p><ul className="list-disc list-inside text-xs"><li>يغطي جميع الأعطال المفاجئة والعيوب الصناعية</li><li>لا يغطي الأعطال الناتجة عن الاستخدام الخاطئ</li><li>خدمة الصيانة متاحة 24 ساعة</li></ul></div>
          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50 text-center text-sm">✨ شكراً لثقتك بنا ✨<div className="flex justify-center gap-4 mt-2 text-xs text-gray-500"><Phone size={12}/> 01278885772  -  01558625259</div></div>
        </div>
        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button onClick={handleDownloadImage} className="bg-white border px-4 py-2 rounded-xl shadow flex gap-2"><Download size={18}/>صورة</button>
          <button onClick={handleDownloadPDF} className="bg-white border px-4 py-2 rounded-xl shadow flex gap-2"><FileText size={18}/>PDF</button>
          <button onClick={handlePrint} className="bg-white border px-4 py-2 rounded-xl shadow flex gap-2"><Printer size={18}/>طباعة</button>
          <button onClick={handleShareWhatsApp} className="bg-green-500 text-white px-4 py-2 rounded-xl shadow flex gap-2"><Send size={18}/>واتساب</button>
          <button onClick={copyToClipboard} className="bg-gray-800 text-white px-4 py-2 rounded-xl shadow flex gap-2">{copied ? <Check size={18}/> : <Copy size={18}/>}{copied ? "تم النسخ" : "نسخ"}</button>
        </div>
      </div>
    </div>
  );
}
