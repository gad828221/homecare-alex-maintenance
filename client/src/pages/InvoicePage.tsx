import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Download, Printer, Send, Copy, Check, Link, Home, Phone, ArrowRight } from 'lucide-react';
import { invoiceDownloadService } from '@/services/invoiceDownloadService';

export default function InvoicePage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const orderId = searchParams.get('id');
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchInvoice() {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (error) throw error;
        setInvoice(data);
      } catch (err) {
        console.error('Error fetching invoice:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [orderId]);

  const downloadPDF = async () => {
    if (!invoice) return;
    await invoiceDownloadService.downloadPDF(invoice, invoice.order_number || orderId);
  };

  const downloadAsImage = async () => {
    if (!invoice || !invoiceRef.current) return;
    await invoiceDownloadService.downloadAsImage(invoiceRef.current, invoice.order_number || orderId);
  };

  const sendViaWhatsApp = () => {
    if (!invoice) return;
    const currentUrl = window.location.href;
    invoiceDownloadService.shareViaWhatsApp(
      invoice.phone,
      currentUrl,
      invoice.customer_name,
      invoice.order_number || orderId
    );
  };

  const copyToClipboard = () => {
    if (!invoice) return;
    const text = `📄 فاتورة صيانة - Maintenance Guide\n👤 العميل: ${invoice.customer_name}\n🔢 رقم الفاتورة: ${invoice.order_number || orderId}\n💰 المبلغ: ${invoice.total_amount} ج.م\n🛡️ الضمان: ${invoice.warranty_period || '6 أشهر'}\n📞 للاستفسار: 01278885772`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const calculateWarrantyEndDate = (period: string) => {
    const months = parseInt(period) || 6;
    const date = new Date(invoice?.created_at || new Date());
    date.setMonth(date.getMonth() + months);
    return date;
  };

  const getWarrantyRemaining = () => {
    if (!invoice) return '';
    const end = calculateWarrantyEndDate(invoice.warranty_period);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'منتهي';
    if (diffDays < 30) return `${diffDays} يوم`;
    const months = Math.floor(diffDays / 30);
    return `${months} شهر و ${diffDays % 30} يوم`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-bold">جاري تحميل الفاتورة...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">الفاتورة غير موجودة</h2>
          <p className="text-slate-600 mb-6">عذراً، لم نتمكن من العثور على بيانات هذه الفاتورة. يرجى التأكد من الرابط أو التواصل مع الدعم الفني.</p>
          <a href="/" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
            <Home className="w-5 h-5" /> العودة للرئيسية
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-arabic" dir="rtl">
      <div className="max-w-3xl mx-auto">
        {/* شريط علوي */}
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">للمساعدة اتصل بنا</p>
              <p className="font-bold text-slate-800">01278885772</p>
            </div>
          </div>
          <a href="/" className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 text-sm">
            الرئيسية <ArrowRight className="w-4 h-4 rotate-180" />
          </a>
        </div>

        {/* جسم الفاتورة */}
        <div ref={invoiceRef} className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-200">
          {/* رأس الفاتورة */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-12 -mb-12 blur-xl"></div>
            
            <h1 className="text-3xl font-black mb-2 tracking-tight">MAINTENANCE GUIDE</h1>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px w-8 bg-blue-300"></div>
              <p className="text-blue-100 font-bold text-sm">فاتورة صيانة وضمان معتمدة</p>
              <div className="h-px w-8 bg-blue-300"></div>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm inline-block px-4 py-1 rounded-full text-xs font-bold border border-white/30">
              رقم الفاتورة: {invoice.order_number || orderId}
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {/* بيانات العميل */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h3 className="text-blue-700 font-bold text-sm mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span> بيانات العميل
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs">الاسم:</span>
                    <span className="font-bold text-slate-800">{invoice.customer_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs">الهاتف:</span>
                    <span className="font-bold text-slate-800" dir="ltr">{invoice.phone}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 text-xs">العنوان:</span>
                    <span className="font-bold text-slate-800 text-left text-xs max-w-[180px]">{invoice.address || 'الإسكندرية'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h3 className="text-blue-700 font-bold text-sm mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span> تفاصيل الجهاز
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs">نوع الجهاز:</span>
                    <span className="font-bold text-slate-800">{invoice.device_type || invoice.device}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs">الماركة:</span>
                    <span className="font-bold text-slate-800">{invoice.brand}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 text-xs">العطل:</span>
                    <span className="font-bold text-slate-800 text-left text-xs max-w-[180px]">{invoice.problem_description || invoice.problem}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* قطع الغيار */}
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
              <h3 className="text-blue-700 font-bold text-sm mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span> قطع الغيار المستخدمة
              </h3>
              <p className="text-slate-700 font-bold text-sm">{invoice.parts_used || 'تمت الصيانة بدون قطع غيار خارجية'}</p>
            </div>

            {/* الحساب والضمان */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-5 rounded-2xl border border-green-100 text-center">
                <span className="text-green-700 text-xs font-bold block mb-1">المبلغ الإجمالي</span>
                <p className="text-3xl font-black text-green-600">{invoice.total_amount || 0} <span className="text-sm">ج.م</span></p>
              </div>
              <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 text-center">
                <span className="text-orange-700 text-xs font-bold block mb-1">فترة الضمان</span>
                <p className="text-2xl font-black text-orange-600">{invoice.warranty_period || '6 أشهر'}</p>
              </div>
            </div>

            {/* الضمان */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500"></div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-blue-400 flex items-center gap-2">
                  🛡️ تفاصيل الضمان
                </h3>
                <span className="bg-blue-500/20 text-blue-300 text-[10px] px-2 py-0.5 rounded-full border border-blue-500/30">معتمد</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-slate-400 text-[10px] mb-1">تاريخ الانتهاء</p>
                  <p className="font-bold text-sm">{calculateWarrantyEndDate(invoice.warranty_period).toLocaleDateString('ar-EG')}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] mb-1">المتبقي</p>
                  <p className="font-bold text-sm text-green-400">{getWarrantyRemaining()}</p>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 space-y-1 border-t border-slate-800 pt-3">
                <p>• الضمان يغطي جميع عيوب الصناعة وقطع الغيار المستبدلة.</p>
                <p>• الضمان لا يغطي سوء الاستخدام أو الكسر أو الحريق.</p>
              </div>
            </div>

            {/* التذييل */}
            <div className="text-center pt-4">
              <p className="text-slate-400 text-[10px] mb-2">تم إصدار هذه الفاتورة إلكترونياً وهي معتمدة لدى الشركة</p>
              <div className="flex justify-center gap-8 text-slate-300 text-[10px]">
                <div className="text-center">
                  <div className="w-12 h-12 border border-slate-200 rounded-lg mx-auto mb-1 flex items-center justify-center text-slate-100 font-black opacity-20 italic text-xl">ختم</div>
                  <span>الشركة</span>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 border-b border-slate-200 mx-auto mb-1"></div>
                  <span>الفني</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 no-print">
          <button onClick={downloadAsImage} className="flex flex-col items-center justify-center bg-white hover:bg-slate-50 p-4 rounded-2xl shadow-sm border border-slate-200 transition-all group">
            <div className="bg-yellow-100 p-3 rounded-xl text-yellow-600 mb-2 group-hover:scale-110 transition-transform">
              <Download className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-700">تحميل صورة</span>
          </button>
          
          <button onClick={downloadPDF} className="flex flex-col items-center justify-center bg-white hover:bg-slate-50 p-4 rounded-2xl shadow-sm border border-slate-200 transition-all group">
            <div className="bg-orange-100 p-3 rounded-xl text-orange-600 mb-2 group-hover:scale-110 transition-transform">
              <Download className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-700">تحميل PDF</span>
          </button>

          <button onClick={sendViaWhatsApp} className="flex flex-col items-center justify-center bg-white hover:bg-slate-50 p-4 rounded-2xl shadow-sm border border-slate-200 transition-all group">
            <div className="bg-green-100 p-3 rounded-xl text-green-600 mb-2 group-hover:scale-110 transition-transform">
              <Send className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-700">إرسال واتساب</span>
          </button>

          <button onClick={copyLinkToClipboard} className="flex flex-col items-center justify-center bg-white hover:bg-slate-50 p-4 rounded-2xl shadow-sm border border-slate-200 transition-all group">
            <div className={`p-3 rounded-xl mb-2 group-hover:scale-110 transition-transform ${linkCopied ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
              {linkCopied ? <Check className="w-6 h-6" /> : <Link className="w-6 h-6" />}
            </div>
            <span className="text-xs font-bold text-slate-700">{linkCopied ? 'تم النسخ' : 'نسخ الرابط'}</span>
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <button onClick={() => window.print()} className="text-slate-500 hover:text-slate-800 text-xs font-bold flex items-center gap-1 mx-auto">
            <Printer className="w-4 h-4" /> طباعة الفاتورة يدوياً
          </button>
        </div>
      </div>
      
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; padding: 0; }
          .min-h-screen { min-h-0; padding: 0; }
          .shadow-2xl { shadow: none; }
          .rounded-3xl { border-radius: 0; }
        }
      `}</style>
    </div>
  );
}
