import { NextRequest, NextResponse } from 'next/server';
import { trackEvent } from '@/lib/services/analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate event type
    if (!body.eventType) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    // Track the event
    await trackEvent({
      eventType: body.eventType,
      userId: body.userId,
      sessionId: body.sessionId || request.headers.get('x-session-id'),
      properties: body.properties || {},
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Analytics tracking error:', error);
    // Return success anyway - don't disrupt user experience
    return NextResponse.json({ success: true });
  }
}






