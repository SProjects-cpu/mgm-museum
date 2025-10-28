// Booking System Types - Science Museum Style

export interface TimeSlot {
  id: string;
  slotDate: Date | string;
  startTime: string;
  endTime: string;
  capacity: number;
  currentBookings: number;
  bufferCapacity: number;
  availableCapacity: number;
  active: boolean;
  itemType?: 'exhibition' | 'show' | 'general';
  itemId?: string;
  itemName?: string;
}

export interface DayAvailability {
  date: Date | string;
  totalSlots: number;
  availableSlots: number;
  isClosed: boolean;
  capacityStatus: 'available' | 'limited' | 'sold_out' | 'closed';
}

export interface TicketQuantities {
  adult: number;
  child: number;
  student: number;
  senior: number;
}

export interface ExhibitionTicket {
  exhibitionId: string;
  exhibitionName: string;
  adultTickets: number;
  childTickets: number;
  pricePerAdult: number;
  pricePerChild: number;
  subtotal: number;
}

export interface BookingBasket {
  // Main admission tickets (free)
  admissionTickets: TicketQuantities;
  
  // Paid exhibition tickets
  exhibitionTickets: ExhibitionTicket[];
  
  // Time slot
  timeSlot?: TimeSlot;
  
  // Pricing
  subtotal: number;
  discount: number;
  total: number;
  
  // Voucher
  voucherCode?: string;
  voucherDiscount?: number;
}

export interface BookingFormData {
  // Visitor information
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  
  // Special requirements
  specialRequirements?: string;
  accessibilityRequirements?: string;
  
  // Marketing consent
  marketingConsent?: boolean;
}

export interface CreateBookingRequest {
  // Time slot
  timeSlotId: string;
  bookingDate: string;
  
  // Visitor info
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  
  // Tickets
  adultTickets: number;
  childTickets: number;
  studentTickets: number;
  seniorTickets: number;
  totalTickets: number;
  
  // Exhibition tickets (if any)
  exhibitions?: Array<{
    exhibitionId: string;
    adultTickets: number;
    childTickets: number;
    pricePerAdult: number;
    pricePerChild: number;
    subtotal: number;
  }>;
  
  // Pricing
  subtotal: number;
  discount: number;
  totalAmount: number;
  
  // Voucher
  voucherCode?: string;
  
  // Special requirements
  specialRequirements?: string;
  accessibilityRequirements?: string;
  
  // Reference IDs (for exhibition/show specific bookings)
  exhibitionId?: string;
  showId?: string;
}

export interface Booking {
  id: string;
  bookingReference: string;
  
  // Time slot
  timeSlotId: string;
  bookingDate: string;
  
  // Visitor info
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  
  // Tickets
  adultTickets: number;
  childTickets: number;
  studentTickets: number;
  seniorTickets: number;
  totalTickets: number;
  
  // Pricing
  subtotal: number;
  discount: number;
  totalAmount: number;
  
  // Status
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed' | 'free';
  
  // Relationships
  exhibitionId?: string;
  showId?: string;
  
  // Additional info
  voucherCode?: string;
  specialRequirements?: string;
  accessibilityRequirements?: string;
  
  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Expanded data
  timeSlot?: TimeSlot;
  exhibitions?: ExhibitionTicket[];
}

export interface CalendarBookingProps {
  onDateSelect?: (date: Date) => void;
  onTimeSlotSelect?: (slot: TimeSlot) => void;
  selectedDate?: Date;
  selectedSlot?: TimeSlot;
  minDate?: Date;
  maxDate?: Date;
}

export interface BookingWizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isValid: (data: any) => boolean;
}

export interface CapacityOverride {
  id: string;
  overrideDate: Date | string;
  capacity: number;
  reason?: string;
  isClosed: boolean;
}

// Admin types
export interface AdminBookingFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  searchTerm?: string;
  exhibitionId?: string;
  showId?: string;
}

export interface AdminBookingStats {
  totalBookings: number;
  todayBookings: number;
  upcomingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageTicketsPerBooking: number;
}
