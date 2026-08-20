export const CAIRO_TIME_ZONE = 'Africa/Cairo';

const ISO_WITHOUT_TIMEZONE = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/;
const DATE_ONLY_DMY = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/;

/**
 * v3.2.4: الحل الهندسي النهائي للتوقيت
 * نقوم بتحويل النصوص القادمة من قاعدة البيانات إلى كائنات تاريخ (Date) معيارية،
 * ثم نترك للمتصفح مهمة عرضها بتوقيت القاهرة Africa/Cairo.
 */
export const parseOrderDate = (value: unknown): Date | null => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  // 1. إذا كان التوقيت ISO (قادم من Supabase)
  const isoMatch = raw.match(ISO_WITHOUT_TIMEZONE);
  if (isoMatch) {
    // نضمن أن المتصفح يعامله كـ UTC بإضافة Z إذا لم تكن موجودة
    const utcFormatted = raw.includes('Z') || raw.includes('+') ? raw : (raw.replace(' ', 'T') + 'Z');
    const date = new Date(utcFormatted);
    if (!Number.isNaN(date.getTime())) return date;
  }

  // 2. إذا كان تنسيق DD/MM/YYYY
  const dmyMatch = raw.match(DATE_ONLY_DMY);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    // التواريخ بدون وقت تعتبر في بداية اليوم بالتوقيت المحلي
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  // 3. المحاولة العامة
  const fallback = new Date(raw);
  return !Number.isNaN(fallback.getTime()) ? fallback : null;
};

export const formatOrderDay = (value: unknown): string => {
  const date = parseOrderDate(value);
  return date
    ? new Intl.DateTimeFormat('ar-EG', { weekday: 'long', timeZone: CAIRO_TIME_ZONE }).format(date)
    : 'اليوم غير محدد';
};

export const formatOrderDateTime = (value: unknown): string => {
  const date = parseOrderDate(value);
  if (!date) return 'التاريخ غير محدد';
  
  // نطلب من المتصفح عرض الوقت بتوقيت القاهرة تحديداً
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: CAIRO_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h12'
  }).format(date);
};

export const formatElapsed = (value: unknown, now = Date.now()): string => {
  const date = parseOrderDate(value);
  if (!date) return 'المدة غير محددة';

  // الحساب الرياضي البسيط للفرق بين اللحظتين (UTC vs UTC)
  const elapsedMs = Math.max(0, now - date.getTime());
  
  const totalMinutes = Math.floor(elapsedMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days} يوم${days === 1 ? '' : 'اً'} و${hours} س`;
  if (hours > 0) return `${hours} س و${minutes} د`;
  return `${minutes} دقيقة`;
};

export const getElapsedTone = (value: unknown, now = Date.now()): 'normal' | 'warning' | 'urgent' => {
  const date = parseOrderDate(value);
  if (!date) return 'normal';
  const elapsedHours = Math.max(0, now - date.getTime()) / 3_600_000;
  if (elapsedHours >= 48) return 'urgent';
  if (elapsedHours >= 24) return 'warning';
  return 'normal';
};

export const getOrderCreatedValue = (order: any): unknown => order?.created_at || order?.date;
