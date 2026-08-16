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

type Audience =
  | { filters: Array<Record<string, string>>; target_channel?: 'push' }
  | { include_aliases: { external_id: string[] }; target_channel: 'push' };

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
    .filter((item): item is string | number => typeof item === 'string' || typeof item === 'number')
    .map(item => String(item).trim())
    .filter(Boolean)
    .slice(0, max))];
};

const respond = (res: ResponseLike, code: number, body: unknown) => {
  res.status(code).json(body);
};

const buildRoleFilters = (roles: string[]): Array<Record<string, string>> => {
  const filters: Array<Record<string, string>> = [];
  roles.forEach((role, index) => {
    if (index > 0) filters.push({ operator: 'OR' });
    filters.push({ field: 'tag', key: 'role', relation: '=', value: role });
  });
  return filters;
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

  let apiKey = process.env.ONESIGNAL_API_KEY || process.env.ONESIGNAL_REST_API_KEY || process.env.REST_API_KEY;
  if (!apiKey) {
    const availableVars = Object.keys(process.env).filter(k => k.includes('ONESIGNAL') || k.includes('API_KEY')).join(', ');
    respond(res, 503, { 
      error: 'API Key missing', 
      details: `Available vars: ${availableVars || 'None'}. Please check Vercel Env Names.` 
    });
    return;
  }
  apiKey = apiKey.trim();
  const keyInfo = `Len:${apiKey.length}|Start:${apiKey.slice(0, 3)}...`;

  const body = (req.body || {}) as PushBody;
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : '';
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1000) : '';
  const event = typeof body.event === 'string' ? body.event : '';
  const targetRoles = cleanStrings(body.targetRoles, 5);
  const targetUserIds = cleanStrings(body.targetUserIds, 20000);

  if (!title || !message || !ALLOWED_EVENTS.has(event)) {
    respond(res, 400, { error: 'title, message, and a supported event are required' });
    return;
  }

  if (targetRoles.length === 0 && targetUserIds.length === 0) {
    respond(res, 400, { error: 'At least one target role or user ID is required' });
    return;
  }

  const safeData = body.data && typeof body.data === 'object' && !Array.isArray(body.data)
    ? Object.fromEntries(
        Object.entries(body.data as Record<string, unknown>)
          .slice(0, 20)
          .map(([key, value]) => [key.slice(0, 80), String(value).slice(0, 200)])
      )
    : {};

  const audiences: Audience[] = [];
  if (targetRoles.length > 0) {
    audiences.push({ filters: buildRoleFilters(targetRoles) });
  }
  if (targetUserIds.length > 0) {
    audiences.push({
      include_aliases: { external_id: targetUserIds },
      target_channel: 'push',
    });
  }

  try {
    let responses = await Promise.all(audiences.map(audience =>
      fetch('https://api.onesignal.com/notifications?c=push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey.includes(' ') ? apiKey : `Basic ${apiKey}`,
        },
        body: JSON.stringify({
          app_id: APP_ID,
          ...audience,
          headings: { en: title, ar: title },
          contents: { en: message, ar: message },
          custom_data: { event, ...safeData },
          priority: 10,
        }),
      })
    ));

    // إذا فشلت المصادقة بـ Basic، نحاول بـ Key (للمفاتيح الجديدة)
    if (responses[0]?.status === 401 || responses[0]?.status === 403) {
      console.log('Retrying with Key prefix...');
      responses = await Promise.all(audiences.map(audience =>
        fetch('https://api.onesignal.com/notifications?c=push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': apiKey.includes(' ') ? apiKey : `Key ${apiKey}`,
          },
          body: JSON.stringify({
            app_id: APP_ID,
            ...audience,
            headings: { en: title, ar: title },
            contents: { en: message, ar: message },
            custom_data: { event, ...safeData },
            priority: 10,
          }),
        })
      ));
    }

    const results = await Promise.all(responses.map(response => response.json().catch(() => ({}))));
    const failedIndex = responses.findIndex(response => !response.ok);
    if (failedIndex !== -1) {
      const errorDetail = results[failedIndex];
      let errorMessage = Array.isArray(errorDetail.errors) ? errorDetail.errors.join(', ') : 'OneSignal rejected the notification';
      if (responses[failedIndex].status === 401 || responses[failedIndex].status === 403) {
        errorMessage = `Auth Failed (${keyInfo}): ${errorMessage}`;
      }
      respond(res, responses[failedIndex].status, {
        error: errorMessage,
        details: errorDetail,
      });
      return;
    }

    respond(res, 200, {
      success: true,
      ids: results.map(result => result?.id).filter(Boolean),
    });
  } catch (error) {
    console.error('OneSignal request failed:', error);
    respond(res, 500, { error: 'Failed to send push notification' });
  }
}
