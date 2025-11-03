// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * GET /api/admin/bookings-new
 * Get all bookings with filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const searchTerm = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = getServiceSupabase();

    // Build query
    let query = supabase
      .from('bookings')
      .select(`
        *,
        time_slot:time_slots(
          slot_date,
          start_time,
          end_time
        ),
        exhibition:exhibitions(
          name,
          slug
        ),
        show:shows(
          name,
          slug
        ),
        payment_order:payment_orders!payment_orders_id_fkey(
          razorpay_order_id,
          amount,
          currency,
          status,
          payment_id,
          created_at
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

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
    if (searchTerm) {
      query = query.or(`visitor_name.ilike.%${searchTerm}%,visitor_email.ilike.%${searchTerm}%,booking_reference.ilike.%${searchTerm}%,razorpay_order_id.ilike.%${searchTerm}%,razorpay_payment_id.ilike.%${searchTerm}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: bookings, error, count } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    // Get stats
    const { data: stats } = await supabase
      .from('bookings')
      .select('status, total_tickets, total_amount')
      .gte('booking_date', new Date().toISOString().split('T')[0]);

    const bookingStats = {
      totalBookings: count || 0,
      todayBookings: stats?.filter(b => b.status === 'confirmed').length || 0,
      totalRevenue: stats?.reduce((sum, b) => sum + (parseFloat(b.total_amount?.toString() || '0')), 0) || 0,
      totalTickets: stats?.reduce((sum, b) => sum + (b.total_tickets || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      bookings,
      stats: bookingStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      }
    });
  } catch (error) {
    console.error('Admin bookings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/bookings-new
 * Update booking status
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, status } = body;

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: 'bookingId and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking:', error);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: data
    });
  } catch (error) {
    console.error('Update booking API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
