// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import crypto from 'crypto';

// POST - Verify ticket at museum entrance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketNumber, staffId, deviceId } = body;

    if (!ticketNumber) {
      return NextResponse.json({ error: 'Ticket number required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Fetch ticket with booking details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        booking:bookings(
          *,
          time_slot:time_slots(*),
          exhibition:exhibitions(name),
          show:shows(name)
        )
      `)
      .eq('ticket_number', ticketNumber)
      .single();

    if (ticketError || !ticket) {
      // Log failed verification
      await supabase.from('ticket_verifications').insert({
        ticket_number: ticketNumber,
        verification_status: 'invalid',
        staff_id: staffId,
        device_id: deviceId,
        verification_message: 'Ticket not found'
      });

      return NextResponse.json({
        valid: false,
        status: 'INVALID',
        message: 'Ticket not found'
      }, { status: 404 });
    }

    const booking = ticket.booking;

    // Check ticket status
    if (ticket.status === 'used') {
      await supabase.from('ticket_verifications').insert({
        ticket_id: ticket.id,
        ticket_number: ticketNumber,
        verification_status: 'already_used',
        staff_id: staffId,
        device_id: deviceId,
        verification_message: `Already used on ${new Date(ticket.used_at).toLocaleString()}`
      });

      return NextResponse.json({
        valid: false,
        status: 'ALREADY_USED',
        usedAt: ticket.used_at,
        message: 'Ticket already used',
        action: 'DENY_ENTRY'
      });
    }

    if (ticket.status === 'cancelled' || ticket.status === 'expired') {
      await supabase.from('ticket_verifications').insert({
        ticket_id: ticket.id,
        ticket_number: ticketNumber,
        verification_status: ticket.status,
        staff_id: staffId,
        device_id: deviceId,
        verification_message: `Ticket is ${ticket.status}`
      });

      return NextResponse.json({
        valid: false,
        status: ticket.status.toUpperCase(),
        message: `Ticket is ${ticket.status}`,
        action: 'DENY_ENTRY'
      });
    }

    // Check date/time validity
    const bookingDate = new Date(booking.booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate.getTime() !== today.getTime()) {
      await supabase.from('ticket_verifications').insert({
        ticket_id: ticket.id,
        ticket_number: ticketNumber,
        verification_status: 'wrong_date',
        staff_id: staffId,
        device_id: deviceId,
        verification_message: `Valid for ${booking.booking_date}, not today`
      });

      return NextResponse.json({
        valid: false,
        status: 'WRONG_DATE',
        validDate: booking.booking_date,
        message: `This ticket is valid for ${booking.booking_date}`,
        action: 'DENY_ENTRY'
      });
    }

    // Ticket is valid - mark as used
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'used',
        used_at: new Date().toISOString(),
        verified_by: staffId,
        verification_device: deviceId
      })
      .eq('id', ticket.id);

    if (updateError) {
      console.error('Error marking ticket as used:', updateError);
      return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }

    // Log successful verification
    await supabase.from('ticket_verifications').insert({
      ticket_id: ticket.id,
      ticket_number: ticketNumber,
      verification_status: 'valid',
      staff_id: staffId,
      device_id: deviceId,
      verification_message: 'Entry granted'
    });

    // Update booking timeline
    await supabase.from('booking_timeline').insert({
      booking_id: booking.id,
      event_type: 'ticket_verified',
      description: `Ticket verified and used by ${staffId || 'staff'}`,
      performed_by: staffId,
      metadata: { device_id: deviceId }
    });

    return NextResponse.json({
      valid: true,
      status: 'VALID_UNUSED',
      booking_details: {
        exhibition: booking.exhibition?.name || booking.show?.name,
        date: booking.booking_date,
        time_slot: `${booking.time_slot?.start_time} - ${booking.time_slot?.end_time}`,
        visitor_count: booking.total_tickets,
        categories: {
          Adult: booking.adult_tickets,
          Child: booking.child_tickets,
          Student: booking.student_tickets,
          Senior: booking.senior_tickets
        }
      },
      visitor_name: booking.visitor_name,
      message: 'Access Granted',
      action: 'GRANT_ENTRY'
    });
  } catch (error: any) {
    console.error('Ticket verification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
