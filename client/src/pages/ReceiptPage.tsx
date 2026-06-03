import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Printer, Share2, MessageCircle, ArrowRight, CheckCircle2, Package, User, Phone, MapPin, Wrench, AlertCircle, DollarSign } from "lucide-react";

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

export default function ReceiptPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/device_receipts?id=eq.${id}`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        const data = await response.json();
        if (data && data.length > 0) {
          setReceipt(data[0]);
        } else {
          setError("الإيصال غير موجود");
        }
      } catch (err) {
        setError("حدث خطأ أثناء تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [id]);

  const handlePrint = () => window.print();

  const handleWhatsAppShare = () => {
    const text = `📄 *إيصال سحب جهاز* 📄\n━━━━━━━━━━━━━━\n🔢 *رقم الأوردر:* ${receipt.order_number}\n👤 *العميل:* ${receipt.customer_name}\n🔧 *الجهاز:* ${receipt.device_type} - ${receipt.brand}\n💰 *العربون:* ${receipt.deposit_amount} ج.م\n📝 *الحالة:* ${receipt.device_condition}\n━━━━━━━━━━━━━━\n🔗 *رابط الإيصال:* ${window.location.href}\n\n*شكراً لثقتكم بنا!* 🌟`;
    window.open(`https://wa.me/${receipt.phone.startsWith('2') ? receipt.phone : '2' + receipt.phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("✅ تم نسخ رابط الإيصال");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 print:shadow-none print:border-none print:m-0">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-orange-600 p-3 rounded-2xl">
              <Package className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-1">إيصال سحب جهاز</h1>
          <p className="text-slate-400 text-sm">Maintenance Guide - دليل الصيانة</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          
          {/* Order Info */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <span className="text-slate-400 text-xs block mb-1">رقم الأوردر</span>
              <span className="font-mono font-bold text-lg text-slate-900">{receipt.order_number}</span>
            </div>
            <div className="text-left">
              <span className="text-slate-400 text-xs block mb-1">التاريخ</span>
              <span className="font-bold text-slate-900">{new Date(receipt.created_at).toLocaleDateString("ar-EG")}</span>
            </div>
          </div>

          {/* Customer & Device Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-orange-600 flex items-center gap-2">
                <User className="w-4 h-4" /> بيانات العميل
              </h3>
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                <p className="text-slate-900 font-bold">{receipt.customer_name}</p>
                <p className="text-slate-500 flex items-center gap-2 text-sm">
                  <Phone className="w-3 h-3" /> {receipt.phone}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-orange-600 flex items-center gap-2">
                <Wrench className="w-4 h-4" /> بيانات الجهاز
              </h3>
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                <p className="text-slate-900 font-bold">{receipt.device_type} - {receipt.brand}</p>
                <p className="text-slate-500 text-sm">{receipt.problem_description || 'لا يوجد وصف للمشكلة'}</p>
              </div>
            </div>
          </div>

          {/* Receipt Details */}
          <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-orange-600 text-white p-2 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">العربون المستلم</span>
                  <span className="text-2xl font-black text-slate-900">{receipt.deposit_amount} <small className="text-sm font-normal">ج.م</small></span>
                </div>
              </div>
              <div className="text-left">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">تم الاستلام</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-orange-200">
              <span className="text-slate-500 text-xs block mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> حالة الجهاز عند الاستلام
              </span>
              <p className="text-slate-800 font-medium leading-relaxed">
                {receipt.device_condition}
              </p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center space-y-2 py-4">
            <p className="text-slate-400 text-xs">يتم الاحتفاظ بهذا الإيصال لحين استلام الجهاز بعد الصيانة</p>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-1 h-1 bg-slate-200 rounded-full"></div>)}
            </div>
          </div>

        </div>

        {/* Action Buttons - Hidden on Print */}
        <div className="bg-slate-50 p-6 flex flex-wrap gap-3 justify-center border-t border-slate-100 print:hidden">
          <button 
            onClick={handlePrint}
            className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-all"
          >
            <Printer className="w-4 h-4" /> طباعة
          </button>
          <button 
            onClick={copyLink}
            className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-all"
          >
            <Share2 className="w-4 h-4" /> نسخ الرابط
          </button>
          <button 
            onClick={handleWhatsAppShare}
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-900/20"
          >
            <MessageCircle className="w-4 h-4" /> إرسال واتساب
          </button>
        </div>

      </div>
      
      <div className="mt-8 text-center print:hidden">
        <button 
          onClick={() => window.history.back()}
          className="text-slate-400 hover:text-slate-600 flex items-center gap-2 mx-auto text-sm font-medium"
        >
          <ArrowRight className="w-4 h-4" /> العودة للوحة التحكم
        </button>
      </div>
    </div>
  );
}
