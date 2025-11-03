'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, ArrowRight, Info } from 'lucide-react';
import type { CartItem } from '@/lib/store/cart';

interface CartSummaryProps {
  items: CartItem[];
  onCheckout: () => void;
  isLoading?: boolean;
}

export function CartSummary({ items, onCheckout, isLoading }: CartSummaryProps) {
  // Calculate totals
  const totalItems = items.length;
  const totalTickets = items.reduce((sum, item) => sum + item.totalTickets, 0);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = 0; // No tax for now
  const grandTotal = subtotal + tax;

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items Count */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Items</span>
          <span className="font-medium">{totalItems}</span>
        </div>

        {/* Tickets Count */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Tickets</span>
          <span className="font-medium">{totalTickets}</span>
        </div>

        <Separator />

        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">₹{subtotal.toFixed(2)}</span>
        </div>

        {/* Tax/Fees */}
        {tax > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax & Fees</span>
            <span className="font-medium">₹{tax.toFixed(2)}</span>
          </div>
        )}

        <Separator />

        {/* Grand Total */}
        <div className="flex justify-between">
          <span className="text-lg font-bold">Total</span>
          <span className="text-lg font-bold text-primary">
            ₹{grandTotal.toFixed(2)}
          </span>
        </div>

        {/* Free Admission Info */}
        {grandTotal === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-800">
              Free admission! Complete your booking to confirm your visit.
            </p>
          </div>
        )}

        {/* Checkout Button */}
        <Button
          onClick={onCheckout}
          disabled={totalItems === 0 || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            'Processing...'
          ) : (
            <>
              Proceed to Checkout
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>

        {/* Additional Info */}
        <p className="text-xs text-center text-muted-foreground">
          Your seats are reserved for 15 minutes
        </p>
      </CardContent>
    </Card>
  );
}
