import { useEffect, useRef } from 'react';

/**
 * Auto-refresh hook that polls data at regular intervals
 * Use this as fallback when WebSocket realtime is not available
 */
export function useAutoRefresh(
  fetchFn: () => Promise<void> | void,
  intervalMs: number = 30000, // Default: 30 seconds
  enabled: boolean = true
) {
  const fetchFnRef = useRef(fetchFn);

  // Update ref when function changes
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    if (!enabled) return;

    // Fetch immediately on mount
    fetchFnRef.current();

    // Set up polling interval
    const interval = setInterval(() => {
      fetchFnRef.current();
    }, intervalMs);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [intervalMs, enabled]);
}

/**
 * Refresh data when window regains focus
 * Useful for updating stale data when user returns to tab
 */
export function useRefreshOnFocus(fetchFn: () => Promise<void> | void) {
  const fetchFnRef = useRef(fetchFn);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    const handleFocus = () => {
      console.log('[AutoRefresh] Window focused, refreshing data');
      fetchFnRef.current();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);
}
