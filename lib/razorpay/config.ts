/**
 * Razorpay Configuration Module
 * Manages Razorpay credentials and configuration settings
 */

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  currency: string;
  environment: 'test' | 'production';
}

export interface RazorpayValidationResult {
  valid: boolean;
  missing: string[];
  errors: string[];
}

// Environment variables
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

// Razorpay API configuration
export const RAZORPAY_API_URL = 'https://api.razorpay.com/v1';

// Currency
export const DEFAULT_CURRENCY = 'INR';

// Payment options
export const RAZORPAY_OPTIONS = {
  currency: DEFAULT_CURRENCY,
  payment_capture: 1, // Auto capture
};

/**
 * Get Razorpay configuration
 * @returns RazorpayConfig object
 */
export function getRazorpayConfig(): RazorpayConfig {
  const environment = RAZORPAY_KEY_ID.startsWith('rzp_test_') ? 'test' : 'production';
  
  return {
    keyId: RAZORPAY_KEY_ID,
    keySecret: RAZORPAY_KEY_SECRET,
    webhookSecret: RAZORPAY_WEBHOOK_SECRET,
    currency: DEFAULT_CURRENCY,
    environment,
  };
}

/**
 * Validate Razorpay configuration
 * Checks if all required environment variables are present and valid
 * @returns RazorpayValidationResult with validation status and details
 */
export function validateRazorpayConfig(): RazorpayValidationResult {
  const missing: string[] = [];
  const errors: string[] = [];

  // Check for missing credentials
  if (!RAZORPAY_KEY_ID) {
    missing.push('NEXT_PUBLIC_RAZORPAY_KEY_ID');
  }
  if (!RAZORPAY_KEY_SECRET) {
    missing.push('RAZORPAY_KEY_SECRET');
  }
  if (!RAZORPAY_WEBHOOK_SECRET) {
    missing.push('RAZORPAY_WEBHOOK_SECRET');
  }

  // Validate key format
  if (RAZORPAY_KEY_ID && !RAZORPAY_KEY_ID.startsWith('rzp_')) {
    errors.push('NEXT_PUBLIC_RAZORPAY_KEY_ID must start with "rzp_"');
  }

  // Check environment consistency
  if (RAZORPAY_KEY_ID) {
    const isTestKey = RAZORPAY_KEY_ID.startsWith('rzp_test_');
    const isLiveKey = RAZORPAY_KEY_ID.startsWith('rzp_live_');
    
    if (!isTestKey && !isLiveKey) {
      errors.push('NEXT_PUBLIC_RAZORPAY_KEY_ID must be either test (rzp_test_) or live (rzp_live_) key');
    }
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  };
}

/**
 * Get validation error message
 * @returns Formatted error message for missing/invalid configuration
 */
export function getConfigErrorMessage(): string {
  const validation = validateRazorpayConfig();
  
  if (validation.valid) {
    return '';
  }

  const messages: string[] = [];

  if (validation.missing.length > 0) {
    messages.push(`Missing environment variables: ${validation.missing.join(', ')}`);
  }

  if (validation.errors.length > 0) {
    messages.push(`Configuration errors: ${validation.errors.join(', ')}`);
  }

  return messages.join('\n');
}

/**
 * Check if Razorpay is configured
 * @returns boolean indicating if configuration is valid
 */
export function isRazorpayConfigured(): boolean {
  return validateRazorpayConfig().valid;
}
