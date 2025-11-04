import { NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/api/response';
import { BookingError } from '@/lib/api/errors';
import { BookingErrorCode } from '@/lib/api/errors';
import { createSeatLock, checkSlotCapacity } from '@/lib/api/booking-queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { exhibitionId, showId, date, timeSlotId, seats, sessionId } = body;

    // Validation
    if (!date || !timeSlotId || !seats || !sessionId) {
      return errorResponse(
        new BookingError(
          BookingErrorCode.VALIDATION_ERROR,
          'Missing required parameters'
        )
      );
    }

    if (!exhibitionId && !showId) {
      return errorResponse(
        new BookingError(
          BookingErrorCode.VALIDATION_ERROR,
          'Either exhibitionId or showId is required'
        )
      );
    }

    if (!Array.isArray(seats) || seats.length === 0) {
      return errorResponse(
        new BookingError(
          BookingErrorCode.VALIDATION_ERROR,
          'Seats must be a non-empty array'
        )
      );
    }

    // Check capacity
    const capacity = await checkSlotCapacity(timeSlotId, date, seats.length);
    if (!capacity.available) {
      return errorResponse(
        new BookingError(
          BookingErrorCode.SLOT_FULL,
          `Only ${capacity.remaining} seats remaining`
        )
      );
    }

    // Create lock
    const lock = await createSeatLock(
      sessionId,
      exhibitionId,
      showId,
      date,
      timeSlotId,
      seats
    );

    return successResponse({
      lockId: lock.lockId,
      expiresAt: lock.expiresAt,
      seats: lock.seats,
    });
  } catch (error: any) {
    console.error('[API] Error locking seats:', error);
    
    return errorResponse(error);
  }
}
