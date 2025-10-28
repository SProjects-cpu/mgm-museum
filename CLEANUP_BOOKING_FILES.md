# Booking System Cleanup Script

## Files and Directories to Delete

### 1. Customer-Facing Booking Pages
```
app/(public)/book-visit/
app/(public)/bookings/
```

### 2. Booking Components
```
components/booking/
components/shared/booking-wizard.tsx
```

### 3. Admin Booking Management
```
app/admin/bookings/
components/admin-bookings-table.tsx
```

### 4. Booking API Endpoints
```
app/api/bookings/
app/api/admin/bookings/
app/api/email/booking-confirmation/
app/api/email/booking-cancellation/
app/api/email/booking-reminder/
app/api/admin/events/[id]/toggle-booking/
```

### 5. Booking Services and Utilities
```
lib/services/booking.service.ts
lib/store/bookings.ts
```

### 6. Booking Types and Interfaces
```
types/booking.ts
```

### 7. Email Templates (Booking-related)
```
emails/booking-confirmation.tsx
emails/booking-cancellation.tsx
emails/booking-reminder.tsx
```

### 8. Database Migrations (Booking-related)
```
supabase/migrations/20251025_booking_system.sql
supabase/migrations/00003_add_booking_enabled_to_events.sql
```

### 9. Documentation Files (Optional - Can Keep for Reference)
```
BOOKING_REDIRECTION_IMPLEMENTATION.md
BOOKING_INTEGRATION_ANALYSIS.md
BOOKING_SYSTEM_IMPLEMENTATION.md
Ticket_booking_Process.md
```

---

## PowerShell Deletion Commands

Run these commands from the project root (`c:/Test/mgm-museum/`):

```powershell
# Delete booking pages
Remove-Item -Path "app/(public)/book-visit" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "app/(public)/bookings" -Recurse -Force -ErrorAction SilentlyContinue

# Delete booking components
Remove-Item -Path "components/booking" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "components/shared/booking-wizard.tsx" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "components/admin-bookings-table.tsx" -Force -ErrorAction SilentlyContinue

# Delete admin booking pages
Remove-Item -Path "app/admin/bookings" -Recurse -Force -ErrorAction SilentlyContinue

# Delete booking API endpoints
Remove-Item -Path "app/api/bookings" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "app/api/admin/bookings" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "app/api/email/booking-confirmation" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "app/api/email/booking-cancellation" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "app/api/email/booking-reminder" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "app/api/admin/events" -Recurse -Force -Filter "*toggle-booking*" -ErrorAction SilentlyContinue

# Delete booking services
Remove-Item -Path "lib/services/booking.service.ts" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "lib/store/bookings.ts" -Force -ErrorAction SilentlyContinue

# Delete booking types
Remove-Item -Path "types/booking.ts" -Force -ErrorAction SilentlyContinue

# Delete email templates
Remove-Item -Path "emails/booking-confirmation.tsx" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "emails/booking-cancellation.tsx" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "emails/booking-reminder.tsx" -Force -ErrorAction SilentlyContinue

# Delete database migrations
Remove-Item -Path "supabase/migrations/20251025_booking_system.sql" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "supabase/migrations/00003_add_booking_enabled_to_events.sql" -Force -ErrorAction SilentlyContinue

# Delete documentation (optional)
Remove-Item -Path "BOOKING_REDIRECTION_IMPLEMENTATION.md" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "BOOKING_INTEGRATION_ANALYSIS.md" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "BOOKING_SYSTEM_IMPLEMENTATION.md" -Force -ErrorAction SilentlyContinue
```

---

## Alternative: Batch File for Windows

Create a file named `cleanup_booking.bat`:

```batch
@echo off
echo Cleaning up booking-related files...

rd /s /q "app\(public)\book-visit"
rd /s /q "app\(public)\bookings"
rd /s /q "components\booking"
del /f "components\shared\booking-wizard.tsx"
del /f "components\admin-bookings-table.tsx"
rd /s /q "app\admin\bookings"
rd /s /q "app\api\bookings"
rd /s /q "app\api\admin\bookings"
rd /s /q "app\api\email\booking-confirmation"
rd /s /q "app\api\email\booking-cancellation"
rd /s /q "app\api\email\booking-reminder"
del /f "lib\services\booking.service.ts"
del /f "lib\store\bookings.ts"
del /f "types\booking.ts"
del /f "emails\booking-confirmation.tsx"
del /f "emails\booking-cancellation.tsx"
del /f "emails\booking-reminder.tsx"
del /f "supabase\migrations\20251025_booking_system.sql"
del /f "supabase\migrations\00003_add_booking_enabled_to_events.sql"

echo Cleanup complete!
pause
```

---

## Verification After Deletion

After running the cleanup, verify that:
1. No booking-related imports remain in other files
2. No broken links to `/book-visit` or booking routes
3. Admin panel doesn't reference booking management
4. API routes don't reference booking endpoints
5. Database doesn't have orphaned booking tables
