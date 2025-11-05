# Ticket Download Analytics System

## Overview

The ticket download analytics system tracks PDF ticket generation events, performance metrics, and error rates to provide insights into system health and user experience.

## Features

### 1. Event Tracking

- **Successful Downloads**: Tracks every successful PDF ticket generation
- **Failed Downloads**: Tracks failures with error types and messages
- **Generation Time**: Monitors PDF generation performance
- **Client-Side Events**: Tracks download initiation and completion from user's browser

### 2. Performance Monitoring

- **Average Generation Time**: Calculates average time to generate PDFs
- **Slow Generation Alerts**: Warns when generation exceeds 3 seconds
- **Performance Trends**: Tracks generation time over last 1000 events

### 3. Error Analytics

- **Error Rate Calculation**: Percentage of failed downloads
- **Error Categorization**: Groups errors by type (AUTH_ERROR, NOT_FOUND, etc.)
- **High Error Rate Alerts**: Warns when error rate exceeds 5%

### 4. Metrics Dashboard

- **Real-time Metrics**: View current analytics via API endpoint
- **Periodic Logging**: Automatic metrics logging every 5 minutes
- **Historical Data**: Stores last 1000 events in memory

## Usage

### Server-Side Tracking (API Route)

The analytics are automatically tracked in the PDF generation API route:

```typescript
import {
  trackDownloadSuccess,
  trackDownloadFailure,
  trackGenerationTime,
} from '@/lib/analytics/ticket-analytics';

// Track successful download
trackDownloadSuccess({
  bookingId,
  userId,
  bookingReference,
  generationTimeMs,
  hasLogo: true,
  userAgent: request.headers.get('user-agent'),
  ipAddress: userIdentifier,
});

// Track failed download
trackDownloadFailure({
  bookingId,
  userId,
  bookingReference,
  generationTimeMs,
  errorType: 'PDF_RENDER_ERROR',
  errorMessage: 'Failed to render PDF',
  userAgent: request.headers.get('user-agent'),
  ipAddress: userIdentifier,
});

// Track generation time
trackGenerationTime(bookingId, generationTimeMs);
```

### Client-Side Tracking (Confirmation Page)

Client-side events are tracked using console logs with structured format:

```typescript
// Track download start
console.log('[ANALYTICS] Client Download Started:', {
  event: 'client_download_start',
  bookingId,
  bookingReference,
  timestamp: new Date().toISOString(),
});

// Track download complete
console.log('[ANALYTICS] Client Download Complete:', {
  event: 'client_download_complete',
  bookingId,
  bookingReference,
  downloadTimeMs,
  timestamp: new Date().toISOString(),
});

// Track download error
console.error('[ANALYTICS] Client Download Error:', {
  event: 'client_download_error',
  bookingId,
  bookingReference,
  errorMessage,
  statusCode,
  timestamp: new Date().toISOString(),
});
```

### Viewing Metrics

#### Via API Endpoint

```bash
# Get current metrics (requires authentication)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-domain.com/api/analytics/ticket-metrics
```

Response:
```json
{
  "success": true,
  "data": {
    "totalDownloads": 150,
    "successfulDownloads": 145,
    "failedDownloads": 5,
    "averageGenerationTime": 1250,
    "errorRate": 3.33,
    "errorsByType": {
      "AUTH_ERROR": 2,
      "NOT_FOUND": 1,
      "PDF_RENDER_ERROR": 2
    },
    "timestamp": "2025-11-05T10:30:00.000Z"
  }
}
```

#### Via Console Logs

Metrics are automatically logged to console every 5 minutes in production:

```
[ANALYTICS] Current Metrics: {
  event: 'analytics_metrics',
  totalDownloads: 150,
  successfulDownloads: 145,
  failedDownloads: 5,
  averageGenerationTime: 1250,
  errorRate: 3.33,
  errorsByType: { AUTH_ERROR: 2, NOT_FOUND: 1, PDF_RENDER_ERROR: 2 },
  timestamp: '2025-11-05T10:30:00.000Z'
}
```

### Programmatic Access

```typescript
import { getAnalyticsMetrics, logAnalyticsMetrics } from '@/lib/analytics/ticket-analytics';

// Get current metrics
const metrics = getAnalyticsMetrics();
console.log('Total downloads:', metrics.totalDownloads);
console.log('Error rate:', metrics.errorRate, '%');

// Log metrics to console
logAnalyticsMetrics();
```

## Error Types

The system categorizes errors into the following types:

- **AUTH_ERROR**: Authentication or authorization failures
- **NOT_FOUND**: Booking not found in database
- **FORBIDDEN**: User doesn't own the booking
- **VALIDATION_ERROR**: Invalid booking ID format
- **PAYMENT_DATA_ERROR**: Missing payment information
- **TICKET_DATA_ERROR**: Missing ticket data
- **QR_GENERATION_ERROR**: QR code generation failed
- **PDF_RENDER_ERROR**: PDF rendering failed
- **RATE_LIMIT_ERROR**: Too many requests
- **UNKNOWN_ERROR**: Unclassified errors

## Alerts and Monitoring

### Automatic Alerts

The system automatically logs warnings for:

1. **High Error Rate** (> 5%)
   ```
   [ANALYTICS] High Error Rate Detected: {
     errorRate: 7.5,
     threshold: 5,
     failedDownloads: 15,
     totalDownloads: 200
   }
   ```

2. **Slow Generation Time** (> 2 seconds average)
   ```
   [ANALYTICS] Slow Average Generation Time: {
     averageGenerationTime: 2500,
     threshold: 2000,
     successfulDownloads: 100
   }
   ```

3. **Individual Slow Generation** (> 3 seconds)
   ```
   [ANALYTICS] Slow PDF Generation Detected: {
     bookingId: 'xxx',
     generationTimeMs: 3500,
     threshold: 3000,
     exceedBy: 500
   }
   ```

### Integration with Monitoring Tools

The structured log format makes it easy to integrate with monitoring tools:

- **Datadog**: Parse `[ANALYTICS]` logs for metrics
- **New Relic**: Track custom events from log data
- **CloudWatch**: Set up log filters for alerts
- **Sentry**: Capture error events with context

## Data Retention

- **In-Memory Storage**: Last 1000 events
- **Automatic Cleanup**: Older events are removed automatically
- **No Database Storage**: Analytics data is not persisted to database

## Performance Impact

- **Minimal Overhead**: < 1ms per tracked event
- **Non-Blocking**: Analytics tracking doesn't affect response time
- **Memory Efficient**: Fixed-size event store (1000 events)

## Configuration

### Metrics Logging Interval

Edit `lib/analytics/metrics-logger.ts`:

```typescript
// Production: Log every 5 minutes
startMetricsLogger(5 * 60 * 1000);

// Development: Log every 10 minutes
startMetricsLogger(10 * 60 * 1000);
```

### Event Store Size

Edit `lib/analytics/ticket-analytics.ts`:

```typescript
const MAX_EVENTS = 1000; // Change to desired size
```

### Alert Thresholds

Edit `lib/analytics/ticket-analytics.ts`:

```typescript
// High error rate threshold
if (metrics.errorRate > 5) { // Change threshold
  console.warn('High Error Rate Detected');
}

// Slow generation threshold
if (metrics.averageGenerationTime > 2000) { // Change threshold
  console.warn('Slow Average Generation Time');
}
```

## Best Practices

1. **Monitor Regularly**: Check metrics dashboard daily
2. **Investigate Spikes**: Look into sudden increases in error rates
3. **Optimize Performance**: Address slow generation times
4. **Track Trends**: Compare metrics over time
5. **Set Up Alerts**: Configure monitoring tools for automatic alerts

## Future Enhancements

- **Database Persistence**: Store analytics in database for long-term analysis
- **Dashboard UI**: Build admin dashboard for visualizing metrics
- **User Segmentation**: Track metrics by user type or region
- **A/B Testing**: Compare different PDF generation approaches
- **Export Functionality**: Export metrics to CSV or JSON
