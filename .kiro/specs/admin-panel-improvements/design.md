# Admin Panel Improvements - Design Document

## Overview

This document outlines the technical design for fixing and enhancing the MGM Museum Admin Panel. The design addresses six critical issues: image upload functionality, bookings management, Excel export, analytics PDF export, settings implementation, and admin credential management.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Panel (Frontend)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Exhibition  │  │   Bookings   │  │  Analytics   │     │
│  │  Management  │  │  Management  │  │  Dashboard   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐     │
│  │   Settings   │  │    Account   │  │   Reports    │     │
│  │   Manager    │  │  Management  │  │   Generator  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   /api/admin │  │  /api/admin  │  │  /api/admin  │     │
│  │   /upload    │  │  /bookings   │  │  /analytics  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐     │
│  │  /api/admin  │  │  /api/admin  │  │  /api/admin  │     │
│  │  /settings   │  │  /account    │  │  /export     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Supabase   │  │   Supabase   │  │    Resend    │     │
│  │   Storage    │  │   Database   │  │     Email    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Exhibition Image Upload

#### Component: ImageUploadZone
**Location:** `components/admin/image-upload-zone.tsx`

**Props:**
```typescript
interface ImageUploadZoneProps {
  exhibitionId: string;
  currentImages: string[];
  onUploadSuccess: (url: string) => void;
  onUploadError: (error: string) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}
```

**Features:**
- Drag-and-drop interface using `react-dropzone`
- File validation (type, size)
- Upload progress indicator
- Preview of uploaded images
- Delete uploaded images

#### API Endpoint: `/api/admin/upload`
**Method:** POST  
**Content-Type:** multipart/form-data

**Request:**
```typescript
FormData {
  file: File;
  bucket: 'exhibition-images' | 'show-images';
  entityId: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  url: string;
  path: string;
  message: string;
}
```

**Error Handling:**
- Invalid file type → 400 with clear message
- File too large → 400 with size limit
- Upload failure → 500 with retry option
- Network error → Display retry button

#### Supabase Storage Configuration
**Bucket:** `exhibition-images`  
**RLS Policy:**
```sql
-- Allow authenticated admins to upload
CREATE POLICY "Admins can upload exhibition images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exhibition-images' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow public read access
CREATE POLICY "Public can view exhibition images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'exhibition-images');
```

---

### 2. Bookings Management Page

#### Component: BookingsManagement
**Location:** `app/admin/bookings/page.tsx`

**State Management:**
```typescript
interface BookingsState {
  bookings: Booking[];
  loading: boolean;
  filters: BookingFilters;
  pagination: PaginationState;
  sorting: SortingState;
}

interface BookingFilters {
  dateRange: 'today' | 'tomorrow' | 'last_week' | 'last_month' | 'custom';
  customStartDate?: Date;
  customEndDate?: Date;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  searchQuery?: string;
}

interface Booking {
  id: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  bookingReference: string;
  ticketNumber: string;
  razorpayId: string;
  visitDate: string;
  visitTimeSlot: string;
  numberOfTickets: number;
  amountPaid: number;
  status: string;
  bookingTimestamp: string;
}
```

#### API Endpoint: `/api/admin/bookings`
**Method:** GET

**Query Parameters:**
```typescript
{
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
{
  bookings: Booking[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

#### Database Query
```sql
SELECT 
  b.id,
  COALESCE(b.guest_name, u.full_name) as visitor_name,
  COALESCE(b.guest_email, u.email) as visitor_email,
  COALESCE(b.guest_phone, u.phone) as visitor_phone,
  b.booking_reference,
  t.ticket_number,
  b.payment_details->>'razorpay_payment_id' as razorpay_id,
  b.booking_date as visit_date,
  ts.start_time || ' - ' || ts.end_time as visit_time_slot,
  (SELECT SUM(quantity) FROM booking_tickets WHERE booking_id = b.id) as number_of_tickets,
  b.total_amount as amount_paid,
  b.status,
  b.created_at as booking_timestamp
FROM bookings b
LEFT JOIN users u ON b.user_id = u.id
LEFT JOIN tickets t ON t.booking_id = b.id
LEFT JOIN time_slots ts ON b.time_slot_id = ts.id
WHERE 
  b.booking_date >= $1 
  AND b.booking_date <= $2
  AND ($3::text IS NULL OR b.status = $3)
  AND ($4::text IS NULL OR 
       b.booking_reference ILIKE $4 OR
       COALESCE(b.guest_name, u.full_name) ILIKE $4 OR
       COALESCE(b.guest_email, u.email) ILIKE $4)
ORDER BY b.created_at DESC
LIMIT $5 OFFSET $6;
```

---

### 3. Excel Report Generation

#### Component: ExportButton
**Location:** `components/admin/export-button.tsx`

**Props:**
```typescript
interface ExportButtonProps {
  bookings: Booking[];
  filters: BookingFilters;
  onExportStart: () => void;
  onExportComplete: () => void;
  onExportError: (error: string) => void;
}
```

#### API Endpoint: `/api/admin/export/bookings`
**Method:** POST

**Request:**
```typescript
{
  filters: BookingFilters;
  format: 'excel' | 'csv';
}
```

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="MGM_Bookings_[dates].xlsx"`

#### Excel Generation Logic
**Library:** ExcelJS

```typescript
import ExcelJS from 'exceljs';

async function generateBookingsExcel(bookings: Booking[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Bookings');

  // Define columns
  worksheet.columns = [
    { header: 'Visitor Name', key: 'visitorName', width: 25 },
    { header: 'Visitor Email', key: 'visitorEmail', width: 30 },
    { header: 'Visitor Phone Number', key: 'visitorPhone', width: 20 },
    { header: 'Booking Reference', key: 'bookingReference', width: 25 },
    { header: 'Ticket Number', key: 'ticketNumber', width: 25 },
    { header: 'Razorpay_Id', key: 'razorpayId', width: 30 },
    { header: 'Book-visit Date', key: 'visitDate', width: 15 },
    { header: 'Book Visit Time-slot', key: 'visitTimeSlot', width: 20 },
    { header: 'Number of Tickets Booked by visitor', key: 'numberOfTickets', width: 15 },
    { header: 'Amount Paid', key: 'amountPaid', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Booking Timestamp (YYYY-MM-DD)', key: 'bookingTimestamp', width: 25 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data rows
  bookings.forEach(booking => {
    worksheet.addRow({
      visitorName: booking.visitorName,
      visitorEmail: booking.visitorEmail,
      visitorPhone: booking.visitorPhone,
      bookingReference: booking.bookingReference,
      ticketNumber: booking.ticketNumber,
      razorpayId: booking.razorpayId,
      visitDate: format(new Date(booking.visitDate), 'yyyy-MM-dd'),
      visitTimeSlot: booking.visitTimeSlot,
      numberOfTickets: booking.numberOfTickets,
      amountPaid: `₹${booking.amountPaid.toFixed(2)}`,
      status: booking.status.toUpperCase(),
      bookingTimestamp: format(new Date(booking.bookingTimestamp), 'yyyy-MM-dd HH:mm:ss'),
    });
  });

  // Auto-filter
  worksheet.autoFilter = {
    from: 'A1',
    to: 'L1',
  };

  return workbook;
}
```

---

### 4. Analytics PDF Export

#### Component: AnalyticsPDFExport
**Location:** `components/admin/analytics-pdf-export.tsx`

**Props:**
```typescript
interface AnalyticsPDFExportProps {
  analyticsData: AnalyticsData;
  dateRange: { start: Date; end: Date };
}

interface AnalyticsData {
  revenue: {
    total: number;
    byDate: Array<{ date: string; amount: number }>;
  };
  bookings: {
    total: number;
    byStatus: Record<string, number>;
    byDate: Array<{ date: string; count: number }>;
  };
  visitors: {
    total: number;
    byExhibition: Array<{ name: string; count: number }>;
  };
  topExhibitions: Array<{
    name: string;
    bookings: number;
    revenue: number;
  }>;
}
```

#### API Endpoint: `/api/admin/export/analytics`
**Method:** POST

**Request:**
```typescript
{
  dateRange: {
    start: string;
    end: string;
  };
}
```

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="MGM_Analytics_Report_[date].pdf"`

#### PDF Generation Logic
**Library:** jsPDF + jspdf-autotable

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

async function generateAnalyticsPDF(data: AnalyticsData, dateRange: DateRange) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('MGM Museum Analytics Report', 14, 20);
  doc.setFontSize(12);
  doc.text(`Period: ${format(dateRange.start, 'MMM dd, yyyy')} - ${format(dateRange.end, 'MMM dd, yyyy')}`, 14, 28);
  
  // Summary Statistics
  doc.setFontSize(16);
  doc.text('Summary', 14, 40);
  
  autoTable(doc, {
    startY: 45,
    head: [['Metric', 'Value']],
    body: [
      ['Total Revenue', `₹${data.revenue.total.toLocaleString()}`],
      ['Total Bookings', data.bookings.total.toString()],
      ['Total Visitors', data.visitors.total.toString()],
    ],
  });
  
  // Top Exhibitions
  doc.setFontSize(16);
  doc.text('Top Exhibitions', 14, doc.lastAutoTable.finalY + 15);
  
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Exhibition', 'Bookings', 'Revenue']],
    body: data.topExhibitions.map(ex => [
      ex.name,
      ex.bookings.toString(),
      `₹${ex.revenue.toLocaleString()}`
    ]),
  });
  
  // Revenue Chart (as table)
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Revenue by Date', 14, 20);
  
  autoTable(doc, {
    startY: 25,
    head: [['Date', 'Revenue']],
    body: data.revenue.byDate.map(item => [
      format(new Date(item.date), 'MMM dd, yyyy'),
      `₹${item.amount.toLocaleString()}`
    ]),
  });
  
  return doc;
}
```

---

### 5. Admin Settings Implementation

#### Component: SettingsManager
**Location:** `app/admin/settings/page.tsx` (already exists, needs backend integration)

#### API Endpoint: `/api/admin/settings`
**Methods:** GET, PUT

**GET Response:**
```typescript
{
  general: {
    museumName: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
  };
  hours: {
    openingTime: string;
    closingTime: string;
    closedDay: string;
  };
  booking: {
    advanceBookingDays: number;
    cancellationWindowHours: number;
    serviceFeePercent: number;
    enableOnlineBooking: boolean;
    autoConfirmBookings: boolean;
    enableNotifications: boolean;
  };
  system: {
    maintenanceMode: boolean;
  };
}
```

**PUT Request:** Same structure as GET response

#### Database Schema
**New Table:** `system_settings`

```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  category TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_system_settings_key ON system_settings(key);

-- RLS Policy
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings"
ON system_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

---

### 6. Admin Credential Management

#### Component: AccountSettings
**Location:** `app/admin/settings/account/page.tsx`

**State:**
```typescript
interface AccountState {
  currentEmail: string;
  newEmail: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  verificationSent: boolean;
  verificationToken: string | null;
}
```

#### API Endpoints

**1. Request Credential Change**
**Endpoint:** `/api/admin/account/request-change`  
**Method:** POST

**Request:**
```typescript
{
  currentPassword: string;
  newEmail?: string;
  newPassword?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  verificationRequired: boolean;
}
```

**2. Verify Email Change**
**Endpoint:** `/api/admin/account/verify-change`  
**Method:** POST

**Request:**
```typescript
{
  token: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

#### Email Verification Flow

```typescript
// 1. Generate verification token
const token = crypto.randomBytes(32).toString('hex');
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

// 2. Store token in database
await supabase.from('email_verification_tokens').insert({
  user_id: userId,
  token,
  new_email: newEmail,
  expires_at: expiresAt,
});

// 3. Send verification email using Resend
const resend = new Resend('re_ZwMhju8q_FBigRbGgpHV3WtsReJbGJ8eE');

await resend.emails.send({
  from: 'MGM Science Centre <noreply@mgmapjscicentre.org>',
  to: newEmail,
  subject: 'Verify Your New Email Address',
  html: `
    <h1>Email Verification</h1>
    <p>Click the link below to verify your new email address:</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/account/verify?token=${token}">
      Verify Email
    </a>
    <p>This link expires in 24 hours.</p>
  `,
});

// 4. On verification, update Supabase Auth
const { error } = await supabase.auth.admin.updateUserById(userId, {
  email: newEmail,
});
```

#### Database Schema
**New Table:** `email_verification_tokens`

```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  new_email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_verification_tokens_user ON email_verification_tokens(user_id);
CREATE INDEX idx_verification_tokens_expires ON email_verification_tokens(expires_at);

-- RLS Policy
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tokens"
ON email_verification_tokens FOR SELECT
USING (user_id = auth.uid());
```

## Data Models

### Booking (Extended)
```typescript
interface BookingExtended extends Booking {
  exhibition?: {
    id: string;
    name: string;
    slug: string;
  };
  show?: {
    id: string;
    name: string;
    slug: string;
  };
  user?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
  tickets: Array<{
    id: string;
    ticket_number: string;
    qr_code: string;
    status: string;
  }>;
}
```

### SystemSetting
```typescript
interface SystemSetting {
  id: string;
  key: string;
  value: any;
  category: 'general' | 'hours' | 'booking' | 'system';
  updated_at: string;
  updated_by: string;
}
```

## Error Handling

### Upload Errors
```typescript
enum UploadError {
  INVALID_FILE_TYPE = 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
  FILE_TOO_LARGE = 'File size exceeds 5MB limit.',
  UPLOAD_FAILED = 'Failed to upload file. Please try again.',
  NETWORK_ERROR = 'Network error. Please check your connection.',
}
```

### Booking Errors
```typescript
enum BookingError {
  FETCH_FAILED = 'Failed to load bookings. Please refresh the page.',
  EXPORT_FAILED = 'Failed to generate report. Please try again.',
  INVALID_DATE_RANGE = 'Invalid date range selected.',
}
```

### Settings Errors
```typescript
enum SettingsError {
  SAVE_FAILED = 'Failed to save settings. Please try again.',
  INVALID_VALUE = 'Invalid value provided.',
  UNAUTHORIZED = 'You do not have permission to modify settings.',
}
```

### Account Errors
```typescript
enum AccountError {
  INVALID_PASSWORD = 'Current password is incorrect.',
  PASSWORD_MISMATCH = 'New passwords do not match.',
  WEAK_PASSWORD = 'Password must be at least 8 characters with uppercase, lowercase, and number.',
  EMAIL_IN_USE = 'Email address is already in use.',
  VERIFICATION_EXPIRED = 'Verification link has expired. Please request a new one.',
  VERIFICATION_FAILED = 'Email verification failed. Please try again.',
}
```

## Testing Strategy

### Unit Tests
- Image upload validation logic
- Excel generation functions
- PDF generation functions
- Date range filtering logic
- Password validation

### Integration Tests
- Upload API endpoint with Supabase Storage
- Bookings API with database queries
- Export APIs with file generation
- Settings API with database persistence
- Email verification flow with Resend

### E2E Tests
- Complete image upload flow
- Booking filtering and export
- Analytics PDF generation
- Settings save and load
- Credential change with email verification

## Security Considerations

1. **Authentication:** All admin endpoints verify user has admin/super_admin role
2. **File Upload:** Validate file type, size, and sanitize filenames
3. **SQL Injection:** Use parameterized queries for all database operations
4. **XSS Prevention:** Sanitize all user inputs before rendering
5. **CSRF Protection:** Use Next.js built-in CSRF tokens
6. **Rate Limiting:** Implement rate limiting on sensitive endpoints (credential change, export)
7. **Email Verification:** Use cryptographically secure tokens with expiration
8. **Password Requirements:** Enforce strong password policy

## Performance Optimization

1. **Pagination:** Load bookings in batches of 50
2. **Caching:** Cache settings in memory with 5-minute TTL
3. **Lazy Loading:** Load images on demand in exhibition management
4. **Streaming:** Stream large Excel/PDF files instead of loading in memory
5. **Database Indexes:** Add indexes on frequently queried columns
6. **CDN:** Serve uploaded images via Supabase CDN

## Deployment Checklist

- [ ] Create Supabase Storage buckets (exhibition-images, show-images)
- [ ] Apply RLS policies for storage buckets
- [ ] Run database migrations (system_settings, email_verification_tokens)
- [ ] Configure Resend API key in Vercel environment variables
- [ ] Test image upload in production
- [ ] Test bookings page with real data
- [ ] Test Excel export with large datasets
- [ ] Test analytics PDF generation
- [ ] Test settings persistence
- [ ] Test email verification flow
- [ ] Monitor error logs for first 48 hours

---

**Design Complete**

This design provides a comprehensive solution for all six admin panel issues with detailed technical specifications, database schemas, API contracts, and security considerations.
