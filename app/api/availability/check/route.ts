import { NextRequest, NextResponse } from 'next/server';
import { mockDataService } from '@/lib/services/mock-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const exhibitionId = searchParams.get('exhibitionId');
    const showId = searchParams.get('showId');
    const timeSlotId = searchParams.get('timeSlotId');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    // Get available time slots
    const timeSlots = mockDataService.getAvailableTimeSlots(date, exhibitionId || undefined, showId || undefined);

    // If specific time slot requested, check its availability
    if (timeSlotId) {
      const slot = timeSlots.find(s => s.id === timeSlotId);
      if (!slot) {
        return NextResponse.json({
          available: false,
          message: 'Time slot not found or not available'
        });
      }

      // Get booked seats for this specific slot
      const bookedSeats = showId ?
        mockDataService.getBookedSeats(showId, date, timeSlotId) : [];

      return NextResponse.json({
        available: slot.availableSeats > 0,
        timeSlot: slot,
        bookedSeats,
        availableSeats: slot.availableSeats,
        totalCapacity: slot.capacity,
        message: slot.availableSeats > 0 ?
          `${slot.availableSeats} seats available` :
          'No seats available'
      });
    }

    // Return all available time slots
    return NextResponse.json({
      timeSlots,
      message: timeSlots.length > 0 ?
        `${timeSlots.length} time slots available` :
        'No time slots available for this date'
    });

  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, exhibitionId, showId, timeSlotId, requestedSeats } = await request.json();

    if (!date || !timeSlotId) {
      return NextResponse.json({ error: 'Date and timeSlotId are required' }, { status: 400 });
    }

    // Get time slot details
    const timeSlots = mockDataService.getAvailableTimeSlots(date, exhibitionId, showId);
    const slot = timeSlots.find(s => s.id === timeSlotId);

    if (!slot) {
      return NextResponse.json({
        available: false,
        message: 'Time slot not available'
      }, { status: 400 });
    }

    // Check seat availability
    const bookedSeats = showId ?
      mockDataService.getBookedSeats(showId, date, timeSlotId) : [];

    const requestedCount = requestedSeats ? requestedSeats.length : 1;
    const availableSeats = slot.capacity - bookedSeats.length;

    // Check for seat conflicts if specific seats requested
    let seatConflicts: string[] = [];
    if (requestedSeats && requestedSeats.length > 0) {
      seatConflicts = requestedSeats.filter((seat: string) => bookedSeats.includes(seat));
    }

    const isAvailable = availableSeats >= requestedCount && seatConflicts.length === 0;

    return NextResponse.json({
      available: isAvailable,
      timeSlot: slot,
      bookedSeats,
      requestedSeats: requestedSeats || [],
      seatConflicts,
      availableSeats,
      totalCapacity: slot.capacity,
      message: isAvailable ?
        `Seats available for booking` :
        seatConflicts.length > 0 ?
          `Seats ${seatConflicts.join(', ')} are already booked` :
          `Only ${availableSeats} seats available, requested ${requestedCount}`
    });

  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
  }
}