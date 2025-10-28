# 🚀 Quick Setup Instructions

## Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works fine)
- Git

## Step-by-Step Setup

### 1. Clone and Install Dependencies

```bash
cd mgm-museum
npm install
```

### 2. Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and API keys from Settings → API
3. Create `.env.local` in the `mgm-museum` folder:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ENABLE_REALTIME=true
```

### 3. Run Database Migrations

1. Go to your Supabase Dashboard → SQL Editor
2. Run the migration files from `supabase/migrations/` in order:
   - `00001_initial_schema.sql`
   - `00002_seed_data.sql`
   - `00003_enable_realtime.sql` (if exists)

3. Enable real-time for tables:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE exhibitions;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE pricing;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
```

### 4. Start Development Server

```bash
npm run dev
```

Open:
- Customer Site: http://localhost:3000
- Admin Panel: http://localhost:3000/admin

## Testing Real-Time Sync

### Quick Test
1. Open http://localhost:3000/exhibitions in one tab
2. Open http://localhost:3000/admin/exhibitions in another tab
3. Make changes in admin panel
4. Watch changes appear instantly in customer site!

## Common Issues

### "Missing Supabase credentials"
- Make sure `.env.local` is created with valid keys
- Restart dev server after creating `.env.local`

### "Failed to fetch exhibitions"
- Check Supabase dashboard is accessible
- Verify database tables exist
- Check API keys are correct

### Real-time not working
- Enable real-time in Supabase Dashboard → Database → Replication
- Run the ALTER PUBLICATION commands above

## Need Help?

1. Check `TROUBLESHOOTING_GUIDE.md` for detailed solutions
2. Check `REALTIME_SYNC_IMPLEMENTATION.md` for architecture details
3. Check browser console for error messages

## What's Working

✅ Real-time synchronization between admin and customer site
✅ API routes for all operations
✅ Booking system with PDF tickets
✅ Email notifications
✅ Admin dashboard with live updates
✅ Responsive design for all devices

**Ready to showcase!** 🎉

