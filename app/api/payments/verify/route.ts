// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import { verifyPaymentSignature } from '@/lib/razorpay/utils';
import { fetchPaymentDetails } from '@/lib/razorpay/client';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking_id
    } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
      return NextResponse.json(
        { error: 'Missing required payment details' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Verify the booking exists
    const { data: booking, error: bookingFetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (bookingFetchError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (booking.payment_status === 'completed') {
      return NextResponse.json(
        { error: 'Payment already verified' },
        { status: 400 }
      );
    }

    // Verify payment signature
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      // Log failed verification
      await supabase
        .from('payment_logs')
        .insert({
          booking_id: booking.id,
          event_type: 'payment.verification_failed',
          payload: {
            razorpay_order_id,
            razorpay_payment_id,
            error: 'Invalid signature'
          }
        });

      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay
    const paymentDetails = await fetchPaymentDetails(razorpay_payment_id);

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        razorpay_payment_id: razorpay_payment_id,
        payment_method: paymentDetails.method,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', razorpay_order_id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    // Get booking details for ticket generation
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, booking_reference')
      .eq('razorpay_order_id', razorpayOrderId);

    // Trigger ticket generation for each booking
    const ticketPromises = bookings?.map(booking => 
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tickets/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id })
      })
    ) || [];

    await Promise.allSettled(ticketPromises);

    // Log successful payment
    await supabase
      .from('payment_logs')
      .insert({
        booking_id: booking.id,
        event_type: 'payment.captured',
        razorpay_event_id: razorpay_payment_id,
        payload: paymentDetails
      });

    // TODO: Send confirmation email with QR code (Phase 2)
    // TODO: Generate PDF ticket (Phase 2)

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      booking: {
        id: booking.id,
        bookingReference: booking.booking_reference,
        status: 'confirmed'
      }
    });

  } catch (error: any) {
    console.error('Error in payment verification:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
