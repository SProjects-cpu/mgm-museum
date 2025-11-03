import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    
    // Get request body
    const body = await request.json();
    const {
      timeSlotId,
      bookingDate,
      exhibitionId,
      showId,
      tickets,
      totalTickets,
    } = body;

    // Validate required fields
    if (!timeSlotId || !bookingDate || !totalTickets) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate ticket quantities
    if (totalTickets <= 0) {
      return NextResponse.json(
        { success: false, message: 'Total tickets must be greater than 0' },
        { status: 400 }
      );
    }

    // Get authenticated user from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract user from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Check time slot availability
    const { data: timeSlot, error: slotError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', timeSlotId)
      .single();

    if (slotError || !timeSlot) {
      return NextResponse.json(
        { success: false, message: 'Time slot not found' },
        { status: 404 }
      );
    }

    // Calculate available capacity
    const availableCapacity = 
      timeSlot.capacity - 
      (timeSlot.current_bookings || 0) - 
      (timeSlot.buffer_capacity || 5);

    if (availableCapacity < totalTickets) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Insufficient capacity. Only ${availableCapacity} seats available` 
        },
        { status: 409 }
      );
    }

    // Reserve seats by incrementing current_bookings
    const { error: updateError } = await supabase
      .from('time_slots')
      .update({ 
        current_bookings: (timeSlot.current_bookings || 0) + totalTickets 
      })
      .eq('id', timeSlotId);

    if (updateError) {
      return NextResponse.json(
        { success: false, message: 'Failed to reserve seats' },
        { status: 500 }
      );
    }

    // Fetch exhibition/show name for denormalization
    let exhibitionName: string | undefined;
    let showName: string | undefined;

    if (exhibitionId) {
      const { data: exhibition } = await supabase
        .from('exhibitions')
        .select('name')
        .eq('id', exhibitionId)
        .single();
      exhibitionName = exhibition?.name;
    }

    if (showId) {
      const { data: show } = await supabase
        .from('shows')
        .select('name')
        .eq('id', showId)
        .single();
      showName = show?.name;
    }

    // Insert into cart_items table with 15-minute expiration
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    const { data: cartItem, error: insertError } = await supabase
      .from('cart_items')
      .insert({
        user_id: user.id,
        time_slot_id: timeSlotId,
        exhibition_id: exhibitionId,
        show_id: showId,
        exhibition_name: exhibitionName,
        show_name: showName,
        booking_date: bookingDate,
        adult_tickets: tickets.adult || 0,
        child_tickets: tickets.child || 0,
        student_tickets: tickets.student || 0,
        senior_tickets: tickets.senior || 0,
        total_tickets: totalTickets,
        subtotal: 0, // Will be calculated with pricing
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      // Rollback seat reservation
      await supabase
        .from('time_slots')
        .update({ 
          current_bookings: Math.max(0, (timeSlot.current_bookings || 0) - totalTickets)
        })
        .eq('id', timeSlotId);

      return NextResponse.json(
        { success: false, message: 'Failed to add item to cart' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cartItem,
      message: 'Item added to cart successfully',
    });
  } catch (error: any) {
    console.error('Error adding item to cart:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
