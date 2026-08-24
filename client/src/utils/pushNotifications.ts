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
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
      body: JSON.stringify({
        ...input,
        targetUserIds: input.targetUserIds?.map(String),
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.warn('External push was not sent:', response.status, result);
      return { ok: false, error: result.error || `Error ${response.status}` };
    }

    return { ok: true, ids: Array.isArray(result.ids) ? result.ids : [] };
  } catch (error) {
    const message = error instanceof DOMException && error.name === 'AbortError' ? 'Request timeout' : 'Network Error';
    console.warn('External push request failed:', error);
    return { ok: false, error: message };
  } finally {
    window.clearTimeout(timeoutId);
  }
}
