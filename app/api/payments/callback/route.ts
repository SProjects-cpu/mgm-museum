// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// POST - Razorpay payment callback
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment details' },
        { status: 400 }
      );
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, bookings(*)')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Update payment status
    await supabase
      .from('payments')
      .update({
        razorpay_payment_id,
        status: 'paid',
        payment_method: 'razorpay',
      })
      .eq('id', payment.id);

    // Update booking status
    await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
      })
      .eq('id', payment.booking_id);

    // Generate ticket (trigger ticket generation)
    const ticketResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/tickets/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: payment.booking_id }),
      }
    );

    if (!ticketResponse.ok) {
      console.error('Failed to generate ticket');
    }

    return NextResponse.json({
      success: true,
      bookingId: payment.booking_id,
      bookingReference: payment.bookings?.booking_reference,
      message: 'Payment verified successfully',
    });
  } catch (error: any) {
    console.error('Error in payment callback:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
