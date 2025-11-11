import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { startOfToday, endOfToday, subDays, startOfDay, endOfDay } from 'date-fns';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date();
    const todayStart = startOfToday();
    const todayEnd = endOfToday();
    const yesterdayStart = startOfDay(subDays(today, 1));
    const yesterdayEnd = endOfDay(subDays(today, 1));

    // Fetch today's bookings
    const { data: todayBookings, count: todayBookingsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact' })
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString())
      .eq('payment_status', 'paid');

    // Fetch yesterday's bookings for comparison
    const { count: yesterdayBookingsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterdayStart.toISOString())
      .lte('created_at', yesterdayEnd.toISOString())
      .eq('payment_status', 'paid');

    // Calculate today's revenue
    const todayRevenue = todayBookings?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;

    // Fetch yesterday's revenue for comparison
    const { data: yesterdayBookings } = await supabase
      .from('bookings')
      .select('total_amount')
      .gte('created_at', yesterdayStart.toISOString())
      .lte('created_at', yesterdayEnd.toISOString())
      .eq('payment_status', 'paid');

    const yesterdayRevenue = yesterdayBookings?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;

    // Fetch today's visitors (count tickets)
    const todayBookingIds = todayBookings?.map(b => b.id) || [];
    const { data: todayTickets } = await supabase
      .from('booking_tickets')
      .select('quantity')
      .in('booking_id', todayBookingIds);

    const todayVisitors = todayTickets?.reduce((sum, t) => sum + t.quantity, 0) || 0;

    // Fetch yesterday's visitors for comparison
    const { data: yesterdayBookingsData } = await supabase
      .from('bookings')
      .select('id')
      .gte('created_at', yesterdayStart.toISOString())
      .lte('created_at', yesterdayEnd.toISOString())
      .eq('payment_status', 'paid');

    const yesterdayBookingIds = yesterdayBookingsData?.map(b => b.id) || [];
    const { data: yesterdayTickets } = await supabase
      .from('booking_tickets')
      .select('quantity')
      .in('booking_id', yesterdayBookingIds);

    const yesterdayVisitors = yesterdayTickets?.reduce((sum, t) => sum + t.quantity, 0) || 0;

    // Fetch active exhibitions count
    const { count: activeExhibitionsCount } = await supabase
      .from('exhibitions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Fetch recent bookings (last 5)
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        guest_name,
        guest_email,
        total_amount,
        status,
        booking_date,
        created_at,
        users:user_id (
          full_name,
          email
        ),
        exhibitions:exhibition_id (
          name
        )
      `)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch today's time slots with bookings
    const { data: todayTimeSlots } = await supabase
      .from('time_slots')
      .select(`
        id,
        start_time,
        end_time,
        capacity,
        current_bookings,
        exhibitions:exhibition_id (
          name
        )
      `)
      .eq('slot_date', today.toISOString().split('T')[0])
      .eq('active', true)
      .order('start_time', { ascending: true })
      .limit(3);

    // Calculate growth percentages
    const bookingsGrowth = yesterdayBookingsCount && yesterdayBookingsCount > 0
      ? Math.round(((todayBookingsCount || 0) - yesterdayBookingsCount) / yesterdayBookingsCount * 100)
      : 0;

    const revenueGrowth = yesterdayRevenue > 0
      ? Math.round((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100)
      : 0;

    const visitorsGrowth = yesterdayVisitors > 0
      ? Math.round((todayVisitors - yesterdayVisitors) / yesterdayVisitors * 100)
      : 0;

    return NextResponse.json({
      stats: {
        todayBookings: {
          value: todayBookingsCount || 0,
          change: bookingsGrowth,
          trending: bookingsGrowth >= 0 ? 'up' : 'down',
          footer: `${Math.abs((todayBookingsCount || 0) - (yesterdayBookingsCount || 0))} ${bookingsGrowth >= 0 ? 'more' : 'less'} than yesterday`,
        },
        todayRevenue: {
          value: todayRevenue,
          change: revenueGrowth,
          trending: revenueGrowth >= 0 ? 'up' : 'down',
          footer: revenueGrowth >= 0 ? 'Above daily target' : 'Below daily target',
        },
        totalVisitors: {
          value: todayVisitors,
          change: visitorsGrowth,
          trending: visitorsGrowth >= 0 ? 'up' : 'down',
          footer: `${todayVisitors} visitors today`,
        },
        activeExhibitions: {
          value: activeExhibitionsCount || 0,
          change: 0,
          trending: 'up',
          footer: `${activeExhibitionsCount || 0} exhibitions active`,
        },
      },
      recentBookings: recentBookings?.map(booking => ({
        id: booking.id,
        reference: booking.booking_reference,
        customer: booking.guest_name || booking.users?.full_name || 'Guest',
        exhibition: booking.exhibitions?.name || 'N/A',
        date: booking.booking_date,
        amount: Number(booking.total_amount),
        status: booking.status,
      })) || [],
      todayShows: todayTimeSlots?.map(slot => ({
        name: slot.exhibitions?.name || 'Unknown',
        time: slot.start_time.substring(0, 5), // HH:MM
        capacity: slot.capacity,
        booked: slot.current_bookings || 0,
      })) || [],
    });
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
