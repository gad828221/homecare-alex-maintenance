import { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import { Download, Printer, Send, Copy, Check, MapPin, Phone, MessageCircle, Clock, ShieldCheck, User, Wrench, AlertCircle, Edit2, Save, X } from "lucide-react";

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

export default function PickupReceiptPage() {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    deposit_amount: 0,
    technician_notes: "",
    admin_notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // جلب المستخدم الحالي من localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  // جلب بيانات الأوردر من الرابط
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("id");
    if (!orderId) {
      setError("رقم الأوردر غير موجود");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const data = await response.json();
        if (data && data.length > 0) {
          const orderData = data[0];
          setOrder(orderData);
          setEditForm({
            deposit_amount: orderData.deposit_amount || 0,
            technician_notes: orderData.technician_notes || "",
            admin_notes: orderData.admin_notes || ""
          });
        } else {
          setError("الأوردر غير موجود");
        }
      } catch (err) {
        console.error(err);
        setError("حدث خطأ في الاتصال بقاعدة البيانات");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, []);

  // التحقق من صلاحية التعديل (مدير أو فني)
  const canEdit = () => {
    if (!currentUser) return false;
    const role = currentUser.role;
    return role === 'admin' || role === 'tech';
  };

  // حفظ التعديلات
  const saveChanges = async () => {
    if (!order) return;
    setSaving(true);
    try {
      const updatedFields = {
        deposit_amount: editForm.deposit_amount,
        technician_notes: editForm.technician_notes,
        admin_notes: editForm.admin_notes,
        receipt_updated_by: currentUser?.name || currentUser?.username || 'غير معروف',
        receipt_updated_at: new Date().toISOString()
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`, {
        method: 'PATCH',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });

      if (response.ok) {
        setOrder({ ...order, ...updatedFields });
        setIsEditing(false);
        alert("✅ تم حفظ التعديلات بنجاح");
      } else {
        alert("❌ فشل حفظ التعديلات");
      }
    } catch (err) {
      console.error(err);
      alert("❌ حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/[^\d]/g, '');
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    if (cleaned.length === 10) cleaned = '20' + cleaned;
    return cleaned;
  };

  const downloadPDF = async () => {
    if (!receiptRef.current) return;
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 10;

      pdf.setFillColor(147, 51, 234);
      pdf.rect(0, 0, pageWidth, 35, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text("🔧 Maintenance Guide", pageWidth / 2, 12, { align: "center" });
      pdf.setFontSize(12);
      pdf.text("إيصال سحب جهاز للصيانة", pageWidth / 2, 22, { align: "center" });
      pdf.setFontSize(10);
      pdf.text("خدمة صيانة 24 ساعة بالمنزل | 01278885772 | 01558625259", pageWidth / 2, 30, { align: "center" });
      yPosition = 40;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.text("📄 إيصال سحب جهاز", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");
      pdf.text(`رقم الإيصال: ${order?.order_number || order?.id}`, 15, yPosition);
      pdf.text(`التاريخ: ${new Date(order?.created_at || new Date()).toLocaleDateString('ar-EG')}`, pageWidth - 15, yPosition, { align: "right" });
      yPosition += 10;

      pdf.setFont(undefined, "bold");
      pdf.text("👤 بيانات العميل", 15, yPosition);
      yPosition += 7;
      pdf.setFont(undefined, "normal");
      pdf.text(`الاسم: ${order?.customer_name || '-'}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`الهاتف: ${order?.phone || '-'}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`العنوان: ${order?.address || '-'}`, 20, yPosition);
      yPosition += 10;

      pdf.setFont(undefined, "bold");
      pdf.text("🔧 بيانات الجهاز المسحوب", 15, yPosition);
      yPosition += 7;
      pdf.setFont(undefined, "normal");
      pdf.text(`الجهاز: ${order?.device_type || '-'}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`الماركة: ${order?.brand || '-'}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`وصف العطل: ${order?.problem_description || '-'}`, 20, yPosition);
      yPosition += 10;

      // إضافة العربون
      pdf.setFont(undefined, "bold");
      pdf.text(`💰 العربون المدفوع: ${order?.deposit_amount || 0} ج.م`, 15, yPosition);
      yPosition += 10;

      // ملاحظات الفني والمدير
      if (order?.technician_notes) {
        pdf.setFont(undefined, "bold");
        pdf.text("📝 ملاحظات الفني:", 15, yPosition);
        yPosition += 6;
        pdf.setFont(undefined, "normal");
        pdf.text(order.technician_notes, 20, yPosition);
        yPosition += 8;
      }
      if (order?.admin_notes) {
        pdf.setFont(undefined, "bold");
        pdf.text("📋 ملاحظات الإدارة:", 15, yPosition);
        yPosition += 6;
        pdf.setFont(undefined, "normal");
        pdf.text(order.admin_notes, 20, yPosition);
        yPosition += 8;
      }

      pdf.setFont(undefined, "bold");
      pdf.text("📝 حالة الجهاز عند الاستلام", 15, yPosition);
      yPosition += 7;
      pdf.setFont(undefined, "normal");
      pdf.text("تم سحب الجهاز لإجراء الفحص الشامل والإصلاح في المركز.", 20, yPosition);
      yPosition += 10;

      pdf.setFont(undefined, "bold");
      pdf.text("📋 ملاحظات هامة", 15, yPosition);
      yPosition += 7;
      pdf.setFont(undefined, "normal");
      const terms = [
        "يتم التواصل مع العميل لتحديد التكلفة قبل البدء في الإصلاح",
        "المركز مسؤول عن الجهاز طوال فترة تواجده لديه",
        "يرجى الاحتفاظ بهذا الإيصال لاستلام الجهاز",
        "خدمة الصيانة متاحة 24 ساعة طوال أيام الأسبوع"
      ];
      terms.forEach(term => {
        pdf.text(`• ${term}`, 20, yPosition);
        yPosition += 5;
      });
      yPosition += 10;

      if (order?.receipt_updated_at) {
        pdf.setFontSize(8);
        pdf.setTextColor(100);
        pdf.text(`آخر تحديث: ${new Date(order.receipt_updated_at).toLocaleString('ar-EG')} بواسطة ${order.receipt_updated_by || ''}`, pageWidth / 2, yPosition, { align: "center" });
      }

      pdf.save(`إيصال_سحب_${order?.order_number || "order"}.pdf`);
    } catch (err) {
      alert("❌ حدث خطأ في تحميل PDF");
    }
  };

  const sendViaWhatsApp = () => {
    if (!order.phone) {
      alert("❌ رقم الهاتف غير موجود");
      return;
    }

    const phone = formatPhoneForWhatsApp(order.phone);
    const message = `📋 *إيصال سحب جهاز للصيانة* 📋\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ تم استلام جهازك بنجاح للفحص\n\n` +
      `🔢 *رقم الإيصال:* ${order.order_number || order.id}\n` +
      `📅 *تاريخ الاستلام:* ${new Date(order?.created_at || new Date()).toLocaleDateString('ar-EG')}\n\n` +
      `👤 *بيانات العميل:*\n` +
      `  • الاسم: ${order.customer_name}\n` +
      `  • الهاتف: ${order.phone}\n` +
      `  • العنوان: ${order.address || 'غير محدد'}\n\n` +
      `🔧 *بيانات الجهاز:*\n` +
      `  • الجهاز: ${order.device_type}\n` +
      `  • الماركة: ${order.brand}\n` +
      `  • المشكلة: ${order.problem_description || 'غير محددة'}\n\n` +
      `💰 *العربون المدفوع:* ${order.deposit_amount || 0} ج.م\n\n` +
      (order.technician_notes ? `📝 *ملاحظات الفني:*\n${order.technician_notes}\n\n` : '') +
      (order.admin_notes ? `📋 *ملاحظات الإدارة:*\n${order.admin_notes}\n\n` : '') +
      `📝 *ملاحظة:* سيتم التواصل معك بعد الفحص لتحديد تكلفة الإصلاح.\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📞 للاستفسار والدعم الفني:\n` +
      `  📱 01278885772\n` +
      `  📲 01558625259\n\n` +
      `✨ شكراً لثقتك بنا - Maintenance Guide`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) return <div className="p-8 text-center">جاري تحميل الإيصال...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!order) return <div className="p-8 text-center">لا توجد بيانات</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-3xl mx-auto">
        {/* Receipt Card */}
        <div ref={receiptRef} className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 mb-8">
          <div className="bg-purple-600 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="relative z-10">
              <h1 className="text-3xl font-black mb-2">🔧 Maintenance Guide</h1>
              <p className="text-purple-100 font-bold">إيصال سحب جهاز للصيانة</p>
            </div>
          </div>

          <div className="p-8">
            <div className="flex justify-between items-start mb-10 border-b border-slate-100 pb-6">
              <div>
                <p className="text-slate-400 text-xs font-bold mb-1">رقم الإيصال</p>
                <p className="text-xl font-black text-slate-900">{order.order_number || order.id}</p>
              </div>
              <div className="text-left">
                <p className="text-slate-400 text-xs font-bold mb-1">التاريخ</p>
                <p className="text-lg font-black text-slate-900">{new Date(order.created_at || new Date()).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-purple-600 font-black border-b border-purple-50 pb-2">
                  <User className="w-5 h-5" /> بيانات العميل
                </h3>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-600">الاسم: <span className="text-slate-900">{order.customer_name}</span></p>
                  <p className="text-sm font-bold text-slate-600">الهاتف: <span className="text-slate-900">{order.phone}</span></p>
                  <p className="text-sm font-bold text-slate-600">العنوان: <span className="text-slate-900">{order.address}</span></p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-purple-600 font-black border-b border-purple-50 pb-2">
                  <Wrench className="w-5 h-5" /> بيانات الجهاز
                </h3>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-600">الجهاز: <span className="text-slate-900">{order.device_type}</span></p>
                  <p className="text-sm font-bold text-slate-600">الماركة: <span className="text-slate-900">{order.brand}</span></p>
                  <p className="text-sm font-bold text-slate-600">العطل: <span className="text-slate-900">{order.problem_description || 'غير محدد'}</span></p>
                </div>
              </div>
            </div>

            {/* قسم العربون والملاحظات القابلة للتعديل */}
            <div className="border-t border-b border-purple-100 py-6 mb-10">
              {isEditing && canEdit() ? (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">💰 قيمة العربون (ج.م)</label>
                    <input
                      type="number"
                      value={editForm.deposit_amount}
                      onChange={(e) => setEditForm({ ...editForm, deposit_amount: Number(e.target.value) })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">📝 ملاحظات الفني</label>
                    <textarea
                      rows={3}
                      value={editForm.technician_notes}
                      onChange={(e) => setEditForm({ ...editForm, technician_notes: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      placeholder="أضف ملاحظاتك هنا..."
                    />
                  </div>
                  {currentUser?.role === 'admin' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">📋 ملاحظات المدير</label>
                      <textarea
                        rows={3}
                        value={editForm.admin_notes}
                        onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                        placeholder="أضف ملاحظات الإدارة..."
                      />
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button onClick={saveChanges} disabled={saving} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      <Save className="w-4 h-4" /> {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                    </button>
                    <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400">
                      <X className="w-4 h-4" /> إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-black text-purple-600">💰 العربون المدفوع</h3>
                    {canEdit() && (
                      <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200">
                        <Edit2 className="w-3 h-3" /> تعديل
                      </button>
                    )}
                  </div>
                  <p className="text-2xl font-black text-green-600 mb-6">{order.deposit_amount || 0} ج.م</p>

                  {order.technician_notes && (
                    <div className="mb-4">
                      <h4 className="font-bold text-slate-700 flex items-center gap-1">📝 ملاحظات الفني</h4>
                      <p className="text-slate-600 bg-slate-50 p-3 rounded-lg mt-1">{order.technician_notes}</p>
                    </div>
                  )}
                  {order.admin_notes && (
                    <div className="mb-4">
                      <h4 className="font-bold text-slate-700 flex items-center gap-1">📋 ملاحظات الإدارة</h4>
                      <p className="text-slate-600 bg-slate-50 p-3 rounded-lg mt-1">{order.admin_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-purple-50 p-6 rounded-2xl mb-10 border border-purple-100">
              <h4 className="flex items-center gap-2 text-purple-700 font-black mb-3">
                <AlertCircle className="w-5 h-5" /> ملاحظات هامة:
              </h4>
              <ul className="space-y-2 text-sm text-purple-800 font-bold">
                <li className="flex items-center gap-2">• سيتم الفحص وإبلاغكم بالتكلفة قبل الإصلاح.</li>
                <li className="flex items-center gap-2">• المركز مسؤول عن الجهاز طوال فترة تواجده لديه.</li>
                <li className="flex items-center gap-2">• يرجى إبراز هذا الإيصال عند الاستلام.</li>
              </ul>
            </div>

            {order.receipt_updated_at && (
              <div className="text-center text-xs text-slate-400 mt-4">
                آخر تحديث: {new Date(order.receipt_updated_at).toLocaleString('ar-EG')} بواسطة {order.receipt_updated_by || ''}
              </div>
            )}

            <div className="text-center pt-6 border-t border-slate-100">
              <p className="text-slate-400 text-xs font-bold mb-2">Maintenance Guide - خدمة صيانة 24 ساعة بالمنزل</p>
              <div className="flex justify-center gap-6 text-slate-900 font-black">
                <span>📞 01278885772</span>
                <span>📲 01558625259</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
          <button onClick={downloadPDF} className="flex flex-col items-center gap-2 bg-white p-4 rounded-2xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all">
            <Download className="w-6 h-6 text-purple-600" />
            <span className="text-xs font-black">تحميل PDF</span>
          </button>
          <button onClick={() => window.print()} className="flex flex-col items-center gap-2 bg-white p-4 rounded-2xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all">
            <Printer className="w-6 h-6 text-blue-600" />
            <span className="text-xs font-black">طباعة</span>
          </button>
          <button onClick={sendViaWhatsApp} className="flex flex-col items-center gap-2 bg-white p-4 rounded-2xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all">
            <MessageCircle className="w-6 h-6 text-green-600" />
            <span className="text-xs font-black">واتساب</span>
          </button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }} 
            className="flex flex-col items-center gap-2 bg-white p-4 rounded-2xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all"
          >
            {copied ? <Check className="w-6 h-6 text-green-600" /> : <Copy className="w-6 h-6 text-slate-600" />}
            <span className="text-xs font-black">{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none; }
          body { background: white; padding: 0; }
          .min-h-screen { background: white; }
          .shadow-2xl { shadow: none; }
          .rounded-3xl { border-radius: 0; }
        }
      `}</style>
    </div>
  );
}
