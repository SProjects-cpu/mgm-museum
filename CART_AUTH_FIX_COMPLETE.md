# Cart Authentication Fix - Complete Solution

## Critical Issues Fixed

### 1. **401 Unauthorized Error on Cart Load**
**Problem:** After login, the cart was failing to load with `401 (Unauthorized)` error.

**Root Cause:** The cart store's `loadFromServer()` function was not sending the authentication token in the request headers.

**Solution:** Added authentication token to all cart API calls.

### 2. **Login Redirect to Wrong Page**
**Problem:** After successful login from cart checkout, users were redirected to book-visit page instead of cart checkout.

**Root Cause:** Query parameter conflict - the login page was appending `action=checkout` to redirect URLs that already had query parameters.

**Solution:** Modified redirect logic to only append action parameter when redirect URL doesn't contain existing query params.

## Changes Made

### File: `lib/store/cart.ts`

#### 1. loadFromServer() - Added Auth Check and Token
```typescript
loadFromServer: async () => {
  try {
    set({ isLoading: true, error: null });

    // Get auth session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // User not authenticated, skip loading
      set({ isLoading: false });
      return;
    }

    const response = await fetch('/api/cart/load', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });
    // ... rest of the code
  }
}
```

#### 2. addItem() - Added Auth Token
```typescript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch('/api/cart/add', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': session ? `Bearer ${session.access_token}` : '',
  },
  // ... body
});
```

#### 3. removeItem() - Added Auth Token
```typescript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch('/api/cart/remove', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': session ? `Bearer ${session.access_token}` : '',
  },
  // ... body
});
```

#### 4. clearCart() - Added Auth Token
```typescript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch('/api/cart/clear', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 