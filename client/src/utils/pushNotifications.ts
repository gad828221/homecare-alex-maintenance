export type PushNotificationInput = {
  title: string;
  message: string;
  event: 'new_order' | 'technician_assigned' | 'order_status_changed' | 'customer_feedback' | 'system_alert';
  targetRoles?: string[];
  targetUserIds?: Array<string | number>;
  targetTags?: Array<{ key: string; value: string | number }>;
  data?: Record<string, string | number | boolean | null | undefined>;
  url?: string;
};

export async function sendExternalPush(input: PushNotificationInput): Promise<{ ok: boolean; error?: string; ids?: string[] }> {
  let lastError = 'Network Error';
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
        body: JSON.stringify({ ...input, targetUserIds: input.targetUserIds?.map(String) }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok) return { ok: true, ids: Array.isArray(result.ids) ? result.ids : [] };
      lastError = result.error || `Error ${response.status}`;
      console.warn(`External push attempt ${attempt}/3 failed:`, response.status, result);
    } catch (error) {
      lastError = error instanceof DOMException && error.name === 'AbortError' ? 'Request timeout' : 'Network Error';
      console.warn(`External push attempt ${attempt}/3 failed:`, error);
    } finally {
      window.clearTimeout(timeoutId);
    }
    if (attempt < 3) await new Promise(resolve => window.setTimeout(resolve, attempt * 1200));
  }
  return { ok: false, error: lastError };
}
