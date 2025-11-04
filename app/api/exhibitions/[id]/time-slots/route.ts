import { NextRequest } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import { createErrorResponse, createSuccessResponse } from '@/lib/api/response';
import { BookingErrorCode } from '@/lib/api/errors';
import { getTimeSlots, getSlotPricing } from '@/lib/api/booking-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: exhibitionId } = params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    // Validate required parameters
    if (!date) {
      return createErrorResponse(
        BookingErrorCode.VALIDATION_ERROR,
        'Date parameter is required',
        400
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return createErrorResponse(
        BookingErrorCode.INVALID_DATE,
        'Invalid date format. Use YYYY-MM-DD',
        400
      );
    }

    // Validate exhibition exists
    const supabase = getServiceSupabase();
    const { data: exhibition, error: exhibitionError } = await supabase
      .from('exhibitions')
      .select('id, name, status')
      .eq('id', exhibitionId)
      .single();

    if (exhibitionError || !exhibition) {
      return createErrorResponse(
        BookingErrorCode.VALIDATION_ERROR,
        'Exhibition not found',
        404
      );
    }

    // Get available time slots with pricing
    const timeSlots = await getTimeSlots(exhibitionId, date);

    return createSuccessResponse({
      timeSlots,
    });
  } catch (error: any) {
    console.error('[API] Error fetching time slots:', error);
    return createErrorResponse(
      BookingErrorCode.NETWORK_ERROR,
      'Failed to fetch time slots',
      500,
      error.message
    );
  }
}
