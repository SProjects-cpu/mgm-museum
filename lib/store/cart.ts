import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/config";
import type { TimeSlot, TicketQuantities } from "@/types/booking-new";

export interface CartItem {
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

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addItem: (item: Omit<CartItem, 'id' | 'createdAt' | 'expiresAt'>) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  syncWithServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
  checkExpiredItems: () => void;
  
  // Getters
  getItemCount: () => number;
  getTotalTickets: () => number;
  getCartTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      addItem: async (item) => {
        try {
          set({ isLoading: true, error: null });

          // Generate unique ID and timestamps
          const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const now = new Date();
          const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes

          const cartItem: CartItem = {
            ...item,
            id,
            createdAt: now,
            expiresAt,
          };

          // Check if user is authenticated
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            // Get auth session
            const { data: { session } } = await supabase.auth.getSession();
            
            // Call API to reserve seat and save to database
            const response = await fetch('/api/cart/add', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': session ? `Bearer ${session.access_token}` : '',
              },
              body: JSON.stringify({
                timeSlotId: item.timeSlotId,
                bookingDate: item.bookingDate,
                exhibitionId: item.exhibitionId,
                showId: item.showId,
                tickets: item.tickets,
                totalTickets: item.totalTickets,
                subtotal: item.subtotal,
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'Failed to add item to cart');
            }

            // Use server-generated cart item if available
            if (data.cartItem) {
              cartItem.id = data.cartItem.id;
              cartItem.expiresAt = new Date(data.cartItem.expires_at);
            }
          }

          // Update store state
          set((state) => ({
            items: [...state.items, cartItem],
            isLoading: false,
          }));

          toast.success('Added to cart!', {
            description: `${item.totalTickets} ticket(s) reserved for 15 minutes`,
          });
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          toast.error('Failed to add to cart', {
            description: error.message,
          });
          throw error;
        }
      },

      removeItem: async (itemId) => {
        try {
          set({ isLoading: true, error: null });

          const item = get().items.find((i) => i.id === itemId);
          if (!item) {
            throw new Error('Item not found in cart');
          }

          // Check if user is authenticated
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            // Get auth session
            const { data: { session } } = await supabase.auth.getSession();
            
            // Call API to release seat and remove from database
            const response = await fetch('/api/cart/remove', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': session ? `Bearer ${session.access_token}` : '',
              },
              body: JSON.stringify({
                itemId: item.id,
                timeSlotId: item.timeSlotId,
                totalTickets: item.totalTickets,
              }),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.message || 'Failed to remove item from cart');
            }
          }

          // Update store state
          set((state) => ({
            items: state.items.filter((i) => i.id !== itemId),
            isLoading: false,
          }));

          toast.success('Item removed from cart');
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          toast.error('Failed to remove item', {
            description: error.message,
          });
        }
      },

      clearCart: async () => {
        try {
          set({ isLoading: true, error: null });

          // Check if user is authenticated
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            // Get auth session
            const { data: { session } } = await supabase.auth.getSession();
            
            // Call API to release all seats and clear database
            const response = await fetch('/api/cart/clear', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': session ? `Bearer ${session.access_token}` : '',
              },
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.message || 'Failed to clear cart');
            }
          }

          // Update store state
          set({ items: [], isLoading: false });

          toast.success('Cart cleared');
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          toast.error('Failed to clear cart', {
            description: error.message,
          });
        }
      },

      syncWithServer: async () => {
        try {
          set({ isLoading: true, error: null });

          const items = get().items;
          if (items.length === 0) {
            set({ isLoading: false });
            return;
          }

          // Get auth session
          const { data: { session } } = await supabase.auth.getSession();
          
          // Call API to sync guest cart to server
          const response = await fetch('/api/cart/sync', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': session ? `Bearer ${session.access_token}` : '',
            },
            body: JSON.stringify({ items }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Failed to sync cart');
          }

          // Update store with synced items
          const syncedItems = data.syncedItems.map((item: any) => ({
            ...item,
            expiresAt: new Date(item.expiresAt),
            createdAt: new Date(item.createdAt),
          }));

          set({ items: syncedItems, isLoading: false });

          if (data.skippedItems && data.skippedItems.length > 0) {
            toast.warning('Some items could not be synced', {
              description: `${data.skippedItems.length} item(s) were unavailable`,
            });
          }
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          toast.error('Failed to sync cart', {
            description: error.message,
          });
        }
      },

      loadFromServer: async () => {
        try {
          set({ isLoading: true, error: null });

          // Get auth session with retry
          let session = null;
          let attempts = 0;
          const maxAttempts = 3;

          while (attempts < maxAttempts && !session) {
            attempts++;
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            
            if (currentSession) {
              session = currentSession;
              break;
            }

            if (attempts < maxAttempts) {
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 500 * attempts));
            }
          }

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
          const data = await response.json();

          if (!response.ok) {
            // If 401, session might not be ready yet
            if (response.status === 401) {
              console.warn('Cart load got 401, session may not be fully established');
              set({ isLoading: false });
              return;
            }
            throw new Error(data.message || 'Failed to load cart');
          }

          // Update store with loaded items
          const loadedItems = data.items.map((item: any) => ({
            ...item,
            expiresAt: new Date(item.expiresAt),
            createdAt: new Date(item.createdAt),
          }));

          set({ items: loadedItems, isLoading: false });
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          // Don't show error toast for load failures (silent fail)
          console.error('Failed to load cart:', error);
        }
      },

      checkExpiredItems: () => {
        const now = new Date();
        const items = get().items;
        const expiredItems = items.filter((item) => new Date(item.expiresAt) < now);

        if (expiredItems.length > 0) {
          // Remove expired items
          expiredItems.forEach((item) => {
            get().removeItem(item.id);
          });

          toast.warning('Cart items expired', {
            description: `${expiredItems.length} item(s) removed from cart`,
          });
        }
      },

      getItemCount: () => {
        return get().items.length;
      },

      getTotalTickets: () => {
        return get().items.reduce((total, item) => total + item.totalTickets, 0);
      },

      getCartTotal: () => {
        return get().items.reduce((total, item) => total + item.subtotal, 0);
      },
    }),
    {
      name: "mgm-cart-storage",
    }
  )
);
