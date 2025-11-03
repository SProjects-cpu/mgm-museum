import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/send';
import { newsletterWelcomeTemplate } from '@/lib/email/templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { email, name } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate email HTML
    const html = newsletterWelcomeTemplate(name || '');

    // Send welcome email
    const success = await sendEmail({
      to: email,
      subject: 'Welcome to MGM Science Centre Newsletter! 🚀',
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
      message: 'Newsletter welcome email sent successfully',
    });
  } catch (error) {
    console.error('Error sending newsletter welcome email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}






