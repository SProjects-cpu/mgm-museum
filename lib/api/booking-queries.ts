/**
 * Supabase Query Helpers for Booking Operations
 * Provides reusable database query functions for the booking system
 */

import { getServiceSupabase } from '@/lib/supabase/config';
import { BookingError, BookingErrorCode } from './errors';
import type { Database } from '@/types/database';

type SupabaseClient = ReturnType<typeof getServiceSupabase>;

/**
 * Date availability data structure
 */
export interface DateAvailability {
  date: string;
  isAvailable: boolean;
  capacity: number;
  bookedCount: number;
  isFull: boolean;
}

/**
 * Time slot with availability
 */
export interface TimeSlotAvailability {
  id: string;
  startTime: string;
  endTime: string;
  totalCapacity: number;
  availableCapacity: number;
  bookedCount: number;
  isFull: boolean;
  pricing: TicketPricing[];
}

/**
 * Ticket pricing information
 */
export interface TicketPricing {
  ticketType: string;
  price: number;
  label?: string;
}

/**
 * Seat information
 */
export interface SeatInfo {
  row: string;
  number: string;
  isAvailable: boolean;
  isLocked: boolean;
  lockedUntil?: string;
  category?: string;
  price?: number;
}

/**
 * Seat lock information
 */
export interface SeatLock {
  lockId: string;
  sessionId: string;
  exhibitionId?: string;
  showId?: string;
  date: string;
  timeSlotId: string;
  seats: Array<{ row: string; number: string }>;
  expiresAt: string;
}

/**
 * Get available dates for an exhibition
 */
export async function getAvailableDates(
  exhibitionId: string,
  startDate?: string,
  endDate?: string
): Promise<DateAvailability[]> {
  const supabase = getServiceSupabase();

  // Default date range: today to +90 days
  const start = startDate || new Date().toISOString().split('T')[0];
  const end = endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    // Get time slots for this exhibition in the date range
    const { data: timeSlots, error: timeSlotsError } = await supabase
      .from('time_slots')
      .select('slot_date, capacity, active')
      .eq('exhibition_id', exhibitionId)
      .eq('active', true)
      .gte('slot_date', start)
      .lte('slot_date', end)
      .not('slot_date', 'is', null)
      .order('slot_date');

    if (timeSlotsError) throw timeSlotsError;

    if (!timeSlots || timeSlots.length === 0) {
      return [];
    }

    // Get slot availability for the date range
    const { data: availability, error: availError } = await supabase
      .from('slot_availability')
      .select(`
        date,
        available_capacity,
        booked_count,
        time_slot:time_slots!inner(exhibition_id)
      `)
      .eq('time_slots.exhibition_id', exhibitionId)
      .gte('date', start)
      .lte('date', end);

    if (availError) {
      console.error('Error fetching slot availability:', availError);
      // Continue without availability data rather than failing
    }

    // Aggregate availability by date
    const dateMap = new Map<string, DateAvailability>();

    // Process time slots to get dates with capacity
    timeSlots.forEach((slot: any) => {
      const existing = dateMap.get(slot.slot_date);
      if (existing) {
        existing.capacity += slot.capacity;
      } else {
        dateMap.set(slot.slot_date, {
          date: slot.slot_date,
          isAvailable: true,
          capacity: slot.capacity,
          bookedCount: 0,
          isFull: false,
        });
      }
    });

    // Process slot availability to update booked counts
    availability?.forEach((slot: any) => {
      const existing = dateMap.get(slot.date);
      if (existing) {
        existing.bookedCount += slot.booked_count;
        existing.isFull = existing.bookedCount >= existing.capacity;
      }
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    throw new BookingError(
      BookingErrorCode.DATABASE_ERROR,
      'Failed to fetch available dates',
      { exhibitionId, error }
    );
  }
}

/**
 * Get available time slots for an exhibition on a specific date
 */
export async function getTimeSlots(
  exhibitionId: string,
  date: string
): Promise<TimeSlotAvailability[]> {
  const supabase = getServiceSupabase();

  try {
    // Get time slots for this exhibition on the specific date
    // Support both specific date slots and recurring slots (where slot_date is NULL)
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    const { data: timeSlots, error: timeSlotsError } = await supabase
      .from('time_slots')
      .select('id, start_time, end_time, capacity, active, slot_date, day_of_week')
      .eq('exhibition_id', exhibitionId)
      .eq('active', true)
      .or(`slot_date.eq.${date},and(slot_date.is.null,day_of_week.eq.${dayOfWeek}),and(slot_date.is.null,day_of_week.is.null)`)
      .order('start_time');

    if (timeSlotsError) {
      throw new BookingError(
        BookingErrorCode.DATABASE_ERROR,
        'Failed to fetch time slots',
        { exhibitionId, date, error: timeSlotsError }
      );
    }

    if (!timeSlots || timeSlots.length === 0) {
      return [];
    }

    // Get slot availability for the selected date
    const { data: availability, error: availabilityError } = await supabase
      .from('slot_availability')
      .select('time_slot_id, available_capacity, booked_count')
      .in('time_slot_id', timeSlots.map(slot => slot.id))
      .eq('date', date);

    if (availabilityError) {
      console.error('Error fetching slot availability:', availabilityError);
      // Continue without availability data rather than failing
    }

    // Get pricing for each slot
    const slotsWithPricing = await Promise.all(
      timeSlots.map(async (slot) => {
        const pricing = await getSlotPricing(exhibitionId, date, slot.id);
        const slotAvailability = availability?.find(a => a.time_slot_id === slot.id);
        const availableCapacity = slotAvailability?.available_capacity ?? slot.capacity;
        const bookedCount = slotAvailability?.booked_count ?? 0;
        
        return {
          id: slot.id,
          startTime: slot.start_time,
          endTime: slot.end_time,
          totalCapacity: slot.capacity,
          availableCapacity,
          bookedCount,
          isFull: availableCapacity <= 0,
          pricing,
        };
      })
    );

    return slotsWithPricing;
  } catch (error) {
    if (error instanceof BookingError) throw error;
    
    throw new BookingError(
      BookingErrorCode.DATABASE_ERROR,
      'Failed to fetch time slots',
      { exhibitionId, date, error }
    );
  }
}

/**
 * Get pricing for a specific time slot
 */
export async function getSlotPricing(
  exhibitionId: string,
  date: string,
  timeSlotId: string
): Promise<TicketPricing[]> {
  const supabase = getServiceSupabase();

  try {
    // Check for dynamic pricing first
    const { data: dynamicPricing, error: dynamicError } = await supabase
      .from('dynamic_pricing')
      .select('ticket_type, price, label')
      .eq('exhibition_id', exhibitionId)
      .eq('date', date)
      .eq('time_slot_id', timeSlotId)
      .eq('is_active', true);

    if (dynamicError) {
      console.error('Error fetching dynamic pricing:', dynamicError);
      // Continue to default pricing instead of failing
    }

    if (dynamicPricing && dynamicPricing.length > 0) {
      return dynamicPricing.map(p => ({
        ticketType: p.ticket_type,
        price: p.price,
        label: p.label || undefined,
      }));
    }

    // Fallback to default pricing
    const { data: defaultPricing, error: pricingError } = await supabase
      .from('pricing')
      .select('ticket_type, price')
      .eq('exhibition_id', exhibitionId)
      .eq('active', true);

    if (pricingError) {
      console.error('Error fetching default pricing:', pricingError);
      // Return empty array instead of failing
      return [];
    }

    return (defaultPricing || []).map(p => ({
      ticketType: p.ticket_type,
      price: p.price,
    }));
  } catch (error) {
    console.error('Unexpected error in getSlotPricing:', error);
    // Return empty array instead of throwing
    return [];
  }
}

/**
 * Get seat availability for a time slot
 */
export async function getSeatAvailability(
  exhibitionId: string,
  date: string,
  timeSlotId: string
): Promise<SeatInfo[]> {
  const supabase = getServiceSupabase();

  try {
    // Get venue configuration for the exhibition
    const { data: exhibition, error: exError } = await supabase
      .from('exhibitions')
      .select('venue_id')
      .eq('id', exhibitionId)
      .single();

    if (exError || !exhibition) {
      throw new BookingError(
        BookingErrorCode.INVALID_EXHIBITION,
        'Exhibition not found'
      );
    }

    // Get venue seating configuration
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('seating_config')
      .eq('id', exhibition.venue_id)
      .single();

    if (venueError || !venue) {
      throw new BookingError(
        BookingErrorCode.DATABASE_ERROR,
        'Venue configuration not found'
      );
    }

    // Get booked seats
    const { data: bookedSeats, error: bookedError } = await supabase
      .from('seat_bookings')
      .select('seat_row, seat_number')
      .eq('time_slot_id', timeSlotId)
      .eq('booking_date', date)
      .in('status', ['confirmed', 'completed']);

    if (bookedError) throw bookedError;

    // Get locked seats
    const { data: lockedSeats, error: lockedError } = await supabase
      .from('seat_locks')
      .select('seats, expires_at')
      .eq('time_slot_id', timeSlotId)
      .eq('date', date)
      .gt('expires_at', new Date().toISOString());

    if (lockedError) throw lockedError;

    // Generate seat layout from venue config
    const seatingConfig = venue.seating_config as any;
    const seats: SeatInfo[] = [];

    // Create seat map
    const bookedSet = new Set(
      bookedSeats?.map(s => `${s.seat_row}-${s.seat_number}`) || []
    );
    
    const lockedMap = new Map<string, string>();
    lockedSeats?.forEach((lock: any) => {
      const lockSeats = lock.seats as Array<{ row: string; number: string }>;
      lockSeats.forEach(seat => {
        lockedMap.set(`${seat.row}-${seat.number}`, lock.expires_at);
      });
    });

    // Generate seats based on configuration
    if (seatingConfig?.rows) {
      seatingConfig.rows.forEach((row: any) => {
        for (let i = 1; i <= row.seats; i++) {
          const seatKey = `${row.name}-${i}`;
          const isBooked = bookedSet.has(seatKey);
          const lockedUntil = lockedMap.get(seatKey);

          seats.push({
            row: row.name,
            number: String(i),
            isAvailable: !isBooked && !lockedUntil,
            isLocked: !!lockedUntil,
            lockedUntil,
            category: row.category,
            price: row.price,
          });
        }
      });
    }

    return seats;
  } catch (error) {
    if (error instanceof BookingError) throw error;
    
    throw new BookingError(
      BookingErrorCode.DATABASE_ERROR,
      'Failed to fetch seat availability',
      { exhibitionId, date, timeSlotId, error }
    );
  }
}

/**
 * Create a seat lock
 */
export async function createSeatLock(
  sessionId: string,
  exhibitionId: string | undefined,
  showId: string | undefined,
  date: string,
  timeSlotId: string,
  seats: Array<{ row: string; number: string }>
): Promise<SeatLock> {
  const supabase = getServiceSupabase();

  try {
    // Verify seats are available
    const seatAvailability = await getSeatAvailability(
      exhibitionId || showId!,
      date,
      timeSlotId
    );

    const unavailableSeats = seats.filter(seat => {
      const seatInfo = seatAvailability.find(
        s => s.row === seat.row && s.number === seat.number
      );
      return !seatInfo || !seatInfo.isAvailable;
    });

    if (unavailableSeats.length > 0) {
      throw new BookingError(
        BookingErrorCode.SEATS_UNAVAILABLE,
        'Some seats are not available',
        { unavailableSeats }
      );
    }

    // Create lock with 10-minute expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { data: lock, error } = await supabase
      .from('seat_locks')
      .insert({
        session_id: sessionId,
        exhibition_id: exhibitionId || null,
        show_id: showId || null,
        date,
        time_slot_id: timeSlotId,
        seats: seats as any,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      lockId: lock.id,
      sessionId: lock.session_id,
      exhibitionId: lock.exhibition_id || undefined,
      showId: lock.show_id || undefined,
      date: lock.date,
      timeSlotId: lock.time_slot_id,
      seats,
      expiresAt,
    };
  } catch (error) {
    if (error instanceof BookingError) throw error;
    
    throw new BookingError(
      BookingErrorCode.LOCK_FAILED,
      'Failed to create seat lock',
      { error }
    );
  }
}

/**
 * Verify a seat lock is still valid
 */
export async function verifySeatLock(lockId: string): Promise<SeatLock | null> {
  const supabase = getServiceSupabase();

  try {
    const { data: lock, error } = await supabase
      .from('seat_locks')
      .select('*')
      .eq('id', lockId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !lock) {
      return null;
    }

    return {
      lockId: lock.id,
      sessionId: lock.session_id,
      exhibitionId: lock.exhibition_id || undefined,
      showId: lock.show_id || undefined,
      date: lock.date,
      timeSlotId: lock.time_slot_id,
      seats: lock.seats as Array<{ row: string; number: string }>,
      expiresAt: lock.expires_at,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Release a seat lock
 */
export async function releaseSeatLock(lockId: string): Promise<void> {
  const supabase = getServiceSupabase();

  try {
    const { error } = await supabase
      .from('seat_locks')
      .delete()
      .eq('id', lockId);

    if (error) throw error;
  } catch (error) {
    // Log but don't throw - lock cleanup is not critical
    console.error('Failed to release seat lock:', error);
  }
}

/**
 * Check if a time slot has available capacity
 */
export async function checkSlotCapacity(
  timeSlotId: string,
  date: string,
  requiredCapacity: number
): Promise<{ available: boolean; remaining: number }> {
  const supabase = getServiceSupabase();

  try {
    // Get slot total capacity
    const { data: slot, error: slotError } = await supabase
      .from('time_slots')
      .select('capacity')
      .eq('id', timeSlotId)
      .single();

    if (slotError || !slot) {
      throw new BookingError(
        BookingErrorCode.INVALID_TIME_SLOT,
        'Time slot not found'
      );
    }

    // Get current bookings
    const { data: availability, error: availError } = await supabase
      .from('slot_availability')
      .select('available_capacity, booked_count')
      .eq('time_slot_id', timeSlotId)
      .eq('date', date)
      .single();

    if (availError && availError.code !== 'PGRST116') {
      throw availError;
    }

    const totalCapacity = availability?.available_capacity || slot.capacity;
    const bookedCount = availability?.booked_count || 0;
    const remaining = totalCapacity - bookedCount;

    return {
      available: remaining >= requiredCapacity,
      remaining,
    };
  } catch (error) {
    if (error instanceof BookingError) throw error;
    
    throw new BookingError(
      BookingErrorCode.DATABASE_ERROR,
      'Failed to check slot capacity',
      { timeSlotId, date, error }
    );
  }
}

/**
 * Update slot availability after booking
 */
export async function updateSlotAvailability(
  timeSlotId: string,
  date: string,
  ticketCount: number
): Promise<void> {
  const supabase = getServiceSupabase();

  try {
    // Get or create slot availability record
    const { data: existing, error: fetchError } = await supabase
      .from('slot_availability')
      .select('*')
      .eq('time_slot_id', timeSlotId)
      .eq('date', date)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('slot_availability')
        .update({ booked_count: existing.booked_count + ticketCount })
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      // Create new record
      const { data: slot } = await supabase
        .from('time_slots')
        .select('capacity')
        .eq('id', timeSlotId)
        .single();

      const { error: insertError } = await supabase
        .from('slot_availability')
        .insert({
          time_slot_id: timeSlotId,
          date,
          available_capacity: slot?.capacity || 0,
          booked_count: ticketCount,
        });

      if (insertError) throw insertError;
    }
  } catch (error) {
    throw new BookingError(
      BookingErrorCode.DATABASE_ERROR,
      'Failed to update slot availability',
      { timeSlotId, date, ticketCount, error }
    );
  }
}
