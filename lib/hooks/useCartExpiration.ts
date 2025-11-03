import { useEffect, useRef } from 'react';
import { useCartStore } from '@/lib/store/cart';

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
  }, [intervalMs, checkExpiredItems]);
}
