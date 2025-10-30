// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import QRCode from 'qrcode';
import crypto from 'crypto';

// POST - Generate ticket after successful payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        time_slot:time_slots(*),
        exhibition:exhibitions(*),
        show:shows(*)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if ticket already generated
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('id, ticket_number')
      .eq('booking_id', bookingId)
      .single();

    if (existingTicket) {
      return NextResponse.json({
        success: true,
        ticket: existingTicket,
        message: 'Ticket already generated'
      });
    }

    // Generate ticket number
    const { data: ticketNumber } = await supabase
      .rpc('generate_ticket_number');

    // Create QR code data
    const qrData = {
      ticket_number: ticketNumber,
      booking_id: bookingId,
      booking_reference: booking.booking_reference,
      visitor_name: booking.visitor_name,
      date: booking.booking_date,
      time: booking.time_slot?.start_time,
      tickets: booking.total_tickets,
      checksum: crypto.createHash('sha256').update(`${ticketNumber}-${bookingId}`).digest('hex').substring(0, 16)
    };

    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));

    // Create ticket record
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        booking_id: bookingId,
        ticket_number: ticketNumber,
        qr_code_data: qrCodeDataUrl,
        status: 'unused'
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Ticket creation error:', ticketError);
      return NextResponse.json({ error: 'Failed to generate ticket' }, { status: 500 });
    }

    // Update booking
    await supabase
      .from('bookings')
      .update({ ticket_generated: true })
      .eq('id', bookingId);

    // Log timeline event
    await supabase
      .from('booking_timeline')
      .insert({
        booking_id: bookingId,
        event_type: 'ticket_generated',
        description: `Ticket ${ticketNumber} generated`,
        metadata: { ticket_id: ticket.id }
      });

    return NextResponse.json({
      success: true,
      ticket,
      qrCodeDataUrl
    });
  } catch (error: any) {
    console.error('Ticket generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
