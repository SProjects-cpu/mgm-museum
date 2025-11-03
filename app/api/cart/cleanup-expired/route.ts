import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // Query expired cart items
    const { data: expiredItems, error: fetchError } = await supabase
      .from('cart_items')
      .select('id, time_slot_id, total_tickets')
      .lt('expires_at', new Date().toISOString());

    if (fetchError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch expired items' },
        { status: 500 }
      );
    }

    if (!expiredItems || expiredItems.length === 0) {
      return NextResponse.json({
        success: true,
        cleanedCount: 0,
        message: 'No expired items to clean up',
      });
    }

    let cleanedCount = 0;

    // Process each expired item
    for (const item of expiredItems) {
      try {
        // Release seats
        const { data: timeSlot } = await supabase
          .from('time_slots')
          .select('current_bookings')
          .eq('id', item.time_slot_id)
          .single();

        if (timeSlot) {
          await supabase
            .from('time_slots')
            .update({ 
              current_bookings: Math.max(0, (timeSlot.current_bookings || 0) - item.total_tickets)
            })
            .eq('id', item.time_slot_id);
        }

        // Delete cart item
        const { error: deleteError } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', item.id);

        if (!deleteError) {
          cleanedCount++;
        }
      } catch (error) {
        console.error(`Error cleaning up cart item ${item.id}:`, error);
        // Continue processing remaining items
      }
    }

    return NextResponse.json({
      success: true,
      cleanedCount,
      message: `Cleaned up ${cleanedCount} expired cart items`,
    });
  } catch (error: any) {
    console.error('Error cleaning up expired cart items:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
