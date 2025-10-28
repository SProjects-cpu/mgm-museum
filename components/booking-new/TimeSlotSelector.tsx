'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Loader2, AlertCircle } from 'lucide-react';
import type { TimeSlot } from '@/types/booking-new';

interface TimeSlotSelectorProps {
  selectedDate: Date;
  onSlotSelect: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot;
  exhibitionId?: string;
  showId?: string;
}

export function TimeSlotSelector({ 
  selectedDate, 
  onSlotSelect, 
  selectedSlot, 
  exhibitionId, 
  showId 
}: TimeSlotSelectorProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimeSlots();
  }, [selectedDate, exhibitionId, showId]);

  const fetchTimeSlots = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const params = new URLSearchParams({ date: dateStr });
      
      if (exhibitionId) params.append('exhibitionId', exhibitionId);
      if (showId) params.append('showId', showId);

      const response = await fetch(`/api/bookings-new/time-slots?${params}`);
      const data = await response.json();

      if (data.success) {
        setTimeSlots(data.timeSlots || []);
        
        // If no slots exist for general admission, try to generate them
        if (!data.timeSlots || data.timeSlots.length === 0) {
          if (!exhibitionId && !showId) {
            await generateTimeSlots(dateStr);
          }
        }
      } else {
        setError(data.error || 'Failed to load time slots');
      }
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setError('Failed to load time slots');
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = async (date: string) => {
    try {
      const response = await fetch('/api/bookings-new/time-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date })
      });

      const data = await response.json();
      
      if (data.success && data.timeSlots) {
        setTimeSlots(data.timeSlots);
      }
    } catch (err) {
      console.error('Error generating time slots:', err);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getCapacityBadge = (availableCapacity: number) => {
    if (availableCapacity === 0) {
      return <Badge variant="destructive">Sold Out</Badge>;
    } else if (availableCapacity <= 10) {
      return <Badge variant="secondary" className="bg-yellow-500 text-white">Limited</Badge>;
    } else {
      return <Badge variant="outline" className="text-green-600 border-green-600">Available</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading available time slots...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3 text-destructive">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchTimeSlots}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Clock className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No time slots available for this date
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Time Slot</CardTitle>
        <CardDescription>
          {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {timeSlots.map((slot) => (
            <Button
              key={slot.id}
              variant={selectedSlot?.id === slot.id ? 'default' : 'outline'}
              className="h-auto flex-col items-start p-4 gap-2"
              disabled={slot.availableCapacity <= 0}
              onClick={() => onSlotSelect(slot)}
            >
              <div className="flex items-center gap-2 w-full">
                <Clock className="w-4 h-4" />
                <span className="font-semibold">
                  {formatTime(slot.startTime)}
                </span>
              </div>
              
              <div className="flex items-center justify-between w-full text-xs">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{slot.availableCapacity} left</span>
                </div>
                {getCapacityBadge(slot.availableCapacity)}
              </div>
            </Button>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
          <p className="font-medium mb-1">Time Slot Information</p>
          <ul className="space-y-0.5">
            <li>• Each time slot lasts 1 hour</li>
            <li>• Please arrive 15 minutes before your scheduled time</li>
            <li>• Late arrivals may not be admitted</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
