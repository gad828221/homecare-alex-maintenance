export const CAIRO_TIME_ZONE = 'Africa/Cairo';

const ISO_WITHOUT_TIMEZONE = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/;
const DATE_ONLY_DMY = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/;

const getCairoOffsetMs = (utcGuessMs: number): number => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CAIRO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(utcGuessMs));
  const values: Record<string, number> = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') values[part.type] = Number(part.value);
  });
  const cairoAsUtcMs = Date.UTC(
    values.year,
    (values.month || 1) - 1,
    values.day || 1,
    values.hour || 0,
    values.minute || 0,
    values.second || 0
  );
  return cairoAsUtcMs - utcGuessMs;
};

const parseCairoLocal = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0
): Date | null => {
  const utcGuessMs = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  if (Number.isNaN(utcGuessMs)) return null;
  const firstOffset = getCairoOffsetMs(utcGuessMs);
  let timestamp = utcGuessMs - firstOffset;
  // Recalculate once to handle a daylight-saving boundary safely.
  const secondOffset = getCairoOffsetMs(timestamp);
  if (secondOffset !== firstOffset) timestamp = utcGuessMs - secondOffset;
  const result = new Date(timestamp);
  return Number.isNaN(result.getTime()) ? null : result;
};

/**
 * Parses Supabase timestamps consistently.
 * Explicit UTC/offset timestamps are kept as instants. Timestamps without an
 * offset are interpreted as local Cairo time instead of the device timezone.
 */
export const parseOrderDate = (value: unknown): Date | null => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)) {
    const explicit = new Date(raw);
    return Number.isNaN(explicit.getTime()) ? null : explicit;
  }

  const isoMatch = raw.match(ISO_WITHOUT_TIMEZONE);
  if (isoMatch) {
    const [, year, month, day, hour = '0', minute = '0', second = '0', fraction = '0'] = isoMatch;
    return parseCairoLocal(
      Number(year),
      Number(month),
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      Number(fraction.padEnd(3, '0'))
    );
  }

  const dmyMatch = raw.match(DATE_ONLY_DMY);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return parseCairoLocal(Number(year), Number(month), Number(day));
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: CAIRO_TIME_ZONE,
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
