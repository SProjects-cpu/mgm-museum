'use client';

import { useState, useEffect } from 'react';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import { DateAvailability } from '@/lib/api/booking-queries';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';

interface BookingCalendarProps {
  exhibitionId: string;
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
}

export function BookingCalendar({
  exhibitionId,
  onDateSelect,
  selectedDate,
}: BookingCalendarProps) {
  const [availableDates, setAvailableDates] = useState<DateAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableDates = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/exhibitions/${exhibitionId}/available-dates`
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error.message);
      }

      setAvailableDates(data.data.dates);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load available dates');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useAutoRefresh(fetchAvailableDates, 30000);

  const isDateAvailable = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const availability = availableDates.find(d => d.date === dateStr);
    return availability?.isAvailable && !availability.isFull;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return true;
    return !isDateAvailable(date);
  };

  if (loading && availableDates.length === 0) {
    return <Skeleton className="h-[350px] w-full" />;
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
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onDateSelect(date)}
        disabled={isDateDisabled}
        className="rounded-md border"
      />
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary rounded" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-muted rounded" />
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
}
