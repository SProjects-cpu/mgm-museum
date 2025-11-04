# Supabase Realtime Setup Required

## ❌ Current Issue

WebSocket connections are **failing** because Realtime is not enabled in your Supabase project.

**Error:**
```
WebSocket connection to 'wss://mlljzwuflbbquttejvuq.supabase.co/realtime/v1/websocket' failed
```

## ✅ Solution: Enable Realtime in Supabase

### Step 1: Go to Supabase Dashboard

1. Visit: https://supabase.com/dashboard
2. Select your project: `mlljzwuflbbquttejvuq`

### Step 2: Enable Realtime for Tables

1. Go to **Database** → **Replication**
2. Find these tables and enable Realtime:
   - ✅ `exhibitions`
   - ✅ `events`
   - ✅ `pricing`
   - ✅ `shows`
   - ✅ `bookings`

3. For each table:
   - Click the toggle to **enable replication**
   - This allows real-time updates

### Step 3: Configure Realtime Settings

1. Go to **Project Settings** → **API**
2. Scroll to **Realtime** section
3. Ensure Realtime is **enabled** for your project
4. Check that the Realtime URL is accessible

### Step 4: Enable Row Level Security (RLS) Policies

For Realtime to work, you need proper RLS policies:

```sql
-- Enable RLS on tables
ALTER TABLE exhibitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for customer site)
CREATE POLICY "Allow public read access" ON exhibitions
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON events
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON pricing
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON shows
  FOR SELECT USING (true);

-- Bookings might need more restrictive policies
CREATE POLICY "Allow authenticated read" ON bookings
  FOR SELECT USING (auth.role() = 'authenticated');
```

### Step 5: Verify Realtime is Working

After enabling, test with this SQL:

```sql
-- In Supabase SQL Editor
SELECT * FROM pg_publication;

-- Should show publications for your tables
```

## 🎯 Alternative Solution: Use Polling Instead

If you can't enable Realtime (free tier limitations, etc.), use **polling** instead:

### Option 1: Auto-Refresh Every 30 Seconds

```typescript
// In booking page
useEffect(() => {
  // Fetch data immediately
  fetchData();
  
  // Poll every 30 seconds
  const interval = setInterval(fetchData, 30000);
  
  return () => clearInterval(interval);
}, []);
```

### Option 2: Manual Refresh Button

```typescript
// Add refresh button
<Button onClick={fetchData}>
  <RefreshCw className="w-4 h-4 mr-2" />
  Refresh
</Button>
```

### Option 3: Refresh on Focus

```typescript
// Refresh when user returns to tab
useEffect(() => {
  const handleFocus = () => fetchData();
  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, []);
```

## 📊 Comparison: Realtime vs Polling

| Feature | Realtime (WebSocket) | Polling (HTTP) |
|---------|---------------------|----------------|
| Update Speed | Instant (1-2 sec) | 30-60 seconds |
| Server Load | Low | Medium |
| Bandwidth | Low | Medium |
| Setup | Requires Supabase config | Works immediately |
| Cost | May require paid plan | Free |
| Reliability | Depends on WebSocket | Very reliable |

## 🚀 Recommended Approach

### For Now: Use Polling

Since WebSocket is failing, implement polling immediately:

```typescript
// lib/hooks/useAutoRefresh.ts
import { useEffect } from 'react';

export function useAutoRefresh(
  fetchFn: () => Promise<void>,
  intervalMs: number = 30000
) {
  useEffect(() => {
    // Fetch immediately
    fetchFn();
    
    // Set up polling
    const interval = setInterval(fetchFn, intervalMs);
    
    return () => clearInterval(interval);
  }, [fetchFn, intervalMs]);
}

// Usage in components
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';

export function ExhibitionsPage() {
  const [exhibitions, setExhibitions] = useState([]);
  
  const fetchExhibitions = async () => {
    const response = await fetch('/api/exhibitions');
    const data = await response.json();
    setExhibitions(data.exhibitions);
  };
  
  // Auto-refresh every 30 seconds
  useAutoRefresh(fetchExhibitions, 30000);
  
  return <div>{/* Your UI */}</div>;
}
```

### Later: Enable Realtime

Once you enable Realtime in Supabase dashboard, the WebSocket connections will work automatically.

## 🔍 Debugging Steps

### 1. Check Supabase Project Status

```bash
# Check if Realtime is enabled
curl https://mlljzwuflbbquttejvuq.supabase.co/realtime/v1/websocket
```

### 2. Check API Key

Your anon key looks correct:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbGp6d3VmbGJicXV0dGVqdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNDcxMDQsImV4cCI6MjA3NTgyMzEwNH0.YxYyWd2-6dSytqTv92KfeMkf1wSWeoCLYNY1NCuF7dw
```

### 3. Check Supabase Plan

- **Free Tier**: Realtime may be limited
- **Pro Tier**: Full Realtime support
- **Team/Enterprise**: Unlimited Realtime

### 4. Check Network

- Firewall blocking WebSocket?
- Corporate proxy?
- VPN interfering?

## 💡 Quick Fix: Implement Polling Now

Let me create a polling solution that works immediately:

```typescript
// lib/hooks/useRealtimeOrPolling.ts
import { useEffect } from 'react';
import { isRealtimeEnabled } from '@/lib/supabase/config';

export function useRealtimeOrPolling(
  table: string,
  callback: () => void,
  pollInterval: number = 30000
) {
  useEffect(() => {
    if (isRealtimeEnabled) {
      // Try realtime first
      const subscription = supabase
        .channel(`${table}-changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            // Fallback to polling
            console.log(`Realtime failed for ${table}, using polling`);
            const interval = setInterval(callback, pollInterval);
            return () => clearInterval(interval);
          }
        });
      
      return () => {
        supabase.removeChannel(subscription);
      };
    } else {
      // Use polling
      const interval = setInterval(callback, pollInterval);
      return () => clearInterval(interval);
    }
  }, [table, callback, pollInterval]);
}
```

## 📝 Action Items

### Immediate (Do Now):
1. ✅ Implement polling as fallback
2. ✅ Add manual refresh buttons
3. ✅ Test with 30-second polling

### Short-term (This Week):
1. 🔄 Enable Realtime in Supabase dashboard
2. 🔄 Configure RLS policies
3. 🔄 Test WebSocket connections

### Long-term (Next Week):
1. 📋 Optimize polling intervals
2. 📋 Add connection status indicator
3. 📋 Implement hybrid approach (realtime + polling fallback)

## 🎯 Expected Outcome

### With Polling (Works Now):
- ✅ Data updates every 30 seconds
- ✅ No WebSocket errors
- ✅ Reliable and simple
- ⚠️ Not instant (30-60 sec delay)

### With Realtime (After Supabase Config):
- ✅ Instant updates (1-2 seconds)
- ✅ Lower bandwidth
- ✅ Better user experience
- ✅ No polling overhead

---

**Current Status**: WebSocket failing due to Supabase configuration
**Immediate Solution**: Implement polling
**Long-term Solution**: Enable Realtime in Supabase dashboard
