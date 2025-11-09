import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { format, subDays, startOfDay, endOfDay, startOfToday, startOfTomorrow, endOfTomorrow } from 'date-fns';
import { verifyAdminAuth } from '@/lib/auth/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const { error: authError, supabase } = await verifyAdminAuth();
    if (authError) return authError;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const dateRange = searchParams.get('dateRange') || 'all';
    const customStartDate = searchParams.get('startDate');
    const customEndDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Calculate date range
    let startDate: Date;
    let endDate: Date;

    switch (dateRange) {
      case 'today':
        startDate = startOfToday();
        endDate = endOfDay(new Date());
        break;
      case 'tomorrow':
        startDate = startOfTomorrow();
        endDate = endOfTomorrow();
        break;
      case 'last_week':
        startDate = startOfDay(subDays(new Date(), 7));
        endDate = endOfDay(new Date());
        break;
      case 'last_month':
        startDate = startOfDay(subDays(new Date(), 30));
        endDate = endOfDay(new Date());
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) {
          return NextResponse.json(
            { error: 'Custom date range requires startDate and endDate parameters' },
            { status: 400 }
          );
        }
        startDate = startOfDay(new Date(customStartDate));
        endDate = endOfDay(new Date(customEndDate));
        break;
      default: // 'all'
        startDate = new Date('2020-01-01'); // Far past date
        endDate = new Date('2030-12-31'); // Far future date
    }

    // Log the date range being used
    console.log('[Bookings API] Date range:', {
      dateRange,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status,
      sortBy,
      sortOrder
    });

    // Build the query
    let query = supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        guest_name,
        guest_email,
        guest_phone,
        user_id,
        booking_date,
        time_slot_id,
        total_amount,
        status,
        payment_id,
        payment_details,
        created_at,
        users:user_id (
          full_name,
          email,
          phone
        ),
        tickets (
          ticket_number
        ),
        time_slots:time_slot_id (
          start_time,
          end_time
        )
      `, { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Add status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Add search filter
    if (search) {
      query = query.or(`booking_reference.ilike.%${search}%,guest_name.ilike.%${search}%,guest_email.ilike.%${search}%`);
    }

    // Add sorting
    const validSortColumns = ['created_at', 'booking_date', 'total_amount', 'status', 'booking_reference'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Add pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: bookingsData, error: bookingsError, count } = await query as any;

    if (bookingsError) {
      console.error('[Bookings API] Error fetching bookings:', bookingsError);
      return NextResponse.json(
        { error: 'Failed to fetch bookings', details: bookingsError.message },
        { status: 500 }
      );
    }

    console.log('[Bookings API] Found bookings:', {
      count,
      returned: bookingsData?.length || 0
    });

    // Transform data to match the expected format
    const bookings = bookingsData?.map(booking => {
      const visitorName = booking.guest_name || booking.users?.full_name || 'N/A';
      const visitorEmail = booking.guest_email || booking.users?.email || 'N/A';
      const visitorPhone = booking.guest_phone || booking.users?.phone || 'N/A';
      const ticketNumber = booking.tickets?.[0]?.ticket_number || 'N/A';
      // Get Razorpay ID from payment_id field (not payment_details)
      const razorpayId = booking.payment_id || booking.payment_details?.razorpay_payment_id || 'N/A';
      const visitTimeSlot = booking.time_slots 
        ? `${booking.time_slots.start_time} - ${booking.time_slots.end_time}`
        : 'N/A';
      // Count tickets from the tickets array (not booking_tickets table)
      const numberOfTickets = booking.tickets?.length || 0;

      return {
        id: booking.id,
        visitorName,
        visitorEmail,
        visitorPhone,
        bookingReference: booking.booking_reference,
        ticketNumber,
        razorpayId,
        visitDate: booking.booking_date,
        visitTimeSlot,
        numberOfTickets,
        amountPaid: booking.total_amount,
        status: booking.status,
        bookingTimestamp: booking.created_at,
      };
    }) || [];

    // Calculate pagination
    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      bookings,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages,
      },
      filters: {
        dateRange,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        status: status || 'all',
        search: search || '',
      }
    });

  } catch (error: any) {
    console.error('[Bookings API] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
