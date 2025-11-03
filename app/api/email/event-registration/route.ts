import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/send';
import { eventRegistrationTemplate } from '@/lib/email/templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      eventTitle,
      participantName,
      participantEmail,
      eventDate,
      eventTime,
      location,
    } = body;

    // Validate required fields
    if (!participantEmail || !participantName || !eventTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate email HTML
    const html = eventRegistrationTemplate({
      eventTitle,
      participantName,
      participantEmail,
      eventDate,
      eventTime,
      location,
    });

    // Send email
    const success = await sendEmail({
      to: participantEmail,
      subject: `Event Registration Confirmed - ${eventTitle} | MGM Science Centre`,
      html,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event registration confirmation email sent successfully',
    });
  } catch (error) {
    console.error('Error sending event registration email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}






