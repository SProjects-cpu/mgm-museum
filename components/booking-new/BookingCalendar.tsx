'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Info } from 'lucide-react';
import type { DayAvailability } from '@/types/booking-new';

interface BookingCalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
  exhibitionId?: string;
  showId?: string;
}

export function BookingCalendar({ onDateSelect, selectedDate, exhibitionId, showId }: BookingCalendarProps) {
  const [month, setMonth] = useState<Date>(new Date());
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch availability for current month
  useEffect(() => {
    fetchMonthAvailability();
  }, [month, exhibitionId, showId]);

  const fetchMonthAvailability = async () => {
    setLoading(true);
    try {
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const params = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      if (exhibitionId) params.append('exhibitionId', exhibitionId);
      if (showId) params.append('showId', showId);

      const response = await fetch(`/api/bookings-new/availability?${params}`);
      const data = await response.json();

      if (data.success) {
        setAvailability(data.dailyAvailability || []);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateStatus = (date: Date): DayAvailability | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return availability.find(a => a.date === dateStr || new Date(a.date).toISOString().split('T')[0] === dateStr);
  };

  const modifiers = {
    available: (date: Date) => {
      const status = getDateStatus(date);
      return status?.capacityStatus === 'available';
    },
    limited: (date: Date) => {
      const status = getDateStatus(date);
      return status?.capacityStatus === 'limited';
    },
    soldOut: (date: Date) => {
      const status = getDateStatus(date);
      return status?.capacityStatus === 'sold_out';
    },
    closed: (date: Date) => {
      const status = getDateStatus(date);
      return status?.capacityStatus === 'closed' || status?.isClosed || date.getDay() === 1;
    },
  };

  const modifiersClassNames = {
    available: 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-800',
    limited: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-800',
    soldOut: 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 line-through cursor-not-allowed',
    closed: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 line-through cursor-not-allowed',
  };

  const disabled = (date: Date) => {
    const status = getDateStatus(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return (
      date < today ||
      date.getDay() === 1 || // Mondays
      status?.capacityStatus === 'sold_out' ||
      status?.capacityStatus === 'closed' ||
      status?.isClosed === true
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Select Your Visit Date</span>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateSelect(date)}
            month={month}
            onMonthChange={setMonth}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            disabled={disabled}
            className="rounded-md border"
          />

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800" />
              <span>Limited</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800" />
              <span>Sold Out</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
              <span>Closed</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
            <Info className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">Booking Information</p>
              <ul className="space-y-0.5 text-xs text-blue-700 dark:text-blue-300">
                <li>• Museum open 10:00 AM - 5:00 PM (Closed Mondays)</li>
                <li>• Free admission with advance booking recommended</li>
                <li>• Select a date to view available time slots</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
