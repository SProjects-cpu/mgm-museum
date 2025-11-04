/**
 * Razorpay Utilities Module
 * Helper functions for Razorpay operations including signature verification,
 * amount conversion, and receipt generation
 */

import crypto from 'crypto';
import { getRazorpayConfig } from './config';

/**
 * Verify Razorpay payment signature using HMAC SHA256
 * @param orderId - Razorpay order ID
 * @param paymentId - Razorpay payment ID
 * @param signature - Signature to verify
 * @returns boolean indicating if signature is valid
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    if (!orderId || !paymentId || !signature) {
      console.error('Missing required parameters for signature verification');
      return false;
    }

    const config = getRazorpayConfig();
    if (!config.keySecret) {
      console.error('Razorpay key secret not configured');
      return false;
    }

    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', config.keySecret)
      .update(text)
      .digest('hex');

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(generatedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

/**
 * Verify Razorpay webhook signature using HMAC SHA256
 * @param body - Webhook request body as string
 * @param signature - Signature from webhook header
 * @returns boolean indicating if signature is valid
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  try {
    if (!body || !signature) {
      console.error('Missing required parameters for webhook signature verification');
      return false;
    }

    const config = getRazorpayConfig();
    if (!config.webhookSecret) {
      console.error('Razorpay webhook secret not configured');
      return false;
    }

    const generatedSignature = crypto
      .createHmac('sha256', config.webhookSecret)
      .update(body)
      .digest('hex');

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(generatedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Format amount for Razorpay (convert rupees to paise)
 * Razorpay expects amounts in the smallest currency unit (paise for INR)
 * @param amount - Amount in rupees
 * @returns Amount in paise (rounded to nearest integer)
 */
export function formatAmountForRazorpay(amount: number): number {
  if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
    throw new Error('Invalid amount: must be a positive number');
  }
  return Math.round(amount * 100);
}

/**
 * Format amount from Razorpay (convert paise to rupees)
 * @param amountInPaise - Amount in paise
 * @returns Amount in rupees
 */
export function formatAmountFromRazorpay(amountInPaise: number): number {
  if (typeof amountInPaise !== 'number' || isNaN(amountInPaise) || amountInPaise < 0) {
    throw new Error('Invalid amount: must be a positive number');
  }
  return amountInPaise / 100;
}

/**
 * Generate unique Razorpay order receipt
 * Format: {prefix}_{timestamp}_{random}
 * @param prefix - Receipt prefix (default: 'order')
 * @returns Unique receipt string
 */
export function generateReceipt(prefix: string = 'order'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Generate booking reference
 * Format: BK{timestamp}{random}
 * @returns Unique booking reference string
 */
export function generateBookingReference(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK${timestamp}${random}`;
}

/**
 * Validate Razorpay order ID format
 * @param orderId - Order ID to validate
 * @returns boolean indicating if format is valid
 */
export function isValidOrderId(orderId: string): boolean {
  return /^order_[A-Za-z0-9]+$/.test(orderId);
}

/**
 * Validate Razorpay payment ID format
 * @param paymentId - Payment ID to validate
 * @returns boolean indicating if format is valid
 */
export function isValidPaymentId(paymentId: string): boolean {
  return /^pay_[A-Za-z0-9]+$/.test(paymentId);
}

/**
 * Sanitize amount for display
 * @param amount - Amount to format
 * @param currency - Currency code (default: INR)
 * @returns Formatted amount string
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parse Razorpay error response
 * @param error - Error object from Razorpay
 * @returns User-friendly error message
 */
export function parseRazorpayError(error: any): string {
  if (error?.error?.description) {
    return error.error.description;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An error occurred while processing payment';
}
