// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth/admin-auth';

// GET - Fetch date-specific time slots for an exhibition
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError, supabase } = await verifyAdminAuth();
    if (authError) return authError;

    const { id } = await params;

    // Fetch only date-specific slots (where slot_date is not null)
    const { data: timeSlots, error } = await supabase
      .from('time_slots')
      .select('id, slot_date, start_time, end_time, capacity, current_bookings, active')
      .eq('exhibition_id', id)
      .not('slot_date', 'is', null)
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching date-specific time slots:', error);
      return NextResponse.json(
        { error: 'Failed to fetch time slots', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ timeSlots: timeSlots || [] });
  } catch (error: any) {
    console.error('Error in date-specific time slots API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new date-specific time slot
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError, supabase } = await verifyAdminAuth();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();

    const {
      slotDate,
      startTime,
      endTime,
      capacity,
      active = true,
    } = body;

    if (!slotDate || !startTime || !endTime || !capacity) {
      return NextResponse.json(
        { error: 'Missing required fields: slotDate, startTime, endTime, capacity' },
        { status: 400 }
      );
    }

    // Check for duplicate slot
    const { data: existing } = await supabase
      .from('time_slots')
      .select('id')
      .eq('exhibition_id', id)
      .eq('slot_date', slotDate)
      .eq('start_time', startTime)
      .eq('end_time', endTime)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A time slot already exists for this date and time' },
        { status: 400 }
      );
    }

    const { data: timeSlot, error } = await supabase
      .from('time_slots')
      .insert({
        exhibition_id: id,
        slot_date: slotDate,
        start_time: startTime,
        end_time: endTime,
        capacity,
        current_bookings: 0,
        active,
        day_of_week: null, // Not a template slot
      })
      .select('id, slot_date, start_time, end_time, capacity, current_bookings, active')
      .single();

    if (error) {
      console.error('Error creating date-specific time slot:', error);
      return NextResponse.json(
        { error: 'Failed to create time slot', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      timeSlot,
      message: 'Time slot created successfully',
    });
  } catch (error: any) {
    console.error('Error in create date-specific time slot API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update date-specific time slot
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError, supabase } = await verifyAdminAuth();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const { slotId, ...updates } = body;

    if (!slotId) {
      return NextResponse.json(
        { error: 'Slot ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (updates.slotDate) updateData.slot_date = updates.slotDate;
    if (updates.startTime) updateData.start_time = updates.startTime;
    if (updates.endTime) updateData.end_time = updates.endTime;
    if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
    if (updates.active !== undefined) updateData.active = updates.active;

    const { data: timeSlot, error } = await supabase
      .from('time_slots')
      .update(updateData)
      .eq('id', slotId)
      .eq('exhibition_id', id)
      .select('id, slot_date, start_time, end_time, capacity, current_bookings, active')
      .single();

    if (error) {
      console.error('Error updating date-specific time slot:', error);
      return NextResponse.json(
        { error: 'Failed to update time slot', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      timeSlot,
      message: 'Time slot updated successfully',
    });
  } catch (error: any) {
    console.error('Error in update date-specific time slot API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete date-specific time slot
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError, supabase } = await verifyAdminAuth();
    if (authError) return authError;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get('slotId');

    if (!slotId) {
      return NextResponse.json(
        { error: 'Slot ID is required' },
        { status: 400 }
      );
    }

    // Check if slot has bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('time_slot_id', slotId)
      .limit(1);

    if (bookings && bookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete time slot with existing bookings' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('time_slots')
      .delete()
      .eq('id', slotId)
      .eq('exhibition_id', id);

    if (error) {
      console.error('Error deleting date-specific time slot:', error);
      return NextResponse.json(
        { error: 'Failed to delete time slot', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Time slot deleted successfully',
    });
  } catch (error: any) {
    console.error('Error in delete date-specific time slot API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
