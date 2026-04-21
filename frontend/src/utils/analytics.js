export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}

export function trackFormSubmit(formId, extra = {}) {
  trackEvent('form_submit', { form_id: formId, ...extra });
}

export function trackThankYouView(source) {
  trackEvent('thank_you_page_view', { source: source || 'unknown' });
}

export function trackOutboundClick(destination, label) {
  trackEvent('outbound_click', { destination, label });
}
