export type PickupType = 'full_device' | 'part_repair' | 'part_replacement';

export interface PickupReceiptData {
  type: PickupType;
  partName: string;
  deposit: number;
  notes: string;
  photos: string[];
  pickupDate: string;
  status: 'active' | 'returned' | 'cancelled';
}

const START_MARKER = '[PICKUP_RECEIPT]';
const END_MARKER = '[/PICKUP_RECEIPT]';

export const pickupTypeLabels: Record<PickupType, string> = {
  full_device: 'سحب الجهاز بالكامل',
  part_repair: 'سحب قطعة للإصلاح',
  part_replacement: 'سحب قطعة للاستبدال',
};

export function createPickupMarker(data: PickupReceiptData): string {
  return `${START_MARKER}${JSON.stringify(data)}${END_MARKER}`;
}

export function parsePickupReceipt(order: any): PickupReceiptData | null {
  const rawNotes = String(order?.technician_notes || order?.technician_note || '');
  let markerData: Partial<PickupReceiptData> = {};
  const markerMatch = rawNotes.match(/\[PICKUP_RECEIPT\]([\s\S]*?)\[\/PICKUP_RECEIPT\]/);

  if (markerMatch?.[1]) {
    try {
      markerData = JSON.parse(markerMatch[1]);
    } catch {
      markerData = {};
    }
  }

  const rawPhotos = order?.pickup_photos ?? markerData.photos ?? [];
  let photos: string[] = [];
  if (Array.isArray(rawPhotos)) photos = rawPhotos.filter(Boolean);
  else if (typeof rawPhotos === 'string') {
    try {
      const parsed = JSON.parse(rawPhotos);
      photos = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      photos = rawPhotos ? [rawPhotos] : [];
    }
  }

  const type = (order?.pickup_type || markerData.type) as PickupType | undefined;
  if (!type && photos.length === 0 && !order?.pickup_date && !markerMatch) return null;

  return {
    type: type && type in pickupTypeLabels ? type : 'full_device',
    partName: String(order?.pickup_part_name ?? markerData.partName ?? ''),
    deposit: Number(order?.deposit_amount ?? markerData.deposit ?? 0) || 0,
    notes: String(order?.pickup_notes ?? markerData.notes ?? ''),
    photos,
    pickupDate: String(order?.pickup_date ?? markerData.pickupDate ?? order?.created_at ?? ''),
    status: (order?.pickup_status || markerData.status || 'active') as PickupReceiptData['status'],
  };
}

export function stripPickupMarker(notes: string): string {
  return notes.replace(/\n?\[PICKUP_RECEIPT\][\s\S]*?\[\/PICKUP_RECEIPT\]/g, '').trim();
}

export function getPickupTypeLabel(type?: string): string {
  return pickupTypeLabels[(type as PickupType) || 'full_device'] || pickupTypeLabels.full_device;
}

export { START_MARKER, END_MARKER };
