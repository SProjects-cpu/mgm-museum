'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Trash2 } from 'lucide-react';
import type { CartItem } from '@/lib/store/cart';

interface CartItemCardProps {
  item: CartItem;
  timeRemaining: number; // in seconds
  onRemove: (itemId: string) => void;
  isRemoving?: boolean;
}

export function CartItemCard({ item, timeRemaining, onRemove, isRemoving }: CartItemCardProps) {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">
              {item.exhibitionName || item.showName || 'General Admission'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {item.exhibitionId ? 'Exhibition' : item.showId ? 'Show' : 'Visit'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(item.id)}
            disabled={isRemoving}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Details */}
        <div className="space-y-3">
          {/* Date */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{formatDate(item.bookingDate)}</span>
          </div>

          {/* Time Slot */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>
              {item.timeSlot.startTime} - {item.timeSlot.endTime}
            </span>
          </div>

          {/* Tickets */}
          <div className="flex items-start gap-2 text-sm">
            <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              {item.tickets.adult > 0 && (
                <div>Adult: {item.tickets.adult}</div>
              )}
              {item.tickets.child > 0 && (
                <div>Child: {item.tickets.child}</div>
              )}
              {item.tickets.student > 0 && (
                <div>Student: {item.tickets.student}</div>
              )}
              {item.tickets.senior > 0 && (
                <div>Senior: {item.tickets.senior}</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center mt-4 pt-4 border-t">
          {/* Subtotal */}
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Subtotal</p>
            <p className="text-lg font-bold">
              ₹{item.subtotal.toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
