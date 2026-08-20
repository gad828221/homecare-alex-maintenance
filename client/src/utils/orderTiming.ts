export const CAIRO_TIME_ZONE = 'Africa/Cairo';

const ISO_WITHOUT_TIMEZONE = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/;
const DATE_ONLY_DMY = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/;

/**
 * v3.2.3: إضافة إزاحة 3 ساعات يدوياً لضمان توقيت مصر (GMT+3)
 * قاعدة البيانات تخزن التوقيت بـ UTC، لذا نضيف 3 ساعات للتحويل المحلي.
 */
const EGYPT_OFFSET_MS = 3 * 60 * 60 * 1000;

export const parseOrderDate = (value: unknown): Date | null => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  let date: Date | null = null;

  // 1. معالجة توقيت Supabase ISO (2026-08-20T13:51:00)
  const isoMatch = raw.match(ISO_WITHOUT_TIMEZONE);
  if (isoMatch) {
    // نحول النص إلى تاريخ UTC أولاً
    const utcDate = new Date(raw.includes('Z') ? raw : raw.replace(' ', 'T') + 'Z');
    if (!Number.isNaN(utcDate.getTime())) {
      // نضيف 3 ساعات يدوياً للتحويل لتوقيت مصر
      date = new Date(utcDate.getTime() + EGYPT_OFFSET_MS);
    }
  }

  // 2. معالجة التواريخ ذات المنطقة الزمنية الصريحة
  if (!date && /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)) {
    const explicit = new Date(raw);
    if (!Number.isNaN(explicit.getTime())) {
      date = new Date(explicit.getTime() + EGYPT_OFFSET_MS);
    }
  }

  // 3. معالجة تنسيق DD/MM/YYYY
  if (!date) {
    const dmyMatch = raw.match(DATE_ONLY_DMY);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      date = new Date(Number(year), Number(month) - 1, Number(day));
    }
  }

  // 4. المحاولة الأخيرة
  if (!date) {
    const fallback = new Date(raw);
    if (!Number.isNaN(fallback.getTime())) {
      date = new Date(fallback.getTime() + EGYPT_OFFSET_MS);
    }
  }

  return date && !Number.isNaN(date.getTime()) ? date : null;
};

export const formatOrderDay = (value: unknown): string => {
  const date = parseOrderDate(value);
  return date
    ? new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(date)
    : 'اليوم غير محدد';
};

export const formatOrderDateTime = (value: unknown): string => {
  const date = parseOrderDate(value);
  if (!date) return 'التاريخ غير محدد';
  
  // v3.2.3: العرض المباشر للتاريخ بعد إضافة الإزاحة يدوياً
  return new Intl.DateTimeFormat('ar-EG', {
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

  // ملاحظة: بما أن parseOrderDate يضيف 3 ساعات، يجب أن نطرحها من 'now' 
  // أو نقارن التوقيتات بعد توحيدها. الأفضل مقارنة الأوقات الحقيقية.
  const cairoNow = new Date(new Date().getTime() + EGYPT_OFFSET_MS);
  const elapsedMs = Math.max(0, cairoNow.getTime() - date.getTime());
  
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
  const cairoNow = new Date(new Date().getTime() + EGYPT_OFFSET_MS);
  const elapsedHours = Math.max(0, cairoNow.getTime() - date.getTime()) / 3_600_000;
  if (elapsedHours >= 48) return 'urgent';
  if (elapsedHours >= 24) return 'warning';
  return 'normal';
};

export const getOrderCreatedValue = (order: any): unknown => order?.created_at || order?.date;
