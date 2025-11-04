import { NextRequest } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import { errorResponse, successResponse } from '@/lib/api/response';
import { BookingError } from '@/lib/api/errors';
import { BookingErrorCode } from '@/lib/api/errors';
import { verifySeatLock, releaseSeatLock, updateSlotAvailability } from '@/lib/api/booking-queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      lockId,
      userId,
      guestEmail,
      guestName,
      guestPhone,
      tickets,
      totalAmount,
      paymentDetails,
    } = body;

    // Validation
    if (!lockId) {
      return errorResponse(
        new BookingError(
          BookingErrorCode.VALIDATION_ERROR,
          'Lock ID is required'
        )
      );
    }

    if (!userId && !guestEmail) {
      return errorResponse(
        new BookingError(
          BookingErrorCode.VALIDATION_ERROR,
          'Either userId or guestEmail is required'
        )
      );
    }

    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return errorResponse(
        new BookingError(
          BookingErrorCode.VALIDATION_ERROR,
          'Tickets array is required'
        )
      );
    }

    // Verify lock is still valid
    const lock = await verifySeatLock(lockId);
    if (!lock) {
      return errorResponse(
        new BookingError(
          BookingErrorCode.LOCK_EXPIRED,
          'Seat lock has expired'
        )
      );
    }

    const supabase = getServiceSupabase();

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId || null,
        guest_email: guestEmail || null,
        guest_name: guestName || null,
        guest_phone: guestPhone || null,
        exhibition_id: lock.exhibitionId || null,
        show_id: lock.showId || null,
        booking_date: lock.date,
        time_slot_id: lock.timeSlotId,
        status: 'confirmed',
        payment_status: 'paid',
        total_amount: totalAmount,
        payment_details: paymentDetails || {},
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Insert booking tickets
    const ticketInserts = tickets.map(ticket => ({
      booking_id: booking.id,
      pricing_id: ticket.pricingId,
      quantity: ticket.quantity,
      price_per_ticket: ticket.price,
      subtotal: ticket.quantity * ticket.price,
    }));

    const { error: ticketsError } = await supabase
      .from('booking_tickets')
      .insert(ticketInserts);

    if (ticketsError) throw ticketsError;

    // Insert seat bookings
    const seatInserts = lock.seats.map(seat => ({
      booking_id: booking.id,
      seat_number: seat.number,
      row_letter: seat.row,
    }));

    const { error: seatsError } = await supabase
      .from('seat_bookings')
      .insert(seatInserts);

    if (seatsError) throw seatsError;

    // Update slot availability
    const totalTickets = tickets.reduce((sum, t) => sum + t.quantity, 0);
    await updateSlotAvailability(lock.timeSlotId, lock.date, totalTickets);

    // Release lock
    await releaseSeatLock(lockId);

    // TODO: Send confirmation email

    return successResponse({
      bookingId: booking.id,
      bookingReference: booking.booking_reference,
      status: booking.status,
      confirmationEmail: true,
    });
  } catch (error: any) {
    console.error('[API] Error creating booking:', error);
    return errorResponse(error);
  }
}
