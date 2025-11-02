// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch all schedule overrides for an exhibition
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();

    const { data: schedules, error } = await supabase
      .from('schedule_overrides')
      .select('*')
      .eq('exhibition_id', id as any)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching schedule overrides:', error);
      return NextResponse.json(
        { error: 'Failed to fetch schedule overrides', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      schedules: schedules || [] 
    });
  } catch (error: any) {
    console.error('Error in schedule GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new schedule override
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const body = await request.json();

    const { date, capacity, available = true, notes } = body;

    // Validate required fields
    if (!date) {
      return NextResponse.json(
        { error: 'Missing required field: date' },
        { status: 400 }
      );
    }

    // Check if schedule override for this date already exists
    const { data: existing } = await supabase
      .from('schedule_overrides')
      .select('id')
      .eq('exhibition_id', id as any)
      .eq('date', date as any)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Schedule override for this date already exists' },
        { status: 400 }
      );
    }

    // Create schedule override
    const { data: schedule, error } = await supabase
      .from('schedule_overrides')
      .insert({
        exhibition_id: id,
        date,
        capacity: capacity || null,
        available,
        notes: notes || null
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating schedule override:', error);
      return NextResponse.json(
        { error: 'Failed to create schedule override', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      schedule,
      message: 'Schedule override created successfully'
    });
  } catch (error: any) {
    console.error('Error in schedule POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update existing schedule override
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    const scheduleId = searchParams.get('scheduleId');

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (body.capacity !== undefined) updateData.capacity = body.capacity;
    if (body.available !== undefined) updateData.available = body.available;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // Update schedule override
    const { data: schedule, error } = await supabase
      .from('schedule_overrides')
      .update(updateData as any)
      .eq('id', scheduleId as any)
      .eq('exhibition_id', id as any)
      .select()
      .single();

    if (error) {
      console.error('Error updating schedule override:', error);
      return NextResponse.json(
        { error: 'Failed to update schedule override', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      schedule,
      message: 'Schedule override updated successfully'
    });
  } catch (error: any) {
    console.error('Error in schedule PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove schedule override
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const scheduleId = searchParams.get('scheduleId');

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('schedule_overrides')
      .delete()
      .eq('id', scheduleId as any)
      .eq('exhibition_id', id as any);

    if (error) {
      console.error('Error deleting schedule override:', error);
      return NextResponse.json(
        { error: 'Failed to delete schedule override', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Schedule override deleted successfully'
    });
  } catch (error: any) {
    console.error('Error in schedule DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
