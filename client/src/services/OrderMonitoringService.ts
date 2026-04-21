/**
 * خدمة مراقبة الأوردرات الجديدة
 * تقوم بفحص قاعدة البيانات دورياً للأوردرات الجديدة وإرسال إشعارات قوية
 */

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  phone: string;
  device_type: string;
  brand: string;
  problem_description: string;
  technician: string;
  status: string;
  created_at: string;
}

interface NotificationCallback {
  (type: 'new_order' | 'order_update', order: Order, techName?: string): void;
}

class OrderMonitoringService {
  private lastCheckTime: Date = new Date();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private notificationCallback: NotificationCallback | null = null;
  private isMonitoring: boolean = false;
  private techName: string = '';

  /**
   * بدء مراقبة الأوردرات الجديدة
   * @param techName - اسم الفني (اختياري، للفنيين فقط)
   * @param callback - دالة الاستدعاء عند اكتشاف أوردر جديد
   * @param intervalSeconds - فترة الفحص بالثواني (افتراضي: 10 ثوان)
   */
  startMonitoring(
    callback: NotificationCallback,
    techName: string = '',
    intervalSeconds: number = 10
  ) {
    if (this.isMonitoring) {
      console.log('⚠️ المراقبة قيد التشغيل بالفعل');
      return;
    }

    this.notificationCallback = callback;
    this.techName = techName;
    this.isMonitoring = true;
    this.lastCheckTime = new Date();

    console.log(`🔍 بدء مراقبة الأوردرات الجديدة (كل ${intervalSeconds} ثانية)...`);

    // فحص فوري عند البدء
    this.checkForNewOrders();

    // فحص دوري
    this.monitoringInterval = setInterval(() => {
      this.checkForNewOrders();
    }, intervalSeconds * 1000);
  }

  /**
   * إيقاف مراقبة الأوردرات
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('⏹️ تم إيقاف مراقبة الأوردرات');
  }

  /**
   * فحص الأوردرات الجديدة
   */
  private async checkForNewOrders() {
    try {
      const lastCheckISO = this.lastCheckTime.toISOString();
      let query = `orders?created_at=gt.${lastCheckISO}&order=created_at.desc`;

      // إذا كان هناك اسم فني، ابحث عن الأوردرات الخاصة به فقط
      if (this.techName) {
        query = `orders?created_at=gt.${lastCheckISO}&technician=eq.${encodeURIComponent(
          this.techName
        )}&order=created_at.desc`;
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/${query}`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newOrders: Order[] = await response.json();

      if (newOrders && newOrders.length > 0) {
        console.log(`✅ تم اكتشاف ${newOrders.length} أوردر جديد(ة)`);

        // معالجة كل أوردر جديد
        for (const order of newOrders) {
          if (this.notificationCallback) {
            this.notificationCallback('new_order', order, this.techName);
          }
        }
      }

      // تحديث وقت آخر فحص
      this.lastCheckTime = new Date();
    } catch (error) {
      console.error('❌ خطأ في فحص الأوردرات الجديدة:', error);
    }
  }

  /**
   * الحصول على حالة المراقبة
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    lastCheckTime: Date;
    techName: string;
  } {
    return {
      isMonitoring: this.isMonitoring,
      lastCheckTime: this.lastCheckTime,
      techName: this.techName,
    };
  }
}

// تصدير نسخة واحدة من الخدمة (Singleton)
export const orderMonitoringService = new OrderMonitoringService();

export default OrderMonitoringService;
