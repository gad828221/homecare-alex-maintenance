type RequestLike = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | undefined>;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
  setHeader?: (name: string, value: string) => void;
  end?: () => void;
};

type PushBody = {
  title?: unknown;
  message?: unknown;
  event?: unknown;
  targetRoles?: unknown;
  targetUserIds?: unknown;
  data?: unknown;
};

const APP_ID = process.env.ONESIGNAL_APP_ID || '9abc8506-3935-44a8-b044-3117e77d26dc';
const ALLOWED_EVENTS = new Set([
  'new_order',
  'technician_assigned',
  'order_status_changed',
  'customer_feedback',
  'system_alert',
]);

const cleanStrings = (value: unknown, max = 20): string[] => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, max))];
};

const respond = (res: ResponseLike, code: number, body: unknown) => {
  res.status(code).json(body);
};

export default async function handler(req: RequestLike, res: ResponseLike) {
  const origin = req.headers?.origin;
  const allowedOrigins = new Set([
    'https://www.maintenanceguide.life',
    'https://maintenanceguide.life',
  ]);

  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', origin && allowedOrigins.has(origin) ? origin : 'https://www.maintenanceguide.life');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end?.();
    return;
  }

  if (req.method !== 'POST') {
    respond(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  const apiKey = process.env.ONESIGNAL_API_KEY;
  if (!apiKey) {
    respond(res, 503, { error: 'OneSignal is not configured on the server' });
    return;
  }

  const body = (req.body || {}) as PushBody;
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : '';
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1000) : '';
  const event = typeof body.event === 'string' ? body.event : '';
  const targetRoles = cleanStrings(body.targetRoles, 5);
  const targetUserIds = cleanStrings(body.targetUserIds, 20);

  if (!title || !message || !ALLOWED_EVENTS.has(event)) {
    respond(res, 400, { error: 'title, message, and a supported event are required' });
    return;
  }

  if (targetRoles.length === 0 && targetUserIds.length === 0) {
    respond(res, 400, { error: 'At least one target role or user ID is required' });
    return;
  }

  const filters: Array<Record<string, string>> = [];
  [...targetRoles.map(role => ({ key: 'role', value: role })), ...targetUserIds.map(id => ({ key: 'user_id', value: id }))]
    .forEach((target, index, targets) => {
      if (index > 0) filters.push({ operator: 'OR' });
      filters.push({ field: 'tag', key: target.key, relation: '=', value: target.value });
      if (index === targets.length - 1 && filters.at(-1)?.operator === 'OR') filters.pop();
    });

  const safeData = body.data && typeof body.data === 'object' && !Array.isArray(body.data)
    ? Object.fromEntries(Object.entries(body.data as Record<string, unknown>).slice(0, 20).map(([key, value]) => [key, String(value).slice(0, 200)]))
    : {};

  try {
    const response = await fetch('https://api.onesignal.com/notifications?c=push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: APP_ID,
        target_channel: 'push',
        filters,
        headings: { en: title, ar: title },
        contents: { en: message, ar: message },
        custom_data: { event, ...safeData },
        priority: 10,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('OneSignal API error:', response.status, result);
      respond(res, response.status, { error: 'OneSignal rejected the notification', details: result });
      return;
    }

    respond(res, 200, { success: true, id: result?.id || null });
  } catch (error) {
    console.error('OneSignal request failed:', error);
    respond(res, 500, { error: 'Failed to send push notification' });
  }
}
