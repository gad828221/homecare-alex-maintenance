import { useState, useEffect } from "react";

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

const fetchAPI = async (endpoint: string, options?: RequestInit) => {
  const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export default function ProtectedOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'technicians'>('orders');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingTech, setEditingTech] = useState<any>(null);
  const [formData, setFormData] = useState({ customer_name: '', phone: '', device: '', address: '', brand: '', problem: '', status: 'pending', total_amount: 0, expenses: 0, net_amount: 0, company_share: 0, technician_share: 0 });
  const [techForm, setTechForm] = useState({ name: '', phone: '', specialization: '', is_active: true });
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, cancelled: 0 });

  // دالة جلب البيانات (سيتم استدعاؤها بعد أي تغيير)
  const fetchData = async () => {
    setLoading(true);
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
      setStats({ pending, inProgress, completed, cancelled });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // تحديث حالة الأوردر
  const updateOrderStatus = async (id: number, newStatus: string) => {
    await fetchAPI(`orders?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
    await fetchData(); // تحديث البيانات
  };

  // حذف أوردر
  const deleteOrder = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الأوردر؟')) {
      await fetchAPI(`orders?id=eq.${id}`, { method: 'DELETE' });
      await fetchData();
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
    setFormData({ customer_name: '', phone: '', device: '', address: '', brand: '', problem: '', status: 'pending', total_amount: 0, expenses: 0, net_amount: 0, company_share: 0, technician_share: 0 });
    await fetchData(); // تحديث البيانات
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
    await fetchData();
  };

  const deleteTechnician = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الفني؟')) {
      await fetchAPI(`technicians?id=eq.${id}`, { method: 'DELETE' });
      await fetchData();
    }
  };

  const exportToCSV = () => { /* ... كما هو ... */ };

  if (loading) return <div className="p-8 text-white text-center">جاري التحميل...</div>;

  return ( /* نفس الـ JSX السابق مع إضافة حقول الإجمالي والمصاريف في الجدول والنموذج */ );
}
