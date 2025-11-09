/**
 * Create time slots for production exhibition IDs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mlljzwuflbbquttejvuq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbGp6d3VmbGJicXV0dGVqdnVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI0NzEwNCwiZXhwIjoyMDc1ODIzMTA0fQ.rneNu_-nQ1CrHPnzWAjwpyxnOW1wcMIh4-TIPi6jbxU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createProductionSlots() {
  console.log('🚀 Creating time slots for production exhibitions...\n');

  // Get all active exhibitions
  const { data: exhibitions, error: exError } = await supabase
    .from('exhibitions')
    .select('id, name, status')
    .eq('status', 'active');

  if (exError) throw exError;

  console.log(`📋 Found ${exhibitions?.length} active exhibitions\n`);

  // Generate dates for the next 60 days
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }

  // Time slots to create
  const timeSlots = [
    { start: '10:00:00', end: '11:00:00' },
    { start: '13:00:00', end: '14:00:00' },
    { start: '16:00:00', end: '17:00:00' },
    { start: '19:00:00', end: '20:00:00' },
  ];

  console.log(`📅 Creating time slots for ${dates.length} days...`);
  console.log(`⏰ Time slots: ${timeSlots.map(t => `${t.start}-${t.end}`).join(', ')}\n`);

  // Create time slots for each exhibition, date, and time
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

  console.log(`📝 Inserting ${slotsToInsert.length} time slots...`);

  // Insert in batches
  const batchSize = 100;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < slotsToInsert.length; i += batchSize) {
    const batch = slotsToInsert.slice(i, i + batchSize);
    
    // Check existing
    const existingCheck = await supabase
      .from('time_slots')
      .select('exhibition_id, slot_date, start_time, end_time')
      .in('exhibition_id', [...new Set(batch.map(s => s.exhibition_id))])
      .in('slot_date', [...new Set(batch.map(s => s.slot_date))])
      .in('start_time', [...new Set(batch.map(s => s.start_time))]);

    const existingKeys = new Set(
      (existingCheck.data || []).map(
        (s: any) => `${s.exhibition_id}-${s.slot_date}-${s.start_time}-${s.end_time}`
      )
    );

    const newSlots = batch.filter(
      s => !existingKeys.has(`${s.exhibition_id}-${s.slot_date}-${s.start_time}-${s.end_time}`)
    );

    if (newSlots.length > 0) {
      const { data, error } = await supabase
        .from('time_slots')
        .insert(newSlots)
        .select('id');

      if (error) {
        console.error(`\n❌ Error inserting batch:`, error.message);
        skipped += newSlots.length;
      } else {
        inserted += data?.length || 0;
      }
    }

    skipped += batch.length - newSlots.length;

    process.stdout.write(`\r   Progress: ${Math.min(i + batchSize, slotsToInsert.length)}/${slotsToInsert.length} (${inserted} inserted, ${skipped} skipped)`);
  }

  console.log('\n\n✅ Time slots created successfully!');
  console.log(`\n📈 Total: ${inserted} inserted, ${skipped} skipped`);
}

createProductionSlots().catch(console.error);
