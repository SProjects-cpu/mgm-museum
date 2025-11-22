'use client';

import { useState } from 'react';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Users } from 'lucide-react';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  totalCapacity: number;
  availableCapacity: number;
  bookedCount: number;
  isFull: boolean;
  pricing: Array<{ ticketType: string; price: number; label?: string }>;
}

interface TimeSlotSelectorProps {
  exhibitionId: string;
  date: Date;
  onSlotSelect: (slot: TimeSlot) => void;
  selectedSlotId?: string;
}

export function TimeSlotSelector({
  exhibitionId,
  date,
  onSlotSelect,
  selectedSlotId,
}: TimeSlotSelectorProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(
        `/api/exhibitions/${exhibitionId}/time-slots?date=${dateStr}`
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error.message);
      }

      setTimeSlots(data.data.timeSlots);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load time slots');
    } finally {
      setLoading(false);
    }
  };

  useAutoRefresh(fetchTimeSlots, 30000);

  if (loading && timeSlots.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
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

  if (timeSlots.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No time slots available for this date
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {timeSlots.map(slot => (
        <Card
          key={slot.id}
          className={`p-4 cursor-pointer transition-all ${
            selectedSlotId === slot.id
              ? 'border-primary bg-primary/5'
              : 'hover:border-primary/50'
          } ${slot.isFull ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !slot.isFull && onSlotSelect(slot)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-semibold">
                  {slot.startTime} - {slot.endTime}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  <Users className="w-4 h-4" />
                  {slot.availableCapacity} / {slot.totalCapacity} available
                </div>
              </div>
            </div>
            <div className="text-right">
              {slot.isFull ? (
                <div className="text-sm text-destructive">Fully Booked</div>
              ) : (
                <Button
                  size="sm"
                  variant={selectedSlotId === slot.id ? 'default' : 'outline'}
                >
                  {selectedSlotId === slot.id ? 'Selected' : 'Select'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
