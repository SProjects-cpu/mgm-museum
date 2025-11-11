# Design Document

## Overview

This design document provides comprehensive solutions for three critical issues in the MGM Museum application:
1. Email domain configuration for sending to all customers
2. Making pricing display editable through admin panel
3. Fixing date offset bug in booking confirmations and tickets

## Architecture

### High-Level Changes

```
┌─────────────────────────────────────────────────────────────┐
│                     Email System                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Update email configuration                         │  │
│  │ 2. Add domain verification documentation              │  │
│  │ 3. Implement graceful fallback for test mode          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Content Management System                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Add pricing_display section type                   │  │
│  │ 2. Update admin content manager UI                    │  │
│  │ 3. Update exhibition detail page to use CMS data      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Date Handling System                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Fix date storage to use date-only format           │  │
│  │ 2. Update date display logic across all components    │  │
│  │ 3. Ensure consistent date formatting                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Email Domain Configuration

#### Current State
```typescript
// lib/email/resend-client.ts
export const EMAIL_CONFIG = {
  from: 'MGM Museum <onboarding@resend.dev>', // Test domain - limited
  replyTo: 'shivampaliwal37@gmail.com',
};
```

#### Proposed Solution

**Option A: Verify Custom Domain (Recommended for Production)**
```typescript
// lib/email/resend-client.ts
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'MGM Museum <noreply@mgmmuseum.com>',
  replyTo: process.env.EMAIL_REPLY_TO || 'info@mgmmuseum.com',
  testMode: !process.env.EMAIL_FROM, // Auto-detect test mode
};
```

**Option B: Document Test Mode Limitation (Quick Fix)**
- Add clear documentation about Resend test mode
- Update error messages to be more informative
- Provide admin panel warning when in test mode

#### Domain Verification Steps Documentation
```markdown
# Email Domain Verification Guide

## Steps to Enable Production Email Sending

1. **Purchase/Own a Domain**
   - You need a domain (e.g., mgmmuseum.com)

2. **Verify Domain in Resend**
   - Go to https://resend.com/domains
   - Click "Add Domain"
   - Enter your domain name
   - Add the provided DNS records to your domain registrar

3. **Update Environment Variables**
   ```
   EMAIL_FROM=MGM Museum <noreply@mgmmuseum.com>
   EMAIL_REPLY_TO=info@mgmmuseum.com
   ```

4. **Test Email Sending**
   - Run: `npm run test:email`
   - Send test booking to verify

## Test Mode (Current State)
- Only sends to: shivampaliwal37@gmail.com
- Uses: onboarding@resend.dev
- Suitable for: Development and testing only
```

### 2. Pricing Display Content Management

#### Database Schema Extension

```sql
-- Add pricing_display section type to existing content_sections table
-- No migration needed - section_type is already flexible

-- Example content structure:
{
  "section_type": "pricing_display",
  "title": "Starting from",
  "content": "per person",
  "metadata": {
    "showPrice": true,
    "priceSource": "exhibition.pricing[0].price"
  }
}
```

#### Admin Panel UI Component

```typescript
// components/admin/exhibition-content-manager.tsx
interface PricingDisplaySection {
  section_type: 'pricing_display';
  title: string; // "Starting from"
  content: string; // "per person"
  metadata: {
    showPrice: boolean;
    priceSource: string;
  };
}

// Add to section type options
const SECTION_TYPES = [
  // ... existing types
  { value: 'pricing_display', label: 'Pricing Display' },
];
```

#### Exhibition Detail Page Update

```typescript
// app/exhibitions/[slug]/exhibition-detail-client.tsx

// Get pricing display content from CMS
const pricingDisplay = exhibition.contentSections?.find(
  (section: any) => section.section_type === 'pricing_display'
);

const pricingTitle = pricingDisplay?.title || 'Starting from';
const pricingFooter = pricingDisplay?.content || 'per person';
const showPrice = pricingDisplay?.metadata?.showPrice !== false;

// Render
<div className="text-center p-4 bg-primary/10 rounded-lg">
  <div className="text-sm text-muted-foreground mb-1">
    {pricingTitle}
  </div>
  {showPrice && (
    <div className="text-3xl font-bold text-primary">
      {formatCurrency(exhibition.pricing?.[0]?.price || 0)}
    </div>
  )}
  <div className="text-xs text-muted-foreground mt-1">
    {pricingFooter}
  </div>
</div>
```

### 3. Date Offset Bug Fix

#### Root Cause Analysis

The issue occurs due to timezone conversion when:
1. User selects date in local timezone (e.g., "2025-11-07")
2. JavaScript Date object converts to UTC
3. Database stores as timestamp with timezone
4. Display converts back, resulting in day shift

#### Solution: Date-Only Format

```typescript
// lib/utils/date-helpers.ts

/**
 * Format date as YYYY-MM-DD without timezone conversion
 */
export function formatDateOnly(date: Date | string): string {
  if (typeof date === 'string') {
    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    date = new Date(date);
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Parse date string without timezone conversion
 */
export function parseDateOnly(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format date for display (e.g., "Saturday, January 18, 2025")
 */
export function formatDateForDisplay(dateString: string): string {
  const date = parseDateOnly(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
```

#### Update Booking Flow

```typescript
// app/(public)/book-visit/page.tsx
// When user selects date
const handleDateSelect = (date: Date) => {
  const dateOnly = formatDateOnly(date); // "2025-11-07"
  setSelectedDate(dateOnly);
};

// app/cart/checkout/page.tsx
// When creating booking
const bookingData = {
  // ... other fields
  visit_date: selectedDate, // Already in YYYY-MM-DD format
};
```

#### Update Display Components

```typescript
// app/(public)/bookings/confirmation/page.tsx
// Display booking date
const displayDate = formatDateForDisplay(booking.visit_date);
// Output: "Thursday, November 7, 2025"

// lib/tickets/fetch-ticket-data.ts
// For PDF ticket
const ticketData = {
  // ... other fields
  visitDate: formatDateForDisplay(booking.visit_date),
};

// lib/email/send-booking-confirmation.ts
// For email
const emailData = {
  // ... other fields
  visitDate: formatDateForDisplay(booking.visit_date),
};
```

## Data Models

### Content Section for Pricing Display

```typescript
interface ContentSection {
  id: string;
  exhibition_id: string;
  section_type: 'pricing_display' | 'hero' | 'about' | 'highlights' | 'booking_widget';
  title: string;
  content: string;
  images?: string[];
  metadata?: {
    showPrice?: boolean;
    priceSource?: string;
    [key: string]: any;
  };
  order_index: number;
  created_at: string;
  updated_at: string;
}
```

### Date Storage Format

```typescript
// Database column type: DATE (not TIMESTAMP)
// Storage format: 'YYYY-MM-DD'
// Example: '2025-11-07'

interface Booking {
  id: string;
  visit_date: string; // 'YYYY-MM-DD' format
  // ... other fields
}

interface TimeSlot {
  id: string;
  slot_date: string; // 'YYYY-MM-DD' format
  // ... other fields
}
```

## Error Handling

### Email Sending Errors

```typescript
// Enhanced error handling with test mode detection
export async function sendBookingConfirmation(params: SendBookingConfirmationParams) {
  try {
    const { data, error } = await resend.emails.send({...});
    
    if (error) {
      // Check if it's a test mode restriction
      if (error.message?.includes('testing emails')) {
        console.warn('⚠️ Email sent in TEST MODE - recipient restricted');
        console.warn('To send to all customers, verify a domain at resend.com/domains');
        console.warn('See: EMAIL_SETUP.md for instructions');
        
        return {
          success: false,
          error: 'Email service in test mode. Contact administrator.',
          testMode: true,
        };
      }
      
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    // ... existing error handling
  }
}
```

### Date Validation

```typescript
// Validate date format before storage
export function validateDateOnly(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  
  const date = parseDateOnly(dateString);
  return !isNaN(date.getTime());
}

// Use in API routes
if (!validateDateOnly(visit_date)) {
  return NextResponse.json(
    { error: 'Invalid date format. Expected YYYY-MM-DD' },
    { status: 400 }
  );
}
```

## Testing Strategy

### Email Testing

1. **Test Mode Verification**
   ```bash
   # Test with current setup (test mode)
   npm run test:email -- --to=shivampaliwal37@gmail.com
   npm run test:email -- --to=other@example.com # Should show test mode warning
   ```

2. **Domain Verification Testing**
   ```bash
   # After domain verification
   EMAIL_FROM="MGM Museum <noreply@mgmmuseum.com>" npm run test:email -- --to=any@example.com
   ```

### Pricing Display Testing

1. **Admin Panel**
   - Create pricing_display section
   - Edit title, content, metadata
   - Save and verify in database

2. **Exhibition Page**
   - View exhibition with pricing_display section
   - Verify custom text displays correctly
   - Test fallback when section doesn't exist

### Date Handling Testing

1. **Booking Flow**
   ```typescript
   // Test case: Select Nov 7, 2025
   const selectedDate = '2025-11-07';
   
   // Verify in cart
   expect(cartItem.visit_date).toBe('2025-11-07');
   
   // Verify after checkout
   expect(booking.visit_date).toBe('2025-11-07');
   
   // Verify in confirmation
   expect(confirmationPage.displayDate).toContain('November 7, 2025');
   
   // Verify in PDF
   expect(pdfTicket.visitDate).toContain('November 7, 2025');
   
   // Verify in email
   expect(email.visitDate).toContain('November 7, 2025');
   ```

2. **Edge Cases**
   - Test date at month boundary (e.g., Jan 31 → Feb 1)
   - Test date at year boundary (e.g., Dec 31 → Jan 1)
   - Test with different timezones (user in different timezone)

## Implementation Priority

### Phase 1: Critical Fixes (Immediate)
1. **Date Offset Bug** - Highest priority, affects customer experience
   - Create date utility functions
   - Update booking flow
   - Update display components
   - Test thoroughly

### Phase 2: Content Management (High Priority)
2. **Pricing Display Editability**
   - Update admin panel UI
   - Update exhibition detail page
   - Test admin workflow

### Phase 3: Email Configuration (Medium Priority)
3. **Email Domain Setup**
   - Create documentation
   - Update email configuration
   - Add test mode warnings
   - Provide setup guide

## Deployment Considerations

### Environment Variables

```bash
# Required for production email
EMAIL_FROM=MGM Museum <noreply@mgmmuseum.com>
EMAIL_REPLY_TO=info@mgmmuseum.com

# Existing
RESEND_API_KEY=re_xxxxx
```

### Database Migrations

No new migrations required:
- `content_sections` table already supports flexible section types
- Date columns should remain as DATE type (not TIMESTAMP)

### Rollback Plan

1. **Date Fix**: If issues occur, revert to previous date handling
2. **Pricing Display**: Fallback to hardcoded values already implemented
3. **Email**: Test mode is safe fallback, no rollback needed

## Performance Considerations

- Date formatting functions are lightweight, no performance impact
- Content sections query already exists, no additional database load
- Email sending is async, doesn't block user experience
