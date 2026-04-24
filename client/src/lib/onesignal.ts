
const ONESIGNAL_APP_ID = "4e110360-2a24-4aa3-be39-050c0ed9a3e0";
const ONESIGNAL_REST_API_KEY = "NDI3MjM0MDItYTY5OS00ODQyLTljYmItNmI5YmNlYmE1Zjg5"; // This should ideally be in env vars, but for now we need it to send from client if no backend

export const sendPushNotification = async (userIds: string[], title: string, message: string) => {
  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: userIds,
        headings: { en: title, ar: title },
        contents: { en: message, ar: message },
        android_accent_color: "FFEA580C", // Orange-600
        small_icon: "ic_stat_onesignal_default",
      })
    });
    const data = await response.json();
    console.log("OneSignal push response:", data);
    return data;
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};

export const notifyAdmins = async (title: string, message: string) => {
  // We need a way to get all admin IDs. For now, we might need to fetch them from Supabase 
  // or just send to a specific list if known. 
  // In this system, admin/manager IDs are numeric from the 'users' table.
  try {
    const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';
    
    const res = await fetch(`${supabaseUrl}/rest/v1/users?select=id&role=in.("admin","manager")`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const admins = await res.json();
    const adminIds = admins.map((a: any) => a.id.toString());
    if (adminIds.length > 0) {
      await sendPushNotification(adminIds, title, message);
    }
  } catch (err) {
    console.error("Error notifying admins:", err);
  }
};

export const notifyTechnician = async (techName: string, title: string, message: string) => {
  try {
    const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';
    
    const res = await fetch(`${supabaseUrl}/rest/v1/technicians?select=id&name=eq.${encodeURIComponent(techName)}`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const techs = await res.json();
    if (techs && techs.length > 0) {
      const techId = `tech_${techs[0].id}`;
      await sendPushNotification([techId], title, message);
    }
  } catch (err) {
    console.error("Error notifying technician:", err);
  }
};
