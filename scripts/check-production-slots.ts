/**
 * Check time slots in production database
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mlljzwuflbbquttejvuq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbGp6d3VmbGJicXV0dGVqdnVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI0NzEwNCwiZXhwIjoyMDc1ODIzMTA0fQ.rneNu_-nQ1CrHPnzWAjwpyxnOW1wcMIh4-TIPi6jbxU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProductionSlots() {
  console.log('Checking production time slots...\n');
  
  const today = new Date().toISOString().split('T')[0];
  
  // Check time slots
  const { data: grouped, error } = await supabase
    .from('time_slots')
    .select('slot_date, exhibition_id, start_time, end_time')
    .gte('slot_date', today)
    .order('slot_date');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Time slots by date:');
  
  const dateCount = new Map();
  grouped?.forEach((slot: any) => {
    dateCount.set(slot.slot_date, (dateCount.get(slot.slot_date) || 0) + 1);
  });
  
  Array.from(dateCount.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, count]) => {
      console.log(`  ${date}: ${count} slots`);
    });
  
  console.log(`\nTotal: ${grouped?.length || 0} slots from ${today} onwards`);
}

checkProductionSlots();
