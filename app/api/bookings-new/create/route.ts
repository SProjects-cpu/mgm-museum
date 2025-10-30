// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import type { CreateBookingRequest } from '@/types/booking-new';

/**
 * POST /api/bookings-new/create
 * Create a new booking
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateBookingRequest = await request.json();

    // Validate required fields
    if (!body.timeSlotId || !body.bookingDate || !body.visitorName || !body.visitorEmail || !body.totalTickets) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Check time slot availability
    const { data: timeSlot, error: slotError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', body.timeSlotId)
      .single();

    if (slotError || !timeSlot) {
      return NextResponse.json(
        { error: 'Time slot not found' },
        { status: 404 }
      );
    }

    const availableCapacity = timeSlot.capacity - (timeSlot.current_bookings || 0) - (timeSlot.buffer_capacity || 5);
    
    if (availableCapacity < body.totalTickets) {
      return NextResponse.json(
        { error: `Only ${availableCapacity} tickets available for this time slot` },
        { status: 400 }
      );
    }

    // Generate booking reference
    const { data: refData, error: refError } = await supabase
      .rpc('generate_booking_reference');

    if (refError || !refData) {
      console.error('Error generating booking reference:', refError);
      return NextResponse.json(
        { error: 'Failed to generate booking reference' },
        { status: 500 }
      );
    }

    const bookingReference = refData;

    // Ensure total_amount is a number (required field)
    const totalAmount = parseFloat(body.totalAmount) || 0;
    
    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_reference: bookingReference,
        time_slot_id: body.timeSlotId,
        exhibition_id: body.exhibitionId || null,
        show_id: body.showId || null,
        visitor_name: body.visitorName,
        visitor_email: body.visitorEmail,
        visitor_phone: body.visitorPhone || null,
        adult_tickets: body.adultTickets || 0,
        child_tickets: body.childTickets || 0,
        student_tickets: body.studentTickets || 0,
        senior_tickets: body.seniorTickets || 0,
        total_tickets: body.totalTickets,
        subtotal: parseFloat(body.subtotal) || 0,
        discount: parseFloat(body.discount) || 0,
        total_amount: totalAmount,
        voucher_code: body.voucherCode || null,
        status: 'confirmed',
        payment_status: totalAmount > 0 ? 'pending' : 'free',
        special_requirements: body.specialRequirements || null,
        accessibility_requirements: body.accessibilityRequirements || null,
        booking_date: body.bookingDate
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error('Error creating booking:', bookingError);
      console.error('Booking data attempted:', {
        booking_reference: bookingReference,
        time_slot_id: body.timeSlotId,
        total_amount: totalAmount,
        booking_date: body.bookingDate
      });
      return NextResponse.json(
        { 
          error: 'Failed to create booking',
          details: bookingError?.message || 'Unknown error',
          code: bookingError?.code
        },
        { status: 500 }
      );
    }

    // Create exhibition tickets if any
    if (body.exhibitions && body.exhibitions.length > 0) {
      const exhibitionInserts = body.exhibitions.map(ex => ({
        booking_id: booking.id,
        exhibition_id: ex.exhibitionId,
        adult_tickets: ex.adultTickets || 0,
        child_tickets: ex.childTickets || 0,
        price_per_adult: ex.pricePerAdult || 0,
        price_per_child: ex.pricePerChild || 0,
        subtotal: ex.subtotal || 0
      }));

      const { error: exError } = await supabase
        .from('booking_exhibitions')
        .insert(exhibitionInserts);

      if (exError) {
        console.error('Error creating exhibition tickets:', exError);
        // Don't fail the booking, just log the error
      }
    }

    // Fetch complete booking with relations
    const { data: completeBooking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        time_slot:time_slots(*),
        exhibition:exhibitions(*),
        show:shows(*),
        booking_exhibitions(
          *,
          exhibition:exhibitions(*)
        )
      `)
      .eq('id', booking.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete booking:', fetchError);
      // Return basic booking if fetch fails
      return NextResponse.json({
        success: true,
        booking,
        bookingReference
      });
    }

    return NextResponse.json({
      success: true,
      booking: completeBooking,
      bookingReference
    });
  } catch (error) {
    console.error('Create booking API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
