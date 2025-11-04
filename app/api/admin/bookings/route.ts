import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Filters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const search = searchParams.get('search');

    const supabase = getServiceSupabase();

    // Build query
    let query = supabase
      .from('bookings')
      .select(`
        *,
        exhibition:exhibitions(name),
        show:shows(name),
        time_slot:time_slots(start_time, end_time)
      `, { count: 'exact' });

    // Apply filters
    if (startDate) {
      query = query.gte('booking_date', startDate);
    }
    if (endDate) {
      query = query.lte('booking_date', endDate);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }
    if (search) {
      query = query.or(`booking_reference.ilike.%${search}%,visitor_name.ilike.%${search}%,visitor_email.ilike.%${search}%`);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: bookings, error, count } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    // Format response
    const formattedBookings = bookings?.map((booking) => ({
      ...booking,
      exhibitionName: booking.exhibition?.name,
      showName: booking.show?.name,
      timeSlot: booking.time_slot
        ? `${booking.time_slot.start_time} - ${booking.time_slot.end_time}`
        : 'N/A',
    }));

    return NextResponse.json({
      success: true,
      bookings: formattedBookings,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Error in admin bookings API:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
