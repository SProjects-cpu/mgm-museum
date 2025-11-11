/**
 * Cleanup Duplicate Time Slots
 * Removes duplicate time slots for exhibitions
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EXHIBITION_ID = '44d3a98d-faff-4dcf-a255-436cefdd97ef';

async function cleanupDuplicateTimeSlots() {
  console.log('🧹 Cleaning up Duplicate Time Slots\n');
  console.log('═'.repeat(60));
  console.log(`Exhibition ID: ${EXHIBITION_ID}`);

  try {
    // Fetch all time slots for this exhibition
    const { data: timeSlots, error: fetchError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('exhibition_id', EXHIBITION_ID)
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching time slots:', fetchError);
      return;
    }

    console.log(`\n📊 Found ${timeSlots?.length || 0} time slots`);

    if (!timeSlots || timeSlots.length === 0) {
      console.log('✅ No time slots to clean up');
      return;
    }

    // Group by date and time to find duplicates
    const slotMap = new Map<string, any[]>();
    const duplicateSlots: any[] = [];
    const validSlots: any[] = [];

    timeSlots.forEach(slot => {
      const key = `${slot.slot_date}_${slot.start_time}_${slot.end_time}`;
      if (!slotMap.has(key)) {
        slotMap.set(key, []);
      }
      slotMap.get(key)!.push(slot);
    });

    // Identify duplicates
    slotMap.forEach((slots, key) => {
      if (slots.length > 1) {
        console.log(`\n🔍 Found ${slots.length} duplicates for ${key}`);
        // Keep the first one (oldest), mark others as duplicates
        validSlots.push(slots[0]);
        duplicateSlots.push(...slots.slice(1));
        
        slots.forEach((slot, index) => {
          console.log(`  ${index === 0 ? '✓ KEEP' : '✗ DELETE'}: ${slot.id} (created: ${slot.created_at})`);
        });
      } else {
        validSlots.push(slots[0]);
      }
    });

    console.log('\n📋 Cleanup Analysis:');
    console.log(`Valid slots (unique): ${validSlots.length}`);
    console.log(`Duplicate slots: ${duplicateSlots.length}`);

    if (duplicateSlots.length === 0) {
      console.log('\n✅ No duplicates found - all slots are unique');
      return;
    }

    console.log(`\n🗑️ Deleting ${duplicateSlots.length} duplicate slots...`);
    
    // Delete duplicate slots
    const idsToDelete = duplicateSlots.map(slot => slot.id);
    
    const { error: deleteError } = await supabase
      .from('time_slots')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      console.error('❌ Error deleting slots:', deleteError);
      return;
    }

    console.log('✅ Cleanup completed successfully!');
    console.log(`\n📊 Final Result:`)
    console.log(`Remaining unique slots: ${validSlots.length}`);
    console.log(`Deleted duplicate slots: ${duplicateSlots.length}`);

    // Show remaining slots summary
    console.log('\n📅 Remaining Time Slots by Date:');
    const dateGroups = new Map<string, number>();
    validSlots.forEach(slot => {
      const date = slot.slot_date;
      dateGroups.set(date, (dateGroups.get(date) || 0) + 1);
    });
    
    Array.from(dateGroups.entries())
      .sort()
      .forEach(([date, count]) => {
        console.log(`  ${date}: ${count} slots`);
      });

  } catch (error) {
    console.error('💥 Error:', error);
  }

  console.log('\n' + '═'.repeat(60));
}

cleanupDuplicateTimeSlots()
  .then(() => {
    console.log('\n✅ Cleanup complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });
