/**
 * Periodic Analytics Metrics Logger
 * Logs analytics metrics at regular intervals for monitoring
 */

import { logAnalyticsMetrics } from './ticket-analytics';

// Store interval ID for cleanup
let metricsLoggerInterval: NodeJS.Timeout | null = null;

/**
 * Start periodic metrics logging
 * @param intervalMs - Interval in milliseconds (default: 5 minutes)
 */
export function startMetricsLogger(intervalMs: number = 5 * 60 * 1000): void {
  // Don't start if already running
  if (metricsLoggerInterval) {
    console.log('[ANALYTICS] Metrics logger already running');
    return;
  }

  console.log('[ANALYTICS] Starting metrics logger with interval:', intervalMs, 'ms');

  // Log immediately on start
  logAnalyticsMetrics();

  // Set up periodic logging
  metricsLoggerInterval = setInterval(() => {
    logAnalyticsMetrics();
  }, intervalMs);
}

/**
 * Stop periodic metrics logging
 */
export function stopMetricsLogger(): void {
  if (metricsLoggerInterval) {
    clearInterval(metricsLoggerInterval);
    metricsLoggerInterval = null;
    console.log('[ANALYTICS] Metrics logger stopped');
  }
}

/**
 * Check if metrics logger is running
 */
export function isMetricsLoggerRunning(): boolean {
  return metricsLoggerInterval !== null;
}

// Auto-start in production environment
if (process.env.NODE_ENV === 'production') {
  // Start logging every 5 minutes in production
  startMetricsLogger(5 * 60 * 1000);
}

// Auto-start in development with longer interval
if (process.env.NODE_ENV === 'development') {
  // Start logging every 10 minutes in development
  startMetricsLogger(10 * 60 * 1000);
}
