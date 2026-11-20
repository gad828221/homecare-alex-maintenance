type AdEventParams = Record<string, string | number | boolean | undefined>;

type TrackingWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
  gtag?: (...args: unknown[]) => void;
};

const GOOGLE_ADS_SEND_TO = 'AW-16803756129/VKiiCJbVvbwdEOHw08w-';
const PHONE_CLICK_SEND_TO = 'AW-16803756129/92liCN34vrwdEOHw08w-';
const WHATSAPP_CLICK_SEND_TO = 'AW-16803756129/_sCuCIu1vrwdEOHw08w-';

export function trackPhoneClick(): void {
  if (typeof window === 'undefined') return;
  const trackingWindow = window as TrackingWindow;
  const event = { event: 'phone_click', lead_type: 'phone_number_click', page_path: window.location.pathname };
  trackingWindow.dataLayer = trackingWindow.dataLayer || [];
  trackingWindow.dataLayer.push(event);
  if (typeof trackingWindow.gtag === 'function') {
    trackingWindow.gtag('event', 'conversion', {
      send_to: PHONE_CLICK_SEND_TO,
      transport_type: 'beacon',
    });
  }
}

export function trackWhatsAppClick(): void {
  if (typeof window === 'undefined') return;
  const trackingWindow = window as TrackingWindow;
  const event = { event: 'whatsapp_click', lead_type: 'whatsapp_contact', page_path: window.location.pathname };
  trackingWindow.dataLayer = trackingWindow.dataLayer || [];
  trackingWindow.dataLayer.push(event);
  if (typeof trackingWindow.gtag === 'function') {
    trackingWindow.gtag('event', 'whatsapp_click', event);
    trackingWindow.gtag('event', 'conversion', {
      send_to: WHATSAPP_CLICK_SEND_TO,
      transport_type: 'beacon',
    });
  }
}

export function trackBookingStart(params: AdEventParams = {}): void {
  if (typeof window === 'undefined') return;
  const trackingWindow = window as TrackingWindow;
  const event = { event: 'begin_booking', lead_type: 'maintenance_booking_start', page_path: window.location.pathname, ...params };
  trackingWindow.dataLayer = trackingWindow.dataLayer || [];
  trackingWindow.dataLayer.push(event);
  if (typeof trackingWindow.gtag === 'function') trackingWindow.gtag('event', 'begin_booking', event);
}

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
      transaction_id: typeof params.transaction_id === 'string' ? params.transaction_id : undefined,
    });
  }
}
