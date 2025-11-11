import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCartSubtotals() {
  console.log('Fetching all cart items...');

  // Get all cart items
  const { data: cartItems, error: fetchError } = await supabase
    .from('cart_items')
    .select(`
      id,
      exhibition_id,
      show_id,
      adult_tickets,
      child_tickets,
      student_tickets,
      senior_tickets,
      total_tickets,
      subtotal
    `);

  if (fetchError) {
    console.error('Error fetching cart items:', fetchError);
    return;
  }

  if (!cartItems || cartItems.length === 0) {
    console.log('No cart items found');
    return;
  }

  console.log(`Found ${cartItems.length} cart items`);
  
  // Filter items with zero or near-zero subtotals
  const itemsToFix = cartItems.filter(item => parseFloat(item.subtotal) < 0.01);
  console.log(`${itemsToFix.length} items have zero subtotals and need fixing`);

  // Get pricing for exhibitions and shows
  const { data: pricingData, error: pricingError } = await supabase
    .from('pricing')
    .select('*')
    .eq('active', true);

  if (pricingError) {
    console.error('Error fetching pricing:', pricingError);
    return;
  }

  console.log(`Found ${pricingData?.length || 0} active pricing records`);

  // Calculate and update subtotals
  for (const item of itemsToFix) {
    let subtotal = 0;

    // Find pricing for this item by exhibition or show
    const itemPricing = pricingData?.filter(p => 
      (item.exhibition_id && p.exhibition_id === item.exhibition_id) ||
      (item.show_id && p.show_id === item.show_id)
    );

    if (itemPricing && itemPricing.length > 0) {
      // Calculate subtotal based on ticket types
      const ticketTypes = [
        { type: 'adult', count: item.adult_tickets || 0 },
        { type: 'child', count: item.child_tickets || 0 },
        { type: 'student', count: item.student_tickets || 0 },
        { type: 'senior', count: item.senior_tickets || 0 },
      ];

      for (const ticket of ticketTypes) {
        if (ticket.count > 0) {
          const price = itemPricing.find(p => p.ticket_type === ticket.type);
          if (price) {
            subtotal += ticket.count * parseFloat(price.price);
            console.log(`  ${ticket.type}: ${ticket.count} x ${price.price} = ${ticket.count * parseFloat(price.price)}`);
          }
        }
      }

      console.log(`Cart item ${item.id}: Calculated subtotal = ${subtotal}`);

      // Update the cart item
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ subtotal })
        .eq('id', item.id);

      if (updateError) {
        console.error(`Error updating cart item ${item.id}:`, updateError);
      } else {
        console.log(`✓ Updated cart item ${item.id} with subtotal ${subtotal}`);
      }
    } else {
      console.warn(`No pricing found for cart item ${item.id}`);
    }
  }

  console.log('Cart subtotals fix complete!');
}

fixCartSubtotals().catch(console.error);
