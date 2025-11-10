// Core Types for MGM Museum Application

export type ExhibitionCategory =
  | "solar_observatory"
  | "science_park"
  | "planetarium"
  | "astro_gallery"
  | "3d_theatre"
  | "math_lab"
  | "physics_lab"
  | "holography";

export type ExhibitionStatus = "active" | "inactive" | "coming_soon" | "maintenance";

export type ShowType = "planetarium" | "3d_theatre" | "holography";

export type ShowStatus = "active" | "inactive";

export type TicketType = "adult" | "child" | "student" | "senior" | "group";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";

export type UserRole = "customer" | "admin" | "super_admin";

export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export type RegistrationStatus = "registered" | "attended" | "cancelled";

export type ContactStatus = "new" | "in_progress" | "resolved";

// Exhibition Interface
export interface Exhibition {
  id: string;
  slug: string;
  name: string;
  category: ExhibitionCategory;
  description: string;
  shortDescription: string;
  durationMinutes: number;
  capacity: number;
  images: string[];
  videoUrl?: string;
  virtualTourUrl?: string;
  status: ExhibitionStatus;
  featured: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  pricing?: Pricing[];
  contentSections?: any[]; // Content sections from CMS
}

// Show Interface
export interface Show {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: ShowType;
  durationMinutes: number;
  trailerUrl?: string;
  thumbnailUrl: string;
  status: ShowStatus;
  createdAt: Date;
  pricing?: Pricing[];
  timeSlots?: TimeSlot[];
}

// Pricing Interface
export interface Pricing {
  id: string;
  exhibitionId?: string;
  showId?: string;
  ticketType: TicketType;
  price: number;
  validFrom: Date;
  validUntil?: Date;
  active: boolean;
}

// Time Slot Interface
export interface TimeSlot {
  id: string;
  exhibitionId?: string;
  showId?: string;
  dayOfWeek?: number; // 0-6, null for all days
  startTime: string;
  endTime: string;
  capacity: number;
  active: boolean;
  bookedSeats?: number;
}

// Booking Interface
export interface Booking {
  id: string;
  bookingReference: string;
  userId?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestName?: string;
  exhibitionId?: string;
  showId?: string;
  bookingDate: Date;
  timeSlotId: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  specialRequirements?: string;
  createdAt: Date;
  updatedAt: Date;
  tickets: BookingTicket[];
  seats?: SeatBooking[];
  exhibition?: Exhibition;
  show?: Show;
  timeSlot?: TimeSlot;
}

// Booking Ticket Interface
export interface BookingTicket {
  id: string;
  bookingId: string;
  pricingId: string;
  quantity: number;
  pricePerTicket: number;
  subtotal: number;
  ticketType?: TicketType;
}

// Seat Booking Interface
export interface SeatBooking {
  id: string;
  bookingId: string;
  seatNumber: string;
  rowLetter: string;
}

// Event Interface
export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  eventDate: Date;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants?: number;
  registrationRequired: boolean;
  featuredImage: string;
  status: EventStatus;
  createdAt: Date;
  registrations?: EventRegistration[];
  registeredCount?: number;
}

// Event Registration Interface
export interface EventRegistration {
  id: string;
  eventId: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  status: RegistrationStatus;
  createdAt: Date;
}

// User Interface
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Content Page Interface
export interface ContentPage {
  id: string;
  slug: string;
  title: string;
  content: any; // JSON content
  metaTitle: string;
  metaDescription: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Newsletter Subscriber Interface
export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  subscribedAt: Date;
  unsubscribedAt?: Date;
}

// Contact Submission Interface
export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: Date;
}

// Form Types for Input
export interface CreateBookingInput {
  exhibitionId?: string;
  showId?: string;
  bookingDate: string;
  timeSlotId: string;
  tickets: {
    pricingId: string;
    quantity: number;
  }[];
  seats?: string[];
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  specialRequirements?: string;
}

export interface EventRegistrationInput {
  eventId: string;
  name: string;
  email: string;
  phone: string;
}

export interface ContactFormInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Analytics Types
export interface AnalyticsMetrics {
  totalBookings: number;
  totalRevenue: number;
  totalVisitors: number;
  conversionRate: number;
  averageBookingValue: number;
}

export interface BookingTrend {
  date: string;
  count: number;
  revenue: number;
}

// Category Labels
export const EXHIBITION_CATEGORY_LABELS: Record<ExhibitionCategory, string> = {
  solar_observatory: "Aditya Solar Observatory",
  science_park: "Outdoor Science Park",
  planetarium: "Planetarium",
  astro_gallery: "Astro Gallery & ISRO",
  "3d_theatre": "3D Theatre",
  math_lab: "Mathematics Lab",
  physics_lab: "Basic Physics Lab",
  holography: "Holography Theatre",
};

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  adult: "Adult",
  child: "Child (3-12 years)",
  student: "Student (with ID)",
  senior: "Senior (60+ years)",
  group: "Group (10+ people)",
};

