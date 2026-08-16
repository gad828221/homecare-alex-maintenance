export type PushNotificationInput = {
  title: string;
  message: string;
  event: 'new_order' | 'technician_assigned' | 'order_status_changed' | 'customer_feedback' | 'system_alert';
  targetRoles?: string[];
  targetUserIds?: Array<string | number>;
  data?: Record<string, string | number | boolean | null | undefined>;
};

export async function sendExternalPush(input: PushNotificationInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...input,
        targetUserIds: input.targetUserIds?.map(String),
      }),
    });

    const result = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      console.warn('External push was not sent:', response.status, result);
      return { 
        ok: false, 
        error: result.error || `Error ${response.status}` 
      };
    }

    return { ok: true };
  } catch (error) {
    console.warn('External push request failed:', error);
    return { ok: false, error: 'Network Error' };
  }
}
