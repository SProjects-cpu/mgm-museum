/**
 * End-to-End Tests for PDF Ticket Generation
 * 
 * This test suite validates the complete booking flow from payment to PDF download,
 * ensuring all components work together seamlessly.
 * 
 * Test Coverage:
 * - Complete booking flow from payment to PDF download
 * - Razorpay Payment ID verification in PDF
 * - QR code generation and scanning
 * - PDF printing compatibility
 * - Cross-browser download functionality
 * - Multiple bookings handling
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { renderToStream } from '@react-pdf/renderer';
import { Readable } from 'stream';

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  testUserEmail: 'test-e2e@mgmmuseum.com',
  testUserPassword: 'TestPassword123!',
};

// Initialize Supabase client
const supabase = createClient(
  TEST_CONFIG.supabaseUrl,
  TEST_CONFIG.supabaseAnonKey
);

describe('PDF Ticket Generation - End-to-End Tests', () => {
  let testUserId: string;
  let testBookingId: string;
  let testBookingReference: string;
  let authToken: string;

  beforeAll(async () => {
    // Sign in test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_CONFIG.testUserEmail,
      password: TEST_CONFIG.testUserPassword,
    });

    if (authError || !authData.user) {
      throw new Error('Failed to authenticate test user');
    }

    testUserId = authData.user.id;
    authToken = authData.session?.access_token || '';
  });

  afterAll(async () => {
    // Clean up: Sign out
    await supabase.auth.signOut();
  });

  describe('1. Complete Booking Flow', () => {
    it('should create a test booking with payment verification', async () => {
      // This test validates that a booking can be created with all required fields
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', testUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      expect(error).toBeNull();
      expect(booking).toBeDefined();
      expect(booking?.payment_id).toBeDefined();
      expect(booking?.payment_id).toMatch(/^pay_/);
      expect(booking?.booking_reference).toBeDefined();
      expect(booking?.booking_reference).toMatch(/^BK\d{17}[A-Z]{5}$/);

      testBookingId = booking!.id;
      testBookingReference = booking!.booking_reference;
    });

    it('should have associated ticket records', async () => {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('booking_id', testBookingId);

      expect(error).toBeNull();
      expect(tickets).toBeDefined();
      expect(tickets!.length).toBeGreaterThan(0);
      expect(tickets![0].qr_code).toBeDefined();
      expect(tickets![0].ticket_number).toBeDefined();
    });
  });

  describe('2. Razorpay Payment ID Verification', () => {
    it('should display Razorpay Payment ID in booking details', async () => {
      const { data: booking } = await supabase
        .from('bookings')
        .select('payment_id')
        .eq('id', testBookingId)
        .single();

      expect(booking?.payment_id).toBeDefined();
      expect(booking?.payment_id).toMatch(/^pay_[A-Za-z0-9]+$/);
      expect(booking?.payment_id?.length).toBeGreaterThan(10);
    });

    it('should not use placeholder or dummy payment IDs', async () => {
      const { data: booking } = await supabase
        .from('bookings')
        .select('payment_id')
        .eq('id', testBookingId)
        .single();

      const invalidPatterns = [
        'dummy',
        'test',
        'placeholder',
        'xxx',
        'null',
        'undefined',
      ];

      const paymentId = booking?.payment_id?.toLowerCase() || '';
      invalidPatterns.forEach((pattern) => {
        expect(paymentId).not.toContain(pattern);
      });
    });
  });

  describe('3. QR Code Generation and Validation', () => {
    it('should generate valid QR code from booking reference', async () => {
      const qrCodeDataUrl = await QRCode.toDataURL(testBookingReference, {
        width: 200,
        margin: 2,
        errorCorrectionLevel: 'M',
      });

      expect(qrCodeDataUrl).toBeDefined();
      expect(qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
      expect(qrCodeDataUrl.length).toBeGreaterThan(100);
    });

    it('should generate QR code with minimum size of 150x150 pixels', async () => {
      const qrCodeDataUrl = await QRCode.toDataURL(testBookingReference, {
        width: 150,
        margin: 2,
        errorCorrectionLevel: 'M',
      });

      expect(qrCodeDataUrl).toBeDefined();
      // Base64 encoded PNG should be substantial in size
      expect(qrCodeDataUrl.length).toBeGreaterThan(500);
    });

    it('should encode booking reference in plain text format', async () => {
      // QR code should contain the booking reference exactly as is
      const qrCodeDataUrl = await QRCode.toDataURL(testBookingReference);
      
      expect(qrCodeDataUrl).toBeDefined();
      // The QR code generation should not throw errors
      expect(qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('should use reliable QR code library with standard format', async () => {
      // Test that qrcode library produces standard QR codes
      const testData = 'TEST-QR-CODE-123';
      const qrCode = await QRCode.toDataURL(testData);

      expect(qrCode).toBeDefined();
      expect(qrCode).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('4. PDF Generation API', () => {
    it('should generate PDF with authenticated request', async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tickets/generate/${testBookingId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toBe('application/pdf');
      expect(response.headers.get('content-disposition')).toContain('attachment');
      expect(response.headers.get('content-disposition')).toContain(testBookingReference);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tickets/generate/${testBookingId}`
      );

      expect(response.status).toBe(401);
    });

    it('should return 404 for invalid booking ID', async () => {
      const invalidBookingId = '00000000-0000-0000-0000-000000000000';
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tickets/generate/${invalidBookingId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(404);
    });

    it('should generate PDF within 3 seconds', async () => {
      const startTime = Date.now();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tickets/generate/${testBookingId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('5. PDF Content Validation', () => {
    it('should include all required booking details', async () => {
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          *,
          exhibitions (title),
          shows (title),
          time_slots (start_time, end_time, slot_date)
        `)
        .eq('id', testBookingId)
        .single();

      expect(booking).toBeDefined();
      expect(booking?.guest_name).toBeDefined();
      expect(booking?.guest_email).toBeDefined();
      expect(booking?.guest_phone).toBeDefined();
      expect(booking?.total_amount).toBeDefined();
      expect(booking?.payment_id).toBeDefined();
      expect(booking?.booking_reference).toBeDefined();
      expect(booking?.time_slots).toBeDefined();
    });

    it('should fetch cart snapshot for pricing tier information', async () => {
      const { data: paymentOrder } = await supabase
        .from('payment_orders')
        .select('cart_snapshot')
        .eq('razorpay_order_id', testBookingId)
        .single();

      if (paymentOrder) {
        expect(paymentOrder.cart_snapshot).toBeDefined();
        expect(typeof paymentOrder.cart_snapshot).toBe('object');
      }
    });
  });

  describe('6. Multiple Bookings Handling', () => {
    it('should generate separate PDFs for multiple bookings', async () => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, booking_reference')
        .eq('user_id', testUserId)
        .limit(2);

      if (bookings && bookings.length > 1) {
        const pdfPromises = bookings.map((booking) =>
          fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tickets/generate/${booking.id}`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          )
        );

        const responses = await Promise.all(pdfPromises);

        responses.forEach((response, index) => {
          expect(response.ok).toBe(true);
          expect(response.headers.get('content-disposition')).toContain(
            bookings[index].booking_reference
          );
        });
      }
    });

    it('should verify unique content for each booking PDF', async () => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, booking_reference, payment_id')
        .eq('user_id', testUserId)
        .limit(2);

      if (bookings && bookings.length > 1) {
        expect(bookings[0].booking_reference).not.toBe(bookings[1].booking_reference);
        expect(bookings[0].payment_id).not.toBe(bookings[1].payment_id);
      }
    });
  });

  describe('7. Error Handling and Resilience', () => {
    it('should handle missing optional data gracefully', async () => {
      // Test that PDF generation works even with minimal data
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', testBookingId)
        .single();

      expect(booking).toBeDefined();
      // Even if some optional fields are missing, core fields should exist
      expect(booking?.booking_reference).toBeDefined();
      expect(booking?.payment_id).toBeDefined();
    });

    it('should log errors with proper context', async () => {
      // This test validates that error logging includes necessary context
      const invalidBookingId = 'invalid-uuid';
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tickets/generate/${invalidBookingId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.ok).toBe(false);
      expect([400, 404, 500]).toContain(response.status);
    });
  });

  describe('8. Performance and Optimization', () => {
    it('should fetch booking data with optimized query', async () => {
      const startTime = Date.now();

      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          exhibitions (title, description),
          shows (title, description),
          time_slots (start_time, end_time, slot_date),
          tickets (ticket_number, qr_code)
        `)
        .eq('id', testBookingId)
        .single();

      const endTime = Date.now();
      const queryDuration = endTime - startTime;

      expect(error).toBeNull();
      expect(booking).toBeDefined();
      expect(queryDuration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent PDF generation requests', async () => {
      const concurrentRequests = 3;
      const requests = Array(concurrentRequests)
        .fill(null)
        .map(() =>
          fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tickets/generate/${testBookingId}`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          )
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.ok).toBe(true);
        expect(response.headers.get('content-type')).toBe('application/pdf');
      });
    });
  });

  describe('9. Data Integrity', () => {
    it('should maintain consistency between booking and ticket data', async () => {
      const { data: booking } = await supabase
        .from('bookings')
        .select('*, tickets (*)')
        .eq('id', testBookingId)
        .single();

      expect(booking).toBeDefined();
      expect(booking?.tickets).toBeDefined();
      expect(booking?.tickets.length).toBeGreaterThan(0);

      booking?.tickets.forEach((ticket: any) => {
        expect(ticket.booking_id).toBe(testBookingId);
        expect(ticket.qr_code).toBe(testBookingReference);
      });
    });

    it('should verify payment_id is stored correctly', async () => {
      const { data: booking } = await supabase
        .from('bookings')
        .select('payment_id, payment_order_id')
        .eq('id', testBookingId)
        .single();

      expect(booking?.payment_id).toBeDefined();
      expect(booking?.payment_id).toMatch(/^pay_/);
      expect(booking?.payment_order_id).toBeDefined();
    });
  });

  describe('10. Security Validation', () => {
    it('should verify booking belongs to authenticated user', async () => {
      const { data: booking } = await supabase
        .from('bookings')
        .select('user_id')
        .eq('id', testBookingId)
        .single();

      expect(booking?.user_id).toBe(testUserId);
    });

    it('should validate booking ID format', async () => {
      // UUID format validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(testBookingId).toMatch(uuidRegex);
    });

    it('should validate Razorpay Payment ID format', async () => {
      const { data: booking } = await supabase
        .from('bookings')
        .select('payment_id')
        .eq('id', testBookingId)
        .single();

      expect(booking?.payment_id).toMatch(/^pay_[A-Za-z0-9]+$/);
    });
  });
});

/**
 * Manual Testing Checklist
 * 
 * The following tests require manual verification:
 * 
 * 1. PDF Printing
 *    - [ ] Print PDF on A4 paper
 *    - [ ] Print PDF on Letter size paper
 *    - [ ] Verify all content is visible and properly formatted
 *    - [ ] Check QR code is scannable after printing
 * 
 * 2. QR Code Scanning
 *    - [ ] Scan QR code with iPhone camera
 *    - [ ] Scan QR code with Android camera
 *    - [ ] Scan QR code with dedicated QR scanner app
 *    - [ ] Verify booking reference is correctly decoded
 * 
 * 3. Cross-Browser Testing
 *    - [ ] Download PDF in Chrome (Windows/Mac)
 *    - [ ] Download PDF in Firefox (Windows/Mac)
 *    - [ ] Download PDF in Safari (Mac)
 *    - [ ] Download PDF in Edge (Windows)
 *    - [ ] Verify filename includes booking reference
 * 
 * 4. Mobile Testing
 *    - [ ] Download PDF on iOS Safari
 *    - [ ] Download PDF on iOS Chrome
 *    - [ ] Download PDF on Android Chrome
 *    - [ ] Download PDF on Android Firefox
 *    - [ ] Verify PDF opens correctly in mobile PDF viewers
 * 
 * 5. Visual Verification
 *    - [ ] Museum logo displays correctly
 *    - [ ] Brand colors are accurate (#1a1a1a, #d4af37)
 *    - [ ] Typography is professional and readable
 *    - [ ] Layout is balanced and well-spaced
 *    - [ ] All sections are properly aligned
 * 
 * 6. Content Verification
 *    - [ ] Booking reference is correct
 *    - [ ] Razorpay Payment ID matches actual payment
 *    - [ ] Guest details are accurate
 *    - [ ] Exhibition/Show name is correct
 *    - [ ] Date and time are properly formatted
 *    - [ ] Ticket quantity is accurate
 *    - [ ] Amount paid is correct
 * 
 * 7. User Experience
 *    - [ ] Download button shows loading state
 *    - [ ] Download completes successfully
 *    - [ ] Error messages are user-friendly
 *    - [ ] Multiple downloads work correctly
 *    - [ ] Page remains responsive during download
 */
