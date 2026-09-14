type RequestLike = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
};

const SUPABASE_URL = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '9abc8506-3935-44a8-b044-3117e77d26dc';
const ONESIGNAL_KEY = process.env.ONESIGNAL_API_KEY || process.env.ONESIGNAL_REST_API_KEY || process.env.REST_API_KEY || '';
const REPORT_ACTION = 'تقرير أرباح أسبوعي';

const respond = (res: ResponseLike, code: number, body: unknown) => res.status(code).json(body);
const header = (req: RequestLike, name: string) => {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

const supabase = async (path: string, init: RequestInit = {}) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${JSON.stringify(data)}`);
  return data;
};

const cairoDate = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};

const shiftDate = (dateValue: string, days: number) => {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
};

const money = (value: number) => `${Number(value || 0).toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج.م`;

const sendPush = async (title: string, message: string, reportKey: string) => {
  if (!ONESIGNAL_KEY) return { ok: false, skipped: true };
  const response = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: { Authorization: `Key ${ONESIGNAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      target_channel: 'push',
      filters: [
        { field: 'tag', key: 'role', relation: '=', value: 'admin' },
        { operator: 'OR' },
        { field: 'tag', key: 'role', relation: '=', value: 'manager' },
      ],
      headings: { en: title, ar: title },
      contents: { en: message, ar: message },
      data: { focus: 'notifications', report_key: reportKey },
      url: 'https://www.maintenanceguide.life/orders?source=pwa&focus=notifications',
      ttl: 86400,
      priority: 10,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`OneSignal ${response.status}: ${JSON.stringify(result)}`);
  return { ok: true, id: result?.id || null };
};

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (req.method && req.method !== 'GET') return respond(res, 405, { error: 'Method not allowed' });
  const configuredSecret = process.env.CRON_SECRET;
  const cronHeader = header(req, 'x-vercel-cron');
  const authHeader = header(req, 'authorization');
  if (configuredSecret && authHeader !== `Bearer ${configuredSecret}`) return respond(res, 401, { error: 'Unauthorized' });
  if (!configuredSecret && cronHeader !== '1') return respond(res, 401, { error: 'Cron access only' });
  if (!SUPABASE_KEY) return respond(res, 500, { error: 'Supabase server key is not configured' });

  try {
    const endDate = cairoDate();
    const startDate = shiftDate(endDate, -4);
    const reportKey = `${startDate}:${endDate}`;
    const actionQuery = encodeURIComponent(REPORT_ACTION);
    const recentReports = await supabase(`notifications?action=eq.${actionQuery}&select=details&order=created_at.desc&limit=100`);
    const alreadyCreated = (Array.isArray(recentReports) ? recentReports : []).some((row: any) => String(row.details || '').includes(`"report_key":"${reportKey}"`));
    if (alreadyCreated) return respond(res, 200, { ok: true, skipped: true, reportKey, reason: 'already_created' });

    const [ledger, orders] = await Promise.all([
      supabase(`cash_ledger?select=type,amount,date&date=gte.${startDate}&date=lte.${endDate}`),
      supabase(`orders?select=id,status,is_paid,technician,created_at&created_at=gte.${startDate}T00:00:00&created_at=lt.${shiftDate(endDate, 1)}T00:00:00&deleted_at=is.null`),
    ]);
    const rows = Array.isArray(ledger) ? ledger : [];
    const orderRows = Array.isArray(orders) ? orders : [];
    const income = rows.filter((row: any) => row.type === 'income').reduce((sum: number, row: any) => sum + (Number(row.amount) || 0), 0);
    const expenses = rows.filter((row: any) => row.type === 'expense').reduce((sum: number, row: any) => sum + (Number(row.amount) || 0), 0);
    const distributions = rows.filter((row: any) => row.type === 'profit_distribution').reduce((sum: number, row: any) => sum + (Number(row.amount) || 0), 0);
    const completed = orderRows.filter((order: any) => order.status === 'completed').length;
    const unpaid = orderRows.filter((order: any) => order.status === 'completed' && !order.is_paid).length;
    const unassigned = orderRows.filter((order: any) => !order.technician || order.technician === '-').length;
    const active = orderRows.filter((order: any) => ['pending', 'in-progress', 'in_progress', 'inspected', 'returned', 'deferred'].includes(String(order.status))).length;
    const report = {
      audit: true,
      report_key: reportKey,
      start_date: startDate,
      end_date: endDate,
      income: Number(income.toFixed(2)),
      expenses: Number(expenses.toFixed(2)),
      distributions: Number(distributions.toFixed(2)),
      closing_delta: Number((income - expenses - distributions).toFixed(2)),
      orders_total: orderRows.length,
      orders_completed: completed,
      orders_active: active,
      orders_unpaid: unpaid,
      orders_unassigned: unassigned,
    };
    const title = '📊 التقرير المالي الأسبوعي';
    const message = `الفترة ${startDate} إلى ${endDate}: دخل ${money(income)}، مصروفات ${money(expenses)}، توزيعات ${money(distributions)}، صافي حركة ${money(report.closing_delta)}. الأوردرات: ${orderRows.length}، مكتمل ${completed}، غير محصل ${unpaid}، بلا فني ${unassigned}.`;
    await supabase('notifications', {
      method: 'POST',
      body: JSON.stringify({ action: REPORT_ACTION, details: JSON.stringify(report), user_name: 'النظام الآلي', created_at: new Date().toISOString() }),
    });
    let push = { ok: false, skipped: true } as { ok: boolean; skipped?: boolean; id?: string | null };
    try { push = await sendPush(title, message, reportKey); } catch (error) { console.error('Weekly report push failed:', error); }
    return respond(res, 200, { ok: true, reportKey, report, push });
  } catch (error) {
    console.error('Weekly financial report failed:', error);
    return respond(res, 500, { error: 'Weekly financial report failed' });
  }
}

export const config = { maxDuration: 60 };

export const _private = { shiftDate, money };

