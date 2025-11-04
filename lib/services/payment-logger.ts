/**
 * Payment Logging Service
 * Structured logging for payment operations
 */

export interface PaymentLogContext {
  orderId?: string;
  paymentId?: string;
  userId?: string;
  amount?: number;
  status?: string;
  errorCode?: string;
  errorMessage?: string;
  [key: string]: any;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Log payment event with structured context
 * @param level - Log level
 * @param message - Log message
 * @param context - Additional context
 */
export function logPaymentEvent(
  level: LogLevel,
  message: string,
  context?: PaymentLogContext
): void {
  const timestamp = new Date().toISOString();
  const sanitizedContext = sanitizeContext(context);

  const logEntry = {
    timestamp,
    level,
    message,
    ...sanitizedContext,
  };

  // Log to console (in production, this would go to a logging service)
  switch (level) {
    case 'error':
      console.error('[PAYMENT ERROR]', JSON.stringify(logEntry, null, 2));
      break;
    case 'warn':
      console.warn('[PAYMENT WARN]', JSON.stringify(logEntry, null, 2));
      break;
    case 'debug':
      console.debug('[PAYMENT DEBUG]', JSON.stringify(logEntry, null, 2));
      break;
    default:
      console.log('[PAYMENT INFO]', JSON.stringify(logEntry, null, 2));
  }
}

/**
 * Log payment order creation
 * @param orderId - Razorpay order ID
 * @param userId - User ID
 * @param amount - Order amount
 */
export function logOrderCreation(orderId: string, userId: string, amount: number): void {
  logPaymentEvent('info', 'Payment order created', {
    orderId,
    userId,
    amount,
    event: 'order_created',
  });
}

/**
 * Log payment verification attempt
 * @param orderId - Razorpay order ID
 * @param paymentId - Razorpay payment ID
 * @param success - Whether verification succeeded
 */
export function logPaymentVerification(
  orderId: string,
  paymentId: string,
  success: boolean
): void {
  logPaymentEvent(
    success ? 'info' : 'error',
    success ? 'Payment verified successfully' : 'Payment verification failed',
    {
      orderId,
      paymentId,
      success,
      event: 'payment_verification',
    }
  );
}

/**
 * Log payment failure
 * @param orderId - Razorpay order ID
 * @param errorCode - Error code
 * @param errorMessage - Error message
 * @param context - Additional context
 */
export function logPaymentFailure(
  orderId: string,
  errorCode: string,
  errorMessage: string,
  context?: PaymentLogContext
): void {
  logPaymentEvent('error', 'Payment failed', {
    orderId,
    errorCode,
    errorMessage,
    event: 'payment_failed',
    ...context,
  });
}

/**
 * Log webhook event
 * @param eventType - Webhook event type
 * @param orderId - Razorpay order ID
 * @param success - Whether processing succeeded
 */
export function logWebhookEvent(
  eventType: string,
  orderId: string,
  success: boolean
): void {
  logPaymentEvent(
    success ? 'info' : 'error',
    `Webhook ${eventType} ${success ? 'processed' : 'failed'}`,
    {
      orderId,
      eventType,
      success,
      event: 'webhook_received',
    }
  );
}

/**
 * Log booking creation
 * @param bookingReference - Booking reference
 * @param orderId - Razorpay order ID
 * @param userId - User ID
 */
export function logBookingCreation(
  bookingReference: string,
  orderId: string,
  userId: string
): void {
  logPaymentEvent('info', 'Booking created', {
    bookingReference,
    orderId,
    userId,
    event: 'booking_created',
  });
}

/**
 * Log security event
 * @param message - Security event message
 * @param context - Event context
 */
export function logSecurityEvent(message: string, context?: PaymentLogContext): void {
  logPaymentEvent('error', `SECURITY: ${message}`, {
    ...context,
    event: 'security_event',
    severity: 'high',
  });
}

/**
 * Sanitize context to remove sensitive data
 * @param context - Context to sanitize
 * @returns Sanitized context
 */
function sanitizeContext(context?: PaymentLogContext): PaymentLogContext {
  if (!context) return {};

  const sanitized = { ...context };

  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'secret',
    'key',
    'token',
    'signature',
    'card',
    'cvv',
    'pin',
  ];

  Object.keys(sanitized).forEach((key) => {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some((field) => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Create alert for critical payment errors
 * @param message - Alert message
 * @param context - Alert context
 */
export function alertCriticalError(message: string, context?: PaymentLogContext): void {
  logPaymentEvent('error', `CRITICAL: ${message}`, {
    ...context,
    alert: true,
    severity: 'critical',
  });

  // In production, this would trigger alerts via email, Slack, etc.
  // For now, just log prominently
  console.error('🚨 CRITICAL PAYMENT ERROR 🚨');
  console.error(message);
  console.error(context);
}
