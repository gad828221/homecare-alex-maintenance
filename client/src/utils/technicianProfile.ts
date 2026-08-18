export const TECHNICIAN_NAME_BY_CODE: Record<string, string> = {
  AF: 'أحمد فهمى',
  AM: 'أيمن مصطفى',
  SH: 'شريف',
  HARON2: 'محمد حمدي',
};

export type TechnicianProfile = {
  id?: string | number;
  code?: string;
  username?: string;
  name: string;
  photoUrl?: string;
  updatedAt?: string;
};

const normalizeIdentity = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/\./g, '');

export function getTechnicianDisplayName(technician: any, fallback = 'الفني المختص'): string {
  const values = [technician?.username, technician?.code, technician?.name, technician?.techName].filter(Boolean);
  for (const value of values) {
    const code = String(value).trim().toUpperCase().replace(/[.\s_-]/g, '');
    if (TECHNICIAN_NAME_BY_CODE[code]) return TECHNICIAN_NAME_BY_CODE[code];
  }
  return String(technician?.name || technician?.techName || fallback).trim() || fallback;
}

export function getDeviceSpecialty(deviceType: unknown): string {
  const device = String(deviceType || '').trim();
  const specialties: Record<string, string> = {
    'غسالة': 'غسالات',
    'غسالات': 'غسالات',
    'غسالة أطباق': 'غسالات أطباق',
    'ثلاجة': 'ثلاجات',
    'ثلاجات': 'ثلاجات',
    'بوتاجاز': 'بوتاجازات',
    'بوتاجازات': 'بوتاجازات',
    'سخان': 'سخانات',
    'سخانات': 'سخانات',
    'تكييف': 'تكييف',
    'تكييفات': 'تكييف',
    'ميكروويف': 'ميكروويف',
  };
  return specialties[device] || device || 'الأجهزة المنزلية';
}

export function getTechnicianSpecialty(technician: any, deviceType?: unknown): string {
  const recorded = String(technician?.specialization || technician?.specialty || '').trim();
  if (recorded && !['عام', 'شامل', 'مساعد'].includes(recorded)) return recorded;
  return getDeviceSpecialty(deviceType);
}

export function getTechnicianPhotoUrl(technician: any): string {
  return String(
    technician?.profile_photo || technician?.profile_photo_url || technician?.avatar_url || technician?.photo_url || technician?.photo || ''
  ).trim();
}

export function findTechnicianByIdentity(technicians: any[], identity: unknown): any | null {
  const wanted = normalizeIdentity(identity);
  if (!wanted) return null;
  return technicians.find((technician) => {
    return [technician?.id, technician?.username, technician?.code, technician?.name, technician?.techName]
      .filter(Boolean)
      .some((value) => normalizeIdentity(value) === wanted);
  }) || null;
}

export function parseTechnicianProfileNotification(row: any): TechnicianProfile | null {
  if (row?.action !== 'technician_profile_updated') return null;
  try {
    const details = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
    if (!details?.name) return null;
    return {
      id: details.id,
      code: details.code,
      username: details.username,
      name: details.name,
      photoUrl: details.photoUrl || '',
      updatedAt: details.updatedAt || row.created_at,
    };
  } catch {
    return null;
  }
}

export function profileNotificationPayload(profile: TechnicianProfile) {
  return JSON.stringify({
    profileVersion: 1,
    id: profile.id,
    code: profile.code,
    username: profile.username,
    name: profile.name,
    photoUrl: profile.photoUrl || '',
    updatedAt: profile.updatedAt || new Date().toISOString(),
  });
}
