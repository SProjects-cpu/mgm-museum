/**
 * GET /api/exhibitions/[id]/available-dates
 * Fetch available dates for an exhibition based on admin configurations
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  cachedResponse,
  parseQueryParams,
  withErrorHandling,
} from '@/lib/api/response';
import {
  getAvailableDates,
} from '@/lib/api/booking-queries';
import {
  BookingError,
  BookingErrorCode,
} from '@/lib/api/errors';

/**
 * GET handler for available dates endpoint
 * 
 * Query Parameters:
 * - startDate (optional): Start date for range (default: today)
 * - endDate (optional): End date for range (default: today + 90 days)
 * 
 * Returns:
 * - dates: Array of date availability objects
 */
async function handleGet(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id: exhibitionId } = params;

  // Validate exhibition ID format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(exhibitionId)) {
    throw new BookingError(
      BookingErrorCode.INVALID_EXHIBITION,
      'Invalid exhibition ID format'
    );
  }

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const queryParams = parseQueryParams(searchParams, {
    startDate: 'date',
    endDate: 'date',
  });

  const { startDate, endDate } = queryParams;

  // Validate date range if provided
  if (startDate && endDate && startDate > endDate) {
    throw new BookingError(
      BookingErrorCode.INVALID_DATE,
      'Start date must be before end date'
    );
  }

  // Fetch available dates
  const dates = await getAvailableDates(exhibitionId, startDate, endDate);

  // Cache for 1 minute (moderate change frequency)
  return cachedResponse(
    { dates },
    60,
    {
      exhibitionId,
      dateRange: {
        start: startDate || 'today',
        end: endDate || 'today+90days',
      },
    }
  );
}

// Export GET handler with error handling wrapper
export const GET = withErrorHandling(handleGet);
