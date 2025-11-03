// Razorpay Configuration

// Environment variables
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

// Validate configuration
export function validateRazorpayConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!RAZORPAY_KEY_ID) missing.push('NEXT_PUBLIC_RAZORPAY_KEY_ID');
  if (!RAZORPAY_KEY_SECRET) missing.push('RAZORPAY_KEY_SECRET');
  if (!RAZORPAY_WEBHOOK_SECRET) missing.push('RAZORPAY_WEBHOOK_SECRET');

  return {
    valid: missing.length === 0,
    missing,
  };
}

// Razorpay API configuration
export const RAZORPAY_API_URL = 'https://api.razorpay.com/v1';

// Currency
export const DEFAULT_CURRENCY = 'INR';

// Payment options
export const RAZORPAY_OPTIONS = {
  currency: DEFAULT_CURRENCY,
  payment_capture: 1, // Auto capture
};
