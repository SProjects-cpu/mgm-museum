# Implementation Plan

- [ ] 1. Database setup and migrations
  - [ ] 1.1 Create feedback table migration
    - Write SQL migration to create feedback table with proper constraints
    - Add indexes for performance (booking_id, user_id, rating, created_at)
    - Add unique constraint for one feedback per booking
    - _Requirements: 2.5, 2.6_
  
  - [ ] 1.2 Apply migration to database
    - Run migration using Supabase MCP
    - Verify table creation and constraints
    - _Requirements: 2.5_
  
  - [ ] 1.3 Set up Row Level Security policies
    - Create RLS policy for users to insert their own feedback
    - Create RLS policy for users to view their own feedback
    - Create RLS policy for admins to view all feedback
    - _Requirements: 2.5, 3.2_

- [ ] 2. Create reusable UI components
  - [ ] 2.1 Implement Block Loader component
    - Create /components/ui/block-loader.tsx with animation
    - Add TypeScript interfaces for props
    - Implement flex-based block animation
    - Test with different color schemes
    - _Requirements: 5.1, 5.2, 5.5, 5.6_
  
  - [ ] 2.2 Create Star Rating component
    - Create /components/ui/star-rating.tsx
    - Implement interactive star selection (1-5)
    - Add hover effects for stars
    - Make keyboard accessible
    - _Requirements: 2.4_
  
  - [ ] 2.3 Create Feedback Dialog component
    - Create /components/feedback/feedback-dialog.tsx
    - Integrate Star Rating component
    - Add textarea for comments
    - Implement form validation
    - Add submit button with loading state
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ] 3. Update global styles for hover effects
  - [ ] 3.1 Update Tailwind configuration
    - Modify tailwind.config.ts to add custom hover utilities
    - Define black hover effect with white text
    - Remove purple hover effect references
    - _Requirements: 4.1, 4.2, 4.3, 4.5_
  
  - [ ] 3.2 Update Button component hover styles
    - Modify /components/ui/button.tsx to use new hover effect
    - Apply black background and white text on hover
    - Add smooth transition animation
    - _Requirements: 4.1, 4.2, 4.4, 4.5_
  
  - [ ] 3.3 Update existing button usages
    - Search for buttons with purple hover effects
    - Replace with new black hover effect
    - Test across all pages
    - _Requirements: 4.3, 4.4_

- [ ] 4. Implement feedback API endpoints
  - [ ] 4.1 Create POST /api/feedback/create endpoint
    - Validate user authentication
    - Verify booking ownership
    - Check booking status (confirmed/completed)
    - Validate rating (1-5)
    - Insert feedback record
    - Handle duplicate feedback error
    - Return feedback data
    - _Requirements: 2.5, 2.6_
  
  - [ ] 4.2 Create GET /api/feedback/list endpoint
    - Accept booking_id query parameter
    - Fetch feedback with booking details
    - Join with exhibitions/shows for event names
    - Return feedback array
    - _Requirements: 2.7, 3.3_
  
  - [ ] 4.3 Create GET /api/cart/bookings endpoint
    - Fetch cart_items for current user (pending)
    - Fetch confirmed bookings for current user
    - Join with exhibitions/shows/time_slots
    - Check feedback existence for confirmed bookings
    - Return both pending and confirmed arrays
    - _Requirements: 1.2, 1.3, 1.6_

- [ ] 5. Build enhanced cart page
  - [ ] 5.1 Create cart page layout
    - Create /app/cart/page.tsx
    - Add page header with title
    - Set up two-section layout (pending/confirmed)
    - Add loading states with Block Loader
    - _Requirements: 1.1, 5.3, 5.4_
  
  - [ ] 5.2 Implement Pending Bookings section
    - Create section header with count
    - Map through pending bookings
    - Display booking cards with event details
    - Add Checkout button for each booking
    - Add Delete button for each booking
    - Implement delete functionality
    - _Requirements: 1.2, 1.4_
  
  - [ ] 5.3 Implement Confirmed Bookings section
    - Create section header with count
    - Map through confirmed bookings
    - Display booking cards with event details
    - Add "View Details" button
    - Add "Provide Feedback" or "View Feedback" button based on feedback status
    - _Requirements: 1.3, 1.5, 1.6, 2.1, 2.7_
  
  - [ ] 5.4 Integrate Feedback Dialog
    - Connect feedback button to dialog
    - Pass booking data to dialog
    - Handle feedback submission
    - Update UI after successful submission
    - Show success toast
    - _Requirements: 2.1, 2.2, 2.5_
  
  - [ ] 5.5 Add empty states
    - Show message when no pending bookings
    - Show message when no confirmed bookings
    - Add CTA to browse exhibitions
    - _Requirements: 1.1_

- [ ] 6. Create admin feedbacks section
  - [ ] 6.1 Create GET /api/admin/feedbacks endpoint
    - Verify admin authentication
    - Accept filter parameters (rating, date range, event type)
    - Accept pagination parameters (page, limit)
    - Fetch feedbacks with booking and event details
    - Implement filtering logic
    - Return paginated results
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [ ] 6.2 Create admin feedbacks page
    - Create /app/admin/feedbacks/page.tsx
    - Add page header with title
    - Implement filters bar (rating, date range, event type)
    - Add search input for booking reference
    - _Requirements: 3.1, 3.2, 3.4_
  
  - [ ] 6.3 Create feedbacks table component
    - Create table with columns (Date, Booking Ref, Customer, Event, Rating, Comment)
    - Display star rating visually
    - Format dates properly
    - Add pagination controls
    - Implement real-time updates using Supabase subscriptions
    - _Requirements: 3.2, 3.3, 3.5, 3.6_
  
  - [ ] 6.4 Add feedbacks to admin navigation
    - Update admin sidebar/navigation
    - Add "Feedbacks" menu item
    - Add icon for feedbacks section
    - _Requirements: 3.1_

- [ ] 7. Replace loading animations
  - [ ] 7.1 Update book-visit calendar loading
    - Replace skeleton loader with Block Loader
    - Configure Block Loader with museum colors
    - Test loading state
    - _Requirements: 5.1, 5.3, 5.5_
  
  - [ ] 7.2 Update time slots loading
    - Replace skeleton loader with Block Loader
    - Configure Block Loader with museum colors
    - Test loading state
    - _Requirements: 5.1, 5.4, 5.5_
  
  - [ ] 7.3 Remove purple skeleton animations
    - Search for purple skeleton/loading animations
    - Replace with Block Loader or remove
    - Verify no purple animations remain
    - _Requirements: 5.2_

- [ ] 8. Integration and testing
  - [ ] 8.1 Test complete feedback flow
    - Create confirmed booking
    - Submit feedback from cart page
    - Verify feedback appears in admin panel
    - Test duplicate feedback prevention
    - _Requirements: 2.5, 2.6, 3.2, 3.5_
  
  - [ ] 8.2 Test cart sections functionality
    - Verify pending bookings show delete option
    - Verify confirmed bookings show feedback option
    - Test delete pending booking
    - Test view booking details
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_
  
  - [ ] 8.3 Test hover effects across site
    - Verify all buttons have black hover effect
    - Verify no purple hover effects remain
    - Test hover transitions are smooth
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ] 8.4 Test loading animations
    - Verify Block Loader displays correctly
    - Test in calendar and time slots
    - Verify smooth animation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ] 8.5 Test admin feedbacks section
    - Test filtering by rating
    - Test filtering by date range
    - Test search by booking reference
    - Test pagination
    - Test real-time updates
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 9. Documentation and deployment
  - [ ] 9.1 Update API documentation
    - Document new feedback endpoints
    - Document cart/bookings endpoint
    - Document admin feedbacks endpoint
    - Add example requests/responses
    - _Requirements: All_
  
  - [ ] 9.2 Deploy to production
    - Commit all changes
    - Push to GitHub
    - Deploy via Vercel
    - Verify deployment successful
    - _Requirements: All_
  
  - [ ] 9.3 Create deployment summary
    - Document all changes made
    - List new features added
    - Provide testing checklist
    - _Requirements: All_
