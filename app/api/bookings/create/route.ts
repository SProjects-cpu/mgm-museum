// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Razorpay from 'razorpay';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// POST - Create booking and Razorpay order
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      exhibitionId,
      showId,
      userId,
      guestEmail,
      guestPhone,
      guestName,
      bookingDate,
      timeSlotId,
      tickets, // Array of { categoryId, quantity, unitPrice }
    } = body;

    // Validate required fields
    if (!bookingDate || !timeSlotId || !tickets || tickets.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!exhibitionId && !showId) {
      return NextResponse.json(
        { error: 'Either exhibitionId or showId is required' },
        { status: 400 }
      );
    }

    if (!userId && (!guestEmail || !guestPhone || !guestName)) {
      return NextResponse.json(
        { error: 'User authentication or guest details required' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = tickets.reduce(
      (sum: number, ticket: any) => sum + ticket.quantity * ticket.unitPrice,
      0
    );

    // Generate unique booking reference
    const bookingReference = `MGM${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Check slot availability
    const { data: slotData, error: slotError } = await supabase
      .from('time_slots')
      .select('capacity')
      .eq('id', timeSlotId)
      .single();

    if (slotError || !slotData) {
      return NextResponse.json(
        { error: 'Invalid time slot' },
        { status: 400 }
      );
    }

    // Check current bookings for this slot on this date
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('time_slot_id', timeSlotId)
      .eq('booking_date', bookingDate)
      .in('status', ['pending', 'confirmed']);

    const totalTicketsRequested = tickets.reduce(
      (sum: number, ticket: any) => sum + ticket.quantity,
      0
    );

    // Get or create slot availability record
    const { data: availability } = await supabase
      .from('slot_availability')
      .select('*')
      .eq('time_slot_id', timeSlotId)
      .eq('date', bookingDate)
      .single();

    const currentBooked = availability?.booked_count || 0;
    const availableCapacity = availability?.available_capacity || slotData.capacity;

    if (currentBooked + totalTicketsRequested > availableCapacity) {
      return NextResponse.json(
        { error: 'Not enough seats available', availableSeats: availableCapacity - currentBooked },
        { status: 400 }
      );
    }

    // Create booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_reference: bookingReference,
        user_id: userId || null,
        guest_email: guestEmail || null,
        guest_phone: guestPhone || null,
        guest_name: guestName || null,
        exhibition_id: exhibitionId || null,
        show_id: showId || null,
        booking_date: bookingDate,
        time_slot_id: timeSlotId,
        status: 'pending',
        payment_status: 'pending',
        total_amount: totalAmount,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking', details: bookingError?.message },
        { status: 500 }
      );
    }

    // Create booking tickets
    const ticketInserts = tickets.map((ticket: any) => ({
      booking_id: booking.id,
      category_id: ticket.categoryId,
      quantity: ticket.quantity,
      unit_price: ticket.unitPrice,
      subtotal: ticket.quantity * ticket.unitPrice,
    }));

    const { error: ticketsError } = await supabase
      .from('booking_tickets')
      .insert(ticketInserts);

    if (ticketsError) {
      console.error('Error creating booking tickets:', ticketsError);
      // Rollback booking
      await supabase.from('bookings').delete().eq('id', booking.id);
      return NextResponse.json(
        { error: 'Failed to create booking tickets' },
        { status: 500 }
      );
    }

    // Update slot availability
    if (availability) {
      await supabase
        .from('slot_availability')
        .update({ booked_count: currentBooked + totalTicketsRequested })
        .eq('id', availability.id);
    } else {
      await supabase.from('slot_availability').insert({
        time_slot_id: timeSlotId,
        date: bookingDate,
        available_capacity: slotData.capacity,
        booked_count: totalTicketsRequested,
      });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // Convert to paise
      currency: 'INR',
      receipt: bookingReference,
      notes: {
        booking_id: booking.id,
        booking_reference: bookingReference,
        exhibition_id: exhibitionId || '',
        show_id: showId || '',
      },
    });

    // Store payment details
    await supabase.from('payments').insert({
      booking_id: booking.id,
      razorpay_order_id: razorpayOrder.id,
      amount: totalAmount,
      currency: 'INR',
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        reference: bookingReference,
        totalAmount,
      },
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    });
  } catch (error: any) {
    console.error('Error in create booking API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
