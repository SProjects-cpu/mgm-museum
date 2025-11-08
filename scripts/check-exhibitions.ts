import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkExhibitions() {
  console.log('Checking exhibitions...\n');
  
  const { data, error } = await supabase
    .from('exhibitions')
    .select('id, name, status')
    .order('name');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Found', data?.length, 'exhibitions:');
  data?.forEach(ex => {
    console.log(`  ${ex.status === 'active' ? '✓' : '✗'} ${ex.name}`);
    console.log(`    ID: ${ex.id}`);
  });
  
  // Check time slots count for each
  console.log('\nTime slots per exhibition:');
  for (const ex of data || []) {
    const { count } = await supabase
      .from('time_slots')
      .select('*', { count: 'exact', head: true })
      .eq('exhibition_id', ex.id)
      .gte('slot_date', new Date().toISOString().split('T')[0]);
    
    console.log(`  ${ex.name}: ${count} slots`);
  }
}

checkExhibitions();
