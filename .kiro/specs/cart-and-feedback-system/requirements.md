# Requirements Document

## Introduction

This feature enhances the cart system to distinguish between pending and confirmed bookings, adds a customer feedback system for completed visits, and updates the UI/UX with new hover effects and loading animations.

## Glossary

- **Cart System**: The shopping cart interface where customers manage their bookings
- **Pending Booking**: A booking added to cart but not yet checked out/paid
- **Confirmed Booking**: A booking that has been paid for and confirmed
- **Feedback System**: A mechanism for customers to provide reviews/ratings for their visits
- **Admin Panel**: The administrative interface for managing museum operations
- **Hover Effect**: Visual feedback when user hovers over interactive elements
- **Block Loader**: An animated loading component with block-style animation

## Requirements

### Requirement 1: Enhanced Cart Page with Booking Sections

**User Story:** As a customer, I want to see my pending and confirmed bookings separately in the cart, so that I can easily distinguish between items I need to checkout and bookings I've already completed.

#### Acceptance Criteria

1. WHEN the customer navigates to the cart page, THE Cart System SHALL display two distinct sections: "Pending Bookings" and "Confirmed Bookings"
2. WHEN a booking is added to cart but not checked out, THE Cart System SHALL display it in the "Pending Bookings" section
3. WHEN a booking has been paid for and confirmed, THE Cart System SHALL display it in the "Confirmed Bookings" section
4. WHILE viewing pending bookings, THE Cart System SHALL provide a delete option for each booking
5. WHILE viewing confirmed bookings, THE Cart System SHALL NOT provide a delete option
6. WHEN viewing a confirmed booking, THE Cart System SHALL provide a "View Booking Details" option

### Requirement 2: Customer Feedback System

**User Story:** As a customer, I want to provide feedback on my confirmed bookings, so that I can share my experience and help improve the museum services.

#### Acceptance Criteria

1. WHEN viewing a confirmed booking in the cart, THE Cart System SHALL display a "Provide Feedback" option
2. WHEN the customer clicks "Provide Feedback", THE Cart System SHALL display a feedback form
3. THE Feedback Form SHALL accept text input for customer experience
4. THE Feedback Form SHALL accept a rating (1-5 stars)
5. WHEN the customer submits feedback, THE Cart System SHALL save the feedback to the database
6. THE Cart System SHALL associate feedback with the specific booking_id
7. WHEN feedback is already provided for a booking, THE Cart System SHALL display "View Feedback" instead of "Provide Feedback"

### Requirement 3: Admin Panel Feedback Section

**User Story:** As an admin, I want to view all customer feedback in a dedicated section, so that I can monitor customer satisfaction and identify areas for improvement.

#### Acceptance Criteria

1. THE Admin Panel SHALL include a new "Feedbacks" section in the navigation
2. WHEN admin navigates to Feedbacks section, THE Admin Panel SHALL display all customer feedback
3. THE Admin Panel SHALL display feedback with associated booking reference, customer name, event name, rating, and feedback text
4. THE Admin Panel SHALL provide filtering options by rating, date, and event
5. THE Admin Panel SHALL synchronize feedback data in real-time with customer submissions
6. THE Admin Panel SHALL display feedback submission timestamp

### Requirement 4: UI/UX Hover Effect Updates

**User Story:** As a customer, I want consistent and professional hover effects on buttons, so that the interface feels cohesive and responsive.

#### Acceptance Criteria

1. WHEN the customer hovers over any button on the customer site, THE Button SHALL display a black background
2. WHILE hovering over a button, THE Button SHALL display white text
3. THE Button SHALL NOT display purple hover effects
4. THE Hover Effect SHALL apply to all buttons across the customer site
5. THE Hover Effect SHALL have a smooth transition animation

### Requirement 5: Block Loader Animation

**User Story:** As a customer, I want to see an engaging loading animation while waiting for content to load, so that the waiting experience feels more pleasant.

#### Acceptance Criteria

1. WHEN content is loading in the book-visit section, THE System SHALL display the Block Loader animation
2. THE Block Loader SHALL replace the current purple skeleton animation
3. THE Block Loader SHALL display for calendar loading states
4. THE Block Loader SHALL display for time slot loading states
5. THE Block Loader SHALL use the museum's color scheme
6. THE Block Loader SHALL be implemented as a reusable component in /components/ui/block-loader.tsx
