import { useState, useEffect, useCallback } from "react";
import { 
  Plus, Download, Search, LayoutDashboard, Users, 
  Clock, CheckCircle2, AlertCircle, XCircle, 
  MoreVertical, Edit, Trash2, Filter, RefreshCw,
  TrendingUp, Wallet, PieChart, Calendar
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
  const [formData, setFormData] = useState({
    customer_name: '', phone: '', device: '', address: '', brand: '', problem: '', technician: '',
    status: 'pending', total_amount: 0, expenses: 0, net_amount: 0, company_share: 0, technician_share: 0
  });
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
    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const calculateAmounts = (data: any) => {
    const total = parseFloat(data.total_amount) || 0;
    const expenses = parseFloat(data.expenses) || 0;
    const net = total - expenses;
    const companyShare = Math.round(net * 0.5); // 50% للشركة
    const techShare = net - companyShare;
    
    return {
      ...data,
      net_amount: net,
      company_share: companyShare,
      technician_share: techShare
    };
  };

  const handleFormChange = (field: string, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(calculateAmounts(updated));
  };

  const updateOrderStatus = async (id: number, newStatus: string) => {
    try {
      await fetchAPI(`orders?id=eq.${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify({ status: newStatus }) 
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const deleteOrder = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الأوردر؟')) {
      try {
        await fetchAPI(`orders?id=eq.${id}`, { method: 'DELETE' });
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOrder) {
        await fetchAPI(`orders?id=eq.${editingOrder.id}`, { method: 'PATCH', body: JSON.stringify(formData) });
      } else {
        await fetchAPI('orders', { 
          method: 'POST', 
          body: JSON.stringify({ ...formData, date: new Date().toLocaleString("ar-EG") }) 
        });
      }
      setShowOrderModal(false);
      setEditingOrder(null);
      setFormData({
        customer_name: '', phone: '', device: '', address: '', brand: '', problem: '', technician: '',
        status: 'pending', total_amount: 0, expenses: 0, net_amount: 0, company_share: 0, technician_share: 0
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

  const exportToCSV = () => {
    const headers = ['ID', 'العميل', 'الهاتف', 'الجهاز', 'الماركة', 'الفني', 'الحالة', 'الإجمالي', 'المصاريف', 'الصافي', 'نصيب الشركة', 'نصيب الفني', 'التاريخ'];
    const rows = orders.map(o => [o.id, o.customer_name, o.phone, o.device, o.brand, o.technician, o.status, o.total_amount, o.expenses, o.net_amount, o.company_share, o.technician_share, o.date]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `maintenance_orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
      <div className="text-center">
        <RefreshCw className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
        <p className="text-slate-400 font-medium">جاري تحميل البيانات...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 md:pb-0">
      {/* Sidebar / Top Nav */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/20">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">لوحة التحكم</h1>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">Maintenance Guide</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchData}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="h-8 w-[1px] bg-slate-800 mx-1"></div>
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-slate-300">متصل</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg"><TrendingUp className="w-5 h-5 text-blue-500" /></div>
              <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">إجمالي</span>
            </div>
            <p className="text-2xl font-black text-white">{orders.length}</p>
            <p className="text-[10px] text-slate-500 font-bold mt-1">أوردر مسجل</p>
          </div>
          
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-yellow-500/10 rounded-lg"><Clock className="w-5 h-5 text-yellow-500" /></div>
              <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">{stats.pending}</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.pending}</p>
            <p className="text-[10px] text-slate-500 font-bold mt-1">قيد الانتظار</p>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-green-500/10 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-500" /></div>
              <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">{stats.completed}</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.completed}</p>
            <p className="text-[10px] text-slate-500 font-bold mt-1">مكتمل</p>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-orange-500/10 rounded-lg"><Wallet className="w-5 h-5 text-orange-500" /></div>
              <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">الصافي</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.totalIncome.toLocaleString()} <span className="text-xs font-normal">ج.م</span></p>
            <p className="text-[10px] text-slate-500 font-bold mt-1">أرباح الشركة</p>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm col-span-2 lg:col-span-1">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg"><Users className="w-5 h-5 text-purple-500" /></div>
              <span className="text-[10px] font-bold text-purple-500 bg-purple-500/10 px-1.5 py-0.5 rounded">{technicians.length}</span>
            </div>
            <p className="text-2xl font-black text-white">{technicians.length}</p>
            <p className="text-[10px] text-slate-500 font-bold mt-1">فني متاح</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="ابحث عن عميل، هاتف، أو فني..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pr-12 pl-4 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm outline-none"
            >
              <option value="all">كل الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="in-progress">جاري العمل</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
            <button 
              onClick={() => { setEditingOrder(null); setShowOrderModal(true); }}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-900/20 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              أوردر جديد
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="flex gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 mb-6 w-fit">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            الأوردرات
          </button>
          <button 
            onClick={() => setActiveTab('technicians')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'technicians' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            الفنيين
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'reports' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            التقارير
          </button>
        </div>

        {/* Orders List (Mobile Friendly) */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="bg-slate-900 rounded-3xl p-20 text-center border border-slate-800">
                <AlertCircle className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">لا توجد نتائج بحث</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map(order => (
                  <div key={order.id} className="bg-slate-900 rounded-3xl p-5 border border-slate-800 hover:border-slate-700 transition-all group relative overflow-hidden">
                    {/* Status Badge */}
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5 ${
                        order.status === 'completed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                        order.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                        order.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                      }`}>
                        {order.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                        {order.status === 'in-progress' && <RefreshCw className="w-3 h-3 animate-spin-slow" />}
                        {order.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                        {order.status === 'pending' && <Clock className="w-3 h-3" />}
                        {order.status === 'completed' ? 'مكتمل' : 
                         order.status === 'in-progress' ? 'جاري العمل' : 
                         order.status === 'cancelled' ? 'ملغي' : 'قيد الانتظار'}
                      </span>
                      
                      <div className="flex gap-1">
                        <button 
                          onClick={() => { setEditingOrder(order); setFormData(order); setShowOrderModal(true); }}
                          className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteOrder(order.id)}
                          className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="text-white font-black text-lg truncate">{order.customer_name}</h3>
                        <p className="text-slate-500 text-xs font-bold flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {order.date}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-800/50">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">الجهاز</p>
                          <p className="text-xs text-slate-200 font-bold">{order.device} - {order.brand}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">الفني</p>
                          <p className="text-xs text-orange-400 font-bold">{order.technician || 'لم يحدد'}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">التكلفة</p>
                          <p className="text-lg font-black text-white">{order.total_amount || 0} <span className="text-[10px] font-normal">ج.م</span></p>
                        </div>
                        <a 
                          href={`tel:${order.phone}`}
                          className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-2xl transition-all shadow-sm"
                        >
                          <Phone className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Technicians Tab */}
        {activeTab === 'technicians' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {technicians.map(tech => (
              <div key={tech.id} className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
                  <Users className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-white font-black text-lg">{tech.name}</h3>
                <p className="text-slate-500 text-xs font-bold mb-4">{tech.specialization}</p>
                <div className="flex gap-2 justify-center">
                  <a href={`tel:${tech.phone}`} className="p-2 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500/20"><Phone className="w-4 h-4" /></a>
                  <button onClick={() => { setEditingTech(tech); setTechForm(tech); setShowTechModal(true); }} className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteTechnician(tech.id)} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            <button 
              onClick={() => { setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true }); setShowTechModal(true); }}
              className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-900 hover:border-orange-500/50 transition-all text-slate-500 hover:text-orange-500"
            >
              <Plus className="w-8 h-8" />
              <span className="font-bold">إضافة فني</span>
            </button>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white">التقارير المالية</h2>
                  <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest">Financial Performance</p>
                </div>
                <button onClick={exportToCSV} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  تحميل التقرير
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                  <PieChart className="w-8 h-8 text-blue-500 mb-4" />
                  <p className="text-slate-400 text-xs font-bold mb-1">إجمالي الإيرادات</p>
                  <p className="text-3xl font-black text-white">{orders.reduce((acc, o) => acc + (o.total_amount || 0), 0).toLocaleString()} <span className="text-sm font-normal">ج.م</span></p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                  <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
                  <p className="text-slate-400 text-xs font-bold mb-1">إجمالي المصاريف</p>
                  <p className="text-3xl font-black text-white">{orders.reduce((acc, o) => acc + (o.expenses || 0), 0).toLocaleString()} <span className="text-sm font-normal">ج.م</span></p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mb-4" />
                  <p className="text-slate-400 text-xs font-bold mb-1">صافي الأرباح</p>
                  <p className="text-3xl font-black text-white">{stats.totalIncome.toLocaleString()} <span className="text-sm font-normal">ج.م</span></p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 overflow-x-auto">
              <h3 className="text-xl font-black text-white mb-6">أداء الفنيين</h3>
              <table className="w-full text-right">
                <thead className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
                  <tr>
                    <th className="pb-4 pr-4">الفني</th>
                    <th className="pb-4">الأوردرات</th>
                    <th className="pb-4">مكتمل</th>
                    <th className="pb-4">الإيراد</th>
                    <th className="pb-4">النسبة</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {technicians.map(tech => {
                    const techOrders = orders.filter(o => o.technician === tech.name);
                    const completed = techOrders.filter(o => o.status === 'completed').length;
                    const revenue = techOrders.reduce((acc, o) => acc + (o.technician_share || 0), 0);
                    return (
                      <tr key={tech.id} className="border-b border-slate-800/50">
                        <td className="py-4 pr-4 font-bold text-white">{tech.name}</td>
                        <td className="py-4 text-slate-400 font-bold">{techOrders.length}</td>
                        <td className="py-4 text-green-500 font-bold">{completed}</td>
                        <td className="py-4 text-white font-bold">{revenue.toLocaleString()} ج.م</td>
                        <td className="py-4">
                          <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="bg-orange-500 h-full" style={{ width: `${(completed / (techOrders.length || 1)) * 100}%` }}></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-black text-white">{editingOrder ? 'تعديل أوردر' : 'أوردر جديد'}</h2>
              <button onClick={() => setShowOrderModal(false)} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl"><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={saveOrder} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase pr-2">اسم العميل</label>
                  <input type="text" required value={formData.customer_name} onChange={(e) => handleFormChange('customer_name', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase pr-2">رقم الهاتف</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => handleFormChange('phone', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase pr-2">الجهاز</label>
                  <input type="text" required value={formData.device} onChange={(e) => handleFormChange('device', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase pr-2">الماركة</label>
                  <input type="text" value={formData.brand} onChange={(e) => handleFormChange('brand', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase pr-2">الفني</label>
                  <select value={formData.technician} onChange={(e) => handleFormChange('technician', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500">
                    <option value="">اختر فني</option>
                    {technicians.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase pr-2">الحالة</label>
                  <select value={formData.status} onChange={(e) => handleFormChange('status', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500">
                    <option value="pending">قيد الانتظار</option>
                    <option value="in-progress">جاري العمل</option>
                    <option value="completed">مكتمل</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase pr-2">العنوان</label>
                <input type="text" value={formData.address} onChange={(e) => handleFormChange('address', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" />
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase pr-2">الإجمالي</label>
                  <input type="number" value={formData.total_amount} onChange={(e) => handleFormChange('total_amount', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase pr-2">المصاريف</label>
                  <input type="number" value={formData.expenses} onChange={(e) => handleFormChange('expenses', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase pr-2">الصافي</label>
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-black text-orange-500">{formData.net_amount}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">نصيب الشركة (50%)</p>
                  <p className="text-lg font-black text-blue-500">{formData.company_share} <span className="text-[10px] font-normal">ج.م</span></p>
                </div>
                <div className="text-center border-r border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">نصيب الفني (50%)</p>
                  <p className="text-lg font-black text-purple-500">{formData.technician_share} <span className="text-[10px] font-normal">ج.م</span></p>
                </div>
              </div>

              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-900/20 transition-all active:scale-95 mt-4">حفظ البيانات</button>
            </form>
          </div>
        </div>
      )}

      {/* Technician Modal */}
      {showTechModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-black text-white">{editingTech ? 'تعديل فني' : 'فني جديد'}</h2>
              <button onClick={() => setShowTechModal(false)} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl"><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={saveTechnician} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase pr-2">اسم الفني</label>
                <input type="text" required value={techForm.name} onChange={(e) => setTechForm({ ...techForm, name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase pr-2">رقم الهاتف</label>
                <input type="tel" required value={techForm.phone} onChange={(e) => setTechForm({ ...techForm, phone: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase pr-2">التخصص</label>
                <input type="text" value={techForm.specialization} onChange={(e) => setTechForm({ ...techForm, specialization: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500" />
              </div>
              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-900/20 transition-all active:scale-95 mt-4">حفظ الفني</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
