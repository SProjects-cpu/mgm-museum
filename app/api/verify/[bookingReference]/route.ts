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
        guest_name,
        guest_email,
        guest_phone,
        booking_date,
        booking_time,
        total_amount,
        status,
        payment_id,
        created_at,
        exhibition_id,
        exhibitions (
          name
        ),
        time_slots (
          slot_date,
          start_time,
          end_time
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
    // Extract data from arrays (Supabase returns arrays for joined tables)
    const timeSlot = Array.isArray(booking.time_slots) ? booking.time_slots[0] : booking.time_slots;
    const exhibition = Array.isArray(booking.exhibitions) ? booking.exhibitions[0] : booking.exhibitions;
    
    // Use slot_date from time_slots as the source of truth for visit date
    const visitDate = timeSlot?.slot_date || booking.booking_date;
    
    // Format date without timezone conversion by treating it as a local date
    const formatDateWithoutTimezone = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day); // Create date in local timezone
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };
    
    // Format time from time_slots or booking_time
    let visitTime = booking.booking_time || '10:00 AM - 6:00 PM';
    if (timeSlot?.start_time && timeSlot?.end_time) {
      const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
      };
      visitTime = `${formatTime(timeSlot.start_time)} - ${formatTime(timeSlot.end_time)}`;
    }
    
    const response = {
      booking: {
        visitor_name: booking.guest_name,
        visitor_email: booking.guest_email,
        visitor_phone: booking.guest_phone || 'N/A',
        booking_reference: booking.booking_reference,
        ticket_number: `TKT-${booking.id.substring(0, 8).toUpperCase()}`,
        payment_id: booking.payment_id || 'N/A',
        visit_date: formatDateWithoutTimezone(visitDate),
        visit_time: visitTime,
        num_tickets: 1, // Default to 1 ticket per booking
        amount_paid: booking.total_amount,
        status: booking.status,
        booking_timestamp: new Date(booking.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        exhibition_name: exhibition?.name || 'Museum Visit',
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
