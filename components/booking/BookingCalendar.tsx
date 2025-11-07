'use client';

import { useState, useEffect } from 'react';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import { DateAvailability } from '@/lib/api/booking-queries';
import { InspirationalCalendar } from '@/components/ui/inspirational-calendar';
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

  if (loading && availableDates.length === 0) {
    return <Skeleton className="h-[450px] w-full" />;
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        {error}
      </div>
    );
  }

  // Get current date info
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString("default", { month: "long" });
  const currentYear = currentDate.getFullYear();
  const firstDayOfMonth = new Date(currentYear, currentDate.getMonth(), 1);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(
    currentYear,
    currentDate.getMonth() + 1,
    0
  ).getDate();

  // Convert availableDates to array of date strings
  const availableDateStrings = availableDates
    .filter(d => d.isAvailable && !d.isFull)
    .map(d => d.date);

  return (
    <div className="space-y-4">
      <InspirationalCalendar
        currentMonth={currentMonth}
        currentYear={currentYear}
        daysInMonth={daysInMonth}
        firstDayOfWeek={firstDayOfWeek}
        availableDates={availableDateStrings}
        selectedDate={selectedDate}
        onDateSelect={onDateSelect}
        title="Select Your Visit Date"
        description="Choose an available date to continue your booking"
        showBookButton={false}
      />
      <div className="flex gap-4 text-sm justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-indigo-500 rounded" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded" />
          <span>Unavailable</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-indigo-600 rounded" />
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}
