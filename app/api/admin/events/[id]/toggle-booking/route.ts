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
    const { bookingEnabled } = body;

    if (typeof bookingEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'bookingEnabled must be a boolean' },
        { status: 400 }
      );
    }

    // Update booking status
    const { data: event, error } = await supabase
      .from('events')
      .update({ booking_enabled: bookingEnabled } as any)
      .eq('id', id as any)
      .select()
      .single();

    if (error) {
      console.error('Error toggling booking status:', error);
      return NextResponse.json(
        { error: 'Failed to update booking status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      event,
      message: `Booking ${bookingEnabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Error in toggle booking API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
