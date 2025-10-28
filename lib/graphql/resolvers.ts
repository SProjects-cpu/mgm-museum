import { useExhibitionsStore } from '@/lib/store/exhibitions';
import { useShowsStore } from '@/lib/store/shows';
import { useBookingsStore } from '@/lib/store/bookings';
import { useEventsStore } from '@/lib/store/events';
import { useUsersStore } from '@/lib/store/users';
import { generateBookingReference } from '@/lib/utils';

// Helper function to get store data
const getStoreData = () => {
  return {
    exhibitions: useExhibitionsStore.getState(),
    shows: useShowsStore.getState(),
    bookings: useBookingsStore.getState(),
    events: useEventsStore.getState(),
    users: useUsersStore.getState(),
  };
};

export const resolvers = {
  Query: {
    exhibitions: (_: any, { status, featured }: any) => {
      const { exhibitions } = getStoreData();
      let filteredExhibitions = exhibitions.exhibitions;

      if (status) {
        filteredExhibitions = filteredExhibitions.filter(ex => ex.status === status);
      }

      if (featured !== undefined) {
        filteredExhibitions = filteredExhibitions.filter(ex => ex.featured === featured);
      }

      return filteredExhibitions;
    },

    exhibition: (_: any, { slug }: any) => {
      const { exhibitions } = getStoreData();
      return exhibitions.getExhibitionBySlug(slug);
    },

    shows: (_: any, { type }: any) => {
      const { shows } = getStoreData();
      let filteredShows = shows.shows;

      if (type) {
        filteredShows = filteredShows.filter(show => show.type === type);
      }

      return filteredShows;
    },

    show: (_: any, { slug }: any) => {
      const { shows } = getStoreData();
      return shows.getShowBySlug(slug);
    },

    availableTimeSlots: (_: any, { date, exhibitionId, showId }: any) => {
      const { shows } = getStoreData();
      
      if (showId) {
        const show = shows.shows.find(s => s.id === showId);
        return show && show.timeSlots ? show.timeSlots.filter(ts => ts.active) : [];
      }

      // For exhibitions, return default time slots
      return [
        {
          id: 'ts-default-1',
          showId: null,
          startTime: '10:00',
          endTime: '11:00',
          capacity: 100,
          active: true,
        },
        {
          id: 'ts-default-2',
          showId: null,
          startTime: '14:00',
          endTime: '15:00',
          capacity: 100,
          active: true,
        },
        {
          id: 'ts-default-3',
          showId: null,
          startTime: '16:00',
          endTime: '17:00',
          capacity: 100,
          active: true,
        },
      ];
    },

    booking: (_: any, { reference }: any) => {
      const { bookings } = getStoreData();
      return bookings.getBookingByReference(reference);
    },

    myBookings: () => {
      const { bookings, users } = getStoreData();
      const currentUser = users.currentUser;
      
      if (!currentUser) {
        return [];
      }

      return bookings.getUserBookings(currentUser.id);
    },

    events: (_: any, { status }: any) => {
      const { events } = getStoreData();
      let filteredEvents = events.events;

      if (status) {
        filteredEvents = filteredEvents.filter(event => event.status === status);
      }

      return filteredEvents;
    },

    event: (_: any, { slug }: any) => {
      const { events } = getStoreData();
      return events.events.find(event => event.slug === slug);
    },

    pricing: (_: any, { exhibitionId, showId }: any) => {
      const { exhibitions, shows } = getStoreData();
      
      if (exhibitionId) {
        const exhibition = exhibitions.exhibitions.find(ex => ex.id === exhibitionId);
        return exhibition ? exhibition.pricing : [];
      }

      if (showId) {
        const show = shows.shows.find(s => s.id === showId);
        return show ? show.pricing : [];
      }

      return [];
    },

    bookedSeats: (_: any, { showId, date, timeSlotId }: any) => {
      const { bookings } = getStoreData();
      return bookings.getBookedSeats(showId, new Date(date), timeSlotId);
    },
  },

  Mutation: {
    createBooking: (_: any, { input }: any) => {
      const { bookings, exhibitions, shows } = getStoreData();
      
      // Calculate total amount
      let totalAmount = 0;
      const tickets: any[] = [];

      // Get pricing information
      let pricingList: any[] = [];
      if (input.exhibitionId) {
        const exhibition = exhibitions.exhibitions.find(ex => ex.id === input.exhibitionId);
        pricingList = exhibition && exhibition.pricing ? exhibition.pricing : [];
      } else if (input.showId) {
        const show = shows.shows.find(s => s.id === input.showId);
        pricingList = show && show.pricing ? show.pricing : [];
      }

      // Process tickets
      input.tickets.forEach((pricingId: any, index: number) => {
        const pricing = pricingList.find(p => p.id === pricingId);
        if (pricing) {
          const quantity = 1; // For now, assume 1 ticket per pricing ID
          const subtotal = pricing.price * quantity;
          totalAmount += subtotal;

          tickets.push({
            id: `bt-${Date.now()}-${index}`,
            bookingId: '', // Will be set after booking creation
            pricingId: pricingId,
            quantity: quantity,
            pricePerTicket: pricing.price,
            subtotal: subtotal,
            ticketType: pricing.ticketType,
          });
        }
      });

      // Process seats
      const seats = input.seats?.map((seatIdentifier: any, index: number) => {
        const [rowLetter, seatNumber] = seatIdentifier.split(/(?=\d)/);
        return {
          id: `s-${Date.now()}-${index}`,
          bookingId: '', // Will be set after booking creation
          seatNumber: seatNumber,
          rowLetter: rowLetter,
        };
      }) || [];

      // Create booking
      const bookingData = {
        userId: undefined, // Guest booking
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        exhibitionId: input.exhibitionId,
        showId: input.showId,
        bookingDate: new Date(input.bookingDate),
        timeSlotId: input.timeSlotId,
        status: 'confirmed' as const,
        paymentStatus: 'paid' as const,
        totalAmount: totalAmount,
        tickets: tickets,
        seats: seats,
      };

      const booking = bookings.addBooking(bookingData);

      // Update ticket and seat IDs
      tickets.forEach((ticket: any) => {
        ticket.bookingId = booking.id;
      });
      seats.forEach((seat: any) => {
        seat.bookingId = booking.id;
      });

      return booking;
    },

    cancelBooking: (_: any, { reference }: any) => {
      const { bookings } = getStoreData();
      const booking = bookings.getBookingByReference(reference);
      
      if (!booking) {
        throw new Error('Booking not found');
      }

      bookings.cancelBooking(booking.id);
      return { ...booking, status: 'cancelled', paymentStatus: 'refunded' };
    },

    registerForEvent: (_: any, { input }: any) => {
      const { events } = getStoreData();
      
      const registrationData = {
        eventId: input.eventId,
        userId: undefined, // Guest registration
        name: input.name,
        email: input.email,
        phone: input.phone,
        status: 'registered' as const,
      };

      events.registerForEvent(registrationData);
      return `registration-${Date.now()}`;
    },

    subscribeNewsletter: (_: any, { email, name }: any) => {
      // For demo purposes, just return success
      return `subscribed-${Date.now()}`;
    },

    submitContactForm: (_: any, { input }: any) => {
      // For demo purposes, just return success
      return `submission-${Date.now()}`;
    },

    // Admin mutations
    addExhibition: (_: any, { input }: any) => {
      const { exhibitions } = getStoreData();
      const exhibitionData = JSON.parse(input);
      exhibitions.addExhibition(exhibitionData);
      return exhibitions.exhibitions[exhibitions.exhibitions.length - 1];
    },

    updateExhibition: (_: any, { id, input }: any) => {
      const { exhibitions } = getStoreData();
      const updates = JSON.parse(input);
      exhibitions.updateExhibition(id, updates);
      return exhibitions.exhibitions.find(ex => ex.id === id);
    },

    deleteExhibition: (_: any, { id }: any) => {
      const { exhibitions } = getStoreData();
      exhibitions.deleteExhibition(id);
      return true;
    },

    toggleExhibitionFeatured: (_: any, { id }: any) => {
      const { exhibitions } = getStoreData();
      exhibitions.toggleFeatured(id);
      return exhibitions.exhibitions.find(ex => ex.id === id);
    },

    updateBookingStatus: (_: any, { id, status }: any) => {
      const { bookings } = getStoreData();
      bookings.updateBookingStatus(id, status);
      return bookings.bookings.find(b => b.id === id);
    },
  },
};

