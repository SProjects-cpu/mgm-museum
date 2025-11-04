import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import { verifyWebhookSignature, generateBookingReference } from '@/lib/razorpay/utils';

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
    
    // Find payment order by Razorpay order ID
    if (!orderId) {
      console.error('No order ID in webhook payload');
      return NextResponse.json({ received: true });
    }

    const { data: paymentOrder } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .single();

    if (!paymentOrder) {
      console.error('Payment order not found for order:', orderId);
      return NextResponse.json({ received: true });
    }

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(supabase, paymentOrder, paymentEntity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(supabase, paymentOrder, paymentEntity);
        break;

      case 'refund.created':
      case 'refund.processed':
        await handleRefundProcessed(supabase, paymentOrder, eventPayload.refund?.entity);
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(supabase: any, paymentOrder: any, payment: any) {
  // Update payment order status
  await supabase
    .from('payment_orders')
    .update({
      status: 'paid',
      payment_id: payment.id,
      payment_method: payment.method,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentOrder.id);

  // Check if bookings already exist
  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('payment_order_id', paymentOrder.razorpay_order_id)
    .limit(1);

  if (existingBookings && existingBookings.length > 0) {
    console.log('Bookings already exist for order:', paymentOrder.razorpay_order_id);
    return;
  }

  // Create bookings from cart snapshot
  const cartItems = paymentOrder.cart_snapshot as any[];
  
  for (const item of cartItems) {
    const bookingReference = generateBookingReference();

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_reference: bookingReference,
        user_id: paymentOrder.user_id,
        time_slot_id: item.timeSlotId,
        exhibition_id: item.exhibitionId,
        show_id: item.showId,
        booking_date: item.bookingDate,
        visitor_name: paymentOrder.payment_email,
        visitor_email: paymentOrder.payment_email,
        visitor_phone: paymentOrder.payment_contact,
        adult_tickets: item.tickets?.adult || 0,
        child_tickets: item.tickets?.child || 0,
        student_tickets: item.tickets?.student || 0,
        senior_tickets: item.tickets?.senior || 0,
        total_tickets: item.totalTickets,
        subtotal: item.subtotal || 0,
        discount: 0,
        total_amount: item.subtotal || 0,
        status: 'confirmed',
        payment_status: 'paid',
        payment_order_id: paymentOrder.razorpay_order_id,
        payment_id: payment.id,
        payment_method: payment.method,
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Failed to create booking from webhook:', bookingError);
      continue;
    }

    // Create ticket record
    const ticketNumber = `TKT${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    await supabase
      .from('tickets')
      .insert({
        booking_id: booking.id,
        ticket_number: ticketNumber,
        qr_code: bookingReference,
        status: 'active',
      });
  }

  console.log('Payment captured and bookings created for order:', paymentOrder.razorpay_order_id);
}

async function handlePaymentFailed(supabase: any, paymentOrder: any, payment: any) {
  await supabase
    .from('payment_orders')
    .update({
      status: 'failed',
      payment_id: payment.id,
      error_code: payment.error_code,
      error_description: payment.error_description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentOrder.id);

  console.log('Payment failed for order:', paymentOrder.razorpay_order_id);
}

async function handleRefundProcessed(supabase: any, paymentOrder: any, refund: any) {
  await supabase
    .from('payment_orders')
    .update({
      status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentOrder.id);

  // Update associated bookings
  await supabase
    .from('bookings')
    .update({
      payment_status: 'refunded',
      status: 'cancelled',
    })
    .eq('payment_order_id', paymentOrder.razorpay_order_id);

  console.log('Refund processed for order:', paymentOrder.razorpay_order_id);
}
