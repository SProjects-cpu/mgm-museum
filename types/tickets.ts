/**
 * TypeScript Type Definitions for Ticket Generation System
 */

/**
 * Complete booking data structure for PDF generation
 */
export interface BookingData {
  id: string;
  booking_reference: string;
  booking_date: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  total_amount: number;
  payment_id: string | null; // Razorpay payment ID
  payment_order_id: string | null;
  exhibition_id: string | null;
  show_id: string | null;
  time_slot_id: string;
  created_at?: string; // Booking timestamp
  exhibitions?: {
    name: string;
    description: string;
  } | null;
  shows?: {
    name: string;
    description: string;
  } | null;
  time_slots: {
    start_time: string;
    end_time: string;
    slot_date: string;
  };
  tickets: Array<{
    ticket_number: string;
    qr_code: string;
  }>;
  pricing_tier?: {
    name: string;
    price: number;
    quantity: number;
  };
}

/**
 * Props for TicketPDFDocument component
 */
export interface TicketPDFProps {
  booking: BookingData;
  qrCodeDataUrl: string;
  museumLogo?: string;
}

/**
 * Cart snapshot structure from payment_orders table
 */
export interface CartSnapshot {
  items: Array<{
    timeSlotId: string;
    exhibitionId?: string;
    showId?: string;
    bookingDate: string;
    pricingTier: {
      id: string;
      name: string;
      price: number;
    };
    quantity: number;
    subtotal: number;
  }>;
  total: number;
}

/**
 * QR code generation options
 */
export interface QRCodeOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * API response for ticket generation
 */
export interface TicketGenerationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Booking with related data for confirmation page
 */
export interface BookingWithRelations extends BookingData {
  user_id: string;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}
