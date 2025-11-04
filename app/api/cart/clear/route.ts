import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Create Supabase client with user's auth token
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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Fetch all user's cart items
    const { data: cartItems, error: fetchError } = await supabase
      .from('cart_items')
      .select('id, time_slot_id, total_tickets')
      .eq('user_id', user.id);

    if (fetchError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch cart items' },
        { status: 500 }
      );
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({
        success: true,
        itemsCleared: 0,
        message: 'Cart is already empty',
      });
    }

    // Release seats for each cart item
    for (const item of cartItems) {
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
    }

    // Delete all cart items for the user
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, message: 'Failed to clear cart' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      itemsCleared: cartItems.length,
      message: 'Cart cleared successfully',
    });
  } catch (error: any) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
