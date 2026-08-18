const REPORT_TIME_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * Order timestamps without an explicit timezone are stored in the data server's
 * timezone. Keep the same +8 hour correction used by the reporting dashboard.
 */
export const parseOrderDate = (value: unknown): Date | null => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  const hasExplicitTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  return hasExplicitTimezone ? parsed : new Date(parsed.getTime() + REPORT_TIME_OFFSET_MS);
};

export const formatOrderDay = (value: unknown): string => {
  const date = parseOrderDate(value);
  return date ? new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(date) : 'اليوم غير محدد';
};

export const formatOrderDateTime = (value: unknown): string => {
  const date = parseOrderDate(value);
  if (!date) return 'التاريخ غير محدد';
  return new Intl.DateTimeFormat('ar-EG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const formatElapsed = (value: unknown, now = Date.now()): string => {
  const date = parseOrderDate(value);
  if (!date) return 'المدة غير محددة';

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
