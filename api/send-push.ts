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
  targetTags?: unknown;
  data?: unknown;
  url?: unknown;
};

type Audience =
  | { filters: Array<Record<string, string>>; target_channel?: 'push' }
  | { include_aliases: { external_id: string[] }; target_channel: 'push' };

const APP_ID = (process.env.ONESIGNAL_APP_ID || '9abc8506-3935-44a8-b044-3117e77d26dc').replace(/[^a-zA-Z0-9-]/g, '');
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

const cleanTags = (value: unknown): Array<{ key: string; value: string }> => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is { key?: unknown; value?: unknown } => !!item && typeof item === 'object')
    .map(item => ({ key: String(item.key || '').trim(), value: String(item.value || '').trim() }))
    .filter(item => item.key && item.value)
    .slice(0, 20);
};

const buildTagFilters = (tags: Array<{ key: string; value: string }>): Array<Record<string, string>> => {
  const filters: Array<Record<string, string>> = [];
  tags.forEach((tag, index) => {
    if (index > 0) filters.push({ operator: 'AND' });
    filters.push({ field: 'tag', key: tag.key, relation: '=', value: tag.value });
  });
  return filters;
};

const buildDeepLink = (requestedUrl: unknown, event: string, data: Record<string, string>, targetUserIds: string[], targetTags: Array<{ key: string; value: string }>) => {
  const base = 'https://www.maintenanceguide.life';
  if (typeof requestedUrl === 'string' && requestedUrl.trim()) {
    try {
      const parsed = new URL(requestedUrl.trim(), base);
      if (parsed.origin === base && ['/orders', '/tech-portal', '/data-entry'].includes(parsed.pathname)) return parsed.toString();
    } catch { /* استخدم المسار الآمن الافتراضي */ }
  }

  const focus = data.focus || '';
  const orderNumber = data.order_number || '';
  const targetsTechnician = targetUserIds.some((id) => id.startsWith('tech:')) || targetTags.some((tag) => tag.key === 'tech_name' || tag.key === 'user_id');
  const portal = targetsTechnician ? '/tech-portal' : '/orders';
  
  // v3.1.7: إجبار الدخول عبر /login لتخطي صفحة الزوار في Firefox
  const buildUrl = (path: string, query: Record<string, string> = {}) => {
    const p = new URLSearchParams(query);
    p.set('source', 'pwa');
    p.set('redirect', path); // حفظ المسار المطلوب للتحويل بعد الدخول
    return `${base}/login?${p.toString()}`;
  };

  if (focus === 'chat') return buildUrl('/orders', { focus: 'chat' });
  if (focus === 'delayed') return buildUrl('/orders', { focus: 'delayed' });
  if (focus === 'old_orders') return buildUrl('/tech-portal', { focus: 'old_orders' });
  if (focus === 'feedback') return buildUrl('/orders', { focus: 'feedback', ...(orderNumber ? { order: orderNumber } : {}) });
  if (focus === 'performance') return buildUrl('/orders', { focus: 'performance' });
  if (focus === 'notifications') return buildUrl('/orders', { focus: 'notifications' });
  
  if (orderNumber || event === 'order_status_changed' || event === 'technician_assigned') {
    return buildUrl(portal, { focus: 'order', ...(orderNumber ? { order: orderNumber } : {}) });
  }
  
  if (event === 'new_order') return buildUrl('/orders', { focus: 'new' });
  if (targetsTechnician) return buildUrl('/tech-portal', { focus: 'alerts' });
  return buildUrl('/orders', { focus: 'notifications' });
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
  // تنظيف فائق الصرامة: حذف أي شيء ليس حرفاً أو رقماً أو شرطة سفلية أو شرطة عادية
  const rawLen = apiKey.length;
  apiKey = apiKey.replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanLen = apiKey.length;
  // تشخيص مفصل v1.1.9
  const keyInfo = `V1.1.9|Len:${cleanLen}|Start:${apiKey.slice(0, 10)}|End:${apiKey.slice(-10)}`;

  const body = (req.body || {}) as PushBody;
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : '';
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1000) : '';
  const event = typeof body.event === 'string' ? body.event : '';
  const targetRoles = cleanStrings(body.targetRoles, 5);
  const targetUserIds = cleanStrings(body.targetUserIds, 20000);
  const targetTags = cleanTags(body.targetTags);

  if (!title || !message || !ALLOWED_EVENTS.has(event)) {
    respond(res, 400, { error: 'title, message, and a supported event are required' });
    return;
  }

  if (targetRoles.length === 0 && targetUserIds.length === 0 && targetTags.length === 0) {
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

  const deepLink = buildDeepLink(body.url, event, safeData, targetUserIds, targetTags);
  const audiences: any[] = [];
  
  // إذا كان المطلوب الإرسال للكل أو للمديرين (كخيار احتياطي)، نرسل للجميع لضمان الوصول
  if (targetRoles.includes('all') || targetRoles.includes('admin') || targetRoles.includes('manager')) {
    audiences.push({ included_segments: ['Total Subscriptions'] });
  } else if (targetRoles.length > 0) {
    audiences.push({ filters: buildRoleFilters(targetRoles) });
  }

  if (targetUserIds.length > 0) {
    audiences.push({
      include_aliases: { external_id: targetUserIds },
      target_channel: 'push',
    });
  }

  if (targetTags.length > 0) {
    audiences.push({ filters: buildTagFilters(targetTags), target_channel: 'push' });
  }

  try {
    const sendWithAuth = (url: string, authHeader: string) => 
      Promise.all(audiences.map(audience =>
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            app_id: APP_ID,
            ...audience,
            headings: { en: title, ar: title },
            contents: { en: message, ar: message },
            url: deepLink,
            chrome_web_icon: "https://www.maintenanceguide.life/pwa-192.png",
            chrome_web_badge: "https://www.maintenanceguide.life/pwa-192.png",
            firefox_icon: "https://www.maintenanceguide.life/pwa-192.png",
            large_icon: "https://www.maintenanceguide.life/pwa-192.png",
            // تفعيل الخصائص التفاعلية لفك حظر Chrome Android (v2.9.5)
            priority: 10,
            web_push_priority: 10,
            ttl: 3600,
            renotify: true,
            android_visibility: 1,
            web_push_require_interaction: true,
            web_buttons: [
              { id: "view_order", text: "✅ عرض التفاصيل", icon: "", url: deepLink }
            ],
            buttons: [
              { id: "view_order", text: "✅ عرض التفاصيل", icon: "" }
            ],
            android_group: event,
		          }),
	        })
	      ));

    // تجربة كافة طرق المصادقة الممكنة لضمان النجاح
    let responses = await sendWithAuth('https://onesignal.com/api/v1/notifications', `Key ${apiKey}`);
    
    if (responses[0]?.status === 401 || responses[0]?.status === 403) {
      responses = await sendWithAuth('https://onesignal.com/api/v1/notifications', `Basic ${apiKey}`);
    }

    if (responses[0]?.status === 401 || responses[0]?.status === 403) {
      responses = await sendWithAuth('https://api.onesignal.com/notifications', `Key ${apiKey}`);
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
