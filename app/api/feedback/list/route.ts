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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('booking_id');

    // Build query
    let query = supabase
      .from('feedback')
      .select(`
        id,
        booking_id,
        rating,
        comment,
        created_at,
        bookings:booking_id (
          booking_reference,
          guest_name,
          booking_date,
          exhibitions:exhibition_id (name),
          shows:show_id (name)
        )
      `)
      .eq('user_id', user.id);

    // Filter by booking_id if provided
    if (bookingId) {
      query = query.eq('booking_id', bookingId);
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    const { data: feedback, error: feedbackError } = await query;

    if (feedbackError) {
      console.error('Failed to fetch feedback:', feedbackError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback: feedback || [],
    });
  } catch (error: any) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
