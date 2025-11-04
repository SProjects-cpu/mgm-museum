/**
 * Razorpay Client Module
 * Provides Razorpay instance creation and API operations
 * Supports both database-stored and environment variable credentials
 */

import Razorpay from 'razorpay';
import { getServiceSupabase } from '@/lib/supabase/config';
import { getRazorpayConfig } from './config';

interface RazorpayCredentials {
  key_id: string;
  key_secret: string;
  webhook_secret: string;
}

/**
 * Get Razorpay credentials from database or environment variables
 * Priority: Database > Environment Variables
 * @param environment - 'test' or 'production'
 * @returns Razorpay credentials
 */
async function getRazorpayCredentials(environment: string = 'test'): Promise<RazorpayCredentials> {
  try {
    const supabase = getServiceSupabase();
    const encryptionKey = process.env.DATABASE_ENCRYPTION_KEY;

    if (!encryptionKey) {
      // Fallback to environment variables
      const config = getRazorpayConfig();
      return {
        key_id: config.keyId,
        key_secret: config.keySecret,
        webhook_secret: config.webhookSecret,
      };
    }

    // Try to fetch from database
    const { data, error } = await supabase.rpc('get_active_razorpay_credentials', {
      env: environment,
      encryption_key: encryptionKey,
    });

    if (error || !data || data.length === 0) {
      // Fallback to environment variables
      const config = getRazorpayConfig();
      return {
        key_id: config.keyId,
        key_secret: config.keySecret,
        webhook_secret: config.webhookSecret,
      };
    }

    const credentials = data[0];
    return {
      key_id: credentials.key_id,
      key_secret: credentials.key_secret,
      webhook_secret: credentials.webhook_secret,
    };
  } catch (error) {
    console.error('Error fetching credentials:', error);
    // Fallback to environment variables
    const config = getRazorpayConfig();
    return {
      key_id: config.keyId,
      key_secret: config.keySecret,
      webhook_secret: config.webhookSecret,
    };
  }
}

/**
 * Initialize Razorpay instance (server-side only)
 * @param environment - 'test' or 'production'
 * @returns Razorpay instance
 * @throws Error if credentials are not configured
 */
export async function getRazorpayInstance(environment: string = 'test'): Promise<Razorpay> {
  const credentials = await getRazorpayCredentials(environment);

  if (!credentials.key_id || !credentials.key_secret) {
    throw new Error('Razorpay credentials not configured. Please set NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
  }

  return new Razorpay({
    key_id: credentials.key_id,
    key_secret: credentials.key_secret,
  });
}

/**
 * Create Razorpay order
 * @param amount - Amount in paise (smallest currency unit)
 * @param currency - Currency code (default: INR)
 * @param receipt - Unique receipt identifier
 * @param notes - Optional metadata
 * @param environment - 'test' or 'production'
 * @returns Razorpay order object
 */
export async function createRazorpayOrder(
  amount: number,
  currency: string = 'INR',
  receipt: string,
  notes?: Record<string, string>,
  environment: string = 'test'
) {
  const razorpay = await getRazorpayInstance(environment);

  const orderOptions = {
    amount,
    currency,
    receipt,
    notes,
  };

  return await razorpay.orders.create(orderOptions);
}

/**
 * Fetch payment details from Razorpay
 * @param paymentId - Razorpay payment ID
 * @param environment - 'test' or 'production'
 * @returns Payment details
 */
export async function fetchPaymentDetails(paymentId: string, environment: string = 'test') {
  const razorpay = await getRazorpayInstance(environment);
  return await razorpay.payments.fetch(paymentId);
}

/**
 * Create refund for a payment
 * @param paymentId - Razorpay payment ID
 * @param amount - Amount in paise (optional, full refund if not provided)
 * @param notes - Optional metadata
 * @param environment - 'test' or 'production'
 * @returns Refund object
 */
export async function createRefund(
  paymentId: string,
  amount?: number,
  notes?: Record<string, string>,
  environment: string = 'test'
) {
  const razorpay = await getRazorpayInstance(environment);

  const refundOptions: any = {};
  if (amount) refundOptions.amount = amount;
  if (notes) refundOptions.notes = notes;

  return await razorpay.payments.refund(paymentId, refundOptions);
}

/**
 * Fetch order details from Razorpay
 * @param orderId - Razorpay order ID
 * @param environment - 'test' or 'production'
 * @returns Order details
 */
export async function fetchOrderDetails(orderId: string, environment: string = 'test') {
  const razorpay = await getRazorpayInstance(environment);
  return await razorpay.orders.fetch(orderId);
}
