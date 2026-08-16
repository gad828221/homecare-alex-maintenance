export type PushNotificationInput = {
  title: string;
  message: string;
  event: 'new_order' | 'technician_assigned' | 'order_status_changed' | 'customer_feedback' | 'system_alert';
  targetRoles?: string[];
  targetUserIds?: Array<string | number>;
  data?: Record<string, string | number | boolean | null | undefined>;
};

export async function sendExternalPush(input: PushNotificationInput): Promise<boolean> {
  try {
    const response = await fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...input,
        targetUserIds: input.targetUserIds?.map(String),
      }),
    });

    if (!response.ok) {
      console.warn('External push was not sent:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    // Push failure must never block saving an order or changing its status.
    console.warn('External push request failed:', error);
    return false;
  }
}
