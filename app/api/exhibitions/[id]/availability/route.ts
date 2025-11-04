// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch available dates and time slots for an exhibition
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const supabase = createClient();

    // Check if id is a UUID or a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    // Get exhibition ID
    let query = supabase
      .from('exhibitions')
      .select('id');

    // Use id or slug based on format
    if (isUUID) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }

    const { data: exhibition, error: exhibitionError } = await query.single();

    if (exhibitionError || !exhibition) {
      return NextResponse.json(
        { error: 'Exhibition not found' },
        { status: 404 }
      );
    }

    if (date) {
      // Fetch available slots for specific date
      const { data: slots, error } = await supabase
        .rpc('get_available_slots_for_exhibition', {
          p_exhibition_id: exhibition.id,
          p_date: date,
        });

      if (error) {
        console.error('Error fetching available slots:', error);
        return NextResponse.json(
          { error: 'Failed to fetch available slots', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ date, slots: slots || [] });
    } else {
      // Fetch available dates for next 90 days
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 90);

      const { data: schedules, error } = await supabase
        .from('exhibition_schedules')
        .select('date, is_available, max_capacity')
        .eq('exhibition_id', exhibition.id)
        .eq('is_available', true)
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching schedules:', error);
        return NextResponse.json(
          { error: 'Failed to fetch schedules', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ availableDates: schedules || [] });
    }
  } catch (error: any) {
    console.error('Error in availability API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
