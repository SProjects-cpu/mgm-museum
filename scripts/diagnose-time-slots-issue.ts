/**
 * Diagnose Time Slots Issue
 * Check what type of time slots exist and how they're being used
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EXHIBITION_ID = '44d3a98d-faff-4dcf-a255-436cefdd97ef';

async function diagnoseTimeSlots() {
  console.log('🔍 Diagnosing Time Slots Issue\n');
  console.log('═'.repeat(60));
  console.log(`Exhibition ID: ${EXHIBITION_ID}\n`);

  try {
    // Check template slots (day_of_week based)
    console.log('📋 Template Slots (day_of_week based):');
    const { data: templateSlots, error: templateError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('exhibition_id', EXHIBITION_ID)
      .not('day_of_week', 'is', null)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (templateError) {
      console.error('❌ Error:', templateError);
    } else {
      console.log(`Found ${templateSlots?.length || 0} template slots`);
      templateSlots?.forEach(slot => {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        console.log(`  - ${dayNames[slot.day_of_week!]}: ${slot.start_time}-${slot.end_time} (${slot.capacity} capacity)`);
      });
    }

    // Check date-specific slots (slot_date based)
    console.log('\n📅 Date-Specific Slots (slot_date based):');
    const { data: dateSlots, error: dateError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('exhibition_id', EXHIBITION_ID)
      .not('slot_date', 'is', null)
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(20);

    if (dateError) {
      console.error('❌ Error:', dateError);
    } else {
      console.log(`Found ${dateSlots?.length || 0} date-specific slots (showing first 20)`);
      dateSlots?.forEach(slot => {
        console.log(`  - ${slot.slot_date} ${slot.start_time}-${slot.end_time} (${slot.current_bookings}/${slot.capacity})`);
      });
    }

    // Check which type the API returns
    console.log('\n🔌 Testing API Response:');
    const apiResponse = await fetch(`http://localhost:3000/api/admin/exhibitions/${EXHIBITION_ID}/time-slots`);
    const apiData = await apiResponse.json();
    
    console.log(`API returned ${apiData.timeSlots?.length || 0} slots`);
    if (apiData.timeSlots && apiData.timeSlots.length > 0) {
      const firstSlot = apiData.timeSlots[0];
      console.log('\nFirst slot structure:');
      console.log(JSON.stringify(firstSlot, null, 2));
      
      console.log('\nSlot types in API response:');
      const hasTemplate = apiData.timeSlots.some((s: any) => s.day_of_week !== null);
      const hasDateSpecific = apiData.timeSlots.some((s: any) => s.slot_date !== null);
      console.log(`  - Template slots (day_of_week): ${hasTemplate ? 'YES' : 'NO'}`);
      console.log(`  - Date-specific slots (slot_date): ${hasDateSpecific ? 'YES' : 'NO'}`);
    }

    // Check what the booking system expects
    console.log('\n📖 Booking System Requirements:');
    console.log('The booking system uses date-specific slots (slot_date) for actual bookings.');
    console.log('Template slots (day_of_week) are used to generate date-specific slots.');
    
    console.log('\n💡 Recommendation:');
    if (templateSlots && templateSlots.length > 0 && (!dateSlots || dateSlots.length === 0)) {
      console.log('⚠️  You have template slots but no date-specific slots!');
      console.log('   The admin panel shows template slots, but bookings need date-specific slots.');
      console.log('   You need to generate date-specific slots from templates.');
    } else if (dateSlots && dateSlots.length > 0) {
      console.log('✅ You have date-specific slots - these are what bookings use.');
      console.log('   The admin panel should show these, not template slots.');
    }

  } catch (error: any) {
    console.error('💥 Error:', error.message);
  }

  console.log('\n' + '═'.repeat(60));
}

diagnoseTimeSlots()
  .then(() => {
    console.log('\n✅ Diagnosis complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnosis failed:', error);
    process.exit(1);
  });
