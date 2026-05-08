/**
 * خدمة نظام التنبيهات الحازم (Alerting Service)
 * تدير التنبيهات والإشعارات للمدير والفنيين والشركاء
 * تضمن عدم تكرار الأخطاء المحاسبية
 */

export type AlertLevel = 'critical' | 'warning' | 'info' | 'success';
export type AlertTarget = 'admin' | 'technician' | 'partner' | 'all';

export interface Alert {
  id: string;
  level: AlertLevel;
  target: AlertTarget;
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
}

export interface AlertConfig {
  enableWhatsApp: boolean;
  enableToast: boolean;
  enableInAppNotification: boolean;
  repeatInterval?: number; // بالدقائق، للتنبيهات المتكررة
}

const DEFAULT_CONFIG: AlertConfig = {
  enableWhatsApp: true,
  enableToast: true,
  enableInAppNotification: true,
  repeatInterval: 5 // تكرار التنبيهات الحرجة كل 5 دقائق
};

class AlertingService {
  private alerts: Map<string, Alert> = new Map();
  private config: AlertConfig = DEFAULT_CONFIG;
  private toastCallbacks: ((alert: Alert) => void)[] = [];
  private whatsappCallbacks: ((alert: Alert) => void)[] = [];

  /**
   * إضافة تنبيه حرج (Critical Alert)
   * يتكرر كل 5 دقائق حتى يتم حله
   */
  addCriticalAlert(
    target: AlertTarget,
    title: string,
    message: string,
    action?: { label: string; callback: () => void }
  ): string {
    const alertId = `critical-${Date.now()}`;
    const alert: Alert = {
      id: alertId,
      level: 'critical',
      target,
      title,
      message,
      timestamp: new Date(),
      resolved: false,
      action
    };

    this.alerts.set(alertId, alert);
    this.triggerAlert(alert);

    // تكرار التنبيه كل 5 دقائق
    const interval = setInterval(() => {
      if (this.alerts.get(alertId)?.resolved) {
        clearInterval(interval);
      } else {
        this.triggerAlert(alert);
      }
    }, this.config.repeatInterval! * 60 * 1000);

    return alertId;
  }

  /**
   * إضافة تنبيه تحذيري (Warning Alert)
   */
  addWarningAlert(
    target: AlertTarget,
    title: string,
    message: string,
    action?: { label: string; callback: () => void }
  ): string {
    const alertId = `warning-${Date.now()}`;
    const alert: Alert = {
      id: alertId,
      level: 'warning',
      target,
      title,
      message,
      timestamp: new Date(),
      resolved: false,
      action
    };

    this.alerts.set(alertId, alert);
    this.triggerAlert(alert);
    return alertId;
  }

  /**
   * إضافة تنبيه معلومات (Info Alert)
   */
  addInfoAlert(
    target: AlertTarget,
    title: string,
    message: string
  ): string {
    const alertId = `info-${Date.now()}`;
    const alert: Alert = {
      id: alertId,
      level: 'info',
      target,
      title,
      message,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.set(alertId, alert);
    this.triggerAlert(alert);
    return alertId;
  }

  /**
   * إضافة تنبيه نجاح (Success Alert)
   */
  addSuccessAlert(
    target: AlertTarget,
    title: string,
    message: string
  ): string {
    const alertId = `success-${Date.now()}`;
    const alert: Alert = {
      id: alertId,
      level: 'success',
      target,
      title,
      message,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.set(alertId, alert);
    this.triggerAlert(alert);
    return alertId;
  }

  /**
   * حل تنبيه معين
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * الحصول على جميع التنبيهات النشطة (غير المحلولة)
   */
  getActiveAlerts(target?: AlertTarget): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => {
      if (alert.resolved) return false;
      if (target && alert.target !== target && alert.target !== 'all') return false;
      return true;
    });
  }

  /**
   * الحصول على التنبيهات الحرجة فقط
   */
  getCriticalAlerts(target?: AlertTarget): Alert[] {
    return this.getActiveAlerts(target).filter(a => a.level === 'critical');
  }

  /**
   * تشغيل التنبيه (إرسال إشعارات)
   */
  private triggerAlert(alert: Alert): void {
    if (this.config.enableToast) {
      this.toastCallbacks.forEach(cb => cb(alert));
    }

    if (this.config.enableWhatsApp && alert.level === 'critical') {
      this.whatsappCallbacks.forEach(cb => cb(alert));
    }
  }

  /**
   * تسجيل callback لتنبيهات Toast
   */
  onToastAlert(callback: (alert: Alert) => void): void {
    this.toastCallbacks.push(callback);
  }

  /**
   * تسجيل callback لتنبيهات WhatsApp
   */
  onWhatsAppAlert(callback: (alert: Alert) => void): void {
    this.whatsappCallbacks.push(callback);
  }

  /**
   * مسح جميع التنبيهات
   */
  clearAllAlerts(): void {
    this.alerts.clear();
  }

  /**
   * تحديث إعدادات الخدمة
   */
  updateConfig(config: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// تصدير instance واحد من الخدمة
export const alertingService = new AlertingService();

/**
 * تنبيهات محددة مسبقاً للمدير
 */
export const ADMIN_ALERTS = {
  CANNOT_DISTRIBUTE_BEFORE_NOON: (nextTime: string) => ({
    title: '⛔ تنبيه خطأ',
    message: `لا يمكن توزيع أرباح اليوم قبل الساعة 12 ظهراً. الوقت المسموح به: ${nextTime}`,
    action: 'تصحيح'
  }),
  
  CASH_MISMATCH: (difference: number) => ({
    title: '⚠️ عدم تطابق الخزنة',
    message: `تقرير يومي: الخزنة غير متطابقة. الفرق بين الرصيد الحقيقي والمحسوب: ${difference} ج.م`,
    action: 'مراجعة'
  }),
  
  PENDING_DISTRIBUTION: (date: string) => ({
    title: '🚨 توزيع معلق',
    message: `لا تغلق اليوم قبل التوزيع - توزيع أرباح ${date} لم يتم بعد`,
    action: 'توزيع الآن'
  }),
  
  CONFLICTING_ORDERS: (count: number) => ({
    title: '⚠️ أوردرات متعارضة',
    message: `لديك ${count} أوردرات متعارضة التواريخ. يجب مراجعتها`,
    action: 'مراجعة'
  })
};

/**
 * تنبيهات محددة مسبقاً للفنيين
 */
export const TECHNICIAN_ALERTS = {
  LATE_SETTLEMENT: (date: string) => ({
    title: '⚠️ تنبيه مهم',
    message: `هذا الأوردر سجل في يوم أمس ماليًا (${date}). راجع المدير لو في شك.`
  }),
  
  SUCCESSFUL_SETTLEMENT: (date: string) => ({
    title: '✅ تم بنجاح',
    message: `تم التسجيل بنجاح في أرباح اليوم (${date}).`
  })
};

/**
 * تنبيهات محددة مسبقاً للشركاء (عبر WhatsApp)
 */
export const PARTNER_ALERTS = {
  PROFIT_DISTRIBUTION: (partnerName: string, date: string, percentage: number, amount: number, monthlyTotal: number) => ({
    title: '💰 توزيع أرباح',
    message: `
مرحباً ${partnerName}،

تم توزيع أرباح اليوم:
📅 التاريخ: ${date}
📊 نسبتك: ${percentage}%
💵 المبلغ: ${amount} ج.م
📈 إجمالي أرباحك هذا الشهر: ${monthlyTotal} ج.م

شكراً لك على عملك المميز!
    `
  })
};
