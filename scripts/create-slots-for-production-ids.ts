/**
 * Create time slots for the ACTUAL production exhibition IDs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mlljzwuflbbquttejvuq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbGp6d3VmbGJicXV0dGVqdnVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI0NzEwNCwiZXhwIjoyMDc1ODIzMTA0fQ.rneNu_-nQ1CrHPnzWAjwpyxnOW1wcMIh4-TIPi6jbxU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// These are the ACTUAL production IDs from the API
const productionExhibitions = [
  { id: 'b4364313-c163-4f4e-bcf3-c40e355e24f6', name: '3D Science Theatre' },
  { id: 'b2bbdcfe-ab1f-4a6f-b9c8-617feab3d709', name: 'Aditya Solar Observatory' },
  { id: '0ac4f2e8-9f66-48c5-82e8-bdc4fba50ca4', name: 'Astro Gallery & ISRO Exhibition' },
  { id: 'ea18e49d-550f-4143-b61e-0f19c66f9461', name: 'Basic Physics Laboratory' },
  { id: '26a52798-cf61-4740-9488-d4bcb37e33f7', name: 'Full Dome Digital Planetarium' },
  { id: 'eacf7c82-b14b-436f-a7f0-2fd87b997255', name: 'Holography Theatre' },
  { id: 'b92dbe84-25c9-4959-9513-6092b1796fa9', name: 'Mathematics Laboratory' },
  { id: '14e9a24a-cc77-46f2-8364-95b90013edc5', name: 'Outdoor Science Park' },
];

async function createSlotsForProductionIDs() {
  console.log('🚀 Creating time slots for PRODUCTION exhibition IDs...\n');

  // Generate dates for the next 60 days
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const date = new Date(today);
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

  console.log(`📅 Creating time slots for ${dates.length} days`);
  console.log(`⏰ ${timeSlots.length} slots per day`);
  console.log(`📋 ${productionExhibitions.length} exhibitions\n`);

  // Create slots
  const slotsToInsert = [];
  for (const exhibition of productionExhibitions) {
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
  let errors = 0;

  for (let i = 0; i < slotsToInsert.length; i += batchSize) {
    const batch = slotsToInsert.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('time_slots')
      .insert(batch)
      .select('id');

    if (error) {
      console.error(`\n❌ Error inserting batch:`, error.message);
      errors++;
    } else {
      inserted += data?.length || 0;
      process.stdout.write(`\r   Progress: ${inserted}/${slotsToInsert.length}`);
    }
  }

  console.log('\n\n✅ Done!');
  console.log(`📈 Total inserted: ${inserted}`);
  if (errors > 0) {
    console.log(`⚠️  Errors: ${errors} batches failed`);
  }
}

createSlotsForProductionIDs().catch(console.error);
