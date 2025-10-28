// @ts-nocheck
import { getServiceSupabase } from '@/lib/supabase/client';

export interface AnalyticsEvent {
  eventType: string;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, any>;
}

/**
 * Track analytics event
 */
export async function trackEvent(event: AnalyticsEvent) {
  try {
    const supabase = getServiceSupabase();
    
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: event.eventType,
        user_id: event.userId || null,
        session_id: event.sessionId || null,
        properties: event.properties || {},
      });

    if (error) {
      console.error('Analytics tracking error:', error);
    }
  } catch (error) {
    // Fail silently - don't disrupt user experience
    console.error('Analytics error:', error);
  }
}

/**
 * Track page view
 */
export async function trackPageView(
  path: string,
  userId?: string,
  sessionId?: string
) {
  return trackEvent({
    eventType: 'page_view',
    userId,
    sessionId,
    properties: { path },
  });
}

/**
 * Track booking creation
 */
export async function trackBookingCreated(
  bookingId: string,
  totalAmount: number,
  userId?: string
) {
  return trackEvent({
    eventType: 'booking_created',
    userId,
    properties: {
      bookingId,
      totalAmount,
    },
  });
}

/**
 * Track payment completion
 */
export async function trackPaymentCompleted(
  bookingId: string,
  paymentId: string,
  amount: number
) {
  return trackEvent({
    eventType: 'payment_completed',
    properties: {
      bookingId,
      paymentId,
      amount,
    },
  });
}

/**
 * Track search query
 */
export async function trackSearch(
  query: string,
  results: number,
  userId?: string
) {
  return trackEvent({
    eventType: 'search',
    userId,
    properties: {
      query,
      results,
    },
  });
}

/**
 * Get analytics dashboard data
 */
export async function getAnalyticsDashboard(
  startDate: string,
  endDate: string
) {
  const supabase = getServiceSupabase();

  // Total events
  const { count: totalEvents } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Page views
  const { count: pageViews } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'page_view')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Unique sessions
  const { data: sessions } = await supabase
    .from('analytics_events')
    .select('session_id')
    .not('session_id', 'is', null)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const uniqueSessions = new Set(sessions?.map((s) => s.session_id)).size;

  // Popular pages
  const { data: popularPages } = await supabase
    .from('analytics_events')
    .select('properties')
    .eq('event_type', 'page_view')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const pageCounts: Record<string, number> = {};
  popularPages?.forEach((event: any) => {
    const path = event.properties?.path;
    if (path) {
      pageCounts[path] = (pageCounts[path] || 0) + 1;
    }
  });

  const topPages = Object.entries(pageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([path, count]) => ({ path, views: count }));

  return {
    totalEvents: totalEvents || 0,
    pageViews: pageViews || 0,
    uniqueSessions,
    topPages,
  };
}



