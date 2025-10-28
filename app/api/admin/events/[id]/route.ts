// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';
import type { Database } from '@/types/database';

// GET - Fetch single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();

    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        event_registrations(count)
      `)
      .eq('id', id as any)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const eventWithCount = {
      ...(event as any),
      registeredCount: (event as any)?.event_registrations?.[0]?.count || 0
    };

    return NextResponse.json({ event: eventWithCount });
  } catch (error) {
    console.error('Error in get event API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      registrationRequired,
      featuredImage,
      status,
      bookingEnabled
    } = body;

    // Validate required fields
    if (!title || !eventDate || !startTime || !endTime || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate new slug if title changed
    const slug = slugify(title);

    // Check if slug already exists (excluding current event)
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug as any)
      .neq('id', id as any)
      .single();

    if (existingEvent) {
      return NextResponse.json(
        { error: 'Event with this title already exists' },
        { status: 400 }
      );
    }

    // Update event
    const { data: event, error } = await supabase
      .from('events')
      .update({
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
      .eq('id', id as any)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return NextResponse.json(
        { error: 'Failed to update event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      event,
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('Error in update event API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();

    // Check if event has registrations
    const { data: registrations } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', id as any)
      .limit(1);

    if (registrations && registrations.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete event with existing registrations. Cancel the event instead.' },
        { status: 400 }
      );
    }

    // Delete event
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id as any);

    if (error) {
      console.error('Error deleting event:', error);
      return NextResponse.json(
        { error: 'Failed to delete event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete event API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
