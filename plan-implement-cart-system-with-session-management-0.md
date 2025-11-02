I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

## Current State Analysis

**Existing Infrastructure:**
- Zustand stores use `persist` middleware with localStorage (pattern: `name: "mgm-{store}-storage"`)
- All stores follow consistent pattern: `create<State>()(persist((set, get) => ({...}), { name: "..." }))`
- Supabase client available via `lib/supabase/config.ts` with `supabase` (client) and `getServiceSupabase()` (server)
- Auth state accessible via `supabase.auth.getUser()` and `getCurrentUserProfile()` helper
- Toast notifications via `sonner` library (imported as `toast` from "sonner")
- Badge component available at `components/ui/badge.tsx`
- Database schema has `bookings` table with `status` enum ('pending', 'confirmed', 'cancelled', 'completed')
- `time_slots` table exists but **does NOT have** `slot_date`, `current_bookings`, or `buffer_capacity` columns in base schema
- API routes reference these fields, suggesting they may be added in a later migration or are computed
- No existing cart-related tables or functionality

**Key Findings:**
1. The `time_slots` table in base schema only has: `id`, `exhibition_id`, `show_id`, `day_of_week`, `start_time`, `end_time`, `capacity`, `active`, `metadata`, `created_at`
2. API routes (`bookings-new/time-slots/route.ts`) reference `slot_date`, `current_bookings`, `buffer_capacity` - these must be added
3. No cart persistence mechanism exists in database
4. Booking flow currently goes directly from form submission to booking creation
5. `BookingBasket` type exists in `types/booking-new.ts` but is unused
6. Museum is closed on Mondays (day_of_week = 1)

**Technical Constraints:**
- 15-minute cart expiration requirement
- Need to support both guest (localStorage) and authenticated user (database) carts
- Must release seats when cart expires or items are removed
- Real-time sync with admin panel required
- Free admission currently (totalAmount = 0), but structure must support paid tickets


### Approach

## Implementation Strategy

**Phase 1: Database Schema Updates**
Add missing columns to `time_slots` table and create `cart_items` table for authenticated user cart persistence.

**Phase 2: Cart Store with Zustand**
Create a Zustand store following existing patterns with localStorage persistence for guests and database sync for authenticated users.

**Phase 3: Cart API Endpoints**
Build API routes for cart operations (add, remove, clear, sync) and seat reservation management.

**Phase 4: UI Components**
Update navbar with cart icon/badge, create cart page, and modify booking flow to add-to-cart instead of direct booking.

**Phase 5: Expiration & Cleanup**
Implement cart expiration mechanism with automatic seat release and countdown timers.

**Architecture Decisions:**
- Use `status: 'pending'` in bookings table for cart items (temporary holds)
- Store cart in Zustand with localStorage for guests
- Sync to `cart_items` table when user authenticates
- Use `expiresAt` timestamp for 15-minute expiration
- Implement cleanup via API endpoint called on expiration
- Cart items reference time_slot_id for seat locking


### Reasoning

Explored existing Zustand store patterns in `lib/store/` to understand persistence approach. Examined database schema in `supabase/migrations/00001_initial_schema.sql` and discovered missing columns referenced in API routes. Reviewed booking flow in `app/(public)/book-visit/page.tsx` and booking components. Checked Supabase client configuration and auth helpers. Analyzed API routes for time slots and availability to understand capacity management. Confirmed toast library (sonner) and Badge component availability. Identified that `BookingBasket` type exists but is unused.


## Mermaid Diagram

sequenceDiagram
    participant User
    participant BookingPage
    participant CartStore
    participant CartAPI
    participant Database
    participant Navbar
    
    User->>BookingPage: Select date, time, tickets
    BookingPage->>CartStore: addItem(cartData)
    
    alt User Authenticated
        CartStore->>CartAPI: POST /api/cart/add
        CartAPI->>Database: Reserve seats (increment current_bookings)
        CartAPI->>Database: Insert cart_item (expires in 15 min)
        Database-->>CartAPI: Cart item created
        CartAPI-->>CartStore: Success with cart item
    else Guest User
        CartStore->>CartStore: Save to localStorage
    end
    
    CartStore-->>BookingPage: Item added
    BookingPage->>User: Show success + redirect to cart
    
    User->>Navbar: View cart badge
    Navbar->>CartStore: getItemCount()
    CartStore-->>Navbar: Display count
    
    User->>CartPage: Navigate to /cart
    CartPage->>CartStore: Get items
    CartStore-->>CartPage: Display cart items
    
    loop Every 30 seconds
        CartPage->>CartStore: checkExpiredItems()
        CartStore->>CartAPI: POST /api/cart/cleanup-expired
        CartAPI->>Database: Delete expired items
        CartAPI->>Database: Release seats (decrement current_bookings)
    end
    
    User->>CartPage: Remove item
    CartPage->>CartStore: removeItem(itemId)
    CartStore->>CartAPI: POST /api/cart/remove
    CartAPI->>Database: Delete cart_item
    CartAPI->>Database: Release seats
    CartAPI-->>CartStore: Success
    CartStore-->>CartPage: Item removed
    
    User->>CartPage: Proceed to checkout
    CartPage->>User: Navigate to checkout (Phase 2)

## Proposed File Changes

### supabase\migrations\00006_cart_system.sql(NEW)

References: 

- supabase\migrations\00001_initial_schema.sql

Create new migration file to add cart system support:

1. **Alter time_slots table** to add missing columns:
   - `slot_date DATE` - specific date for the time slot
   - `current_bookings INTEGER DEFAULT 0` - track current booking count
   - `buffer_capacity INTEGER DEFAULT 5` - buffer for overbooking prevention
   - Add index on `slot_date` for performance

2. **Create cart_items table** for authenticated user cart persistence:
   - `id UUID PRIMARY KEY`
   - `user_id UUID REFERENCES users(id) ON DELETE CASCADE`
   - `time_slot_id UUID REFERENCES time_slots(id) ON DELETE CASCADE`
   - `exhibition_id UUID REFERENCES exhibitions(id)`
   - `show_id UUID REFERENCES shows(id)`
   - `exhibition_name TEXT` - denormalized for display
   - `show_name TEXT` - denormalized for display
   - `booking_date DATE NOT NULL`
   - `adult_tickets INTEGER DEFAULT 0`
   - `child_tickets INTEGER DEFAULT 0`
   - `student_tickets INTEGER DEFAULT 0`
   - `senior_tickets INTEGER DEFAULT 0`
   - `total_tickets INTEGER NOT NULL`
   - `subtotal DECIMAL(10, 2) DEFAULT 0`
   - `expires_at TIMESTAMP WITH TIME ZONE NOT NULL`
   - `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
   - Add constraint: `CHECK (exhibition_id IS NOT NULL OR show_id IS NOT NULL)`
   - Add index on `user_id`, `expires_at`

3. **Enable RLS** on cart_items:
   - Policy: Users can view/manage own cart items
   - Policy: System can clean up expired items

4. **Create cleanup function** `cleanup_expired_cart_items()` to automatically remove expired cart items and release seats

5. **Add trigger** to decrement `current_bookings` when cart items are deleted

### types\booking-new.ts(MODIFY)

Extend existing types to support cart functionality:

1. **Update BookingBasket interface** (currently unused) to match cart requirements:
   - Add `id: string` for cart item identification
   - Add `timeSlot: TimeSlot` for complete slot information
   - Add `bookingDate: string` for the selected date
   - Add `exhibitionName?: string` and `showName?: string` for display
   - Add `expiresAt: Date` for expiration tracking
   - Keep existing fields: `admissionTickets`, `exhibitionTickets`, `subtotal`, `discount`, `total`

2. **Create CartItem interface** as simplified version:
   ```typescript
   interface CartItem {
     id: string;
     timeSlotId: string;
     exhibitionId?: string;
     showId?: string;
     exhibitionName?: string;
     showName?: string;
     bookingDate: string;
     timeSlot: TimeSlot;
     tickets: TicketQuantities;
     totalTickets: number;
     subtotal: number;
     expiresAt: Date;
     createdAt: Date;
   }
   ```

3. **Create CartState interface** for store:
   ```typescript
   interface CartState {
     items: CartItem[];
     isLoading: boolean;
     error: string | null;
   }
   ```

4. **Export new types** for use across the application

### lib\store\cart.ts(NEW)

References: 

- lib\store\exhibitions.ts
- lib\store\events.ts
- lib\supabase\config.ts

Create new Zustand store for cart management following the pattern from `lib/store/exhibitions.ts` and `lib/store/events.ts`:

1. **Import dependencies**: `create` from zustand, `persist` from zustand/middleware, types from `@/types/booking-new`, `supabase` from `@/lib/supabase/config`, `toast` from sonner

2. **Define CartStore interface** with methods:
   - `items: CartItem[]` - array of cart items
   - `isLoading: boolean` - loading state
   - `error: string | null` - error state
   - `addItem: (item: Omit<CartItem, 'id' | 'createdAt' | 'expiresAt'>) => Promise<void>` - add item to cart
   - `removeItem: (itemId: string) => Promise<void>` - remove item from cart
   - `clearCart: () => Promise<void>` - clear all items
   - `updateItemExpiration: (itemId: string) => void` - extend expiration (optional)
   - `getItemCount: () => number` - total items in cart
   - `getTotalTickets: () => number` - total tickets across all items
   - `getCartTotal: () => number` - total amount
   - `syncWithServer: () => Promise<void>` - sync guest cart to server on login
   - `loadFromServer: () => Promise<void>` - load cart from server for authenticated users
   - `checkExpiredItems: () => void` - check and remove expired items

3. **Implement addItem logic**:
   - Generate unique ID using `Date.now().toString() + Math.random()`
   - Set `expiresAt` to 15 minutes from now
   - Check if user is authenticated via `supabase.auth.getUser()`
   - If authenticated: call API to reserve seat and save to database
   - If guest: save to localStorage only
   - Update store state
   - Show success toast
   - Handle errors with toast notifications

4. **Implement removeItem logic**:
   - Find item in cart
   - If authenticated: call API to release seat and remove from database
   - If guest: remove from localStorage
   - Update store state
   - Show success toast

5. **Implement clearCart logic**:
   - If authenticated: call API to release all seats and clear database
   - If guest: clear localStorage
   - Reset store state

6. **Implement syncWithServer logic** (called after login):
   - Get current localStorage items
   - Call API to sync items to database
   - Update store with server response
   - Clear localStorage after successful sync

7. **Implement checkExpiredItems logic**:
   - Filter items where `expiresAt < new Date()`
   - For each expired item, call removeItem
   - Show toast notification for expired items

8. **Use persist middleware** with name `mgm-cart-storage` following pattern from other stores

9. **Add useEffect-like initialization** to check expired items on store creation

### app\api\cart\add\route.ts(NEW)

References: 

- app\api\bookings-new\create\route.ts
- lib\supabase\config.ts

Create API endpoint to add item to cart with seat reservation:

1. **POST handler** accepting:
   - `timeSlotId: string`
   - `bookingDate: string`
   - `exhibitionId?: string`
   - `showId?: string`
   - `tickets: TicketQuantities`
   - `totalTickets: number`

2. **Validate request**:
   - Check required fields
   - Validate ticket quantities > 0

3. **Get authenticated user** via `supabase.auth.getUser()`

4. **Check time slot availability**:
   - Query `time_slots` table for the slot
   - Calculate available capacity: `capacity - current_bookings - buffer_capacity`
   - Return error if insufficient capacity

5. **Reserve seats** by incrementing `current_bookings`:
   - Use Supabase update with optimistic locking
   - Handle race conditions

6. **If user authenticated**:
   - Insert into `cart_items` table with 15-minute expiration
   - Fetch exhibition/show name for denormalization

7. **Return response** with:
   - `success: boolean`
   - `cartItem: CartItem` (if authenticated)
   - `message: string`

8. **Error handling**: Rollback seat reservation on failure

### app\api\cart\remove\route.ts(NEW)

References: 

- lib\supabase\config.ts

Create API endpoint to remove item from cart and release seats:

1. **POST handler** accepting:
   - `itemId: string` (cart item ID)
   - `timeSlotId: string`
   - `totalTickets: number`

2. **Get authenticated user** via `supabase.auth.getUser()`

3. **If user authenticated**:
   - Delete from `cart_items` table where `id = itemId AND user_id = user.id`

4. **Release seats** by decrementing `current_bookings` in `time_slots` table:
   - Use Supabase update: `current_bookings = current_bookings - totalTickets`
   - Ensure `current_bookings` doesn't go below 0

5. **Return response**:
   - `success: boolean`
   - `message: string`

6. **Error handling**: Log errors and return appropriate status codes

### app\api\cart\clear\route.ts(NEW)

References: 

- lib\supabase\config.ts

Create API endpoint to clear entire cart and release all seats:

1. **POST handler** with no body required

2. **Get authenticated user** via `supabase.auth.getUser()`

3. **Fetch all user's cart items** from `cart_items` table

4. **For each cart item**:
   - Decrement `current_bookings` in `time_slots` table

5. **Delete all cart items** for the user

6. **Return response**:
   - `success: boolean`
   - `message: string`
   - `itemsCleared: number`

7. **Error handling**: Use transaction if possible, or handle partial failures gracefully

### app\api\cart\sync\route.ts(NEW)

References: 

- app\api\cart\add\route.ts(NEW)
- lib\supabase\config.ts

Create API endpoint to sync guest cart to authenticated user's cart:

1. **POST handler** accepting:
   - `items: CartItem[]` - guest cart items from localStorage

2. **Get authenticated user** via `supabase.auth.getUser()` - return 401 if not authenticated

3. **For each item in guest cart**:
   - Validate time slot still available
   - Check if seats are still available
   - Reserve seats by incrementing `current_bookings`
   - Insert into `cart_items` table with new expiration (15 min from now)
   - Fetch exhibition/show names

4. **Handle conflicts**:
   - If seat no longer available, skip item and add to `skippedItems` array
   - If item expired, skip and add to `expiredItems` array

5. **Return response**:
   - `success: boolean`
   - `syncedItems: CartItem[]` - successfully synced items
   - `skippedItems: { item: CartItem, reason: string }[]`
   - `message: string`

6. **Error handling**: Rollback seat reservations on failure

### app\api\cart\load\route.ts(NEW)

References: 

- lib\supabase\config.ts
- app\api\bookings-new\availability\route.ts

Create API endpoint to load cart from database for authenticated users:

1. **GET handler** with no parameters

2. **Get authenticated user** via `supabase.auth.getUser()` - return 401 if not authenticated

3. **Query cart_items table**:
   - Filter by `user_id = user.id`
   - Filter by `expires_at > NOW()` to exclude expired items
   - Join with `time_slots` to get slot details
   - Order by `created_at DESC`

4. **Transform database records to CartItem format**:
   - Map snake_case to camelCase
   - Parse ticket quantities
   - Include time slot information

5. **Return response**:
   - `success: boolean`
   - `items: CartItem[]`

6. **Error handling**: Return empty array on error with appropriate status

### app\api\cart\cleanup-expired\route.ts(NEW)

References: 

- lib\supabase\config.ts

Create API endpoint to cleanup expired cart items (can be called by cron or manually):

1. **POST handler** with optional authentication (can be called by system)

2. **Query expired cart items**:
   - Select from `cart_items` where `expires_at < NOW()`
   - Include `time_slot_id` and `total_tickets`

3. **For each expired item**:
   - Decrement `current_bookings` in `time_slots` table
   - Delete from `cart_items` table

4. **Return response**:
   - `success: boolean`
   - `cleanedCount: number`
   - `message: string`

5. **Error handling**: Log errors but continue processing remaining items

### components\layout\navbar.tsx(MODIFY)

Add cart icon with badge to navbar:

1. **Import dependencies**:
   - `ShoppingCart` icon from lucide-react
   - `useCartStore` from `@/lib/store/cart`
   - `Badge` from `@/components/ui/badge`
   - `useEffect` from react

2. **Add cart state** in component:
   - `const { items, getItemCount, checkExpiredItems } = useCartStore()`
   - `const [cartCount, setCartCount] = useState(0)`

3. **Add useEffect** to update cart count and check expired items:
   - Call `checkExpiredItems()` on mount and every 30 seconds
   - Update `cartCount` when items change

4. **Add cart button** in Desktop Actions section (after Login button, before Book Tickets):
   - Button with `variant="ghost"` and `size="sm"`
   - Link to `/cart` using Next.js Link
   - ShoppingCart icon
   - Badge showing count if `cartCount > 0`
   - Position badge absolutely in top-right of icon
   - Style badge with `variant="destructive"` and small size

5. **Add cart button** in Mobile Menu section:
   - Similar structure but full width
   - Place after navigation links, before Login/Book Tickets

6. **Handle cart count display**:
   - Show badge only when count > 0
   - Use `{cartCount}` for display
   - Add animation on count change (optional)

7. **Styling**:
   - Match existing button styles
   - Ensure cart icon is visible in both scrolled and non-scrolled states
   - Badge should be clearly visible with high contrast

### app\(public)\cart\page.tsx(NEW)

References: 

- app\(public)\book-visit\page.tsx(MODIFY)
- components\booking-new\BookingSummary.tsx

Create cart review page at `/cart` route:

1. **Mark as client component** with `'use client'`

2. **Import dependencies**:
   - React hooks: `useState`, `useEffect`
   - Next.js: `useRouter`, `Link`
   - UI components: `Card`, `Button`, `Badge`, `Separator`
   - Icons: `ShoppingCart`, `Trash2`, `Clock`, `Calendar`, `Users`, `ArrowRight`, `AlertCircle`
   - Store: `useCartStore`
   - Utils: `formatTime`, `formatDate` from `@/lib/utils`
   - Toast: `toast` from sonner
   - Motion: `motion`, `AnimatePresence` from framer-motion

3. **Component state**:
   - `const { items, removeItem, clearCart, isLoading, checkExpiredItems } = useCartStore()`
   - `const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({})`
   - `const router = useRouter()`

4. **Implement countdown timer** using useEffect:
   - Update every second
   - Calculate remaining time for each item: `Math.max(0, expiresAt - now)`
   - When item expires, call `checkExpiredItems()`
   - Format as MM:SS

5. **Render empty state** when `items.length === 0`:
   - Center-aligned message
   - ShoppingCart icon (large, muted)
   - "Your cart is empty" heading
   - "Add items to your cart to get started" description
   - Button to "Browse Exhibitions" linking to `/exhibitions`

6. **Render cart items** when items exist:
   - Header with "Your Cart" title and item count badge
   - "Clear Cart" button (destructive variant)
   - Map through items, each in a Card:
     - Exhibition/Show name as heading
     - Date and time slot information with icons
     - Ticket breakdown (Adult, Child, Student, Senior) with quantities
     - Countdown timer with Clock icon (warning color when < 5 min)
     - Subtotal display
     - Remove button (icon only, destructive)
   - Use AnimatePresence for smooth removal animations

7. **Render cart summary** (sticky sidebar or bottom section):
   - Total items count
   - Total tickets count
   - Subtotal (currently ₹0 for free admission)
   - Taxes/fees (if applicable)
   - Grand total
   - "Proceed to Checkout" button (primary, full width)
   - Info message about free admission

8. **Handle remove item**:
   - Show confirmation toast
   - Call `removeItem(itemId)`
   - Show success/error toast

9. **Handle clear cart**:
   - Show confirmation dialog (optional)
   - Call `clearCart()`
   - Show success toast

10. **Handle checkout**:
   - Navigate to `/cart/checkout` or trigger authentication modal
   - Pass cart data via router state or context

11. **Responsive design**:
   - Grid layout on desktop (items + summary sidebar)
   - Stacked layout on mobile
   - Sticky summary on desktop

12. **Loading states**: Show skeleton loaders when `isLoading`

### app\(public)\book-visit\page.tsx(MODIFY)

Update booking flow to add items to cart instead of direct booking:

1. **Import cart store**: `import { useCartStore } from '@/lib/store/cart'`

2. **Add cart store to component**: `const { addItem } = useCartStore()`

3. **Update handleSubmit function** (currently creates booking directly):
   - Remove direct booking creation API call
   - Instead, call `addItem()` with cart item data:
     ```typescript
     await addItem({
       timeSlotId: selectedSlot.id,
       exhibitionId,
       showId,
       exhibitionName,
       showName,
       bookingDate: selectedDate.toISOString().split('T')[0],
       timeSlot: selectedSlot,
       tickets,
       totalTickets,
       subtotal: 0
     })
     ```
   - Show success toast: "Added to cart!"
   - Redirect to `/cart` or show option to continue booking

4. **Update confirmation step** (currently shows booking reference):
   - Change to "Added to Cart" confirmation
   - Show cart icon with success animation
   - Display "Item added to your cart" message
   - Show countdown timer (15 minutes)
   - Buttons:
     - "View Cart" (primary) → navigate to `/cart`
     - "Continue Booking" (secondary) → reset form
     - "Proceed to Checkout" (primary) → navigate to `/cart`

5. **Update step labels** if needed:
   - Keep existing steps: date → time → tickets → details
   - Final step becomes "Add to Cart" instead of "Confirmation"

6. **Update button text** in details step:
   - Change from "Confirm Booking" to "Add to Cart"

7. **Handle errors** from addItem:
   - Show error toast with specific message
   - Allow user to retry or go back

8. **Remove booking reference state** as it's no longer needed at this stage

### components\cart\CartItemCard.tsx(NEW)

References: 

- components\booking-new\BookingSummary.tsx

Create reusable cart item card component:

1. **Mark as client component** with `'use client'`

2. **Import dependencies**:
   - UI components: `Card`, `CardContent`, `Button`, `Badge`
   - Icons: `Calendar`, `Clock`, `Users`, `Trash2`, `AlertCircle`
   - Types: `CartItem` from `@/types/booking-new`
   - Utils: `formatTime`, `formatDate`, `formatCurrency` from `@/lib/utils`

3. **Define props interface**:
   ```typescript
   interface CartItemCardProps {
     item: CartItem;
     timeRemaining: number; // in seconds
     onRemove: (itemId: string) => void;
     isRemoving?: boolean;
   }
   ```

4. **Component structure**:
   - Card with hover effect
   - Header section:
     - Exhibition/Show name (bold, large)
     - Remove button (icon, top-right)
   - Content section:
     - Date with Calendar icon
     - Time slot with Clock icon
     - Ticket breakdown with Users icon
     - Each ticket type (Adult, Child, etc.) with quantity
   - Footer section:
     - Countdown timer with warning styling if < 5 min
     - Subtotal display

5. **Format countdown timer**:
   - Convert seconds to MM:SS format
   - Show in Badge component
   - Color: default if > 5 min, warning if 2-5 min, destructive if < 2 min
   - Add Clock icon

6. **Handle remove click**:
   - Call `onRemove(item.id)`
   - Disable button when `isRemoving`
   - Show loading spinner on button when removing

7. **Styling**:
   - Responsive padding
   - Clear visual hierarchy
   - Smooth transitions
   - Warning state for expiring items

### components\cart\CartSummary.tsx(NEW)

References: 

- components\booking-new\BookingSummary.tsx

Create cart summary component for totals and checkout:

1. **Mark as client component** with `'use client'`

2. **Import dependencies**:
   - UI components: `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Button`, `Separator`
   - Icons: `ShoppingCart`, `ArrowRight`, `Info`
   - Types: `CartItem` from `@/types/booking-new`
   - Utils: `formatCurrency` from `@/lib/utils`

3. **Define props interface**:
   ```typescript
   interface CartSummaryProps {
     items: CartItem[];
     onCheckout: () => void;
     isLoading?: boolean;
   }
   ```

4. **Calculate totals**:
   - Total items: `items.length`
   - Total tickets: sum of all `totalTickets`
   - Subtotal: sum of all `subtotal`
   - Tax/fees: calculate if applicable (currently 0)
   - Grand total: subtotal + tax/fees

5. **Component structure**:
   - Card with sticky positioning (desktop)
   - Header: "Order Summary" title
   - Content:
     - Items count display
     - Tickets count display
     - Separator
     - Subtotal row
     - Tax/fees row (if applicable)
     - Separator
     - Grand total row (bold, large)
     - Info message about free admission
     - Checkout button (primary, full width, with arrow icon)

6. **Checkout button**:
   - Disabled when `items.length === 0` or `isLoading`
   - Show loading spinner when `isLoading`
   - Call `onCheckout` on click

7. **Styling**:
   - Sticky on desktop (top: 1rem)
   - Full width on mobile
   - Clear visual separation between sections
   - Prominent total display

### lib\hooks\useCartSync.ts(NEW)

References: 

- lib\supabase\config.ts
- lib\store\cart.ts(NEW)

Create custom hook to handle cart synchronization on auth state changes:

1. **Import dependencies**:
   - `useEffect` from react
   - `supabase` from `@/lib/supabase/config`
   - `useCartStore` from `@/lib/store/cart`
   - `toast` from sonner

2. **Hook implementation**:
   ```typescript
   export function useCartSync() {
     const { syncWithServer, loadFromServer, items } = useCartStore();
     
     useEffect(() => {
       // Subscribe to auth state changes
       const { data: { subscription } } = supabase.auth.onAuthStateChange(
         async (event, session) => {
           if (event === 'SIGNED_IN' && session) {
             // User just logged in
             if (items.length > 0) {
               // Sync guest cart to server
               await syncWithServer();
               toast.success('Cart synced successfully');
             } else {
               // Load cart from server
               await loadFromServer();
             }
           } else if (event === 'SIGNED_OUT') {
             // User logged out - cart remains in localStorage
             toast.info('Cart saved locally');
           }
         }
       );
       
       return () => {
         subscription.unsubscribe();
       };
     }, [items.length]);
   }
   ```

3. **Usage**: Call this hook in root layout or cart page to enable automatic sync

### lib\hooks\useCartExpiration.ts(NEW)

References: 

- lib\store\cart.ts(NEW)

Create custom hook to handle cart item expiration checking:

1. **Import dependencies**:
   - `useEffect`, `useRef` from react
   - `useCartStore` from `@/lib/store/cart`
   - `toast` from sonner

2. **Hook implementation**:
   ```typescript
   export function useCartExpiration(intervalMs: number = 30000) {
     const { checkExpiredItems } = useCartStore();
     const intervalRef = useRef<NodeJS.Timeout>();
     
     useEffect(() => {
       // Check immediately on mount
       checkExpiredItems();
       
       // Set up interval to check periodically
       intervalRef.current = setInterval(() => {
         checkExpiredItems();
       }, intervalMs);
       
       return () => {
         if (intervalRef.current) {
           clearInterval(intervalRef.current);
         }
       };
     }, [intervalMs]);
   }
   ```

3. **Usage**: Call this hook in navbar and cart page to enable automatic expiration checking

4. **Default interval**: 30 seconds (configurable)

### app\(public)\layout.tsx(MODIFY)

References: 

- app\(public)\book-visit\page.tsx(MODIFY)

Add cart sync and expiration hooks to public layout:

1. **Mark as client component** if not already (check existing implementation)

2. **Import hooks**:
   - `useCartSync` from `@/lib/hooks/useCartSync`
   - `useCartExpiration` from `@/lib/hooks/useCartExpiration`

3. **Call hooks in layout component**:
   ```typescript
   useCartSync(); // Handle auth state changes
   useCartExpiration(); // Check for expired items
   ```

4. **Ensure hooks are called at top level** of component, not conditionally

5. **If layout is server component**: Create a separate client component wrapper for hooks and include it in the layout