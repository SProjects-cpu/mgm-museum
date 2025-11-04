import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from header first
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Create Supabase client with user's auth token (not service role)
    // This ensures RLS policies work correctly
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    );
    
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

    // Get authenticated user (already verified by client creation above)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { success: false, message: 'Invalid authentication' },
        { status: 401 }
      );
    }

    console.log('Authenticated user:', user.id);

    // Check time slot availability
    const { data: timeSlot, error: slotError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', timeSlotId)
      .single();

    if (slotError) {
      console.error('Error fetching time slot:', slotError);
      return NextResponse.json(
        { success: false, message: `Time slot error: ${slotError.message}`, details: slotError },
        { status: 500 }
      );
    }

    if (!timeSlot) {
      console.error('Time slot not found:', timeSlotId);
      return NextResponse.json(
        { success: false, message: 'Time slot not found' },
        { status: 404 }
      );
    }

    console.log('Time slot found:', { id: timeSlot.id, capacity: timeSlot.capacity, current_bookings: timeSlot.current_bookings });

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
    console.log('Attempting to reserve seats:', { timeSlotId, currentBookings: timeSlot.current_bookings, totalTickets, newBookings: (timeSlot.current_bookings || 0) + totalTickets });
    
    const { data: updateData, error: updateError } = await supabase
      .from('time_slots')
      .update({ 
        current_bookings: (timeSlot.current_bookings || 0) + totalTickets 
      })
      .eq('id', timeSlotId)
      .select();

    if (updateError) {
      console.error('Failed to reserve seats:', updateError);
      return NextResponse.json(
        { success: false, message: `Failed to reserve seats: ${updateError.message}`, details: updateError },
        { status: 500 }
      );
    }

    console.log('Seats reserved successfully:', updateData);

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
    
    const cartItemData = {
      user_id: user.id,
      time_slot_id: timeSlotId,
      exhibition_id: exhibitionId || null,
      show_id: showId || null,
      exhibition_name: exhibitionName || null,
      show_name: showName || null,
      booking_date: bookingDate,
      adult_tickets: tickets.adult || 0,
      child_tickets: tickets.child || 0,
      student_tickets: tickets.student || 0,
      senior_tickets: tickets.senior || 0,
      total_tickets: totalTickets,
      subtotal: 0, // Will be calculated with pricing
      expires_at: expiresAt.toISOString(),
    };

    console.log('Attempting to insert cart item:', cartItemData);
    
    const { data: cartItem, error: insertError } = await supabase
      .from('cart_items')
      .insert(cartItemData)
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert cart item:', insertError);
      
      // Rollback seat reservation
      await supabase
        .from('time_slots')
        .update({ 
          current_bookings: Math.max(0, (timeSlot.current_bookings || 0) - totalTickets)
        })
        .eq('id', timeSlotId);

      return NextResponse.json(
        { success: false, message: `Failed to add item to cart: ${insertError.message}`, details: insertError },
        { status: 500 }
      );
    }

    console.log('Cart item inserted successfully:', cartItem);

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
