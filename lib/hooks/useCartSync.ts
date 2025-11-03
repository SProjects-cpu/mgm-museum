import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/config';
import { useCartStore } from '@/lib/store/cart';
import { toast } from 'sonner';

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
            try {
              await syncWithServer();
              toast.success('Cart synced successfully');
            } catch (error) {
              console.error('Failed to sync cart:', error);
              toast.error('Failed to sync cart');
            }
          } else {
            // Load cart from server
            try {
              await loadFromServer();
            } catch (error) {
              console.error('Failed to load cart:', error);
            }
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
  }, [items.length, syncWithServer, loadFromServer]);
}
