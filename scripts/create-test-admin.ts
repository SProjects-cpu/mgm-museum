/**
 * Script to create a test admin user
 * Run with: npx tsx scripts/create-test-admin.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTestAdmin() {
  console.log('🔧 Creating test admin user...\n');

  const testEmail = 'testadmin@mgmmuseum.com';
  const testPassword = 'TestAdmin123!';

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', testEmail)
      .single();

    if (existingUser) {
      console.log('✅ Test admin user already exists!');
      console.log(`📧 Email: ${testEmail}`);
      console.log(`🔑 Password: ${testPassword}`);
      console.log(`👤 Role: ${existingUser.role}`);
      console.log(`🆔 User ID: ${existingUser.id}\n`);
      
      // Update role to admin if needed
      if (existingUser.role !== 'admin' && existingUser.role !== 'super_admin') {
        console.log('🔄 Updating role to admin...');
        await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', existingUser.id);
        console.log('✅ Role updated to admin\n');
      }
      
      return;
    }

    // Create new user in Supabase Auth
    console.log('📝 Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

    if (authError) {
      throw authError;
    }

    console.log('✅ User created in Auth');
    console.log(`🆔 Auth User ID: ${authData.user.id}\n`);

    // Create user in users table with admin role
    console.log('📝 Creating user in users table...');
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: testEmail,
        role: 'admin',
        full_name: 'Test Admin',
      });

    if (userError) {
      throw userError;
    }

    console.log('✅ User created in users table\n');
    console.log('🎉 Test admin user created successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email:    ', testEmail);
    console.log('🔑 Password: ', testPassword);
    console.log('👤 Role:     ', 'admin');
    console.log('═══════════════════════════════════════\n');
    console.log('✨ You can now login with these credentials!\n');

  } catch (error: any) {
    console.error('❌ Error creating test admin:', error.message);
    process.exit(1);
  }
}

async function listExistingAdmins() {
  console.log('📋 Existing admin users:\n');
  
  const { data: admins, error } = await supabase
    .from('users')
    .select('id, email, role, full_name')
    .in('role', ['admin', 'super_admin'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching admins:', error.message);
    return;
  }

  if (!admins || admins.length === 0) {
    console.log('⚠️  No admin users found in database\n');
    return;
  }

  admins.forEach((admin, index) => {
    console.log(`${index + 1}. ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Name: ${admin.full_name || 'N/A'}`);
    console.log(`   ID: ${admin.id}\n`);
  });
}

async function main() {
  console.log('\n🚀 MGM Museum - Admin User Setup\n');
  console.log('═══════════════════════════════════════\n');

  await listExistingAdmins();
  await createTestAdmin();

  console.log('✅ Setup complete!\n');
  process.exit(0);
}

main();
