/**
 * Diagnose Supabase Auth Email Configuration
 * This script helps identify why signup confirmation emails aren't being sent
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function diagnoseSupabaseAuth() {
  console.log('🔍 Diagnosing Supabase Auth Email Configuration\n');
  console.log('═'.repeat(60));

  // Check environment variables
  console.log('\n📋 Environment Variables:');
  console.log('─'.repeat(60));
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');

  // Supabase project info
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
    console.log('\n🏢 Supabase Project:');
    console.log('─'.repeat(60));
    console.log('Project Reference:', projectRef);
    console.log('Dashboard URL:', `https://supabase.com/dashboard/project/${projectRef}`);
  }

  // Auth configuration checklist
  console.log('\n✅ Supabase Auth Email Configuration Checklist:');
  console.log('═'.repeat(60));
  console.log('\n1. Email Auth Provider Settings:');
  console.log('   Go to: Dashboard → Authentication → Providers → Email');
  console.log('   ☐ Enable email provider');
  console.log('   ☐ Enable "Confirm email" (if you want email verification)');
  console.log('   ☐ OR Disable "Confirm email" (for instant signup)');

  console.log('\n2. Email Templates:');
  console.log('   Go to: Dashboard → Authentication → Email Templates');
  console.log('   ☐ Confirm signup template configured');
  console.log('   ☐ Template has correct redirect URL');
  console.log('   ☐ Template is enabled');

  console.log('\n3. SMTP Settings:');
  console.log('   Go to: Dashboard → Project Settings → Auth');
  console.log('   ☐ SMTP settings configured (if using custom SMTP)');
  console.log('   ☐ OR Using Supabase default email service');

  console.log('\n4. Site URL Configuration:');
  console.log('   Go to: Dashboard → Authentication → URL Configuration');
  console.log('   ☐ Site URL set correctly');
  console.log('   ☐ Redirect URLs include your domain');

  console.log('\n5. Email Rate Limits:');
  console.log('   Go to: Dashboard → Project Settings → Auth');
  console.log('   ☐ Check rate limiting settings');
  console.log('   ☐ Verify not hitting rate limits');

  // Common issues
  console.log('\n⚠️  Common Issues & Solutions:');
  console.log('═'.repeat(60));
  
  console.log('\n❌ Issue: Emails not being sent');
  console.log('   Solutions:');
  console.log('   1. Check spam/junk folder');
  console.log('   2. Verify email provider is enabled');
  console.log('   3. Check SMTP configuration');
  console.log('   4. Review Supabase logs for errors');

  console.log('\n❌ Issue: "Confirm email" enabled but users want instant access');
  console.log('   Solutions:');
  console.log('   1. Disable "Confirm email" in Auth settings');
  console.log('   2. Users will be auto-logged in after signup');
  console.log('   3. No email confirmation required');

  console.log('\n❌ Issue: Email confirmation link not working');
  console.log('   Solutions:');
  console.log('   1. Check Site URL matches your domain');
  console.log('   2. Add redirect URLs to allowed list');
  console.log('   3. Verify email template has correct {{.ConfirmationURL}}');

  console.log('\n❌ Issue: Using Resend for booking emails but Supabase for auth');
  console.log('   Solutions:');
  console.log('   1. Configure Supabase to use Resend SMTP');
  console.log('   2. OR Keep separate (Supabase for auth, Resend for bookings)');
  console.log('   3. Ensure both are configured correctly');

  // Recommended configuration
  console.log('\n💡 Recommended Configuration for MGM Museum:');
  console.log('═'.repeat(60));
  console.log('\nOption 1: Instant Signup (No Email Confirmation)');
  console.log('  ✅ Faster user experience');
  console.log('  ✅ No email configuration needed');
  console.log('  ✅ Users can book immediately');
  console.log('  ⚠️  Less secure (no email verification)');
  console.log('\n  Steps:');
  console.log('  1. Go to Auth → Providers → Email');
  console.log('  2. Disable "Confirm email"');
  console.log('  3. Save changes');

  console.log('\nOption 2: Email Confirmation (More Secure)');
  console.log('  ✅ Verifies email addresses');
  console.log('  ✅ More secure');
  console.log('  ⚠️  Requires email configuration');
  console.log('  ⚠️  Users must check email before booking');
  console.log('\n  Steps:');
  console.log('  1. Configure SMTP or use Supabase email');
  console.log('  2. Enable "Confirm email"');
  console.log('  3. Configure email templates');
  console.log('  4. Test signup flow');

  // Testing steps
  console.log('\n🧪 Testing Steps:');
  console.log('═'.repeat(60));
  console.log('1. Try signing up with a test email');
  console.log('2. Check Supabase logs:');
  console.log('   Dashboard → Logs → Auth Logs');
  console.log('3. Look for email sending events');
  console.log('4. Check for any error messages');
  console.log('5. Verify email delivery in inbox/spam');

  // Quick fix
  console.log('\n⚡ Quick Fix (Disable Email Confirmation):');
  console.log('═'.repeat(60));
  console.log('If you want users to sign up instantly without email:');
  console.log('\n1. Go to Supabase Dashboard');
  console.log('2. Navigate to: Authentication → Providers');
  console.log('3. Click on "Email" provider');
  console.log('4. Toggle OFF "Confirm email"');
  console.log('5. Click "Save"');
  console.log('\n✅ Users will now be auto-logged in after signup!');

  console.log('\n' + '═'.repeat(60));
  console.log('📚 Documentation:');
  console.log('─'.repeat(60));
  console.log('Supabase Auth: https://supabase.com/docs/guides/auth');
  console.log('Email Auth: https://supabase.com/docs/guides/auth/auth-email');
  console.log('SMTP Setup: https://supabase.com/docs/guides/auth/auth-smtp');
  console.log('═'.repeat(60) + '\n');
}

// Run diagnosis
diagnoseSupabaseAuth()
  .then(() => {
    console.log('✅ Diagnosis complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
