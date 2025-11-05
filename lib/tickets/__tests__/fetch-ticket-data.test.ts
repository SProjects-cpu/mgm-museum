/**
 * Unit tests for Ticket Data Fetcher Utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchTicketData,
  getEventTitle,
  getEventDescription,
  formatTimeSlot,
} from '../fetch-ticket-data';
import { BookingData } from '@/types/tickets';

// Create a proper mock Supabase client
const createMockSupabaseClient = (responses: any[]) => {
  let responseIndex = 0;
  
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(() => {
      const response = responses[responseIndex++];
      return Promise.resolve(response);
    }),
  };

  return {
    from: vi.fn(() => mockChain),
  };
};

describe('fetchTicketData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch complete booking data with exhibition', async () => {
    const mockBooking = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      booking_reference: 'BK17623504597486WZYCB',
      booking_date: '2025-01-15',
      guest_name: 'John Doe',
      guest_email: 'john@example.com',
      guest_phone: '+919876543210',
      total_amount: 500,
      payment_id: 'pay_ABC123XYZ',
      payment_order_id: 'order_XYZ789',
      exhibition_id: 'exh-123',
      show_id: null,
      time_slot_id: 'slot-456',
      exhibitions: {
        name: 'Ancient Artifacts',
        description: 'A collection of ancient artifacts',
      },
      shows: null,
      time_slots: {
        start_time: '10:00:00',
        end_time: '11:00:00',
        slot_date: '2025-01-15',
      },
    };

    const mockTickets = [
      { ticket_number: 'TKT001', qr_code: 'BK17623504597486WZYCB' },
    ];

    const mockPaymentOrder = {
      cart_snapshot: {
        items: [
          {
            pricingTier: {
              name: 'Adult',
              price: 500,
            },
            quantity: 1,
          },
        ],
      },
    };

    const mockClient = createMockSupabaseClient([
      { data: mockBooking, error: null },
      { data: mockTickets, error: null },
      { data: mockPaymentOrder, error: null },
    ]);

    const result = await fetchTicketData('123e4567-e89b-12d3-a456-426614174000', mockClient as any);

    expect(result).toMatchObject({
      id: mockBooking.id,
      booking_reference: mockBooking.booking_reference,
      guest_name: mockBooking.guest_name,
      payment_id: mockBooking.payment_id,
      exhibitions: mockBooking.exhibitions,
    });
    expect(result.tickets).toEqual([]);
    expect(result.pricing_tier).toBeUndefined();
  });

  it('should fetch booking data with show instead of exhibition', async () => {
    const mockBooking = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      booking_reference: 'MGM-20250115-ABCD',
      booking_date: '2025-01-15',
      guest_name: 'Jane Smith',
      guest_email: 'jane@example.com',
      guest_phone: null,
      total_amount: 750,
      payment_id: 'pay_XYZ789ABC',
      payment_order_id: 'order_ABC123',
      exhibition_id: null,
      show_id: 'show-789',
      time_slot_id: 'slot-456',
      exhibitions: null,
      shows: {
        name: 'Magic Show',
        description: 'An amazing magic performance',
      },
      time_slots: {
        start_time: '14:00:00',
        end_time: '15:30:00',
        slot_date: '2025-01-15',
      },
    };

    const mockTickets = [
      { ticket_number: 'TKT002', qr_code: 'MGM-20250115-ABCD' },
    ];

    const mockClient = createMockSupabaseClient([
      { data: mockBooking, error: null },
      { data: mockTickets, error: null },
      { data: null, error: null },
    ]);

    const result = await fetchTicketData('123e4567-e89b-12d3-a456-426614174000', mockClient as any);

    expect(result.shows).toEqual(mockBooking.shows);
    expect(result.exhibitions).toBeNull();
  });

  it('should throw error for invalid booking ID format', async () => {
    const mockClient = createMockSupabaseClient([]);
    
    await expect(fetchTicketData('invalid-id', mockClient as any)).rejects.toThrow('Invalid booking ID format');
    await expect(fetchTicketData('', mockClient as any)).rejects.toThrow('Invalid booking ID format');
  });

  it('should throw error when booking not found', async () => {
    const mockClient = createMockSupabaseClient([
      { data: null, error: null },
    ]);

    await expect(
      fetchTicketData('123e4567-e89b-12d3-a456-426614174000', mockClient as any)
    ).rejects.toThrow('Booking not found');
  });

  it('should throw error when database query fails', async () => {
    const mockClient = createMockSupabaseClient([
      { data: null, error: { message: 'Database connection failed' } },
    ]);

    await expect(
      fetchTicketData('123e4567-e89b-12d3-a456-426614174000', mockClient as any)
    ).rejects.toThrow('Database connection failed');
  });

  it('should return empty tickets array when no tickets found', async () => {
    const mockBooking = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      booking_reference: 'BK12345',
      payment_id: 'pay_123',
      booking_date: '2025-01-15',
      guest_name: 'Test',
      guest_email: 'test@test.com',
      guest_phone: null,
      total_amount: 500,
      payment_order_id: null,
      exhibition_id: null,
      show_id: null,
      time_slot_id: 'slot-1',
      exhibitions: null,
      shows: null,
      time_slots: { start_time: '10:00:00', end_time: '11:00:00', slot_date: '2025-01-15' },
    };

    const mockClient = createMockSupabaseClient([
      { data: mockBooking, error: null },
      { data: [], error: null },
    ]);

    const result = await fetchTicketData('123e4567-e89b-12d3-a456-426614174000', mockClient as any);
    
    expect(result.tickets).toEqual([]);
  });

  it('should throw error when time slot is missing', async () => {
    const mockBooking = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      booking_reference: 'BK12345',
      payment_id: 'pay_123',
      time_slots: null,
    };

    const mockClient = createMockSupabaseClient([
      { data: mockBooking, error: null },
      { data: [], error: null },
    ]);

    await expect(
      fetchTicketData('123e4567-e89b-12d3-a456-426614174000', mockClient as any)
    ).rejects.toThrow('Time slot information not found');
  });

  it('should handle missing pricing tier gracefully', async () => {
    const mockBooking = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      booking_reference: 'BK12345',
      booking_date: '2025-01-15',
      guest_name: 'Test User',
      guest_email: 'test@example.com',
      guest_phone: null,
      total_amount: 500,
      payment_id: 'pay_123',
      payment_order_id: 'order_123',
      exhibition_id: 'exh-1',
      show_id: null,
      time_slot_id: 'slot-1',
      exhibitions: { name: 'Test Exhibition', description: 'Test' },
      shows: null,
      time_slots: {
        start_time: '10:00:00',
        end_time: '11:00:00',
        slot_date: '2025-01-15',
      },
    };

    const mockClient = createMockSupabaseClient([
      { data: mockBooking, error: null },
      { data: [], error: null },
      { data: null, error: { message: 'Not found' } },
    ]);

    const result = await fetchTicketData('123e4567-e89b-12d3-a456-426614174000', mockClient as any);

    expect(result.pricing_tier).toBeUndefined();
  });
});

describe('getEventTitle', () => {
  it('should return exhibition name when available', () => {
    const booking: Partial<BookingData> = {
      exhibitions: { name: 'Ancient Artifacts', description: 'Test' },
      shows: null,
    };

    expect(getEventTitle(booking as BookingData)).toBe('Ancient Artifacts');
  });

  it('should return show name when exhibition is not available', () => {
    const booking: Partial<BookingData> = {
      exhibitions: null,
      shows: { name: 'Magic Show', description: 'Test' },
    };

    expect(getEventTitle(booking as BookingData)).toBe('Magic Show');
  });

  it('should return default when neither exhibition nor show is available', () => {
    const booking: Partial<BookingData> = {
      exhibitions: null,
      shows: null,
    };

    expect(getEventTitle(booking as BookingData)).toBe('Museum Visit');
  });
});

describe('getEventDescription', () => {
  it('should return exhibition description when available', () => {
    const booking: Partial<BookingData> = {
      exhibitions: { name: 'Test', description: 'Ancient artifacts collection' },
      shows: null,
    };

    expect(getEventDescription(booking as BookingData)).toBe('Ancient artifacts collection');
  });

  it('should return show description when exhibition is not available', () => {
    const booking: Partial<BookingData> = {
      exhibitions: null,
      shows: { name: 'Test', description: 'Amazing magic performance' },
    };

    expect(getEventDescription(booking as BookingData)).toBe('Amazing magic performance');
  });

  it('should return empty string when neither is available', () => {
    const booking: Partial<BookingData> = {
      exhibitions: null,
      shows: null,
    };

    expect(getEventDescription(booking as BookingData)).toBe('');
  });
});

describe('formatTimeSlot', () => {
  it('should format morning time slot correctly', () => {
    const timeSlot = {
      start_time: '10:00:00',
      end_time: '11:00:00',
      slot_date: '2025-01-15',
    };

    expect(formatTimeSlot(timeSlot)).toBe('10:00 AM - 11:00 AM');
  });

  it('should format afternoon time slot correctly', () => {
    const timeSlot = {
      start_time: '14:30:00',
      end_time: '16:00:00',
      slot_date: '2025-01-15',
    };

    expect(formatTimeSlot(timeSlot)).toBe('2:30 PM - 4:00 PM');
  });

  it('should format noon time slot correctly', () => {
    const timeSlot = {
      start_time: '12:00:00',
      end_time: '13:00:00',
      slot_date: '2025-01-15',
    };

    expect(formatTimeSlot(timeSlot)).toBe('12:00 PM - 1:00 PM');
  });

  it('should format midnight time slot correctly', () => {
    const timeSlot = {
      start_time: '00:00:00',
      end_time: '01:00:00',
      slot_date: '2025-01-15',
    };

    expect(formatTimeSlot(timeSlot)).toBe('12:00 AM - 1:00 AM');
  });
});
