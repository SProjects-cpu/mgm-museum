/**
 * Clean up old time slots and create new ones
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mlljzwuflbbquttejvuq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbGp6d3VmbGJicXV0dGVqdnVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI0NzEwNCwiZXhwIjoyMDc1ODIzMTA0fQ.rneNu_-nQ1CrHPnzWAjwpyxnOW1wcMIh4-TIPi6jbxU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupAndCreate() {
  const today = new Date().toISOString().split('T')[0];
  
  console.log('🧹 Cleaning up old time slots...');
  console.log(`   Deleting slots before ${today}\n`);
  
  // Delete old slots
  const { error: deleteError } = await supabase
    .from('time_slots')
    .delete()
    .lt('slot_date', today);
  
  if (deleteError) {
    console.error('Error deleting old slots:', deleteError);
  } else {
    console.log('✅ Old slots deleted\n');
  }
  
  // Get all active exhibitions
  const { data: exhibitions } = await supabase
    .from('exhibitions')
    .select('id, name, status')
    .eq('status', 'active');

  console.log(`📋 Found ${exhibitions?.length} active exhibitions:`);
  exhibitions?.forEach(ex => {
    console.log(`   - ${ex.name} (${ex.id})`);
  });
  console.log('');

  // Generate dates for the next 60 days
  const dates: string[] = [];
  for (let i = 0; i < 60; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }

  // Time slots
  const timeSlots = [
    { start: '10:00:00', end: '11:00:00' },
    { start: '13:00:00', end: '14:00:00' },
    { start: '16:00:00', end: '17:00:00' },
    { start: '19:00:00', end: '20:00:00' },
  ];

  console.log(`📅 Creating time slots for ${dates.length} days...`);
  console.log(`⏰ ${timeSlots.length} slots per day\n`);

  // Create slots
  const slotsToInsert = [];
  for (const exhibition of exhibitions || []) {
    for (const date of dates) {
      for (const slot of timeSlots) {
        slotsToInsert.push({
          exhibition_id: exhibition.id,
          slot_date: date,
          start_time: slot.start,
          end_time: slot.end,
          capacity: 50,
          active: true,
        });
      }
    }
  }

  console.log(`📝 Inserting ${slotsToInsert.length} time slots...\n`);

  // Insert in batches
  const batchSize = 500;
  let inserted = 0;

  for (let i = 0; i < slotsToInsert.length; i += batchSize) {
    const batch = slotsToInsert.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('time_slots')
      .insert(batch)
      .select('id');

    if (error) {
      console.error(`❌ Error inserting batch:`, error.message);
    } else {
      inserted += data?.length || 0;
      process.stdout.write(`\r   Progress: ${inserted}/${slotsToInsert.length}`);
    }
  }

  console.log('\n\n✅ Done!');
  console.log(`📈 Total inserted: ${inserted}`);
}

cleanupAndCreate().catch(console.error);
