import { createClient } from '@/lib/supabase/server';
import { format, startOfDay, endOfDay } from 'date-fns';

export interface AnalyticsData {
  revenue: {
    total: number;
    byDate: Array<{ date: string; amount: number }>;
  };
  bookings: {
    total: number;
    byStatus: Record<string, number>;
    byDate: Array<{ date: string; count: number }>;
  };
  visitors: {
    total: number;
    byExhibition: Array<{ name: string; count: number }>;
  };
  topExhibitions: Array<{
    name: string;
    bookings: number;
    revenue: number;
  }>;
  popularTimeSlots: Array<{
    time: string;
    bookings: number;
  }>;
}

export async function fetchAnalyticsData(
  startDate: Date,
  endDate: Date
): Promise<AnalyticsData> {
  const supabase = await createClient();

  const startDateStr = format(startOfDay(startDate), 'yyyy-MM-dd');
  const endDateStr = format(endOfDay(endDate), 'yyyy-MM-dd');

  // Fetch all bookings in date range
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_date,
      total_amount,
      status,
      payment_status,
      created_at,
      exhibition_id,
      exhibitions:exhibition_id (
        id,
        name
      )
    `)
    .gte('booking_date', startDateStr)
    .lte('booking_date', endDateStr)
    .eq('payment_status', 'paid');

  if (bookingsError) {
    console.error('[Analytics] Error fetching bookings:', bookingsError);
    throw new Error('Failed to fetch analytics data');
  }

  // Get ticket counts for each booking
  const bookingIds = bookings?.map(b => b.id) || [];
  const { data: ticketCounts } = await supabase
    .from('booking_tickets')
    .select('booking_id, quantity')
    .in('booking_id', bookingIds);

  const ticketCountMap = new Map<string, number>();
  ticketCounts?.forEach(tc => {
    const current = ticketCountMap.get(tc.booking_id) || 0;
    ticketCountMap.set(tc.booking_id, current + tc.quantity);
  });

  // Calculate revenue
  const totalRevenue = bookings?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;

  // Revenue by date
  const revenueByDateMap = new Map<string, number>();
  bookings?.forEach(b => {
    const date = b.booking_date;
    const current = revenueByDateMap.get(date) || 0;
    revenueByDateMap.set(date, current + Number(b.total_amount));
  });

  const revenueByDate = Array.from(revenueByDateMap.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Bookings by status
  const bookingsByStatus: Record<string, number> = {};
  bookings?.forEach(b => {
    bookingsByStatus[b.status] = (bookingsByStatus[b.status] || 0) + 1;
  });

  // Bookings by date
  const bookingsByDateMap = new Map<string, number>();
  bookings?.forEach(b => {
    const date = b.booking_date;
    bookingsByDateMap.set(date, (bookingsByDateMap.get(date) || 0) + 1);
  });

  const bookingsByDate = Array.from(bookingsByDateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Total visitors (sum of all tickets)
  const totalVisitors = bookings?.reduce((sum, b) => {
    return sum + (ticketCountMap.get(b.id) || 0);
  }, 0) || 0;

  // Visitors by exhibition
  const visitorsByExhibitionMap = new Map<string, { name: string; count: number }>();
  bookings?.forEach(b => {
    if (b.exhibitions) {
      const exhibitionId = b.exhibitions.id;
      const exhibitionName = b.exhibitions.name;
      const tickets = ticketCountMap.get(b.id) || 0;
      
      const current = visitorsByExhibitionMap.get(exhibitionId);
      if (current) {
        current.count += tickets;
      } else {
        visitorsByExhibitionMap.set(exhibitionId, { name: exhibitionName, count: tickets });
      }
    }
  });

  const visitorsByExhibition = Array.from(visitorsByExhibitionMap.values())
    .sort((a, b) => b.count - a.count);

  // Top exhibitions by bookings and revenue
  const exhibitionStatsMap = new Map<string, { name: string; bookings: number; revenue: number }>();
  bookings?.forEach(b => {
    if (b.exhibitions) {
      const exhibitionId = b.exhibitions.id;
      const exhibitionName = b.exhibitions.name;
      
      const current = exhibitionStatsMap.get(exhibitionId);
      if (current) {
        current.bookings += 1;
        current.revenue += Number(b.total_amount);
      } else {
        exhibitionStatsMap.set(exhibitionId, {
          name: exhibitionName,
          bookings: 1,
          revenue: Number(b.total_amount)
        });
      }
    }
  });

  const topExhibitions = Array.from(exhibitionStatsMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Fetch popular time slots
  const { data: timeSlotBookings } = await supabase
    .from('bookings')
    .select(`
      time_slot_id,
      time_slots:time_slot_id (
        start_time,
        end_time
      )
    `)
    .gte('booking_date', startDateStr)
    .lte('booking_date', endDateStr)
    .eq('payment_status', 'paid')
    .not('time_slot_id', 'is', null);

  // Count bookings per time slot
  const timeSlotMap = new Map<string, number>();
  timeSlotBookings?.forEach(booking => {
    if (booking.time_slots) {
      const startTime = booking.time_slots.start_time.substring(0, 5); // Get HH:MM
      timeSlotMap.set(startTime, (timeSlotMap.get(startTime) || 0) + 1);
    }
  });

  const popularTimeSlots = Array.from(timeSlotMap.entries())
    .map(([time, bookings]) => ({ time, bookings }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 6);

  return {
    revenue: {
      total: totalRevenue,
      byDate: revenueByDate,
    },
    bookings: {
      total: bookings?.length || 0,
      byStatus: bookingsByStatus,
      byDate: bookingsByDate,
    },
    visitors: {
      total: totalVisitors,
      byExhibition: visitorsByExhibition,
    },
    topExhibitions,
    popularTimeSlots,
  };
}
