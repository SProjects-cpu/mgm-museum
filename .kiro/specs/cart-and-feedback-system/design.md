# Design Document

## Overview

This design implements an enhanced cart system with separate sections for pending and confirmed bookings, a customer feedback mechanism, admin feedback management, and updated UI/UX patterns including new hover effects and loading animations.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Customer Frontend                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Cart Page   │  │   Feedback   │  │ Block Loader │     │
│  │  Component   │  │    Form      │  │  Component   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
├─────────────────────────────────────────────────────────────┤
│  /api/feedback/create    │  /api/feedback/list              │
│  /api/cart/bookings      │  /api/admin/feedbacks            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (Supabase)                       │
├─────────────────────────────────────────────────────────────┤
│  bookings table  │  feedback table  │  cart_items table    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Admin Panel                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  Feedbacks   │  │   Filters    │                        │
│  │    List      │  │  & Search    │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Database Schema

#### New Table: `feedback`

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one feedback per booking
  CONSTRAINT unique_feedback_per_booking UNIQUE (booking_id)
);

CREATE INDEX idx_feedback_booking ON feedback(booking_id);
CREATE INDEX idx_feedback_user ON feedback(user_id);
CREATE INDEX idx_feedback_rating ON feedback(rating);
CREATE INDEX idx_feedback_created ON feedback(created_at DESC);
```

### 2. Frontend Components

#### Cart Page Component (`app/cart/page.tsx`)

**Structure:**
```tsx
<CartPage>
  <PageHeader title="My Cart" />
  
  <PendingBookingsSection>
    <SectionHeader title="Pending Bookings" count={pendingCount} />
    {pendingBookings.map(booking => (
      <BookingCard
        booking={booking}
        actions={[
          <CheckoutButton />,
          <DeleteButton />
        ]}
      />
    ))}
  </PendingBookingsSection>
  
  <ConfirmedBookingsSection>
    <SectionHeader title="Confirmed Bookings" count={confirmedCount} />
    {confirmedBookings.map(booking => (
      <BookingCard
        booking={booking}
        actions={[
          <ViewDetailsButton />,
          <FeedbackButton booking={booking} />
        ]}
      />
    ))}
  </ConfirmedBookingsSection>
</CartPage>
```

**Data Flow:**
1. Fetch cart_items (pending bookings) for current user
2. Fetch bookings with status='confirmed' for current user
3. Check feedback existence for each confirmed booking
4. Render appropriate sections and actions

#### Feedback Dialog Component (`components/feedback/feedback-dialog.tsx`)

**Structure:**
```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Share Your Experience</DialogTitle>
      <DialogDescription>
        Tell us about your visit to {eventName}
      </DialogDescription>
    </DialogHeader>
    
    <Form>
      <StarRating value={rating} onChange={setRating} />
      <Textarea 
        placeholder="Share your experience..."
        value={comment}
        onChange={setComment}
      />
      <Button type="submit">Submit Feedback</Button>
    </Form>
  </DialogContent>
</Dialog>
```

#### Block Loader Component (`components/ui/block-loader.tsx`)

**Props:**
- `blockColor`: Tailwind bg color class
- `borderColor`: Tailwind border color class
- `size`: Block width/height in px
- `gap`: Gap between blocks in px
- `speed`: Animation duration in seconds
- `className`: Additional CSS classes

**Animation:**
- 4 blocks arranged in 2x2 grid
- Each block expands/contracts sequentially
- Smooth flex-based animation

### 3. API Endpoints

#### POST `/api/feedback/create`

**Request:**
```typescript
{
  booking_id: string;
  rating: number; // 1-5
  comment?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  feedback: {
    id: string;
    booking_id: string;
    rating: number;
    comment: string;
    created_at: string;
  };
}
```

**Logic:**
1. Validate user authentication
2. Verify booking belongs to user
3. Check booking status is 'confirmed' or 'completed'
4. Validate rating (1-5)
5. Insert feedback record
6. Return feedback data

#### GET `/api/feedback/list`

**Query Params:**
- `booking_id`: Filter by booking ID

**Response:**
```typescript
{
  success: boolean;
  feedback: Array<{
    id: string;
    booking_id: string;
    rating: number;
    comment: string;
    created_at: string;
    booking: {
      booking_reference: string;
      guest_name: string;
      exhibitions?: { name: string };
      shows?: { name: string };
    };
  }>;
}
```

#### GET `/api/cart/bookings`

**Response:**
```typescript
{
  success: boolean;
  pending: Array<CartItem>;
  confirmed: Array<Booking>;
}
```

**Logic:**
1. Fetch cart_items for user (pending)
2. Fetch bookings with status='confirmed' for user
3. Join with exhibitions/shows for event names
4. Return both arrays

#### GET `/api/admin/feedbacks`

**Query Params:**
- `rating`: Filter by rating
- `from_date`: Filter by date range
- `to_date`: Filter by date range
- `event_type`: Filter by exhibition/show
- `page`: Pagination
- `limit`: Items per page

**Response:**
```typescript
{
  success: boolean;
  feedbacks: Array<{
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    booking: {
      booking_reference: string;
      guest_name: string;
      guest_email: string;
      booking_date: string;
    };
    event: {
      name: string;
      type: 'exhibition' | 'show';
    };
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
```

### 4. Admin Panel Component

#### Feedbacks Section (`app/admin/feedbacks/page.tsx`)

**Structure:**
```tsx
<AdminFeedbacksPage>
  <PageHeader title="Customer Feedbacks" />
  
  <FiltersBar>
    <RatingFilter />
    <DateRangeFilter />
    <EventTypeFilter />
    <SearchInput placeholder="Search by booking reference..." />
  </FiltersBar>
  
  <FeedbacksTable>
    <TableHeader>
      <Column>Date</Column>
      <Column>Booking Ref</Column>
      <Column>Customer</Column>
      <Column>Event</Column>
      <Column>Rating</Column>
      <Column>Comment</Column>
      <Column>Actions</Column>
    </TableHeader>
    <TableBody>
      {feedbacks.map(feedback => (
        <FeedbackRow feedback={feedback} />
      ))}
    </TableBody>
  </FeedbacksTable>
  
  <Pagination />
</AdminFeedbacksPage>
```

## Data Models

### Feedback Model

```typescript
interface Feedback {
  id: string;
  booking_id: string;
  user_id: string | null;
  rating: number; // 1-5
  comment: string | null;
  created_at: string;
  updated_at: string;
}
```

### Enhanced Booking Model

```typescript
interface BookingWithFeedback extends Booking {
  feedback?: Feedback;
  has_feedback: boolean;
}
```

## Error Handling

### Feedback Submission Errors

1. **Duplicate Feedback**: Return 409 Conflict if feedback already exists for booking
2. **Invalid Booking**: Return 404 if booking not found or doesn't belong to user
3. **Invalid Rating**: Return 400 if rating not between 1-5
4. **Unauthorized**: Return 401 if user not authenticated

### Cart Page Errors

1. **Fetch Failure**: Display error toast and retry button
2. **Delete Failure**: Display error message and keep item in list
3. **Empty State**: Show friendly message with CTA to browse exhibitions

## UI/UX Design

### Hover Effects

**Global Button Hover Style:**
```css
.btn-hover {
  transition: all 0.2s ease-in-out;
}

.btn-hover:hover {
  background-color: #000000;
  color: #ffffff;
  border-color: #000000;
}
```

**Implementation:**
- Update `tailwind.config.ts` with custom hover utilities
- Apply to all Button components via className
- Remove existing purple hover effects

### Block Loader Styling

**Color Scheme:**
- Block Color: `bg-primary` (museum brand color)
- Border Color: `border-primary`
- Size: 75px per block
- Gap: 4px between blocks
- Speed: 1.2s animation duration

**Usage Locations:**
1. Calendar loading state in book-visit section
2. Time slots loading state
3. Cart page initial load
4. Feedback submission

## Testing Strategy

### Unit Tests

1. **Feedback API Tests**
   - Test feedback creation with valid data
   - Test duplicate feedback prevention
   - Test rating validation
   - Test unauthorized access

2. **Component Tests**
   - Test cart page rendering with pending/confirmed bookings
   - Test feedback dialog form validation
   - Test block loader animation
   - Test hover effects

### Integration Tests

1. **Feedback Flow**
   - User submits feedback → saves to database → appears in admin panel
   - User cannot submit duplicate feedback
   - Feedback displays correctly on cart page

2. **Cart Sections**
   - Pending bookings show delete option
   - Confirmed bookings show feedback option
   - Bookings move from pending to confirmed after payment

### E2E Tests

1. Complete booking flow → provide feedback → verify in admin panel
2. Delete pending booking from cart
3. View confirmed booking details
4. Filter feedbacks in admin panel

## Performance Considerations

1. **Pagination**: Implement pagination for confirmed bookings (10 per page)
2. **Lazy Loading**: Load feedback data only when feedback button clicked
3. **Caching**: Cache feedback status to avoid repeated queries
4. **Optimistic Updates**: Show feedback immediately after submission
5. **Real-time Sync**: Use Supabase real-time for admin panel updates

## Security Considerations

1. **Authorization**: Verify user owns booking before allowing feedback
2. **Rate Limiting**: Limit feedback submissions to prevent spam
3. **Input Sanitization**: Sanitize comment text to prevent XSS
4. **RLS Policies**: Implement Row Level Security for feedback table
5. **Admin Access**: Verify admin role before showing feedbacks section

## Accessibility

1. **Keyboard Navigation**: All interactive elements keyboard accessible
2. **Screen Readers**: Proper ARIA labels for feedback form and ratings
3. **Focus Management**: Trap focus in feedback dialog
4. **Color Contrast**: Ensure black hover effect meets WCAG AA standards
5. **Loading States**: Announce loading states to screen readers
