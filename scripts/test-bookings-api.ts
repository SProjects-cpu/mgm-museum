import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testBookingsAPI() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Testing bookings API query...\n');

  // Test the exact query the API uses
  const startDate = new Date('2020-01-01');
  const endDate = new Date('2030-12-31');

  const { data, error, count } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_reference,
      guest_name,
      guest_email,
      booking_date,
      status,
      created_at
    `, { count: 'exact' })
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total bookings found: ${count}`);
  console.log('\nRecent bookings:');
  data?.forEach((booking, index) => {
    console.log(`\n${index + 1}. ${booking.booking_reference}`);
    console.log(`   Guest: ${booking.guest_name}`);
    console.log(`   Email: ${booking.guest_email}`);
    console.log(`   Visit Date: ${booking.booking_date}`);
    console.log(`   Created: ${booking.created_at}`);
    console.log(`   Status: ${booking.status}`);
  });
}

testBookingsAPI().catch(console.error);
