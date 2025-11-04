'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Minus, Plus } from 'lucide-react';

interface TicketType {
  type: string;
  label: string;
  price: number;
  description?: string;
  minQuantity?: number;
  maxQuantity?: number;
}

interface TicketSelection {
  ticketType: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface TicketTypeSelectorProps {
  exhibitionId: string;
  date?: Date;
  timeSlotId?: string;
  onTicketsChange: (tickets: TicketSelection[]) => void;
}

export function TicketTypeSelector({
  exhibitionId,
  date,
  timeSlotId,
  onTicketsChange,
}: TicketTypeSelectorProps) {
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTicketTypes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (date) params.append('date', date.toISOString().split('T')[0]);
      if (timeSlotId) params.append('timeSlotId', timeSlotId);

      const response = await fetch(
        `/api/exhibitions/${exhibitionId}/ticket-types?${params}`
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error.message);
      }

      setTicketTypes(data.data.ticketTypes);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket types');
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    fetchTicketTypes();
  });

  const updateQuantity = (type: string, delta: number) => {
    const newQuantities = { ...quantities };
    const current = newQuantities[type] || 0;
    const newValue = Math.max(0, current + delta);
    
    if (newValue === 0) {
      delete newQuantities[type];
    } else {
      newQuantities[type] = newValue;
    }

    setQuantities(newQuantities);

    const selections: TicketSelection[] = Object.entries(newQuantities).map(
      ([ticketType, quantity]) => {
        const ticket = ticketTypes.find(t => t.type === ticketType);
        return {
          ticketType,
          quantity,
          price: ticket?.price || 0,
          subtotal: (ticket?.price || 0) * quantity,
        };
      }
    );

    onTicketsChange(selections);
  };

  const totalAmount = Object.entries(quantities).reduce((sum, [type, qty]) => {
    const ticket = ticketTypes.find(t => t.type === type);
    return sum + (ticket?.price || 0) * qty;
  }, 0);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ticketTypes.map(ticket => (
        <Card key={ticket.type} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{ticket.label}</div>
              <div className="text-2xl font-bold text-primary mt-1">
                ₹{ticket.price}
              </div>
              {ticket.description && (
                <div className="text-sm text-muted-foreground mt-1">
                  {ticket.description}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="outline"
                onClick={() => updateQuantity(ticket.type, -1)}
                disabled={!quantities[ticket.type]}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <div className="w-12 text-center font-semibold text-lg">
                {quantities[ticket.type] || 0}
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={() => updateQuantity(ticket.type, 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {totalAmount > 0 && (
        <Card className="p-4 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Total Amount</div>
            <div className="text-2xl font-bold text-primary">
              ₹{totalAmount.toFixed(2)}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
