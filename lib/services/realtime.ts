// @ts-nocheck
import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Real-time Booking Updates
 * Subscribe to booking changes for live updates
 */
export function subscribeToBookingUpdates(
  bookingId: string,
  callback: (booking: any) => void
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`booking-${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `id=eq.${bookingId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

/**
 * Real-time Seat Availability
 * Subscribe to seat booking changes for a specific show and date
 */
export function subscribeToSeatAvailability(
  showId: string,
  date: string,
  timeSlotId: string,
  callback: (seats: any[]) => void
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`seats-${showId}-${date}-${timeSlotId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'seat_bookings',
      },
      async () => {
        // Fetch updated seat availability
        const { data: bookings } = await supabase
          .from('bookings')
          .select(`
            id,
            seats:seat_bookings(*)
          `)
          .eq('show_id', showId)
          .eq('booking_date', date)
          .eq('time_slot_id', timeSlotId)
          .in('status', ['confirmed', 'pending']);

        const bookedSeats = bookings?.flatMap((b) => b.seats || []) || [];
        callback(bookedSeats);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

/**
 * Real-time Admin Dashboard Updates
 * Subscribe to new bookings for admin panel
 */
export function subscribeToAdminUpdates(
  callback: (event: { type: string; data: any }) => void
): () => void {
  const bookingsChannel = supabase
    .channel('admin-bookings')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'bookings',
      },
      (payload) => {
        callback({ type: 'new_booking', data: payload.new });
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
      },
      (payload) => {
        callback({ type: 'booking_updated', data: payload.new });
      }
    )
    .subscribe();

  return () => {
    bookingsChannel.unsubscribe();
  };
}

/**
 * Real-time Availability Counter
 * Subscribe to capacity changes for a time slot
 */
export function subscribeToTimeSlotAvailability(
  timeSlotId: string,
  date: string,
  callback: (availableSeats: number) => void
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`timeslot-${timeSlotId}-${date}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
      },
      async () => {
        // Fetch updated availability
        const { data: timeSlot } = await supabase
          .from('time_slots')
          .select('capacity')
          .eq('id', timeSlotId)
          .single();

        const { count: bookedCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('time_slot_id', timeSlotId)
          .eq('booking_date', date)
          .in('status', ['confirmed', 'pending']);

        const availableSeats = (timeSlot?.capacity || 0) - (bookedCount || 0);
        callback(availableSeats);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

/**
 * Broadcast notification to all connected clients
 */
export function broadcastNotification(
  channel: string,
  message: any
) {
  supabase.channel(channel).send({
    type: 'broadcast',
    event: 'notification',
    payload: message,
  });
}



