import { useState, useCallback, useEffect } from 'react';

export type BookingStep = 'date' | 'time' | 'tickets' | 'payment' | 'confirmation';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  totalCapacity: number;
  availableCapacity: number;
}

interface TicketSelection {
  ticketType: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface SeatLock {
  lockId: string;
  expiresAt: string;
  seats: Array<{ row: string; number: string }>;
}

export function useBookingFlow(exhibitionId: string) {
  const [step, setStep] = useState<BookingStep>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<TicketSelection[]>([]);
  const [seatLock, setSeatLock] = useState<SeatLock | null>(null);
  const [lockTimeRemaining, setLockTimeRemaining] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Calculate total amount
  const totalAmount = selectedTickets.reduce((sum, ticket) => sum + ticket.subtotal, 0);

  // Check if can proceed to next step
  const canProceed = useCallback(() => {
    switch (step) {
      case 'date':
        return selectedDate !== null;
      case 'time':
        return selectedTimeSlot !== null;
      case 'tickets':
        return selectedTickets.length > 0 && totalAmount > 0;
      case 'payment':
        return seatLock !== null;
      default:
        return false;
    }
  }, [step, selectedDate, selectedTimeSlot, selectedTickets, totalAmount, seatLock]);

  // Lock countdown timer
  useEffect(() => {
    if (!seatLock) {
      setLockTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const expiresAt = new Date(seatLock.expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setLockTimeRemaining(remaining);

      if (remaining === 0) {
        setSeatLock(null);
        setError('Your seat reservation has expired. Please select seats again.');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [seatLock]);

  // Step navigation
  const goToNextStep = useCallback(() => {
    if (!canProceed()) return;

    const stepOrder: BookingStep[] = ['date', 'time', 'tickets', 'payment', 'confirmation'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
      setError(null);
    }
  }, [step, canProceed]);

  const goToPreviousStep = useCallback(() => {
    const stepOrder: BookingStep[] = ['date', 'time', 'tickets', 'payment', 'confirmation'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
      setError(null);
    }
  }, [step]);

  const goToStep = useCallback((newStep: BookingStep) => {
    setStep(newStep);
    setError(null);
  }, []);

  // Selection handlers
  const selectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    setSelectedTickets([]);
    setSeatLock(null);
    setError(null);
  }, []);

  const selectTimeSlot = useCallback((slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    setSelectedTickets([]);
    setSeatLock(null);
    setError(null);
  }, []);

  const selectTickets = useCallback((tickets: TicketSelection[]) => {
    setSelectedTickets(tickets);
    setError(null);
  }, []);

  const createSeatLock = useCallback(async () => {
    if (!selectedDate || !selectedTimeSlot || selectedTickets.length === 0) {
      setError('Please complete all selections before proceeding');
      return false;
    }

    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await fetch('/api/bookings/lock-seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exhibitionId,
          date: selectedDate.toISOString().split('T')[0],
          timeSlotId: selectedTimeSlot.id,
          seats: [], // For non-seat exhibitions, empty array
          sessionId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error.message);
      }

      setSeatLock(data.data);
      setError(null);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to lock seats');
      return false;
    }
  }, [exhibitionId, selectedDate, selectedTimeSlot, selectedTickets]);

  const resetFlow = useCallback(() => {
    setStep('date');
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setSelectedTickets([]);
    setSeatLock(null);
    setLockTimeRemaining(0);
    setError(null);
  }, []);

  return {
    // State
    step,
    selectedDate,
    selectedTimeSlot,
    selectedTickets,
    seatLock,
    lockTimeRemaining,
    error,
    
    // Computed
    totalAmount,
    canProceed: canProceed(),
    
    // Actions
    selectDate,
    selectTimeSlot,
    selectTickets,
    createSeatLock,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    resetFlow,
    setError,
  };
}
