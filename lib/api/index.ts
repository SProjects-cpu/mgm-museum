/**
 * API Infrastructure and Utilities
 * Central export for all booking system API utilities
 */

// Error handling
export {
  BookingError,
  BookingErrorCode,
  ERROR_STATUS_MAP,
  ERROR_MESSAGES,
  createBookingError,
  logError,
  isBookingError,
} from './errors';

// Response formatting
export {
  successResponse,
  errorResponse,
  paginatedResponse,
  cachedResponse,
  noCacheResponse,
  validateRequestBody,
  parseQueryParams,
  createPaginationMeta,
  extractPaginationParams,
  withErrorHandling,
  addCorsHeaders,
  handleOptions,
} from './response';

export type {
  ApiResponse,
  PaginationMeta,
} from './response';

// Booking queries
export {
  getAvailableDates,
  getTimeSlots,
  getSlotPricing,
  getSeatAvailability,
  createSeatLock,
  verifySeatLock,
  releaseSeatLock,
  checkSlotCapacity,
  updateSlotAvailability,
} from './booking-queries';

export type {
  DateAvailability,
  TimeSlotAvailability,
  TicketPricing,
  SeatInfo,
  SeatLock,
} from './booking-queries';
