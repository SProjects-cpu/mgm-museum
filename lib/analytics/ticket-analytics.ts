/**
 * Ticket Download Analytics Tracking
 * Tracks PDF generation events, performance metrics, and error rates
 */

export interface TicketDownloadEvent {
  bookingId: string;
  userId: string;
  bookingReference: string;
  timestamp: string;
  generationTimeMs: number;
  success: boolean;
  errorType?: string;
  errorMessage?: string;
  hasLogo?: boolean;
  userAgent?: string;
  ipAddress?: string;
}

export interface TicketAnalyticsMetrics {
  totalDownloads: number;
  successfulDownloads: number;
  failedDownloads: number;
  averageGenerationTime: number;
  errorRate: number;
  errorsByType: Record<string, number>;
}

/**
 * Track successful PDF download
 */
export function trackDownloadSuccess(event: {
  bookingId: string;
  userId: string;
  bookingReference: string;
  generationTimeMs: number;
  hasLogo?: boolean;
  userAgent?: string;
  ipAddress?: string;
}): void {
  const analyticsEvent: TicketDownloadEvent = {
    ...event,
    timestamp: new Date().toISOString(),
    success: true,
  };

  // Log to console with structured format
  console.log('[ANALYTICS] Ticket Download Success:', {
    event: 'ticket_download_success',
    ...analyticsEvent,
  });

  // Store in memory for metrics calculation
  storeEvent(analyticsEvent);
}

/**
 * Track failed PDF download
 */
export function trackDownloadFailure(event: {
  bookingId: string;
  userId: string;
  bookingReference: string;
  generationTimeMs: number;
  errorType: string;
  errorMessage: string;
  userAgent?: string;
  ipAddress?: string;
}): void {
  const analyticsEvent: TicketDownloadEvent = {
    ...event,
    timestamp: new Date().toISOString(),
    success: false,
  };

  // Log to console with structured format
  console.error('[ANALYTICS] Ticket Download Failure:', {
    event: 'ticket_download_failure',
    ...analyticsEvent,
  });

  // Store in memory for metrics calculation
  storeEvent(analyticsEvent);
}

/**
 * Track PDF generation time for performance monitoring
 */
export function trackGenerationTime(
  bookingId: string,
  generationTimeMs: number
): void {
  console.log('[ANALYTICS] PDF Generation Time:', {
    event: 'pdf_generation_time',
    bookingId,
    generationTimeMs,
    timestamp: new Date().toISOString(),
  });

  // Alert if generation time exceeds threshold (3 seconds)
  if (generationTimeMs > 3000) {
    console.warn('[ANALYTICS] Slow PDF Generation Detected:', {
      bookingId,
      generationTimeMs,
      threshold: 3000,
      exceedBy: generationTimeMs - 3000,
    });
  }
}

/**
 * Track client-side download initiation
 */
export function trackClientDownloadStart(
  bookingId: string,
  bookingReference: string
): void {
  console.log('[ANALYTICS] Client Download Started:', {
    event: 'client_download_start',
    bookingId,
    bookingReference,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
  });
}

/**
 * Track client-side download completion
 */
export function trackClientDownloadComplete(
  bookingId: string,
  bookingReference: string,
  downloadTimeMs: number
): void {
  console.log('[ANALYTICS] Client Download Complete:', {
    event: 'client_download_complete',
    bookingId,
    bookingReference,
    downloadTimeMs,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track client-side download error
 */
export function trackClientDownloadError(
  bookingId: string,
  bookingReference: string,
  errorMessage: string,
  statusCode?: number
): void {
  console.error('[ANALYTICS] Client Download Error:', {
    event: 'client_download_error',
    bookingId,
    bookingReference,
    errorMessage,
    statusCode,
    timestamp: new Date().toISOString(),
  });
}

// In-memory storage for metrics calculation (last 1000 events)
const eventStore: TicketDownloadEvent[] = [];
const MAX_EVENTS = 1000;

/**
 * Store event in memory for metrics calculation
 */
function storeEvent(event: TicketDownloadEvent): void {
  eventStore.push(event);
  
  // Keep only last MAX_EVENTS
  if (eventStore.length > MAX_EVENTS) {
    eventStore.shift();
  }
}

/**
 * Calculate analytics metrics from stored events
 */
export function getAnalyticsMetrics(): TicketAnalyticsMetrics {
  const totalDownloads = eventStore.length;
  const successfulDownloads = eventStore.filter(e => e.success).length;
  const failedDownloads = eventStore.filter(e => !e.success).length;
  
  const generationTimes = eventStore
    .filter(e => e.success)
    .map(e => e.generationTimeMs);
  
  const averageGenerationTime = generationTimes.length > 0
    ? generationTimes.reduce((sum, time) => sum + time, 0) / generationTimes.length
    : 0;
  
  const errorRate = totalDownloads > 0
    ? (failedDownloads / totalDownloads) * 100
    : 0;
  
  const errorsByType = eventStore
    .filter(e => !e.success && e.errorType)
    .reduce((acc, event) => {
      const type = event.errorType!;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  return {
    totalDownloads,
    successfulDownloads,
    failedDownloads,
    averageGenerationTime: Math.round(averageGenerationTime),
    errorRate: Math.round(errorRate * 100) / 100,
    errorsByType,
  };
}

/**
 * Log current analytics metrics
 */
export function logAnalyticsMetrics(): void {
  const metrics = getAnalyticsMetrics();
  
  console.log('[ANALYTICS] Current Metrics:', {
    event: 'analytics_metrics',
    ...metrics,
    timestamp: new Date().toISOString(),
  });

  // Alert if error rate is high (> 5%)
  if (metrics.errorRate > 5) {
    console.warn('[ANALYTICS] High Error Rate Detected:', {
      errorRate: metrics.errorRate,
      threshold: 5,
      failedDownloads: metrics.failedDownloads,
      totalDownloads: metrics.totalDownloads,
    });
  }

  // Alert if average generation time is slow (> 2 seconds)
  if (metrics.averageGenerationTime > 2000) {
    console.warn('[ANALYTICS] Slow Average Generation Time:', {
      averageGenerationTime: metrics.averageGenerationTime,
      threshold: 2000,
      successfulDownloads: metrics.successfulDownloads,
    });
  }
}

/**
 * Clear stored events (useful for testing)
 */
export function clearAnalyticsEvents(): void {
  eventStore.length = 0;
  console.log('[ANALYTICS] Event store cleared');
}

/**
 * Get error type from error object
 */
export function getErrorType(error: unknown): string {
  if (error instanceof Error) {
    // Categorize common error types
    if (error.message.includes('not found')) return 'NOT_FOUND';
    if (error.message.includes('authentication') || error.message.includes('unauthorized')) return 'AUTH_ERROR';
    if (error.message.includes('forbidden') || error.message.includes('access denied')) return 'FORBIDDEN';
    if (error.message.includes('QR code')) return 'QR_GENERATION_ERROR';
    if (error.message.includes('PDF') || error.message.includes('render')) return 'PDF_RENDER_ERROR';
    if (error.message.includes('payment')) return 'PAYMENT_DATA_ERROR';
    if (error.message.includes('rate limit')) return 'RATE_LIMIT_ERROR';
    return 'UNKNOWN_ERROR';
  }
  return 'UNKNOWN_ERROR';
}
