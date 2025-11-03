// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { razorpay } from '@/lib/razorpay/config';

/**
 * POST /api/admin/bookings/[id]/refund
 * Process refund for a booking
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const body = await request.json();
    const { reason, amount } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        time_slot:time_slots(*)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking has payment
    if (!booking.razorpay_payment_id) {
      return NextResponse.json(
        { error: 'No payment found for this booking' },
        { status: 400 }
      );
    }

    // Check if already refunded
    if (booking.refund_id) {
      return NextResponse.json(
        { error: 'Booking already refunded' },
        { status: 400 }
      );
    }

    // Calculate refund amount (default to full amount if not specified)
    const refundAmount = amount || booking.amount_paid;

    if (!refundAmount || refundAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid refund amount' },
        { status: 400 }
      );
    }

    // Process refund via Razorpay
    let refund;
    try {
      refund = await razorpay.payments.refund(booking.razorpay_payment_id, {
        amount: refundAmount,
        notes: {
          booking_id: bookingId,
          booking_reference: booking.booking_reference,
          reason: reason || 'Admin initiated refund',
        },
      });
    } catch (razorpayError: any) {
      console.error('Razorpay refund error:', razorpayError);
      return NextResponse.json(
        { error: razorpayError.error?.description || 'Failed to process refund with Razorpay' },
        { status: 500 }
      );
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        refund_id: refund.id,
        refund_amount: refundAmount,
        refund_status: refund.status,
        payment_status: 'refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking status' },
        { status: 500 }
      );
    }

    // Release seats by decrementing current_bookings
    if (booking.time_slot_id) {
      const { error: releaseError } = await supabase.rpc('exec_sql', {
        sql: `UPDATE time_slots SET current_bookings = GREATEST(0, current_bookings - $1) WHERE id = $2`,
        params: [booking.total_tickets, booking.time_slot_id]
      });

      if (releaseError) {
        console.error('Error releasing seats:', releaseError);
        // Don't fail the refund if seat release fails, just log it
        // Try alternative approach
        const { data: slot } = await supabase
          .from('time_slots')
          .select('current_bookings')
          .eq('id', booking.time_slot_id)
          .single();
        
        if (slot) {
          await supabase
            .from('time_slots')
            .update({
              current_bookings: Math.max(0, slot.current_bookings - booking.total_tickets),
            })
            .eq('id', booking.time_slot_id);
        }
      }
    }

    // Update payment order status
    if (booking.razorpay_order_id) {
      await supabase
        .from('payment_orders')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_order_id', booking.razorpay_order_id);
    }

    // Log the refund
    await supabase.from('payment_logs').insert({
      booking_id: bookingId,
      event_type: 'refund.processed',
      payload: {
        refund_id: refund.id,
        amount: refundAmount,
        status: refund.status,
        reason: reason || 'Admin initiated refund',
      },
    });

    // TODO: Send refund confirmation email
    // await sendRefundConfirmationEmail(booking);

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refundAmount,
        status: refund.status,
      },
      message: 'Refund processed successfully',
    });
  } catch (error) {
    console.error('Refund API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
