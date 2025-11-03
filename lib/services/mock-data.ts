// Mock data services to replace Supabase temporarily
// This allows the GraphQL API to work without database integration

export interface MockExhibition {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  shortDescription: string;
  durationMinutes: number;
  capacity: number;
  images: string[];
  status: string;
  featured: boolean;
  displayOrder: number;
  pricing: MockPricing[];
  timeSlots: MockTimeSlot[];
  createdAt: string;
  updatedAt: string;
}

export interface MockShow {
  id: string;
  slug: string;
  name: string;
  type: string;
  description: string;
  durationMinutes: number;
  thumbnailUrl: string;
  status: string;
  pricing: MockPricing[];
  timeSlots: MockTimeSlot[];
  createdAt: string;
}

export interface MockPricing {
  id: string;
  ticketType: string;
  price: number;
  validFrom: string;
  validUntil?: string;
  active: boolean;
}

export interface MockTimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  availableSeats: number;
  active: boolean;
}

export interface MockBooking {
  id: string;
  bookingReference: string;
  guestName?: string;
  guestEmail?: string;
  exhibitionId?: string;
  showId?: string;
  bookingDate: string;
  timeSlotId: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  tickets: MockBookingTicket[];
  seats?: MockSeatBooking[];
  specialRequirements?: string;
  createdAt: string;
  exhibition?: MockExhibition;
  show?: MockShow;
  timeSlot?: MockTimeSlot;
}

export interface MockBookingTicket {
  id: string;
  ticketType: string;
  quantity: number;
  pricePerTicket: number;
  subtotal: number;
}

export interface MockSeatBooking {
  id: string;
  seatNumber: string;
  rowLetter: string;
}

// Mock data storage
let mockExhibitions: MockExhibition[] = [
  {
    id: '1',
    slug: 'space-exploration',
    name: 'Space Exploration Journey',
    category: 'Astronomy',
    description: 'Embark on an incredible journey through space exploration history, from the first satellites to modern space stations.',
    shortDescription: 'Journey through space exploration history',
    durationMinutes: 90,
    capacity: 50,
    images: ['/images/space-exploration-1.jpg', '/images/space-exploration-2.jpg'],
    status: 'active',
    featured: true,
    displayOrder: 1,
    pricing: [
      { id: '1', ticketType: 'adult', price: 150, validFrom: '2025-01-01', active: true },
      { id: '2', ticketType: 'child', price: 100, validFrom: '2025-01-01', active: true },
      { id: '3', ticketType: 'student', price: 120, validFrom: '2025-01-01', active: true },
    ],
    timeSlots: [
      { id: '1', startTime: '10:00', endTime: '11:30', capacity: 50, availableSeats: 45, active: true },
      { id: '2', startTime: '14:00', endTime: '15:30', capacity: 50, availableSeats: 50, active: true },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    slug: 'dinosaur-world',
    name: 'Dinosaur World',
    category: 'Paleontology',
    description: 'Step back in time to the age of dinosaurs with life-size models and interactive exhibits.',
    shortDescription: 'Explore the world of dinosaurs',
    durationMinutes: 75,
    capacity: 40,
    images: ['/images/dinosaur-1.jpg', '/images/dinosaur-2.jpg'],
    status: 'active',
    featured: true,
    displayOrder: 2,
    pricing: [
      { id: '4', ticketType: 'adult', price: 140, validFrom: '2025-01-01', active: true },
      { id: '5', ticketType: 'child', price: 90, validFrom: '2025-01-01', active: true },
    ],
    timeSlots: [
      { id: '3', startTime: '11:00', endTime: '12:15', capacity: 40, availableSeats: 40, active: true },
      { id: '4', startTime: '15:00', endTime: '16:15', capacity: 40, availableSeats: 35, active: true },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

let mockShows: MockShow[] = [
  {
    id: '1',
    slug: 'stars-and-constellations',
    name: 'Stars and Constellations',
    type: 'planetarium',
    description: 'A mesmerizing journey through the night sky, exploring constellations and celestial wonders.',
    durationMinutes: 45,
    thumbnailUrl: '/images/stars-show.jpg',
    status: 'active',
    pricing: [
      { id: '6', ticketType: 'adult', price: 200, validFrom: '2025-01-01', active: true },
      { id: '7', ticketType: 'child', price: 150, validFrom: '2025-01-01', active: true },
    ],
    timeSlots: [
      { id: '5', startTime: '13:00', endTime: '13:45', capacity: 100, availableSeats: 95, active: true },
      { id: '6', startTime: '16:00', endTime: '16:45', capacity: 100, availableSeats: 100, active: true },
    ],
    createdAt: '2025-01-01T00:00:00Z',
  },
];

let mockBookings: MockBooking[] = [];

// Mock data service functions
export const mockDataService = {
  // Exhibitions
  getExhibitions: (status?: string, featured?: boolean): MockExhibition[] => {
    let filtered = mockExhibitions;

    if (status) {
      filtered = filtered.filter(ex => ex.status === status);
    }

    if (featured !== undefined) {
      filtered = filtered.filter(ex => ex.featured === featured);
    }

    return filtered;
  },

  getExhibitionBySlug: (slug: string): MockExhibition | null => {
    return mockExhibitions.find(ex => ex.slug === slug) || null;
  },

  // Shows
  getShows: (type?: string): MockShow[] => {
    if (type) {
      return mockShows.filter(show => show.type === type);
    }
    return mockShows;
  },

  // Time Slots
  getAvailableTimeSlots: (date: string, exhibitionId?: string, showId?: string): MockTimeSlot[] => {
    const dayOfWeek = new Date(date).getDay();
    // Monday is closed (dayOfWeek === 1)
    if (dayOfWeek === 1) {
      return [];
    }

    let timeSlots: MockTimeSlot[] = [];

    if (exhibitionId) {
      const exhibition = mockExhibitions.find(ex => ex.id === exhibitionId);
      if (exhibition) {
        timeSlots = exhibition.timeSlots;
      }
    } else if (showId) {
      const show = mockShows.find(s => s.id === showId);
      if (show) {
        timeSlots = show.timeSlots;
      }
    }

    return timeSlots.filter(slot => slot.active);
  },

  // Bookings
  createBooking: (input: any): MockBooking => {
    const bookingId = Date.now().toString();
    const bookingReference = `MGM${Date.now().toString().slice(-8)}`;

    const booking: MockBooking = {
      id: bookingId,
      bookingReference,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      exhibitionId: input.exhibitionId,
      showId: input.showId,
      bookingDate: input.bookingDate,
      timeSlotId: input.timeSlotId,
      status: 'pending',
      paymentStatus: 'pending',
      totalAmount: 0,
      tickets: [],
      specialRequirements: input.specialRequirements,
      createdAt: new Date().toISOString(),
    };

    // Calculate tickets and total
    let totalAmount = 0;
    const tickets: MockBookingTicket[] = [];

    for (const ticketInput of input.tickets) {
      // Find pricing
      let pricing: MockPricing | undefined;
      if (input.exhibitionId) {
        const exhibition = mockExhibitions.find(ex => ex.id === input.exhibitionId);
        pricing = exhibition?.pricing.find(p => p.id === ticketInput.pricingId);
      } else if (input.showId) {
        const show = mockShows.find(s => s.id === input.showId);
        pricing = show?.pricing.find(p => p.id === ticketInput.pricingId);
      }

      if (pricing) {
        const subtotal = pricing.price * ticketInput.quantity;
        totalAmount += subtotal;

        tickets.push({
          id: Date.now().toString() + Math.random(),
          ticketType: pricing.ticketType,
          quantity: ticketInput.quantity,
          pricePerTicket: pricing.price,
          subtotal,
        });
      }
    }

    booking.totalAmount = totalAmount;
    booking.tickets = tickets;

    // Add seats if provided
    if (input.seats && input.seats.length > 0) {
      booking.seats = input.seats.map((seat: string) => {
        const [row, number] = seat.split(/(?=\d)/);
        return {
          id: Date.now().toString() + Math.random(),
          seatNumber: number,
          rowLetter: row,
        };
      });
    }

    mockBookings.push(booking);
    return booking;
  },

  getBookingByReference: (reference: string): MockBooking | null => {
    return mockBookings.find(b => b.bookingReference === reference) || null;
  },

  confirmBooking: (reference: string): MockBooking | null => {
    const booking = mockBookings.find(b => b.bookingReference === reference);
    if (booking) {
      booking.status = 'confirmed';
      booking.paymentStatus = 'paid';
    }
    return booking || null;
  },

  cancelBooking: (reference: string): MockBooking | null => {
    const booking = mockBookings.find(b => b.bookingReference === reference);
    if (booking) {
      booking.status = 'cancelled';
      booking.paymentStatus = 'refunded';
    }
    return booking || null;
  },

  getMyBookings: (): MockBooking[] => {
    return mockBookings;
  },

  // Utility functions
  generateBookingReference: (): string => {
    return `MGM${Date.now().toString().slice(-8)}`;
  },

  // Get booked seats for availability checking
  getBookedSeats: (showId: string, date: string, timeSlotId: string): string[] => {
    return mockBookings
      .filter(b =>
        b.showId === showId &&
        b.bookingDate === date &&
        b.timeSlotId === timeSlotId &&
        (b.status === 'confirmed' || b.status === 'pending')
      )
      .flatMap(b => b.seats?.map(s => `${s.rowLetter}${s.seatNumber}`) || []);
  },
};