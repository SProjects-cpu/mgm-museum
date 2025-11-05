/**
 * E2E Test Data Setup Script
 * 
 * This script sets up test data required for end-to-end testing
 * of the PDF ticket generation feature.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TestData {
  userId: string;
  exhibitionId: string;
  timeSlotId: string;
  bookingId: string;
  paymentOrderId: string;
}

async function setupTestData(): Promise<TestData> {
  console.log('🔧 Setting up E2E test data...\n');

  try {
    // 1. Create or get test user
    console.log('1️⃣  Creating test user...');
    const testEmail = 'test-e2e@mgmmuseum.com';
    const testPassword = 'TestPassword123!';

    let userId: string;

    // Try to sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      // User doesn't exist, create it
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      if (signUpError || !signUpData.user) {
        throw new Error(`Failed to create test user: ${signUpError?.message}`);
      }

      userId = signUpData.user.id;
      console.log(`   ✅ Test user created: ${userId}`);
    } else {
      userId = signInData.user!.id;
      console.log(`   ✅ Test user exists: ${userId}`);
    }

    // 2. Create or get test exhibition
    console.log('\n2️⃣  Creating test exhibition...');
    
    const { data: existingExhibition } = await supabase
      .from('exhibitions')
      .select('id')
      .eq('title', 'E2E Test Exhibition')
      .single();

    let exhibitionId: string;

    if (existingExhibition) {
      exhibitionId = existingExhibition.id;
      console.log(`   ✅ Test exhibition exists: ${exhibitionId}`);
    } else {
      const { data: newExhibition, error: exhibitionError } = await supabase
        .from('exhibitions')
        .insert({
          title: 'E2E Test Exhibition',
          description: 'Test exhibition for E2E testing',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'active',
        })
        .select()
        .single();

      if (exhibitionError || !newExhibition) {
        throw new Error(`Failed to create test exhibition: ${exhibitionError?.message}`);
      }

      exhibitionId = newExhibition.id;
      console.log(`   ✅ Test exhibition created: ${exhibitionId}`);
    }

    // 3. Create or get test time slot
    console.log('\n3️⃣  Creating test time slot...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const slotDate = tomorrow.toISOString().split('T')[0];

    const { data: existingTimeSlot } = await supabase
      .from('time_slots')
      .select('id')
      .eq('exhibition_id', exhibitionId)
      .eq('slot_date', slotDate)
      .single();

    let timeSlotId: string;

    if (existingTimeSlot) {
      timeSlotId = existingTimeSlot.id;
      console.log(`   ✅ Test time slot exists: ${timeSlotId}`);
    } else {
      const { data: newTimeSlot, error: timeSlotError } = await supabase
        .from('time_slots')
        .insert({
          exhibition_id: exhibitionId,
          slot_date: slotDate,
          start_time: '10:00:00',
          end_time: '12:00:00',
          capacity: 50,
          available_spots: 50,
        })
        .select()
        .single();

      if (timeSlotError || !newTimeSlot) {
        throw new Error(`Failed to create test time slot: ${timeSlotError?.message}`);
      }

      timeSlotId = newTimeSlot.id;
      console.log(`   ✅ Test time slot created: ${timeSlotId}`);
    }

    // 4. Create test payment order
    console.log('\n4️⃣  Creating test payment order...');
    
    const razorpayOrderId = `order_test_${crypto.randomBytes(8).toString('hex')}`;
    const paymentId = `pay_test_${crypto.randomBytes(8).toString('hex')}`;

    const { data: paymentOrder, error: paymentOrderError } = await supabase
      .from('payment_orders')
      .insert({
        user_id: userId,
        razorpay_order_id: razorpayOrderId,
        amount: 500.00,
        currency: 'INR',
        status: 'paid',
        payment_id: paymentId,
        cart_snapshot: {
          items: [
            {
              timeSlotId: timeSlotId,
              exhibitionId: exhibitionId,
              bookingDate: slotDate,
              pricingTier: {
                id: 'tier_adult',
                name: 'Adult',
                price: 250,
              },
              quantity: 2,
              subtotal: 500,
            },
          ],
          total: 500,
        },
      })
      .select()
      .single();

    if (paymentOrderError || !paymentOrder) {
      throw new Error(`Failed to create test payment order: ${paymentOrderError?.message}`);
    }

    console.log(`   ✅ Test payment order created: ${paymentOrder.id}`);

    // 5. Create test booking
    console.log('\n5️⃣  Creating test booking...');
    
    const bookingReference = `BK${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        booking_reference: bookingReference,
        time_slot_id: timeSlotId,
        exhibition_id: exhibitionId,
        booking_date: slotDate,
        guest_name: 'Test User',
        guest_email: testEmail,
        guest_phone: '+91 9876543210',
        total_amount: 500.00,
        status: 'confirmed',
        payment_status: 'paid',
        payment_order_id: razorpayOrderId,
        payment_id: paymentId,
        payment_method: 'card',
      })
      .select()
      .single();

    if (bookingError || !booking) {
      throw new Error(`Failed to create test booking: ${bookingError?.message}`);
    }

    console.log(`   ✅ Test booking created: ${booking.id}`);
    console.log(`   📋 Booking Reference: ${bookingReference}`);
    console.log(`   💳 Payment ID: ${paymentId}`);

    // 6. Create test tickets
    console.log('\n6️⃣  Creating test tickets...');
    
    const tickets = [];
    for (let i = 0; i < 2; i++) {
      const ticketNumber = `TKT${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          booking_id: booking.id,
          ticket_number: ticketNumber,
          qr_code: bookingReference,
          status: 'active',
        })
        .select()
        .single();

      if (ticketError || !ticket) {
        throw new Error(`Failed to create test ticket: ${ticketError?.message}`);
      }

      tickets.push(ticket);
      console.log(`   ✅ Test ticket ${i + 1} created: ${ticket.id}`);
    }

    console.log('\n✅ Test data setup complete!\n');
    console.log('=' .repeat(60));
    console.log('\n📊 Test Data Summary:\n');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Exhibition ID: ${exhibitionId}`);
    console.log(`   Time Slot ID: ${timeSlotId}`);
    console.log(`   Booking ID: ${booking.id}`);
    console.log(`   Booking Reference: ${bookingReference}`);
    console.log(`   Payment ID: ${paymentId}`);
    console.log(`   Payment Order ID: ${paymentOrder.id}`);
    console.log(`   Tickets: ${tickets.length}`);
    console.log('\n=' .repeat(60));
    console.log('\n🚀 You can now run E2E tests with: npm run test:e2e\n');

    return {
      userId,
      exhibitionId,
      timeSlotId,
      bookingId: booking.id,
      paymentOrderId: paymentOrder.id,
    };

  } catch (error) {
    console.error('\n❌ Failed to setup test data:', error);
    throw error;
  }
}

// Run the setup
setupTestData()
  .then(() => {
    console.log('✅ Setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
