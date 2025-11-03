'use client';

import { useCartSync } from '@/lib/hooks/useCartSync';
import { useCartExpiration } from '@/lib/hooks/useCartExpiration';

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Initialize cart synchronization and expiration checking
  useCartSync();
  useCartExpiration();

  return <>{children}</>;
}
