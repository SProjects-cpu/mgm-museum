import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Fetch user's bookings
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        exhibition:exhibitions(id, name, category),
        show:shows(id, name, type),
        time_slot:time_slots(start_time, end_time),
        tickets(id, ticket_number, qr_code, status)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user bookings:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    // Format bookings for response
    const formattedBookings = bookings?.map((booking) => ({
      id: booking.id,
      bookingReference: booking.booking_reference,
      exhibitionId: booking.exhibition_id,
      showId: booking.show_id,
      exhibitionName: booking.exhibition?.name,
      showName: booking.show?.name,
      bookingDate: booking.booking_date,
      timeSlot: booking.time_slot
        ? `${booking.time_slot.start_time} - ${booking.time_slot.end_time}`
        : 'N/A',
      totalTickets: booking.total_tickets,
      adultTickets: booking.adult_tickets || 0,
      childTickets: booking.child_tickets || 0,
      studentTickets: booking.student_tickets || 0,
      seniorTickets: booking.senior_tickets || 0,
      totalAmount: parseFloat(booking.total_amount),
      status: booking.status,
      paymentStatus: booking.payment_status,
      paymentMethod: booking.payment_method,
      paymentId: booking.payment_id,
      createdAt: booking.created_at,
      hasTicket: booking.tickets && booking.tickets.length > 0,
      ticketUrl: booking.tickets && booking.tickets.length > 0
        ? `/api/tickets/generate?bookingId=${booking.id}`
        : null,
    }));

    return NextResponse.json({
      success: true,
      bookings: formattedBookings || [],
    });
  } catch (error: any) {
    console.error('Error in user bookings API:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
