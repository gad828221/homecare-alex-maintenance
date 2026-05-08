/**
 * خدمة اليوم المالي (Financial Day Service)
 * تحسب اليوم المالي بناءً على إعدادات بداية اليوم (00:00 أو 12:00)
 * تضمن عدم تداخل الحسابات المحاسبية
 */

export interface FinancialDayConfig {
  startHour: 0 | 12; // 0 = منتصف الليل، 12 = الظهر
  timezone: string;
}

export const DEFAULT_FINANCIAL_CONFIG: FinancialDayConfig = {
  startHour: 0, // الموصى به: منتصف الليل
  timezone: 'Africa/Cairo'
};

/**
 * حساب اليوم المالي لتاريخ معين
 * @param date التاريخ المراد حساب اليوم المالي له
 * @param config إعدادات بداية اليوم المالي
 * @returns تاريخ بداية اليوم المالي (YYYY-MM-DD)
 */
export const getFinancialDay = (date: Date = new Date(), config: FinancialDayConfig = DEFAULT_FINANCIAL_CONFIG): string => {
  const d = new Date(date);
  const hour = d.getHours();
  
  // إذا كانت الساعة قبل بداية اليوم المالي، فاليوم المالي هو اليوم السابق
  if (hour < config.startHour) {
    d.setDate(d.getDate() - 1);
  }
  
  return d.toISOString().split('T')[0];
};

/**
 * حساب نطاق اليوم المالي (البداية والنهاية)
 * @param financialDay اليوم المالي (YYYY-MM-DD)
 * @param config إعدادات بداية اليوم المالي
 * @returns {start: ISO string, end: ISO string}
 */
export const getFinancialDayRange = (financialDay: string, config: FinancialDayConfig = DEFAULT_FINANCIAL_CONFIG) => {
  const [year, month, day] = financialDay.split('-').map(Number);
  
  // بداية اليوم المالي
  const start = new Date(year, month - 1, day, config.startHour, 0, 0, 0);
  
  // نهاية اليوم المالي (بداية اليوم التالي)
  const end = new Date(year, month - 1, day + 1, config.startHour, 0, 0, 0);
  
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    startDate: financialDay,
    endDate: new Date(end.getTime() - 1000).toISOString().split('T')[0]
  };
};

/**
 * التحقق مما إذا كان يمكن توزيع أرباح اليوم
 * (لا يمكن التوزيع قبل بداية اليوم المالي التالي)
 * @param config إعدادات بداية اليوم المالي
 * @returns {canDistribute: boolean, nextDistributionTime: string}
 */
export const canDistributeProfits = (config: FinancialDayConfig = DEFAULT_FINANCIAL_CONFIG) => {
  const now = new Date();
  const currentHour = now.getHours();
  
  // إذا كان الإعداد على 12 ظهراً، لا يمكن التوزيع قبل الظهر
  if (config.startHour === 12) {
    if (currentHour < 12) {
      const nextDistribution = new Date();
      nextDistribution.setHours(12, 0, 0, 0);
      return {
        canDistribute: false,
        nextDistributionTime: nextDistribution.toISOString(),
        reason: `لا يمكن توزيع أرباح اليوم قبل الساعة 12 ظهراً. الوقت المسموح به: ${nextDistribution.toLocaleTimeString('ar-EG')}`
      };
    }
  }
  
  return {
    canDistribute: true,
    nextDistributionTime: null,
    reason: null
  };
};

/**
 * التحقق من تطابق التاريخ مع اليوم المالي
 * @param transactionDate تاريخ العملية
 * @param financialDay اليوم المالي المتوقع
 * @param config إعدادات بداية اليوم المالي
 * @returns {isMatching: boolean, warning: string | null}
 */
export const validateTransactionDate = (
  transactionDate: Date,
  financialDay: string,
  config: FinancialDayConfig = DEFAULT_FINANCIAL_CONFIG
) => {
  const calculatedFinancialDay = getFinancialDay(transactionDate, config);
  
  if (calculatedFinancialDay !== financialDay) {
    return {
      isMatching: false,
      warning: `⚠️ تنبيه مهم: هذا الأوردر سجل في يوم مالي مختلف (${calculatedFinancialDay}) عن اليوم المتوقع (${financialDay}). راجع المدير لو في شك.`,
      actualFinancialDay: calculatedFinancialDay
    };
  }
  
  return {
    isMatching: true,
    warning: null,
    actualFinancialDay: calculatedFinancialDay
  };
};

/**
 * حساب عدد الساعات المتبقية حتى نهاية اليوم المالي
 * @param config إعدادات بداية اليوم المالي
 * @returns عدد الساعات المتبقية
 */
export const getHoursUntilFinancialDayEnd = (config: FinancialDayConfig = DEFAULT_FINANCIAL_CONFIG): number => {
  const now = new Date();
  const currentHour = now.getHours();
  
  const hoursUntilEnd = (24 - (currentHour - config.startHour)) % 24;
  return hoursUntilEnd === 0 ? 24 : hoursUntilEnd;
};

/**
 * التحقق من ما إذا كانت العملية متأخرة (بعد منتصف الليل)
 * @param transactionDate تاريخ ووقت العملية
 * @param config إعدادات بداية اليوم المالي
 * @returns {isLate: boolean, message: string}
 */
export const isTransactionLate = (
  transactionDate: Date,
  config: FinancialDayConfig = DEFAULT_FINANCIAL_CONFIG
) => {
  const hour = transactionDate.getHours();
  
  if (config.startHour === 0 && hour >= 0 && hour < 6) {
    return {
      isLate: true,
      message: `✅ تم التسجيل بنجاح في أرباح اليوم السابق (بعد منتصف الليل).`
    };
  }
  
  if (config.startHour === 12 && hour >= 0 && hour < 12) {
    return {
      isLate: true,
      message: `⚠️ تنبيه مهم: هذا الأوردر سجل في يوم أمس ماليًا (قبل الظهر). راجع المدير لو في شك.`
    };
  }
  
  return {
    isLate: false,
    message: `✅ تم التسجيل بنجاح في أرباح اليوم.`
  };
};
