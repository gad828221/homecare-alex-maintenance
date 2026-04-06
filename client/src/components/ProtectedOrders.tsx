import { useState, useEffect, useCallback } from "react";
import { 
  Plus, Download, Search, LayoutDashboard, Users, 
  Clock, CheckCircle2, AlertCircle, XCircle, 
  Edit, Trash2, RefreshCw, Phone,
  TrendingUp, Wallet, PieChart, Calendar, Copy, Check, MapPin
} from "lucide-react";

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

const fetchAPI = async (endpoint: string, options?: RequestInit) => {
  const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    headers: { 
      'apikey': supabaseKey, 
      'Authorization': `Bearer ${supabaseKey}`, 
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export default function ProtectedOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'technicians' | 'reports'>('orders');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingTech, setEditingTech] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    customer_name: '', phone: '', device: '', address: '', brand: '', problem: '', technician: '',
    status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, 
    net_amount: 0, company_share: 0, technician_share: 0, is_paid: false
  });

  const [customDevice, setCustomDevice] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [isOtherDevice, setIsOtherDevice] = useState(false);
  const [isOtherBrand, setIsOtherBrand] = useState(false);
  
  const [techForm, setTechForm] = useState({ name: '', phone: '', specialization: '', is_active: true });
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, cancelled: 0, totalIncome: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const [ordersData, techsData] = await Promise.all([
        fetchAPI('orders?select=*&order=created_at.desc'),
        fetchAPI('technicians?select=*')
      ]);
      setOrders(ordersData);
      setTechnicians(techsData);
      
      const pending = ordersData.filter((o: any) => o.status === 'pending').length;
      const inProgress = ordersData.filter((o: any) => o.status === 'in-progress').length;
      const completed = ordersData.filter((o: any) => o.status === 'completed').length;
      const cancelled = ordersData.filter((o: any) => o.status === 'cancelled').length;
      const totalIncome = ordersData.reduce((acc: number, o: any) => acc + (o.company_share || 0), 0);
      
      setStats({ pending, inProgress, completed, cancelled, totalIncome });
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const calculateAmounts = (data: any) => {
    const total = parseFloat(data.total_amount) || 0;
    const parts = parseFloat(data.parts_cost) || 0;
    const transport = parseFloat(data.transport_cost) || 0;
    
    const net = total - parts - transport;
    const companyShare = Math.round(net * 0.5); 
    const techShare = net - companyShare;
    
    return {
      ...data,
      net_amount: net,
      company_share: companyShare,
      technician_share: techShare
    };
  };

  const handleFormChange = (field: string, value: any) => {
    if (field === 'device') {
        if (value === 'other') {
            setIsOtherDevice(true);
            setFormData({ ...formData, device: '' });
            return;
        } else {
            setIsOtherDevice(false);
        }
    }
    if (field === 'brand') {
        if (value === 'other') {
            setIsOtherBrand(true);
            setFormData({ ...formData, brand: '' });
            return;
        } else {
            setIsOtherBrand(false);
        }
    }

    const updated = { ...formData, [field]: value };
    setFormData(calculateAmounts(updated));
  };

  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
        ...formData,
        device: isOtherDevice ? customDevice : formData.device,
        brand: isOtherBrand ? customBrand : formData.brand
    };

    try {
      if (editingOrder) {
        await fetchAPI(`orders?id=eq.${editingOrder.id}`, { method: 'PATCH', body: JSON.stringify(finalData) });
      } else {
        await fetchAPI('orders', { 
          method: 'POST', 
          body: JSON.stringify({ ...finalData, date: new Date().toLocaleString("ar-EG") }) 
        });
      }
      setShowOrderModal(false);
      setEditingOrder(null);
      resetForm();
      fetchData();
    } catch (err) { console.error(err); }
  };

  const resetForm = () => {
    setFormData({
        customer_name: '', phone: '', device: '', address: '', brand: '', problem: '', technician: '',
        status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, 
        net_amount: 0, company_share: 0, technician_share: 0, is_paid: false
    });
    setCustomDevice('');
    setCustomBrand('');
    setIsOtherDevice(false);
    setIsOtherBrand(false);
  };

  const deleteOrder = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الأوردر؟')) {
      try {
        await fetchAPI(`orders?id=eq.${id}`, { method: 'DELETE' });
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  const togglePaidStatus = async (id: number, currentStatus: boolean) => {
    try {
      await fetchAPI(`orders?id=eq.${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify({ is_paid: !currentStatus }) 
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const saveTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTech) {
        await fetchAPI(`technicians?id=eq.${editingTech.id}`, { method: 'PATCH', body: JSON.stringify(techForm) });
      } else {
        await fetchAPI('technicians', { method: 'POST', body: JSON.stringify(techForm) });
      }
      setShowTechModal(false);
      setEditingTech(null);
      setTechForm({ name: '', phone: '', specialization: '', is_active: true });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const deleteTechnician = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الفني؟')) {
      try {
        await fetchAPI(`technicians?id=eq.${id}`, { method: 'DELETE' });
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  const copyTechLink = (name: string, id: number) => {
    const link = `${window.location.origin}/tech-portal?name=${encodeURIComponent(name)}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.phone?.includes(searchTerm) ||
      o.technician?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading && orders.length === 0) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <RefreshCw className="w-12 h-12 text-orange-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20">
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/20">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">لوحة تحكم المدير</h1>
          </div>
          <button onClick={fetchData} className="p-2 text-slate-400 hover:text-white transition-all"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
            <p className="text-2xl font-black text-white">{orders.length}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase">إجمالي الأوردرات</p>
          </div>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
            <p className="text-2xl font-black text-yellow-500">{stats.pending}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase">قيد الانتظار</p>
          </div>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
            <p className="text-2xl font-black text-green-500">{stats.completed}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase">مكتمل</p>
          </div>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
            <p className="text-2xl font-black text-orange-500">{stats.totalIncome.toLocaleString()} ج.م</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase">أرباح الشركة</p>
          </div>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
            <p className="text-2xl font-black text-purple-500">{technicians.length}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase">فني متاح</p>
          </div>
        </div>

        <div className="flex gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 mb-6 w-fit">
          <button onClick={() => setActiveTab('orders')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`}>الأوردرات</button>
          <button onClick={() => setActiveTab('technicians')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'technicians' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`}>الفنيين</button>
          <button onClick={() => setActiveTab('reports')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'reports' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`}>التقارير</button>
        </div>

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input type="text" placeholder="ابحث عن عميل، هاتف، أو فني..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pr-12 pl-4 text-sm outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <button onClick={() => { setEditingOrder(null); resetForm(); setShowOrderModal(true); }} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-900/20"><Plus className="w-5 h-5" />أوردر جديد</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map(order => (
                <div key={order.id} className="bg-slate-900 rounded-3xl p-5 border border-slate-800 hover:border-slate-700 transition-all group relative overflow-hidden shadow-xl">
                  {!order.is_paid && order.status === 'completed' && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50 animate-pulse"></div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                      order.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                      order.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500' :
                      order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {order.status === 'completed' ? 'مكتمل' : order.status === 'in-progress' ? 'جاري العمل' : order.status === 'cancelled' ? 'ملغي' : 'قيد الانتظار'}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => togglePaidStatus(order.id, order.is_paid)} className={`p-2 rounded-xl transition-all ${order.is_paid ? 'bg-green-500/20 text-green-500' : 'bg-slate-800 text-slate-500'}`} title={order.is_paid ? 'تم التحصيل' : 'لم يتم التحصيل'}>
                        {order.is_paid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setEditingOrder(order); setFormData(order); setShowOrderModal(true); }} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => deleteOrder(order.id)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-white font-black text-lg truncate">{order.customer_name}</h3>
                    <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-800/50">
                      <div><p className="text-[10px] text-slate-500 font-bold uppercase">الإجمالي</p><p className="text-xs text-white font-bold">{order.total_amount || 0} ج.م</p></div>
                      <div><p className="text-[10px] text-slate-500 font-bold uppercase">الصافي</p><p className="text-xs text-green-500 font-bold">{order.net_amount || 0} ج.م</p></div>
                      <div><p className="text-[10px] text-slate-500 font-bold uppercase">قطع الغيار</p><p className="text-xs text-red-400 font-bold">{order.parts_cost || 0} ج.م</p></div>
                      <div><p className="text-[10px] text-slate-500 font-bold uppercase">المواصلات</p><p className="text-xs text-blue-400 font-bold">{order.transport_cost || 0} ج.م</p></div>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <div><p className="text-[10px] text-slate-500 font-bold uppercase">الفني</p><p className="text-sm font-black text-orange-400">{order.technician || 'لم يحدد'}</p></div>
                      <div className={`text-[10px] font-black px-2 py-1 rounded flex items-center gap-1 ${order.is_paid ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                        {order.is_paid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {order.is_paid ? 'تم التحصيل' : 'لم يحصل'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'technicians' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {technicians.map(tech => (
              <div key={tech.id} className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-center relative shadow-lg">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
                  <Users className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-white font-black text-lg">{tech.name}</h3>
                <p className="text-slate-500 text-xs font-bold mb-4">{tech.specialization}</p>
                <div className="flex flex-col gap-2">
                  <button onClick={() => copyTechLink(tech.name, tech.id)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all">
                    {copiedId === tech.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copiedId === tech.id ? 'تم النسخ' : 'نسخ رابط الفني'}
                  </button>
                  <div className="flex gap-2">
                    <a href={`tel:${tech.phone}`} className="flex-1 p-2 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500/20 flex justify-center transition-all"><Phone className="w-4 h-4" /></a>
                    <button onClick={() => { setEditingTech(tech); setTechForm(tech); setShowTechModal(true); }} className="flex-1 p-2 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 flex justify-center transition-all"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => deleteTechnician(tech.id)} className="flex-1 p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 flex justify-center transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => { setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true }); setShowTechModal(true); }} className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-900 hover:border-orange-500/50 transition-all text-slate-500 hover:text-orange-500">
              <Plus className="w-8 h-8" />
              <span className="font-bold">إضافة فني</span>
            </button>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl">
              <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-orange-500" />
                التقارير المالية والتحليلية
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-inner">
                  <PieChart className="w-8 h-8 text-blue-500 mb-4" />
                  <p className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-widest">إجمالي الإيرادات</p>
                  <p className="text-3xl font-black text-white">{orders.reduce((acc, o) => acc + (o.total_amount || 0), 0).toLocaleString()} ج.م</p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-inner">
                  <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
                  <p className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-widest">إجمالي المصاريف</p>
                  <p className="text-3xl font-black text-white">{orders.reduce((acc, o) => acc + (o.parts_cost || 0) + (o.transport_cost || 0), 0).toLocaleString()} ج.م</p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-inner">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mb-4" />
                  <p className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-widest">صافي أرباح الشركة</p>
                  <p className="text-3xl font-black text-white">{stats.totalIncome.toLocaleString()} ج.م</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl my-auto overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-black text-white">{editingOrder ? 'تعديل أوردر' : 'أوردر جديد'}</h2>
              <button onClick={() => setShowOrderModal(false)} className="p-2 text-slate-500 hover:text-white transition-all"><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={saveOrder} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase pr-2">اسم العميل</label><input type="text" required value={formData.customer_name} onChange={(e) => handleFormChange('customer_name', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-sm outline-none focus:border-orange-500 transition-all" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase pr-2">رقم الهاتف</label><input type="tel" required value={formData.phone} onChange={(e) => handleFormChange('phone', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-sm outline-none focus:border-orange-500 transition-all" /></div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase pr-2">الجهاز</label>
                  {!isOtherDevice ? (
                    <select required value={formData.device} onChange={(e) => handleFormChange('device', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-sm outline-none focus:border-orange-500 transition-all">
                      <option value="">اختر الجهاز</option>
                      <option value="ثلاجة">ثلاجة</option>
                      <option value="غسالة">غسالة</option>
                      <option value="تكييف">تكييف</option>
                      <option value="بوتاجاز">بوتاجاز</option>
                      <option value="سخان">سخان</option>
                      <option value="other">أخرى...</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input type="text" required placeholder="نوع الجهاز الجديد" value={customDevice} onChange={(e) => setCustomDevice(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-sm outline-none focus:border-orange-500 transition-all" />
                      <button type="button" onClick={() => setIsOtherDevice(false)} className="p-3 bg-slate-700 rounded-2xl text-slate-400"><XCircle className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase pr-2">الماركة</label>
                  {!isOtherBrand ? (
                    <select required value={formData.brand} onChange={(e) => handleFormChange('brand', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-sm outline-none focus:border-orange-500 transition-all">
                      <option value="">اختر الماركة</option>
                      <option value="سامسونج">سامسونج</option>
                      <option value="LG">LG</option>
                      <option value="شارب">شارب</option>
                      <option value="توشيبا">توشيبا</option>
                      <option value="يونيون اير">يونيون اير</option>
                      <option value="other">أخرى...</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input type="text" required placeholder="الماركة الجديدة" value={customBrand} onChange={(e) => setCustomBrand(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-sm outline-none focus:border-orange-500 transition-all" />
                      <button type="button" onClick={() => setIsOtherBrand(false)} className="p-3 bg-slate-700 rounded-2xl text-slate-400"><XCircle className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>

                <div className="space-y-1 md:col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase pr-2">العنوان</label><input type="text" value={formData.address} onChange={(e) => handleFormChange('address', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-sm outline-none focus:border-orange-500 transition-all" placeholder="العنوان بالتفصيل لسهولة الوصول" /></div>
                <div className="space-y-1 md:col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase pr-2">وصف العطل</label><textarea value={formData.problem} onChange={(e) => handleFormChange('problem', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-sm outline-none focus:border-orange-500 transition-all min-h-[80px]" placeholder="ما هي المشكلة التي يواجهها العميل؟"></textarea></div>
                <div className="space-y-1 md:col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase pr-2">الفني المكلف</label><select value={formData.technician} onChange={(e) => handleFormChange('technician', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-sm outline-none focus:border-orange-500 transition-all"><option value="">اختر فني</option>{technicians.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select></div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800">
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase pr-2">الإجمالي</label><input type="number" value={formData.total_amount} onChange={(e) => handleFormChange('total_amount', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition-all" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase pr-2">قطع الغيار</label><input type="number" value={formData.parts_cost} onChange={(e) => handleFormChange('parts_cost', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition-all" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase pr-2">المواصلات</label><input type="number" value={formData.transport_cost} onChange={(e) => handleFormChange('transport_cost', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition-all" /></div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-5 bg-slate-950 rounded-3xl border border-slate-800 shadow-inner">
                <div className="text-center"><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">نصيب الشركة (50%)</p><p className="text-xl font-black text-blue-500">{formData.company_share} ج.م</p></div>
                <div className="text-center border-r border-slate-800"><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">نصيب الفني (50%)</p><p className="text-xl font-black text-purple-500">{formData.technician_share} ج.م</p></div>
              </div>

              <div className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                <input type="checkbox" id="is_paid" checked={formData.is_paid} onChange={(e) => handleFormChange('is_paid', e.target.checked)} className="w-6 h-6 rounded-lg accent-orange-500" />
                <label htmlFor="is_paid" className="text-sm font-bold text-white cursor-pointer select-none">تم تحصيل المبلغ بالكامل من العميل</label>
              </div>

              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-orange-900/20 transition-all active:scale-95 mt-4">حفظ الأوردر والبيانات</button>
            </form>
          </div>
        </div>
      )}

      {/* Technician Modal */}
      {showTechModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-black text-white">{editingTech ? 'تعديل فني' : 'فني جديد'}</h2>
              <button onClick={() => setShowTechModal(false)} className="p-2 text-slate-500 hover:text-white transition-all"><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={saveTechnician} className="p-8 space-y-6">
              <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase pr-2">اسم الفني</label><input type="text" required value={techForm.name} onChange={(e) => setTechForm({ ...techForm, name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-sm outline-none focus:border-orange-500 transition-all" /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase pr-2">رقم الهاتف</label><input type="tel" required value={techForm.phone} onChange={(e) => setTechForm({ ...techForm, phone: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-sm outline-none focus:border-orange-500 transition-all" /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase pr-2">التخصص</label><input type="text" value={techForm.specialization} onChange={(e) => setTechForm({ ...techForm, specialization: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-sm outline-none focus:border-orange-500 transition-all" /></div>
              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-orange-900/20 transition-all active:scale-95 mt-4">حفظ الفني</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
