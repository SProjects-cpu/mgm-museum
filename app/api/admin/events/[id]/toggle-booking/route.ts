// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Toggle booking enabled/disabled for an event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const body = await request.json();
    const { status } = body;

    if (!status || !['upcoming', 'ongoing', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (upcoming, ongoing, completed, cancelled)' },
        { status: 400 }
      );
    }

    // Update event status instead
    const { data: event, error } = await supabase
      .from('events')
      .update({ status })
      .eq('id', id as any)
      .select()
      .single();

    if (error) {
      console.error('Error updating event status:', error);
      return NextResponse.json(
        { error: 'Failed to update event status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      event,
      message: `Event status updated to ${status} successfully`
    });
  } catch (error) {
    console.error('Error in toggle booking API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
