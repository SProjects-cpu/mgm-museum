'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Users } from 'lucide-react';
import type { TicketQuantities } from '@/types/booking-new';

interface TicketSelectorProps {
  tickets: TicketQuantities;
  onTicketsChange: (tickets: TicketQuantities) => void;
  maxTickets?: number;
  pricing?: Record<string, { price: number; currency: string }>;
  pricingLoading?: boolean;
}

const ticketTypes = [
  {
    type: 'adult' as const,
    label: 'Adult',
    description: 'Ages 16+',
  },
  {
    type: 'child' as const,
    label: 'Child',
    description: 'Ages 0-15',
  },
  {
    type: 'student' as const,
    label: 'Student',
    description: 'With valid ID',
  },
  {
    type: 'senior' as const,
    label: 'Senior',
    description: 'Ages 60+',
  },
];

export function TicketSelector({ 
  tickets, 
  onTicketsChange, 
  maxTickets = 10,
  pricing = {},
  pricingLoading = false 
}: TicketSelectorProps) {
  const totalTickets = Object.values(tickets).reduce((sum, count) => sum + count, 0);
  
  const calculateTotal = () => {
    let total = 0;
    Object.entries(tickets).forEach(([type, count]) => {
      if (pricing[type]) {
        total += pricing[type].price * count;
      }
    });
    return total;
  };

  const totalCost = calculateTotal();
  const isFree = totalCost === 0;

  const updateTicket = (type: keyof TicketQuantities, delta: number) => {
    const currentValue = tickets[type];
    const newValue = Math.max(0, currentValue + delta);
    
    // Check if total would exceed max
    const newTotal = totalTickets - currentValue + newValue;
    if (newTotal > maxTickets) {
      return;
    }

    onTicketsChange({
      ...tickets,
      [type]: newValue,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Select Tickets</CardTitle>
            <CardDescription>
              {pricingLoading ? 'Loading pricing...' : isFree ? 'Free admission for all visitors' : 'Select your tickets'}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{totalTickets}/{maxTickets}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ticketTypes.map((ticketType) => {
            const ticketPrice = pricing[ticketType.type]?.price || 0;
            const currency = pricing[ticketType.type]?.currency || 'INR';
            
            return (
            <div
              key={ticketType.type}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{ticketType.label}</h4>
                  {ticketPrice === 0 ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Free
                    </Badge>
                  ) : (
                    <span className="text-sm font-semibold text-primary">
                      ₹{ticketPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{ticketType.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateTicket(ticketType.type, -1)}
                  disabled={tickets[ticketType.type] === 0}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                
                <span className="w-8 text-center font-semibold">
                  {tickets[ticketType.type]}
                </span>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateTicket(ticketType.type, 1)}
                  disabled={totalTickets >= maxTickets}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          )}
        </div>

        {totalTickets === 0 && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-900 dark:text-yellow-100">
            <p className="font-medium">Please select at least one ticket to continue</p>
          </div>
        )}

        {totalTickets >= maxTickets && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium">Maximum {maxTickets} tickets per booking</p>
            <p className="text-xs mt-1">For larger groups, please contact us directly</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total Tickets</span>
            <span>{totalTickets}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-muted-foreground">Admission Cost</span>
            {isFree ? (
              <span className="text-sm font-semibold text-green-600">FREE</span>
            ) : (
              <span className="text-lg font-bold text-primary">₹{totalCost.toFixed(2)}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
