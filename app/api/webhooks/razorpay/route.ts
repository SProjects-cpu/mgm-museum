// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import { verifyWebhookSignature } from '@/lib/razorpay/client';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('Missing webhook signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    const { event, payload: eventPayload } = payload;

    const supabase = getServiceSupabase();

    // Extract common data
    const paymentEntity = eventPayload.payment?.entity;
    const orderId = paymentEntity?.order_id;
    
    // Find booking by Razorpay order ID
    if (!orderId) {
      console.error('No order ID in webhook payload');
      return NextResponse.json({ received: true });
    }

    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .single();

    if (!booking) {
      console.error('Booking not found for order:', orderId);
      return NextResponse.json({ received: true });
    }

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(supabase, booking, paymentEntity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(supabase, booking, paymentEntity);
        break;

      case 'order.paid':
        await handleOrderPaid(supabase, booking, eventPayload.order?.entity);
        break;

      case 'refund.created':
      case 'refund.processed':
        await handleRefundProcessed(supabase, booking, eventPayload.refund?.entity);
        break;

      case 'refund.failed':
        await handleRefundFailed(supabase, booking, eventPayload.refund?.entity);
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    // Log the webhook event
    await supabase
      .from('payment_logs')
      .insert({
        booking_id: booking.id,
        event_type: event,
        razorpay_event_id: payload.event_id || paymentEntity?.id,
        payload: eventPayload
      });

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(supabase: any, booking: any, payment: any) {
  await supabase
    .from('bookings')
    .update({
      razorpay_payment_id: payment.id,
      payment_status: 'completed',
      booking_status: 'confirmed',
      payment_method: payment.method,
      amount_paid: payment.amount,
      payment_timestamp: new Date(payment.created_at * 1000).toISOString()
    })
    .eq('id', booking.id);

  console.log('Payment captured for booking:', booking.booking_reference);
  // TODO: Send confirmation email (Phase 2)
}

async function handlePaymentFailed(supabase: any, booking: any, payment: any) {
  await supabase
    .from('bookings')
    .update({
      razorpay_payment_id: payment.id,
      payment_status: 'failed',
      booking_status: 'cancelled'
    })
    .eq('id', booking.id);

  console.log('Payment failed for booking:', booking.booking_reference);
  // TODO: Send failure notification (Phase 2)
}

async function handleOrderPaid(supabase: any, booking: any, order: any) {
  await supabase
    .from('bookings')
    .update({
      payment_status: 'completed',
      booking_status: 'confirmed'
    })
    .eq('id', booking.id);

  console.log('Order paid for booking:', booking.booking_reference);
}

async function handleRefundProcessed(supabase: any, booking: any, refund: any) {
  await supabase
    .from('bookings')
    .update({
      refund_id: refund.id,
      refund_amount: refund.amount,
      refund_status: 'processed',
      payment_status: 'refunded',
      booking_status: 'refunded'
    })
    .eq('id', booking.id);

  console.log('Refund processed for booking:', booking.booking_reference);
  // TODO: Send refund confirmation (Phase 2)
}

async function handleRefundFailed(supabase: any, booking: any, refund: any) {
  await supabase
    .from('bookings')
    .update({
      refund_id: refund.id,
      refund_status: 'failed'
    })
    .eq('id', booking.id);

  console.log('Refund failed for booking:', booking.booking_reference);
  // TODO: Notify admin (Phase 2)
}
