import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTimeSlots() {
  const exhibitionId = '550e8400-e29b-41d4-a716-446655440000';
  const today = new Date().toISOString().split('T')[0];
  
  console.log('Checking time slots for exhibition:', exhibitionId);
  console.log('Today:', today);
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
  
  console.log('Found', data?.length, 'time slots:');
  console.log(JSON.stringify(data, null, 2));
}

checkTimeSlots();
