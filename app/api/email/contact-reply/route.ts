import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/send';
import { contactAutoReplyTemplate } from '@/lib/email/templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, email, subject, message } = body;

    // Validate required fields
    if (!email || !name || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate email HTML
    const html = contactAutoReplyTemplate({
      name,
      email,
      subject,
      message,
    });

    // Send auto-reply to customer
    const success = await sendEmail({
      to: email,
      subject: `We received your message - ${subject} | MGM Science Centre`,
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
      message: 'Contact form auto-reply sent successfully',
    });
  } catch (error) {
    console.error('Error sending contact auto-reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}






