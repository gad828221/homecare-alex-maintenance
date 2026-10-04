type AdEventParams = Record<string, string | number | boolean | undefined>;

type TrackingWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
  gtag?: (...args: unknown[]) => void;
};

const GOOGLE_ADS_SEND_TO = 'AW-16803756129/UeUnCOvx05AdEOHw08w-';

// Estimated lead value in EGP, kept separate from invoices and the cash ledger.
const LEAD_VALUE_BY_DEVICE: Record<string, number> = {
  'تكييف': 300,
  'ثلاجة': 280,
  'غسالة': 240,
  'غسالة أطباق': 240,
  'سخان': 220,
  'بوتاجاز': 200,
  'ميكروويف': 150,
};

export function estimateLeadValue(deviceType?: string): number {
  return LEAD_VALUE_BY_DEVICE[deviceType?.trim() || ''] || 200;
}

export function trackBookingConversion(params: AdEventParams = {}): void {
  if (typeof window === 'undefined') return;
  const trackingWindow = window as TrackingWindow;
  const event = {
    event: 'generate_lead',
    lead_type: 'maintenance_booking',
    page_path: window.location.pathname,
    value_egp: typeof params.lead_value === 'number' ? params.lead_value : 200,
    ...params,
  };
  trackingWindow.dataLayer = trackingWindow.dataLayer || [];
  trackingWindow.dataLayer.push(event);
  if (typeof trackingWindow.gtag === 'function') {
    trackingWindow.gtag('event', 'generate_lead', event);
    trackingWindow.gtag('event', 'conversion', {
      send_to: GOOGLE_ADS_SEND_TO,
      value: typeof params.lead_value === 'number' ? params.lead_value : 200,
      currency: 'EGP',
      transaction_id: typeof params.transaction_id === 'string' ? params.transaction_id : undefined,
    });
  }
}
