// @ts-nocheck
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance (server-side only)
export function getRazorpayInstance() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
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
  notes?: Record<string, string>
) {
  const razorpay = getRazorpayInstance();
  
  const orderOptions = {
    amount,
    currency,
    receipt,
    notes,
  };
  
  return await razorpay.orders.create(orderOptions);
}

// Fetch payment details
export async function fetchPaymentDetails(paymentId: string) {
  const razorpay = getRazorpayInstance();
  return await razorpay.payments.fetch(paymentId);
}

// Create refund
export async function createRefund(
  paymentId: string,
  amount?: number, // in paise, optional for full refund
  notes?: Record<string, string>
) {
  const razorpay = getRazorpayInstance();
  
  const refundOptions: any = {};
  if (amount) refundOptions.amount = amount;
  if (notes) refundOptions.notes = notes;
  
  return await razorpay.payments.refund(paymentId, refundOptions);
}
