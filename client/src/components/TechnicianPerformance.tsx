import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import {
  AlertCircle,
  Award,
  Car,
  CheckCircle2,
  Clock3,
  DollarSign,
  Gauge,
  Package,
  Star,
  Target,
  Timer,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import { getTechnicianDisplayName } from '../utils/technicianProfile';

const numberValue = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const money = (value: number) => `${Math.round(value).toLocaleString('ar-EG')} ج.م`;

const getStatus = (order: any) => String(order?.status || '').trim().toLowerCase();

const getOrderDate = (order: any) => {
  const raw = order?.created_at || order?.date || order?.action_date;
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const daysSince = (order: any) => {
  const date = getOrderDate(order);
  if (!date) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
};

const formatOrderDate = (order: any) => {
  const date = getOrderDate(order);
  return date ? date.toLocaleDateString('ar-EG', { day: '2-digit', month: 'short' }) : '—';
};

interface TechnicianPerformanceProps {
  orders: any[];
  technicians: any[];
}

export default function TechnicianPerformance({ orders, technicians }: TechnicianPerformanceProps) {
  const performance = useMemo(() => {
    const reportOrders = Array.isArray(orders) ? orders : [];
    const cancelledOrders = reportOrders.filter((order) => ['cancelled', 'canceled'].includes(getStatus(order)));
    const inspectedOrders = reportOrders.filter((order) => getStatus(order) === 'inspected');
    const operationalOrders = reportOrders.filter((order) => !['cancelled', 'canceled', 'inspected'].includes(getStatus(order)));
    const completedOrders = operationalOrders.filter((order) => getStatus(order) === 'completed');
    const activeOrders = operationalOrders.filter((order) => ['pending', 'in-progress', 'deferred'].includes(getStatus(order)));
    const delayedOrders = activeOrders.filter((order) => daysSince(order) > 2);
    const totalInvoice = reportOrders.reduce((sum, order) => sum + numberValue(order.total_amount), 0);
    const partsCost = reportOrders.reduce((sum, order) => sum + numberValue(order.parts_cost), 0);
    const transportCost = reportOrders.reduce((sum, order) => sum + numberValue(order.transport_cost), 0);
    const technicianEarnings = completedOrders.reduce((sum, order) => sum + numberValue(order.technician_share), 0);
    // نسبة النجاح من إجمالي السجل، بما فيه الملغي والكشف المؤرشفين، وليس من المكتمل والنشط فقط.
    const successRate = reportOrders.length ? (completedOrders.length / reportOrders.length) * 100 : 0;
    const partsPercent = totalInvoice ? (partsCost / totalInvoice) * 100 : 0;
    const transportPercent = totalInvoice ? (transportCost / totalInvoice) * 100 : 0;

    const completionDurations = completedOrders.map((order) => {
      const start = getOrderDate(order);
      const endRaw = order.completed_at || order.updated_at;
      const end = endRaw ? new Date(endRaw) : null;
      if (!start || !end || Number.isNaN(end.getTime())) return 0;
      return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }).filter((days) => days > 0 && days < 365);
    const averageCompletionDays = completionDurations.length
      ? completionDurations.reduce((sum, days) => sum + days, 0) / completionDurations.length
      : 0;

    const ratings = reportOrders.map((order) => numberValue(order.rating ?? order.customer_rating ?? order.feedback_rating)).filter((rating) => rating >= 1 && rating <= 5);
    const averageRating = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;

    const statusData = [
      { name: 'مكتمل', value: completedOrders.length, color: '#10b981' },
      { name: 'نشط', value: Math.max(0, activeOrders.length - delayedOrders.length - activeOrders.filter((order) => getStatus(order) === 'deferred').length), color: '#3b82f6' },
      { name: 'مؤجل', value: activeOrders.filter((order) => getStatus(order) === 'deferred').length, color: '#a855f7' },
      { name: 'متأخر', value: delayedOrders.length, color: '#f97316' },
      { name: 'ملغى', value: cancelledOrders.length, color: '#ef4444' },
      { name: 'كشف', value: inspectedOrders.length, color: '#eab308' },
    ].filter((item) => item.value > 0);

    const monthlyData = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index), 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthOrders = reportOrders.filter((order) => {
        const orderDate = getOrderDate(order);
        return orderDate && `${orderDate.getFullYear()}-${orderDate.getMonth()}` === monthKey;
      });
      return {
        name: date.toLocaleDateString('ar-EG', { month: 'short' }),
        مكتمل: monthOrders.filter((order) => getStatus(order) === 'completed').length,
        إجمالي: monthOrders.length,
      };
    });

    const recentOrders = [...reportOrders]
      .sort((a, b) => (getOrderDate(b)?.getTime() || 0) - (getOrderDate(a)?.getTime() || 0))
      .slice(0, 5);

    return {
      visibleOrders: reportOrders,
      operationalOrders,
      cancelledOrders,
      inspectedOrders,
      completedOrders,
      activeOrders,
      delayedOrders,
      totalInvoice,
      partsCost,
      transportCost,
      technicianEarnings,
      successRate,
      partsPercent,
      transportPercent,
      averageCompletionDays,
      averageRating,
      ratingCount: ratings.length,
      statusData,
      monthlyData,
      recentOrders,
    };
  }, [orders]);

  const rawTechnicianName = technicians?.[0]?.name || technicians?.[0]?.username || performance.visibleOrders[0]?.technician || 'الفني';
  const technicianName = getTechnicianDisplayName({ name: rawTechnicianName });
  const hasExpenseWarning = performance.partsPercent > 40 || performance.transportPercent > 15;
  const hasSuccessWarning = performance.visibleOrders.length > 0 && performance.successRate < 70;

  return (
    <div className="space-y-5" dir="rtl">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-orange-500/25 bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/50 p-5 shadow-2xl">
        <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold text-orange-300">لوحة المتابعة الشخصية</p>
            <h2 className="mt-1 text-2xl font-black text-white">أداء {technicianName}</h2>
            <p className="mt-2 text-xs leading-6 text-slate-400">ملخص كامل للنتائج، مع احتساب الملغي والكشف المؤرشفين ضمن إجمالي أوردراتك ونسبة النجاح.</p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-300">
            <Gauge size={17} /> متابعة مباشرة
          </div>
        </div>
      </section>

      {(hasExpenseWarning || hasSuccessWarning) && (
        <section className="grid gap-3 sm:grid-cols-2" aria-live="polite">
          {hasExpenseWarning && (
            <div className="rounded-2xl border border-amber-500/50 bg-amber-950/35 p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 shrink-0 text-amber-400" size={20} />
                <div>
                  <p className="font-black text-amber-200">مراجعة المصاريف</p>
                  <p className="mt-1 text-xs leading-6 text-amber-100/75">تحقق من نسب قطع الغيار والمواصلات قبل تصفية الأوردرات القادمة.</p>
                </div>
              </div>
            </div>
          )}
          {hasSuccessWarning && (
            <div className="rounded-2xl border border-rose-500/50 bg-rose-950/35 p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <Target className="mt-0.5 shrink-0 text-rose-400" size={20} />
                <div>
                  <p className="font-black text-rose-200">فرصة لتحسين نسبة النجاح</p>
                  <p className="mt-1 text-xs leading-6 text-rose-100/75">النسبة الحالية {performance.successRate.toFixed(0)}%، والهدف التشغيلي 70% أو أكثر.</p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/70 to-slate-900 p-4 shadow-xl">
          <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-blue-200">إجمالي الأوردرات</span><TrendingUp className="text-blue-400" size={20} /></div>
          <p className="mt-3 text-3xl font-black text-white">{performance.visibleOrders.length}</p>
          <p className="mt-1 text-[10px] text-slate-400">منها {performance.completedOrders.length} مكتمل</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/70 to-slate-900 p-4 shadow-xl">
          <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-emerald-200">نسبة النجاح</span><Target className="text-emerald-400" size={20} /></div>
          <p className="mt-3 text-3xl font-black text-emerald-300">{performance.successRate.toFixed(0)}%</p>
          <p className="mt-1 text-[10px] text-slate-400">الهدف 70%</p>
        </div>
        <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-950/70 to-slate-900 p-4 shadow-xl">
          <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-orange-200">مستحقاتي</span><Wallet className="text-orange-400" size={20} /></div>
          <p className="mt-3 text-2xl font-black text-orange-300">{money(performance.technicianEarnings)}</p>
          <p className="mt-1 text-[10px] text-slate-400">من الأوردرات المكتملة</p>
        </div>
        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/70 to-slate-900 p-4 shadow-xl">
          <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-purple-200">متوسط التقييم</span><Star className="fill-yellow-400 text-yellow-400" size={20} /></div>
          <p className="mt-3 text-3xl font-black text-yellow-300">{performance.averageRating ? performance.averageRating.toFixed(1) : '—'}</p>
          <p className="mt-1 text-[10px] text-slate-400">{performance.ratingCount ? `${performance.ratingCount} تقييم` : 'لا توجد تقييمات مسجلة'}</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4"><div className="flex items-center gap-2 text-slate-300"><Clock3 size={17} className="text-blue-400" /><span className="text-xs font-bold">قيد المتابعة</span></div><p className="mt-3 text-2xl font-black text-white">{performance.activeOrders.length}</p><p className="mt-1 text-[10px] text-slate-500">أوردرات نشطة حالياً</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4"><div className="flex items-center gap-2 text-slate-300"><Timer size={17} className="text-orange-400" /><span className="text-xs font-bold">المتأخر</span></div><p className="mt-3 text-2xl font-black text-orange-300">{performance.delayedOrders.length}</p><p className="mt-1 text-[10px] text-slate-500">أكثر من يومين</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4"><div className="flex items-center gap-2 text-slate-300"><Award size={17} className="text-emerald-400" /><span className="text-xs font-bold">متوسط الإنجاز</span></div><p className="mt-3 text-2xl font-black text-emerald-300">{performance.averageCompletionDays ? `${performance.averageCompletionDays.toFixed(1)} يوم` : '—'}</p><p className="mt-1 text-[10px] text-slate-500">للأوردر المكتمل</p></div>
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-4"><div className="flex items-center gap-2 text-red-200"><AlertCircle size={17} className="text-red-400" /><span className="text-xs font-bold">ملغى</span></div><p className="mt-3 text-2xl font-black text-red-300">{performance.cancelledOrders.length}</p><p className="mt-1 text-[10px] text-slate-500">محتسب ضمن الإجمالي</p></div>
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-950/20 p-4"><div className="flex items-center gap-2 text-yellow-200"><DollarSign size={17} className="text-yellow-400" /><span className="text-xs font-bold">كشف</span></div><p className="mt-3 text-2xl font-black text-yellow-300">{performance.inspectedOrders.length}</p><p className="mt-1 text-[10px] text-slate-500">محتسب ضمن الإجمالي</p></div>
      </section>

      <section className="rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-xl sm:p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div><h3 className="flex items-center gap-2 text-base font-black text-white"><DollarSign className="text-orange-400" size={20} /> رادار المصروفات</h3><p className="mt-1 text-[11px] text-slate-500">النسب محسوبة من إجمالي الفواتير: قطع الغيار 40% والمواصلات 15%.</p></div>
          <div className="rounded-xl bg-slate-800 px-3 py-2 text-left"><p className="text-[10px] text-slate-500">إجمالي الفواتير</p><p className="text-sm font-black text-white">{money(performance.totalInvoice)}</p></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Package size={18} className="text-orange-400" /><span className="text-sm font-black text-white">قطع الغيار</span></div><span className={`text-lg font-black ${performance.partsPercent > 40 ? 'text-rose-400' : 'text-emerald-400'}`}>{performance.partsPercent.toFixed(1)}%</span></div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full transition-all ${performance.partsPercent > 40 ? 'bg-rose-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(performance.partsPercent, 100)}%` }} /></div>
            <div className="mt-2 flex justify-between text-[10px] text-slate-500"><span>{money(performance.partsCost)}</span><span>الحد 40%</span></div>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Car size={18} className="text-blue-400" /><span className="text-sm font-black text-white">المواصلات</span></div><span className={`text-lg font-black ${performance.transportPercent > 15 ? 'text-rose-400' : 'text-emerald-400'}`}>{performance.transportPercent.toFixed(1)}%</span></div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full transition-all ${performance.transportPercent > 15 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(performance.transportPercent, 100)}%` }} /></div>
            <div className="mt-2 flex justify-between text-[10px] text-slate-500"><span>{money(performance.transportCost)}</span><span>الحد 15%</span></div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-xl">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-white"><TrendingUp className="text-blue-400" size={18} /> اتجاه الإنجاز خلال آخر 6 أشهر</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performance.monthlyData} margin={{ top: 10, right: 0, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', color: '#fff', borderRadius: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="إجمالي" fill="#64748b" radius={[5, 5, 0, 0]} />
              <Bar dataKey="مكتمل" fill="#10b981" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-xl">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-white"><CheckCircle2 className="text-emerald-400" size={18} /> توزيع الحالات</h3>
          {performance.statusData.length ? <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={performance.statusData} cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>{performance.statusData.map((entry, index) => <Cell key={`status-${index}`} fill={entry.color} />)}</Pie><Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', color: '#fff', borderRadius: 12 }} /></PieChart></ResponsiveContainer> : <div className="flex h-[250px] items-center justify-center text-sm text-slate-500">لا توجد بيانات كافية</div>}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-xl">
        <div className="border-b border-slate-800 p-4"><h3 className="flex items-center gap-2 text-sm font-black text-white"><Clock3 className="text-orange-400" size={18} /> آخر الأوردرات في الأداء</h3></div>
        <div className="divide-y divide-slate-800">
          {performance.recentOrders.map((order) => {
            const status = getStatus(order);
            const statusText = status === 'completed' ? 'مكتمل' : status === 'deferred' ? 'مؤجل' : status === 'in-progress' ? 'قيد التنفيذ' : 'قيد الانتظار';
            const statusClass = status === 'completed' ? 'bg-emerald-500/15 text-emerald-300' : status === 'deferred' ? 'bg-purple-500/15 text-purple-300' : 'bg-blue-500/15 text-blue-300';
            return <div key={order.id || order.order_number} className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><p className="truncate text-sm font-black text-white">{order.order_number || '—'} · {order.customer_name || 'عميل'}</p><p className="mt-1 text-[10px] text-slate-500">{order.device_type || 'جهاز'} · {formatOrderDate(order)}</p></div><div className="shrink-0 text-left"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${statusClass}`}>{statusText}</span><p className="mt-1 text-[10px] text-slate-500">{numberValue(order.total_amount) ? money(numberValue(order.total_amount)) : 'بدون فاتورة'}</p></div></div>;
          })}
          {!performance.recentOrders.length && <div className="p-8 text-center text-sm text-slate-500">لا توجد أوردرات متاحة حتى الآن</div>}
        </div>
      </section>
    </div>
  );
}
