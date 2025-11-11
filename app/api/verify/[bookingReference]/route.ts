import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingReference: string } }
) {
  try {
    const { bookingReference } = params;

    // Create Supabase client (public access for verification)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch booking details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        visitor_name,
        visitor_email,
        visitor_phone,
        visit_date,
        visit_time,
        num_adults,
        num_children,
        total_amount,
        status,
        payment_id,
        created_at,
        exhibitions (
          name
        )
      `)
      .eq('booking_reference', bookingReference)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Format the response
    const response = {
      booking: {
        visitor_name: booking.visitor_name,
        visitor_email: booking.visitor_email,
        visitor_phone: booking.visitor_phone,
        booking_reference: booking.booking_reference,
        ticket_number: `TKT-${booking.id.substring(0, 8).toUpperCase()}`,
        payment_id: booking.payment_id || 'N/A',
        visit_date: new Date(booking.visit_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        visit_time: booking.visit_time,
        num_tickets: booking.num_adults + booking.num_children,
        amount_paid: booking.total_amount,
        status: booking.status,
        booking_timestamp: new Date(booking.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        exhibition_name: booking.exhibitions?.name || 'Museum Visit',
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error verifying booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
