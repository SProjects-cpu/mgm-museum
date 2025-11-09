# Admin Panel Improvements - Implementation Tasks

## Task Overview

This document outlines the implementation tasks for fixing and enhancing the MGM Museum Admin Panel. Tasks are organized by feature and should be completed sequentially within each feature group.

---

## 1. Fix Exhibition Image Upload

- [ ] 1.1 Create Supabase Storage buckets and configure RLS policies
  - Create `exhibition-images` bucket in Supabase
  - Create `show-images` bucket in Supabase
  - Apply RLS policy: "Admins can upload exhibition images"
  - Apply RLS policy: "Public can view exhibition images"
  - Test bucket access with admin and public users
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 1.2 Fix upload API endpoint
  - Update `/app/api/admin/upload/route.ts` to handle errors properly
  - Add file type validation (JPEG, PNG, WebP only)
  - Add file size validation (5MB max)
  - Implement proper error responses with clear messages
  - Add logging for upload failures
  - Test API with valid and invalid files
  - _Requirements: 1.1, 1.4, 1.5_

- [ ] 1.3 Create ImageUploadZone component
  - Create `/components/admin/image-upload-zone.tsx`
  - Implement drag-and-drop using react-dropzone
  - Add file validation on client side
  - Show upload progress indicator
  - Display preview of uploaded images
  - Add delete functionality for uploaded images
  - Handle upload errors with user-friendly messages
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 1.4 Integrate ImageUploadZone into exhibition management
  - Update exhibition detail management page
  - Replace existing upload UI with ImageUploadZone
  - Connect to upload API endpoint
  - Update exhibition images array on successful upload
  - Test complete upload flow in admin panel
  - _Requirements: 1.1, 1.2, 1.3_

---

## 2. Implement Bookings Management Page

- [ ] 2.1 Create bookings API endpoint
  - Create `/app/api/admin/bookings/route.ts`
  - Implement GET handler with query parameters
  - Write SQL query to fetch bookings with all required columns
  - Add date range filtering (today, tomorrow, last week, last month, custom)
  - Add status filtering
  - Add search functionality (booking reference, name, email)
  - Implement pagination (50 per page)
  - Implement sorting by any column
  - Test API with various filter combinations
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ] 2.2 Create BookingsManagement component
  - Create `/app/admin/bookings/page.tsx`
  - Implement state management for bookings, filters, pagination
  - Create filter UI (Today, Tomorrow, Last Week, Last Month, Custom)
  - Add custom date range picker
  - Add status filter dropdown
  - Add search input
  - Display bookings in table with 12 columns
  - Implement column sorting (click header to sort)
  - Add pagination controls
  - Show loading states
  - Handle empty states
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ] 2.3 Format booking data display
  - Format dates as YYYY-MM-DD
  - Format timestamps as YYYY-MM-DD HH:MM:SS
  - Format amounts with ₹ symbol
  - Format status with color badges
  - Add tooltips for long text
  - Make table responsive
  - _Requirements: 2.2, 2.5_

---

## 3. Implement Excel Report Generation

- [ ] 3.1 Create Excel export API endpoint
  - Create `/app/api/admin/export/bookings/route.ts`
  - Implement POST handler accepting filters
  - Fetch all bookings matching filters (no pagination)
  - Generate Excel file using ExcelJS
  - Add 12 columns with proper headers
  - Format dates as YYYY-MM-DD
  - Format amounts with ₹ symbol
  - Style header row (bold, background color)
  - Add auto-filter to columns
  - Set appropriate column widths
  - Return file as download with proper filename
  - Test with various data sizes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 3.2 Create ExportButton component
  - Create `/components/admin/export-button.tsx`
  - Add "Export to Excel" button
  - Show loading state during export
  - Handle export errors
  - Trigger file download on success
  - Add success toast notification
  - _Requirements: 3.1, 3.2, 3.7_

- [ ] 3.3 Integrate export into bookings page
  - Add ExportButton to bookings management page
  - Pass current filters to export function
  - Test export with different filter combinations
  - Verify Excel file format and data accuracy
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

---

## 4. Fix Analytics PDF Export

- [ ] 4.1 Create analytics data fetching function
  - Create `/lib/analytics/fetch-analytics-data.ts`
  - Fetch revenue data by date
  - Fetch bookings data by status and date
  - Fetch visitor count by exhibition
  - Fetch top exhibitions with bookings and revenue
  - Calculate summary statistics
  - Test data accuracy against database
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 4.2 Create PDF export API endpoint
  - Create `/app/api/admin/export/analytics/route.ts`
  - Implement POST handler accepting date range
  - Fetch analytics data
  - Generate PDF using jsPDF and jspdf-autotable
  - Add MGM Museum header and branding
  - Add summary statistics table
  - Add top exhibitions table
  - Add revenue by date table
  - Add bookings by date table
  - Format dates and currency properly
  - Return PDF as download with proper filename
  - Test PDF generation with real data
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 4.3 Update analytics dashboard with export button
  - Update `/app/admin/analytics/analytics-dashboard.tsx`
  - Add "Export PDF" button
  - Show loading state during export
  - Handle export errors
  - Trigger PDF download on success
  - Test complete export flow
  - _Requirements: 4.1, 4.2, 4.7_

---

## 5. Implement Admin Settings Pages

- [ ] 5.1 Create system_settings database table
  - Write migration: `20260110_system_settings.sql`
  - Create system_settings table with columns: id, key, value, category, updated_at, updated_by
  - Add indexes on key and category
  - Enable RLS with admin-only policy
  - Apply migration to database
  - Test table creation and RLS policies
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 5.2 Create settings API endpoints
  - Create `/app/api/admin/settings/route.ts`
  - Implement GET handler to fetch all settings
  - Implement PUT handler to update settings
  - Validate setting values before saving
  - Return appropriate error messages
  - Test API with valid and invalid data
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 5.3 Update settings page with backend integration
  - Update `/app/admin/settings/page.tsx`
  - Fetch settings from API on page load
  - Save settings to API on form submit
  - Show loading states
  - Show success/error messages
  - Validate form inputs
  - Test complete settings flow
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 5.4 Add payment gateway settings section
  - Add Razorpay configuration fields
  - Add email service configuration fields
  - Encrypt sensitive credentials before saving
  - Test payment settings persistence
  - _Requirements: 5.2, 5.3, 5.4_

- [ ] 5.5 Add email template settings section
  - Add booking confirmation template editor
  - Add payment failure template editor
  - Add cancellation template editor
  - Test template saving and loading
  - _Requirements: 5.2, 5.3, 5.4_

---

## 6. Implement Admin Credential Management

- [ ] 6.1 Create email_verification_tokens table
  - Write migration: `20260110_email_verification_tokens.sql`
  - Create table with columns: id, user_id, token, new_email, expires_at, used, created_at
  - Add indexes on token, user_id, expires_at
  - Enable RLS with user-only policy
  - Apply migration to database
  - Test table creation and RLS policies
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [ ] 6.2 Create credential change request API
  - Create `/app/api/admin/account/request-change/route.ts`
  - Implement POST handler
  - Verify current password
  - Validate new email/password
  - Generate verification token
  - Store token in database
  - Send verification email using Resend (key: re_ZwMhju8q_FBigRbGgpHV3WtsReJbGJ8eE)
  - Test API with valid and invalid inputs
  - _Requirements: 6.1, 6.2, 6.3, 6.7, 6.8_

- [ ] 6.3 Create email verification API
  - Create `/app/api/admin/account/verify-change/route.ts`
  - Implement POST handler accepting token
  - Validate token (not expired, not used)
  - Update user email in Supabase Auth
  - Mark token as used
  - Return success/error response
  - Test verification flow
  - _Requirements: 6.4, 6.5, 6.6_

- [ ] 6.4 Create AccountSettings component
  - Create `/app/admin/settings/account/page.tsx`
  - Add form for email change
  - Add form for password change
  - Validate inputs (password strength, email format)
  - Show verification sent message
  - Handle verification errors
  - Test complete credential change flow
  - _Requirements: 6.1, 6.2, 6.3, 6.7, 6.8_

- [ ] 6.5 Create email verification page
  - Create `/app/admin/account/verify/page.tsx`
  - Extract token from URL query parameter
  - Call verification API
  - Show success/error message
  - Redirect to login on success
  - Handle expired token case
  - Test verification page
  - _Requirements: 6.4, 6.5, 6.6_

- [ ] 6.6 Create verification email template
  - Create email template with MGM branding
  - Include verification link
  - Add expiration notice (24 hours)
  - Test email delivery
  - _Requirements: 6.3, 6.4_

---

## 7. Testing and Deployment

- [ ] 7.1 Test all features in development
  - Test image upload with various file types and sizes
  - Test bookings page with all filter combinations
  - Test Excel export with large datasets
  - Test analytics PDF export
  - Test settings save and load
  - Test credential change flow end-to-end
  - Fix any bugs found during testing

- [ ] 7.2 Deploy to production
  - Create Supabase Storage buckets in production
  - Apply all database migrations
  - Configure Resend API key in Vercel
  - Deploy code to Vercel
  - Verify all features work in production
  - Monitor error logs for 48 hours

- [ ] 7.3 Create user documentation
  - Document image upload process for admins
  - Document bookings management features
  - Document export functionality
  - Document settings configuration
  - Document credential change process
  - Add troubleshooting section

---

## Notes

- All tasks should be implemented with proper error handling and logging
- All API endpoints must verify admin role before processing
- All database queries must use parameterized statements
- All user inputs must be validated and sanitized
- All features must be tested in both development and production
- Progress should be tracked by marking tasks as complete

**Total Tasks:** 31 main tasks + 5 sub-tasks = 36 tasks
**Estimated Time:** 3-4 weeks for complete implementation
