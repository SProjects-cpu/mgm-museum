'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Armchair } from 'lucide-react';

interface Seat {
  row: string;
  number: string;
  isAvailable: boolean;
  isLocked: boolean;
  lockedUntil?: string;
  category?: string;
  price?: number;
}

interface SeatSelectorProps {
  exhibitionId: string;
  date: Date;
  timeSlotId: string;
  onSeatsSelect: (seats: Seat[]) => void;
  maxSeats: number;
}

export function SeatSelector({
  exhibitionId,
  date,
  timeSlotId,
  onSeatsSelect,
  maxSeats,
}: SeatSelectorProps) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSeats = async () => {
    try {
      setLoading(true);
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(
        `/api/exhibitions/${exhibitionId}/seats?date=${dateStr}&timeSlotId=${timeSlotId}`
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error.message);
      }

      setSeats(data.data.seats);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load seats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeats();
    // Refresh every 10 seconds for seat status
    const interval = setInterval(fetchSeats, 10000);
    return () => clearInterval(interval);
  }, [exhibitionId, date, timeSlotId]);

  const toggleSeat = (seat: Seat) => {
    if (!seat.isAvailable || seat.isLocked) return;

    const isSelected = selectedSeats.some(
      s => s.row === seat.row && s.number === seat.number
    );

    let newSelection: Seat[];
    if (isSelected) {
      newSelection = selectedSeats.filter(
        s => !(s.row === seat.row && s.number === seat.number)
      );
    } else {
      if (selectedSeats.length >= maxSeats) {
        setError(`Maximum ${maxSeats} seats allowed`);
        return;
      }
      newSelection = [...selectedSeats, seat];
    }

    setSelectedSeats(newSelection);
    onSeatsSelect(newSelection);
    setError(null);
  };

  if (loading && seats.length === 0) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        {error}
      </div>
    );
  }

  if (seats.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No seat selection required for this exhibition
      </div>
    );
  }

  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  const rows = Object.keys(seatsByRow).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Selected: {selectedSeats.length} / {maxSeats} seats
        </div>
        {selectedSeats.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedSeats([]);
              onSeatsSelect([]);
            }}
          >
            Clear Selection
          </Button>
        )}
      </div>

      <Card className="p-6">
        <div className="text-center mb-6 pb-4 border-b">
          <div className="text-sm font-semibold text-muted-foreground">SCREEN</div>
        </div>

        <div className="space-y-3">
          {rows.map(row => (
            <div key={row} className="flex items-center gap-2">
              <div className="w-8 text-sm font-semibold text-muted-foreground">
                {row}
              </div>
              <div className="flex gap-2 flex-wrap">
                {seatsByRow[row]
                  .sort((a, b) => parseInt(a.number) - parseInt(b.number))
                  .map(seat => {
                    const isSelected = selectedSeats.some(
                      s => s.row === seat.row && s.number === seat.number
                    );
                    const isDisabled = !seat.isAvailable || seat.isLocked;

                    return (
                      <button
                        key={`${seat.row}-${seat.number}`}
                        onClick={() => toggleSeat(seat)}
                        disabled={isDisabled}
                        className={`
                          w-10 h-10 rounded flex items-center justify-center text-xs
                          transition-all border-2
                          ${isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : isDisabled
                            ? 'bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-50'
                            : 'bg-background border-border hover:border-primary hover:bg-primary/10'
                          }
                        `}
                        title={`Row ${seat.row}, Seat ${seat.number}${
                          seat.isLocked ? ' (Locked)' : ''
                        }`}
                      >
                        <Armchair className="w-4 h-4" />
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border-2 border-border bg-background" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border-2 border-primary bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border-2 border-muted bg-muted opacity-50" />
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
}
