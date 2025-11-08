/**
 * Ticket Data Fetcher Utility
 * Fetches complete booking data with related information for PDF generation
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BookingData, CartSnapshot } from '@/types/tickets';

/**
 * Fetch complete booking data for PDF ticket generation
 * @param bookingId - UUID of the booking
 * @param supabaseClient - Authenticated Supabase client
 * @returns Promise resolving to complete booking data
 * @throws Error if booking not found or data fetch fails
 */
export async function fetchTicketData(
  bookingId: string,
  supabaseClient: SupabaseClient
): Promise<BookingData> {
  // Validate booking ID format
  if (!bookingId || !isValidUUID(bookingId)) {
    throw new Error('Invalid booking ID format');
  }

  try {
    // Fetch booking with all related data in a single query
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select(`
        id,
        booking_reference,
        booking_date,
        booking_time,
        guest_name,
        guest_email,
        guest_phone,
        total_amount,
        payment_id,
        payment_order_id,
        exhibition_id,
        show_id,
        time_slot_id,
        created_at,
        exhibitions:exhibition_id (
          name,
          description
        ),
        shows:show_id (
          name,
          description
        ),
        time_slots:time_slot_id (
          start_time,
          end_time,
          slot_date
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('Error fetching booking:', bookingError);
      throw new Error(bookingError.message || 'Failed to fetch booking data');
    }

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Fetch tickets for this booking
    const { data: tickets, error: ticketsError } = await supabaseClient
      .from('tickets')
      .select('ticket_number, qr_code')
      .eq('booking_id', bookingId);

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError);
      throw new Error('Failed to fetch ticket data');
    }

    // Fetch pricing tier information from payment_orders cart_snapshot
    let pricingTier: BookingData['pricing_tier'] = undefined;
    
    if (booking.payment_order_id) {
      const { data: paymentOrder, error: paymentError } = await supabaseClient
        .from('payment_orders')
        .select('cart_snapshot')
        .eq('razorpay_order_id', booking.payment_order_id)
        .single();

      if (!paymentError && paymentOrder?.cart_snapshot) {
        // Extract pricing tier from cart snapshot
        const cartSnapshot = paymentOrder.cart_snapshot as any;
        if (cartSnapshot.items && cartSnapshot.items.length > 0) {
          const item = cartSnapshot.items[0];
          if (item.pricingTier) {
            pricingTier = {
              name: item.pricingTier.name || 'Standard',
              price: item.pricingTier.price || 0,
              quantity: item.quantity || 1,
            };
          }
        }
      }
    }

    // Validate critical fields
    if (!booking.payment_id) {
      console.warn('Booking missing Razorpay payment ID:', bookingId);
    }

    // Handle missing time_slots gracefully with fallback
    if (!booking.time_slots) {
      console.warn('Time slot information not found, using fallback data:', {
        bookingId,
        booking_date: booking.booking_date,
        booking_time: (booking as any).booking_time,
      });
      
      // Create fallback time_slots from booking_time if available
      if ((booking as any).booking_time) {
        const [start_time, end_time] = (booking as any).booking_time.split('-');
        booking.time_slots = {
          start_time,
          end_time,
          slot_date: booking.booking_date,
        } as any;
      } else {
        // Last resort fallback
        booking.time_slots = {
          start_time: '10:00:00',
          end_time: '18:00:00',
          slot_date: booking.booking_date,
        } as any;
      }
    }

    // Construct and return complete booking data
    // Use slot_date from time_slots if available, otherwise use booking_date
    const actualBookingDate = booking.time_slots?.slot_date || booking.booking_date;
    
    const bookingData: BookingData = {
      id: booking.id,
      booking_reference: booking.booking_reference,
      booking_date: actualBookingDate, // Use the correct date
      guest_name: booking.guest_name,
      guest_email: booking.guest_email,
      guest_phone: booking.guest_phone,
      total_amount: Number(booking.total_amount),
      payment_id: booking.payment_id,
      payment_order_id: booking.payment_order_id,
      exhibition_id: booking.exhibition_id,
      show_id: booking.show_id,
      time_slot_id: booking.time_slot_id,
      created_at: booking.created_at,
      exhibitions: booking.exhibitions as any,
      shows: booking.shows as any,
      time_slots: booking.time_slots as any,
      tickets: tickets || [],
      pricing_tier: pricingTier,
    };

    return bookingData;
  } catch (error) {
    console.error('Failed to fetch ticket data:', {
      bookingId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Validate UUID format
 * @param uuid - String to validate
 * @returns true if valid UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Get event title (exhibition or show)
 * @param booking - Booking data
 * @returns Event title or 'Museum Visit'
 */
export function getEventTitle(booking: BookingData): string {
  if (booking.exhibitions?.name) {
    return booking.exhibitions.name;
  }
  if (booking.shows?.name) {
    return booking.shows.name;
  }
  return 'Museum Visit';
}

/**
 * Get event description (exhibition or show)
 * @param booking - Booking data
 * @returns Event description or empty string
 */
export function getEventDescription(booking: BookingData): string {
  if (booking.exhibitions?.description) {
    return booking.exhibitions.description;
  }
  if (booking.shows?.description) {
    return booking.shows.description;
  }
  return '';
}

/**
 * Format time slot for display
 * @param timeSlot - Time slot data
 * @returns Formatted time string (e.g., "10:00 AM - 11:00 AM")
 */
export function formatTimeSlot(timeSlot: BookingData['time_slots']): string {
  const startTime = formatTime(timeSlot.start_time);
  const endTime = formatTime(timeSlot.end_time);
  return `${startTime} - ${endTime}`;
}

/**
 * Format time string to 12-hour format
 * @param time - Time string (HH:MM:SS or HH:MM)
 * @returns Formatted time (e.g., "10:00 AM")
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}
