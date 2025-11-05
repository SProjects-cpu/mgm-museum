/**
 * Integration tests for PDF Ticket Generation API Route
 * Tests the /api/tickets/generate/[bookingId] endpoint
 * 
 * Requirements: Testing Strategy - Integration Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { createClient } from '@supabase/supabase-js';
import { renderToStream } from '@react-pdf/renderer';

// Mock dependencies
vi.mock('@supabase/supabase-js');
vi.mock('@react-pdf/renderer');
vi.mock('@/lib/tickets/fetch-ticket-data');
vi.mock('@/lib/tickets/qr-generator');
vi.mock('@/lib/tickets/logo-loader');
vi.mock('@/lib/middleware/rate-limit');
vi.mock('@/lib/analytics/ticket-analytics');

// Import mocked modules
import { fetchTicketData } from '@/lib/tickets/fetch-ticket-data';
import { generateQRCode } from '@/lib/tickets/qr-generator';
import { loadMuseumLogoSync } from '@/lib/tickets/logo-loader';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/middleware/rate-limit';
import {
  trackDownloadSuccess,
  trackDownloadFailure,
  trackGenerationTime,
} from '@/lib/analytics/ticket-analytics';

describe('PDF Ticket Generation API Route', () => {
  const validBookingId = '123e4567-e89b-12d3-a456-426614174000';
  const validUserId = '987e6543-e21b-12d3-a456-426614174999';
  const validToken = 'Bearer valid-jwt-token';
  
  const mockBookingData = {
    id: validBookingId,
    booking_reference: 'BK17623504597486WZYCB',
    booking_date: '2025-01-15',
    guest_name: 'John Doe',
    guest_email: 'john@example.com',
    guest_phone: '+91 9876543210',
    total_amount: 500,
    payment_id: 'pay_ABC123XYZ456',
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
    tickets: [
      {
        ticket_number: 'TKT1234567890ABCD',
        qr_code: 'BK17623504597486WZYCB',
      },
    ],
  };

  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(createClient).mockReturnValue(mockSupabaseClient as any);
    
    vi.mocked(checkRateLimit).mockReturnValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60000,
    });

    vi.mocked(getRateLimitHeaders).mockReturnValue({
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '9',
      'X-RateLimit-Reset': String(Math.floor((Date.now() + 60000) / 1000)),
    });

    vi.mocked(generateQRCode).mockResolvedValue(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    );

    vi.mocked(loadMuseumLogoSync).mockReturnValue(
      'data:image/png;base64,mockLogoData'
    );

    vi.mocked(trackDownloadSuccess).mockReturnValue(undefined);
    vi.mocked(trackDownloadFailure).mockReturnValue(undefined);
    vi.mocked(trackGenerationTime).mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication Tests', () => {
    it('should return 401 when no authorization header is provided', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tickets/generate/${validBookingId}`
      );

      const response = await GET(request, { params: { bookingId: validBookingId } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Authentication required');
      expect(trackDownloadFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'AUTH_ERROR',
        })
      );
    });

    it('should return 401 when authentication token is invalid', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tickets/generate/${validBookingId}`,
        {
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        }
      );

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const response = await GET(request, { params: { bookingId: validBookingId } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid authentication');
      expect(trackDownloadFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'AUTH_ERROR',
          errorMessage: 'Invalid token',
        })
      );
    });
  });

  describe('Booking ID Validation Tests', () => {
    it('should return 400 when booking ID is not a valid UUID', async () => {
      const invalidBookingId = 'not-a-uuid';
      const request = new NextRequest(
        `http://localhost:3000/api/tickets/generate/${invalidBookingId}`,
        {
          headers: {
            Authorization: validToken,
          },
        }
      );

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null,
      });

      const response = await GET(request, { params: { bookingId: invalidBookingId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid booking ID format');
      expect(trackDownloadFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'VALIDATION_ERROR',
        })
      );
    });

    it('should return 404 when booking does not exist', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tickets/generate/${validBookingId}`,
        {
          headers: {
            Authorization: validToken,
          },
        }
      );

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null,
      });

      vi.mocked(fetchTicketData).mockRejectedValue(
        new Error('Booking not found')
      );

      const response = await GET(request, { params: { bookingId: validBookingId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Booking not found');
      expect(trackDownloadFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'NOT_FOUND',
        })
      );
    });
  });

  describe('Authorization Tests', () => {
    it('should return 403 when booking belongs to different user', async () => {
      const differentUserId = '111e1111-e11b-11d3-a111-111111111111';
      const request = new NextRequest(
        `http://localhost:3000/api/tickets/generate/${validBookingId}`,
        {
          headers: {
            Authorization: validToken,
          },
        }
      );

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null,
      });

      vi.mocked(fetchTicketData).mockResolvedValue(mockBookingData);

      // Mock booking ownership check - booking belongs to different user
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { user_id: differentUserId },
              error: null,
            }),
          })),
        })),
      } as any);

      const response = await GET(request, { params: { bookingId: validBookingId } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Access denied');
      expect(trackDownloadFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'FORBIDDEN',
        })
      );
    });
  });

  describe('PDF Generation Success Tests', () => {
    it('should return PDF with correct headers for authenticated request', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tickets/generate/${validBookingId}`,
        {
          headers: {
            Authorization: validToken,
          },
        }
      );

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null,
      });

      vi.mocked(fetchTicketData).mockResolvedValue(mockBookingData);

      // Mock booking ownership check - booking belongs to authenticated user
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { user_id: validUserId },
              error: null,
            }),
          })),
        })),
      } as any);

      // Mock PDF stream
      const mockPdfStream = {
        pipe: vi.fn(),
        on: vi.fn(),
      };
      vi.mocked(renderToStream).mockResolvedValue(mockPdfStream as any);

      const response = await GET(request, { params: { bookingId: validBookingId } });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(response.headers.get('Content-Disposition')).toContain(
        `MGM-Ticket-${mockBookingData.booking_reference}.pdf`
      );
      expect(response.headers.get('Cache-Control')).toBe(
        'no-cache, no-store, must-revalidate'
      );
      
      // Verify analytics tracking
      expect(trackDownloadSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: validBookingId,
          userId: validUserId,
          bookingReference: mockBookingData.booking_reference,
        })
      );
      expect(trackGenerationTime).toHaveBeenCalled();
    });

    it('should include rate limit headers in successful response', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tickets/generate/${validBookingId}`,
        {
          headers: {
            Authorization: validToken,
          },
        }
      );

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null,
      });

      vi.mocked(fetchTicketData).mockResolvedValue(mockBookingData);

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { user_id: validUserId },
              error: null,
            }),
          })),
        })),
      } as any);

      const mockPdfStream = {
        pipe: vi.fn(),
        on: vi.fn(),
      };
      vi.mocked(renderToStream).mockResolvedValue(mockPdfStream as any);

      const response = await GET(request, { params: { bookingId: validBookingId } });

      expect(response.status).toBe(200);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('9');
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should return 429 when rate limit is exceeded', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tickets/generate/${validBookingId}`,
        {
          headers: {
            Authorization: validToken,
          },
        }
      );

      vi.mocked(checkRateLimit).mockReturnValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 30000,
      });

      vi.mocked(getRateLimitHeaders).mockReturnValue({
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor((Date.now() + 30000) / 1000)),
      });

      const response = await GET(request, { params: { bookingId: validBookingId } });
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Too many requests');
      expect(data.retryAfter).toBeGreaterThan(0);
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });
  });

  describe('Data Validation Tests', () => {
    it('should return 500 when payment ID is missing', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tickets/generate/${validBookingId}`,
        {
          headers: {
            Authorization: validToken,
          },
        }
      );

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null,
      });

      const bookingDataWithoutPaymentId = {
        ...mockBookingData,
        payment_id: null,
      };
      vi.mocked(fetchTicketData).mockResolvedValue(bookingDataWithoutPaymentId as any);

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { user_id: validUserId },
              error: null,
            }),
          })),
        })),
      } as any);

      const response = await GET(request, { params: { bookingId: validBookingId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Payment information not available');
      expect(trackDownloadFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'PAYMENT_DATA_ERROR',
        })
      );
    });

    it('should return 500 when no tickets are found', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tickets/generate/${validBookingId}`,
        {
          headers: {
            Authorization: validToken,
          },
        }
      );

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null,
      });

      const bookingDataWithoutTickets = {
        ...mockBookingData,
        tickets: [],
      };
      vi.mocked(fetchTicketData).mockResolvedValue(bookingDataWithoutTickets);

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { user_id: validUserId },
              error: null,
            }),
          })),
        })),
      } as any);

      const response = await GET(request, { params: { bookingId: validBookingId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Ticket data not available');
      expect(trackDownloadFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'TICKET_DATA_ERROR',
        })
      );
    });
  });

  describe('Error Handling Tests', () => {
    it('should return 500 when QR code generation fails', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tickets/generate/${validBookingId}`,
        {
          headers: {
            Authorization: validToken,
          },
        }
      );

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null,
      });

      vi.mocked(fetchTicketData).mockResolvedValue(mockBookingData);

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { user_id: validUserId },
              error: null,
            }),
          })),
        })),
      } as any);

      vi.mocked(generateQRCode).mockRejectedValue(
        new Error('QR generation failed')
      );

      const response = await GET(request, { params: { bookingId: validBookingId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Failed to generate QR code');
      expect(trackDownloadFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'QR_GENERATION_ERROR',
        })
      );
    });

    it('should return 500 when PDF rendering fails', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tickets/generate/${validBookingId}`,
        {
          headers: {
            Authorization: validToken,
          },
        }
      );

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null,
      });

      vi.mocked(fetchTicketData).mockResolvedValue(mockBookingData);

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { user_id: validUserId },
              error: null,
            }),
          })),
        })),
      } as any);

      vi.mocked(renderToStream).mockRejectedValue(
        new Error('PDF rendering failed')
      );

      const response = await GET(request, { params: { bookingId: validBookingId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Failed to generate PDF ticket');
      expect(trackDownloadFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'PDF_RENDER_ERROR',
        })
      );
    });
  });
});
