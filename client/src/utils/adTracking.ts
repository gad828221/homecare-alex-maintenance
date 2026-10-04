type AdEventParams = Record<string, string | number | boolean | undefined>;

type TrackingWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
  gtag?: (...args: unknown[]) => void;
};

const GOOGLE_ADS_SEND_TO = 'AW-16803756129/UeUnCOvx05AdEOHw08w-';

export function trackBookingConversion(params: AdEventParams = {}): void {
  if (typeof window === 'undefined') return;
  const trackingWindow = window as TrackingWindow;
  const event = {
    event: 'generate_lead',
    lead_type: 'maintenance_booking',
    page_path: window.location.pathname,
    ...params,
  };
  trackingWindow.dataLayer = trackingWindow.dataLayer || [];
  trackingWindow.dataLayer.push(event);
  if (typeof trackingWindow.gtag === 'function') {
    trackingWindow.gtag('event', 'generate_lead', event);
    trackingWindow.gtag('event', 'conversion', {
      send_to: GOOGLE_ADS_SEND_TO,
      value: 1.0,
      currency: 'EGP',
      transaction_id: typeof params.transaction_id === 'string' ? params.transaction_id : undefined,
    });
  }
}
