// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import { createRazorpayOrder } from '@/lib/razorpay/client';

// POST - Create Razorpay order for payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingIds, amount, currency = 'INR' } = body;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { error: 'Booking IDs required' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Fetch bookings
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .in('id', bookingIds);

    if (bookingError || !bookings || bookings.length === 0) {
      return NextResponse.json(
        { error: 'Bookings not found' },
        { status: 404 }
      );
    }

    // Verify all bookings are pending payment
    const invalidBookings = bookings.filter(
      b => b.payment_status !== 'pending' && b.payment_status !== 'failed'
    );

    if (invalidBookings.length > 0) {
      return NextResponse.json(
        { error: 'One or more bookings already paid or invalid' },
        { status: 400 }
      );
    }

    // Calculate total from bookings
    const calculatedTotal = bookings.reduce(
      (sum, b) => sum + parseFloat(b.total_amount || 0),
      0
    );

    if (Math.abs(calculatedTotal - amount) > 0.01) {
      return NextResponse.json(
        { error: 'Amount mismatch' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const amountInPaise = Math.round(amount * 100);
    const receipt = `BOOKING-${bookingIds[0]}-${Date.now()}`;
    
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'test';

    const razorpayOrder = await createRazorpayOrder(
      amountInPaise,
      currency,
      receipt,
      {
        booking_ids: bookingIds.join(','),
        booking_count: bookings.length.toString()
      },
      environment
    );

    // Update bookings with Razorpay order ID
    await supabase
      .from('bookings')
      .update({
        razorpay_order_id: razorpayOrder.id,
        status: 'awaiting_payment',
        updated_at: new Date().toISOString()
      })
      .in('id', bookingIds);

    // Log payment attempt
    await supabase
      .from('payment_logs')
      .insert({
        booking_id: bookingIds[0],
        event_type: 'order_created',
        razorpay_event_id: razorpayOrder.id,
        payload: razorpayOrder
      });

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      bookingIds
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
