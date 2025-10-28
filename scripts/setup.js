#!/usr/bin/env node

/**
 * MGM Museum - Automated Setup Script
 * Run: node scripts/setup.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function setup() {
  console.log('\n🎨 MGM Museum - Automated Setup\n');
  console.log('This script will help you configure your environment variables.\n');

  const env = {};

  // Supabase
  console.log('📦 SUPABASE CONFIGURATION\n');
  env.NEXT_PUBLIC_SUPABASE_URL = await question('Supabase Project URL: ');
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY = await question('Supabase Anon Key: ');
  env.SUPABASE_SERVICE_ROLE_KEY = await question('Supabase Service Role Key: ');

  // GraphQL
  console.log('\n🔌 GRAPHQL CONFIGURATION\n');
  env.NEXT_PUBLIC_GRAPHQL_ENDPOINT = 'http://localhost:3000/api/graphql';

  // Email
  console.log('\n📧 EMAIL CONFIGURATION (Resend)\n');
  env.RESEND_API_KEY = await question('Resend API Key (or skip): ') || '';
  env.FROM_EMAIL = await question('From Email (default: noreply@mgmapjscicentre.org): ') || 'noreply@mgmapjscicentre.org';

  // Payment
  console.log('\n💳 PAYMENT CONFIGURATION (Razorpay)\n');
  env.NEXT_PUBLIC_RAZORPAY_KEY_ID = await question('Razorpay Key ID (or skip): ') || '';
  env.RAZORPAY_KEY_SECRET = await question('Razorpay Key Secret (or skip): ') || '';
  env.RAZORPAY_WEBHOOK_SECRET = await question('Razorpay Webhook Secret (or skip): ') || '';

  // Google Maps
  console.log('\n🗺️  GOOGLE MAPS (Optional)\n');
  env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = await question('Google Maps API Key (or skip): ') || '';

  // Site
  console.log('\n🌐 SITE CONFIGURATION\n');
  env.NEXT_PUBLIC_SITE_URL = await question('Site URL (default: http://localhost:3000): ') || 'http://localhost:3000';
  env.NEXT_PUBLIC_SITE_NAME = 'MGM APJ Abdul Kalam Astrospace Science Centre';

  // Storage
  env.NEXT_PUBLIC_STORAGE_URL = env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1';

  // Feature Flags
  env.ENABLE_PAYMENTS = 'false';
  env.ENABLE_SMS_NOTIFICATIONS = 'false';
  env.ENABLE_REALTIME_UPDATES = 'true';

  // Environment
  env.NODE_ENV = 'development';

  // Create .env.local file
  const envContent = Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const envPath = path.join(process.cwd(), '.env.local');
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Environment file created: .env.local');
  console.log('\n📝 Next Steps:\n');
  console.log('1. Review .env.local and update any values');
  console.log('2. Run database migrations in Supabase SQL Editor');
  console.log('3. Create storage buckets in Supabase Dashboard');
  console.log('4. Run: npm run dev');
  console.log('5. Visit: http://localhost:3000\n');
  console.log('📚 Read DEPLOYMENT_GUIDE.md for complete instructions\n');

  rl.close();
}

setup().catch((error) => {
  console.error('Setup error:', error);
  rl.close();
  process.exit(1);
});






