// @ts-nocheck
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getServiceSupabase } from '@/lib/supabase/config';

// Get Razorpay credentials from database or environment
async function getRazorpayCredentials(environment: string = 'test') {
  try {
    const supabase = getServiceSupabase();
    const encryptionKey = process.env.DATABASE_ENCRYPTION_KEY;

    if (!encryptionKey) {
      // Fallback to environment variables
      return {
        key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
        webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET
      };
    }

    // Try to fetch from database
    const { data, error } = await supabase.rpc('get_active_razorpay_credentials', {
      env: environment,
      encryption_key: encryptionKey
    });

    if (error || !data || data.length === 0) {
      // Fallback to environment variables
      return {
        key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
        webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET
      };
    }

    const credentials = data[0];
    return {
      key_id: credentials.key_id,
      key_secret: credentials.key_secret,
      webhook_secret: credentials.webhook_secret
    };
  } catch (error) {
    console.error('Error fetching credentials:', error);
    // Fallback to environment variables
    return {
      key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
      webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET
    };
  }
}

// Initialize Razorpay instance (server-side only)
export async function getRazorpayInstance(environment: string = 'test') {
  const credentials = await getRazorpayCredentials(environment);
  
  if (!credentials.key_id || !credentials.key_secret) {
    throw new Error('Razorpay credentials not configured');
  }

  return new Razorpay({
    key_id: credentials.key_id,
    key_secret: credentials.key_secret,
  });
}

// Verify payment signature
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const body = orderId + '|' + paymentId;
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Create Razorpay order
export async function createRazorpayOrder(
  amount: number, // in paise
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

// Fetch payment details
export async function fetchPaymentDetails(paymentId: string, environment: string = 'test') {
  const razorpay = await getRazorpayInstance(environment);
  return await razorpay.payments.fetch(paymentId);
}

// Create refund
export async function createRefund(
  paymentId: string,
  amount?: number, // in paise, optional for full refund
  notes?: Record<string, string>,
  environment: string = 'test'
) {
  const razorpay = await getRazorpayInstance(environment);
  
  const refundOptions: any = {};
  if (amount) refundOptions.amount = amount;
  if (notes) refundOptions.notes = notes;
  
  return await razorpay.payments.refund(paymentId, refundOptions);
}
