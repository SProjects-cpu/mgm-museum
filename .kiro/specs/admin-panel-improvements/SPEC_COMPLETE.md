# Admin Panel Improvements - Spec Complete ✅

**Created:** November 9, 2025  
**Status:** Ready for Implementation

---

## Spec Overview

This spec addresses 6 critical admin panel issues for the MGM Museum Booking System:

1. ✅ **Exhibition Image Upload** - Fix drag-and-drop upload with Supabase Storage
2. ✅ **Bookings Management** - Implement full-featured bookings page with filters
3. ✅ **Excel Export** - Add report generation for filtered bookings
4. ✅ **Analytics PDF Export** - Fix PDF generation with accurate data
5. ✅ **Admin Settings** - Implement functional settings pages
6. ✅ **Admin Credentials** - Add secure credential management with email verification

---

## Spec Documents

### 📋 Requirements Document
**File:** `requirements.md`  
**Content:**
- 6 main requirements with EARS-compliant acceptance criteria
- Glossary of technical terms
- Constraints and non-functional requirements
- Success criteria and out-of-scope items

**Key Requirements:**
- Requirement 1: Fix Exhibition Image Upload (5 acceptance criteria)
- Requirement 2: Implement Bookings Management Page (7 acceptance criteria)
- Requirement 3: Implement Excel Report Generation (7 acceptance criteria)
- Requirement 4: Fix Analytics PDF Export (7 acceptance criteria)
- Requirement 5: Implement Admin Settings Pages (5 acceptance criteria)
- Requirement 6: Implement Admin Credential Management (8 acceptance criteria)

### 🎨 Design Document
**File:** `design.md`  
**Content:**
- Complete system architecture with 3-tier diagram
- 6 detailed component designs with interfaces
- API contracts for all endpoints
- Database schemas with RLS policies
- Error handling strategies
- Security considerations
- Performance optimizations
- Deployment checklist

**Key Components:**
- ImageUploadZone (drag-and-drop with validation)
- BookingsManagement (filters, pagination, sorting)
- ExportButton (Excel generation with ExcelJS)
- AnalyticsPDFExport (PDF generation with jsPDF)
- SettingsManager (database-backed configuration)
- AccountSettings (email verification flow)

**New Database Tables:**
- `system_settings` - Store configuration values
- `email_verification_tokens` - Manage credential changes

**New API Endpoints:**
- `/api/admin/upload` - Image upload (fixed)
- `/api/admin/bookings` - Bookings management
- `/api/admin/export/bookings` - Excel export
- `/api/admin/export/analytics` - PDF export
- `/api/admin/settings` - Settings CRUD
- `/api/admin/account/request-change` - Credential change request
- `/api/admin/account/verify-change` - Email verification

### ✅ Tasks Document
**File:** `tasks.md`  
**Content:**
- 36 implementation tasks organized into 7 sections
- Each task includes requirements references
- Sequential task ordering within sections
- Estimated 3-4 weeks for complete implementation

**Task Breakdown:**
1. Fix Exhibition Image Upload - 4 tasks
2. Implement Bookings Management - 3 tasks
3. Implement Excel Export - 3 tasks
4. Fix Analytics PDF Export - 3 tasks
5. Implement Admin Settings - 5 tasks
6. Implement Credential Management - 6 tasks
7. Testing and Deployment - 3 tasks

**All tasks are required** (comprehensive implementation approach)

---

## Technology Stack

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS v4
- react-dropzone (drag-and-drop)
- ExcelJS (Excel generation)
- jsPDF + jspdf-autotable (PDF generation)

### Backend
- Next.js API Routes
- Supabase (PostgreSQL 15)
- Supabase Storage (image hosting)
- Resend API (email verification)

### Libraries Already in package.json
- ✅ ExcelJS (4.4.0)
- ✅ jsPDF (3.0.3)
- ✅ jspdf-autotable (5.0.2)
- ✅ Razorpay (2.9.6)
- ✅ Resend (6.4.1)

---

## Key Features

### 1. Image Upload
- Drag-and-drop interface
- File validation (type, size)
- Upload progress indicator
- Preview and delete functionality
- Supabase Storage integration
- RLS policies for security

### 2. Bookings Management
- 12-column data display
- Date filters: Today, Tomorrow, Last Week, Last Month, Custom
- Status filtering
- Search functionality
- Pagination (50 per page)
- Column sorting
- Responsive table design

### 3. Excel Export
- All 12 columns with proper formatting
- Date format: YYYY-MM-DD
- Currency format: ₹XX,XXX.XX
- Styled header row
- Auto-filter enabled
- Filename: MGM_Bookings_[dates].xlsx

### 4. Analytics PDF
- Summary statistics table
- Top exhibitions table
- Revenue by date table
- Bookings by date table
- MGM Museum branding
- Professional formatting
- Filename: MGM_Analytics_Report_[date].pdf

### 5. Admin Settings
- General settings (museum info)
- Opening hours configuration
- Booking policies
- System settings (maintenance mode)
- Payment gateway configuration
- Email template management
- Database-backed persistence

### 6. Credential Management
- Email change with verification
- Password change with validation
- Current password verification
- 24-hour verification link expiry
- Resend API integration
- Secure token generation
- Supabase Auth integration

---

## Security Measures

1. **Authentication:** All endpoints verify admin/super_admin role
2. **File Upload:** Validate type, size, sanitize filenames
3. **SQL Injection:** Parameterized queries only
4. **XSS Prevention:** Sanitize all user inputs
5. **CSRF Protection:** Next.js built-in tokens
6. **Rate Limiting:** On sensitive endpoints
7. **Email Verification:** Cryptographically secure tokens
8. **Password Policy:** 8+ chars, uppercase, lowercase, number

---

## Performance Targets

- Bookings page load: < 2 seconds (1000 bookings)
- Excel export: < 5 seconds (5000 bookings)
- PDF generation: < 3 seconds
- Image upload: < 10 seconds (5MB file)

---

## Implementation Approach

### Phase 1: Database & Storage Setup (Week 1)
- Create Supabase Storage buckets
- Apply RLS policies
- Run database migrations
- Test infrastructure

### Phase 2: Core Features (Week 2)
- Fix image upload
- Implement bookings management
- Add Excel export
- Fix analytics PDF

### Phase 3: Settings & Account (Week 3)
- Implement admin settings
- Add credential management
- Configure email verification

### Phase 4: Testing & Deployment (Week 4)
- Comprehensive testing
- Bug fixes
- Production deployment
- Documentation

---

## Next Steps

To begin implementation:

1. **Open the tasks file:**
   ```
   mgm-museum/.kiro/specs/admin-panel-improvements/tasks.md
   ```

2. **Start with Task 1.1:**
   - Create Supabase Storage buckets
   - Configure RLS policies

3. **Work sequentially through each section**

4. **Mark tasks complete as you finish them**

5. **Test thoroughly before moving to next section**

---

## Resources

### Resend API Key (Provided)
```
re_ZwMhju8q_FBigRbGgpHV3WtsReJbGJ8eE
```

### Documentation Links
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [ExcelJS](https://github.com/exceljs/exceljs)
- [jsPDF](https://github.com/parallax/jsPDF)
- [Resend](https://resend.com/docs)
- [react-dropzone](https://react-dropzone.js.org/)

### Existing Code References
- Upload API: `app/api/admin/upload/route.ts`
- Settings Page: `app/admin/settings/page.tsx`
- Analytics Dashboard: `app/admin/analytics/analytics-dashboard.tsx`
- Exhibition Management: `app/admin/exhibitions/[id]/page.tsx`

---

## Success Criteria

✅ Admin can upload exhibition images without errors  
✅ Admin can view all bookings without 404 errors  
✅ Admin can filter bookings by date ranges  
✅ Admin can export filtered bookings to Excel  
✅ Admin can export analytics to accurate PDF  
✅ Admin can configure system settings  
✅ Admin can change credentials with email verification  
✅ All features work in production on Vercel

---

**Spec Status:** ✅ COMPLETE - Ready for Implementation

**Estimated Completion:** 3-4 weeks  
**Total Tasks:** 36 tasks  
**Complexity:** Medium-High

You can now begin implementing tasks by opening the tasks.md file and clicking "Start task" next to task items in your IDE.
