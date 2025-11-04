'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { CartItemCard } from '@/components/cart/CartItemCard';
import { CartSummary } from '@/components/cart/CartSummary';
import { supabase } from '@/lib/supabase/config';

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, clearCart, isLoading, checkExpiredItems } = useCartStore();
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  // Update countdown timers
  useEffect(() => {
    const updateTimers = () => {
      const now = new Date();
      const newTimeRemaining: Record<string, number> = {};

      items.forEach((item) => {
        const expiresAt = new Date(item.expiresAt);
        const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        newTimeRemaining[item.id] = remaining;
      });

      setTimeRemaining(newTimeRemaining);

      // Check for expired items
      checkExpiredItems();
    };

    // Update immediately
    updateTimers();

    // Update every second
    const interval = setInterval(updateTimers, 1000);

    return () => clearInterval(interval);
  }, [items, checkExpiredItems]);

  // Handle remove item
  const handleRemove = async (itemId: string) => {
    setRemovingItemId(itemId);
    try {
      await removeItem(itemId);
    } finally {
      setRemovingItemId(null);
    }
  };

  // Handle clear cart
  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };

  // Handle checkout
  const handleCheckout = async () => {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Redirect to login with return URL
      router.push('/login?redirect=/cart/checkout');
    } else {
      router.push('/cart/checkout');
    }
  };

  // Empty state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingCart className="w-24 h-24 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-3xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Add items to your cart to get started
          </p>
          <Button onClick={() => router.push('/exhibitions')} size="lg">
            Browse Exhibitions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Your Cart</h1>
            <p className="text-muted-foreground">
              {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={handleClearCart}
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Cart
          </Button>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.2 }}
                >
                  <CartItemCard
                    item={item}
                    timeRemaining={timeRemaining[item.id] || 0}
                    onRemove={handleRemove}
                    isRemoving={removingItemId === item.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <CartSummary
              items={items}
              onCheckout={handleCheckout}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
