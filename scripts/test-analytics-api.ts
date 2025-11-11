import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testAnalyticsAPI() {
  console.log('🔍 Testing Analytics API...\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Test 1: Check if user is authenticated
  console.log('1. Checking authentication...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.log('❌ Not authenticated');
    console.log('Please log in to the admin panel first');
    return;
  }
  
  console.log('✅ Authenticated as:', user.email);

  // Test 2: Check user role
  console.log('\n2. Checking user role...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.log('❌ Error fetching profile:', profileError.message);
    return;
  }

  console.log('✅ User role:', profile?.role || 'No role set');

  if (profile?.role !== 'admin') {
    console.log('❌ User is not an admin');
    return;
  }

  // Test 3: Test analytics API
  console.log('\n3. Testing analytics API...');
  const endDate = new Date();
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.log('❌ API Error:', response.status, error);
      return;
    }

    const data = await response.json();
    console.log('✅ Analytics data received:');
    console.log('   - Total Revenue:', data.revenue?.total || 0);
    console.log('   - Total Bookings:', data.bookings?.total || 0);
    console.log('   - Total Visitors:', data.visitors?.total || 0);
  } catch (error) {
    console.log('❌ Fetch error:', error);
  }

  // Test 4: Check bookings data
  console.log('\n4. Checking bookings data...');
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, total_amount, status, payment_status')
    .eq('payment_status', 'paid')
    .limit(5);

  if (bookingsError) {
    console.log('❌ Error fetching bookings:', bookingsError.message);
  } else {
    console.log(`✅ Found ${bookings?.length || 0} paid bookings`);
    if (bookings && bookings.length > 0) {
      console.log('   Sample booking:', bookings[0]);
    }
  }

  console.log('\n✅ Diagnostic complete!');
}

testAnalyticsAPI().catch(console.error);
