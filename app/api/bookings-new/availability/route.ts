// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * GET /api/bookings-new/availability
 * Get calendar availability for date range
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const exhibitionId = searchParams.get('exhibitionId');
    const showId = searchParams.get('showId');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get daily availability summary
    const { data: dailyAvailability, error: dailyError } = await supabase
      .rpc('get_daily_availability', {
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (dailyError) {
      console.error('Error fetching daily availability:', dailyError);
      return NextResponse.json(
        { error: 'Failed to fetch availability' },
        { status: 500 }
      );
    }

    // Get time slot details for available dates
    // @ts-ignore - Supabase types may be out of sync with actual schema
    let query = supabase
      .from('time_slots')
      .select(`
        id,
        slot_date,
        start_time,
        end_time,
        capacity,
        current_bookings,
        buffer_capacity,
        active,
        exhibition_id,
        show_id
      `)
      .gte('slot_date', startDate)
      .lte('slot_date', endDate)
      .eq('active', true)
      .order('slot_date')
      .order('start_time');

    // Validate UUID format before using in query
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (exhibitionId && uuidRegex.test(exhibitionId)) {
      query = query.eq('exhibition_id', exhibitionId);
    } else if (showId && uuidRegex.test(showId)) {
      query = query.eq('show_id', showId);
    } else if (!exhibitionId && !showId) {
      // If no valid exhibition or show ID, get general admission slots
      query = query.is('exhibition_id', null).is('show_id', null);
    }

    const { data: timeSlots, error: slotsError } = await query;

    if (slotsError) {
      console.error('Error fetching time slots:', slotsError);
      return NextResponse.json(
        { error: 'Failed to fetch time slots' },
        { status: 500 }
      );
    }

    // Transform to camelCase for frontend
    const transformedDailyAvailability = (dailyAvailability || []).map((day: any) => ({
      date: day.date,
      totalSlots: day.total_slots,
      availableSlots: day.available_slots,
      isClosed: day.is_closed,
      capacityStatus: day.capacity_status
    }));

    const transformedTimeSlots = (timeSlots || []).map((slot: any) => ({
      id: slot.id,
      slotDate: slot.slot_date,
      startTime: slot.start_time,
      endTime: slot.end_time,
      capacity: slot.capacity,
      currentBookings: slot.current_bookings || 0,
      bufferCapacity: slot.buffer_capacity || 5,
      availableCapacity: Math.max(
        0,
        slot.capacity - (slot.current_bookings || 0) - (slot.buffer_capacity || 5)
      ),
      active: slot.active,
      itemType: slot.exhibition_id ? 'exhibition' : slot.show_id ? 'show' : 'general',
      itemId: slot.exhibition_id || slot.show_id || null,
      itemName: null // Would need to join with exhibitions/shows table for name
    }));

    return NextResponse.json({
      success: true,
      dailyAvailability: transformedDailyAvailability,
      timeSlots: transformedTimeSlots
    });
  } catch (error) {
    console.error('Availability API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
