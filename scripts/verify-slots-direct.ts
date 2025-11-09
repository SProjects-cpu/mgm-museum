/**
 * Verify time slots directly in database
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mlljzwuflbbquttejvuq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbGp6d3VmbGJicXV0dGVqdnVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI0NzEwNCwiZXhwIjoyMDc1ODIzMTA0fQ.rneNu_-nQ1CrHPnzWAjwpyxnOW1wcMIh4-TIPi6jbxU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySlots() {
  const exhibitionId = '26a52798-cf61-4740-9488-d4bcb37e33f7'; // Production Full Dome
  const today = new Date().toISOString().split('T')[0];
  
  console.log('Verifying time slots...');
  console.log('Exhibition ID:', exhibitionId);
  console.log('Today:', today);
  console.log('');
  
  // Get all slots for this exhibition from today
  const { data, error, count } = await supabase
    .from('time_slots')
    .select('*', { count: 'exact' })
    .eq('exhibition_id', exhibitionId)
    .gte('slot_date', today)
    .order('slot_date');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Total slots: ${count}`);
  console.log('');
  
  // Group by date
  const byDate = new Map();
  data?.forEach(slot => {
    const date = slot.slot_date;
    if (!byDate.has(date)) {
      byDate.set(date, []);
    }
    byDate.get(date).push(slot);
  });
  
  console.log('Slots by date:');
  Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, slots]) => {
      console.log(`  ${date}: ${slots.length} slots`);
      slots.forEach((s: any) => {
        console.log(`    ${s.start_time}-${s.end_time} (capacity: ${s.capacity})`);
      });
    });
}

verifySlots().catch(console.error);
