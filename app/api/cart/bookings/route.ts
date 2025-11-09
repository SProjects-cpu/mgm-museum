import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
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
      console.error('Auth error:', authError);
      return NextResponse.json(
        { success: false, message: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Fetch pending bookings (cart items)
    const { data: pendingItems, error: pendingError } = await supabase
      .from('cart_items')
      .select(`
        id,
        total_tickets,
        subtotal,
        booking_date,
        adult_tickets,
        child_tickets,
        student_tickets,
        senior_tickets,
        exhibition_id,
        show_id,
        time_slot_id,
        exhibition_name,
        show_name,
        created_at,
        exhibitions:exhibition_id (
          id,
          name,
          slug,
          description,
          images
        ),
        shows:show_id (
          id,
          name,
          slug,
          description
        ),
        time_slots:time_slot_id (
          id,
          start_time,
          end_time,
          slot_date
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (pendingError) {
      console.error('Failed to fetch pending bookings:', pendingError);
      console.error('Pending error details:', JSON.stringify(pendingError, null, 2));
    }

    // Fetch confirmed bookings
    const { data: confirmedBookings, error: confirmedError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        booking_date,
        booking_time,
        guest_name,
        guest_email,
        total_amount,
        status,
        payment_status,
        created_at,
        exhibition_id,
        show_id,
        time_slot_id,
        exhibitions:exhibition_id (
          id,
          name,
          slug,
          description,
          images
        ),
        shows:show_id (
          id,
          name,
          slug,
          description
        ),
        time_slots:time_slot_id (
          id,
          start_time,
          end_time,
          slot_date
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    if (confirmedError) {
      console.error('Failed to fetch confirmed bookings:', confirmedError);
    }

    // Check feedback existence for confirmed bookings
    const bookingIds = confirmedBookings?.map(b => b.id) || [];
    let feedbackMap: Record<string, boolean> = {};

    if (bookingIds.length > 0) {
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('booking_id')
        .in('booking_id', bookingIds);

      if (feedbackData) {
        feedbackMap = feedbackData.reduce((acc, f) => {
          acc[f.booking_id] = true;
          return acc;
        }, {} as Record<string, boolean>);
      }
    }

    // Add has_feedback flag to confirmed bookings
    const confirmedWithFeedback = confirmedBookings?.map(booking => ({
      ...booking,
      has_feedback: feedbackMap[booking.id] || false,
    })) || [];

    return NextResponse.json({
      success: true,
      pending: pendingItems || [],
      confirmed: confirmedWithFeedback,
    });
  } catch (error: any) {
    console.error('Error fetching cart bookings:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
