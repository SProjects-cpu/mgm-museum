'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Users, MapPin, Ticket } from 'lucide-react';
import type { TimeSlot, TicketQuantities } from '@/types/booking-new';

interface BookingSummaryProps {
  selectedDate?: Date;
  selectedSlot?: TimeSlot;
  tickets: TicketQuantities;
  exhibitionName?: string;
  showName?: string;
}

export function BookingSummary({ 
  selectedDate, 
  selectedSlot, 
  tickets,
  exhibitionName,
  showName 
}: BookingSummaryProps) {
  const totalTickets = Object.values(tickets).reduce((sum, count) => sum + count, 0);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const ticketBreakdown = [
    { label: 'Adult', count: tickets.adult },
    { label: 'Child', count: tickets.child },
    { label: 'Student', count: tickets.student },
    { label: 'Senior', count: tickets.senior },
  ].filter(item => item.count > 0);

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Booking Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Experience Type */}
        {(exhibitionName || showName) && (
          <div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Experience</p>
                <p className="font-semibold">{exhibitionName || showName}</p>
              </div>
            </div>
          </div>
        )}

        {!exhibitionName && !showName && (
          <div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visit Type</p>
                <p className="font-semibold">General Admission</p>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Date */}
        {selectedDate ? (
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Visit Date</p>
              <p className="font-semibold">{formatDate(selectedDate)}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Please select a date</p>
            </div>
          </div>
        )}

        {/* Time Slot */}
        {selectedSlot ? (
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Time Slot</p>
              <p className="font-semibold">
                {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
              </p>
              <Badge variant="outline" className="mt-1 text-xs">
                {selectedSlot.availableCapacity} spots left
              </Badge>
            </div>
          </div>
        ) : (
          selectedDate && (
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Please select a time slot</p>
              </div>
            </div>
          )
        )}

        <Separator />

        {/* Tickets */}
        {totalTickets > 0 ? (
          <div>
            <div className="flex items-start gap-2 mb-3">
              <Users className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">Tickets</p>
                <div className="space-y-1.5">
                  {ticketBreakdown.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span>{item.label}</span>
                      <span className="font-semibold">× {item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <Users className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Please select tickets</p>
            </div>
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Tickets</span>
            <span className="font-semibold">{totalTickets}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total Cost</span>
            <span className="text-2xl font-bold text-green-600">FREE</span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-xs text-blue-900 dark:text-blue-100">
          <p className="font-medium mb-1">Free Admission</p>
          <p>Museum admission is free, but advance booking is recommended to guarantee entry.</p>
        </div>
      </CardContent>
    </Card>
  );
}
