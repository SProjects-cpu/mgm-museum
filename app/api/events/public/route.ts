// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type EventStatus = Database['public']['Tables']['events']['Row']['status'];

// GET - Fetch all events for public site
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get('status');

    // Build query based on status parameter
    let events, error;
    
    if (statusParam && statusParam !== 'all') {
      const validStatuses: EventStatus[] = ['upcoming', 'ongoing', 'completed', 'cancelled'];
      if (validStatuses.includes(statusParam as EventStatus)) {
        const result = await supabase
          .from('events')
          .select(`
            *,
            event_registrations(count)
          `)
          .eq('status', statusParam as EventStatus)
          .order('event_date', { ascending: true });
        events = result.data;
        error = result.error;
      } else {
        const result = await supabase
          .from('events')
          .select(`
            *,
            event_registrations(count)
          `)
          .in('status', ['upcoming', 'ongoing'])
          .order('event_date', { ascending: true });
        events = result.data;
        error = result.error;
      }
    } else {
      // By default, only show upcoming and ongoing events
      const result = await supabase
        .from('events')
        .select(`
          *,
          event_registrations(count)
        `)
        .in('status', ['upcoming', 'ongoing'])
        .order('event_date', { ascending: true });
      events = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events', details: error.message },
        { status: 500 }
      );
    }

    // Calculate registered count for each event
    const eventsWithCount = events?.map((event: any) => ({
      ...event,
      registeredCount: event.event_registrations?.[0]?.count || 0
    })) || [];

    return NextResponse.json({ events: eventsWithCount });
  } catch (error: any) {
    console.error('Error in events public API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

