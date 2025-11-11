// Test script for admin APIs
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testAdminAPIs() {
  console.log('Testing Admin APIs...\n');

  // Test 1: Check exhibitions endpoint
  console.log('1. Testing GET /api/admin/exhibitions');
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/exhibitions`);
    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log(`Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n2. Testing GET /api/admin/pricing');
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/pricing`);
    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log(`Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n3. Testing GET /api/admin/time-slots');
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/time-slots`);
    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log(`Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }

  // Test direct Supabase access
  console.log('\n4. Testing direct Supabase access');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: exhibitions, error } = await supabase
    .from('exhibitions')
    .select('*, pricing(*)')
    .order('display_order', { ascending: true });
  
  if (error) {
    console.error('Supabase error:', error);
  } else {
    console.log(`Found ${exhibitions?.length} exhibitions`);
    console.log('First exhibition:', exhibitions?.[0]);
  }
}

testAdminAPIs().catch(console.error);
