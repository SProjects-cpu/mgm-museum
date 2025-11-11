# Requirements Document

## Introduction

This document outlines the requirements for fixing three critical issues in the MGM Museum application:
1. Email sending restriction that prevents sending confirmation emails to customers other than the verified test email
2. Pricing display in exhibition pages that is not editable through the admin panel content management system
3. Date offset bug where confirmed bookings show a date one day earlier than the selected date

## Glossary

- **Resend**: Third-party email service provider used for sending transactional emails
- **Domain Verification**: Process of proving ownership of a domain to send emails from that domain
- **Content Section**: Database-stored content blocks that can be edited through the admin panel
- **Exhibition Detail Page**: Public-facing page showing exhibition information and booking widget
- **Booking Widget**: Component on exhibition pages that displays pricing and booking options
- **Date Offset Bug**: Issue where dates are incorrectly shifted by one day due to timezone conversion
- **UTC**: Coordinated Universal Time, timezone-independent time standard
- **Booking Confirmation Page**: Page displayed after successful payment showing booking details
- **PDF Ticket**: Downloadable ticket document generated for confirmed bookings

## Requirements

### Requirement 1: Email Domain Configuration

**User Story:** As a museum administrator, I want to send booking confirmation emails to all customers, so that they receive their booking details regardless of their email provider.

#### Acceptance Criteria

1. WHEN the system sends a booking confirmation email, THE Email System SHALL use a verified domain email address as the sender
2. THE Email System SHALL provide clear documentation on domain verification steps
3. THE Email System SHALL support fallback to test mode when domain is not verified
4. THE Email System SHALL log appropriate warnings when operating in test mode
5. WHERE a verified domain is configured, THE Email System SHALL send emails to any recipient address

### Requirement 2: Pricing Display Content Management

**User Story:** As a museum administrator, I want to edit the pricing display section in exhibition pages through the admin panel, so that I can customize the pricing presentation without code changes.

#### Acceptance Criteria

1. THE Admin Panel SHALL provide an interface to edit pricing display content
2. THE Exhibition Detail Page SHALL retrieve pricing display content from the database
3. WHEN pricing display content exists in the database, THE Exhibition Detail Page SHALL render the custom content
4. WHEN pricing display content does not exist, THE Exhibition Detail Page SHALL render default pricing display
5. THE Pricing Display Content SHALL include editable fields for title text, subtitle text, and footer text
6. THE Admin Panel SHALL allow administrators to preview pricing display changes before saving

### Requirement 3: Date Display Consistency

**User Story:** As a customer, I want to see the correct booking date on my confirmation page and ticket, so that I arrive on the correct day for my museum visit.

#### Acceptance Criteria

1. WHEN a customer selects a date in the booking calendar, THE Booking System SHALL preserve the exact date without timezone conversion
2. THE Booking Confirmation Page SHALL display the same date that the customer selected
3. THE PDF Ticket SHALL display the same date that the customer selected
4. THE Email Confirmation SHALL display the same date that the customer selected
5. THE Booking System SHALL store dates in a timezone-independent format
6. WHEN displaying dates to customers, THE System SHALL format dates consistently across all touchpoints
