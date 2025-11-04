/**
 * Razorpay Setup Verification Script
 * Verifies that Razorpay integration is properly configured
 */

import { 
  validateRazorpayConfig, 
  getConfigErrorMessage,
  isRazorpayConfigured,
  getRazorpayConfig 
} from '../lib/razorpay/config';

async function verifyRazorpaySetup() {
  console.log('🔍 Verifying Razorpay Setup...\n');

  // Check configuration
  console.log('1. Checking environment variables...');
  const validation = validateRazorpayConfig();
  
  if (!validation.valid) {
    console.error('❌ Configuration Error:');
    console.error(getConfigErrorMessage());
    console.log('\n📝 Required environment variables:');
    console.log('   - NEXT_PUBLIC_RAZORPAY_KEY_ID');
    console.log('   - RAZORPAY_KEY_SECRET');
    console.log('   - RAZORPAY_WEBHOOK_SECRET');
    process.exit(1);
  }

  console.log('✅ All environment variables are set\n');

  // Check configuration details
  const config = getRazorpayConfig();
  console.log('2. Configuration Details:');
  console.log(`   Environment: ${config.environment}`);
  console.log(`   Currency: ${config.currency}`);
  console.log(`   Key ID: ${config.keyId.substring(0, 15)}...`);
  console.log('✅ Configuration loaded successfully\n');

  // Check if configured
  if (!isRazorpayConfigured()) {
    console.error('❌ Razorpay is not properly configured');
    process.exit(1);
  }

  console.log('3. Testing Razorpay utilities...');
  
  // Test utilities
  const { 
    formatAmountForRazorpay, 
    formatAmountFromRazorpay,
    generateReceipt,
    generateBookingReference,
    isValidOrderId,
    isValidPaymentId,
    formatCurrency 
  } = await import('../lib/razorpay/utils');

  // Test amount conversion
  const amountInRupees = 500;
  const amountInPaise = formatAmountForRazorpay(amountInRupees);
  const convertedBack = formatAmountFromRazorpay(amountInPaise);
  
  if (amountInPaise !== 50000 || convertedBack !== 500) {
    console.error('❌ Amount conversion failed');
    process.exit(1);
  }
  console.log('   ✓ Amount conversion working');

  // Test receipt generation
  const receipt = generateReceipt('test');
  if (!receipt.startsWith('test_')) {
    console.error('❌ Receipt generation failed');
    process.exit(1);
  }
  console.log('   ✓ Receipt generation working');

  // Test booking reference generation
  const bookingRef = generateBookingReference();
  if (!bookingRef.startsWith('BK')) {
    console.error('❌ Booking reference generation failed');
    process.exit(1);
  }
  console.log('   ✓ Booking reference generation working');

  // Test ID validation
  if (!isValidOrderId('order_ABC123') || isValidOrderId('invalid')) {
    console.error('❌ Order ID validation failed');
    process.exit(1);
  }
  console.log('   ✓ Order ID validation working');

  if (!isValidPaymentId('pay_XYZ789') || isValidPaymentId('invalid')) {
    console.error('❌ Payment ID validation failed');
    process.exit(1);
  }
  console.log('   ✓ Payment ID validation working');

  // Test currency formatting
  const formatted = formatCurrency(500);
  if (!formatted.includes('500')) {
    console.error('❌ Currency formatting failed');
    process.exit(1);
  }
  console.log('   ✓ Currency formatting working');

  console.log('✅ All utilities working correctly\n');

  // Check API endpoints
  console.log('4. Checking API endpoints...');
  const endpoints = [
    '/api/payment/create-order',
    '/api/payment/verify',
    '/api/payment/failure',
    '/api/webhooks/razorpay',
    '/api/tickets/generate',
    '/api/admin/bookings',
    '/api/admin/bookings/export',
    '/api/user/bookings',
  ];

  const fs = await import('fs');
  const path = await import('path');

  for (const endpoint of endpoints) {
    const filePath = path.join(process.cwd(), 'app', endpoint, 'route.ts');
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Missing endpoint: ${endpoint}`);
      process.exit(1);
    }
  }
  console.log('✅ All API endpoints exist\n');

  // Check services
  console.log('5. Checking services...');
  const services = [
    'lib/services/ticket-generator.ts',
    'lib/services/excel-export.ts',
    'lib/services/payment-logger.ts',
  ];

  for (const service of services) {
    const filePath = path.join(process.cwd(), service);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Missing service: ${service}`);
      process.exit(1);
    }
  }
  console.log('✅ All services exist\n');

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎉 Razorpay Setup Verification Complete!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n✅ Configuration: Valid');
  console.log('✅ Utilities: Working');
  console.log('✅ API Endpoints: Present');
  console.log('✅ Services: Present');
  console.log('\n📋 Next Steps:');
  console.log('   1. Configure webhook in Razorpay Dashboard');
  console.log('   2. Test payment flow in development');
  console.log('   3. Deploy to production');
  console.log('   4. Switch to live Razorpay keys');
  console.log('\n📚 Documentation: RAZORPAY_INTEGRATION_COMPLETE.md');
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run verification
verifyRazorpaySetup().catch((error) => {
  console.error('\n❌ Verification failed:', error.message);
  process.exit(1);
});
