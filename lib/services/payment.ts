// Razorpay Payment Integration
// For India-specific payments (UPI, Cards, Netbanking)

interface RazorpayOrderData {
  amount: number; // in paise (multiply by 100)
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

interface RazorpayPaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Create Razorpay order
 */
export async function createRazorpayOrder(data: {
  amount: number;
  bookingReference: string;
  customerEmail: string;
  customerName: string;
}): Promise<any> {
  try {
    // Note: In production, this would call Razorpay API
    // For now, we'll create a mock order

    const orderData: RazorpayOrderData = {
      amount: Math.round(data.amount * 100), // Convert to paise
      currency: 'INR',
      receipt: data.bookingReference,
      notes: {
        bookingReference: data.bookingReference,
        customerEmail: data.customerEmail,
        customerName: data.customerName,
      },
    };

    // In production:
    // const Razorpay = require('razorpay');
    // const razorpay = new Razorpay({
    //   key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    //   key_secret: process.env.RAZORPAY_KEY_SECRET,
    // });
    // const order = await razorpay.orders.create(orderData);

    // Mock order for development
    const mockOrder = {
      id: `order_${Date.now()}`,
      entity: 'order',
      amount: orderData.amount,
      amount_paid: 0,
      amount_due: orderData.amount,
      currency: orderData.currency,
      receipt: orderData.receipt,
      status: 'created',
      attempts: 0,
      notes: orderData.notes,
      created_at: Date.now() / 1000,
    };

    return mockOrder;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error('Failed to create payment order');
  }
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature(data: RazorpayPaymentVerification): boolean {
  try {
    const crypto = require('crypto');
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new Error('Razorpay secret not configured');
    }

    // Create signature
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest('hex');

    return generatedSignature === data.razorpay_signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

/**
 * Process refund
 */
export async function processRefund(paymentId: string, amount: number): Promise<any> {
  try {
    // In production:
    // const Razorpay = require('razorpay');
    // const razorpay = new Razorpay({
    //   key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    //   key_secret: process.env.RAZORPAY_KEY_SECRET,
    // });
    // const refund = await razorpay.payments.refund(paymentId, {
    //   amount: Math.round(amount * 100), // Convert to paise
    // });

    // Mock refund for development
    const mockRefund = {
      id: `rfnd_${Date.now()}`,
      entity: 'refund',
      amount: Math.round(amount * 100),
      currency: 'INR',
      payment_id: paymentId,
      status: 'processed',
      created_at: Date.now() / 1000,
    };

    return mockRefund;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw new Error('Failed to process refund');
  }
}

/**
 * Get payment configuration for frontend
 */
export function getPaymentConfig() {
  return {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    currency: 'INR',
    name: 'MGM Science Centre',
    description: 'Science Exhibition Booking',
    image: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
    prefill: {
      method: 'card,netbanking,upi',
    },
    theme: {
      color: '#3498db',
    },
  };
}

/**
 * Validate payment amount (security check)
 */
export function validatePaymentAmount(
  expectedAmount: number,
  receivedAmount: number
): boolean {
  // Allow 1 paisa difference due to rounding
  return Math.abs(expectedAmount - receivedAmount) <= 0.01;
}






