import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('📦 Applying booking_time column migration...');
  
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260109_add_booking_time_column.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log('Migration SQL:', migrationSQL);
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: migrationSQL
  });
  
  if (error) {
    console.error('❌ Migration failed:', error);
    
    // Try alternative approach - direct query
    console.log('\n🔄 Trying direct query approach...');
    const { error: directError } = await supabase
      .from('bookings')
      .select('booking_time')
      .limit(1);
    
    if (directError && directError.message.includes('column "booking_time" does not exist')) {
      console.log('Column does not exist, attempting to add it via raw query...');
      
      // This won't work with standard client, but let's document what needs to be done
      console.log('\n⚠️ Manual migration required:');
      console.log('Please run this SQL in your Supabase SQL Editor:');
      console.log('---');
      console.log(migrationSQL);
      console.log('---');
    } else if (!directError) {
      console.log('✅ Column already exists!');
    }
    
    return;
  }
  
  console.log('✅ Migration applied successfully!');
  console.log('Data:', data);
}

applyMigration().catch(console.error);
