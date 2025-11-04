import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import { generateTicketPDF, generateTicketFilename, type TicketData } from '@/lib/services/ticket-generator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: 'Booking ID is required' },
        { status: 400 }
      );
    }

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

    // Fetch booking with related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        exhibition:exhibitions(name),
        show:shows(name),
        time_slot:time_slots(start_time, end_time),
        ticket:tickets(ticket_number)
      `)
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking is confirmed
    if (booking.status !== 'confirmed' || booking.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, message: 'Ticket not available for this booking' },
        { status: 400 }
      );
    }

    // Format time slot
    const timeSlot = booking.time_slot
      ? `${booking.time_slot.start_time} - ${booking.time_slot.end_time}`
      : 'Not specified';

    // Prepare ticket data
    const ticketData: TicketData = {
      bookingReference: booking.booking_reference,
      visitorName: booking.visitor_name,
      visitorEmail: booking.visitor_email,
      visitorPhone: booking.visitor_phone,
      exhibitionName: booking.exhibition?.name,
      showName: booking.show?.name,
      bookingDate: booking.booking_date,
      timeSlot,
      tickets: {
        adult: booking.adult_tickets || 0,
        child: booking.child_tickets || 0,
        student: booking.student_tickets || 0,
        senior: booking.senior_tickets || 0,
      },
      totalTickets: booking.total_tickets,
      totalAmount: parseFloat(booking.total_amount),
      paymentId: booking.payment_id,
      ticketNumber: booking.ticket?.[0]?.ticket_number || 'N/A',
    };

    // Generate PDF
    const pdfBuffer = await generateTicketPDF(ticketData);
    const filename = generateTicketFilename(booking.booking_reference);

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating ticket:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to generate ticket' },
      { status: 500 }
    );
  }
}
