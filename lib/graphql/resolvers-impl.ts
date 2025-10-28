// @ts-nocheck
import { getServiceSupabase, validateDatabaseConnection } from '@/lib/supabase/client';
import { generateTicketPDF, generateQRCode } from '@/lib/services/pdf-generator';
import { sendBookingConfirmation, sendEventRegistration } from '@/lib/services/email';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { Database } from '@/types/database';

const supabase = getServiceSupabase();

/**
 * Get all exhibitions with filters
 */
export async function getExhibitions(status?: Database['public']['Enums']['exhibition_status']) {
  let query = supabase
    .from('exhibitions')
    .select(`
      *,
      pricing (*),
      timeSlots:time_slots (*)
    `)
    .order('display_order', { ascending: true });

  if (status) {
    query = (query as any).eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch exhibitions: ${error.message}`);

  return data || [];
}

/**
 * Get single exhibition by slug
 */
export async function getExhibitionBySlug(slug: string) {
  const { data, error } = await supabase
    .from('exhibitions')
    .select(`
      *,
      pricing (*),
      timeSlots:time_slots (*)
    `)
    .eq('slug' as any, slug as any)
    .single();

  if (error) throw new Error(`Exhibition not found: ${error.message}`);

  return data;
}

/**
 * Get all shows with filters
 */
export async function getShows(type?: Database['public']['Enums']['show_type']) {
  let query = supabase
    .from('shows')
    .select(`
      *,
      pricing (*),
      timeSlots:time_slots (*)
    `)
    .eq('status' as any, 'active' as any);

  if (type) {
    query = (query as any).eq('type', type);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch shows: ${error.message}`);

  return data || [];
}

/**
 * Get available time slots for a specific date
 */
export async function getAvailableTimeSlots(
  date: string,
  exhibitionId?: string,
  showId?: string
) {
  const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Check if it's Monday (closed)
  if (dayOfWeek === 1) {
    return [];
  }

  let query = supabase
    .from('time_slots')
    .select('*')
    .eq('active' as any, true as any)
    .or(`day_of_week.is.null,day_of_week.eq.${dayOfWeek}`);

  if (exhibitionId) {
    query = query.eq('exhibition_id' as any, exhibitionId as any);
  }
  if (showId) {
    query = query.eq('show_id' as any, showId as any);
  }

  const { data: timeSlots, error } = await query;

  if (error) throw new Error(`Failed to fetch time slots: ${error.message}`);

  // Calculate available seats for each time slot
  const slotsWithAvailability = await Promise.all(
    (timeSlots || []).map(async (slot: any) => {
      // Get booked seats count for this slot on this date
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('time_slot_id' as any, slot.id as any)
        .eq('booking_date' as any, date as any)
        .in('status' as any, ['confirmed', 'pending'] as any);

      const bookedSeats = count || 0;
      const availableSeats = slot.capacity - bookedSeats;

      return {
        ...slot,
        availableSeats,
        isAvailable: availableSeats > 0,
      };
    })
  );

  return slotsWithAvailability;
}

/**
 * Create a new booking
 */
export async function createBooking(input: {
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  exhibitionId?: string;
  showId?: string;
  bookingDate: string;
  timeSlotId: string;
  tickets: Array<{ pricingId: string; quantity: number }>;
  seats?: string[];
  specialRequirements?: string;
}) {
  // Calculate total amount
  let totalAmount = 0;
  const ticketDetails: any[] = [];

  for (const ticket of input.tickets) {
    // Try to get pricing from database
    const { data: pricing, error } = await supabase
      .from('pricing')
      .select('*')
      .eq('id' as any, ticket.pricingId as any)
      .single();

    let pricePerTicket = 0;
    
    if (error || !pricing) {
      // Fallback: use price from ticket if provided, otherwise use default
      console.warn(`Pricing ID ${ticket.pricingId} not found in database, using fallback`);
      pricePerTicket = (ticket as any).pricePerTicket || 90; // Default price
    } else {
      const pricingData = pricing as any;
      pricePerTicket = pricingData.price;
    }

    const subtotal = pricePerTicket * ticket.quantity;
    totalAmount += subtotal;

    ticketDetails.push({
      pricingId: ticket.pricingId,
      quantity: ticket.quantity,
      pricePerTicket: pricePerTicket,
      subtotal,
    });
  }

  // Check availability
  const { count: bookedCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('time_slot_id' as any, input.timeSlotId as any)
    .eq('booking_date' as any, input.bookingDate as any)
    .in('status' as any, ['confirmed', 'pending'] as any);

  const { data: timeSlot } = await supabase
    .from('time_slots')
    .select('capacity')
    .eq('id' as any, input.timeSlotId as any)
    .single();

  const totalTickets = input.tickets.reduce((sum, t) => sum + t.quantity, 0);
  const timeSlotData = timeSlot as any;
  const availableSeats = (timeSlotData?.capacity || 0) - (bookedCount || 0);

  if (availableSeats < totalTickets) {
    throw new Error(`Only ${availableSeats} seats available`);
  }

  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      user_id: input.userId || null,
      guest_name: input.guestName || null,
      guest_email: input.guestEmail || null,
      guest_phone: input.guestPhone || null,
      exhibition_id: input.exhibitionId || null,
      show_id: input.showId || null,
      booking_date: input.bookingDate,
      time_slot_id: input.timeSlotId,
      status: 'pending',
      payment_status: 'pending',
      total_amount: totalAmount,
      special_requirements: input.specialRequirements || null,
    } as any)
    .select()
    .single();

  if (bookingError || !booking) {
    throw new Error(`Failed to create booking: ${bookingError?.message}`);
  }

  // Create booking tickets
  const { error: ticketsError } = await supabase
    .from('booking_tickets')
    .insert(
      ticketDetails.map((ticket) => ({
        booking_id: (booking as any).id,
        pricing_id: ticket.pricingId,
        quantity: ticket.quantity,
        price_per_ticket: ticket.pricePerTicket,
        subtotal: ticket.subtotal,
      })) as any
    );

  if (ticketsError) {
    throw new Error(`Failed to create tickets: ${ticketsError.message}`);
  }

  // Create seat bookings (if applicable)
  if (input.seats && input.seats.length > 0) {
    const { error: seatsError } = await supabase
      .from('seat_bookings')
      .insert(
        input.seats.map((seat) => {
          const [row, number] = seat.split(/(?=\d)/);
          return {
            booking_id: (booking as any).id,
            row_letter: row,
            seat_number: number,
          };
        }) as any
      );

    if (seatsError) {
      throw new Error(`Failed to book seats: ${seatsError.message}`);
    }
  }

  return booking;
}

/**
 * Confirm booking and send email with ticket
 */
export async function confirmBooking(bookingReference: string) {
  // Get booking details
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      exhibition:exhibitions(*),
      show:shows(*),
      timeSlot:time_slots(*),
      tickets:booking_tickets(*, pricing(*)),
      seats:seat_bookings(*)
    `)
    .eq('booking_reference' as any, bookingReference)
    .single();

  if (error || !booking) {
    throw new Error(`Booking not found: ${error?.message}`);
  }

  // Update status to confirmed
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      payment_status: 'paid',
    })
    .eq('id', (booking as any).id);

  if (updateError) {
    throw new Error(`Failed to confirm booking: ${updateError.message}`);
  }

  // Generate QR Code
  const qrCodeUrl = await generateQRCode(bookingReference);

  // Generate PDF Ticket (using type assertion for Supabase data)
  const bookingData = booking as any;
  const exhibitionName = bookingData.exhibition?.name || bookingData.show?.name || 'Experience';
  const ticketPdf = await generateTicketPDF({
    bookingReference,
    customerName: bookingData.guest_name || 'Guest',
    customerEmail: bookingData.guest_email || '',
    exhibition: exhibitionName,
    date: new Date(bookingData.booking_date).toLocaleDateString('en-IN'),
    time: bookingData.timeSlot?.start_time || '',
    tickets: bookingData.tickets?.map((t: any) => ({
      type: t.pricing?.ticket_type || 'standard',
      quantity: t.quantity,
      price: t.price_per_ticket,
    })) || [],
    totalAmount: bookingData.total_amount,
    specialRequirements: bookingData.special_requirements || undefined,
    seats: bookingData.seats?.map((s: any) => `${s.row_letter}${s.seat_number}`) || undefined,
  });

  // Save PDF to storage (or send directly)
  const pdfPath = `/tickets/${bookingReference}.pdf`;
  // In production, upload to Supabase Storage
  // For now, save locally
  try {
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'tickets');
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(join(uploadsDir, `${bookingReference}.pdf`), ticketPdf);
  } catch (err) {
    console.error('Error saving PDF:', err);
  }

  // Send confirmation email
  if (bookingData.guest_email) {
    await sendBookingConfirmation({
      bookingReference,
      customerName: bookingData.guest_name || 'Guest',
      customerEmail: bookingData.guest_email,
      exhibitionName,
      date: new Date(bookingData.booking_date).toLocaleDateString('en-IN'),
      time: bookingData.timeSlot?.start_time || '',
      ticketCount: bookingData.tickets?.reduce((sum: number, t: any) => sum + t.quantity, 0) || 0,
      totalAmount: bookingData.total_amount,
      qrCodeUrl,
      ticketPdfUrl: `/uploads/tickets/${bookingReference}.pdf`,
      specialRequirements: bookingData.special_requirements || undefined,
    });
  }

  return booking;
}

/**
 * Cancel booking
 */
export async function cancelBooking(bookingReference: string) {
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*')
    .eq('booking_reference' as any, bookingReference)
    .single();

  if (fetchError || !booking) {
    throw new Error(`Booking not found: ${fetchError?.message}`);
  }

  // Check if cancellation is allowed (24 hours before)
  const bookingData = booking as any;
  const bookingDateTime = new Date(bookingData.booking_date);
  const now = new Date();
  const hoursDiff = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursDiff < 24) {
    throw new Error('Cancellation not allowed within 24 hours of booking');
  }

  // Update status
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      payment_status: 'refunded',
    })
    .eq('id', (booking as any).id);

  if (updateError) {
    throw new Error(`Failed to cancel booking: ${updateError.message}`);
  }

  // Send cancellation email
  // await sendBookingCancellation({ ... });

  return { ...booking, status: 'cancelled' };
}

/**
 * Register for event
 */
// Events functions
export async function getEvents(status?: Database['public']['Enums']['event_status']) {
  const supabase = createClient();
  
  let query = supabase
    .from('events')
    .select(`
      *,
      event_registrations(count)
    `)
    .order('event_date', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  } else {
    // Default: only show upcoming and ongoing events for public
    query = query.in('status', ['upcoming', 'ongoing']);
  }

  const { data: events, error } = await query;

  if (error) {
    console.error('Error fetching events:', error);
    throw new Error('Failed to fetch events');
  }

  return events?.map(event => ({
    ...event,
    registeredCount: event.event_registrations?.[0]?.count || 0
  })) || [];
}

export async function getEventBySlug(slug: string) {
  const supabase = createClient();
  
  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      event_registrations(count)
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching event:', error);
    return null;
  }

  return {
    ...event,
    registeredCount: event.event_registrations?.[0]?.count || 0
  };
}

export async function registerForEvent(input: {
  eventId: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
}) {
  // Check event capacity
  const { data: event } = await supabase
    .from('events')
    .select('*, registrations:event_registrations(count)')
    .eq('id', input.eventId)
    .single();

  if (!event) {
    throw new Error('Event not found');
  }

  if (event.max_participants) {
    const currentCount = event.registrations?.[0]?.count || 0;
    if (currentCount >= event.max_participants) {
      throw new Error('Event is full');
    }
  }

  // Create registration
  const { data: registration, error } = await supabase
    .from('event_registrations')
    .insert({
      event_id: input.eventId,
      user_id: input.userId || null,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      status: 'registered',
    })
    .select()
    .single();

  if (error || !registration) {
    throw new Error(`Failed to register: ${error?.message}`);
  }

  // Send confirmation email
  await sendEventRegistration({
    eventTitle: event.title,
    customerName: input.name,
    customerEmail: input.email,
    eventDate: new Date(event.event_date).toLocaleDateString('en-IN'),
    eventTime: `${event.start_time} - ${event.end_time}`,
    location: event.location,
    registrationId: registration.id,
  });

  return registration;
}

/**
 * Get user's bookings
 */
export async function getMyBookings(userId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      exhibition:exhibitions(*),
      show:shows(*),
      timeSlot:time_slots(*),
      tickets:booking_tickets(*, pricing(*))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch bookings: ${error.message}`);

  return data || [];
}

/**
 * Get booking by reference (for guests)
 */
export async function getBookingByReference(reference: string, email?: string) {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      exhibition:exhibitions(*),
      show:shows(*),
      timeSlot:time_slots(*),
      tickets:booking_tickets(*, pricing(*)),
      seats:seat_bookings(*)
    `)
    .eq('booking_reference' as any, reference);

  // For guest bookings, verify email
  if (email) {
    query = query.eq('guest_email', email);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    throw new Error(`Booking not found or access denied: ${error?.message}`);
  }

  return data;
}

/**
 * Subscribe to newsletter
 */
export async function subscribeNewsletter(email: string, name?: string) {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .insert({
      email,
      name: name || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique violation
      throw new Error('Email already subscribed');
    }
    throw new Error(`Failed to subscribe: ${error.message}`);
  }

  return data;
}

/**
 * Submit contact form
 */
export async function submitContactForm(input: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  const { data, error } = await supabase
    .from('contact_submissions')
    .insert({
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      subject: input.subject,
      message: input.message,
      status: 'new',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit form: ${error.message}`);
  }

  // Send auto-response email
  // await sendContactAutoResponse(input.email, input.name);

  return data;
}

/**
 * Admin: Get analytics data
 */
export async function getAnalytics(startDate: string, endDate: string) {
  // Get bookings in date range
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      exhibition:exhibitions(name),
      show:shows(name),
      tickets:booking_tickets(*)
    `)
    .gte('booking_date', startDate)
    .lte('booking_date', endDate);

  if (error) throw new Error(`Failed to fetch analytics: ${error.message}`);

  // Calculate metrics
  const totalBookings = bookings?.length || 0;
  const confirmedBookings = bookings?.filter((b) => b.status === 'confirmed').length || 0;
  const totalRevenue = bookings?.reduce((sum, b) => sum + parseFloat(b.total_amount), 0) || 0;
  const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  // Group by date for trends
  const bookingsByDate = (bookings || []).reduce((acc: any, booking) => {
    const date = booking.booking_date;
    if (!acc[date]) {
      acc[date] = { date, count: 0, revenue: 0 };
    }
    acc[date].count++;
    acc[date].revenue += parseFloat(booking.total_amount);
    return acc;
  }, {});

  return {
    totalBookings,
    confirmedBookings,
    totalRevenue,
    averageBookingValue,
    bookingTrends: Object.values(bookingsByDate),
    rawBookings: bookings,
  };
}

/**
 * Admin: Create/Update exhibition
 */
export async function upsertExhibition(input: any) {
  const { data, error } = await supabase
    .from('exhibitions')
    .upsert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to save exhibition: ${error.message}`);

  return data;
}

/**
 * Admin: Delete exhibition
 */
export async function deleteExhibition(id: string) {
  const { error } = await supabase
    .from('exhibitions')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete exhibition: ${error.message}`);

  return { success: true };
}


