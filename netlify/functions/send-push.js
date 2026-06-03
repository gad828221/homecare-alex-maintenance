export const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { title, message, external_ids, target_roles } = JSON.parse(event.body);
    
    const ONESIGNAL_APP_ID = "4e110360-2a24-4aa3-be39-050c0ed9a3e0";
    const ONESIGNAL_REST_API_KEY = "NDY3Y2FjNzQtOTk1OS00Y2ViLThmZTUtZTUyZWIyMzI0MDI0";

    const notificationData = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title, ar: title },
      contents: { en: message, ar: message },
      priority: 10,
      android_priority: "high",
      ios_badgeType: "Increase",
      ios_badgeCount: 1
    };

    // فلترة المستلمين بناءً على الصلاحيات (Roles)
    if (target_roles && target_roles.length > 0) {
      notificationData.filters = target_roles.map((role, index) => {
        const filter = { field: "tag", key: "role", relation: "=", value: role };
        // إضافة "OR" بين الفلاتر إذا كان هناك أكثر من دور
        return index === 0 ? filter : { operator: "OR", ...filter };
      }).flat();
    } 
    // أو الإرسال لمعرفات محددة (فني معين مثلاً)
    else if (external_ids && external_ids.length > 0) {
      notificationData.include_external_user_ids = external_ids;
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(notificationData)
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data })
    };
  } catch (error) {
    console.error('OneSignal Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
