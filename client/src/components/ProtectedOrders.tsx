import React, { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { 
  Plus, Search, LayoutDashboard, Users, CheckCircle2, AlertCircle, 
  Edit, Trash2, RefreshCw, Phone, Copy, Check, Trash, Bell, DollarSign, 
  X, Printer, UserPlus, UserMinus, LogOut, Eye, EyeOff
} from "lucide-react";

// -------------------- Interfaces & Types --------------------
interface Order {
  id: number;
  order_number: number;
  customer_name: string;
  phone: string;
  device_type: string;
  address: string;
  brand: string;
  problem_description: string;
  technician: string;
  status: 'pending' | 'in-progress' | 'inspected' | 'completed' | 'cancelled';
  total_amount: number;
  parts_cost: number;
  transport_cost: number;
  net_amount: number;
  company_share: number;
  technician_share: number;
  is_paid: boolean;
  date: string;
  created_at?: string;
  profit_added_to_cash?: boolean; // لمنع الإضافة المزدوجة
}

interface Technician {
  id: number;
  name: string;
  phone: string;
  specialization: string;
  is_active: boolean;
  username: string;
  password: string;
}

interface Partner {
  id: number;
  name: string;
  share_percentage: number;
  phone: string;
  is_active: boolean;
  created_at?: string;
}

interface CashEntry {
  id: number;
  type: 'income' | 'expense' | 'profit_distribution';
  amount: number;
  description: string;
  date: string;
}

interface Notification {
  id: number;
  action: string;
  details: string;
  user_name: string;
  created_at: string;
}

interface SystemUser {
  id: number;
  username: string;
  full_name: string;
  phone: string;
  role: 'admin' | 'manager' | 'technician' | 'viewer';
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

// -------------------- Supabase Client --------------------
const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

const fetchAPI = async (endpoint: string, options?: RequestInit) => {
  const url = `${supabaseUrl}/rest/v1/${endpoint}`;
  const res = await fetch(url, {
    headers: { 
      'apikey': supabaseKey, 
      'Authorization': `Bearer ${supabaseKey}`, 
      'Content-Type': 'application/json',
    },
    ...options,
  });
  
  if (res.status === 204 || options?.method === 'DELETE') {
    return { success: true };
  }
  
  const text = await res.text();
  if (!text) return { success: true };
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("JSON parse error:", text);
    return { success: true };
  }
};

const addNotification = async (action: string, details: string) => {
  try {
    await fetch(`${supabaseUrl}/rest/v1/notifications`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: action,
        details: details,
        user_name: localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).full_name : 'المدير',
        created_at: new Date().toISOString()
      })
    });
  } catch (err) {
    console.error("خطأ في تسجيل الإشعار:", err);
  }
};

// -------------------- Constants --------------------
const DEVICE_TYPES = ['غسالة', 'ثلاجة', 'بوتاجاز', 'سخان', 'تكييف', 'ميكروويف', 'غسالة أطباق'];
const BRANDS = ['سامسونج', 'LG', 'شارب', 'توشيبا', 'زانوسي', 'يونيون إير', 'فريش', 'وايت ويل', 'أريستون', 'بيكو', 'هوفر', 'إنديست'];

// -------------------- Auth Context --------------------
interface AuthContextType {
  currentUser: SystemUser | null;
  userRole: string;
  login: (user: SystemUser) => void;
  logout: () => void;
  canEditDelete: () => boolean;
  canManageUsers: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// -------------------- Helper Functions --------------------
const formatPhoneForWhatsApp = (phone: string) => {
  if (!phone) return '';
  let cleaned = phone.toString().replace(/[^\d]/g, '');
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  if (cleaned.length === 10) cleaned = '20' + cleaned;
  return cleaned;
};

const getDaysDifference = (dateStr: string, status: string) => {
  if (status === 'inspected') return 0;
  if (!dateStr) return 0;
  let orderDate: Date;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) orderDate = new Date(year, month, day);
      else return 0;
    } else return 0;
  } else {
    orderDate = new Date(dateStr);
    if (isNaN(orderDate.getTime())) return 0;
  }
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffTime = todayDate.getTime() - orderDate.getTime();
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
};

const isDelayed = (order: Order) => {
  if (order.status === 'completed' || order.status === 'cancelled') return false;
  if (order.status === 'inspected') return false;
  const daysDiff = getDaysDifference(order.date, order.status);
  return daysDiff > 2;
};

const calculateAmounts = (data: Partial<Order>): Partial<Order> => {
  const total = parseFloat(String(data.total_amount)) || 0;
  const parts = parseFloat(String(data.parts_cost)) || 0;
  const transport = parseFloat(String(data.transport_cost)) || 0;
  const net = total - parts - transport;
  const companyShare = Math.round(net * 0.5);
  const techShare = net - companyShare;
  return { ...data, net_amount: net, company_share: companyShare, technician_share: techShare };
};

// -------------------- دالة إضافة الأرباح إلى الخزنة (الأساسية) --------------------
const addCompanyProfitToCash = async (order: Order): Promise<boolean> => {
  const companyShare = order.company_share || 0;
  
  console.log("🔍 [addCompanyProfitToCash] بدء الإضافة:", {
    orderId: order.id,
    orderNumber: order.order_number,
    companyShare,
    is_paid: order.is_paid,
    status: order.status,
    profit_added_to_cash: order.profit_added_to_cash
  });
  
  // شروط الإضافة
  if (companyShare <= 0) {
    console.log("❌ لا توجد أرباح للشركة (company_share = 0)");
    alert("❌ لا توجد أرباح للشركة (company_share = 0)");
    return false;
  }
  
  if (!order.is_paid) {
    console.log("❌ الأوردر لم يتم تحصيله بعد");
    alert("❌ الأوردر لم يتم تحصيله بعد. قم بتفعيل التحصيل أولاً.");
    return false;
  }
  
  if (order.status !== 'completed') {
    console.log("❌ الأوردر لم يكتمل بعد");
    alert("❌ الأوردر لم يكتمل بعد. غير الحالة إلى مكتمل أولاً.");
    return false;
  }
  
  if (order.profit_added_to_cash) {
    console.log("⚠️ الأرباح أضيفت سابقاً لهذا الأوردر، لن يتم الإضافة مجدداً");
    alert("⚠️ أرباح هذا الأوردر أضيفت سابقاً إلى الخزنة.");
    return false;
  }
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. إضافة قيد في cash_ledger
    const response = await fetch(`${supabaseUrl}/rest/v1/cash_ledger`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'income',
        amount: companyShare,
        description: `أرباح شركة من أوردر ${order.customer_name} (رقم ${order.order_number})`,
        date: today
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error("❌ فشل إضافة قيد الخزنة:", error);
      alert(`❌ فشل إضافة الأرباح إلى الخزنة: ${error}`);
      return false;
    }
    
    console.log(`✅ تم إضافة ${companyShare} ج.م إلى جدول cash_ledger`);
    
    // 2. تحديث الأوردر لمنع الإضافة المزدوجة
    const updateRes = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ profit_added_to_cash: true })
    });
    
    if (!updateRes.ok) {
      console.warn("⚠️ تمت إضافة الخزنة ولكن فشل تحديث علم الأوردر");
    } else {
      console.log("✅ تم تحديث profit_added_to_cash في الأوردر");
    }
    
    // 3. تسجيل إشعار
    await addNotification('إضافة أرباح للخزنة', `✅ تم إضافة ${companyShare} ج.م للخزنة من أوردر ${order.customer_name}`);
    
    alert(`✅ تم إضافة ${companyShare} ج.م إلى الخزنة بنجاح`);
    return true;
    
  } catch (err) {
    console.error("❌ خطأ في الشبكة أثناء إضافة الأرباح:", err);
    alert(`❌ حدث خطأ في الاتصال: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return false;
  }
};

// -------------------- دوال إدارة المستخدمين --------------------
const fetchUsers = async (): Promise<SystemUser[]> => {
  try {
    const data = await fetchAPI('users?select=id,username,full_name,phone,role,is_active,created_at,last_login&order=created_at.desc');
    return data || [];
  } catch (err) {
    console.error("خطأ في جلب المستخدمين:", err);
    return [];
  }
};

const addUser = async (user: Omit<SystemUser, 'id' | 'created_at' | 'last_login'> & { password: string }) => {
  try {
    const result = await fetchAPI('users', { 
      method: 'POST', 
      body: JSON.stringify(user) 
    });
    await addNotification('إضافة مستخدم', `تم إضافة مستخدم جديد: ${user.full_name}`);
    return result;
  } catch (err) {
    console.error("خطأ في إضافة مستخدم:", err);
    throw err;
  }
};

const updateUser = async (id: number, updates: Partial<SystemUser> & { password?: string }) => {
  try {
    await fetchAPI(`users?id=eq.${id}`, { 
      method: 'PATCH', 
      body: JSON.stringify(updates) 
    });
    await addNotification('تعديل مستخدم', `تم تعديل بيانات المستخدم`);
  } catch (err) {
    console.error("خطأ في تعديل مستخدم:", err);
  }
};

const deleteUser = async (id: number) => {
  try {
    await fetchAPI(`users?id=eq.${id}`, { method: 'DELETE' });
    await addNotification('حذف مستخدم', `تم حذف مستخدم`);
  } catch (err) {
    console.error("خطأ في حذف مستخدم:", err);
  }
};

// -------------------- Main Component --------------------
export default function ProtectedOrders() {
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const role = localStorage.getItem('userRole');
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }
    setCurrentUser(JSON.parse(storedUser));
    setUserRole(role || 'viewer');
  }, []);

  const login = (user: SystemUser) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('userRole', user.role);
    setCurrentUser(user);
    setUserRole(user.role);
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const canEditDelete = () => userRole === 'admin' || userRole === 'manager';
  const canManageUsers = () => userRole === 'admin';

  if (!currentUser) return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;

  return (
    <AuthContext.Provider value={{ currentUser, userRole, login, logout, canEditDelete, canManageUsers }}>
      <DashboardContent />
    </AuthContext.Provider>
  );
}

// -------------------- Dashboard Content --------------------
const DashboardContent = () => {
  const { canEditDelete, canManageUsers, logout, currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [cashLedger, setCashLedger] = useState<CashEntry[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'technicians' | 'reports' | 'invoicesReview' | 'cash' | 'partners' | 'notifications' | 'users'>('orders');
  
  // Modal States
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [editingCash, setEditingCash] = useState<CashEntry | null>(null);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  
  // UI States
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [filterTechStatus, setFilterTechStatus] = useState<'all' | 'active' | 'inactive'>('active');
  const [cashFilterDate, setCashFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTechnician, setFilterTechnician] = useState('');
  const [filterDeviceType, setFilterDeviceType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterDelay, setFilterDelay] = useState<'all' | 'delayed'>('all');
  const [customDevice, setCustomDevice] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [isOtherDevice, setIsOtherDevice] = useState(false);
  const [isOtherBrand, setIsOtherBrand] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState<Partial<Order>>({
    customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '',
    status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, 
    net_amount: 0, company_share: 0, technician_share: 0, is_paid: false,
    date: new Date().toLocaleDateString("ar-EG")
  });
  
  const [techForm, setTechForm] = useState<Partial<Technician>>({ 
    name: '', phone: '', specialization: '', is_active: true,
    username: '', password: '' 
  });
  
  const [partnerForm, setPartnerForm] = useState<Partial<Partner>>({ name: '', share_percentage: 0, phone: '', is_active: true });
  const [cashForm, setCashForm] = useState({ type: 'expense', amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
  
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'viewer' as SystemUser['role'],
    is_active: true
  });
  
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, cancelled: 0, totalIncome: 0 });

  // -------------------- WhatsApp --------------------
  const sendWhatsAppToCustomer = (order: Order, newStatus: string) => {
    const phone = formatPhoneForWhatsApp(order.phone);
    if (!phone) return;
    let statusMessage = "";
    switch (newStatus) {
      case 'in-progress': statusMessage = "🔧 تم بدء العمل على طلبك بواسطة الفني."; break;
      case 'inspected': statusMessage = "🔍 تم الكشف على جهازك. سيتم إبلاغك بالخطوات التالية."; break;
      case 'completed': statusMessage = "✅ تم إكمال طلب الصيانة بنجاح. شكراً لثقتك بنا!"; break;
      case 'cancelled': statusMessage = "❌ تم إلغاء طلب الصيانة. للاستفسار، يرجى الاتصال بنا."; break;
      default: return;
    }
    const message = `📢 *تحديث حالة طلب الصيانة* 📢\n\n🔢 *رقم الأوردر:* ${order.order_number}\n👤 *العميل:* ${order.customer_name}\n📝 *الحالة الجديدة:* ${statusMessage}\n\nشكراً لتواصلك معنا. 🌟`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const sendWhatsAppToCustomerOnCreate = (order: Order) => {
    const phone = formatPhoneForWhatsApp(order.phone);
    if (!phone) return;
    const message = `📝 *تم استلام طلب الصيانة بنجاح* 📝\n\n🔢 *رقم الأوردر:* ${order.order_number}\n👤 *العميل:* ${order.customer_name}\n🔧 *الجهاز:* ${order.device_type} - ${order.brand}\n📍 *العنوان:* ${order.address || 'غير محدد'}\n\n✅ تم تسجيل طلبك وسيتم التواصل معك قريباً من قبل الفني المختص.\n\nشكراً لثقتك بنا. 🌟`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // -------------------- API Calls --------------------
  const fetchNotifications = useCallback(async () => {
    try {
      const data = await fetchAPI('notifications?select=*&order=created_at.desc');
      setNotifications(data || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchPartners = useCallback(async () => {
    try {
      const data = await fetchAPI('partners?select=*&order=created_at.desc');
      setPartners(data || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchCashLedger = useCallback(async () => {
    try {
      let endpoint = 'cash_ledger?select=*&order=date.desc';
      if (cashFilterDate) endpoint = `cash_ledger?select=*&date=eq.${cashFilterDate}&order=date.desc`;
      const data = await fetchAPI(endpoint);
      setCashLedger(data || []);
      const balance = (data || []).reduce((acc: number, entry: any) => {
        if (entry.type === 'income') return acc + entry.amount;
        return acc - entry.amount;
      }, 0);
      setCashBalance(balance);
    } catch (err) { console.error(err); }
  }, [cashFilterDate]);

  const fetchData = useCallback(async () => {
    try {
      const [ordersData, techsData] = await Promise.all([
        fetchAPI('orders?select=*&order=created_at.desc'),
        fetchAPI('technicians?select=*')
      ]);
      setOrders(ordersData || []);
      setTechnicians(techsData || []);
      
      const pending = (ordersData || []).filter((o: Order) => o.status === 'pending').length;
      const inProgress = (ordersData || []).filter((o: Order) => o.status === 'in-progress').length;
      const completed = (ordersData || []).filter((o: Order) => o.status === 'completed').length;
      const cancelled = (ordersData || []).filter((o: Order) => o.status === 'cancelled').length;
      const totalIncome = (ordersData || []).reduce((acc: number, o: Order) => acc + (o.company_share || 0), 0);
      
      setStats({ pending, inProgress, completed, cancelled, totalIncome });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  const fetchAllUsers = useCallback(async () => {
    if (!canManageUsers()) return;
    const data = await fetchUsers();
    setUsers(data);
  }, [canManageUsers]);

  // -------------------- تحديث حالة الدفع (مع إضافة الأرباح فوراً) --------------------
  const togglePaidStatus = async (id: number, currentStatus: boolean) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    // إذا كان التغيير من false إلى true (تم التحصيل)
    const newPaidStatus = !currentStatus;
    
    try {
      // 1. تحديث حالة الدفع في قاعدة البيانات
      await fetchAPI(`orders?id=eq.${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify({ is_paid: newPaidStatus }) 
      });
      
      await addNotification('تحديث حالة الدفع', `✅ تم تحديث حالة تحصيل أوردر ${order.customer_name} إلى ${newPaidStatus ? 'تم التحصيل' : 'لم يتم التحصيل'}`);
      
      // 2. تحديث البيانات محلياً
      const updatedOrder = { ...order, is_paid: newPaidStatus };
      
      // 3. إذا تم التحصيل (newPaidStatus = true) وكان الأوردر مكتملاً، نضيف الأرباح للخزنة فوراً
      if (newPaidStatus && order.status === 'completed') {
        console.log("💰 تم التحصيل وألأوردر مكتمل، جاري إضافة الأرباح إلى الخزنة...");
        const added = await addCompanyProfitToCash(updatedOrder);
        if (!added) {
          console.warn("⚠️ فشل إضافة الأرباح، يمكن المحاولة لاحقاً");
        }
      } else if (newPaidStatus && order.status !== 'completed') {
        console.log("ℹ️ تم التحصيل ولكن الأوردر لم يكتمل بعد، سيتم إضافة الأرباح عند اكتماله لاحقاً.");
      }
      
      // 4. تحديث جميع البيانات
      fetchData();
      fetchCashLedger(); // تحديث الخزنة فوراً
      
    } catch (err) { 
      console.error("خطأ في تحديث حالة الدفع:", err); 
    }
  };

  // -------------------- تحديث حالة الأوردر (مع إضافة الأرباح إذا اكتمل ومحصل) --------------------
  const updateOrderStatus = async (id: number, newStatus: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    try {
      // 1. تحديث الحالة
      await fetchAPI(`orders?id=eq.${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify({ status: newStatus }) 
      });
      
      await addNotification('تغيير حالة أوردر', `🔄 تم تغيير حالة أوردر ${order.customer_name} إلى ${newStatus}`);
      
      // 2. إذا أصبح مكتملاً وكان محصلاً، نضيف الأرباح
      if (newStatus === 'completed') {
        // نحتاج لجلب الأوردر المحدث لنتأكد من is_paid (قد لا يكون محدثاً في الذاكرة)
        const updatedOrder = { ...order, status: 'completed' };
        if (updatedOrder.is_paid) {
          console.log("💰 الأوردر اكتمل وهو محصل، جاري إضافة الأرباح إلى الخزنة...");
          await addCompanyProfitToCash(updatedOrder);
        } else {
          console.log("ℹ️ الأوردر اكتمل لكن لم يتم تحصيله بعد، سيتم إضافة الأرباح عند التحصيل لاحقاً.");
        }
      }
      
      sendWhatsAppToCustomer(order, newStatus);
      fetchData();
      fetchCashLedger();
    } catch (err) { 
      console.error("خطأ في تحديث الحالة:", err); 
    }
  };

  // -------------------- باقي دوال CRUD --------------------
  const addCashEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCash) {
        await fetchAPI(`cash_ledger?id=eq.${editingCash.id}`, { method: 'PATCH', body: JSON.stringify(cashForm) });
        await addNotification('تعديل حركة خزنة', `تم تعديل حركة ${cashForm.type} بقيمة ${cashForm.amount} ج.م`);
      } else {
        await fetchAPI('cash_ledger', { method: 'POST', body: JSON.stringify(cashForm) });
        await addNotification('إضافة حركة خزنة', `تم إضافة حركة ${cashForm.type} بقيمة ${cashForm.amount} ج.م`);
      }
      setShowCashModal(false);
      setEditingCash(null);
      setCashForm({ type: 'expense', amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
      fetchCashLedger();
    } catch (err) { console.error(err); }
  };

  const deleteCashEntry = async (id: number) => {
    if (!canEditDelete()) return alert("ليس لديك صلاحية");
    if (confirm('حذف هذه الحركة؟')) {
      await fetchAPI(`cash_ledger?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف حركة خزنة', `تم حذف حركة من سجل الخزنة`);
      fetchCashLedger();
    }
  };

  const deleteOrder = async (id: number) => {
    if (!canEditDelete()) return alert("ليس لديك صلاحية للحذف");
    if (confirm('هل أنت متأكد من حذف هذا الأوردر؟')) {
      await fetchAPI(`orders?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف أوردر', `تم حذف أوردر`);
      fetchData();
    }
  };

  const deleteTechnician = async (id: number) => {
    if (!canEditDelete()) return alert("ليس لديك صلاحية للحذف");
    if (confirm('هل أنت متأكد من حذف هذا الفني؟')) {
      await fetchAPI(`technicians?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف فني', `تم حذف فني`);
      fetchData();
    }
  };

  const deletePartner = async (id: number) => {
    if (!canEditDelete()) return alert("ليس لديك صلاحية للحذف");
    if (confirm('هل أنت متأكد من حذف هذا الشريك؟')) {
      await fetchAPI(`partners?id=eq.${id}`, { method: 'DELETE' });
      await addNotification('حذف شريك', `تم حذف شريك`);
      fetchPartners();
    }
  };

  const distributeDailyProfit = async () => {
    if (!canEditDelete()) return alert("ليس لديك صلاحية");
    try {
      const today = new Date().toISOString().split('T')[0];
      const alreadyDistributed = (cashLedger || []).some(c => c.date === today && c.type === 'profit_distribution');
      if (alreadyDistributed && !confirm("⚠️ تم توزيع أرباح اليوم بالفعل. هل تريد التوزيع مرة أخرى؟")) return;

      const todayIncome = (cashLedger || []).filter(c => c.date === today && c.type === 'income').reduce((sum, c) => sum + Number(c.amount), 0);
      const todayExpenses = (cashLedger || []).filter(c => c.date === today && c.type === 'expense').reduce((sum, c) => sum + Number(c.amount), 0);
      const netProfit = todayIncome - todayExpenses;
      
      if (netProfit <= 0) return alert(`⚠️ لا توجد أرباح صافية اليوم للتوزيع.`);
      
      const activePartners = (partners || []).filter(p => p.is_active === true);
      if (activePartners.length === 0) return alert("⚠️ لا يوجد شركاء نشطون");
      
      if (!confirm(`💰 سيتم توزيع ${netProfit.toLocaleString()} ج.م على ${activePartners.length} شريك. هل تريد الاستمرار؟`)) return;

      for (const partner of activePartners) {
        const shareAmount = Math.floor((netProfit * Number(partner.share_percentage)) / 100);
        if (shareAmount > 0) {
          await fetchAPI('cash_ledger', {
            method: 'POST',
            body: JSON.stringify({
              type: 'profit_distribution',
              amount: shareAmount,
              description: `📤 توزيع أرباح: ${partner.name} (${partner.share_percentage}%) - ${today}`,
              date: today
            })
          });
        }
      }
      
      await addNotification('توزيع أرباح يومية', `✅ تم توزيع ${netProfit.toLocaleString()} ج.م على الشركاء`);
      await fetchCashLedger();
      alert(`✅ تم توزيع ${netProfit.toLocaleString()} ج.م على الشركاء`);
    } catch (err) {
      console.error("خطأ في توزيع الأرباح:", err);
      alert("❌ حدث خطأ أثناء توزيع الأرباح");
    }
  };

  const handleFormChange = (field: string, value: any) => {
    if (field === 'device_type') {
        if (value === 'other') {
            setIsOtherDevice(true);
            setFormData({ ...formData, device_type: '' });
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

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalDevice = formData.device_type;
    let finalBrand = formData.brand;
    if (isOtherDevice && customDevice.trim()) finalDevice = customDevice.trim();
    if (isOtherBrand && customBrand.trim()) finalBrand = customBrand.trim();
    const orderToSubmit = { ...formData, device_type: finalDevice, brand: finalBrand, date: new Date().toLocaleDateString("ar-EG") };
    try {
      if (editingOrder) {
        await fetchAPI(`orders?id=eq.${editingOrder.id}`, { method: 'PATCH', body: JSON.stringify(orderToSubmit) });
        await addNotification('تعديل أوردر', `تم تعديل أوردر ${orderToSubmit.customer_name}`);
      } else {
        const newOrder = await fetchAPI('orders', { method: 'POST', body: JSON.stringify(orderToSubmit) });
        await addNotification('إضافة أوردر جديد', `تم إضافة أوردر جديد للعميل ${orderToSubmit.customer_name}`);
        if (newOrder && newOrder[0]) sendWhatsAppToCustomerOnCreate(newOrder[0]);
      }
      setShowOrderModal(false);
      setEditingOrder(null);
      setFormData({ customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '', status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false, date: new Date().toLocaleDateString("ar-EG") });
      setIsOtherDevice(false); setIsOtherBrand(false); setCustomDevice(''); setCustomBrand('');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const submitTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTech) {
        await fetchAPI(`technicians?id=eq.${editingTech.id}`, { method: 'PATCH', body: JSON.stringify(techForm) });
        await addNotification('تعديل فني', `تم تعديل بيانات الفني ${techForm.name}`);
      } else {
        await fetchAPI('technicians', { method: 'POST', body: JSON.stringify(techForm) });
        await addNotification('إضافة فني جديد', `تم إضافة فني جديد: ${techForm.name}`);
      }
      setShowTechModal(false);
      setEditingTech(null);
      setTechForm({ name: '', phone: '', specialization: '', is_active: true, username: '', password: '' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const submitPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPartner) {
        await fetchAPI(`partners?id=eq.${editingPartner.id}`, { method: 'PATCH', body: JSON.stringify(partnerForm) });
        await addNotification('تعديل شريك', `تم تعديل بيانات الشريك ${partnerForm.name}`);
      } else {
        await fetchAPI('partners', { method: 'POST', body: JSON.stringify(partnerForm) });
        await addNotification('إضافة شريك جديد', `تم إضافة شريك جديد: ${partnerForm.name}`);
      }
      setShowPartnerModal(false);
      setEditingPartner(null);
      setPartnerForm({ name: '', share_percentage: 0, phone: '', is_active: true });
      fetchPartners();
    } catch (err) { console.error(err); }
  };

  const handleAddEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers()) return alert("ليس لديك صلاحية");
    try {
      if (editingUser) {
        const { password, ...rest } = userForm;
        const updates = password ? { ...rest, password } : rest;
        await updateUser(editingUser.id, updates);
      } else {
        await addUser(userForm as any);
      }
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({ username: '', password: '', full_name: '', phone: '', role: 'viewer', is_active: true });
      fetchAllUsers();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ في حفظ المستخدم');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!canManageUsers()) return alert("ليس لديك صلاحية");
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    await deleteUser(id);
    fetchAllUsers();
  };

  useEffect(() => {
    addNotification('تسجيل دخول', `تم تسجيل دخول ${currentUser?.full_name}`);
    fetchData();
    fetchNotifications();
    fetchCashLedger();
    fetchPartners();
    fetchAllUsers();
    const interval = setInterval(() => { fetchData(); fetchNotifications(); fetchCashLedger(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtering
  const filteredOrders = orders.filter(order => {
    if (searchTerm && !order.customer_name.includes(searchTerm) && !order.phone.includes(searchTerm) && !String(order.order_number).includes(searchTerm)) return false;
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    if (filterTechnician && order.technician !== filterTechnician) return false;
    if (filterDeviceType && order.device_type !== filterDeviceType) return false;
    if (filterDelay === 'delayed' && !isDelayed(order)) return false;
    if (filterDateFrom && order.date) {
      const parts = order.date.split('/');
      if (parts.length === 3) {
        const orderDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        if (orderDateStr < filterDateFrom) return false;
      }
    }
    if (filterDateTo && order.date) {
      const parts = order.date.split('/');
      if (parts.length === 3) {
        const orderDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        if (orderDateStr > filterDateTo) return false;
      }
    }
    return true;
  });

  const filteredTechnicians = technicians.filter(tech => {
    if (filterTechStatus === 'active' && !tech.is_active) return false;
    if (filterTechStatus === 'inactive' && tech.is_active) return false;
    return true;
  });

  if (loading) return <div className="flex justify-center items-center h-screen text-xl">جاري تحميل البيانات...</div>;

  // -------------------- JSX --------------------
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 space-x-reverse">
              <h1 className="text-xl font-bold text-gray-800">نظام إدارة الصيانة</h1>
              <div className="hidden md:flex space-x-4 space-x-reverse">
                <button onClick={() => setActiveTab('orders')} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'orders' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>📋 الأوردرات</button>
                <button onClick={() => setActiveTab('technicians')} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'technicians' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>👨‍🔧 الفنيين</button>
                <button onClick={() => setActiveTab('partners')} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'partners' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>🤝 الشركاء</button>
                <button onClick={() => setActiveTab('cash')} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'cash' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>💰 الخزنة</button>
                <button onClick={() => setActiveTab('notifications')} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'notifications' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>🔔 الإشعارات</button>
                {canManageUsers() && (
                  <button onClick={() => setActiveTab('users')} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'users' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>👥 المستخدمين</button>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="text-sm text-gray-600">{currentUser?.full_name} ({currentUser?.role})</span>
              <button onClick={logout} className="text-red-600 hover:text-red-800 flex items-center gap-1"><LogOut size={18} /> خروج</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ==================== ORDERS TAB ==================== */}
        {activeTab === 'orders' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow"><div className="text-gray-500 text-sm">قيد الانتظار</div><div className="text-2xl font-bold text-yellow-600">{stats.pending}</div></div>
              <div className="bg-white p-4 rounded-lg shadow"><div className="text-gray-500 text-sm">قيد التنفيذ</div><div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div></div>
              <div className="bg-white p-4 rounded-lg shadow"><div className="text-gray-500 text-sm">مكتمل</div><div className="text-2xl font-bold text-green-600">{stats.completed}</div></div>
              <div className="bg-white p-4 rounded-lg shadow"><div className="text-gray-500 text-sm">ملغي</div><div className="text-2xl font-bold text-red-600">{stats.cancelled}</div></div>
              <div className="bg-white p-4 rounded-lg shadow"><div className="text-gray-500 text-sm">إجمالي الأرباح</div><div className="text-2xl font-bold text-purple-600">{stats.totalIncome.toLocaleString()} ج.م</div></div>
            </div>

            <div className="bg-white rounded-lg shadow mb-6 p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]"><div className="relative"><Search className="absolute right-3 top-2.5 text-gray-400" size={18} /><input type="text" placeholder="بحث" className="w-full pr-10 p-2 border rounded" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
                <select className="p-2 border rounded" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="all">جميع الحالات</option><option value="pending">قيد الانتظار</option><option value="in-progress">قيد التنفيذ</option><option value="inspected">تم الكشف</option><option value="completed">مكتمل</option><option value="cancelled">ملغي</option></select>
                <select className="p-2 border rounded" value={filterTechnician} onChange={(e) => setFilterTechnician(e.target.value)}><option value="">جميع الفنيين</option>{technicians.map(tech => <option key={tech.id} value={tech.name}>{tech.name}</option>)}</select>
                <select className="p-2 border rounded" value={filterDeviceType} onChange={(e) => setFilterDeviceType(e.target.value)}><option value="">جميع الأجهزة</option>{DEVICE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}<option value="other">أخرى</option></select>
                <select className="p-2 border rounded" value={filterDelay} onChange={(e) => setFilterDelay(e.target.value as any)}><option value="all">الجميع</option><option value="delayed">المتأخرة فقط</option></select>
                <input type="date" className="p-2 border rounded" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} placeholder="من تاريخ" />
                <input type="date" className="p-2 border rounded" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} placeholder="إلى تاريخ" />
                {canEditDelete() && <button onClick={() => { setEditingOrder(null); setFormData({ customer_name: '', phone: '', device_type: '', address: '', brand: '', problem_description: '', technician: '', status: 'pending', total_amount: 0, parts_cost: 0, transport_cost: 0, net_amount: 0, company_share: 0, technician_share: 0, is_paid: false, date: new Date().toLocaleDateString("ar-EG") }); setShowOrderModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> أوردر جديد</button>}
                <button onClick={fetchData} className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"><RefreshCw size={18} /> تحديث</button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50"><tr>{['#', 'العميل', 'الجهاز', 'الفني', 'المبلغ', 'حالة الدفع', 'الحالة', 'التأخير', 'إجراءات'].map(h => <th key={h} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredOrders.map(order => {
                      const delayed = isDelayed(order);
                      return <tr key={order.id} className={delayed ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_number}</td>
                        <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{order.customer_name}</div><div className="text-sm text-gray-500 dir-ltr">{order.phone}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.device_type}<br /><span className="text-xs">{order.brand}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.technician || 'غير معين'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.total_amount.toLocaleString()} ج.م</td>
                        <td className="px-6 py-4 whitespace-nowrap"><button onClick={() => canEditDelete() && togglePaidStatus(order.id, order.is_paid)} className={`px-2 py-1 rounded-full text-xs font-semibold ${order.is_paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{order.is_paid ? 'تم التحصيل ✓' : 'لم يتم التحصيل ✗'}</button></td>
                        <td className="px-6 py-4 whitespace-nowrap"><select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className={`text-sm rounded-full px-3 py-1 font-semibold ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : order.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`} disabled={!canEditDelete()}>{['pending', 'in-progress', 'inspected', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s === 'pending' ? 'قيد الانتظار' : s === 'in-progress' ? 'قيد التنفيذ' : s === 'inspected' ? 'تم الكشف' : s === 'completed' ? 'مكتمل' : 'ملغي'}</option>)}</select></td>
                        <td className="px-6 py-4 whitespace-nowrap">{delayed ? <span className="text-red-600 text-sm font-bold">⚠️ متأخر {getDaysDifference(order.date, order.status)} يوم</span> : <span className="text-green-600 text-sm">✔️ في المدة</span>}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex gap-2"><button onClick={() => { navigator.clipboard.writeText(order.phone); setCopiedId(order.id); setTimeout(() => setCopiedId(null), 2000); }} className="text-green-600">{copiedId === order.id ? <Check size={18} /> : <Copy size={18} />}</button><a href={`https://wa.me/${formatPhoneForWhatsApp(order.phone)}`} target="_blank" className="text-green-600"><Phone size={18} /></a>{canEditDelete() && <button onClick={() => { setEditingOrder(order); setFormData(calculateAmounts(order)); setIsOtherDevice(!DEVICE_TYPES.includes(order.device_type)); setIsOtherBrand(!BRANDS.includes(order.brand)); setCustomDevice(!DEVICE_TYPES.includes(order.device_type) ? order.device_type : ''); setCustomBrand(!BRANDS.includes(order.brand) ? order.brand : ''); setShowOrderModal(true); }} className="text-blue-600"><Edit size={18} /></button>}{canEditDelete() && <button onClick={() => deleteOrder(order.id)} className="text-red-600"><Trash2 size={18} /></button>}</div></td>
                      </tr>
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ==================== TECHNICIANS TAB ==================== */}
        {activeTab === 'technicians' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between mb-4"><h2 className="text-xl font-bold">👨‍🔧 الفنيين</h2><div className="flex gap-2"><select value={filterTechStatus} onChange={(e) => setFilterTechStatus(e.target.value as any)} className="p-2 border rounded"><option value="active">النشطين فقط</option><option value="inactive">غير النشطين</option><option value="all">الجميع</option></select>{canEditDelete() && <button onClick={() => { setEditingTech(null); setTechForm({ name: '', phone: '', specialization: '', is_active: true, username: '', password: '' }); setShowTechModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> فني جديد</button>}</div></div>
            <div className="overflow-x-auto"><table className="min-w-full"><thead><tr><th>الاسم</th><th>رقم الهاتف</th><th>التخصص</th><th>الحالة</th><th>اسم المستخدم</th><th>إجراءات</th></tr></thead><tbody>{filteredTechnicians.map(tech => <tr key={tech.id}><td>{tech.name}</td><td>{tech.phone}</td><td>{tech.specialization}</td><td><span className={`px-2 py-1 rounded-full text-xs ${tech.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{tech.is_active ? 'نشط' : 'غير نشط'}</span></td><td>{tech.username}</td><td><div className="flex gap-2">{canEditDelete() && <button onClick={() => { setEditingTech(tech); setTechForm(tech); setShowTechModal(true); }} className="text-blue-600"><Edit size={18} /></button>}{canEditDelete() && <button onClick={() => deleteTechnician(tech.id)} className="text-red-600"><Trash2 size={18} /></button>}</div></td></tr>)}</tbody></table></div>
          </div>
        )}

        {/* ==================== PARTNERS TAB ==================== */}
        {activeTab === 'partners' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between mb-4"><h2 className="text-xl font-bold">🤝 الشركاء</h2>{canEditDelete() && <button onClick={() => { setEditingPartner(null); setPartnerForm({ name: '', share_percentage: 0, phone: '', is_active: true }); setShowPartnerModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> شريك جديد</button>}</div>
            <div className="overflow-x-auto"><table className="min-w-full"><thead><tr><th>الاسم</th><th>رقم الهاتف</th><th>نسبة الربح</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>{partners.map(partner => <tr key={partner.id}><td>{partner.name}</td><td>{partner.phone}</td><td>{partner.share_percentage}%</td><td><span className={`px-2 py-1 rounded-full text-xs ${partner.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{partner.is_active ? 'نشط' : 'غير نشط'}</span></td><td><div className="flex gap-2">{canEditDelete() && <button onClick={() => { setEditingPartner(partner); setPartnerForm(partner); setShowPartnerModal(true); }} className="text-blue-600"><Edit size={18} /></button>}{canEditDelete() && <button onClick={() => deletePartner(partner.id)} className="text-red-600"><Trash2 size={18} /></button>}</div></td></tr>)}</tbody></table></div>
          </div>
        )}

        {/* ==================== CASH TAB ==================== */}
        {activeTab === 'cash' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-bold">💰 سجل الخزنة</h2>
              <div className="text-lg font-bold">الرصيد الحالي: <span className="text-green-600">{cashBalance.toLocaleString()} ج.م</span></div>
              <div className="flex gap-2">
                <input type="date" value={cashFilterDate} onChange={(e) => setCashFilterDate(e.target.value)} className="p-2 border rounded" />
                <button onClick={() => setCashFilterDate('')} className="bg-gray-500 text-white px-3 py-2 rounded">إلغاء الفلتر</button>
                {canEditDelete() && <button onClick={() => { setEditingCash(null); setCashForm({ type: 'expense', amount: 0, description: '', date: new Date().toISOString().split('T')[0] }); setShowCashModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><Plus size={18} /> حركة جديدة</button>}
                <button onClick={distributeDailyProfit} className="bg-purple-600 text-white px-4 py-2 rounded flex items-center gap-2"><DollarSign size={18} /> توزيع أرباح اليوم</button>
              </div>
            </div>
            <div className="overflow-x-auto"><table className="min-w-full"><thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>الوصف</th><th>إجراءات</th></tr></thead><tbody>{cashLedger.map(entry => <tr key={entry.id} className={entry.type === 'income' ? 'bg-green-50' : entry.type === 'expense' ? 'bg-red-50' : 'bg-blue-50'}><td>{entry.date}</td><td>{entry.type === 'income' ? '💰 إيراد' : entry.type === 'expense' ? '💸 مصروف' : '📤 توزيع أرباح'}</td><td className={entry.type === 'income' ? 'text-green-600' : 'text-red-600'}>{entry.amount.toLocaleString()} ج.م</td><td>{entry.description}</td><td>{canEditDelete() && <button onClick={() => deleteCashEntry(entry.id)} className="text-red-600"><Trash2 size={18} /></button>}</td></tr>)}</tbody></table></div>
          </div>
        )}

        {/* ==================== NOTIFICATIONS TAB ==================== */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-lg shadow p-6"><h2 className="text-xl font-bold mb-4">🔔 سجل الإشعارات</h2><div className="space-y-3">{notifications.map(notif => <div key={notif.id} className="border-b pb-3"><div className="flex justify-between text-sm text-gray-500"><span>{new Date(notif.created_at).toLocaleString('ar-EG')}</span><span>{notif.user_name}</span></div><p><strong>{notif.action}:</strong> {notif.details}</p></div>)}</div></div>
        )}

        {/* ==================== USERS TAB ==================== */}
        {activeTab === 'users' && canManageUsers() && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-bold">👥 إدارة المستخدمين</h2>
              <button onClick={() => { setEditingUser(null); setUserForm({ username: '', password: '', full_name: '', phone: '', role: 'viewer', is_active: true }); setShowUserModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> مستخدم جديد</button>
            </div>
            <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th>#</th><th>اسم المستخدم</th><th>الاسم الكامل</th><th>رقم الهاتف</th><th>الدور</th><th>الحالة</th><th>آخر دخول</th><th>إجراءات</th></tr></thead><tbody>{users.map((user, idx) => <tr key={user.id} className={!user.is_active ? 'bg-gray-50 opacity-60' : ''}><td>{idx+1}</td><td>{user.username}</td><td>{user.full_name}</td><td>{user.phone || '—'}</td><td><span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-red-100 text-red-800' : user.role === 'manager' ? 'bg-purple-100 text-purple-800' : user.role === 'technician' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{user.role === 'admin' ? 'مدير' : user.role === 'manager' ? 'مدير عمليات' : user.role === 'technician' ? 'فني' : 'مشاهد'}</span></td><td><span className={`px-2 py-1 rounded-full text-xs ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.is_active ? 'نشط' : 'غير نشط'}</span></td><td>{user.last_login ? new Date(user.last_login).toLocaleString('ar-EG') : '—'}</td><td><div className="flex gap-2">{user.username !== 'admin' && <button onClick={() => { setEditingUser(user); setUserForm({ username: user.username, password: '', full_name: user.full_name, phone: user.phone, role: user.role, is_active: user.is_active }); setShowUserModal(true); }} className="text-blue-600"><Edit size={18} /></button>}{user.username !== 'admin' && <button onClick={() => handleDeleteUser(user.id)} className="text-red-600"><Trash2 size={18} /></button>}</div></td></tr>)}</tbody></table></div>
          </div>
        )}
      </main>

      {/* ==================== MODALS ==================== */}
      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b"><h3 className="text-lg font-semibold">{editingOrder ? 'تعديل أوردر' : 'إضافة أوردر جديد'}</h3><button onClick={() => setShowOrderModal(false)}><X /></button></div>
            <form onSubmit={submitOrder} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="اسم العميل *" className="p-2 border rounded" value={formData.customer_name} onChange={(e) => handleFormChange('customer_name', e.target.value)} required />
                <input type="tel" placeholder="رقم الهاتف *" className="p-2 border rounded" value={formData.phone} onChange={(e) => handleFormChange('phone', e.target.value)} required dir="ltr" />
                <div><select value={isOtherDevice ? 'other' : formData.device_type} onChange={(e) => handleFormChange('device_type', e.target.value)} className="p-2 border rounded w-full"><option value="">اختر نوع الجهاز</option>{DEVICE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}<option value="other">أخرى</option></select>{isOtherDevice && <input type="text" placeholder="اكتب نوع الجهاز" className="mt-2 p-2 border rounded w-full" value={customDevice} onChange={(e) => setCustomDevice(e.target.value)} />}</div>
                <div><select value={isOtherBrand ? 'other' : formData.brand} onChange={(e) => handleFormChange('brand', e.target.value)} className="p-2 border rounded w-full"><option value="">اختر الماركة</option>{BRANDS.map(b => <option key={b} value={b}>{b}</option>)}<option value="other">أخرى</option></select>{isOtherBrand && <input type="text" placeholder="اكتب الماركة" className="mt-2 p-2 border rounded w-full" value={customBrand} onChange={(e) => setCustomBrand(e.target.value)} />}</div>
                <textarea placeholder="العنوان" className="p-2 border rounded" value={formData.address} onChange={(e) => handleFormChange('address', e.target.value)} />
                <textarea placeholder="وصف المشكلة" className="p-2 border rounded" value={formData.problem_description} onChange={(e) => handleFormChange('problem_description', e.target.value)} />
                <select value={formData.technician} onChange={(e) => handleFormChange('technician', e.target.value)} className="p-2 border rounded"><option value="">اختر الفني</option>{technicians.filter(t => t.is_active).map(tech => <option key={tech.id} value={tech.name}>{tech.name}</option>)}</select>
                <input type="number" placeholder="إجمالي المبلغ" className="p-2 border rounded" value={formData.total_amount} onChange={(e) => handleFormChange('total_amount', parseFloat(e.target.value))} />
                <input type="number" placeholder="تكلفة قطع الغيار" className="p-2 border rounded" value={formData.parts_cost} onChange={(e) => handleFormChange('parts_cost', parseFloat(e.target.value))} />
                <input type="number" placeholder="مصاريف النقل" className="p-2 border rounded" value={formData.transport_cost} onChange={(e) => handleFormChange('transport_cost', parseFloat(e.target.value))} />
                <div className="bg-gray-100 p-2 rounded"><div>صافي المبلغ: {formData.net_amount?.toLocaleString()} ج.م</div><div>حصة الشركة (50%): {formData.company_share?.toLocaleString()} ج.م</div><div>حصة الفني (50%): {formData.technician_share?.toLocaleString()} ج.م</div></div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.is_paid} onChange={(e) => handleFormChange('is_paid', e.target.checked)} /> تم التحصيل</label>
              </div>
              <div className="flex justify-end gap-2 pt-4"><button type="button" onClick={() => setShowOrderModal(false)} className="px-4 py-2 border rounded">إلغاء</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">حفظ</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Technician Modal */}
      {showTechModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full"><div className="flex justify-between items-center p-4 border-b"><h3 className="text-lg font-semibold">{editingTech ? 'تعديل فني' : 'إضافة فني جديد'}</h3><button onClick={() => setShowTechModal(false)}><X /></button></div><form onSubmit={submitTechnician} className="p-4 space-y-4"><input type="text" placeholder="الاسم" className="w-full p-2 border rounded" value={techForm.name} onChange={(e) => setTechForm({...techForm, name: e.target.value})} required /><input type="tel" placeholder="رقم الهاتف" className="w-full p-2 border rounded" value={techForm.phone} onChange={(e) => setTechForm({...techForm, phone: e.target.value})} /><input type="text" placeholder="التخصص" className="w-full p-2 border rounded" value={techForm.specialization} onChange={(e) => setTechForm({...techForm, specialization: e.target.value})} /><input type="text" placeholder="اسم المستخدم" className="w-full p-2 border rounded" value={techForm.username} onChange={(e) => setTechForm({...techForm, username: e.target.value})} /><input type="password" placeholder="كلمة المرور" className="w-full p-2 border rounded" value={techForm.password} onChange={(e) => setTechForm({...techForm, password: e.target.value})} /><label className="flex items-center gap-2"><input type="checkbox" checked={techForm.is_active} onChange={(e) => setTechForm({...techForm, is_active: e.target.checked})} /> نشط</label><div className="flex justify-end gap-2"><button type="button" onClick={() => setShowTechModal(false)} className="px-4 py-2 border rounded">إلغاء</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">حفظ</button></div></form></div>
        </div>
      )}

      {/* Partner Modal */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full"><div className="flex justify-between items-center p-4 border-b"><h3 className="text-lg font-semibold">{editingPartner ? 'تعديل شريك' : 'إضافة شريك جديد'}</h3><button onClick={() => setShowPartnerModal(false)}><X /></button></div><form onSubmit={submitPartner} className="p-4 space-y-4"><input type="text" placeholder="الاسم" className="w-full p-2 border rounded" value={partnerForm.name} onChange={(e) => setPartnerForm({...partnerForm, name: e.target.value})} required /><input type="tel" placeholder="رقم الهاتف" className="w-full p-2 border rounded" value={partnerForm.phone} onChange={(e) => setPartnerForm({...partnerForm, phone: e.target.value})} /><input type="number" placeholder="نسبة الربح %" className="w-full p-2 border rounded" value={partnerForm.share_percentage} onChange={(e) => setPartnerForm({...partnerForm, share_percentage: parseFloat(e.target.value)})} step="0.01" /><label className="flex items-center gap-2"><input type="checkbox" checked={partnerForm.is_active} onChange={(e) => setPartnerForm({...partnerForm, is_active: e.target.checked})} /> نشط</label><div className="flex justify-end gap-2"><button type="button" onClick={() => setShowPartnerModal(false)} className="px-4 py-2 border rounded">إلغاء</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">حفظ</button></div></form></div>
        </div>
      )}

      {/* Cash Modal */}
      {showCashModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full"><div className="flex justify-between items-center p-4 border-b"><h3 className="text-lg font-semibold">{editingCash ? 'تعديل حركة' : 'إضافة حركة جديدة'}</h3><button onClick={() => setShowCashModal(false)}><X /></button></div><form onSubmit={addCashEntry} className="p-4 space-y-4"><select className="w-full p-2 border rounded" value={cashForm.type} onChange={(e) => setCashForm({...cashForm, type: e.target.value})}><option value="income">💰 إيراد</option><option value="expense">💸 مصروف</option></select><input type="number" placeholder="المبلغ" className="w-full p-2 border rounded" value={cashForm.amount} onChange={(e) => setCashForm({...cashForm, amount: parseFloat(e.target.value)})} required /><textarea placeholder="الوصف" className="w-full p-2 border rounded" value={cashForm.description} onChange={(e) => setCashForm({...cashForm, description: e.target.value})} required /><input type="date" className="w-full p-2 border rounded" value={cashForm.date} onChange={(e) => setCashForm({...cashForm, date: e.target.value})} /><div className="flex justify-end gap-2"><button type="button" onClick={() => setShowCashModal(false)} className="px-4 py-2 border rounded">إلغاء</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">حفظ</button></div></form></div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && canManageUsers() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full"><div className="flex justify-between items-center p-4 border-b"><h3 className="text-lg font-semibold">{editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</h3><button onClick={() => setShowUserModal(false)}><X /></button></div><form onSubmit={handleAddEditUser} className="p-4 space-y-4"><input type="text" placeholder="اسم المستخدم *" className="w-full p-2 border rounded" value={userForm.username} onChange={(e) => setUserForm({...userForm, username: e.target.value})} required /><input type="password" placeholder={editingUser ? 'كلمة مرور جديدة (اتركها فارغة إذا لم تريد التغيير)' : 'كلمة المرور *'} className="w-full p-2 border rounded" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} required={!editingUser} /><input type="text" placeholder="الاسم الكامل *" className="w-full p-2 border rounded" value={userForm.full_name} onChange={(e) => setUserForm({...userForm, full_name: e.target.value})} required /><input type="tel" placeholder="رقم الهاتف" className="w-full p-2 border rounded" value={userForm.phone} onChange={(e) => setUserForm({...userForm, phone: e.target.value})} /><select className="w-full p-2 border rounded" value={userForm.role} onChange={(e) => setUserForm({...userForm, role: e.target.value as SystemUser['role']})}><option value="admin">مدير النظام (كامل الصلاحيات)</option><option value="manager">مدير عمليات</option><option value="technician">فني</option><option value="viewer">مشاهد (عرض فقط)</option></select><label className="flex items-center gap-2"><input type="checkbox" checked={userForm.is_active} onChange={(e) => setUserForm({...userForm, is_active: e.target.checked})} /> مفعل</label><div className="flex justify-end gap-2 pt-4"><button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 border rounded">إلغاء</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">حفظ</button></div></form></div>
        </div>
      )}
    </div>
  );
};
