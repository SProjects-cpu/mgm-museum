// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch events for public display
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let query = supabase
      .from('events')
      .select(`
        id,
        title,
        slug,
        description,
        event_date,
        start_time,
        end_time,
        location,
        max_participants,
        registration_required,
        featured_image,
        status,
        booking_enabled,
        created_at,
        event_registrations(count)
      `)
      .order('event_date', { ascending: true });

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    } else {
      // Default: only show upcoming and ongoing events
      query = query.in('status', ['upcoming', 'ongoing']);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    // Calculate registered count and format response
    const formattedEvents = events?.map((event: any) => ({
      id: event.id,
      title: event.title,
      slug: event.slug,
      description: event.description,
      eventDate: event.event_date,
      startTime: event.start_time,
      endTime: event.end_time,
      location: event.location,
      maxParticipants: event.max_participants,
      registrationRequired: event.registration_required,
      featuredImage: event.featured_image,
      status: event.status,
      bookingEnabled: event.booking_enabled,
      registeredCount: event.event_registrations?.[0]?.count || 0,
      createdAt: event.created_at
    })) || [];

    return NextResponse.json({ events: formattedEvents });
  } catch (error) {
    console.error('Error in events API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
