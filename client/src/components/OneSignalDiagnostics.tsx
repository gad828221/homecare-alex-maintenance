import { useEffect, useState } from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import { readAuthSession } from '../utils/authSession';
import { getOneSignalExternalId, syncOneSignalIdentity } from '../utils/oneSignalIdentity';

type PushState = {
  sdk: string;
  permission: string;
  subscribed: string;
  subscriptionId: string;
  externalId: string;
};

type OneSignalRuntime = {
  login?: (externalId: string) => Promise<void> | void;
  Notifications?: {
    requestPermission?: () => Promise<boolean | void>;
  };
  User?: {
    externalId?: string;
    PushSubscription?: {
      id?: string;
      optedIn?: boolean | Promise<boolean>;
      optIn?: () => Promise<void> | void;
    };
  };
};

const initialState: PushState = {
  sdk: 'جارٍ الفحص',
  permission: 'غير معروف',
  subscribed: 'غير معروف',
  subscriptionId: '—',
  externalId: '—',
};

export default function OneSignalDiagnostics() {
  const [state, setState] = useState<PushState>(initialState);
  const [busy, setBusy] = useState(false);

  const inspect = async () => {
    const win = window as Window & { OneSignal?: OneSignalRuntime; OneSignalReady?: boolean };
    const sdk = win.OneSignal;
    const subscription = sdk?.User?.PushSubscription;
    const optedIn = subscription?.optedIn instanceof Promise
      ? await subscription.optedIn
      : subscription?.optedIn;
    const { user, role } = readAuthSession();
    setState({
      sdk: sdk?.User ? 'جاهز' : win.OneSignalReady ? 'مهيأ بلا بيانات مستخدم' : 'غير جاهز',
      permission: 'Notification' in window ? Notification.permission : 'غير مدعوم',
      subscribed: optedIn === true ? 'مشترك' : optedIn === false ? 'غير مشترك' : 'غير معروف',
      subscriptionId: String(subscription?.id || '—'),
      externalId: String(sdk?.User?.externalId || getOneSignalExternalId(user, role || user?.role) || '—'),
    });
  };

  useEffect(() => {
    void inspect();
    const timer = window.setInterval(() => void inspect(), 3000);
    return () => window.clearInterval(timer);
  }, []);

  const relink = async () => {
    const { user, role } = readAuthSession();
    if (!user) return;
    setBusy(true);
    syncOneSignalIdentity(user, role || user.role);
    window.setTimeout(() => {
      void inspect().finally(() => setBusy(false));
    }, 1200);
  };

  const enableNotifications = async () => {
    setBusy(true);
    try {
      const win = window as Window & { OneSignal?: OneSignalRuntime };
      if ('Notification' in window && Notification.permission !== 'granted') {
        if (win.OneSignal?.Notifications?.requestPermission) {
          await win.OneSignal.Notifications.requestPermission();
        } else {
          await Notification.requestPermission();
        }
      }
      if (Notification.permission === 'granted') {
        await win.OneSignal?.User?.PushSubscription?.optIn?.();
      }
      const { user, role } = readAuthSession();
      if (user) syncOneSignalIdentity(user, role || user.role);
      await new Promise((resolve) => window.setTimeout(resolve, 2500));
      await inspect();
    } finally {
      setBusy(false);
    }
  };

  const healthy = state.sdk === 'جاهز' && state.permission === 'granted' && state.subscribed === 'مشترك';

  return (
    <section className={`rounded-2xl border p-3 text-right ${healthy ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-amber-500/40 bg-amber-950/20'}`} dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell size={17} className={healthy ? 'text-emerald-300' : 'text-amber-300'} />
          <div>
            <h2 className="text-xs font-black text-white">حالة إشعارات OneSignal</h2>
            <p className={`text-[10px] font-bold ${healthy ? 'text-emerald-300' : 'text-amber-300'}`}>
              {healthy ? 'جاهز لاستقبال الإشعارات' : 'يحتاج إلى إكمال التسجيل'}
            </p>
          </div>
        </div>
        {state.subscribed !== 'مشترك' && (
          <button type="button" onClick={() => void enableNotifications()} disabled={busy} className="rounded-lg bg-orange-600 px-2.5 py-1.5 text-[10px] font-black text-white disabled:opacity-50">
            <Bell size={13} className="inline ml-1" /> {state.permission === 'granted' ? 'إكمال الاشتراك' : 'تفعيل الإشعارات الآن'}
          </button>
        )}
        {state.permission === 'granted' && (
          <button type="button" onClick={() => void relink()} disabled={busy} className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-[10px] font-black text-slate-200 disabled:opacity-50">
            <RefreshCw size={13} className={`inline ml-1 ${busy ? 'animate-spin' : ''}`} /> إعادة الربط
          </button>
        )}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-300">
        <span>SDK: <b className="text-white">{state.sdk}</b></span>
        <span>الإذن: <b className="text-white">{state.permission}</b></span>
        <span>الاشتراك: <b className="text-white">{state.subscribed}</b></span>
        <span className="truncate">External ID: <b className="text-white">{state.externalId}</b></span>
      </div>
      {state.subscriptionId !== '—' && <p className="mt-1 truncate text-[9px] text-slate-500">Subscription: {state.subscriptionId}</p>}
    </section>
  );
}
