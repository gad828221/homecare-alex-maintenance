const axios = require('axios');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { title, message, external_ids, tags } = JSON.parse(event.body);
    
    const ONESIGNAL_APP_ID = "4e110360-2a24-4aa3-be39-050c0ed9a3e0";
    const ONESIGNAL_REST_API_KEY = "NDY3Y2FjNzQtOTk1OS00Y2ViLThmZTUtZTUyZWIyMzI0MDI0";

    const notificationData = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title, ar: title },
      contents: { en: message, ar: message },
      priority: 10,
      android_priority: "high",
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
      included_segments: ["All"] // إرسال للكل لضمان وصول الإشعار للمدير
    };

    // إذا تم تحديد معرفات معينة، نستخدمها، وإلا نرسل للكل
    if (external_ids && external_ids.length > 0) {
      delete notificationData.included_segments;
      notificationData.include_external_user_ids = external_ids;
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
