import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/send';
import { adminNewBookingTemplate } from '@/lib/email/templates';
import { siteConfig } from '@/lib/email/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      bookingReference,
      customerName,
      customerEmail,
      exhibitionName,
      showName,
      bookingDate,
      timeSlot,
      totalAmount,
      tickets,
    } = body;

    // Validate required fields
    if (!customerEmail || !customerName || !bookingReference) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate email HTML
    const html = adminNewBookingTemplate({
      bookingReference,
      customerName,
      customerEmail,
      exhibitionName,
      showName,
      bookingDate,
      timeSlot,
      totalAmount,
      tickets,
    });

    // Send notification to admin
    const success = await sendEmail({
      to: siteConfig.supportEmail, // Send to admin email
      subject: `🔔 New Booking: ${bookingReference} | MGM Admin`,
      html,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send admin notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Admin notification sent successfully',
    });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}






