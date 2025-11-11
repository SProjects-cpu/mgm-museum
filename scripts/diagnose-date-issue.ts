/**
 * Comprehensive Date Issue Diagnostic
 * Traces the entire date flow from cart to booking to display
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function diagnoseDateIssue() {
  console.log('🔍 Comprehensive Date Issue Diagnostic\n');
  console.log('='.repeat(70));

  // Step 1: Check recent booking with all date fields
  console.log('\n📋 Step 1: Checking Recent Booking Data\n');
  
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_reference,
      booking_date,
      booking_time,
      guest_name,
      time_slot_id,
      created_at,
      payment_order_id
    `)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (bookingError || !booking) {
    console.error('❌ Error fetching booking:', bookingError);
    return;
  }

  console.log('Booking Reference:', booking.booking_reference);
  console.log('Booking Date (raw from DB):', booking.booking_date);
  console.log('Booking Time:', booking.booking_time);
  console.log('Time Slot ID:', booking.time_slot_id);
  console.log('Created At:', booking.created_at);

  // Step 2: Check the time slot data
  console.log('\n' + '='.repeat(70));
  console.log('\n🕐 Step 2: Checking Time Slot Data\n');
  
  const { data: timeSlot, error: timeSlotError } = await supabase
    .from('time_slots')
    .select('*')
    .eq('id', booking.time_slot_id)
    .single();

  if (timeSlotError || !timeSlot) {
    console.error('❌ Error fetching time slot:', timeSlotError);
  } else {
    console.log('Time Slot Data:');
    console.log('  slot_date (raw):', timeSlot.slot_date);
    console.log('  start_time:', timeSlot.start_time);
    console.log('  end_time:', timeSlot.end_time);
    console.log('\n✅ Comparison:');
    console.log('  booking_date:', booking.booking_date);
    console.log('  slot_date:', timeSlot.slot_date);
    console.log('  Match:', booking.booking_date === timeSlot.slot_date ? '✅ YES' : '❌ NO');
  }

  // Step 3: Check payment order cart snapshot
  if (booking.payment_order_id) {
    console.log('\n' + '='.repeat(70));
    console.log('\n💳 Step 3: Checking Payment Order Cart Snapshot\n');
    
    const { data: paymentOrder, error: paymentError } = await supabase
      .from('payment_orders')
      .select('cart_snapshot')
      .eq('razorpay_order_id', booking.payment_order_id)
      .single();

    if (!paymentError && paymentOrder) {
      const cartSnapshot = paymentOrder.cart_snapshot as any;
      const cartItems = Array.isArray(cartSnapshot) ? cartSnapshot : (cartSnapshot?.items || []);
      
      if (cartItems.length > 0) {
        const item = cartItems[0];
        console.log('Cart Item Data:');
        console.log('  date:', item.date);
        console.log('  bookingDate:', item.bookingDate);
        console.log('  timeSlotId:', item.timeSlotId);
        console.log('  time:', item.time);
        console.log('  bookingTime:', item.bookingTime);
      }
    }
  }

  // Step 4: Test date formatting
  console.log('\n' + '='.repeat(70));
  console.log('\n📅 Step 4: Testing Date Formatting\n');
  
  const testDate = booking.booking_date;
  console.log('Original date string:', testDate);
  
  // Wrong way (causes timezone issue)
  const wrongDate = new Date(testDate);
  console.log('\n❌ WRONG: new Date(dateString)');
  console.log('  Result:', wrongDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }));
  console.log('  ISO:', wrongDate.toISOString());
  
  // Correct way (no timezone conversion)
  const [year, month, day] = testDate.split('-').map(Number);
  const correctDate = new Date(year, month - 1, day);
  console.log('\n✅ CORRECT: Parse components');
  console.log('  Result:', correctDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }));
  console.log('  ISO:', correctDate.toISOString());

  // Step 5: Test API endpoint
  console.log('\n' + '='.repeat(70));
  console.log('\n🌐 Step 5: Testing QR Verification API\n');
  
  console.log(`Testing: /api/verify/${booking.booking_reference}`);
  console.log('Note: This requires the dev server to be running');
  console.log(`\nManual test URL: http://localhost:3000/api/verify/${booking.booking_reference}`);

  // Step 6: Check all bookings for date consistency
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Step 6: Checking All Bookings for Date Consistency\n');
  
  const { data: allBookings, error: allError } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_reference,
      booking_date,
      time_slot_id,
      time_slots (slot_date)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!allError && allBookings) {
    console.log('Recent 10 bookings:');
    let mismatchCount = 0;
    
    allBookings.forEach((b: any, index) => {
      const timeSlot = Array.isArray(b.time_slots) ? b.time_slots[0] : b.time_slots;
      const match = b.booking_date === timeSlot?.slot_date;
      
      if (!match) mismatchCount++;
      
      console.log(`\n  ${index + 1}. ${b.booking_reference}`);
      console.log(`     booking_date: ${b.booking_date}`);
      console.log(`     slot_date: ${timeSlot?.slot_date || 'N/A'}`);
      console.log(`     Match: ${match ? '✅' : '❌'}`);
    });
    
    console.log(`\n📈 Summary: ${mismatchCount} mismatches out of ${allBookings.length} bookings`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Diagnostic Complete!\n');
  console.log('Key Findings:');
  console.log('1. Check if booking_date matches slot_date');
  console.log('2. Verify date formatting is using correct method');
  console.log('3. Test QR verification API manually');
  console.log('4. Check for any date mismatches in recent bookings\n');
}

// Run the diagnostic
diagnoseDateIssue().catch(console.error);
