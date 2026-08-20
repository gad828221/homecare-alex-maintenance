import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, ChevronDown, Loader2, RefreshCw, ShieldAlert, X } from 'lucide-react';
import {
  diagnoseNotifications,
  diagnosticsSummary,
  getDiagnosticHint,
  getDiagnosticStatusClass,
  getDiagnosticStatusIcon,
  getDiagnosticStatusLabel,
  hardResetNotifications,
  hasDiagnosticProblems,
  NotificationDiagnostic,
  repairNotifications,
} from '../utils/notificationDiagnostics';

type Props = {
  compact?: boolean;
};

export default function NotificationDiagnosticsButton({ compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checks, setChecks] = useState<NotificationDiagnostic[]>([]);
  const [message, setMessage] = useState('');
  const [hasProblems, setHasProblems] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-19), `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  const runCheck = async () => {
    addLog('بدء الفحص...');
    setLoading(true);
    setMessage('');
    try {
      const result = await diagnoseNotifications();
      setChecks(result);
      setHasProblems(hasDiagnosticProblems(result));
      addLog('تم تحديث تقرير الحالة.');
    } catch (e: any) {
      const errMsg = e.message || 'خطأ غير معروف';
      addLog(`❌ خطأ في الفحص: ${errMsg}`);
      setMessage(`تعذر إكمال الفحص: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void diagnoseNotifications().then((result) => {
        setChecks(result);
        setHasProblems(hasDiagnosticProblems(result));
      }).catch(() => undefined);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, []);

  const summary = useMemo(() => diagnosticsSummary(checks), [checks]);

  const handleOpen = () => {
    setOpen(true);
    void runCheck();
  };

  const handleRepair = async () => {
    setLoading(true);
    addLog('بدء عملية الإصلاح...');
    setMessage('جاري تحديث الاشتراك وطلب الإذن...');
    try {
      const repairMessage = await repairNotifications();
      addLog(`إجابة الإصلاح: ${repairMessage}`);
      setMessage(repairMessage);
      const result = await diagnoseNotifications();
      setChecks(result);
      setHasProblems(hasDiagnosticProblems(result));
    } catch (e: any) {
      const errMsg = e.message || 'خطأ غير معروف';
      addLog(`❌ فشل الإصلاح: ${errMsg}`);
      setMessage(`تعذر الإصلاح التلقائي: ${errMsg}`);
      setHasProblems(true); // إظهار خيار المسح الشامل
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="فحص حالة الإشعارات"
        aria-label="فحص حالة الإشعارات"
        className={`relative inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition-all active:scale-95 ${
          hasProblems
            ? 'border-red-400/50 bg-red-500/15 text-red-200 hover:bg-red-500/25'
            : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
        }`}
      >
        <Bell size={compact ? 16 : 18} />
        {!compact && <span>فحص التنبيهات</span>}
        {hasProblems && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-900 animate-pulse" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" dir="rtl">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-700 bg-slate-950 p-5 text-slate-100 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Bell className="text-orange-400" size={22} />
                  <h2 className="text-xl font-black">فحص حالة التنبيهات</h2>
                </div>
                <p className="text-xs leading-6 text-slate-400">يتم فحص الجهاز الحالي فقط؛ قد تختلف الحالة من متصفح إلى آخر.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="إغلاق" className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X size={20} /></button>
            </div>

            {loading && checks.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-300">
                <Loader2 className="animate-spin text-orange-400" size={34} />
                <p className="text-sm font-bold">جاري فحص الإشعارات...</p>
              </div>
            ) : (
              <>
                <div className={`mb-4 rounded-2xl border p-4 ${hasProblems ? 'border-amber-400/30 bg-amber-500/10' : 'border-emerald-400/30 bg-emerald-500/10'}`}>
                  <div className="flex items-center gap-2">
                    {hasProblems ? <ShieldAlert className="text-amber-300" size={20} /> : <CheckCircle2 className="text-emerald-300" size={20} />}
                    <p className="text-sm font-black">{summary}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {checks.map((check) => (
                    <details key={check.key} className={`rounded-2xl border p-3 ${getDiagnosticStatusClass(check.status)}`}>
                      <summary className="flex cursor-pointer list-none items-center gap-2">
                        <span className="text-base">{getDiagnosticStatusIcon(check.status)}</span>
                        <span className="flex-1 text-sm font-black">{check.label}</span>
                        <span className="text-[10px] font-bold opacity-80">{getDiagnosticStatusLabel(check.status)}</span>
                        <ChevronDown size={15} />
                      </summary>
                      <p className="mt-2 border-t border-current/10 pt-2 text-xs leading-6 opacity-90">{check.detail}</p>
                      {check.status !== 'ok' && <p className="mt-1 text-[11px] font-bold opacity-80">الحل: {getDiagnosticHint(check.key)}</p>}
                    </details>
                  ))}
                </div>

                {message && <div className="mt-4 rounded-2xl border border-blue-400/30 bg-blue-500/10 p-3 text-xs font-bold leading-6 text-blue-100">{message}</div>}

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => void runCheck()} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-xs font-black hover:bg-slate-700 disabled:opacity-50">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> إعادة الفحص
                  </button>
                  <button type="button" onClick={() => void handleRepair()} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-3 py-3 text-xs font-black text-white hover:bg-orange-700 disabled:opacity-50">
                    <Bell size={16} /> إصلاح وتفعيل
                  </button>
                </div>

                <details className="mt-4 border-t border-slate-800 pt-4">
                  <summary className="cursor-pointer text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300">سجل الأحداث التقني (للأهمية)</summary>
                  <div className="mt-2 rounded-lg bg-black p-3 font-mono text-[9px] leading-5 text-emerald-400">
                    {logs.length === 0 ? 'لا يوجد أحداث حالياً.' : logs.map((log, i) => <div key={i}>{log}</div>)}
                  </div>
                </details>

                {hasProblems && (
                  <div className="mt-6 border-t border-slate-800 pt-5">
                    <p className="mb-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">حل أخير للمشاكل المستعصية</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('سيقوم هذا الإجراء بمسح كافة إعدادات الإشعارات وإعادة تشغيل البرنامج. هل تود الاستمرار؟')) {
                          addLog('بدء المسح الشامل...');
                          void hardResetNotifications();
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 py-3 text-[11px] font-black text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      ⚠️ مسح شامل وإعادة تشغيل
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
