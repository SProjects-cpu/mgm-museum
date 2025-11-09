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

    // Verify user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('User data:', { userId: user.id, userData, userError });

    if (userError) {
      console.error('Error fetching user role:', userError);
      return NextResponse.json(
        { success: false, message: `Failed to verify admin status: ${userError.message}` },
        { status: 500 }
      );
    }

    if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      console.log('Access denied - user role:', userData?.role);
      return NextResponse.json(
        { success: false, message: `Admin access required. Current role: ${userData?.role || 'none'}` },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const rating = searchParams.get('rating');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const eventType = searchParams.get('event_type');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);

    // Build query
    let query = supabase
      .from('feedback')
      .select(`
        id,
        rating,
        comment,
        created_at,
        bookings:booking_id (
          booking_reference,
          guest_name,
          guest_email,
          booking_date,
          exhibition_id,
          show_id,
          exhibitions:exhibition_id (name),
          shows:show_id (name)
        )
      `, { count: 'exact' });

    // Apply filters
    if (rating) {
      query = query.eq('rating', parseInt(rating));
    }

    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }

    if (toDate) {
      query = query.lte('created_at', toDate);
    }

    // Search by booking reference
    if (search) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .ilike('booking_reference', `%${search}%`);

      if (bookings && bookings.length > 0) {
        const bookingIds = bookings.map(b => b.id);
        query = query.in('booking_id', bookingIds);
      } else {
        // No matching bookings, return empty result
        return NextResponse.json({
          success: true,
          feedbacks: [],
          pagination: {
            total: 0,
            page,
            limit,
            pages: 0,
          },
        });
      }
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: feedbacks, error: feedbackError, count } = await query;

    if (feedbackError) {
      console.error('Failed to fetch feedbacks:', feedbackError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch feedbacks' },
        { status: 500 }
      );
    }

    // Transform data to include event info
    const transformedFeedbacks = feedbacks?.map(feedback => {
      const booking = feedback.bookings as any;
      const eventName = booking?.exhibitions?.name || booking?.shows?.name || 'Unknown Event';
      const eventType = booking?.exhibition_id ? 'exhibition' : 'show';

      return {
        id: feedback.id,
        rating: feedback.rating,
        comment: feedback.comment,
        created_at: feedback.created_at,
        booking: {
          booking_reference: booking?.booking_reference,
          guest_name: booking?.guest_name,
          guest_email: booking?.guest_email,
          booking_date: booking?.booking_date,
        },
        event: {
          name: eventName,
          type: eventType,
        },
      };
    }) || [];

    // Filter by event type if specified
    let filteredFeedbacks = transformedFeedbacks;
    if (eventType) {
      filteredFeedbacks = transformedFeedbacks.filter(f => f.event.type === eventType);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      feedbacks: filteredFeedbacks,
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin feedbacks:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
