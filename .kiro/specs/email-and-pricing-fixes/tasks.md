# Implementation Plan

- [ ] 1. Fix date offset bug in booking system
  - Create date utility functions that handle dates without timezone conversion
  - Update booking flow to use date-only format (YYYY-MM-DD)
  - Update all display components (confirmation page, PDF ticket, email) to use consistent date formatting
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 1.1 Create date utility functions


  - Write `formatDateOnly()` function to convert Date to YYYY-MM-DD string
  - Write `parseDateOnly()` function to parse YYYY-MM-DD string without timezone conversion
  - Write `formatDateForDisplay()` function for user-friendly date display
  - Write `validateDateOnly()` function for date format validation
  - _Requirements: 3.5, 3.6_

- [x] 1.2 Update booking flow date handling


  - Update book-visit page to use `formatDateOnly()` when user selects date
  - Update cart checkout to preserve date-only format
  - Update payment verification to store dates in YYYY-MM-DD format
  - Add date validation in API routes
  - _Requirements: 3.1, 3.5_

- [x] 1.3 Update date display in confirmation page


  - Update booking confirmation page to use `formatDateForDisplay()`
  - Ensure date displays match user's selected date
  - Test with dates at month/year boundaries
  - _Requirements: 3.2, 3.6_

- [x] 1.4 Update date display in PDF ticket generation


  - Update ticket data fetching to use `formatDateForDisplay()`
  - Update PDF template to display formatted date
  - Verify date consistency in generated tickets
  - _Requirements: 3.3, 3.6_

- [x] 1.5 Update date display in email confirmation


  - Update email template to use `formatDateForDisplay()`
  - Verify date displays correctly in email
  - Test email with various date selections
  - _Requirements: 3.4, 3.6_

- [ ] 1.6 Write tests for date handling
  - Create unit tests for date utility functions
  - Test date selection and storage flow
  - Test date display across all components
  - Test edge cases (month/year boundaries, different timezones)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 2. Add pricing display to content management system
  - Add pricing_display section type support to admin panel
  - Update exhibition detail page to retrieve and display pricing content from CMS
  - Implement fallback to default pricing display when CMS content doesn't exist
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.1 Update admin content manager for pricing display


  - Add 'pricing_display' to section type options in admin UI
  - Create form fields for pricing display (title, content, metadata)
  - Add preview functionality for pricing display section
  - Implement save functionality for pricing display content
  - _Requirements: 2.1, 2.5, 2.6_

- [x] 2.2 Update exhibition detail page to use CMS pricing data


  - Query content_sections for pricing_display section type
  - Extract title, content, and metadata from CMS data
  - Render pricing display using CMS content when available
  - Implement fallback to hardcoded values when CMS content doesn't exist
  - _Requirements: 2.2, 2.3, 2.4_

- [ ] 2.3 Test pricing display content management
  - Test creating pricing_display section in admin panel
  - Test editing existing pricing_display section
  - Test exhibition page displays custom pricing content
  - Test fallback behavior when section doesn't exist
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 3. Configure email domain and improve error handling
  - Create comprehensive email setup documentation
  - Update email configuration to support custom domain
  - Enhance error handling to detect and report test mode restrictions
  - Add environment variable support for email configuration
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3.1 Create email domain verification documentation


  - Write EMAIL_SETUP.md with step-by-step domain verification guide
  - Document Resend dashboard configuration steps
  - Document DNS record setup requirements
  - Document environment variable configuration
  - Include troubleshooting section for common issues
  - _Requirements: 1.2_

- [x] 3.2 Update email configuration for custom domain support


  - Update EMAIL_CONFIG to use environment variables (EMAIL_FROM, EMAIL_REPLY_TO)
  - Add testMode detection based on environment configuration
  - Implement fallback to test domain when custom domain not configured
  - Update Vercel environment variables with placeholder values
  - _Requirements: 1.1, 1.3_

- [x] 3.3 Enhance email error handling and logging



  - Update sendBookingConfirmation to detect test mode restrictions
  - Add informative warning logs when operating in test mode
  - Update error messages to guide administrators to setup documentation
  - Add testMode flag to error response for better debugging
  - _Requirements: 1.3, 1.4_

- [ ] 3.4 Test email configuration
  - Test email sending in test mode (current state)
  - Verify error messages are clear and helpful
  - Test with custom domain configuration (if domain available)
  - Verify environment variable configuration works correctly
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
