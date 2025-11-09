import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const { error: authError, supabase } = await verifyAdminAuth();
    if (authError) return authError;

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
