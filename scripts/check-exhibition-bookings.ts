/**
 * Check Exhibition Bookings
 * Checks if an exhibition has bookings before attempting deletion
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EXHIBITION_ID = '44d3a98d-faff-4dcf-a255-436cefdd97ef';

async function checkExhibitionBookings() {
  console.log('🔍 Checking Exhibition Bookings\n');
  console.log('═'.repeat(60));
  console.log(`Exhibition ID: ${EXHIBITION_ID}\n`);

  try {
    // Check bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, booking_reference, status, payment_status, created_at')
      .eq('exhibition_id', EXHIBITION_ID);

    if (bookingsError) {
      console.error('❌ Error checking bookings:', bookingsError);
      return;
    }

    console.log(`📊 Found ${bookings?.length || 0} bookings for this exhibition\n`);

    if (bookings && bookings.length > 0) {
      console.log('⚠️  This exhibition has bookings and CANNOT be deleted!\n');
      console.log('Bookings:');
      bookings.forEach((booking, index) => {
        console.log(`  ${index + 1}. ${booking.booking_reference}`);
        console.log(`     Status: ${booking.status}`);
        console.log(`     Payment: ${booking.payment_status}`);
        console.log(`     Created: ${booking.created_at}`);
        console.log('');
      });

      console.log('\n💡 To delete this exhibition, you must first:');
      console.log('   1. Cancel all bookings');
      console.log('   2. Or delete the bookings from the database');
      console.log('   3. Then try deleting the exhibition again');
    } else {
      console.log('✅ No bookings found - exhibition can be safely deleted');
    }

    // Check other dependencies
    console.log('\n📋 Checking other dependencies:\n');

    const { data: timeSlots } = await supabase
      .from('time_slots')
      .select('id')
      .eq('exhibition_id', EXHIBITION_ID);
    console.log(`  Time Slots: ${timeSlots?.length || 0}`);

    const { data: pricing } = await supabase
      .from('pricing')
      .select('id')
      .eq('exhibition_id', EXHIBITION_ID);
    console.log(`  Pricing: ${pricing?.length || 0}`);

    const { data: content } = await supabase
      .from('exhibition_content_sections')
      .select('id')
      .eq('exhibition_id', EXHIBITION_ID);
    console.log(`  Content Sections: ${content?.length || 0}`);

    const { data: cartItems } = await supabase
      .from('cart_items')
      .select('id')
      .eq('exhibition_id', EXHIBITION_ID);
    console.log(`  Cart Items: ${cartItems?.length || 0}`);

  } catch (error: any) {
    console.error('💥 Error:', error.message);
  }

  console.log('\n' + '═'.repeat(60));
}

checkExhibitionBookings()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
