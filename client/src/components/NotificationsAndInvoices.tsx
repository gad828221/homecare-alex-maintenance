import React, { useState, useEffect, useCallback } from 'react';
import { Bell, FileText, Send, CheckCircle, AlertCircle, Download, Eye, X } from 'lucide-react';

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

export default function NotificationsAndInvoices() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'notifications' | 'invoices'>('notifications');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [invoiceData, setInvoiceData] = useState({
    parts: '', labor: '', transport: '', notes: ''
  });

  const fetchAPI = async (endpoint: string, options?: RequestInit) => {
    const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      ...options,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  // جلب الإشعارات
  const fetchNotifications = useCallback(async () => {
    try {
      const data = await fetchAPI('orders?select=*&order=created_at.desc&limit=20');
      const notifs = data.map((order: any) => ({
        id: order.id,
        type: 'new_order',
        message: `أوردر جديد من ${order.customer_name}`,
        customer: order.customer_name,
        technician: order.technician,
        date: order.date,
        read: false
      }));
      setNotifications(notifs);
    } catch (e) {
      console.error('خطأ في جلب الإشعارات:', e);
    }
  }, []);

  // جلب الفواتير
  const fetchInvoices = useCallback(async () => {
    try {
      const data = await fetchAPI('invoices?select=*&order=created_at.desc');
      setInvoices(data);
    } catch (e) {
      console.error('خطأ في جلب الفواتير:', e);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchInvoices();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchInvoices();
    }, 30000); // تحديث كل 30 ثانية
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchInvoices]);

  // إنشاء فاتورة
  const createInvoice = async () => {
    if (!selectedOrder) return;
    try {
      const invoice = {
        order_id: selectedOrder.id,
        customer_name: selectedOrder.customer_name,
        technician: selectedOrder.technician,
        parts_cost: parseFloat(invoiceData.parts) || 0,
        labor_cost: parseFloat(invoiceData.labor) || 0,
        transport_cost: parseFloat(invoiceData.transport) || 0,
        total: (parseFloat(invoiceData.parts) || 0) + (parseFloat(invoiceData.labor) || 0) + (parseFloat(invoiceData.transport) || 0),
        notes: invoiceData.notes,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      await fetchAPI('invoices', {
        method: 'POST',
        body: JSON.stringify(invoice)
      });

      setShowInvoiceModal(false);
      setInvoiceData({ parts: '', labor: '', transport: '', notes: '' });
      fetchInvoices();
      alert('✅ تم إنشاء الفاتورة بنجاح!');
    } catch (e) {
      alert('❌ خطأ في إنشاء الفاتورة');
    }
  };

  // إرسال الفاتورة عبر WhatsApp
  const sendInvoiceViaWhatsApp = async (invoice: any) => {
    const message = `
📋 *فاتورة الصيانة*
━━━━━━━━━━━━━━━━
👤 العميل: ${invoice.customer_name}
🔧 الفني: ${invoice.technician}
━━━━━━━━━━━━━━━━
💰 تفاصيل التكاليف:
  • قطع الغيار: ${invoice.parts_cost} ج.م
  • العمالة: ${invoice.labor_cost} ج.م
  • المواصلات: ${invoice.transport_cost} ج.م
━━━━━━━━━━━━━━━━
📊 الإجمالي: ${invoice.total} ج.م
━━━━━━━━━━━━━━━━
📝 ملاحظات: ${invoice.notes || 'لا توجد'}
    `;
    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMsg}`, '_blank');
  };

  // تحديث حالة الفاتورة
  const approveInvoice = async (invoiceId: number) => {
    try {
      await fetchAPI(`invoices?id=eq.${invoiceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' })
      });
      fetchInvoices();
      alert('✅ تم الموافقة على الفاتورة!');
    } catch (e) {
      alert('❌ خطأ في الموافقة');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition ${
              activeTab === 'notifications'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Bell size={20} /> الإشعارات ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition ${
              activeTab === 'invoices'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <FileText size={20} /> الفواتير ({invoices.length})
          </button>
        </div>

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="bg-slate-800 p-8 rounded-lg text-center text-slate-400">
                لا توجد إشعارات حالياً
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className="bg-slate-800 p-4 rounded-lg border-l-4 border-orange-500 flex justify-between items-center">
                  <div>
                    <p className="text-white font-bold">{notif.message}</p>
                    <p className="text-slate-400 text-sm">الفني: {notif.technician || 'لم يحدد'}</p>
                    <p className="text-slate-500 text-xs mt-1">{notif.date}</p>
                  </div>
                  <Bell className="text-orange-400" size={24} />
                </div>
              ))
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setSelectedOrder(null);
                setShowInvoiceModal(true);
              }}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center gap-2"
            >
              <FileText size={20} /> فاتورة جديدة
            </button>

            <div className="space-y-3">
              {invoices.length === 0 ? (
                <div className="bg-slate-800 p-8 rounded-lg text-center text-slate-400">
                  لا توجد فواتير حالياً
                </div>
              ) : (
                invoices.map(invoice => (
                  <div key={invoice.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-white font-bold">{invoice.customer_name}</p>
                        <p className="text-slate-400 text-sm">الفني: {invoice.technician}</p>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-bold ${
                        invoice.status === 'approved' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                      }`}>
                        {invoice.status === 'approved' ? '✅ موافق عليه' : '⏳ قيد الانتظار'}
                      </span>
                    </div>

                    <div className="bg-slate-700/50 p-3 rounded mb-3 text-sm">
                      <p className="text-slate-300">💰 قطع الغيار: <span className="text-green-400">{invoice.parts_cost} ج.م</span></p>
                      <p className="text-slate-300">🔧 العمالة: <span className="text-blue-400">{invoice.labor_cost} ج.م</span></p>
                      <p className="text-slate-300">🚗 المواصلات: <span className="text-purple-400">{invoice.transport_cost} ج.م</span></p>
                      <p className="text-white font-bold mt-2">📊 الإجمالي: <span className="text-yellow-400">{invoice.total} ج.م</span></p>
                    </div>

                    <div className="flex gap-2">
                      {invoice.status === 'pending' && (
                        <button
                          onClick={() => approveInvoice(invoice.id)}
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-bold flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={16} /> الموافقة
                        </button>
                      )}
                      <button
                        onClick={() => sendInvoiceViaWhatsApp(invoice)}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold flex items-center justify-center gap-2"
                      >
                        <Send size={16} /> إرسال WhatsApp
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Invoice Modal */}
        {showInvoiceModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl max-w-lg w-full p-6 border border-orange-500/30">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">إنشاء فاتورة جديدة</h2>
                <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="number"
                  placeholder="تكلفة قطع الغيار"
                  value={invoiceData.parts}
                  onChange={e => setInvoiceData({...invoiceData, parts: e.target.value})}
                  className="w-full p-2 rounded bg-slate-700 text-white placeholder-slate-400"
                />
                <input
                  type="number"
                  placeholder="تكلفة العمالة"
                  value={invoiceData.labor}
                  onChange={e => setInvoiceData({...invoiceData, labor: e.target.value})}
                  className="w-full p-2 rounded bg-slate-700 text-white placeholder-slate-400"
                />
                <input
                  type="number"
                  placeholder="تكلفة المواصلات"
                  value={invoiceData.transport}
                  onChange={e => setInvoiceData({...invoiceData, transport: e.target.value})}
                  className="w-full p-2 rounded bg-slate-700 text-white placeholder-slate-400"
                />
                <textarea
                  placeholder="ملاحظات إضافية"
                  value={invoiceData.notes}
                  onChange={e => setInvoiceData({...invoiceData, notes: e.target.value})}
                  className="w-full p-2 rounded bg-slate-700 text-white placeholder-slate-400 h-20"
                />

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={createInvoice}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-bold"
                  >
                    ✅ إنشاء الفاتورة
                  </button>
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-lg"
                  >
                    ❌ إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
