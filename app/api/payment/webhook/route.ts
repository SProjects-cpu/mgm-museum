import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import { verifyWebhookSignature } from '@/lib/razorpay/utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    
    // Get webhook signature from header
    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json(
        { success: false, message: 'Missing webhook signature' },
        { status: 400 }
      );
    }

    // Get raw body for signature verification
    const body = await request.text();
    
    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { success: false, message: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    // Parse webhook payload
    const payload = JSON.parse(body);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    console.log('Webhook received:', event);

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(supabase, paymentEntity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(supabase, paymentEntity);
        break;

      case 'payment.authorized':
        await handlePaymentAuthorized(supabase, paymentEntity);
        break;

      case 'order.paid':
        await handleOrderPaid(supabase, orderEntity);
        break;

      case 'refund.created':
      case 'refund.processed':
        await handleRefund(supabase, payload.payload?.refund?.entity);
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(supabase: any, payment: any) {
  try {
    const orderId = payment.order_id;
    const paymentId = payment.id;

    // Update payment order status
    const { error } = await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
        payment_id: paymentId,
        payment_method: payment.method,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', orderId);

    if (error) {
      console.error('Failed to update payment order:', error);
    }

    // Update bookings payment status
    await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
      })
      .eq('payment_order_id', orderId);

    console.log('Payment captured:', paymentId);
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

async function handlePaymentFailed(supabase: any, payment: any) {
  try {
    const orderId = payment.order_id;
    const paymentId = payment.id;

    // Update payment order status
    await supabase
      .from('payment_orders')
      .update({
        status: 'failed',
        payment_id: paymentId,
        error_code: payment.error_code,
        error_description: payment.error_description,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', orderId);

    console.log('Payment failed:', paymentId);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handlePaymentAuthorized(supabase: any, payment: any) {
  try {
    const orderId = payment.order_id;
    const paymentId = payment.id;

    // Update payment order status
    await supabase
      .from('payment_orders')
      .update({
        status: 'attempted',
        payment_id: paymentId,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', orderId);

    console.log('Payment authorized:', paymentId);
  } catch (error) {
    console.error('Error handling payment authorized:', error);
  }
}

async function handleOrderPaid(supabase: any, order: any) {
  try {
    const orderId = order.id;

    // Update payment order status
    await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', orderId);

    console.log('Order paid:', orderId);
  } catch (error) {
    console.error('Error handling order paid:', error);
  }
}

async function handleRefund(supabase: any, refund: any) {
  try {
    const paymentId = refund.payment_id;

    // Find payment order by payment ID
    const { data: paymentOrder } = await supabase
      .from('payment_orders')
      .select('razorpay_order_id')
      .eq('payment_id', paymentId)
      .single();

    if (paymentOrder) {
      // Update bookings to cancelled and refunded
      await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          payment_status: 'refunded',
        })
        .eq('payment_order_id', paymentOrder.razorpay_order_id);

      // Release seats
      const { data: bookings } = await supabase
        .from('bookings')
        .select('time_slot_id, total_tickets')
        .eq('payment_order_id', paymentOrder.razorpay_order_id);

      if (bookings) {
        for (const booking of bookings) {
          const { data: timeSlot } = await supabase
            .from('time_slots')
            .select('current_bookings')
            .eq('id', booking.time_slot_id)
            .single();

          if (timeSlot) {
            await supabase
              .from('time_slots')
              .update({
                current_bookings: Math.max(0, (timeSlot.current_bookings || 0) - booking.total_tickets)
              })
              .eq('id', booking.time_slot_id);
          }
        }
      }
    }

    console.log('Refund processed:', refund.id);
  } catch (error) {
    console.error('Error handling refund:', error);
  }
}
