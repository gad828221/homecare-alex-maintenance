import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, Award, DollarSign, AlertCircle } from 'lucide-react';

interface TechnicianStats {
  name: string;
  completed: number;
  inProgress: number;
  delayed: number;
  totalEarnings: number;
  avgCompletionDays: number;
  totalOrders: number;
  delayedPercentage: number;
}

export default function TechnicianPerformance({ orders, technicians }: { orders: any[]; technicians: any[] }) {
  // حساب إحصائيات كل فني
  const stats: TechnicianStats[] = useMemo(() => {
    const techMap = new Map<string, TechnicianStats>();
    
    // تهيئة الخريطة بجميع الفنيين
    technicians.forEach(tech => {
      techMap.set(tech.name, {
        name: tech.name,
        completed: 0,
        inProgress: 0,
        delayed: 0,
        totalEarnings: 0,
        avgCompletionDays: 0,
        totalOrders: 0,
        delayedPercentage: 0,
      });
    });
    
    // معالجة الأوردرات
    orders.forEach(order => {
      const techName = order.technician;
      if (!techName || !techMap.has(techName)) return;
      
      const techStats = techMap.get(techName)!;
      techStats.totalOrders++;
      
      if (order.status === 'completed') {
        techStats.completed++;
        techStats.totalEarnings += order.technician_share || 0;
        
        // حساب أيام الإكمال (إذا كان هناك تاريخ الإكمال)
        if (order.completed_at && order.date) {
          const start = new Date(order.date);
          const end = new Date(order.completed_at);
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          techStats.avgCompletionDays = (techStats.avgCompletionDays * (techStats.completed - 1) + days) / techStats.completed;
        }
      } else if (order.status === 'in-progress') {
        techStats.inProgress++;
      }
      
      // حساب التأخير (الأوردرات التي مضى عليها أكثر من يومين ولم تكتمل)
      if (order.status !== 'completed' && order.status !== 'cancelled') {
        const orderDate = new Date(order.date);
        const today = new Date();
        const diffDays = Math.ceil((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 2) {
          techStats.delayed++;
        }
      }
    });
    
    // حساب نسب التأخير
    techMap.forEach(tech => {
      tech.delayedPercentage = tech.totalOrders ? (tech.delayed / tech.totalOrders) * 100 : 0;
    });
    
    return Array.from(techMap.values()).sort((a, b) => b.completed - a.completed);
  }, [orders, technicians]);
  
  // إحصائيات عامة للبطاقات
  const topEarner = [...stats].sort((a, b) => b.totalEarnings - a.totalEarnings)[0];
  const topPerformer = [...stats].sort((a, b) => b.completed - a.completed)[0];
  const totalCompleted = stats.reduce((sum, t) => sum + t.completed, 0);
  const totalDelayed = stats.reduce((sum, t) => sum + t.delayed, 0);
  
  // بيانات الرسم البياني الشريطي (أفضل 5 فنيين من حيث الأرباح)
  const barData = stats.slice(0, 5).map(t => ({
    name: t.name,
    الأرباح: t.totalEarnings,
    المنجز: t.completed,
  }));
  
  // بيانات الرسم الدائري (توزيع الأوردرات حسب الحالة)
  const pieData = [
    { name: 'مكتمل', value: totalCompleted, color: '#10b981' },
    { name: 'قيد التنفيذ', value: stats.reduce((sum, t) => sum + t.inProgress, 0), color: '#3b82f6' },
    { name: 'متأخر', value: totalDelayed, color: '#ef4444' },
  ].filter(d => d.value > 0);
  
  const COLORS = ['#10b981', '#3b82f6', '#ef4444'];
  
  return (
    <div className="space-y-6">
      {/* بطاقات الأداء العامة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex justify-between items-start">
            <div><p className="text-emerald-100 text-sm">أفضل فني (أرباح)</p><p className="text-2xl font-bold">{topEarner?.name || '-'}</p><p className="text-emerald-100 text-sm mt-1">{topEarner?.totalEarnings.toLocaleString()} ج.م</p></div>
            <DollarSign className="w-10 h-10 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex justify-between items-start">
            <div><p className="text-blue-100 text-sm">أفضل فني (إنجاز)</p><p className="text-2xl font-bold">{topPerformer?.name || '-'}</p><p className="text-blue-100 text-sm mt-1">{topPerformer?.completed} أوردر</p></div>
            <Award className="w-10 h-10 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex justify-between items-start">
            <div><p className="text-purple-100 text-sm">إجمالي الأوردرات المكتملة</p><p className="text-2xl font-bold">{totalCompleted}</p><p className="text-purple-100 text-sm mt-1">من جميع الفنيين</p></div>
            <TrendingUp className="w-10 h-10 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex justify-between items-start">
            <div><p className="text-red-100 text-sm">الأوردرات المتأخرة</p><p className="text-2xl font-bold">{totalDelayed}</p><p className="text-red-100 text-sm mt-1">بحاجة لمتابعة</p></div>
            <AlertCircle className="w-10 h-10 opacity-50" />
          </div>
        </div>
      </div>
      
      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الرسم البياني الشريطي: أرباح الفنيين */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-white font-bold mb-4 text-center">🏆 أعلى الفنيين أرباحاً</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
              <Legend />
              <Bar dataKey="الأرباح" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="المنجز" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* الرسم الدائري: توزيع الأوردرات */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-white font-bold mb-4 text-center">📊 توزيع الأوردرات (جميع الفنيين)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* جدول تفصيلي لأداء الفنيين */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700">
              <tr>
                <th className="p-3 text-right">الفني</th><th className="p-3 text-right">مكتمل</th><th className="p-3 text-right">قيد التنفيذ</th><th className="p-3 text-right">متأخر</th><th className="p-3 text-right">نسبة التأخير</th><th className="p-3 text-right">إجمالي الأرباح</th><th className="p-3 text-right">متوسط الأيام/أوردر</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(tech => (
                <tr key={tech.name} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                  <td className="p-3 font-semibold text-white">{tech.name}</td>
                  <td className="p-3 text-green-400">{tech.completed}</td>
                  <td className="p-3 text-blue-400">{tech.inProgress}</td>
                  <td className="p-3 text-red-400">{tech.delayed}</td>
                  <td className="p-3 text-yellow-400">{tech.delayedPercentage.toFixed(1)}%</td>
                  <td className="p-3 text-orange-400">{tech.totalEarnings.toLocaleString()} ج.م</td>
                  <td className="p-3 text-slate-300">{tech.avgCompletionDays.toFixed(1)} يوم</td>
                </tr>
              ))}
              {stats.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-400">لا توجد بيانات كافية لعرض الأداء</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
    }
