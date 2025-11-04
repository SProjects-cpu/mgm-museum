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
    
    // Get request body
    const body = await request.json();
    const { itemId, timeSlotId, totalTickets } = body;

    // Validate required fields
    if (!itemId || !timeSlotId || !totalTickets) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Delete cart item from database
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, message: 'Failed to remove item from cart' },
        { status: 500 }
      );
    }

    // Release seats by decrementing current_bookings
    // Note: The trigger will handle this automatically, but we do it explicitly for safety
    const { data: timeSlot } = await supabase
      .from('time_slots')
      .select('current_bookings')
      .eq('id', timeSlotId)
      .single();

    if (timeSlot) {
      await supabase
        .from('time_slots')
        .update({ 
          current_bookings: Math.max(0, (timeSlot.current_bookings || 0) - totalTickets)
        })
        .eq('id', timeSlotId);
    }

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart successfully',
    });
  } catch (error: any) {
    console.error('Error removing item from cart:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
