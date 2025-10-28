// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * GET /api/bookings-new/time-slots?date=YYYY-MM-DD&exhibitionId=xxx&showId=xxx
 * Get available time slots for a specific date
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const exhibitionId = searchParams.get('exhibitionId');
    const showId = searchParams.get('showId');

    if (!date) {
      return NextResponse.json(
        { error: 'date parameter is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Build query
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
      .eq('slot_date', date)
      .eq('active', true)
      .order('start_time');

    if (exhibitionId) {
      query = query.eq('exhibition_id', exhibitionId);
    } else if (showId) {
      query = query.eq('show_id', showId);
    }

    const { data: timeSlots, error } = await query;

    if (error) {
      console.error('Error fetching time slots:', error);
      return NextResponse.json(
        { error: 'Failed to fetch time slots' },
        { status: 500 }
      );
    }

    // Calculate available capacity and transform to camelCase
    const slotsWithAvailability = (timeSlots || []).map(slot => ({
      id: slot.id,
      slotDate: slot.slot_date,
      startTime: slot.start_time,
      endTime: slot.end_time,
      capacity: slot.capacity,
      currentBookings: slot.current_bookings || 0,
      bufferCapacity: slot.buffer_capacity || 5,
      active: slot.active,
      exhibitionId: slot.exhibition_id,
      showId: slot.show_id,
      availableCapacity: Math.max(
        0,
        slot.capacity - (slot.current_bookings || 0) - (slot.buffer_capacity || 5)
      )
    }));

    return NextResponse.json({
      success: true,
      timeSlots: slotsWithAvailability
    });
  } catch (error) {
    console.error('Time slots API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings-new/time-slots
 * Generate time slots for general admission (when no exhibition/show is specified)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date } = body;

    if (!date) {
      return NextResponse.json(
        { error: 'date is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Check if time slots already exist for this date
    const { data: existing } = await supabase
      .from('time_slots')
      .select('id')
      .eq('slot_date', date)
      .is('exhibition_id', null)
      .is('show_id', null)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Time slots already exist for this date'
      });
    }

    // Check if it's a Monday (closed day)
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    
    if (dayOfWeek === 1) {
      return NextResponse.json({
        success: false,
        error: 'Museum is closed on Mondays'
      }, { status: 400 });
    }

    // Check for capacity override
    const { data: override } = await supabase
      .from('capacity_overrides')
      .select('*')
      .eq('override_date', date)
      .single();

    if (override?.is_closed) {
      return NextResponse.json({
        success: false,
        error: 'Museum is closed on this date'
      }, { status: 400 });
    }

    const capacity = override?.capacity || 50;

    // Generate hourly slots from 10:00 to 16:00
    const slots = [];
    for (let hour = 10; hour <= 16; hour++) {
      slots.push({
        slot_date: date,
        start_time: `${hour.toString().padStart(2, '0')}:00:00`,
        end_time: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
        capacity,
        current_bookings: 0,
        buffer_capacity: 5,
        active: true,
        exhibition_id: null,
        show_id: null
      });
    }

    const { data, error } = await supabase
      .from('time_slots')
      .insert(slots)
      .select();

    if (error) {
      console.error('Error generating time slots:', error);
      return NextResponse.json(
        { error: 'Failed to generate time slots' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      timeSlots: data
    });
  } catch (error) {
    console.error('Generate time slots API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
