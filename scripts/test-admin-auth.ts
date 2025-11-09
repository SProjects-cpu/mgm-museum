/**
 * Test script to verify admin authentication is working
 * Run with: npx tsx scripts/test-admin-auth.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testAdminAuth() {
  console.log('🔍 Testing Admin Authentication...\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Test 1: Sign in
  console.log('1️⃣ Testing sign in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'admin@mgmmuseum.com',
    password: 'admin123',
  });

  if (signInError) {
    console.error('❌ Sign in failed:', signInError.message);
    return;
  }

  console.log('✅ Sign in successful');
  console.log('   User ID:', signInData.user?.id);
  console.log('   Email:', signInData.user?.email);
  console.log('   Session:', signInData.session ? 'Created' : 'Not created');

  // Test 2: Check user role
  console.log('\n2️⃣ Checking user role...');
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('id', signInData.user!.id)
    .single();

  if (userError) {
    console.error('❌ Failed to fetch user role:', userError.message);
  } else {
    console.log('✅ User role fetched');
    console.log('   Role:', userData.role);
    console.log('   Is Admin:', ['admin', 'super_admin'].includes(userData.role));
  }

  // Test 3: Get session
  console.log('\n3️⃣ Testing session retrieval...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('❌ Failed to get session:', sessionError.message);
  } else if (!session) {
    console.error('❌ No session found');
  } else {
    console.log('✅ Session retrieved');
    console.log('   Access Token:', session.access_token.substring(0, 20) + '...');
    console.log('   Expires At:', new Date(session.expires_at! * 1000).toLocaleString());
  }

  // Test 4: Sign out
  console.log('\n4️⃣ Testing sign out...');
  const { error: signOutError } = await supabase.auth.signOut();

  if (signOutError) {
    console.error('❌ Sign out failed:', signOutError.message);
  } else {
    console.log('✅ Sign out successful');
  }

  console.log('\n✅ All authentication tests completed!');
}

testAdminAuth().catch(console.error);
