import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

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

    // Query cart_items with time_slots joined
    const { data: cartItems, error: fetchError } = await supabase
      .from('cart_items')
      .select(`
        *,
        time_slots (
          id,
          slot_date,
          start_time,
          end_time,
          capacity,
          current_bookings,
          buffer_capacity,
          active
        )
      `)
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (fetchError) {
      return NextResponse.json(
        { success: false, message: 'Failed to load cart' },
        { status: 500 }
      );
    }

    // Transform database records to CartItem format
    const items = (cartItems || []).map((item: any) => ({
      id: item.id,
      timeSlotId: item.time_slot_id,
      exhibitionId: item.exhibition_id,
      showId: item.show_id,
      exhibitionName: item.exhibition_name,
      showName: item.show_name,
      bookingDate: item.booking_date,
      timeSlot: {
        id: item.time_slots.id,
        slotDate: item.time_slots.slot_date,
        startTime: item.time_slots.start_time,
        endTime: item.time_slots.end_time,
        capacity: item.time_slots.capacity,
        currentBookings: item.time_slots.current_bookings,
        bufferCapacity: item.time_slots.buffer_capacity,
        availableCapacity: item.time_slots.capacity - item.time_slots.current_bookings - item.time_slots.buffer_capacity,
        active: item.time_slots.active,
      },
      tickets: {
        adult: item.adult_tickets,
        child: item.child_tickets,
        student: item.student_tickets,
        senior: item.senior_tickets,
      },
      totalTickets: item.total_tickets,
      subtotal: parseFloat(item.subtotal),
      expiresAt: item.expires_at,
      createdAt: item.created_at,
    }));

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error: any) {
    console.error('Error loading cart:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
