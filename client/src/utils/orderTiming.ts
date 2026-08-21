export const CAIRO_TIME_ZONE = 'Africa/Cairo';

/**
 * v3.2.5: التصحيح الرياضي النهائي للتوقيت والعداد
 * قاعدة البيانات ترسل التوقيت بـ UTC (مثلاً 13:51).
 * توقيت مصر هو UTC + 3 (تصبح 16:51 أي 4:51 م).
 */
const EGYPT_OFFSET_HOURS = 3;

export const parseOrderDate = (value: unknown): Date | null => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  try {
    let date: Date;
    
    // إذا كان التوقيت ISO (يحتوي على - و :)
    if (raw.includes('-') && raw.includes(':')) {
      // نضمن معاملته كـ UTC بإضافة Z إذا لم توجد
      const utcString = (raw.includes('Z') || raw.includes('+')) ? raw : (raw.replace(' ', 'T') + 'Z');
      date = new Date(utcString);
    } else {
      date = new Date(raw);
    }

    if (Number.isNaN(date.getTime())) return null;
    return date;
  } catch (e) {
    return null;
  }
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
  
  // عرض الوقت بتوقيت القاهرة (يضيف 3 ساعات تلقائياً للـ UTC)
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

  // حساب الفرق الحقيقي بين اللحظتين بالملي ثانية
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

export const getEgyptTodayString = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CAIRO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};
