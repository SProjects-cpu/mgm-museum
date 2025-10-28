// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';

// GET - Fetch all events for admin
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let query = supabase
      .from('events')
      .select(`
        *,
        event_registrations(count)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status as any);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    // Calculate registered count for each event
    const eventsWithCount = events?.map((event: any) => ({
      ...event,
      registeredCount: event.event_registrations?.[0]?.count || 0
    })) || [];

    return NextResponse.json({ events: eventsWithCount });
  } catch (error) {
    console.error('Error in events API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new event
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      title,
      description,
      eventDate,
      startTime,
      endTime,
      location,
      maxParticipants,
      registrationRequired = true,
      featuredImage,
      status = 'upcoming',
      bookingEnabled = true
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Event title is required' },
        { status: 400 }
      );
    }
    if (!eventDate) {
      return NextResponse.json(
        { error: 'Event date is required' },
        { status: 400 }
      );
    }
    if (!startTime) {
      return NextResponse.json(
        { error: 'Start time is required' },
        { status: 400 }
      );
    }
    if (!endTime) {
      return NextResponse.json(
        { error: 'End time is required' },
        { status: 400 }
      );
    }
    if (!location) {
      return NextResponse.json(
        { error: 'Event location is required' },
        { status: 400 }
      );
    }

    // Validate time format
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM format' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(eventDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = slugify(title);

    // Check if slug already exists
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug as any)
      .single();

    if (existingEvent) {
      return NextResponse.json(
        { error: 'Event with this title already exists' },
        { status: 400 }
      );
    }

    // Create event
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        title,
        slug,
        description,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        location,
        max_participants: maxParticipants,
        registration_required: registrationRequired,
        featured_image: featuredImage,
        status
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      event: { ...(event as any), registeredCount: 0 },
      message: 'Event created successfully'
    });
  } catch (error) {
    console.error('Error in create event API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
