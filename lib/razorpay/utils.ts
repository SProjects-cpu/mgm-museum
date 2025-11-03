import crypto from 'crypto';
import { RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } from './config';

/**
 * Verify Razorpay payment signature
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
    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return generated_signature === signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

/**
 * Verify Razorpay webhook signature
 * @param body - Webhook request body
 * @param signature - Signature from webhook header
 * @returns boolean indicating if signature is valid
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  try {
    const generated_signature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    return generated_signature === signature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Format amount for Razorpay (convert to paise)
 * @param amount - Amount in rupees
 * @returns Amount in paise
 */
export function formatAmountForRazorpay(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Format amount from Razorpay (convert from paise)
 * @param amount - Amount in paise
 * @returns Amount in rupees
 */
export function formatAmountFromRazorpay(amount: number): number {
  return amount / 100;
}

/**
 * Generate Razorpay order receipt
 * @param prefix - Receipt prefix
 * @returns Receipt string
 */
export function generateReceipt(prefix: string = 'order'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}
