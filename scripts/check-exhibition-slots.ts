/**
 * Check time slots for specific exhibition in production
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mlljzwuflbbquttejvuq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbGp6d3VmbGJicXV0dGVqdnVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI0NzEwNCwiZXhwIjoyMDc1ODIzMTA0fQ.rneNu_-nQ1CrHPnzWAjwpyxnOW1wcMIh4-TIPi6jbxU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExhibitionSlots() {
  const exhibitionId = 'acdc4a68-553e-42bf-9b1f-da0b170c03a1';
  const today = new Date().toISOString().split('T')[0];
  
  console.log('Checking time slots for exhibition:', exhibitionId);
  console.log('Date:', today);
  console.log('');
  
  const { data, error } = await supabase
    .from('time_slots')
    .select('slot_date, start_time, end_time, capacity, active')
    .eq('exhibition_id', exhibitionId)
    .eq('active', true)
    .gte('slot_date', today)
    .order('slot_date')
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${data?.length || 0} time slots (showing first 10):`);
  data?.forEach(slot => {
    console.log(`  ${slot.slot_date} ${slot.start_time}-${slot.end_time} (capacity: ${slot.capacity})`);
  });
  
  // Get total count
  const { count } = await supabase
    .from('time_slots')
    .select('*', { count: 'exact', head: true })
    .eq('exhibition_id', exhibitionId)
    .eq('active', true)
    .gte('slot_date', today);
  
  console.log(`\nTotal slots for this exhibition from ${today}: ${count}`);
}

checkExhibitionSlots();
