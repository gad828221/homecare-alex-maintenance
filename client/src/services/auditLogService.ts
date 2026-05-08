/**
 * خدمة سجل التغييرات (Audit Log Service)
 * تسجل جميع العمليات المالية والتعديلات بشكل غير قابل للحذف
 */

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: 'admin' | 'technician' | 'partner';
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'DISTRIBUTE' | 'SETTLE' | 'CORRECT';
  entityType: 'order' | 'cash_entry' | 'profit_distribution' | 'correction';
  entityId: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  reason?: string; // سبب التعديل (مطلوب للتصحيحات)
  ipAddress?: string;
  notes?: string;
}

class AuditLogService {
  private logs: AuditLog[] = [];
  private storageKey = 'auditLogs';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * تسجيل عملية جديدة
   */
  log(
    userId: string,
    userName: string,
    userRole: 'admin' | 'technician' | 'partner',
    action: AuditLog['action'],
    entityType: AuditLog['entityType'],
    entityId: string,
    changes: AuditLog['changes'],
    reason?: string,
    notes?: string
  ): AuditLog {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      userName,
      userRole,
      action,
      entityType,
      entityId,
      changes,
      reason,
      notes,
      ipAddress: this.getClientIp()
    };

    this.logs.push(log);
    this.saveToStorage();

    // تسجيل في الكونسول للتطوير
    console.log('[AUDIT LOG]', log);

    return log;
  }

  /**
   * تسجيل تصحيح (Correction)
   * مطلوب سبب مكتوب من المدير
   */
  logCorrection(
    userId: string,
    userName: string,
    entityType: AuditLog['entityType'],
    entityId: string,
    changes: AuditLog['changes'],
    reason: string
  ): AuditLog {
    if (!reason || reason.trim().length === 0) {
      throw new Error('يجب إدخال سبب التصحيح');
    }

    return this.log(
      userId,
      userName,
      'admin',
      'CORRECT',
      entityType,
      entityId,
      changes,
      reason
    );
  }

  /**
   * تسجيل توزيع أرباح
   */
  logProfitDistribution(
    userId: string,
    userName: string,
    financialDay: string,
    partners: Array<{ name: string; amount: number; percentage: number }>,
    totalAmount: number
  ): AuditLog {
    return this.log(
      userId,
      userName,
      'admin',
      'DISTRIBUTE',
      'profit_distribution',
      `distribution-${financialDay}`,
      [
        {
          field: 'totalAmount',
          oldValue: 0,
          newValue: totalAmount
        },
        {
          field: 'partners',
          oldValue: [],
          newValue: partners
        }
      ],
      undefined,
      `توزيع أرباح يوم ${financialDay}`
    );
  }

  /**
   * تسجيل تصفية أوردر
   */
  logOrderSettlement(
    userId: string,
    userName: string,
    orderId: string,
    amount: number,
    financialDay: string
  ): AuditLog {
    return this.log(
      userId,
      userName,
      'technician',
      'SETTLE',
      'order',
      orderId,
      [
        {
          field: 'status',
          oldValue: 'in_progress',
          newValue: 'completed'
        },
        {
          field: 'amount',
          oldValue: 0,
          newValue: amount
        }
      ],
      undefined,
      `تصفية أوردر في يوم مالي: ${financialDay}`
    );
  }

  /**
   * الحصول على سجلات معينة
   */
  getLogs(filters?: {
    userId?: string;
    action?: AuditLog['action'];
    entityType?: AuditLog['entityType'];
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
  }): AuditLog[] {
    return this.logs.filter(log => {
      if (filters?.userId && log.userId !== filters.userId) return false;
      if (filters?.action && log.action !== filters.action) return false;
      if (filters?.entityType && log.entityType !== filters.entityType) return false;
      if (filters?.entityId && log.entityId !== filters.entityId) return false;
      if (filters?.startDate && log.timestamp < filters.startDate) return false;
      if (filters?.endDate && log.timestamp > filters.endDate) return false;
      return true;
    });
  }

  /**
   * الحصول على سجلات التصحيحات
   */
  getCorrectionLogs(): AuditLog[] {
    return this.getLogs({ action: 'CORRECT' });
  }

  /**
   * الحصول على سجلات توزيع الأرباح
   */
  getDistributionLogs(): AuditLog[] {
    return this.getLogs({ action: 'DISTRIBUTE' });
  }

  /**
   * الحصول على سجلات تصفية الأوردرات
   */
  getSettlementLogs(): AuditLog[] {
    return this.getLogs({ action: 'SETTLE' });
  }

  /**
   * التحقق من وجود تصحيحات على عملية معينة
   */
  hasCorrections(entityId: string): boolean {
    return this.logs.some(log => log.action === 'CORRECT' && log.entityId === entityId);
  }

  /**
   * الحصول على سجل التصحيحات لعملية معينة
   */
  getCorrectionsFor(entityId: string): AuditLog[] {
    return this.logs.filter(log => log.action === 'CORRECT' && log.entityId === entityId);
  }

  /**
   * حفظ السجلات في التخزين المحلي
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    } catch (e) {
      console.error('خطأ في حفظ سجل التغييرات:', e);
    }
  }

  /**
   * تحميل السجلات من التخزين المحلي
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.logs = JSON.parse(stored).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (e) {
      console.error('خطأ في تحميل سجل التغييرات:', e);
    }
  }

  /**
   * الحصول على عنوان IP للعميل (محاكاة)
   */
  private getClientIp(): string {
    // في بيئة حقيقية، يتم الحصول على IP من الخادم
    return 'local';
  }

  /**
   * تصدير السجلات كـ CSV
   */
  exportAsCSV(): string {
    const headers = ['التاريخ', 'المستخدم', 'الدور', 'الإجراء', 'النوع', 'المعرف', 'السبب'];
    const rows = this.logs.map(log => [
      log.timestamp.toLocaleString('ar-EG'),
      log.userName,
      log.userRole,
      log.action,
      log.entityType,
      log.entityId,
      log.reason || '-'
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  }

  /**
   * حذف السجلات القديمة (اختياري - للصيانة)
   * لا يحذف سجلات التصحيحات
   */
  deleteOldLogs(daysOld: number = 90): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const initialCount = this.logs.length;
    this.logs = this.logs.filter(log => {
      // لا تحذف سجلات التصحيحات أبداً
      if (log.action === 'CORRECT') return true;
      // احذف السجلات القديمة فقط
      return log.timestamp > cutoffDate;
    });

    this.saveToStorage();
    return initialCount - this.logs.length;
  }
}

// تصدير instance واحد من الخدمة
export const auditLogService = new AuditLogService();
