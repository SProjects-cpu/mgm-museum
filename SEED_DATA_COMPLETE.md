# Seed Data Successfully Added

## Summary

Successfully populated the Supabase database with initial seed data for the MGM Museum booking system.

## Data Added

### Exhibitions (8 total)
1. **Full Dome Digital Planetarium** (Featured)
   - Category: Planetarium
   - Capacity: 100
   - Duration: 45 minutes
   - 5 time slots daily

2. **Aditya Solar Observatory** (Featured)
   - Category: Solar Observatory
   - Capacity: 25
   - Duration: 30 minutes

3. **Outdoor Science Park**
   - Category: Science Park
   - Capacity: 200
   - Duration: 60 minutes

4. **Astro Gallery & ISRO Exhibition** (Featured)
   - Category: Astro Gallery
   - Capacity: 150
   - Duration: 60 minutes

5. **3D Science Theatre** (Featured)
   - Category: 3D Theatre
   - Capacity: 120
   - Duration: 30 minutes
   - 4 time slots daily

6. **Mathematics Laboratory**
   - Category: Math Lab
   - Capacity: 50
   - Duration: 45 minutes

7. **Basic Physics Laboratory**
   - Category: Physics Lab
   - Capacity: 40
   - Duration: 45 minutes

8. **Holography Theatre** (Featured)
   - Category: Holography
   - Capacity: 80
   - Duration: 40 minutes
   - 4 time slots daily

### Pricing (25 entries)
Ticket types configured for all exhibitions:
- **Adult tickets**: ₹50 - ₹100
- **Child tickets**: ₹25 - ₹60
- **Student tickets**: ₹35 - ₹75
- **Senior tickets**: ₹80 (Planetarium only)

### Time Slots (13 entries)
- **Planetarium**: 5 daily slots (10:00 AM - 4:45 PM)
- **3D Theatre**: 4 daily slots (10:30 AM - 4:30 PM)
- **Holography Theatre**: 4 daily slots (11:30 AM - 5:40 PM)

### Events (3 upcoming)
1. **100 Hours of Astronomy** - 30 days from now
   - Stargazing and telescope observations
   - Max participants: 200

2. **National Science Day Celebration** - 150 days from now
   - All-day event across all galleries
   - Max participants: 500

3. **Robotics Workshop for Students** - 45 days from now
   - Ages 12-18
   - Max participants: 50

## Database Statistics

- **Exhibitions**: 8 active (5 featured)
- **Pricing entries**: 25
- **Time slots**: 13
- **Events**: 3 upcoming
- **Total capacity**: 765 visitors across all exhibitions

## Next Steps

1. **Test the Booking Flow**
   - Visit `/book-visit` to test the booking interface
   - Select an exhibition and time slot
   - Complete a test booking

2. **Verify API Endpoints**
   - `/api/exhibitions` - List all exhibitions
   - `/api/exhibitions/[id]/available-dates` - Check date availability
   - `/api/exhibitions/[id]/time-slots` - Get time slots for a date
   - `/api/exhibitions/[id]/ticket-types` - Get pricing

3. **Deploy to Vercel**
   - Ensure environment variables are set
   - Deploy the application
   - Test the live booking system

## Environment Variables Required

Make sure these are set in your Vercel project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Testing the Database

You can test the database by running queries:

```sql
-- Get all active exhibitions with pricing
SELECT e.name, e.capacity, p.ticket_type, p.price
FROM exhibitions e
JOIN pricing p ON p.exhibition_id = e.id
WHERE e.status = 'active'
ORDER BY e.display_order, p.ticket_type;

-- Get time slots for planetarium
SELECT ts.start_time, ts.end_time, ts.capacity
FROM time_slots ts
JOIN exhibitions e ON e.id = ts.exhibition_id
WHERE e.slug = 'full-dome-planetarium'
ORDER BY ts.start_time;

-- Check upcoming events
SELECT title, event_date, location, max_participants
FROM events
WHERE status = 'upcoming'
ORDER BY event_date;
```

The database is now fully populated and ready for booking operations!
