// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import { slugify } from '@/lib/utils';

// GET - Fetch all shows
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let query = supabase
      .from('shows')
      .select(`
        *,
        pricing:show_pricing(*),
        time_slots:show_time_slots(*)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    const { data: shows, error } = await query;

    if (error) {
      console.error('Error fetching shows:', error);
      return NextResponse.json(
        { error: 'Failed to fetch shows' },
        { status: 500 }
      );
    }

    return NextResponse.json({ shows: shows || [] });
  } catch (error) {
    console.error('Error in shows API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new show
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();

    const {
      name,
      description,
      type,
      durationMinutes,
      thumbnailUrl,
      trailerUrl,
      status = 'active',
      pricing = [],
      timeSlots = []
    } = body;

    // Validate required fields
    if (!name || !description || !type || !durationMinutes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = slugify(name);

    // Check if slug already exists
    const { data: existingShow } = await supabase
      .from('shows')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingShow) {
      return NextResponse.json(
        { error: 'Show with this name already exists' },
        { status: 400 }
      );
    }

    // Create show
    const { data: show, error: showError } = await supabase
      .from('shows')
      .insert({
        name,
        slug,
        description,
        type,
        duration_minutes: durationMinutes,
        thumbnail_url: thumbnailUrl,
        trailer_url: trailerUrl,
        status
      })
      .select()
      .single();

    if (showError) {
      console.error('Error creating show:', showError);
      return NextResponse.json(
        { error: 'Failed to create show' },
        { status: 500 }
      );
    }

    // Add pricing if provided
    if (pricing.length > 0) {
      const pricingData = pricing.map((p: any) => ({
        show_id: show.id,
        ticket_type: p.ticketType,
        price: p.price,
        active: p.active !== false,
        valid_from: p.validFrom || new Date().toISOString().split('T')[0]
      }));

      await supabase.from('show_pricing').insert(pricingData);
    }

    // Add time slots if provided
    if (timeSlots.length > 0) {
      const slotsData = timeSlots.map((slot: any) => ({
        show_id: show.id,
        start_time: slot.startTime,
        end_time: slot.endTime,
        capacity: slot.capacity || 100,
        active: slot.active !== false
      }));

      await supabase.from('show_time_slots').insert(slotsData);
    }

    return NextResponse.json({ 
      show,
      message: 'Show created successfully'
    });
  } catch (error) {
    console.error('Error in create show API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
