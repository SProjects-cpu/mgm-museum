import { NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/api/response';
import { BookingError } from '@/lib/api/errors';
import { BookingErrorCode } from '@/lib/api/errors';
import { getSeatAvailability } from '@/lib/api/booking-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const timeSlotId = searchParams.get('timeSlotId');

    if (!date || !timeSlotId) {
      return errorResponse(
        new BookingError(
          BookingErrorCode.VALIDATION_ERROR,
          'Date and timeSlotId parameters are required'
        )
      );
    }
    
    // Check if id is a UUID or a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let exhibitionId = id;
    
    // If it's a slug, fetch the exhibition ID
    if (!isUUID) {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = createClient();
      
      const { data: exhibition, error } = await supabase
        .from('exhibitions')
        .select('id')
        .eq('slug', id)
        .single();
      
      if (error || !exhibition) {
        return errorResponse(
          new BookingError(
            BookingErrorCode.VALIDATION_ERROR,
            'Exhibition not found'
          )
        );
      }
      
      exhibitionId = exhibition.id;
    }

    const seats = await getSeatAvailability(exhibitionId, date, timeSlotId);

    // Extract layout info
    const rows = [...new Set(seats.map(s => s.row))].sort();
    const seatsPerRow = Math.max(...seats.map(s => parseInt(s.number)));

    return successResponse({
      seats,
      layout: { rows, seatsPerRow },
    });
  } catch (error: any) {
    console.error('[API] Error fetching seats:', error);
    return errorResponse(error);
  }
}
