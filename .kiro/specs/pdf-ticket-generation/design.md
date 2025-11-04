# Design Document

## Overview

The PDF Ticket Generation system will provide immediate, professional ticket generation upon successful payment verification. The system integrates seamlessly with the existing Razorpay payment flow, utilizing the `@react-pdf/renderer` library for server-side PDF generation and the `qrcode` library for QR code creation. The design prioritizes real-time user experience, ensuring tickets are available within 3 seconds of payment confirmation.

### Key Design Principles

1. **Real-time Generation**: PDF tickets generated on-demand, not pre-stored
2. **Data Integrity**: Use actual Razorpay payment IDs from verification response
3. **Seamless Integration**: Minimal changes to existing payment verification flow
4. **Professional Presentation**: Museum-branded, print-ready PDF format
5. **Error Resilience**: Graceful degradation if PDF generation fails

## Architecture

### System Flow

```
Payment Verification Success
    ↓
Update Payment Order Status
    ↓
Create Booking Records (existing)
    ↓
Create Ticket Records (existing)
    ↓
Clear Cart Items (existing)
    ↓
Redirect to Confirmation Page
    ↓
Fetch Booking + Ticket Data
    ↓
Display Ticket Preview
    ↓
User Clicks "Download Ticket"
    ↓
API Generates PDF On-Demand
    ↓
Browser Downloads PDF File
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Confirmation Page (Client)                │
│  - Displays booking details                                  │
│  - Shows Razorpay Payment ID                                 │
│  - Provides "Download Ticket" button per booking             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓ (HTTP GET Request)
┌─────────────────────────────────────────────────────────────┐
│              /api/tickets/generate/[bookingId]               │
│  - Validates user authentication                             │
│  - Fetches booking with related data                         │
│  - Generates QR code                                         │
│  - Renders PDF using @react-pdf/renderer                     │
│  - Returns PDF as downloadable file                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓ (Database Queries)
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Database                       │
│  Tables: bookings, tickets, exhibitions, shows, time_slots   │
│  payment_orders (for cart_snapshot with pricing tiers)       │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. PDF Generation API Route

**File**: `app/api/tickets/generate/[bookingId]/route.ts`

**Purpose**: Server-side API endpoint that generates and returns PDF tickets

**Interface**:
```typescript
// GET /api/tickets/generate/[bookingId]
// Headers: Authorization: Bearer <user_token>
// Response: application/pdf (binary stream)

interface BookingData {
  id: string;
  booking_reference: string;
  booking_date: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  total_amount: number;
  payment_id: string; // Razorpay payment ID
  payment_order_id: string;
  exhibition_id?: string;
  show_id?: string;
  time_slot_id: string;
  exhibitions?: {
    title: string;
    description: string;
  };
  shows?: {
    title: string;
    description: string;
  };
  time_slots: {
    start_time: string;
    end_time: string;
    slot_date: string;
  };
  tickets: {
    ticket_number: string;
    qr_code: string;
  }[];
}
```

**Responsibilities**:
- Authenticate user via JWT token
- Fetch booking data with joins (exhibitions/shows, time_slots, tickets)
- Fetch cart_snapshot from payment_orders for pricing tier details
- Generate QR code image as base64 data URL
- Render PDF using TicketPDFDocument component
- Set appropriate headers for PDF download
- Handle errors gracefully with proper HTTP status codes

### 2. PDF Document Component

**File**: `components/tickets/TicketPDFDocument.tsx`

**Purpose**: React component using @react-pdf/renderer to define PDF structure

**Interface**:
```typescript
interface TicketPDFProps {
  booking: BookingData;
  qrCodeDataUrl: string;
  museumLogo?: string; // Base64 or URL
}

export const TicketPDFDocument: React.FC<TicketPDFProps>
```

**Structure**:
```
┌─────────────────────────────────────────┐
│  MGM Museum Logo        TICKET          │
├─────────────────────────────────────────┤
│                                         │
│  Booking Reference: MGM-20250105-XXXX   │
│  Payment ID: pay_XXXXXXXXXXXXX          │
│                                         │
│  ┌─────────────┐                        │
│  │             │  Exhibition/Show Name  │
│  │  QR CODE    │  Date: Jan 5, 2025     │
│  │             │  Time: 10:00 AM        │
│  └─────────────┘                        │
│                                         │
│  Guest Details:                         │
│  Name: John Doe                         │
│  Email: john@example.com                │
│  Phone: +91 9876543210                  │
│                                         │
│  Ticket Details:                        │
│  Ticket Number: TKT1234567890ABCD       │
│  Quantity: 2 Adults                     │
│  Amount Paid: ₹500.00                   │
│                                         │
├─────────────────────────────────────────┤
│  MGM Museum                             │
│  Address | Phone | Email                │
│  www.mgmmuseum.com                      │
└─────────────────────────────────────────┘
```

**Styling**:
- Use museum brand colors (primary: #1a1a1a, accent: #d4af37)
- Professional typography with clear hierarchy
- Adequate spacing for print readability
- QR code size: 150x150 pixels minimum

### 3. QR Code Generation Utility

**File**: `lib/tickets/qr-generator.ts`

**Purpose**: Generate QR code as base64 data URL for embedding in PDF

**Interface**:
```typescript
export async function generateQRCode(
  data: string,
  options?: {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }
): Promise<string>
```

**Implementation**:
```typescript
import QRCode from 'qrcode';

export async function generateQRCode(
  data: string,
  options = {
    width: 200,
    margin: 2,
    errorCorrectionLevel: 'M' as const
  }
): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(data, options);
    return dataUrl;
  } catch (error) {
    console.error('QR code generation failed:', error);
    throw new Error('Failed to generate QR code');
  }
}
```

### 4. Updated Confirmation Page

**File**: `app/(public)/bookings/confirmation/page.tsx`

**Enhancements**:
- Display Razorpay Payment ID for each booking
- Add "Download Ticket" button for each booking
- Show ticket preview with all details
- Handle download errors gracefully
- Add loading state during PDF generation

**New Functions**:
```typescript
const handleDownloadTicket = async (bookingId: string, bookingRef: string) => {
  setDownloading(bookingId);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`/api/tickets/generate/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) throw new Error('Failed to generate ticket');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MGM-Ticket-${bookingRef}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download failed:', error);
    toast.error('Failed to download ticket');
  } finally {
    setDownloading(null);
  }
};
```

### 5. Ticket Data Fetcher Utility

**File**: `lib/tickets/fetch-ticket-data.ts`

**Purpose**: Centralized function to fetch complete booking data for PDF generation

**Interface**:
```typescript
export async function fetchTicketData(
  bookingId: string,
  supabaseClient: SupabaseClient
): Promise<BookingData>
```

**Implementation**:
- Single query with joins to minimize database calls
- Fetch exhibitions OR shows (one will be null)
- Include time_slots for date/time information
- Include tickets array for ticket numbers and QR codes
- Fetch payment_orders.cart_snapshot for pricing tier details

## Data Models

### Database Schema (Existing)

```sql
-- bookings table (existing)
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  booking_reference TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  time_slot_id UUID REFERENCES time_slots(id),
  exhibition_id UUID REFERENCES exhibitions(id),
  show_id UUID REFERENCES shows(id),
  booking_date DATE NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'confirmed',
  payment_status TEXT DEFAULT 'pending',
  payment_order_id TEXT, -- Razorpay order ID
  payment_id TEXT, -- Razorpay payment ID (CRITICAL)
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- tickets table (existing)
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  ticket_number TEXT NOT NULL UNIQUE,
  qr_code TEXT NOT NULL, -- Contains booking_reference
  pdf_url TEXT, -- NULL (not storing PDFs)
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- payment_orders table (existing)
CREATE TABLE payment_orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  razorpay_order_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'created',
  payment_id TEXT, -- Razorpay payment ID
  payment_signature TEXT,
  cart_snapshot JSONB NOT NULL, -- Contains pricing tier info
  payment_email TEXT,
  payment_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Cart Snapshot Structure

```typescript
interface CartSnapshot {
  items: Array<{
    timeSlotId: string;
    exhibitionId?: string;
    showId?: string;
    bookingDate: string;
    pricingTier: {
      id: string;
      name: string; // e.g., "Adult", "Child", "Senior"
      price: number;
    };
    quantity: number;
    subtotal: number;
  }>;
  total: number;
}
```

## Error Handling

### Error Scenarios and Responses

1. **Unauthenticated Request**
   - Status: 401 Unauthorized
   - Response: JSON error message
   - User Action: Redirect to login

2. **Booking Not Found**
   - Status: 404 Not Found
   - Response: JSON error message
   - User Action: Show error toast, stay on confirmation page

3. **Booking Belongs to Different User**
   - Status: 403 Forbidden
   - Response: JSON error message
   - User Action: Show error toast

4. **QR Code Generation Failure**
   - Status: 500 Internal Server Error
   - Fallback: Generate PDF without QR code
   - Log: Error details for debugging

5. **PDF Rendering Failure**
   - Status: 500 Internal Server Error
   - Response: JSON error message
   - User Action: Show error toast with retry option
   - Fallback: Display booking details without PDF download

6. **Missing Razorpay Payment ID**
   - Status: 500 Internal Server Error
   - Response: "Payment ID not available"
   - User Action: Contact support message
   - Prevention: Ensure payment_id is always saved during verification

### Error Logging

```typescript
// Structured error logging
console.error('PDF Generation Error:', {
  bookingId,
  userId,
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
});
```

## Testing Strategy

### Unit Tests

1. **QR Code Generation**
   - Test valid booking reference input
   - Test error handling for invalid input
   - Verify data URL format output

2. **Ticket Data Fetcher**
   - Test successful data fetch with all joins
   - Test handling of missing exhibition/show
   - Test error handling for invalid booking ID

3. **PDF Document Component**
   - Test rendering with complete data
   - Test rendering with minimal data
   - Test handling of missing optional fields

### Integration Tests

1. **PDF Generation API**
   - Test authenticated request with valid booking ID
   - Test unauthenticated request (401 response)
   - Test invalid booking ID (404 response)
   - Test booking owned by different user (403 response)
   - Test PDF file download and content type headers

2. **Confirmation Page Download Flow**
   - Test download button click triggers API call
   - Test loading state during generation
   - Test successful download initiates file save
   - Test error handling displays toast message

### End-to-End Tests

1. **Complete Booking Flow**
   - Complete payment → Redirect to confirmation
   - Verify Razorpay Payment ID displayed
   - Click download button → PDF downloads
   - Open PDF → Verify all details present
   - Scan QR code → Verify booking reference

2. **Multiple Bookings**
   - Purchase multiple items in one transaction
   - Verify separate download buttons for each booking
   - Download all tickets → Verify unique content

### Manual Testing Checklist

- [ ] PDF displays museum logo correctly
- [ ] QR code is scannable with standard QR reader apps
- [ ] Razorpay Payment ID matches actual payment
- [ ] All booking details are accurate
- [ ] PDF prints correctly on A4/Letter paper
- [ ] Download works on Chrome, Firefox, Safari
- [ ] Mobile download works on iOS and Android
- [ ] Error messages are user-friendly
- [ ] Loading states provide feedback

## Performance Considerations

### PDF Generation Time

- Target: < 2 seconds for single ticket
- Optimization: Use efficient PDF rendering library (@react-pdf/renderer)
- Caching: No caching needed (on-demand generation is fast enough)

### Database Query Optimization

```sql
-- Single optimized query with all joins
SELECT 
  b.*,
  e.title as exhibition_title,
  e.description as exhibition_description,
  s.title as show_title,
  s.description as show_description,
  ts.start_time,
  ts.end_time,
  ts.slot_date,
  json_agg(
    json_build_object(
      'ticket_number', t.ticket_number,
      'qr_code', t.qr_code
    )
  ) as tickets
FROM bookings b
LEFT JOIN exhibitions e ON b.exhibition_id = e.id
LEFT JOIN shows s ON b.show_id = s.id
JOIN time_slots ts ON b.time_slot_id = ts.id
LEFT JOIN tickets t ON t.booking_id = b.id
WHERE b.id = $1 AND b.user_id = $2
GROUP BY b.id, e.id, s.id, ts.id;
```

### Memory Management

- Stream PDF directly to response (no file storage)
- Clean up QR code data URLs after PDF generation
- Limit concurrent PDF generations per user (rate limiting)

## Security Considerations

### Authentication and Authorization

- All API requests require valid JWT token
- Verify booking belongs to authenticated user
- Use RLS policies on database queries

### Data Validation

- Validate booking ID format (UUID)
- Sanitize user input before PDF rendering
- Verify Razorpay Payment ID format (pay_XXXXX)

### Rate Limiting

- Limit PDF generation to 10 requests per minute per user
- Prevent abuse of download endpoint

### Sensitive Data Handling

- Do not expose internal database IDs in PDF
- Mask partial payment details if needed
- Ensure HTTPS for all API calls

## Deployment Considerations

### Environment Variables

No new environment variables required. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Dependencies

Already installed:
- `@react-pdf/renderer`: ^4.3.1
- `qrcode`: ^1.5.4

### Build Configuration

- Ensure @react-pdf/renderer is included in server bundle
- No special webpack configuration needed for Next.js 15

### Monitoring

- Log PDF generation success/failure rates
- Monitor API response times
- Track download completion rates
- Alert on high error rates (> 5%)

## Future Enhancements

1. **Email Delivery**: Automatically email PDF ticket after booking
2. **Ticket Validation API**: Scan QR code to verify ticket at entrance
3. **Multi-language Support**: Generate tickets in user's preferred language
4. **Customizable Templates**: Allow admin to customize PDF design
5. **Batch Download**: Download all tickets from a single order as ZIP
6. **Ticket Resend**: Allow users to resend tickets from account dashboard
