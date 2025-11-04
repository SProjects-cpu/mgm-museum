/**
 * Razorpay Module
 * Central export point for all Razorpay functionality
 */

// Configuration
export {
  getRazorpayConfig,
  validateRazorpayConfig,
  getConfigErrorMessage,
  isRazorpayConfigured,
  RAZORPAY_API_URL,
  DEFAULT_CURRENCY,
  RAZORPAY_OPTIONS,
  type RazorpayConfig,
  type RazorpayValidationResult,
} from './config';

// Utilities
export {
  verifyPaymentSignature,
  verifyWebhookSignature,
  formatAmountForRazorpay,
  formatAmountFromRazorpay,
  generateReceipt,
  generateBookingReference,
  isValidOrderId,
  isValidPaymentId,
  formatCurrency,
  parseRazorpayError,
} from './utils';

// Client
export {
  getRazorpayInstance,
  createRazorpayOrder,
  fetchPaymentDetails,
  createRefund,
  fetchOrderDetails,
} from './client';
