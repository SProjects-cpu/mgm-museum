# Headers Timeout Error - Fixed ✅

## Error Description
```
Error fetching exhibition: [TypeError: fetch failed] {
  [cause]: [Error [HeadersTimeoutError]: Headers Timeout Error] {
    code: 'UND_ERR_HEADERS_TIMEOUT'
  }
}
```

## Root Cause

The error was occurring in `/app/exhibitions/[slug]/page.tsx` due to a **self-referential fetch call** that created a deadlock situation.

### The Problem:
```typescript
// ❌ PROBLEMATIC CODE
async function getExhibition(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/exhibitions/${slug}`, {
    cache: 'no-store',
  });
  // ...
}
```

**Why this caused timeouts:**
1. Server component renders and calls `getExhibition()`
2. `getExhibition()` makes a fetch request to `http://localhost:3000/api/exhibitions/...`
3. This fetch tries to connect to the **same server** that's currently rendering
4. The server is busy rendering and waiting for the fetch to complete
5. The fetch is waiting for the server to respond
6. **Deadlock** → Timeout after 30 seconds

This is especially problematic in development with Turbopack where the server handles both rendering and API requests in the same process.

## Solution

Replace the self-referential `fetch` call with a **direct database query** using Supabase:

```typescript
// ✅ FIXED CODE
import { getServiceSupabase } from "@/lib/supabase/config";

async function getExhibition(slug: string) {
  try {
    // Direct database query - no HTTP roundtrip
    const supabase = getServiceSupabase();
    
    const { data: exhibition, error } = await supabase
      .from('exhibitions')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (error || !exhibition) {
      return null;
    }

    return exhibition;
  } catch (error) {
    console.error('Error fetching exhibition:', error);
    return null;
  }
}
```

## Benefits of the Fix

1. **No More Timeouts:** Direct database queries don't create deadlocks
2. **Faster Performance:** Eliminates HTTP overhead (no serialization, network latency)
3. **Better Error Handling:** Database errors are clearer than fetch timeouts
4. **Simpler Code:** No need to construct URLs or handle HTTP responses
5. **Works in All Environments:** No dependency on `NEXT_PUBLIC_SITE_URL`

## Best Practices for Next.js Server Components

### ✅ DO:
- **Direct database queries** in server components
- Use Supabase client directly
- Query data where you need it

### ❌ DON'T:
- Fetch your own API routes from server components
- Create self-referential HTTP calls
- Use `fetch('http://localhost:...')` in server components

### When to Use Each Approach:

| Scenario | Use |
|----------|-----|
| Server Component needs data | Direct database query |
| Client Component needs data | Fetch API route |
| External API | Fetch in server component |
| Your own API | Direct database query |

## Related Files Fixed

- `/app/exhibitions/[slug]/page.tsx` - Changed from fetch to direct query

## Testing

After this fix:
1. ✅ No more timeout errors in terminal
2. ✅ Exhibition pages load instantly
3. ✅ No deadlocks or blocking
4. ✅ Better performance overall

## Additional Notes

This issue was **NOT related to the cart system implementation**. It was a pre-existing architectural issue with how exhibition data was being fetched in server components.

The cart system (Phases 1-4) is working correctly and uses proper patterns:
- Client components use fetch to call API routes ✅
- API routes query the database directly ✅
- No self-referential calls ✅
