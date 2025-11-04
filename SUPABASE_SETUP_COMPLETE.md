# Supabase Database Setup Complete

## Summary

Successfully created all Supabase tables and database functions using the Supabase MCP.

## Applied Migrations

1. **00001_initial_schema** - Core database schema with all base tables
2. **20251104_seat_locks_table** - Seat locking mechanism for booking flow
3. **20250102_exhibition_booking_system** - Exhibition schedules, slot availability, and dynamic pricing

## Created Tables

### Core Tables
- **users** - Extended user profiles (linked to auth.users)
- **exhibitions** - Main exhibitions and attractions
- **shows** - Planetarium and theatre shows
- **pricing** - Dynamic pricing for exhibitions and shows
- **time_slots** - Available time slots for bookings

### Booking System Tables
- **bookings** - Customer bookings
- **booking_tickets** - Individual tickets in a booking
- **seat_bookings** - Seat assignments for planetarium shows
- **seat_locks** - Temporary seat reservations (10-minute expiration)
- **exhibition_schedules** - Date-specific availability for exhibitions
- **slot_availability** - Real-time availability tracking
- **dynamic_pricing** - Date/time-specific pricing

### Supporting Tables
- **events** - Special events and workshops
- **event_registrations** - Event registrations
- **content_pages** - Dynamic CMS content
- **newsletter_subscribers** - Newsletter email list
- **contact_submissions** - Contact form submissions
- **analytics_events** - User activity tracking

## Database Functions

### get_available_slots_for_exhibition(p_exhibition_id, p_date)
Returns available time slots for an exhibition on a specific date with:
- Slot ID, start time, end time
- Total capacity and available capacity
- Current booked count

### generate_booking_reference()
Automatically generates unique booking references in format: `MGM-YYYYMMDD-XXXXXX`

### update_updated_at_column()
Trigger function that automatically updates the `updated_at` timestamp on record updates

## Row Level Security (RLS)

RLS is enabled on the `seat_locks` table with policies:
- Anyone can create seat locks (for booking flow)
- Users can view their own locks
- Admins can manage all locks

Note: RLS is currently disabled on other tables but can be enabled as needed.

## Next Steps

1. **Add Seed Data** - Run the seed data migration to populate exhibitions, shows, and pricing
2. **Configure Environment Variables** - Ensure your Next.js app has the correct Supabase credentials
3. **Test API Endpoints** - Verify that all booking API endpoints work with the new schema
4. **Deploy to Vercel** - Deploy the application with the updated database connection

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Connection

The application uses the Supabase client configured in `lib/supabase/config.ts` which provides:
- `getServiceSupabase()` - Server-side client with service role
- `createClient()` - Client-side Supabase client

All database queries in the booking system use these clients to interact with the tables.
