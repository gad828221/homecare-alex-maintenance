import { Handler } from '@netlify/functions';

interface NotificationPayload {
  title: string;
  message: string;
  role: 'admin' | 'manager' | 'tech' | 'data-entry' | 'all';
  orderNumber?: string;
  priority?: 'low' | 'normal' | 'high';
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const payload: NotificationPayload = JSON.parse(event.body || '{}');

    // Validate payload
    if (!payload.title || !payload.message || !payload.role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Send notifications based on role
    const notifications = [];

    if (payload.role === 'admin' || payload.role === 'all') {
      notifications.push(
        sendToAdmin(payload),
        sendWhatsAppToAdmin(payload)
      );
    }

    if (payload.role === 'manager' || payload.role === 'all') {
      notifications.push(
        sendToManager(payload),
        sendWhatsAppToManager(payload)
      );
    }

    if (payload.role === 'tech' || payload.role === 'all') {
      notifications.push(
        sendToTechnician(payload)
      );
    }

    if (payload.role === 'data-entry' || payload.role === 'all') {
      notifications.push(
        sendToDataEntry(payload)
      );
    }

    // Wait for all notifications
    await Promise.allSettled(notifications);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Notifications sent' })
    };
  } catch (error: any) {
    console.error('Notification error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

/**
 * Send notification to admin via email/webhook
 */
async function sendToAdmin(payload: NotificationPayload) {
  // TODO: Implement email or webhook notification
  console.log('Sending to admin:', payload);
}

/**
 * Send WhatsApp to admin
 */
async function sendWhatsAppToAdmin(payload: NotificationPayload) {
  const adminPhone = process.env.ADMIN_PHONE || '201558625259';
  const message = `🔔 *${payload.title}*\n\n${payload.message}`;
  
  // TODO: Implement WhatsApp API integration (Twilio, etc.)
  console.log(`WhatsApp to admin (${adminPhone}):`, message);
}

/**
 * Send notification to manager
 */
async function sendToManager(payload: NotificationPayload) {
  const managerPhone = process.env.MANAGER_PHONE || '201278885772';
  const message = `📢 *${payload.title}*\n\n${payload.message}`;
  
  // TODO: Implement notification method
  console.log(`Notification to manager (${managerPhone}):`, message);
}

/**
 * Send WhatsApp to manager
 */
async function sendWhatsAppToManager(payload: NotificationPayload) {
  const managerPhone = process.env.MANAGER_PHONE || '201278885772';
  const message = `📢 *${payload.title}*\n\n${payload.message}`;
  
  // TODO: Implement WhatsApp API integration
  console.log(`WhatsApp to manager (${managerPhone}):`, message);
}

/**
 * Send notification to technician
 */
async function sendToTechnician(payload: NotificationPayload) {
  // TODO: Implement technician notification (SMS, WhatsApp, etc.)
  console.log('Sending to technician:', payload);
}

/**
 * Send notification to data entry staff
 */
async function sendToDataEntry(payload: NotificationPayload) {
  // TODO: Implement data entry notification
  console.log('Sending to data entry:', payload);
}

export { handler };
