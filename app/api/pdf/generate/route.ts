import { NextRequest, NextResponse } from 'next/server';
import { generateTicketPDF, generateDailySalesReport } from '@/lib/services/pdf-generator';
import { getBookingByReference } from '@/lib/graphql/resolvers-impl';

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();

    if (type === 'ticket') {
      // Generate ticket PDF
      const pdfBuffer = await generateTicketPDF(data);
      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="ticket-${data.bookingReference}.pdf"`,
        },
      });
    }

    if (type === 'report') {
      // Generate daily sales report
      const pdfBuffer = await generateDailySalesReport(data);
      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="daily-sales-${data.date}.pdf"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid PDF type' }, { status: 400 });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const reference = searchParams.get('reference');

  if (type === 'ticket' && reference) {
    try {
      // Get booking data from real database
      const booking = await getBookingByReference(reference);
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      // Prepare ticket data (using type assertion to handle Supabase type issues)
      const bookingData = booking as any;
      const ticketData = {
        bookingReference: bookingData.booking_reference,
        customerName: bookingData.guest_name || 'Guest',
        customerEmail: bookingData.guest_email || '',
        exhibition: bookingData.exhibition?.name || bookingData.show?.name || 'Experience',
        date: new Date(bookingData.booking_date).toLocaleDateString('en-IN'),
        time: bookingData.timeSlot?.start_time || '',
        tickets: bookingData.tickets?.map((t: any) => ({
          type: t.pricing?.ticket_type || 'standard',
          quantity: t.quantity,
          price: t.price_per_ticket,
        })) || [],
        totalAmount: bookingData.total_amount,
        specialRequirements: bookingData.special_requirements,
        seats: bookingData.seats?.map((s: any) => `${s.row_letter}${s.seat_number}`),
      };

      const pdfBuffer = await generateTicketPDF(ticketData);
      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="ticket-${reference}.pdf"`,
        },
      });
    } catch (error) {
      console.error('Ticket PDF generation error:', error);
      return NextResponse.json({ error: 'Failed to generate ticket PDF' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
}