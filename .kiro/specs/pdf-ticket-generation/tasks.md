# Implementation Plan

- [x] 1. Create QR code generation utility


  - Implement `lib/tickets/qr-generator.ts` with `generateQRCode` function
  - Use `qrcode` library to generate base64 data URLs
  - Configure QR code options: 200px width, medium error correction
  - Add error handling for invalid input
  - _Requirements: 1.3, 6.1, 6.2, 6.4_



- [x] 2. Create ticket data fetcher utility

  - Implement `lib/tickets/fetch-ticket-data.ts` with `fetchTicketData` function
  - Write optimized SQL query with joins for bookings, exhibitions, shows, time_slots, tickets
  - Fetch payment_orders.cart_snapshot for pricing tier information
  - Handle cases where exhibition OR show is null (not both)


  - Return properly typed BookingData interface
  - _Requirements: 7.2, 7.3_

- [x] 3. Create PDF document component

  - Implement `components/tickets/TicketPDFDocument.tsx` using @react-pdf/renderer
  - Design professional layout with museum branding (logo, colors, typography)
  - Create header section with logo and "TICKET" title
  - Add booking reference and Razorpay Payment ID display sections
  - Embed QR code image (150x150px) with booking details alongside
  - Display guest information: name, email, phone
  - Show exhibition/show name, date, time slot
  - Display ticket number, quantity, and amount paid


  - Add footer with museum contact information
  - Use museum brand colors: primary #1a1a1a, accent #d4af37
  - Ensure A4/Letter paper compatibility
  - _Requirements: 1.1, 1.3, 1.4, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.3_

- [x] 4. Create PDF generation API route

  - Implement `app/api/tickets/generate/[bookingId]/route.ts` with GET handler
  - Extract and validate Authorization header for JWT token
  - Create Supabase client with user's auth token
  - Validate bookingId parameter format (UUID)
  - Call fetchTicketData utility to get complete booking information
  - Verify booking belongs to authenticated user (403 if not)
  - Generate QR code using qr-generator utility


  - Render PDF using TicketPDFDocument component and renderToStream
  - Set response headers: Content-Type: application/pdf, Content-Disposition: attachment
  - Stream PDF directly to response (no file storage)
  - Handle errors: 401 (no auth), 404 (booking not found), 403 (wrong user), 500 (generation failed)
  - Add structured error logging for debugging
  - _Requirements: 1.1, 1.5, 3.1, 3.4, 3.5, 5.2, 5.3, 5.4, 7.1, 7.4_

- [x] 5. Update confirmation page with download functionality

  - Modify `app/(public)/bookings/confirmation/page.tsx`
  - Fetch bookings with payment_id column included in SELECT query
  - Display Razorpay Payment ID for each booking in the details grid
  - Add state for tracking download progress per booking (downloadingId)
  - Implement `handleDownloadTicket` function that:
    * Gets user session token from Supabase auth
    * Calls `/api/tickets/generate/[bookingId]` with Authorization header
    * Converts response blob to downloadable file
    * Creates temporary anchor element for download


    * Sets filename as `MGM-Ticket-{bookingReference}.pdf`
    * Cleans up object URL after download
  - Add "Download Ticket" button for each booking with Download icon
  - Show loading spinner on button during PDF generation
  - Display error toast if download fails


  - Add visual confirmation icon (CheckCircle) for successful payment
  - Ensure Razorpay Payment ID is prominently displayed
  - _Requirements: 1.5, 2.1, 2.2, 2.3, 3.2, 5.1, 5.2, 5.3, 5.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 6. Add TypeScript interfaces and types

  - Create `types/tickets.ts` with BookingData interface
  - Define TicketPDFProps interface for PDF component
  - Add CartSnapshot interface for payment_orders.cart_snapshot structure
  - Export all types for use across ticket generation modules
  - _Requirements: 7.3_

- [x] 7. Implement error handling and logging

  - Add try-catch blocks in all ticket generation functions
  - Implement structured error logging with context (bookingId, userId, timestamp)
  - Add user-friendly error messages for common failure scenarios
  - Implement graceful degradation: show booking details even if PDF fails
  - Add console warnings for missing optional data (logo, etc.)
  - _Requirements: 2.4, 7.4_

- [ ]* 8. Add rate limiting middleware
  - Create `middleware/rate-limit.ts` for API route protection
  - Implement rate limiting: 10 requests per minute per user
  - Use in-memory store or Redis for rate limit tracking
  - Return 429 Too Many Requests when limit exceeded
  - _Requirements: Security considerations_

- [ ]* 9. Create museum logo asset
  - Add MGM Museum logo to `public/images/museum-logo.png`
  - Convert logo to base64 for embedding in PDF
  - Create utility function to load and encode logo
  - Handle missing logo gracefully (skip logo section if not found)
  - _Requirements: 4.1_

- [ ]* 10. Add download analytics tracking
  - Implement event tracking for successful PDF downloads
  - Track download failures with error types
  - Log PDF generation time for performance monitoring
  - Add metrics for download completion rates
  - _Requirements: Monitoring considerations_

- [ ]* 11. Write unit tests for utilities
  - Test QR code generation with valid and invalid inputs
  - Test ticket data fetcher with various booking scenarios
  - Test error handling in all utility functions
  - Mock Supabase client for isolated testing
  - _Requirements: Testing Strategy - Unit Tests_

- [ ]* 12. Write integration tests for API route
  - Test authenticated request returns PDF with correct headers
  - Test unauthenticated request returns 401
  - Test invalid booking ID returns 404
  - Test booking owned by different user returns 403
  - Test PDF content type and download headers
  - _Requirements: Testing Strategy - Integration Tests_

- [ ]* 13. Perform end-to-end testing
  - Complete full booking flow from payment to PDF download
  - Verify Razorpay Payment ID appears correctly in PDF
  - Test QR code scanning with mobile device
  - Test PDF printing on physical printer
  - Test download on multiple browsers (Chrome, Firefox, Safari)
  - Test mobile download on iOS and Android devices
  - Verify multiple bookings generate separate PDFs correctly
  - _Requirements: Testing Strategy - End-to-End Tests_
