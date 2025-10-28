import { NextRequest, NextResponse } from 'next/server';
import {
  sendBookingConfirmation,
  sendBookingReminder,
  sendBookingCancellation,
  sendEventRegistration,
  sendNewsletter,
  sendContactAutoResponse
} from '@/lib/services/email';
import { mockDataService } from '@/lib/services/mock-data';
import { generateQRCode } from '@/lib/services/pdf-generator';

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();

    switch (type) {
      case 'booking-confirmation': {
        // Get booking data from mock service
        const booking = mockDataService.getBookingByReference(data.bookingReference);
        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Generate QR code
        const qrCodeUrl = await generateQRCode(data.bookingReference);

        const emailData = {
          bookingReference: booking.bookingReference,
          customerName: booking.guestName || 'Guest',
          customerEmail: booking.guestEmail || '',
          exhibitionName: booking.exhibition?.name || booking.show?.name || 'Experience',
          date: new Date(booking.bookingDate).toLocaleDateString('en-IN'),
          time: booking.timeSlot?.startTime || '',
          ticketCount: booking.tickets.reduce((sum, t) => sum + t.quantity, 0),
          totalAmount: booking.totalAmount,
          qrCodeUrl,
          ticketPdfUrl: `/api/pdf/generate?type=ticket&reference=${booking.bookingReference}`,
          specialRequirements: booking.specialRequirements,
        };

        const result = await sendBookingConfirmation(emailData);
        return NextResponse.json({ success: true, result });
      }

      case 'booking-reminder': {
        const booking = mockDataService.getBookingByReference(data.bookingReference);
        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const qrCodeUrl = await generateQRCode(data.bookingReference);

        const emailData = {
          bookingReference: booking.bookingReference,
          customerName: booking.guestName || 'Guest',
          customerEmail: booking.guestEmail || '',
          exhibitionName: booking.exhibition?.name || booking.show?.name || 'Experience',
          date: new Date(booking.bookingDate).toLocaleDateString('en-IN'),
          time: booking.timeSlot?.startTime || '',
          ticketCount: booking.tickets.reduce((sum, t) => sum + t.quantity, 0),
          totalAmount: booking.totalAmount,
          qrCodeUrl,
          ticketPdfUrl: `/api/pdf/generate?type=ticket&reference=${booking.bookingReference}`,
          specialRequirements: booking.specialRequirements,
        };

        const result = await sendBookingReminder(emailData);
        return NextResponse.json({ success: true, result });
      }

      case 'booking-cancellation': {
        const booking = mockDataService.getBookingByReference(data.bookingReference);
        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const emailData = {
          bookingReference: booking.bookingReference,
          customerName: booking.guestName || 'Guest',
          customerEmail: booking.guestEmail || '',
          exhibitionName: booking.exhibition?.name || booking.show?.name || 'Experience',
          date: new Date(booking.bookingDate).toLocaleDateString('en-IN'),
          time: booking.timeSlot?.startTime || '',
          ticketCount: booking.tickets.reduce((sum, t) => sum + t.quantity, 0),
          totalAmount: booking.totalAmount,
          qrCodeUrl: '', // Not needed for cancellation
          ticketPdfUrl: '', // Not needed for cancellation
          refundAmount: data.refundAmount,
        };

        const result = await sendBookingCancellation(emailData);
        return NextResponse.json({ success: true, result });
      }

      case 'event-registration': {
        const emailData = {
          eventTitle: data.eventTitle,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          eventDate: data.eventDate,
          eventTime: data.eventTime,
          location: data.location,
          registrationId: data.registrationId,
        };

        const result = await sendEventRegistration(emailData);
        return NextResponse.json({ success: true, result });
      }

      case 'newsletter': {
        const result = await sendNewsletter(data.subscribers, data.subject, data.content);
        return NextResponse.json({ success: true, result });
      }

      case 'contact-autoresponse': {
        const result = await sendContactAutoResponse(data.email, data.name);
        return NextResponse.json({ success: true, result });
      }

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}