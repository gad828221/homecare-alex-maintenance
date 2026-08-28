type RequestLike = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type ResponseLike = { status: (code: number) => ResponseLike; json: (body: unknown) => void; setHeader?: (name: string, value: string) => void };

const SUPABASE_URL = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '9abc8506-3935-44a8-b044-3117e77d26dc';
const ONESIGNAL_KEY = process.env.ONESIGNAL_API_KEY || process.env.ONESIGNAL_REST_API_KEY || process.env.REST_API_KEY || '';
const WARNING_AFTER_MS = 30 * 60 * 1000;
const SUSPEND_AFTER_MS = 60 * 60 * 1000;
const OPEN_STATUSES = new Set(['pending', 'in-progress', 'in_progress', 'inspected', 'returned', 'deferred']);

const respond = (res: ResponseLike, code: number, body: unknown) => res.status(code).json(body);
const header = (req: RequestLike, name: string) => {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};
const supabase = async (path: string, init: RequestInit = {}) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${JSON.stringify(data)}`);
  return data;
};
const saveNotification = async (action: string, details: string) => {
  await supabase('notifications', { method: 'POST', body: JSON.stringify({ action, details, user_name: 'النظام الآلي', created_at: new Date().toISOString() }) });
};
const sendPush = async (externalId: string, title: string, message: string, data: Record<string, string>) => {
  if (!ONESIGNAL_KEY) throw new Error('OneSignal API key is not configured');
  const response = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: { Authorization: `Key ${ONESIGNAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: ONESIGNAL_APP_ID, target_channel: 'push', include_aliases: { external_id: [externalId] }, headings: { en: title, ar: title }, contents: { en: message, ar: message }, data, ttl: 3600, priority: 10, web_push_require_interaction: true }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`OneSignal ${response.status}: ${JSON.stringify(result)}`);
  return result;
};
const orderTime = (order: any) => {
  const values = [order.updated_at, order.last_action_at, order.action_date, order.created_at, order.createdAt, order.date];
  for (const value of values) {
    const time = new Date(value || 0).getTime();
    if (Number.isFinite(time) && time > 0) return time;
  }
  return 0;
};
const isAssignedTo = (order: any, technician: any) => {
  const assigned = String(order.technician || order.assigned_technician || '').trim().toLowerCase();
  const identities = [technician.id, technician.name, technician.username, technician.code].filter(Boolean).map(String).map(value => value.trim().toLowerCase());
  return assigned && identities.includes(assigned);
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
    const [technicians, orders, recentWarnings] = await Promise.all([
      supabase('technicians?select=id,name,username,code,is_active&is_active=eq.true'),
      supabase('orders?select=id,order_number,customer_name,technician,status,created_at,updated_at,last_action_at,action_date,deleted_at&deleted_at=is.null'),
      supabase(`notifications?select=details&action=eq.${encodeURIComponent('تحذير خمول فني')}&created_at=gte.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`),
    ]);
    const warned = new Set<string>();
    for (const row of Array.isArray(recentWarnings) ? recentWarnings : []) {
      try { const parsed = JSON.parse(String(row.details || '{}')); if (parsed.external_id) warned.add(`${parsed.external_id}:${parsed.level}`); } catch { /* سجل قديم نصي */ }
    }
    const now = Date.now();
    const results: any[] = [];
    for (const technician of Array.isArray(technicians) ? technicians : []) {
      const assignedOrders = (Array.isArray(orders) ? orders : []).filter((order: any) => OPEN_STATUSES.has(String(order.status)) && isAssignedTo(order, technician));
      if (!assignedOrders.length) continue;
      const oldestOrder = assignedOrders.reduce((oldest: any, order: any) => !oldest || orderTime(order) < orderTime(oldest) ? order : oldest, null);
      const idleMs = now - orderTime(oldestOrder);
      if (idleMs < WARNING_AFTER_MS) continue;
      const externalId = `tech:${technician.id}`;
      const level = idleMs >= SUSPEND_AFTER_MS ? 'suspension' : 'warning';
      if (warned.has(`${externalId}:${level}`)) continue;
      const minutes = Math.floor(idleMs / 60000);
      const orderNumbers = assignedOrders.map((order: any) => order.order_number).filter(Boolean).slice(0, 5).join('، ');
      const title = level === 'suspension' ? 'تم تعليق استقبال الأوردرات' : 'تحذير: أوردرات بلا تحديث';
      const message = level === 'suspension'
        ? `لديك ${assignedOrders.length} أوردر منذ ${minutes} دقيقة بدون تغيير حالة أو إجراء. تم تعليق استقبال الأوردرات الجديدة مؤقتًا. راجع الأوردرات الحالية وتواصل مع الإدارة.`
        : `لديك ${assignedOrders.length} أوردر منذ ${minutes} دقيقة بدون تغيير حالة أو تحديد إجراء. حدّث الأوردرات الآن حتى لا يتم تعليق استقبال أوردرات جديدة.`;
      let pushOk = false;
      let pushError = '';
      try { await sendPush(externalId, title, message, { focus: 'alerts', technician: String(technician.name || technician.id), order_numbers: orderNumbers }); pushOk = true; } catch (error) { pushError = error instanceof Error ? error.message : 'Push failed'; }
      await saveNotification('تحذير خمول فني', JSON.stringify({ audit: true, external_id: externalId, technician_id: technician.id, technician: technician.name, level, idle_minutes: minutes, order_numbers: orderNumbers, push_ok: pushOk, push_error: pushError, created_at: new Date().toISOString() }));
      if (level === 'suspension') {
        await supabase(`technicians?id=eq.${encodeURIComponent(String(technician.id))}`, { method: 'PATCH', body: JSON.stringify({ is_active: false }) });
      }
      results.push({ externalId, level, assignedOrders: assignedOrders.length, pushOk });
    }
    return respond(res, 200, { ok: true, checkedAt: new Date().toISOString(), results });
  } catch (error) {
    console.error('Technician inactivity check failed:', error);
    return respond(res, 500, { error: 'Technician inactivity check failed' });
  }
}

export const config = { maxDuration: 60 };

export const _private = { orderTime, isAssignedTo };
