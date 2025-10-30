// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch user's booking history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('bookings')
      .select(`
        *,
        time_slot:time_slots(*),
        exhibition:exhibitions(id, name, category),
        show:shows(id, name, type),
        tickets(id, ticket_number, qr_code_data, status)
      `, { count: 'exact' })
      .or(`visitor_email.eq.${user.email},user_id.eq.${user.id}`)
      .order('booking_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: bookings, error: bookingsError, count } = await query;

    if (bookingsError) {
      console.error('Bookings fetch error:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Categorize bookings
    const now = new Date();
    const categorized = {
      upcoming: [],
      completed: [],
      cancelled: [],
      all: bookings || []
    };

    bookings?.forEach(booking => {
      const bookingDate = new Date(booking.booking_date);
      
      if (booking.status === 'cancelled') {
        categorized.cancelled.push(booking);
      } else if (bookingDate > now) {
        categorized.upcoming.push(booking);
      } else {
        categorized.completed.push(booking);
      }
    });

    return NextResponse.json({
      bookings: categorized,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error: any) {
    console.error('User bookings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
