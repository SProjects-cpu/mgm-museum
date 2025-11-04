/**
 * API Error Handling Utilities
 * Provides standardized error codes, types, and handling for booking system APIs
 */

/**
 * Booking-specific error codes
 */
export enum BookingErrorCode {
  // Validation errors (400)
  INVALID_DATE = 'INVALID_DATE',
  INVALID_TIME_SLOT = 'INVALID_TIME_SLOT',
  INVALID_EXHIBITION = 'INVALID_EXHIBITION',
  INVALID_SHOW = 'INVALID_SHOW',
  INVALID_SEATS = 'INVALID_SEATS',
  INVALID_TICKETS = 'INVALID_TICKETS',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Availability errors (409)
  DATE_UNAVAILABLE = 'DATE_UNAVAILABLE',
  SLOT_FULL = 'SLOT_FULL',
  SEATS_UNAVAILABLE = 'SEATS_UNAVAILABLE',
  INSUFFICIENT_CAPACITY = 'INSUFFICIENT_CAPACITY',
  
  // Lock errors (409/410)
  LOCK_EXPIRED = 'LOCK_EXPIRED',
  LOCK_FAILED = 'LOCK_FAILED',
  LOCK_NOT_FOUND = 'LOCK_NOT_FOUND',
  SEATS_ALREADY_LOCKED = 'SEATS_ALREADY_LOCKED',
  
  // Payment errors (402/500)
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  PAYMENT_VERIFICATION_FAILED = 'PAYMENT_VERIFICATION_FAILED',
  
  // Resource errors (404)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  BOOKING_NOT_FOUND = 'BOOKING_NOT_FOUND',
  
  // Server errors (500)
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Authentication errors (401/403)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
}

/**
 * HTTP status codes mapped to error types
 */
export const ERROR_STATUS_MAP: Record<BookingErrorCode, number> = {
  // 400 - Bad Request
  [BookingErrorCode.INVALID_DATE]: 400,
  [BookingErrorCode.INVALID_TIME_SLOT]: 400,
  [BookingErrorCode.INVALID_EXHIBITION]: 400,
  [BookingErrorCode.INVALID_SHOW]: 400,
  [BookingErrorCode.INVALID_SEATS]: 400,
  [BookingErrorCode.INVALID_TICKETS]: 400,
  [BookingErrorCode.MISSING_REQUIRED_FIELDS]: 400,
  [BookingErrorCode.VALIDATION_ERROR]: 400,
  
  // 401 - Unauthorized
  [BookingErrorCode.UNAUTHORIZED]: 401,
  
  // 402 - Payment Required
  [BookingErrorCode.PAYMENT_REQUIRED]: 402,
  
  // 403 - Forbidden
  [BookingErrorCode.FORBIDDEN]: 403,
  
  // 404 - Not Found
  [BookingErrorCode.RESOURCE_NOT_FOUND]: 404,
  [BookingErrorCode.BOOKING_NOT_FOUND]: 404,
  [BookingErrorCode.LOCK_NOT_FOUND]: 404,
  
  // 409 - Conflict
  [BookingErrorCode.DATE_UNAVAILABLE]: 409,
  [BookingErrorCode.SLOT_FULL]: 409,
  [BookingErrorCode.SEATS_UNAVAILABLE]: 409,
  [BookingErrorCode.INSUFFICIENT_CAPACITY]: 409,
  [BookingErrorCode.LOCK_FAILED]: 409,
  [BookingErrorCode.SEATS_ALREADY_LOCKED]: 409,
  
  // 410 - Gone
  [BookingErrorCode.LOCK_EXPIRED]: 410,
  
  // 500 - Internal Server Error
  [BookingErrorCode.DATABASE_ERROR]: 500,
  [BookingErrorCode.INTERNAL_ERROR]: 500,
  [BookingErrorCode.NETWORK_ERROR]: 500,
  [BookingErrorCode.PAYMENT_FAILED]: 500,
  [BookingErrorCode.PAYMENT_VERIFICATION_FAILED]: 500,
};

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES: Record<BookingErrorCode, string> = {
  [BookingErrorCode.INVALID_DATE]: 'Please select a valid date for your visit.',
  [BookingErrorCode.INVALID_TIME_SLOT]: 'Please select a valid time slot.',
  [BookingErrorCode.INVALID_EXHIBITION]: 'The selected exhibition is not available.',
  [BookingErrorCode.INVALID_SHOW]: 'The selected show is not available.',
  [BookingErrorCode.INVALID_SEATS]: 'Please select valid seats.',
  [BookingErrorCode.INVALID_TICKETS]: 'Please select valid ticket types and quantities.',
  [BookingErrorCode.MISSING_REQUIRED_FIELDS]: 'Please fill in all required fields.',
  [BookingErrorCode.VALIDATION_ERROR]: 'Please check your information and try again.',
  
  [BookingErrorCode.DATE_UNAVAILABLE]: 'This date is not available. Please choose another date.',
  [BookingErrorCode.SLOT_FULL]: 'This time slot is fully booked. Please select another time.',
  [BookingErrorCode.SEATS_UNAVAILABLE]: 'Some selected seats are no longer available. Please choose different seats.',
  [BookingErrorCode.INSUFFICIENT_CAPACITY]: 'Not enough seats available for your selection.',
  
  [BookingErrorCode.LOCK_EXPIRED]: 'Your seat reservation has expired. Please select seats again.',
  [BookingErrorCode.LOCK_FAILED]: 'Unable to reserve seats. Please try again.',
  [BookingErrorCode.LOCK_NOT_FOUND]: 'Seat reservation not found. Please start over.',
  [BookingErrorCode.SEATS_ALREADY_LOCKED]: 'Some seats are currently reserved by another user.',
  
  [BookingErrorCode.PAYMENT_FAILED]: 'Payment processing failed. Please try again or use a different payment method.',
  [BookingErrorCode.PAYMENT_REQUIRED]: 'Payment is required to complete this booking.',
  [BookingErrorCode.PAYMENT_VERIFICATION_FAILED]: 'Unable to verify payment. Please contact support.',
  
  [BookingErrorCode.RESOURCE_NOT_FOUND]: 'The requested resource was not found.',
  [BookingErrorCode.BOOKING_NOT_FOUND]: 'Booking not found.',
  
  [BookingErrorCode.DATABASE_ERROR]: 'A database error occurred. Please try again.',
  [BookingErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again.',
  [BookingErrorCode.NETWORK_ERROR]: 'Connection issue. Please check your internet and try again.',
  
  [BookingErrorCode.UNAUTHORIZED]: 'Please sign in to continue.',
  [BookingErrorCode.FORBIDDEN]: 'You do not have permission to perform this action.',
};

/**
 * Booking API Error class
 */
export class BookingError extends Error {
  code: BookingErrorCode;
  statusCode: number;
  details?: any;
  timestamp: string;

  constructor(
    code: BookingErrorCode,
    message?: string,
    details?: any
  ) {
    super(message || ERROR_MESSAGES[code]);
    this.name = 'BookingError';
    this.code = code;
    this.statusCode = ERROR_STATUS_MAP[code];
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON response format
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }
}

/**
 * Create a BookingError from various error types
 */
export function createBookingError(
  error: unknown,
  defaultCode: BookingErrorCode = BookingErrorCode.INTERNAL_ERROR
): BookingError {
  // Already a BookingError
  if (error instanceof BookingError) {
    return error;
  }

  // Standard Error
  if (error instanceof Error) {
    return new BookingError(defaultCode, error.message, {
      originalError: error.name,
      stack: error.stack,
    });
  }

  // Supabase error
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const supabaseError = error as any;
    return new BookingError(
      BookingErrorCode.DATABASE_ERROR,
      supabaseError.message || 'Database operation failed',
      {
        code: supabaseError.code,
        details: supabaseError.details,
        hint: supabaseError.hint,
      }
    );
  }

  // Unknown error
  return new BookingError(
    defaultCode,
    'An unexpected error occurred',
    { error: String(error) }
  );
}

/**
 * Log error to console with context
 */
export function logError(
  error: BookingError | Error,
  context?: Record<string, any>
) {
  const logData = {
    timestamp: new Date().toISOString(),
    error: error instanceof BookingError ? error.toJSON() : {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
  };

  console.error('[Booking API Error]', JSON.stringify(logData, null, 2));
}

/**
 * Check if error is a specific booking error code
 */
export function isBookingError(
  error: unknown,
  code?: BookingErrorCode
): error is BookingError {
  if (!(error instanceof BookingError)) {
    return false;
  }
  
  if (code) {
    return error.code === code;
  }
  
  return true;
}
