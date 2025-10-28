// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature } from '@/lib/services/payment';
import { confirmBooking } from '@/lib/graphql/resolvers-impl';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * Razorpay Payment Webhook Handler
 * This route handles payment confirmations from Razorpay
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-razorpay-signature');

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    // In production, verify the webhook signature here
    // const crypto = require('crypto');
    // const expectedSignature = crypto
    //   .createHmac('sha256', webhookSecret)
    //   .update(JSON.stringify(body))
    //   .digest('hex');
    
    // if (signature !== expectedSignature) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    // }

    // Handle different webhook events
    const event = body.event;
    const payload = body.payload?.payment?.entity || body.payload?.order?.entity;

    switch (event) {
      case 'payment.captured':
      case 'order.paid':
        // Payment successful
        const bookingReference = payload.notes?.bookingReference || payload.receipt;
        
        if (bookingReference) {
          // Confirm booking
          await confirmBooking(bookingReference);
          
          console.log(`Payment confirmed for booking: ${bookingReference}`);
        }
        break;

      case 'payment.failed':
        // Payment failed - update booking status
        const failedReference = payload.notes?.bookingReference || payload.receipt;
        
        if (failedReference) {
          const supabase = getServiceSupabase();
          await supabase
            .from('bookings')
            .update({
              payment_status: 'failed',
              payment_details: payload,
            } as any)
            .eq('booking_reference', failedReference);

          console.log(`Payment failed for booking: ${failedReference}`);
        }
        break;

      case 'refund.processed':
        // Refund processed
        const refundReference = payload.notes?.bookingReference;
        
        if (refundReference) {
          const supabase = getServiceSupabase();
          await supabase
            .from('bookings')
            .update({
              payment_status: 'refunded',
              status: 'cancelled',
            } as any)
            .eq('booking_reference', refundReference);

          console.log(`Refund processed for booking: ${refundReference}`);
        }
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}


