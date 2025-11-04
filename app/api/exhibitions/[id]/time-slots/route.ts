import { NextRequest } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import { createErrorResponse, createSuccessResponse } from '@/lib/api/response';
import { BookingErrorCode } from '@/lib/api/errors';
import { getTimeSlots, getSlotPricing } from '@/lib/api/booking-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check if id is a UUID or a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const supabase = getServiceSupabase();
    
    let exhibitionId = id;
    
    // Build query based on ID type
    let query = supabase
      .from('exhibitions')
      .select('id, name, status');
    
    if (isUUID) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }
    
    const { data: exhibition, error: exhibitionError } = await query.single();

    if (exhibitionError || !exhibition) {
      return createErrorResponse(
        BookingErrorCode.VALIDATION_ERROR,
        'Exhibition not found',
        404
      );
    }
    
    exhibitionId = exhibition.id;

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
