const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { title, message, userId, data } = JSON.parse(event.body);

    if (!title || !message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Title and message are required' }) };
    }

    const oneSignalAppId = process.env.ONESIGNAL_APP_ID || '8e1f2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c';
    const oneSignalApiKey = process.env.ONESIGNAL_API_KEY || 'ZjY3YzI5YjAtMjQ3OS00ZjI0LWJmZjItNDQzNDc4MzQ1YzY4';

    const notificationBody = {
      app_id: oneSignalAppId,
      headings: { en: title, ar: title },
      contents: { en: message, ar: message },
      priority: 10,
      big_picture: 'https://maintenanceguide.life/logo.png',
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
      ...(userId && { include_external_user_ids: [userId] }),
      ...(!userId && { included_segments: ['All'] })
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${oneSignalApiKey}`
      },
      body: JSON.stringify(notificationBody)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OneSignal Error:', result);
      return { statusCode: response.status, body: JSON.stringify(result) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, notificationId: result.body?.id })
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
