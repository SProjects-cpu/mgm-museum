import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean, GraphQLList, GraphQLNonNull, GraphQLID, GraphQLEnumType, GraphQLInputObjectType } from 'graphql';
import { GraphQLDate, GraphQLDateTime } from 'graphql-scalars';
import { useExhibitionsStore } from '@/lib/store/exhibitions';
import { useShowsStore } from '@/lib/store/shows';
import { useBookingsStore } from '@/lib/store/bookings';
import { useEventsStore } from '@/lib/store/events';
import { useUsersStore } from '@/lib/store/users';
import { generateBookingReference } from '@/lib/utils';

// Enums
const ExhibitionStatus = new GraphQLEnumType({
  name: 'ExhibitionStatus',
  values: {
    ACTIVE: { value: 'active' },
    INACTIVE: { value: 'inactive' },
    COMING_SOON: { value: 'coming_soon' },
    MAINTENANCE: { value: 'maintenance' },
  },
});

const BookingStatus = new GraphQLEnumType({
  name: 'BookingStatus',
  values: {
    PENDING: { value: 'pending' },
    CONFIRMED: { value: 'confirmed' },
    CANCELLED: { value: 'cancelled' },
    COMPLETED: { value: 'completed' },
  },
});

const PaymentStatus = new GraphQLEnumType({
  name: 'PaymentStatus',
  values: {
    PENDING: { value: 'pending' },
    PAID: { value: 'paid' },
    REFUNDED: { value: 'refunded' },
    FAILED: { value: 'failed' },
  },
});

const TicketType = new GraphQLEnumType({
  name: 'TicketType',
  values: {
    ADULT: { value: 'adult' },
    CHILD: { value: 'child' },
    STUDENT: { value: 'student' },
    SENIOR: { value: 'senior' },
    GROUP: { value: 'group' },
  },
});

const UserRole = new GraphQLEnumType({
  name: 'UserRole',
  values: {
    CUSTOMER: { value: 'customer' },
    ADMIN: { value: 'admin' },
    SUPER_ADMIN: { value: 'super_admin' },
  },
});

// Types
const PricingType = new GraphQLObjectType({
  name: 'Pricing',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    ticketType: { type: new GraphQLNonNull(TicketType) },
    price: { type: new GraphQLNonNull(GraphQLFloat) },
    active: { type: new GraphQLNonNull(GraphQLBoolean) },
    validFrom: { type: new GraphQLNonNull(GraphQLDate) },
  },
});

const TimeSlotType = new GraphQLObjectType({
  name: 'TimeSlot',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    showId: { type: GraphQLID },
    startTime: { type: new GraphQLNonNull(GraphQLString) },
    endTime: { type: new GraphQLNonNull(GraphQLString) },
    capacity: { type: new GraphQLNonNull(GraphQLInt) },
    active: { type: new GraphQLNonNull(GraphQLBoolean) },
  },
});

const ExhibitionType = new GraphQLObjectType({
  name: 'Exhibition',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    slug: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    category: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    shortDescription: { type: new GraphQLNonNull(GraphQLString) },
    durationMinutes: { type: new GraphQLNonNull(GraphQLInt) },
    capacity: { type: new GraphQLNonNull(GraphQLInt) },
    images: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) },
    status: { type: new GraphQLNonNull(ExhibitionStatus) },
    featured: { type: new GraphQLNonNull(GraphQLBoolean) },
    displayOrder: { type: new GraphQLNonNull(GraphQLInt) },
    createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    updatedAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    pricing: { type: new GraphQLNonNull(new GraphQLList(PricingType)) },
  },
});

const ShowType = new GraphQLObjectType({
  name: 'Show',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    slug: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    type: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString }, // Made nullable
    durationMinutes: { type: GraphQLInt }, // Made nullable to handle database null values
    thumbnailUrl: { type: GraphQLString }, // Made nullable
    status: { type: new GraphQLNonNull(GraphQLString) },
    createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    pricing: { type: new GraphQLList(PricingType) }, // Made nullable
    timeSlots: { type: new GraphQLList(TimeSlotType) }, // Made nullable
  },
});

const BookingTicketType = new GraphQLObjectType({
  name: 'BookingTicket',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    bookingId: { type: new GraphQLNonNull(GraphQLID) },
    pricingId: { type: new GraphQLNonNull(GraphQLID) },
    quantity: { type: new GraphQLNonNull(GraphQLInt) },
    pricePerTicket: { type: new GraphQLNonNull(GraphQLFloat) },
    subtotal: { type: new GraphQLNonNull(GraphQLFloat) },
    ticketType: { type: new GraphQLNonNull(TicketType) },
  },
});

const SeatType = new GraphQLObjectType({
  name: 'Seat',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    bookingId: { type: new GraphQLNonNull(GraphQLID) },
    seatNumber: { type: new GraphQLNonNull(GraphQLString) },
    rowLetter: { type: new GraphQLNonNull(GraphQLString) },
  },
});

const BookingType = new GraphQLObjectType({
  name: 'Booking',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    bookingReference: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: GraphQLID },
    guestName: { type: GraphQLString },
    guestEmail: { type: GraphQLString },
    guestPhone: { type: GraphQLString },
    exhibitionId: { type: GraphQLID },
    showId: { type: GraphQLID },
    bookingDate: { type: new GraphQLNonNull(GraphQLDate) },
    timeSlotId: { type: new GraphQLNonNull(GraphQLID) },
    status: { type: new GraphQLNonNull(BookingStatus) },
    paymentStatus: { type: new GraphQLNonNull(PaymentStatus) },
    totalAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    updatedAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    tickets: { type: new GraphQLNonNull(new GraphQLList(BookingTicketType)) },
    seats: { type: new GraphQLList(SeatType) },
  },
});

const EventType = new GraphQLObjectType({
  name: 'Event',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    slug: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    eventDate: { type: new GraphQLNonNull(GraphQLDate) },
    startTime: { type: new GraphQLNonNull(GraphQLString) },
    endTime: { type: new GraphQLNonNull(GraphQLString) },
    location: { type: new GraphQLNonNull(GraphQLString) },
    maxParticipants: { type: GraphQLInt },
    registrationRequired: { type: new GraphQLNonNull(GraphQLBoolean) },
    featuredImage: { type: new GraphQLNonNull(GraphQLString) },
    status: { type: new GraphQLNonNull(GraphQLString) },
    createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    registeredCount: { type: GraphQLInt },
  },
});

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    fullName: { type: new GraphQLNonNull(GraphQLString) },
    phone: { type: GraphQLString },
    role: { type: new GraphQLNonNull(UserRole) },
    createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    updatedAt: { type: new GraphQLNonNull(GraphQLDateTime) },
  },
});

// Input Types
const CreateBookingInput = new GraphQLInputObjectType({
  name: 'CreateBookingInput',
  fields: {
    exhibitionId: { type: GraphQLID },
    showId: { type: GraphQLID },
    bookingDate: { type: new GraphQLNonNull(GraphQLDate) },
    timeSlotId: { type: new GraphQLNonNull(GraphQLID) },
    guestName: { type: new GraphQLNonNull(GraphQLString) },
    guestEmail: { type: new GraphQLNonNull(GraphQLString) },
    guestPhone: { type: GraphQLString },
    tickets: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) }, // Array of pricing IDs
    seats: { type: new GraphQLList(GraphQLString) }, // Array of seat identifiers
  },
});

const EventRegistrationInput = new GraphQLInputObjectType({
  name: 'EventRegistrationInput',
  fields: {
    eventId: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    phone: { type: GraphQLString },
  },
});

const ContactFormInput = new GraphQLInputObjectType({
  name: 'ContactFormInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    phone: { type: GraphQLString },
    subject: { type: new GraphQLNonNull(GraphQLString) },
    message: { type: new GraphQLNonNull(GraphQLString) },
  },
});

// Root Query Type
const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    exhibitions: {
      type: new GraphQLNonNull(new GraphQLList(ExhibitionType)),
      args: {
        status: { type: ExhibitionStatus },
        featured: { type: GraphQLBoolean },
      },
    },
    exhibition: {
      type: ExhibitionType,
      args: {
        slug: { type: new GraphQLNonNull(GraphQLString) },
      },
    },
    shows: {
      type: new GraphQLNonNull(new GraphQLList(ShowType)),
      args: {
        type: { type: GraphQLString },
      },
    },
    show: {
      type: ShowType,
      args: {
        slug: { type: new GraphQLNonNull(GraphQLString) },
      },
    },
    availableTimeSlots: {
      type: new GraphQLNonNull(new GraphQLList(TimeSlotType)),
      args: {
        date: { type: new GraphQLNonNull(GraphQLDate) },
        exhibitionId: { type: GraphQLID },
        showId: { type: GraphQLID },
      },
    },
    booking: {
      type: BookingType,
      args: {
        reference: { type: new GraphQLNonNull(GraphQLString) },
      },
    },
    myBookings: {
      type: new GraphQLNonNull(new GraphQLList(BookingType)),
    },
    events: {
      type: new GraphQLNonNull(new GraphQLList(EventType)),
      args: {
        status: { type: GraphQLString },
      },
    },
    event: {
      type: EventType,
      args: {
        slug: { type: new GraphQLNonNull(GraphQLString) },
      },
    },
    pricing: {
      type: new GraphQLNonNull(new GraphQLList(PricingType)),
      args: {
        exhibitionId: { type: GraphQLID },
        showId: { type: GraphQLID },
      },
    },
    bookedSeats: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
      args: {
        showId: { type: new GraphQLNonNull(GraphQLID) },
        date: { type: new GraphQLNonNull(GraphQLDate) },
        timeSlotId: { type: new GraphQLNonNull(GraphQLID) },
      },
    },
    // PDF Generation
    generateTicketPDF: {
      type: new GraphQLNonNull(GraphQLString), // Returns PDF URL
      args: {
        bookingReference: { type: new GraphQLNonNull(GraphQLString) },
      },
    },
    generateReportPDF: {
      type: new GraphQLNonNull(GraphQLString), // Returns PDF URL
      args: {
        reportType: { type: new GraphQLNonNull(GraphQLString) },
        startDate: { type: new GraphQLNonNull(GraphQLDate) },
        endDate: { type: new GraphQLNonNull(GraphQLDate) },
      },
    },
    // Email Services
    sendBookingConfirmation: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {
        bookingReference: { type: new GraphQLNonNull(GraphQLString) },
      },
    },
    sendBookingReminder: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {
        bookingReference: { type: new GraphQLNonNull(GraphQLString) },
        hoursBefore: { type: GraphQLInt },
      },
    },
    sendBookingCancellation: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {
        bookingReference: { type: new GraphQLNonNull(GraphQLString) },
        refundAmount: { type: GraphQLFloat },
      },
    },
    // Availability Check
    checkAvailability: {
      type: new GraphQLNonNull(GraphQLString), // JSON response
      args: {
        date: { type: new GraphQLNonNull(GraphQLDate) },
        exhibitionId: { type: GraphQLID },
        showId: { type: GraphQLID },
        timeSlotId: { type: GraphQLID },
        requestedSeats: { type: new GraphQLList(GraphQLString) },
      },
    },
    // Message Services
    sendNotification: {
      type: new GraphQLNonNull(GraphQLString), // Message ID
      args: {
        title: { type: new GraphQLNonNull(GraphQLString) },
        message: { type: new GraphQLNonNull(GraphQLString) },
        recipientEmail: { type: GraphQLString },
        recipientId: { type: GraphQLID },
        priority: { type: GraphQLString },
        bookingReference: { type: GraphQLString },
      },
    },
    sendAlert: {
      type: new GraphQLNonNull(GraphQLString), // Message ID
      args: {
        title: { type: new GraphQLNonNull(GraphQLString) },
        message: { type: new GraphQLNonNull(GraphQLString) },
        recipientEmail: { type: GraphQLString },
        recipientId: { type: GraphQLID },
        alertType: { type: GraphQLString },
        actionRequired: { type: GraphQLBoolean },
      },
    },
    sendBroadcast: {
      type: new GraphQLNonNull(GraphQLString), // Message ID
      args: {
        title: { type: new GraphQLNonNull(GraphQLString) },
        message: { type: new GraphQLNonNull(GraphQLString) },
        targetAudience: { type: GraphQLString },
        priority: { type: GraphQLString },
      },
    },
  },
});

// Root Mutation Type
const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createBooking: {
      type: new GraphQLNonNull(BookingType),
      args: {
        input: { type: new GraphQLNonNull(CreateBookingInput) },
      },
    },
    cancelBooking: {
      type: new GraphQLNonNull(BookingType),
      args: {
        reference: { type: new GraphQLNonNull(GraphQLString) },
      },
    },
    registerForEvent: {
      type: new GraphQLNonNull(GraphQLString), // Returns registration ID
      args: {
        input: { type: new GraphQLNonNull(EventRegistrationInput) },
      },
    },
    subscribeNewsletter: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        name: { type: GraphQLString },
      },
    },
    submitContactForm: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        input: { type: new GraphQLNonNull(ContactFormInput) },
      },
    },
    // Admin mutations
    addExhibition: {
      type: new GraphQLNonNull(ExhibitionType),
      args: {
        input: { type: new GraphQLNonNull(GraphQLString) }, // JSON string for now
      },
    },
    updateExhibition: {
      type: new GraphQLNonNull(ExhibitionType),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        input: { type: new GraphQLNonNull(GraphQLString) },
      },
    },
    deleteExhibition: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
    },
    toggleExhibitionFeatured: {
      type: new GraphQLNonNull(ExhibitionType),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
    },
    updateBookingStatus: {
      type: new GraphQLNonNull(BookingType),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        status: { type: new GraphQLNonNull(BookingStatus) },
      },
    },
  },
});

// Create the schema
export const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});

