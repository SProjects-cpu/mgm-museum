/**
 * Check Time Slot Data in Database
 * 
 * This script checks if time slots have slot_date populated
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkTimeSlotData() {
  console.log('🔍 Checking Time Slot Data');
  console.log('==========================\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get all time slots
  const { data: timeSlots, error } = await supabase
    .from('time_slots')
    .select('id, exhibition_id, start_time, end_time, slot_date, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error fetching time slots:', error);
    return;
  }

  console.log(`Found ${timeSlots?.length || 0} time slots\n`);

  if (!timeSlots || timeSlots.length === 0) {
    console.log('⚠️ No time slots found in database');
    return;
  }

  // Analyze time slots
  const withSlotDate = timeSlots.filter(ts => ts.slot_date !== null);
  const withoutSlotDate = timeSlots.filter(ts => ts.slot_date === null);

  console.log('📊 Analysis:');
  console.log(`  ✅ With slot_date: ${withSlotDate.length}`);
  console.log(`  ❌ Without slot_date: ${withoutSlotDate.length}\n`);

  if (withoutSlotDate.length > 0) {
    console.log('⚠️ WARNING: Time slots without slot_date found!');
    console.log('This will prevent emails from being sent.\n');
    console.log('Time slots missing slot_date:');
    withoutSlotDate.forEach(ts => {
      console.log(`  - ID: ${ts.id}`);
      console.log(`    Exhibition: ${ts.exhibition_id}`);
      console.log(`    Time: ${ts.start_time} - ${ts.end_time}`);
      console.log(`    Created: ${ts.created_at}\n`);
    });
  }

  // Show sample time slots
  console.log('\n📋 Sample Time Slots:');
  timeSlots.slice(0, 5).forEach((ts, index) => {
    console.log(`\n${index + 1}. Time Slot ID: ${ts.id}`);
    console.log(`   Exhibition ID: ${ts.exhibition_id}`);
    console.log(`   Slot Date: ${ts.slot_date || '❌ NULL'}`);
    console.log(`   Start Time: ${ts.start_time}`);
    console.log(`   End Time: ${ts.end_time}`);
  });

  // Check recent bookings
  console.log('\n\n🎫 Checking Recent Bookings');
  console.log('===========================\n');

  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_reference,
      guest_email,
      booking_date,
      booking_time,
      time_slot_id,
      created_at,
      time_slots:time_slot_id (
        id,
        slot_date,
        start_time,
        end_time
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (bookingError) {
    console.error('❌ Error fetching bookings:', bookingError);
    return;
  }

  if (!bookings || bookings.length === 0) {
    console.log('No bookings found');
    return;
  }

  console.log(`Found ${bookings.length} recent bookings:\n`);

  bookings.forEach((booking, index) => {
    const timeSlot = booking.time_slots as any;
    console.log(`${index + 1}. Booking: ${booking.booking_reference}`);
    console.log(`   Email: ${booking.guest_email}`);
    console.log(`   Booking Date: ${booking.booking_date}`);
    console.log(`   Time Slot ID: ${booking.time_slot_id}`);
    console.log(`   Time Slot Data:`);
    console.log(`     - slot_date: ${timeSlot?.slot_date || '❌ NULL'}`);
    console.log(`     - start_time: ${timeSlot?.start_time || '❌ NULL'}`);
    console.log(`     - end_time: ${timeSlot?.end_time || '❌ NULL'}`);
    console.log(`   Created: ${booking.created_at}\n`);
  });

  // Summary
  console.log('\n📝 Summary');
  console.log('==========');
  console.log(`Total Time Slots: ${timeSlots.length}`);
  console.log(`With slot_date: ${withSlotDate.length} (${((withSlotDate.length / timeSlots.length) * 100).toFixed(1)}%)`);
  console.log(`Without slot_date: ${withoutSlotDate.length} (${((withoutSlotDate.length / timeSlots.length) * 100).toFixed(1)}%)`);
  
  if (withoutSlotDate.length > 0) {
    console.log('\n⚠️ ACTION REQUIRED:');
    console.log('Time slots are missing slot_date values.');
    console.log('This prevents confirmation emails from being sent.');
    console.log('\nSolution: Update time slots to include slot_date');
  } else {
    console.log('\n✅ All time slots have slot_date - email issue is elsewhere');
  }
}

checkTimeSlotData().catch(console.error);
