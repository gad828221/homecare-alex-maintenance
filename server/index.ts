import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ONESIGNAL_APP_ID = "4e110360-2a24-4aa3-be39-050c0ed9a3e0";
const ONESIGNAL_REST_API_KEY = "NDI3MjM0MDItYTY5OS00ODQyLTljYmItNmI5YmNlYmE1Zjg5";

// دالة لإرسال إشعارات OneSignal من الخادم
async function sendPushNotification(userIds: string[], title: string, message: string) {
  try {
    console.log(`[Server] Sending push notification to: ${userIds.join(", ")}`);
    
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
        android_accent_color: "FFEA580C",
        small_icon: "ic_stat_onesignal_default",
        ios_badgeType: "Increase",
        ios_badgeCount: 1,
        priority: 10,
      })
    });
    
    const data = await response.json();
    console.log("[Server] OneSignal response:", data);
    return data;
  } catch (error) {
    console.error("[Server] Error sending push notification:", error);
    throw error;
  }
}

// دالة للحصول على جميع المديرين من Supabase
async function getAdminIds() {
  try {
    const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';
    
    const res = await fetch(`${supabaseUrl}/rest/v1/users?select=id,role`, {
      headers: { 
        'apikey': supabaseKey, 
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    const users = await res.json();
    const adminIds: string[] = [];
    
    users.forEach((user: any) => {
      if (user.role === 'admin' || user.role === 'manager') {
        adminIds.push(user.id.toString());
        adminIds.push(`admin_${user.id}`);
        adminIds.push(`manager_${user.id}`);
      }
    });
    
    console.log(`[Server] Found ${adminIds.length} admin IDs`);
    return adminIds;
  } catch (error) {
    console.error("[Server] Error getting admin IDs:", error);
    return [];
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // API endpoint لإرسال إشعار عند إضافة أوردر جديد
  app.post("/api/notify-new-order", async (req, res) => {
    try {
      const { orderNumber, customerName, phone, deviceType, brand, address, totalAmount } = req.body;
      
      console.log(`[Server] New order notification request: Order #${orderNumber}`);
      
      // الحصول على معرفات المديرين
      const adminIds = await getAdminIds();
      
      if (adminIds.length === 0) {
        console.warn("[Server] No admin IDs found");
        return res.status(400).json({ error: "No admins to notify" });
      }
      
      // إنشاء رسالة الإشعار
      const title = `🆕 أوردر جديد #${orderNumber}`;
      const message = `👤 ${customerName}\n📱 ${phone}\n🔧 ${deviceType} - ${brand}\n📍 ${address}\n💰 ${totalAmount} ج.م`;
      
      // إرسال الإشعار
      const result = await sendPushNotification(adminIds, title, message);
      
      res.json({ success: true, result });
    } catch (error) {
      console.error("[Server] Error in notify-new-order:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });
  
  // API endpoint لإرسال إشعار للفني
  app.post("/api/notify-technician", async (req, res) => {
    try {
      const { techId, orderNumber, customerName, phone, address } = req.body;
      
      console.log(`[Server] Technician notification request: Tech #${techId}, Order #${orderNumber}`);
      
      const userIds = [
        techId.toString(),
        `tech_${techId}`
      ];
      
      const title = `🔧 تم تعيين أوردر جديد #${orderNumber}`;
      const message = `👤 ${customerName}\n📱 ${phone}\n📍 ${address}`;
      
      const result = await sendPushNotification(userIds, title, message);
      
      res.json({ success: true, result });
    } catch (error) {
      console.error("[Server] Error in notify-technician:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });
  
  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");
  
  app.use(express.static(staticPath));
  
  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
  
  const port = process.env.PORT || 3000;
  
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
