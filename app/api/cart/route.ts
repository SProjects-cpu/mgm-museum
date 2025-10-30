// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import crypto from 'crypto';

function generateId(length: number = 10): string {
  return crypto.randomBytes(length).toString('hex').substring(0, length).toUpperCase();
}

// GET - Fetch cart
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get('cartId');
    const sessionId = searchParams.get('sessionId');

    if (!cartId && !sessionId) {
      return NextResponse.json({ error: 'Cart ID or Session ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    let query = supabase
      .from('booking_carts')
      .select(`
        *,
        items:cart_items(
          *,
          exhibition:exhibitions(id, name, category),
          show:shows(id, name, type),
          time_slot:time_slots(*)
        )
      `)
      .eq('status', 'active');

    if (cartId) {
      query = query.eq('cart_id', cartId);
    } else {
      query = query.eq('session_id', sessionId);
    }

    const { data: cart, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ cart: null });
      }
      throw error;
    }

    // Check if cart is expired
    if (cart && new Date(cart.expires_at) < new Date()) {
      await supabase
        .from('booking_carts')
        .update({ status: 'expired' })
        .eq('id', cart.id);

      return NextResponse.json({ cart: null, expired: true });
    }

    return NextResponse.json({ cart });
  } catch (error: any) {
    console.error('Cart GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create or add to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartId, sessionId, userId, item } = body;

    if (!item) {
      return NextResponse.json({ error: 'Item is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Find or create cart
    let cart;
    if (cartId) {
      const { data } = await supabase
        .from('booking_carts')
        .select('*')
        .eq('cart_id', cartId)
        .eq('status', 'active')
        .single();
      cart = data;
    }

    if (!cart) {
      // Create new cart
      const newCartId = `CART-${generateId(10)}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      const { data: newCart, error: cartError } = await supabase
        .from('booking_carts')
        .insert({
          cart_id: newCartId,
          user_id: userId || null,
          session_id: sessionId || generateId(16),
          status: 'active',
          expires_at: expiresAt
        })
        .select()
        .single();

      if (cartError) throw cartError;
      cart = newCart;
    }

    // Add item to cart
    const { data: cartItem, error: itemError } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cart.cart_id,
        exhibition_id: item.exhibitionId || null,
        show_id: item.showId || null,
        time_slot_id: item.timeSlotId,
        booking_date: item.bookingDate,
        adult_tickets: item.adultTickets || 0,
        child_tickets: item.childTickets || 0,
        student_tickets: item.studentTickets || 0,
        senior_tickets: item.seniorTickets || 0,
        total_tickets: item.totalTickets,
        subtotal: item.subtotal || 0
      })
      .select()
      .single();

    if (itemError) throw itemError;

    // Update cart totals
    const { data: items } = await supabase
      .from('cart_items')
      .select('subtotal')
      .eq('cart_id', cart.cart_id);

    const total = items?.reduce((sum, i) => sum + parseFloat(i.subtotal || 0), 0) || 0;

    await supabase
      .from('booking_carts')
      .update({ 
        subtotal: total,
        total_amount: total,
        updated_at: new Date().toISOString()
      })
      .eq('cart_id', cart.cart_id);

    return NextResponse.json({ 
      success: true,
      cartId: cart.cart_id,
      itemId: cartItem.id
    });
  } catch (error: any) {
    console.error('Cart POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove item or clear cart
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get('cartId');
    const itemId = searchParams.get('itemId');

    if (!cartId) {
      return NextResponse.json({ error: 'Cart ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    if (itemId) {
      // Remove specific item
      await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      // Recalculate cart totals
      const { data: items } = await supabase
        .from('cart_items')
        .select('subtotal')
        .eq('cart_id', cartId);

      const total = items?.reduce((sum, i) => sum + parseFloat(i.subtotal || 0), 0) || 0;

      await supabase
        .from('booking_carts')
        .update({ 
          subtotal: total,
          total_amount: total,
          updated_at: new Date().toISOString()
        })
        .eq('cart_id', cartId);
    } else {
      // Clear entire cart
      await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      await supabase
        .from('booking_carts')
        .update({ 
          status: 'abandoned',
          updated_at: new Date().toISOString()
        })
        .eq('cart_id', cartId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
