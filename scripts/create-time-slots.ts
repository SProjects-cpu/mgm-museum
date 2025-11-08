/**
 * Script to create time slots for the current date range
 * Run with: npx tsx scripts/create-time-slots.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTimeSlots() {
  console.log('🚀 Creating time slots for current date range...\n');

  try {
    // Get all active exhibitions
    const { data: exhibitions, error: exError } = await supabase
      .from('exhibitions')
      .select('id, name, status')
      .eq('status', 'active');

    if (exError) throw exError;

    if (!exhibitions || exhibitions.length === 0) {
      console.log('⚠️  No active exhibitions found');
      return;
    }

    console.log(`📋 Found ${exhibitions.length} active exhibitions:`);
    exhibitions.forEach(ex => console.log(`   - ${ex.name}`));
    console.log('');

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
    for (const exhibition of exhibitions) {
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

    // Insert in batches of 100 (smaller batches for better error handling)
    const batchSize = 100;
    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < slotsToInsert.length; i += batchSize) {
      const batch = slotsToInsert.slice(i, i + batchSize);
      
      // Check which slots already exist
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

      // Filter out existing slots
      const newSlots = batch.filter(
        s => !existingKeys.has(`${s.exhibition_id}-${s.slot_date}-${s.start_time}-${s.end_time}`)
      );

      if (newSlots.length > 0) {
        const { data, error } = await supabase
          .from('time_slots')
          .insert(newSlots)
          .select('id');

        if (error) {
          console.error(`\n❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
          skipped += newSlots.length;
        } else {
          inserted += data?.length || 0;
        }
      }

      skipped += batch.length - newSlots.length;

      process.stdout.write(`\r   Progress: ${Math.min(i + batchSize, slotsToInsert.length)}/${slotsToInsert.length} (${inserted} inserted, ${skipped} skipped)`);
    }

    console.log('\n');

    // Verify the time slots
    const { data: verification, error: verifyError } = await supabase
      .from('time_slots')
      .select('slot_date, exhibition_id, start_time, end_time')
      .gte('slot_date', today.toISOString().split('T')[0])
      .order('slot_date')
      .limit(10);

    if (verifyError) throw verifyError;

    console.log('✅ Time slots created successfully!\n');
    console.log('📊 Sample of created time slots:');
    
    if (verification && verification.length > 0) {
      const grouped = verification.reduce((acc: any, slot: any) => {
        if (!acc[slot.slot_date]) {
          acc[slot.slot_date] = 0;
        }
        acc[slot.slot_date]++;
        return acc;
      }, {});

      Object.entries(grouped).forEach(([date, count]) => {
        console.log(`   ${date}: ${count} slots`);
      });
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('time_slots')
      .select('*', { count: 'exact', head: true })
      .gte('slot_date', today.toISOString().split('T')[0]);

    if (!countError && count !== null) {
      console.log(`\n📈 Total time slots from today onwards: ${count}`);
    }

    console.log('\n✨ Done! You can now book visits on the website.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
createTimeSlots();
