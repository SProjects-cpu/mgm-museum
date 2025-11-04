/**
 * PDF Ticket Generation API Route
 * Generates and streams PDF tickets for confirmed bookings
 */

import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { renderToStream } from '@react-pdf/renderer';
import { fetchTicketData } from '@/lib/tickets/fetch-ticket-data';
import { generateQRCode } from '@/lib/tickets/qr-generator';
import { TicketPDFDocument } from '@/components/tickets/TicketPDFDocument';

/**
 * GET /api/tickets/generate/[bookingId]
 * Generate and download PDF ticket for a booking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const startTime = Date.now();
  const { bookingId } = params;

  try {
    // 1. Validate authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Create Supabase client with user's auth token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // 3. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { success: false, message: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // 4. Validate booking ID format
    if (!bookingId || !isValidUUID(bookingId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid booking ID format' },
        { status: 400 }
      );
    }

    // 5. Fetch complete booking data
    let bookingData;
    try {
      bookingData = await fetchTicketData(bookingId, supabase);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('not found')) {
        return NextResponse.json(
          { success: false, message: 'Booking not found' },
          { status: 404 }
        );
      }
      
      throw error;
    }

    // 6. Verify booking belongs to authenticated user
    const { data: booking } = await supabase
      .from('bookings')
      .select('user_id')
      .eq('id', bookingId)
      .single();

    if (!booking || booking.user_id !== user.id) {
      console.warn('Unauthorized ticket access attempt:', {
        bookingId,
        userId: user.id,
      });
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // 7. Validate critical data
    if (!bookingData.payment_id) {
      console.error('Missing Razorpay payment ID:', bookingId);
      return NextResponse.json(
        {
          success: false,
          message: 'Payment information not available. Please contact support.',
        },
        { status: 500 }
      );
    }

    if (!bookingData.tickets || bookingData.tickets.length === 0) {
      console.error('No tickets found for booking:', bookingId);
      return NextResponse.json(
        { success: false, message: 'Ticket data not available' },
        { status: 500 }
      );
    }

    // 8. Generate QR code
    let qrCodeDataUrl;
    try {
      qrCodeDataUrl = await generateQRCode(bookingData.booking_reference, {
        width: 200,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
    } catch (error) {
      console.error('QR code generation failed:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to generate QR code' },
        { status: 500 }
      );
    }

    // 9. Render PDF document
    let pdfStream;
    try {
      const pdfDocument = (
        <TicketPDFDocument
          booking={bookingData}
          qrCodeDataUrl={qrCodeDataUrl}
          // museumLogo can be added here when available
        />
      );

      pdfStream = await renderToStream(pdfDocument);
    } catch (error) {
      console.error('PDF rendering failed:', {
        bookingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return NextResponse.json(
        { success: false, message: 'Failed to generate PDF ticket' },
        { status: 500 }
      );
    }

    // 10. Log successful generation
    const generationTime = Date.now() - startTime;
    console.log('PDF ticket generated successfully:', {
      bookingId,
      userId: user.id,
      bookingReference: bookingData.booking_reference,
      generationTime: `${generationTime}ms`,
    });

    // 11. Set response headers for PDF download
    const filename = `MGM-Ticket-${bookingData.booking_reference}.pdf`;
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    // 12. Stream PDF to response
    return new NextResponse(pdfStream as any, {
      status: 200,
      headers,
    });
  } catch (error) {
    // Catch-all error handler
    console.error('PDF generation error:', {
      bookingId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while generating the ticket. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * Validate UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
