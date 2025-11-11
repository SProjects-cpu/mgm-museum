/**
 * Test Date Flow - Comprehensive date handling test
 * Tests the entire booking flow to ensure dates are handled correctly
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { formatDateForDisplay } from '../lib/utils/date-helpers';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testDateFlow() {
  console.log('🧪 Testing Date Flow\n');
  console.log('='.repeat(60));

  // Test 1: Check a recent booking
  console.log('\n📋 Test 1: Checking recent booking dates...\n');
  
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_reference,
      booking_date,
      guest_name,
      created_at,
      time_slots (
        slot_date,
        start_time,
        end_time
      )
    `)
    .order('created_at', { ascending: false })
    .limit(1);

  const recentBooking = bookings?.[0];

  if (bookingError) {
    console.error('❌ Error fetching booking:', bookingError);
    return;
  }

  if (!recentBooking) {
    console.log('⚠️  No bookings found in database');
    return;
  }

  console.log('Booking Reference:', recentBooking.booking_reference);
  console.log('Guest Name:', recentBooking.guest_name);
  console.log('\nDate Storage:');
  console.log('  booking_date (raw):', recentBooking.booking_date);
  console.log('  slot_date (raw):', recentBooking.time_slots?.slot_date);
  console.log('\nDate Display:');
  console.log('  Using booking_date:', formatDateForDisplay(recentBooking.booking_date));
  console.log('  Using slot_date:', formatDateForDisplay(recentBooking.time_slots?.slot_date || recentBooking.booking_date));
  
  // Test 2: Test QR verification API
  console.log('\n' + '='.repeat(60));
  console.log('\n📱 Test 2: Testing QR Verification API...\n');
  
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', 'http://localhost:3000/')}/api/verify/${recentBooking.booking_reference}`
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ QR Verification API Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('❌ QR Verification API Error:', response.status, response.statusText);
      const errorData = await response.text();
      console.log('Error details:', errorData);
    }
  } catch (error) {
    console.log('⚠️  Cannot test API (server may not be running)');
    console.log('   Error:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Test 3: Check time slot data
  console.log('\n' + '='.repeat(60));
  console.log('\n🕐 Test 3: Checking time slot consistency...\n');
  
  const { data: timeSlots, error: slotsError } = await supabase
    .from('time_slots')
    .select('id, slot_date, start_time, end_time')
    .limit(5);

  if (slotsError) {
    console.error('❌ Error fetching time slots:', slotsError);
  } else {
    console.log('Sample time slots:');
    timeSlots?.forEach((slot, index) => {
      console.log(`\n  Slot ${index + 1}:`);
      console.log(`    ID: ${slot.id}`);
      console.log(`    Date (raw): ${slot.slot_date}`);
      console.log(`    Date (formatted): ${formatDateForDisplay(slot.slot_date)}`);
      console.log(`    Time: ${slot.start_time} - ${slot.end_time}`);
    });
  }

  // Test 4: Date comparison
  console.log('\n' + '='.repeat(60));
  console.log('\n🔍 Test 4: Date Comparison Test...\n');
  
  const testDate = '2025-01-15';
  console.log('Test date string:', testDate);
  console.log('Formatted for display:', formatDateForDisplay(testDate));
  
  // Show what happens with wrong approach (new Date())
  const wrongDate = new Date(testDate);
  console.log('\n⚠️  Wrong approach (new Date()):');
  console.log('  Result:', wrongDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }));
  console.log('  Note: May show wrong date due to timezone conversion');
  
  // Show correct approach
  const [year, month, day] = testDate.split('-').map(Number);
  const correctDate = new Date(year, month - 1, day);
  console.log('\n✅ Correct approach (parse components):');
  console.log('  Result:', correctDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }));

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Date flow test complete!\n');
}

// Run the test
testDateFlow().catch(console.error);
