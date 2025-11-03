import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    
    // Get request body
    const body = await request.json();
    const { items } = body;

    // Validate required fields
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, message: 'Invalid items array' },
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

    const syncedItems: any[] = [];
    const skippedItems: Array<{ item: any; reason: string }> = [];

    // Process each guest cart item
    for (const item of items) {
      try {
        // Check if item is expired
        const expiresAt = new Date(item.expiresAt);
        if (expiresAt < new Date()) {
          skippedItems.push({ item, reason: 'Item expired' });
          continue;
        }

        // Check time slot availability
        const { data: timeSlot, error: slotError } = await supabase
          .from('time_slots')
          .select('*')
          .eq('id', item.timeSlotId)
          .single();

        if (slotError || !timeSlot) {
          skippedItems.push({ item, reason: 'Time slot not found' });
          continue;
        }

        // Calculate available capacity
        const availableCapacity = 
          timeSlot.capacity - 
          (timeSlot.current_bookings || 0) - 
          (timeSlot.buffer_capacity || 5);

        if (availableCapacity < item.totalTickets) {
          skippedItems.push({ item, reason: 'Insufficient capacity' });
          continue;
        }

        // Reserve seats
        const { error: updateError } = await supabase
          .from('time_slots')
          .update({ 
            current_bookings: (timeSlot.current_bookings || 0) + item.totalTickets 
          })
          .eq('id', item.timeSlotId);

        if (updateError) {
          skippedItems.push({ item, reason: 'Failed to reserve seats' });
          continue;
        }

        // Fetch exhibition/show name
        let exhibitionName: string | undefined;
        let showName: string | undefined;

        if (item.exhibitionId) {
          const { data: exhibition } = await supabase
            .from('exhibitions')
            .select('name')
            .eq('id', item.exhibitionId)
            .single();
          exhibitionName = exhibition?.name;
        }

        if (item.showId) {
          const { data: show } = await supabase
            .from('shows')
            .select('name')
            .eq('id', item.showId)
            .single();
          showName = show?.name;
        }

        // Insert into cart_items with new expiration (15 min from now)
        const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        
        const { data: cartItem, error: insertError } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            time_slot_id: item.timeSlotId,
            exhibition_id: item.exhibitionId,
            show_id: item.showId,
            exhibition_name: exhibitionName || item.exhibitionName,
            show_name: showName || item.showName,
            booking_date: item.bookingDate,
            adult_tickets: item.tickets.adult || 0,
            child_tickets: item.tickets.child || 0,
            student_tickets: item.tickets.student || 0,
            senior_tickets: item.tickets.senior || 0,
            total_tickets: item.totalTickets,
            subtotal: item.subtotal || 0,
            expires_at: newExpiresAt.toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          // Rollback seat reservation
          await supabase
            .from('time_slots')
            .update({ 
              current_bookings: Math.max(0, (timeSlot.current_bookings || 0) - item.totalTickets)
            })
            .eq('id', item.timeSlotId);

          skippedItems.push({ item, reason: 'Failed to save to database' });
          continue;
        }

        syncedItems.push(cartItem);
      } catch (error: any) {
        skippedItems.push({ item, reason: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      syncedItems,
      skippedItems,
      message: `Synced ${syncedItems.length} items, skipped ${skippedItems.length} items`,
    });
  } catch (error: any) {
    console.error('Error syncing cart:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
