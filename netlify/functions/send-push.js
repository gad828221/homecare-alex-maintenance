const axios = require('axios');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { title, message, external_ids, tags } = JSON.parse(event.body);
    
    const ONESIGNAL_APP_ID = "4e110360-2a24-4aa3-be39-050c0ed9a3e0";
    const ONESIGNAL_REST_API_KEY = "NDY3Y2FjNzQtOTk1OS00Y2ViLThmZTUtZTUyZWIyMzI0MDI0"; // REST API Key

    const notificationData = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title, ar: title },
      contents: { en: message, ar: message },
      priority: 10,
      android_priority: "high",
      ios_badgeType: "Increase",
      ios_badgeCount: 1
    };

    if (external_ids && external_ids.length > 0) {
      notificationData.include_external_user_ids = external_ids;
    } else if (tags) {
      // إرسال بناءً على الـ tags (مثلاً للمديرين)
      notificationData.filters = [
        { field: "tag", key: "role", relation: "=", value: "admin" }
      ];
    } else {
      // إرسال للكل كخيار احتياطي
      notificationData.included_segments = ["All"];
    }

    const response = await axios.post('https://onesignal.com/api/v1/notifications', notificationData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: response.data })
    };
  } catch (error) {
    console.error('OneSignal Error:', error.response ? error.response.data : error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
