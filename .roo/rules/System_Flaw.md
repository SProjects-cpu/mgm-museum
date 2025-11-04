Problem Scenario
A user visits your museum ticketing system and attempts to book tickets:

User Journey (Before Login):

User browses exhibitions
Selects tickets and adds them to cart
Cart appears to accept the items


Critical Failure Points:

After adding tickets, cart shows as empty
"Failed to load cart" errors appear
Checkout process cannot proceed
Previous selections are lost


User Experience Impact:

Frustrating booking experience
Lost sales opportunities
Users abandon the purchase process



Root Causes Identified
1. Authentication & Session Management
Error: 401 (Unauthorized) on manifest.json
Status: 500 on /api/cart/add
```
**Issue**: Cart operations require authentication, but guest/anonymous users cannot persist cart data.

### 2. **Database Schema Missing**
```
Error: "Could not find the table 'public.ticket_showcase_config' in the schema cache"
Code: PGRST205
```
**Issue**: Missing critical database table for ticket configuration.

### 3. **Seat Reservation Failure**
```
Error: "Failed to reserve seats"
Source: addItem function
```
**Issue**: Backend seat reservation logic failing, possibly due to:
- Race conditions
- Inventory sync issues
- Transaction rollbacks

### 4. **Routing Configuration Error**
```
Error: "You cannot use different slug names for the same dynamic path ('id' !== 'slug')"
```
**Issue**: Next.js routing conflict causing 504 timeouts.

### 5. **Realtime Sync Disabled**
```
Warning: "[Supabase] Realtime: DISABLED - Using polling for updates"
Issue: Cart updates not reflecting in real-time, creating desync between UI and database.
Solutions
Immediate Fixes (Priority 1)
1. Implement Guest Cart System
typescript// Option A: Browser-based guest cart (localStorage)
interface GuestCartItem {
  id: string;
  exhibitionId: string;
  ticketType: string;
  quantity: number;
  timestamp: number;
}

// Store guest cart locally
const saveGuestCart = (items: GuestCartItem[]) => {
  localStorage.setItem('guest_cart', JSON.stringify(items));
};

// Migrate on login
const migrateGuestCart = async (userId: string) => {
  const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
  await supabase.from('cart_items').insert(
    guestCart.map(item => ({ ...item, user_id: userId }))
  );
  localStorage.removeItem('guest_cart');
};
2. Create Missing Database Table
sql-- Create ticket_showcase_config table
CREATE TABLE public.ticket_showcase_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID REFERENCES exhibitions(id),
  display_order INTEGER,
  is_featured BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.ticket_showcase_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" 
  ON public.ticket_showcase_config 
  FOR SELECT 
  TO public 
  USING (true);
3. Fix API Route Error Handling
typescript// api/cart/add/route.ts
export async function POST(req: Request) {
  try {
    const { exhibitionId, ticketType, quantity } = await req.json();
    
    // Check authentication
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Guest cart not supported. Please login first.' },
        { status: 401 }
      );
    }

    // Implement proper seat reservation with retry logic
    const reservation = await reserveSeatsWithRetry(
      exhibitionId, 
      ticketType, 
      quantity
    );

    if (!reservation.success) {
      return NextResponse.json(
        { error: 'Seats unavailable', details: reservation.reason },
        { status: 409 }
      );
    }

    // Add to cart
    const cartItem = await addToCart(session.user.id, reservation);
    
    return NextResponse.json(cartItem, { status: 200 });
    
  } catch (error) {
    console.error('Cart add error:', error);
    return NextResponse.json(
      { error: 'Failed to add to cart', details: error.message },
      { status: 500 }
    );
  }
}
4. Fix Next.js Dynamic Route Conflict
bash# Check your file structure:
# ❌ WRONG: Having both
# pages/exhibitions/[id].tsx
# pages/exhibitions/[slug].tsx

# ✅ CORRECT: Use consistent naming
# pages/exhibitions/[id].tsx
# OR
# pages/exhibitions/[slug].tsx

# Update all route references to use the same parameter name
Short-term Improvements (Priority 2)
5. Enable Supabase Realtime
typescript// lib/supabase.ts
const supabase = createClient(url, key, {
  realtime: {
    enabled: true,
    params: {
      eventsPerSecond: 10
    }
  }
});

// Subscribe to cart changes
useEffect(() => {
  const channel = supabase
    .channel('cart_changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'cart_items',
        filter: `user_id=eq.${userId}`
      }, 
      (payload) => {
        // Update cart UI in real-time
        refreshCart();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [userId]);
6. Implement Optimistic UI Updates
typescriptconst addToCart = async (item: CartItem) => {
  // Immediately update UI
  setCartItems(prev => [...prev, { ...item, status: 'pending' }]);
  
  try {
    const result = await fetch('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify(item)
    });
    
    if (!result.ok) throw new Error('Failed to add');
    
    // Confirm success
    setCartItems(prev => 
      prev.map(i => i.id === item.id ? { ...i, status: 'confirmed' } : i)
    );
  } catch (error) {
    // Rollback on failure
    setCartItems(prev => prev.filter(i => i.id !== item.id));
    showError('Failed to add to cart. Please try again.');
  }
};
Long-term Architecture (Priority 3)
7. Implement Proper Session-based Cart
typescript// Use session ID for guest users
const getOrCreateSession = async () => {
  let sessionId = cookies.get('cart_session_id');
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    cookies.set('cart_session_id', sessionId, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: true
    });
  }
  
  return sessionId;
};

// Database schema
CREATE TABLE cart_sessions (
  session_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES cart_sessions(session_id),
  -- rest of fields
);
Testing Checklist

 Guest users can add items to cart (localStorage)
 Cart persists across page refreshes
 Login migrates guest cart to user account
 Real-time updates reflect immediately
 Seat reservations handle concurrent requests
 Error messages are user-friendly
 Checkout validates cart before proceeding
 All API routes return proper HTTP status codes

Monitoring Recommendations
typescript// Add error tracking
import * as Sentry from '@sentry/nextjs';

try {
  // cart operations
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'cart',
      operation: 'add_item'
    },
    extra: {
      exhibitionId,
      userId: session?.user?.id
    }
  });
}