// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth/admin-auth';

// GET - Fetch time slots for an exhibition
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError, supabase } = await verifyAdminAuth();
    if (authError) return authError;

    const { id } = await params;

    const { data: timeSlots, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('exhibition_id', id)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching time slots:', error);
      return NextResponse.json(
        { error: 'Failed to fetch time slots', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ timeSlots: timeSlots || [] });
  } catch (error: any) {
    console.error('Error in time slots API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new time slot
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
      startTime,
      endTime,
      capacity,
      dayOfWeek = null,
      active = true,
    } = body;

    if (!startTime || !endTime || !capacity) {
      return NextResponse.json(
        { error: 'Missing required fields: startTime, endTime, capacity' },
        { status: 400 }
      );
    }

    const { data: timeSlot, error } = await supabase
      .from('time_slots')
      .insert({
        exhibition_id: id,
        start_time: startTime,
        end_time: endTime,
        capacity,
        day_of_week: dayOfWeek,
        active,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating time slot:', error);
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
    console.error('Error in create time slot API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update time slot
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
    if (updates.startTime) updateData.start_time = updates.startTime;
    if (updates.endTime) updateData.end_time = updates.endTime;
    if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
    if (updates.dayOfWeek !== undefined) updateData.day_of_week = updates.dayOfWeek;
    if (updates.active !== undefined) updateData.active = updates.active;

    const { data: timeSlot, error } = await supabase
      .from('time_slots')
      .update(updateData)
      .eq('id', slotId)
      .eq('exhibition_id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating time slot:', error);
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
    console.error('Error in update time slot API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete time slot
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

    const { error } = await supabase
      .from('time_slots')
      .delete()
      .eq('id', slotId)
      .eq('exhibition_id', id);

    if (error) {
      console.error('Error deleting time slot:', error);
      return NextResponse.json(
        { error: 'Failed to delete time slot', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Time slot deleted successfully',
    });
  } catch (error: any) {
    console.error('Error in delete time slot API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
