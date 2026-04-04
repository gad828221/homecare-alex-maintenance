import { useState, useEffect } from "react";

// إعدادات Supabase
const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

// دالة مساعدة للـ fetch
const fetchAPI = async (endpoint: string, options?: RequestInit) => {
  const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export default function ProtectedOrders() {
  // State
  const [orders, setOrders] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'technicians'>('orders');
  
  // States for modals
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingTech, setEditingTech] = useState<any>(null);
  const [formData, setFormData] = useState({ customer_name: '', phone: '', device: '', address: '', brand: '', problem: '', status: 'pending' });
  const [techForm, setTechForm] = useState({ name: '', phone: '', specialization: '', is_active: true });
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, cancelled: 0 });

  // جلب البيانات
  const fetchData = async () => {
    try {
      const [ordersData, techsData] = await Promise.all([
        fetchAPI('orders?select=*&order=created_at.desc'),
        fetchAPI('technicians?select=*')
      ]);
      setOrders(ordersData);
      setTechnicians(techsData);
      // تحديث الإحصائيات
      const pending = ordersData.filter((o: any) => o.status === 'pending').length;
      const inProgress = ordersData.filter((o: any) => o.status === 'in-progress').length;
      const completed = ordersData.filter((o: any) => o.status === 'completed').length;
      const cancelled = ordersData.filter((o: any) => o.status === 'cancelled').length;
      setStats({ pending, inProgress, completed, cancelled });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // تحديث حالة الأوردر
  const updateOrderStatus = async (id: number, newStatus: string) => {
    await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
    fetchData();
  };

  // حذف أوردر
  const deleteOrder = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الأوردر؟')) {
      await fetchAPI(`orders?id=eq.${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  // إضافة أو تعديل أوردر
  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOrder) {
      await fetchAPI(`orders?id=eq.${editingOrder.id}`, { method: 'PATCH', body: JSON.stringify(formData) });
    } else {
      await fetchAPI('orders', { method: 'POST', body: JSON.stringify({ ...formData, date: new Date().toLocaleString("ar-EG") }) });
    }
    setShowOrderModal(false);
    setEditingOrder(null);
    setFormData({ customer_name: '', phone: '', device: '', address: '', brand: '', problem: '', status: 'pending' });
    fetchData();
  };

  // إدارة الفنيين
  const saveTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTech) {
      await fetchAPI(`technicians?id=eq.${editingTech.id}`, { method: 'PATCH', body: JSON.stringify(techForm) });
    } else {
      await fetchAPI('technicians', { method: 'POST', body: JSON.stringify(techForm) });
    }
    setShowTechModal(false);
    setEditingTech(null);
    setTechForm({ name: '', phone: '', specialization: '', is_active: true });
    fetchData();
  };

  const deleteTechnician = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الفني؟')) {
      await fetchAPI(`technicians?id=eq.${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  // تصدير الأوردرات إلى CSV
  const exportToCSV = () => {
    const headers = ['ID', 'العميل', 'الهاتف', 'الجهاز', 'الماركة', 'المشكلة', 'الحالة', 'التاريخ'];
    const rows = orders.map(o => [o.id, o.customer_name, o.phone, o.device, o.brand, o.problem, o.status, o.date]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-white text-center">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="container max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-white">🔧 لوحة تحكم المدير</h1>
          <div className="flex gap-3">
            <button onClick={() => { setEditingOrder(null); setFormData({ customer_name: '', phone: '', device: '', address: '', brand: '', problem: '', status: 'pending' }); setShowOrderModal(true); }} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">➕ أوردر جديد</button>
            <button onClick={exportToCSV} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">📎 تصدير CSV</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-t-lg ${activeTab === 'orders' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>📋 الأوردرات</button>
          <button onClick={() => setActiveTab('technicians')} className={`px-4 py-2 rounded-t-lg ${activeTab === 'technicians' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>👨‍🔧 الفنيين</button>
        </div>

        {/* إحصائيات (تظهر فقط في تبويب الأوردرات) */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800 p-3 rounded-lg text-center border border-yellow-500/30"><p className="text-yellow-400 text-2xl font-bold">{stats.pending}</p><p className="text-slate-400 text-sm">قيد الانتظار</p></div>
            <div className="bg-slate-800 p-3 rounded-lg text-center border border-blue-500/30"><p className="text-blue-400 text-2xl font-bold">{stats.inProgress}</p><p className="text-slate-400 text-sm">قيد التنفيذ</p></div>
            <div className="bg-slate-800 p-3 rounded-lg text-center border border-green-500/30"><p className="text-green-400 text-2xl font-bold">{stats.completed}</p><p className="text-slate-400 text-sm">مكتمل</p></div>
            <div className="bg-slate-800 p-3 rounded-lg text-center border border-red-500/30"><p className="text-red-400 text-2xl font-bold">{stats.cancelled}</p><p className="text-slate-400 text-sm">ملغي</p></div>
          </div>
        )}

        {/* محتوى تبويب الأوردرات */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-800/50 text-slate-300">
                <tr>
                  <th className="p-3">العميل</th><th className="p-3">الهاتف</th><th className="p-3">الجهاز</th><th className="p-3">الماركة</th><th className="p-3">المشكلة</th><th className="p-3">الحالة</th><th className="p-3">التاريخ</th><th className="p-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                    <td className="p-3 text-white">{order.customer_name || '-'}</td>
                    <td className="p-3 text-white">{order.phone || '-'}</td>
                    <td className="p-3 text-white">{order.device || '-'}</td>
                    <td className="p-3 text-white">{order.brand || '-'}</td>
                    <td className="p-3 text-white">{order.problem || '-'}</td>
                    <td className="p-3">
                      <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className="bg-slate-700 text-white rounded px-2 py-1 text-xs">
                        <option value="pending">⏳ قيد الانتظار</option>
                        <option value="in-progress">🔧 قيد التنفيذ</option>
                        <option value="completed">✅ مكتمل</option>
                        <option value="cancelled">❌ ملغي</option>
                      </select>
                    </td>
                    <td className="p-3 text-slate-400 text-xs">{order.date || '-'}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => { setEditingOrder(order); setFormData(order); setShowOrderModal(true); }} className="text-blue-400 hover:text-blue-300 text-xs">✏️ تعديل</button>
                      <button onClick={() => deleteOrder(order.id)} className="text-red-400 hover:text-red-300 text-xs">🗑️ حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && <div className="text-center py-12 text-slate-400">لا توجد أوردرات</div>}
          </div>
        )}

        {/* محتوى تبويب الفنيين */}
        {activeTab === 'technicians' && (
          <div>
            <div className="flex justify-end mb-4"><button onClick={() => { setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true }); setShowTechModal(true); }} className="px-4 py-2 bg-green-600 text-white rounded-lg">➕ إضافة فني</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {technicians.map(tech => (
                <div key={tech.id} className="bg-slate-800 p-4 rounded-lg border border-orange-500/30">
                  <h3 className="text-white font-bold text-lg">{tech.name}</h3>
                  <p className="text-slate-400 text-sm">📞 {tech.phone || 'غير متوفر'}</p>
                  <p className="text-slate-400 text-sm">🔧 {tech.specialization || 'عام'}</p>
                  <p className={`text-xs mt-2 ${tech.is_active ? 'text-green-400' : 'text-red-400'}`}>{tech.is_active ? 'نشط' : 'غير نشط'}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { setEditingTech(tech); setTechForm(tech); setShowTechModal(true); }} className="text-blue-400 text-sm">تعديل</button>
                    <button onClick={() => deleteTechnician(tech.id)} className="text-red-400 text-sm">حذف</button>
                  </div>
                </div>
              ))}
              {technicians.length === 0 && <div className="text-center py-12 text-slate-400 col-span-full">لا يوجد فنيون</div>}
            </div>
          </div>
        )}

        {/* مودال إضافة/تعديل أوردر */}
        {showOrderModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowOrderModal(false)}>
            <div className="bg-slate-800 rounded-xl max-w-lg w-full p-6 border border-orange-500/30" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-white mb-4">{editingOrder ? 'تعديل أوردر' : 'إضافة أوردر جديد'}</h2>
              <form onSubmit={saveOrder} className="space-y-3">
                <input type="text" placeholder="اسم العميل" value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} className="w-full p-2 rounded bg-slate-700 text-white" required />
                <input type="tel" placeholder="رقم الهاتف" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 rounded bg-slate-700 text-white" required />
                <input type="text" placeholder="الجهاز" value={formData.device} onChange={e => setFormData({...formData, device: e.target.value})} className="w-full p-2 rounded bg-slate-700 text-white" />
                <input type="text" placeholder="الماركة" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full p-2 rounded bg-slate-700 text-white" />
                <input type="text" placeholder="العنوان" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2 rounded bg-slate-700 text-white" />
                <input type="text" placeholder="وصف المشكلة" value={formData.problem} onChange={e => setFormData({...formData, problem: e.target.value})} className="w-full p-2 rounded bg-slate-700 text-white" />
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full p-2 rounded bg-slate-700 text-white">
                  <option value="pending">قيد الانتظار</option><option value="in-progress">قيد التنفيذ</option><option value="completed">مكتمل</option><option value="cancelled">ملغي</option>
                </select>
                <div className="flex gap-2 mt-4"><button type="submit" className="flex-1 bg-orange-600 text-white py-2 rounded-lg">حفظ</button><button type="button" onClick={() => setShowOrderModal(false)} className="flex-1 bg-slate-600 text-white py-2 rounded-lg">إلغاء</button></div>
              </form>
            </div>
          </div>
        )}

        {/* مودال إضافة/تعديل فني */}
        {showTechModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowTechModal(false)}>
            <div className="bg-slate-800 rounded-xl max-w-lg w-full p-6 border border-orange-500/30" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-white mb-4">{editingTech ? 'تعديل فني' : 'إضافة فني جديد'}</h2>
              <form onSubmit={saveTechnician} className="space-y-3">
                <input type="text" placeholder="الاسم" value={techForm.name} onChange={e => setTechForm({...techForm, name: e.target.value})} className="w-full p-2 rounded bg-slate-700 text-white" required />
                <input type="tel" placeholder="رقم الهاتف" value={techForm.phone} onChange={e => setTechForm({...techForm, phone: e.target.value})} className="w-full p-2 rounded bg-slate-700 text-white" />
                <input type="text" placeholder="التخصص" value={techForm.specialization} onChange={e => setTechForm({...techForm, specialization: e.target.value})} className="w-full p-2 rounded bg-slate-700 text-white" />
                <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={techForm.is_active} onChange={e => setTechForm({...techForm, is_active: e.target.checked})} /> نشط</label>
                <div className="flex gap-2 mt-4"><button type="submit" className="flex-1 bg-orange-600 text-white py-2 rounded-lg">حفظ</button><button type="button" onClick={() => setShowTechModal(false)} className="flex-1 bg-slate-600 text-white py-2 rounded-lg">إلغاء</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
