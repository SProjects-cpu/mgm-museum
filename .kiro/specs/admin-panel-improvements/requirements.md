# Admin Panel Improvements - Requirements Document

## Introduction

This document outlines the requirements for fixing and enhancing the MGM Museum Admin Panel. The admin panel currently has several non-functional features and missing capabilities that need to be addressed.

## Glossary

- **Admin Panel**: Web interface for museum staff to manage exhibitions, bookings, and system settings
- **Image Upload**: Feature allowing admins to upload exhibition images via drag-and-drop
- **Booking Filter**: Date-based filtering system for viewing bookings
- **Excel Export**: Feature to generate Excel reports from filtered booking data
- **Analytics PDF**: PDF report containing charts and metrics from analytics dashboard
- **Admin Credentials**: Login email and password for admin users
- **Email Authentication**: Verification process using Resend API for credential changes

## Requirements

### Requirement 1: Fix Exhibition Image Upload

**User Story:** As an admin, I want to upload exhibition images via drag-and-drop, so that I can manage exhibition visual content.

#### Acceptance Criteria

1. WHEN the admin navigates to Admin > Exhibitions > [Exhibition] > Basic Info, THE system SHALL display a functional drag-and-drop image upload interface
2. WHEN the admin selects an image file from their device, THE system SHALL upload the file to Supabase Storage without errors
3. WHEN the upload is successful, THE system SHALL display the uploaded image in the exhibition preview
4. IF the upload fails, THEN THE system SHALL display a clear error message indicating the reason for failure
5. THE system SHALL support image formats: JPG, PNG, WebP with maximum file size of 5MB

### Requirement 2: Implement Bookings Management Page

**User Story:** As an admin, I want to view all customer bookings with filtering options, so that I can manage reservations effectively.

#### Acceptance Criteria

1. WHEN the admin navigates to Admin > Bookings, THE system SHALL display a list of all bookings without 404 errors
2. THE system SHALL display bookings with the following columns: Visitor Name, Visitor Email, Visitor Phone, Booking Reference, Ticket Number, Razorpay ID, Visit Date, Visit Time Slot, Number of Tickets, Amount Paid, Status, Booking Timestamp
3. THE system SHALL provide filter options: Today, Tomorrow, Last Week, Last Month, Custom Date Range
4. WHEN the admin selects a filter, THE system SHALL update the booking list to show only matching bookings
5. THE system SHALL display booking timestamps in YYYY-MM-DD HH:MM:SS format
6. THE system SHALL paginate results with 50 bookings per page
7. THE system SHALL allow sorting by any column (ascending/descending)

### Requirement 3: Implement Excel Report Generation

**User Story:** As an admin, I want to export filtered bookings to Excel, so that I can analyze booking data offline.

#### Acceptance Criteria

1. WHEN the admin has applied filters to the bookings list, THE system SHALL display an "Export to Excel" button
2. WHEN the admin clicks "Export to Excel", THE system SHALL generate an Excel file containing all filtered bookings
3. THE Excel file SHALL contain 12 columns: Visitor Name, Visitor Email, Visitor Phone Number, Booking Reference, Ticket Number, Razorpay_Id, Book-visit Date, Book Visit Time-slot, Number of Tickets Booked by visitor, Amount Paid, Status, Booking Timestamp (YYYY-MM-DD)
4. THE Excel file SHALL format dates as YYYY-MM-DD and amounts with currency symbol (₹)
5. THE Excel file SHALL include a header row with column names
6. THE Excel file SHALL be named "MGM_Bookings_[StartDate]_to_[EndDate].xlsx"
7. THE system SHALL download the file automatically to the admin's device

### Requirement 4: Fix Analytics PDF Export

**User Story:** As an admin, I want to export analytics data to PDF, so that I can share reports with stakeholders.

#### Acceptance Criteria

1. WHEN the admin navigates to Admin > Analytics, THE system SHALL display charts for revenue, bookings, and visitor metrics
2. WHEN the admin clicks "Export PDF", THE system SHALL generate a PDF containing all visible charts and data
3. THE PDF SHALL include: Revenue chart, Bookings chart, Visitor count chart, Top exhibitions table, Summary statistics
4. THE PDF SHALL match the data displayed in the analytics dashboard
5. THE PDF SHALL be formatted professionally with MGM Museum branding
6. THE PDF SHALL be named "MGM_Analytics_Report_[Date].pdf"
7. THE system SHALL download the PDF automatically to the admin's device

### Requirement 5: Implement Admin Settings Pages

**User Story:** As an admin, I want to configure system settings, so that I can customize the booking system.

#### Acceptance Criteria

1. WHEN the admin navigates to Admin > Settings, THE system SHALL display functional settings pages (not dummy content)
2. THE system SHALL provide settings for: Payment Gateway Configuration, Email Templates, Booking Rules, Time Slot Management, Pricing Configuration
3. WHEN the admin updates a setting, THE system SHALL save the changes to the database
4. WHEN the admin saves settings, THE system SHALL display a success confirmation message
5. THE system SHALL validate all settings before saving (e.g., valid email format, positive numbers for prices)

### Requirement 6: Implement Admin Credential Management

**User Story:** As an admin, I want to change my login credentials securely, so that I can maintain account security.

#### Acceptance Criteria

1. WHEN the admin navigates to Admin > Settings > Account, THE system SHALL display a "Change Credentials" form
2. THE form SHALL allow updating: Email address, Password
3. WHEN the admin submits a credential change request, THE system SHALL send a verification email to the new email address using Resend API (key: re_ZwMhju8q_FBigRbGgpHV3WtsReJbGJ8eE)
4. THE verification email SHALL contain a unique verification link valid for 24 hours
5. WHEN the admin clicks the verification link, THE system SHALL update the credentials in Supabase Auth
6. IF the verification link expires, THEN THE system SHALL display an error and allow requesting a new link
7. THE system SHALL require the current password before allowing credential changes
8. THE system SHALL enforce password requirements: minimum 8 characters, at least one uppercase, one lowercase, one number

## Constraints

- All features MUST work with existing Supabase database schema
- Image uploads MUST use Supabase Storage with proper RLS policies
- Excel generation MUST use ExcelJS library (already in package.json)
- PDF generation MUST use jsPDF library (already in package.json)
- Email authentication MUST use Resend API with provided key
- All admin pages MUST require authentication and admin role verification
- All API endpoints MUST implement proper error handling and logging

## Non-Functional Requirements

### Performance
- Booking list MUST load within 2 seconds for up to 1000 bookings
- Excel export MUST complete within 5 seconds for up to 5000 bookings
- PDF generation MUST complete within 3 seconds
- Image upload MUST complete within 10 seconds for files up to 5MB

### Security
- All admin endpoints MUST verify user has admin or super_admin role
- Image uploads MUST validate file type and size before processing
- Credential changes MUST require email verification
- All database queries MUST use parameterized statements to prevent SQL injection

### Usability
- All error messages MUST be clear and actionable
- All forms MUST provide real-time validation feedback
- All exports MUST include progress indicators
- All settings MUST have helpful descriptions

## Success Criteria

1. Admin can successfully upload exhibition images without errors
2. Admin can view all bookings without 404 errors
3. Admin can filter bookings by date ranges
4. Admin can export filtered bookings to properly formatted Excel files
5. Admin can export analytics data to accurate PDF reports
6. Admin can configure system settings that persist across sessions
7. Admin can change login credentials with email verification
8. All features work in production environment on Vercel

## Out of Scope

- Multi-language support for admin panel
- Mobile app for admin functions
- Advanced analytics with custom date ranges beyond provided filters
- Bulk booking operations (cancel, refund multiple bookings)
- Integration with third-party analytics tools
