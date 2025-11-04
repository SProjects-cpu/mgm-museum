import { NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/api/response';
import { BookingError } from '@/lib/api/errors';
import { BookingErrorCode } from '@/lib/api/errors';
import { getSeatAvailability } from '@/lib/api/booking-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: exhibitionId } = params;
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
