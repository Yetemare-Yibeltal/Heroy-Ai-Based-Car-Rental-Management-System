import { hasAnalyticsConsent } from '@/components/legal/CookieConsent';
import { apiClient } from './api-client';

export type AnalyticsEventName =
  | 'vehicle_viewed'
  | 'fleet_searched'
  | 'booking_started'
  | 'booking_completed'
  | 'ai_chat_opened'
  | 'wishlist_added';

/**
 * Sends an analytics event to the backend, but only if the customer
 * has actually consented to analytics cookies. This check happens
 * on every single call, not just once at page load, since consent
 * can change at any time via the CookieConsent banner.
 */
export async function trackEvent(
  eventName: AnalyticsEventName,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!hasAnalyticsConsent()) {
    return;
  }

  try {
    await apiClient.post('/growth/analytics/track', { eventName, metadata });
  } catch {
    // Analytics failures should never surface to the user or break
    // the page - silently ignore.
  }
}

/**
 * Tracks a page view. Call this from a top-level layout or page
 * effect. Respects consent the same way trackEvent does.
 */
export function trackPageView(path: string): void {
  void trackEvent('fleet_searched', { path, type: 'page_view' });
}
