import { useMemo, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  Award,
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  DollarSign,
  Eye,
  Package,
  Star,
  Target,
  Timer,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { getTechnicianDisplayName, getTechnicianPhotoUrl, getTechnicianSpecialty } from '../utils/technicianProfile';

const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/[.\s_-]/g, '');
const numberValue = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const money = (value: number) => `${Math.round(value).toLocaleString('ar-EG')} ج.م`;
const statusOf = (order: any) => String(order?.status || '').trim().toLowerCase();
const dateOf = (order: any) => {
  const raw = order?.created_at || order?.date || order?.action_date;
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const daysSince = (order: any) => {
  const date = dateOf(order);
  return date ? Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000)) : 0;
};
const isExcludedFromOperational = (status: string) => ['cancelled', 'canceled', 'inspected'].includes(status);

function getTechnicianOrders(technician: any, orders: any[]) {
  const identities = new Set([
    technician?.id,
    technician?.name,
    technician?.username,
    technician?.code,
    technician?.techName,
  ].map(normalize).filter(Boolean));
  return orders.filter((order) => {
    const orderIdentity = normalize(order?.technician);
    return identities.has(orderIdentity) || (technician?.id != null && String(order?.technician_id || '') === String(technician.id));
  });
}

function statusLabel(status: string) {
  if (status === 'completed') return 'مكتمل';
  if (status === 'cancelled' || status === 'canceled') return 'ملغى';
  if (status === 'inspected') return 'كشف';
  if (status === 'deferred') return 'مؤجل';
  if (status === 'in-progress') return 'قيد التنفيذ';
  return 'قيد الانتظار';
}

function statusClass(status: string) {
  if (status === 'completed') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';
  if (status === 'cancelled' || status === 'canceled') return 'bg-rose-500/15 text-rose-300 border-rose-500/20';
  if (status === 'inspected') return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20';
  if (status === 'deferred') return 'bg-purple-500/15 text-purple-300 border-purple-500/20';
  return 'bg-blue-500/15 text-blue-300 border-blue-500/20';
}

function buildStats(orders: any[]) {
  const completed = orders.filter((order) => statusOf(order) === 'completed');
  const cancelled = orders.filter((order) => ['cancelled', 'canceled'].includes(statusOf(order)));
  const inspected = orders.filter((order) => statusOf(order) === 'inspected');
  const operational = orders.filter((order) => !isExcludedFromOperational(statusOf(order)));
  const active = operational.filter((order) => ['pending', 'in-progress', 'deferred'].includes(statusOf(order)));
  const delayed = active.filter((order) => daysSince(order) > 2);
  const invoice = orders.reduce((sum, order) => sum + numberValue(order.total_amount), 0);
  const parts = orders.reduce((sum, order) => sum + numberValue(order.parts_cost), 0);
  const transport = orders.reduce((sum, order) => sum + numberValue(order.transport_cost), 0);
  const earnings = completed.reduce((sum, order) => sum + numberValue(order.technician_share), 0);
  const companyProfit = invoice - parts - transport - earnings;
  const ratings = orders.map((order) => numberValue(order.rating ?? order.customer_rating ?? order.feedback_rating)).filter((rating) => rating >= 1 && rating <= 5);
  const durations = completed.map((order) => {
    const start = dateOf(order);
    const end = order.completed_at || order.updated_at ? new Date(order.completed_at || order.updated_at) : null;
    if (!start || !end || Number.isNaN(end.getTime())) return 0;
    return Math.max(0, (end.getTime() - start.getTime()) / 86400000);
  }).filter((days) => days > 0 && days < 365);

  return {
    total: orders.length,
    completed: completed.length,
    cancelled: cancelled.length,
    inspected: inspected.length,
    active: active.length,
    delayed: delayed.length,
    invoice,
    parts,
    transport,
    earnings,
    companyProfit,
    partsPercent: invoice ? (parts / invoice) * 100 : 0,
    transportPercent: invoice ? (transport / invoice) * 100 : 0,
    successRate: operational.length ? (completed.length / operational.length) * 100 : 0,
    averageRating: ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0,
    ratingCount: ratings.length,
    averageDays: durations.length ? durations.reduce((sum, days) => sum + days, 0) / durations.length : 0,
  };
}

export default function TechnicianPerformanceAdmin({ orders, technicians }: { orders: any[]; technicians: any[] }) {
  const [expandedTech, setExpandedTech] = useState<string | null>(null);
  const [periodPreset, setPeriodPreset] = useState<'all' | 'this_month' | 'last_month' | 'custom'>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const dateBounds = useMemo(() => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;
    let label = 'كل الوقت';
    if (periodPreset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      label = 'هذا الشهر';
    } else if (periodPreset === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      label = 'الشهر السابق';
    } else if (periodPreset === 'custom') {
      if (customStart) {
        const parsedStart = new Date(`${customStart}T00:00:00`);
        if (!Number.isNaN(parsedStart.getTime())) start = parsedStart;
      }
      if (customEnd) {
        const parsedEnd = new Date(`${customEnd}T23:59:59.999`);
        if (!Number.isNaN(parsedEnd.getTime())) end = parsedEnd;
      }
      label = customStart || customEnd ? `${customStart || 'البداية'} — ${customEnd || 'حتى الآن'}` : 'فترة مخصصة';
    }
    return { start, end, label };
  }, [periodPreset, customStart, customEnd]);

  const periodOrders = useMemo(() => {
    const source = Array.isArray(orders) ? orders : [];
    if (!dateBounds.start && !dateBounds.end) return source;
    return source.filter((order) => {
      const date = dateOf(order);
      if (!date) return false;
      const timestamp = date.getTime();
      return (!dateBounds.start || timestamp >= dateBounds.start.getTime()) && (!dateBounds.end || timestamp <= dateBounds.end.getTime());
    });
  }, [orders, dateBounds]);

  const cards = useMemo(() => {
    const source = Array.isArray(technicians) && technicians.length
      ? technicians
      : Array.from(new Set(periodOrders.map((order) => order?.technician).filter(Boolean))).map((name) => ({ name }));

    return source.map((technician, index) => {
      const techOrders = getTechnicianOrders(technician, periodOrders);
      const stats = buildStats(techOrders);
      const displayName = getTechnicianDisplayName(technician);
      const specialty = getTechnicianSpecialty(technician);
      const photo = getTechnicianPhotoUrl(technician);
      const recentOrders = [...techOrders].sort((a, b) => (dateOf(b)?.getTime() || 0) - (dateOf(a)?.getTime() || 0)).slice(0, 5);
      return { technician, techOrders, stats, displayName, specialty, photo, recentOrders, rank: index + 1 };
    }).sort((a, b) => b.stats.completed - a.stats.completed || b.stats.successRate - a.stats.successRate);
  }, [periodOrders, technicians]);

  const totals = useMemo(() => cards.reduce((result, card) => {
    result.total += card.stats.total;
    result.completed += card.stats.completed;
    result.cancelled += card.stats.cancelled;
    result.inspected += card.stats.inspected;
    result.earnings += card.stats.earnings;
    result.totalInvoice += card.stats.invoice;
    result.companyProfit += card.stats.companyProfit;
    return result;
  }, { total: 0, completed: 0, cancelled: 0, inspected: 0, earnings: 0, totalInvoice: 0, companyProfit: 0 }), [cards]);

  return (
    <div className="space-y-5" dir="rtl">
      <section className="rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black text-slate-300">الفترة الزمنية للنتائج</p>
            <p className="mt-1 text-[11px] text-slate-500">الوضع الافتراضي يعرض كل السجل، ولا يؤثر على الخزنة أو بيانات الأوردرات.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="text-xs font-bold text-slate-400">الفترة<select value={periodPreset} onChange={(event) => setPeriodPreset(event.target.value as typeof periodPreset)} className="mt-1 block min-w-44 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-bold text-white"><option value="all">كل الوقت</option><option value="this_month">هذا الشهر</option><option value="last_month">الشهر السابق</option><option value="custom">فترة مخصصة</option></select></label>
            {periodPreset === 'custom' && <>
              <label className="text-xs font-bold text-slate-400">من تاريخ<input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="mt-1 block rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" /></label>
              <label className="text-xs font-bold text-slate-400">إلى تاريخ<input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="mt-1 block rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" /></label>
            </>}
          </div>
        </div>
      </section>
      <section className="rounded-3xl border border-orange-500/25 bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/40 p-5 shadow-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold text-orange-300">لوحة المدير · نتائج فردية</p>
            <h2 className="mt-1 flex items-center gap-2 text-2xl font-black text-white"><Wrench className="text-orange-400" /> أداء كل فني</h2>
            <p className="mt-2 text-xs leading-6 text-slate-400">كل فني في بطاقة مستقلة، مع فصل قائمة العمل عن النتائج التاريخية للملغي والكشف.</p>
            <p className="mt-1 text-[11px] font-bold text-orange-300">الفترة المعروضة: {dateBounds.label} · {periodOrders.length} أوردر</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
            <div className="rounded-xl bg-slate-800 px-3 py-2 text-center"><p className="text-[10px] text-slate-500">الفنيون</p><p className="text-lg font-black text-white">{cards.length}</p></div>
            <div className="rounded-xl bg-slate-800 px-3 py-2 text-center"><p className="text-[10px] text-slate-500">الإجمالي</p><p className="text-lg font-black text-blue-300">{totals.total}</p></div>
            <div className="rounded-xl bg-slate-800 px-3 py-2 text-center"><p className="text-[10px] text-slate-500">مكتمل</p><p className="text-lg font-black text-emerald-300">{totals.completed}</p></div>
            <div className="rounded-xl bg-slate-800 px-3 py-2 text-center"><p className="text-[10px] text-slate-500">ملغى/كشف</p><p className="text-lg font-black text-yellow-300">{totals.cancelled + totals.inspected}</p></div>
            <div className="rounded-xl bg-slate-800 px-3 py-2 text-center"><p className="text-[10px] text-slate-500">مجموع الدخل</p><p className="text-sm font-black text-cyan-300">{money(totals.totalInvoice)}</p></div>
            <div className="col-span-2 rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-3 py-2 text-center sm:col-span-1"><p className="text-[10px] text-slate-500">صافي الشركة</p><p className="text-sm font-black text-emerald-300">{money(totals.companyProfit)}</p></div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {cards.map((card) => {
          const { stats } = card;
          const isExpanded = expandedTech === String(card.technician?.id || card.displayName);
          const expenseWarning = stats.partsPercent > 40 || stats.transportPercent > 15;
          const lowSuccess = stats.total > 0 && stats.successRate < 70;
          return (
            <article key={String(card.technician?.id || card.displayName)} className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-xl transition hover:border-orange-500/50">
              <div className="border-b border-slate-800 bg-gradient-to-l from-slate-800/90 to-slate-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-orange-500/30 bg-orange-500/10">
                      {card.photo ? <img src={card.photo} alt={`صورة ${card.displayName}`} className="h-full w-full object-cover" /> : <Wrench className="text-orange-400" size={25} />}
                      {card.rank <= 3 && <span className="absolute bottom-0 left-0 rounded-tr-lg bg-orange-500 px-1.5 py-0.5 text-[9px] font-black text-white">#{card.rank}</span>}
                    </div>
                    <div className="min-w-0"><h3 className="truncate text-lg font-black text-white">{card.displayName}</h3><p className="mt-1 truncate text-[11px] text-slate-400">{specialtyLabel(card.specialty)} · {stats.total} أوردر</p></div>
                  </div>
                  <div className={`shrink-0 rounded-xl px-2.5 py-1.5 text-center ${lowSuccess ? 'bg-rose-500/15 text-rose-300' : 'bg-emerald-500/15 text-emerald-300'}`}><p className="text-[10px]">نجاح</p><p className="text-lg font-black">{stats.successRate.toFixed(0)}%</p></div>
                </div>
                {(expenseWarning || lowSuccess) && <div className="mt-3 flex flex-wrap gap-2">{expenseWarning && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-300"><AlertCircle size={12} /> مراجعة مصروفات</span>}{lowSuccess && <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-1 text-[10px] font-bold text-rose-300"><Target size={12} /> أقل من 70%</span>}</div>}
              </div>

              <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-6">
                <Metric label="مكتمل" value={stats.completed} color="text-emerald-300" icon={<CheckCircle2 size={14} />} />
                <Metric label="نشط" value={stats.active} color="text-blue-300" icon={<Clock3 size={14} />} />
                <Metric label="متأخر" value={stats.delayed} color="text-orange-300" icon={<Timer size={14} />} />
                <Metric label="ملغى" value={stats.cancelled} color="text-rose-300" icon={<Ban size={14} />} />
                <Metric label="كشف" value={stats.inspected} color="text-yellow-300" icon={<DollarSign size={14} />} />
                <Metric label="تقييم" value={stats.averageRating ? stats.averageRating.toFixed(1) : '—'} color="text-yellow-300" icon={<Star size={14} />} />
              </div>

              <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2">
                <MiniBar label="قطع الغيار" value={stats.partsPercent} amount={stats.parts} limit={40} color="orange" icon={<Package size={15} />} />
                <MiniBar label="المواصلات" value={stats.transportPercent} amount={stats.transport} limit={15} color="blue" icon={<TrendingUp size={15} />} />
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-800 px-4 py-3 text-xs sm:grid-cols-5">
                <div><p className="text-slate-500">إجمالي الفواتير</p><p className="mt-1 font-black text-white">{money(stats.invoice)}</p></div>
                <div><p className="text-slate-500">مستحق الفني</p><p className="mt-1 font-black text-orange-300">{money(stats.earnings)}</p></div>
                <div><p className="text-slate-500">صافي ربح الشركة</p><p className={`mt-1 font-black ${stats.companyProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{money(stats.companyProfit)}</p></div>
                <div><p className="text-slate-500">متوسط الإنجاز</p><p className="mt-1 font-black text-emerald-300">{stats.averageDays ? `${stats.averageDays.toFixed(1)} يوم` : '—'}</p></div>
                <div><p className="text-slate-500">التقييمات</p><p className="mt-1 font-black text-yellow-300">{stats.ratingCount}</p></div>
              </div>

              <button type="button" onClick={() => setExpandedTech(isExpanded ? null : String(card.technician?.id || card.displayName))} className="flex w-full items-center justify-center gap-2 border-t border-slate-800 bg-slate-950/40 px-4 py-3 text-xs font-black text-slate-300 transition hover:bg-slate-800 hover:text-white"><Eye size={15} /> {isExpanded ? 'إخفاء تفاصيل الأوردرات' : 'عرض آخر أوردرات الفني'} {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>
              {isExpanded && <div className="divide-y divide-slate-800 border-t border-slate-800 bg-slate-950/50">{card.recentOrders.map((order) => <div key={order.id || order.order_number} className="flex items-center justify-between gap-3 px-4 py-3"><div className="min-w-0"><p className="truncate text-xs font-black text-white">{order.order_number || '—'} · {order.customer_name || 'عميل'}</p><p className="mt-1 text-[10px] text-slate-500">{order.device_type || 'جهاز'} · {dateOf(order)?.toLocaleDateString('ar-EG') || 'بدون تاريخ'}</p></div><div className="shrink-0 text-left"><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-black ${statusClass(statusOf(order))}`}>{statusLabel(statusOf(order))}</span><p className="mt-1 text-[10px] text-slate-500">{numberValue(order.total_amount) ? money(numberValue(order.total_amount)) : '—'}</p></div></div>)}{!card.recentOrders.length && <p className="p-5 text-center text-xs text-slate-500">لا توجد أوردرات لهذا الفني</p>}</div>}
            </article>
          );
        })}
      </div>
      {!cards.length && <div className="rounded-3xl border border-slate-700 bg-slate-900 p-10 text-center text-sm text-slate-400">لا توجد بيانات فنيين لعرض الأداء حالياً.</div>}
    </div>
  );
}

function specialtyLabel(value: string) {
  const text = String(value || '').trim();
  return text ? (text.startsWith('متخصص') ? text : `متخصص ${text}`) : 'التخصص غير محدد';
}

function Metric({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: ReactNode }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2 text-center"><div className={`mx-auto flex w-fit items-center gap-1 ${color}`}>{icon}<span className="text-sm font-black">{value}</span></div><p className="mt-1 text-[9px] text-slate-500">{label}</p></div>;
}

function MiniBar({ label, value, amount, limit, color, icon }: { label: string; value: number; amount: number; limit: number; color: 'orange' | 'blue'; icon: ReactNode }) {
  const exceeded = value > limit;
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3"><div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 text-xs font-bold text-slate-300">{icon}{label}</span><span className={`text-sm font-black ${exceeded ? 'text-rose-400' : color === 'orange' ? 'text-orange-300' : 'text-blue-300'}`}>{value.toFixed(1)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${exceeded ? 'bg-rose-500' : color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(value, 100)}%` }} /></div><div className="mt-1 flex justify-between text-[9px] text-slate-500"><span>{money(amount)}</span><span>الحد {limit}%</span></div></div>;
}
