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
import { checkRateLimit, getRateLimitHeaders } from '@/lib/middleware/rate-limit';
import { loadMuseumLogoSync } from '@/lib/tickets/logo-loader';
import {
  trackDownloadSuccess,
  trackDownloadFailure,
  trackGenerationTime,
  getErrorType,
} from '@/lib/analytics/ticket-analytics';

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
      // Track authentication error
      trackDownloadFailure({
        bookingId,
        userId: 'unknown',
        bookingReference: 'unknown',
        generationTimeMs: Date.now() - startTime,
        errorType: 'AUTH_ERROR',
        errorMessage: 'No authentication header provided',
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      });

      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Get user identifier for rate limiting (before full auth to prevent abuse)
    const userIdentifier = request.headers.get('x-forwarded-for') || 
                          request.headers.get('x-real-ip') || 
                          'unknown';

    // 3. Check rate limit: 10 requests per minute per user
    const rateLimitResult = checkRateLimit(userIdentifier, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
    });

    if (!rateLimitResult.allowed) {
      const headers = getRateLimitHeaders(
        rateLimitResult.remaining,
        rateLimitResult.resetTime
      );
      
      console.warn('Rate limit exceeded for ticket generation:', {
        identifier: userIdentifier,
        bookingId,
        resetTime: new Date(rateLimitResult.resetTime).toISOString(),
      });

      return NextResponse.json(
        { 
          success: false, 
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers,
        }
      );
    }

    // 4. Create Supabase client with user's auth token
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

    // 5. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      
      // Track authentication error
      trackDownloadFailure({
        bookingId,
        userId: 'unknown',
        bookingReference: 'unknown',
        generationTimeMs: Date.now() - startTime,
        errorType: 'AUTH_ERROR',
        errorMessage: authError?.message || 'Invalid authentication token',
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: userIdentifier,
      });

      return NextResponse.json(
        { success: false, message: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // 6. Validate booking ID format
    if (!bookingId || !isValidUUID(bookingId)) {
      // Track validation error
      trackDownloadFailure({
        bookingId: bookingId || 'invalid',
        userId: user.id,
        bookingReference: 'unknown',
        generationTimeMs: Date.now() - startTime,
        errorType: 'VALIDATION_ERROR',
        errorMessage: 'Invalid booking ID format',
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: userIdentifier,
      });

      return NextResponse.json(
        { success: false, message: 'Invalid booking ID format' },
        { status: 400 }
      );
    }

    // 7. Fetch complete booking data
    let bookingData;
    try {
      bookingData = await fetchTicketData(bookingId, supabase);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('not found')) {
        // Track not found error
        trackDownloadFailure({
          bookingId,
          userId: user.id,
          bookingReference: 'unknown',
          generationTimeMs: Date.now() - startTime,
          errorType: 'NOT_FOUND',
          errorMessage: 'Booking not found',
          userAgent: request.headers.get('user-agent') || undefined,
          ipAddress: userIdentifier,
        });

        return NextResponse.json(
          { success: false, message: 'Booking not found' },
          { status: 404 }
        );
      }
      
      throw error;
    }

    // 8. Verify booking belongs to authenticated user
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

      // Track forbidden error
      trackDownloadFailure({
        bookingId,
        userId: user.id,
        bookingReference: bookingData.booking_reference,
        generationTimeMs: Date.now() - startTime,
        errorType: 'FORBIDDEN',
        errorMessage: 'User does not own this booking',
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: userIdentifier,
      });

      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // 9. Validate critical data
    if (!bookingData.payment_id) {
      console.error('Missing Razorpay payment ID:', bookingId);

      // Track payment data error
      trackDownloadFailure({
        bookingId,
        userId: user.id,
        bookingReference: bookingData.booking_reference,
        generationTimeMs: Date.now() - startTime,
        errorType: 'PAYMENT_DATA_ERROR',
        errorMessage: 'Missing Razorpay payment ID',
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: userIdentifier,
      });

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

      // Track ticket data error
      trackDownloadFailure({
        bookingId,
        userId: user.id,
        bookingReference: bookingData.booking_reference,
        generationTimeMs: Date.now() - startTime,
        errorType: 'TICKET_DATA_ERROR',
        errorMessage: 'No tickets found for booking',
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: userIdentifier,
      });

      return NextResponse.json(
        { success: false, message: 'Ticket data not available' },
        { status: 500 }
      );
    }

    // 10. Generate QR code
    let qrCodeDataUrl;
    try {
      qrCodeDataUrl = await generateQRCode(bookingData.booking_reference, {
        width: 200,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
    } catch (error) {
      console.error('QR code generation failed:', error);

      // Track QR generation error
      trackDownloadFailure({
        bookingId,
        userId: user.id,
        bookingReference: bookingData.booking_reference,
        generationTimeMs: Date.now() - startTime,
        errorType: 'QR_GENERATION_ERROR',
        errorMessage: error instanceof Error ? error.message : 'QR code generation failed',
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: userIdentifier,
      });

      return NextResponse.json(
        { success: false, message: 'Failed to generate QR code' },
        { status: 500 }
      );
    }

    // 11. Load museum logo (gracefully handle if missing)
    const museumLogo = loadMuseumLogoSync();
    if (!museumLogo) {
      console.warn('Museum logo not available, generating PDF without logo');
    }

    // 12. Render PDF document
    let pdfStream;
    try {
      const pdfDocument = (
        <TicketPDFDocument
          booking={bookingData}
          qrCodeDataUrl={qrCodeDataUrl}
          museumLogo={museumLogo || undefined}
        />
      );

      pdfStream = await renderToStream(pdfDocument);
    } catch (error) {
      console.error('PDF rendering failed:', {
        bookingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Track PDF rendering error
      trackDownloadFailure({
        bookingId,
        userId: user.id,
        bookingReference: bookingData.booking_reference,
        generationTimeMs: Date.now() - startTime,
        errorType: 'PDF_RENDER_ERROR',
        errorMessage: error instanceof Error ? error.message : 'PDF rendering failed',
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: userIdentifier,
      });

      return NextResponse.json(
        { success: false, message: 'Failed to generate PDF ticket' },
        { status: 500 }
      );
    }

    // 13. Log successful generation and track analytics
    const generationTime = Date.now() - startTime;
    console.log('PDF ticket generated successfully:', {
      bookingId,
      userId: user.id,
      bookingReference: bookingData.booking_reference,
      generationTime: `${generationTime}ms`,
      hasLogo: !!museumLogo,
    });

    // Track successful download analytics
    trackDownloadSuccess({
      bookingId,
      userId: user.id,
      bookingReference: bookingData.booking_reference,
      generationTimeMs: generationTime,
      hasLogo: !!museumLogo,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: userIdentifier,
    });

    // Track generation time for performance monitoring
    trackGenerationTime(bookingId, generationTime);

    // 14. Set response headers for PDF download
    const filename = `MGM-Ticket-${bookingData.booking_reference}.pdf`;
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    // Add rate limit headers to successful responses
    const rateLimitHeaders = getRateLimitHeaders(
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    // 15. Stream PDF to response
    return new NextResponse(pdfStream as any, {
      status: 200,
      headers,
    });
  } catch (error) {
    // Catch-all error handler
    const generationTime = Date.now() - startTime;
    const errorType = getErrorType(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('PDF generation error:', {
      bookingId,
      error: errorMessage,
      errorType,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // Track failed download analytics
    // Note: We may not have userId or bookingReference if error occurred early
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
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
        
        const { data: { user } } = await supabase.auth.getUser();
        const userIdentifier = request.headers.get('x-forwarded-for') || 
                              request.headers.get('x-real-ip') || 
                              'unknown';

        if (user) {
          trackDownloadFailure({
            bookingId,
            userId: user.id,
            bookingReference: 'unknown', // May not be available if error occurred early
            generationTimeMs: generationTime,
            errorType,
            errorMessage,
            userAgent: request.headers.get('user-agent') || undefined,
            ipAddress: userIdentifier,
          });
        }
      }
    } catch (trackingError) {
      // Don't let tracking errors affect the response
      console.error('Error tracking analytics:', trackingError);
    }

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
