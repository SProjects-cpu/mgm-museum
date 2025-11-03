// @ts-nocheck
import { createYoga } from 'graphql-yoga';
import { createSchema } from 'graphql-yoga';
import {
  getExhibitions,
  getExhibitionBySlug,
  getShows,
  getAvailableTimeSlots,
  getEvents,
  getEventBySlug,
  registerForEvent,
  subscribeNewsletter,
  submitContactForm
} from '@/lib/graphql/resolvers-impl';

// Define GraphQL Schema
const typeDefs = `
  type Query {
    exhibitions(status: String, featured: Boolean): [Exhibition!]!
    exhibition(slug: String!): Exhibition
    shows(type: String): [Show!]!
    show(slug: String!): Show
    availableTimeSlots(date: String!, exhibitionId: ID, showId: ID): [TimeSlot!]!
    booking(reference: String!, email: String): Booking
    myBookings: [Booking!]!
    events(status: String): [Event!]!
    event(slug: String!): Event
    pricing(exhibitionId: ID, showId: ID): [Pricing!]!
  }

  type Mutation {
    createBooking(input: CreateBookingInput!): BookingResponse!
    confirmBooking(reference: String!): Booking!
    cancelBooking(reference: String!): Booking!
    registerForEvent(input: EventRegistrationInput!): EventRegistration!
    subscribeNewsletter(email: String!, name: String): NewsletterSubscription!
    submitContactForm(input: ContactFormInput!): ContactSubmission!
  }

  type Exhibition {
    id: ID!
    slug: String!
    name: String!
    category: String!
    description: String
    shortDescription: String
    durationMinutes: Int!
    capacity: Int!
    images: [String!]!
    videoUrl: String
    virtualTourUrl: String
    status: String!
    featured: Boolean!
    displayOrder: Int!
    pricing: [Pricing!]!
    timeSlots: [TimeSlot!]!
    createdAt: String!
    updatedAt: String!
  }

  type Show {
    id: ID!
    slug: String!
    name: String!
    type: String!
    description: String
    durationMinutes: Int!
    trailerUrl: String
    thumbnailUrl: String
    status: String!
    pricing: [Pricing!]!
    timeSlots: [TimeSlot!]!
    createdAt: String!
  }

  type Pricing {
    id: ID!
    ticketType: String!
    price: Float!
    validFrom: String!
    validUntil: String
    active: Boolean!
  }

  type TimeSlot {
    id: ID!
    startTime: String!
    endTime: String!
    capacity: Int!
    availableSeats: Int
    active: Boolean!
  }

  type Booking {
    id: ID!
    bookingReference: String!
    guestName: String
    guestEmail: String
    exhibition: Exhibition
    show: Show
    bookingDate: String!
    timeSlot: TimeSlot!
    status: String!
    paymentStatus: String!
    totalAmount: Float!
    tickets: [BookingTicket!]!
    seats: [SeatBooking!]
    specialRequirements: String
    createdAt: String!
  }

  type BookingTicket {
    id: ID!
    ticketType: String!
    quantity: Int!
    pricePerTicket: Float!
    subtotal: Float!
  }

  type SeatBooking {
    id: ID!
    seatNumber: String!
    rowLetter: String!
  }

  type Event {
    id: ID!
    title: String!
    slug: String!
    description: String
    eventDate: String!
    startTime: String!
    endTime: String!
    location: String!
    maxParticipants: Int
    featuredImage: String
    status: String!
  }

  type EventRegistration {
    id: ID!
    name: String!
    email: String!
    status: String!
  }

  type NewsletterSubscription {
    email: String!
    subscribedAt: String!
  }

  type ContactSubmission {
    id: ID!
    name: String!
    email: String!
    subject: String!
    message: String!
  }

  type BookingResponse {
    booking: Booking!
    paymentOrder: PaymentOrder
  }

  type PaymentOrder {
    id: String!
    amount: Int!
    currency: String!
    status: String!
  }

  input CreateBookingInput {
    userId: ID
    guestName: String
    guestEmail: String
    guestPhone: String
    exhibitionId: ID
    showId: ID
    bookingDate: String!
    timeSlotId: ID!
    tickets: [TicketInput!]!
    seats: [String!]
    specialRequirements: String
  }

  input TicketInput {
    pricingId: ID!
    quantity: Int!
  }

  input EventRegistrationInput {
    eventId: ID!
    name: String!
    email: String!
    phone: String
  }

  input ContactFormInput {
    name: String!
    email: String!
    phone: String
    subject: String!
    message: String!
  }
`;

// Real database resolvers using Supabase
const resolvers = {
  Query: {
    exhibitions: async (_: any, { status, featured }: any) => {
      try {
        const exhibitions = await getExhibitions(status);
        return exhibitions.filter((ex: any) => featured === undefined || ex.featured === featured);
      } catch (error) {
        console.error('Error fetching exhibitions:', error);
        return [];
      }
    },

    exhibition: async (_: any, { slug }: any) => {
      try {
        return await getExhibitionBySlug(slug);
      } catch (error) {
        console.error('Error fetching exhibition:', error);
        return null;
      }
    },

    shows: async (_: any, { type }: any) => {
      try {
        return await getShows(type);
      } catch (error) {
        console.error('Error fetching shows:', error);
        return [];
      }
    },

    availableTimeSlots: async (_: any, { date, exhibitionId, showId }: any) => {
      try {
        return await getAvailableTimeSlots(date, exhibitionId, showId);
      } catch (error) {
        console.error('Error fetching time slots:', error);
        return [];
      }
    },

    booking: async (_: any, { reference, email }: any) => {
      try {
        return await getBookingByReference(reference, email);
      } catch (error) {
        console.error('Error fetching booking:', error);
        return null;
      }
    },

    myBookings: async (_: any, { }, context: any) => {
      try {
        // For now, return empty array as user authentication is not implemented
        // In a real app, you'd get the user from context
        return [];
      } catch (error) {
        console.error('Error fetching user bookings:', error);
        return [];
      }
    },
  },

  Mutation: {
    createBooking: async (_: any, { input }: any) => {
      try {
        const booking = await createBooking(input);
        return { booking };
      } catch (error: any) {
        console.error('Error creating booking:', error);
        throw new Error(`Booking creation failed: ${error.message}`);
      }
    },

    confirmBooking: async (_: any, { reference }: any) => {
      try {
        return await confirmBooking(reference);
      } catch (error: any) {
        console.error('Error confirming booking:', error);
        throw new Error(`Booking confirmation failed: ${error.message}`);
      }
    },

    cancelBooking: async (_: any, { reference }: any) => {
      try {
        return await cancelBooking(reference);
      } catch (error: any) {
        console.error('Error cancelling booking:', error);
        throw new Error(`Booking cancellation failed: ${error.message}`);
      }
    },

    registerForEvent: async (_: any, { input }: any) => {
      try {
        const registration = await registerForEvent(input);
        return { id: (registration as any).id };
      } catch (error: any) {
        console.error('Error registering for event:', error);
        throw new Error(`Event registration failed: ${error.message}`);
      }
    },

    subscribeNewsletter: async (_: any, { email, name }: any) => {
      try {
        const subscriber = await subscribeNewsletter(email, name);
        return { email: (subscriber as any).email };
      } catch (error: any) {
        console.error('Error subscribing to newsletter:', error);
        throw new Error(`Newsletter subscription failed: ${error.message}`);
      }
    },

    submitContactForm: async (_: any, { input }: any) => {
      try {
        const submission = await submitContactForm(input);
        return { id: (submission as any).id };
      } catch (error: any) {
        console.error('Error submitting contact form:', error);
        throw new Error(`Contact form submission failed: ${error.message}`);
      }
    },
  },
};

const schema = createSchema({
  typeDefs,
  resolvers,
});

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
});

export { handleRequest as GET, handleRequest as POST };






