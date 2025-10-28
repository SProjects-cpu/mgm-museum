'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// Booking components
import { BookingCalendar } from '@/components/booking-new/BookingCalendar';
import { TimeSlotSelector } from '@/components/booking-new/TimeSlotSelector';
import { TicketSelector } from '@/components/booking-new/TicketSelector';
import { BookingForm } from '@/components/booking-new/BookingForm';
import { BookingSummary } from '@/components/booking-new/BookingSummary';

import type { TimeSlot, TicketQuantities, BookingFormData, CreateBookingRequest } from '@/types/booking-new';

type BookingStep = 'date' | 'time' | 'tickets' | 'details' | 'confirmation';

export default function BookVisitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get context from URL params
  const exhibitionId = searchParams?.get('exhibitionId') || undefined;
  const showId = searchParams?.get('showId') || undefined;
  const exhibitionName = searchParams?.get('exhibitionName') || undefined;
  const showName = searchParams?.get('showName') || undefined;

  // Booking state
  const [currentStep, setCurrentStep] = useState<BookingStep>('date');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>();
  const [tickets, setTickets] = useState<TicketQuantities>({
    adult: 0,
    child: 0,
    student: 0,
    senior: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingReference, setBookingReference] = useState<string>();

  const steps: { id: BookingStep; title: string; description: string }[] = [
    { id: 'date', title: 'Select Date', description: 'Choose your visit date' },
    { id: 'time', title: 'Select Time', description: 'Pick a time slot' },
    { id: 'tickets', title: 'Select Tickets', description: 'Choose number of visitors' },
    { id: 'details', title: 'Your Details', description: 'Provide contact information' },
    { id: 'confirmation', title: 'Confirmation', description: 'Booking confirmed' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(undefined);
    setCurrentStep('time');
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleNext = () => {
    if (currentStep === 'time') {
      if (!selectedSlot) {
        toast.error('Please select a time slot');
        return;
      }
      setCurrentStep('tickets');
    } else if (currentStep === 'tickets') {
      const totalTickets = Object.values(tickets).reduce((sum, count) => sum + count, 0);
      if (totalTickets === 0) {
        toast.error('Please select at least one ticket');
        return;
      }
      setCurrentStep('details');
    }
  };

  const handleBack = () => {
    if (currentStep === 'time') setCurrentStep('date');
    else if (currentStep === 'tickets') setCurrentStep('time');
    else if (currentStep === 'details') setCurrentStep('tickets');
  };

  const handleSubmit = async (formData: BookingFormData) => {
    if (!selectedDate || !selectedSlot) {
      toast.error('Please select date and time slot');
      return;
    }

    const totalTickets = Object.values(tickets).reduce((sum, count) => sum + count, 0);
    if (totalTickets === 0) {
      toast.error('Please select at least one ticket');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bookingData: CreateBookingRequest = {
        timeSlotId: selectedSlot.id,
        bookingDate: selectedDate.toISOString().split('T')[0],
        visitorName: formData.visitorName,
        visitorEmail: formData.visitorEmail,
        visitorPhone: formData.visitorPhone,
        adultTickets: tickets.adult,
        childTickets: tickets.child,
        studentTickets: tickets.student,
        seniorTickets: tickets.senior,
        totalTickets,
        subtotal: 0,
        discount: 0,
        totalAmount: 0,
        specialRequirements: formData.specialRequirements,
        accessibilityRequirements: formData.accessibilityRequirements,
        exhibitionId,
        showId,
      };

      const response = await fetch('/api/bookings-new/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      setBookingReference(data.bookingReference);
      setCurrentStep('confirmation');
      toast.success('Booking confirmed successfully!');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Book Your Museum Visit</h1>
          <p className="text-lg text-muted-foreground">
            {exhibitionName || showName ? (
              <>Booking for: <span className="font-semibold text-primary">{exhibitionName || showName}</span></>
            ) : (
              'Plan your visit to MGM APJ Abdul Kalam Astrospace Science Centre'
            )}
          </p>
        </div>

        {/* Progress Bar */}
        {currentStep !== 'confirmation' && (
          <div className="mb-8">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2">
              {steps.slice(0, -1).map((step, idx) => (
                <div
                  key={step.id}
                  className={`text-xs ${
                    idx <= currentStepIndex
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {currentStep === 'date' && (
                <motion.div
                  key="date"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <BookingCalendar
                    onDateSelect={handleDateSelect}
                    selectedDate={selectedDate}
                    exhibitionId={exhibitionId}
                    showId={showId}
                  />
                </motion.div>
              )}

              {currentStep === 'time' && selectedDate && (
                <motion.div
                  key="time"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <TimeSlotSelector
                    selectedDate={selectedDate}
                    onSlotSelect={handleSlotSelect}
                    selectedSlot={selectedSlot}
                    exhibitionId={exhibitionId}
                    showId={showId}
                  />
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleBack} className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button onClick={handleNext} className="flex-1" disabled={!selectedSlot}>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {currentStep === 'tickets' && (
                <motion.div
                  key="tickets"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <TicketSelector
                    tickets={tickets}
                    onTicketsChange={setTickets}
                    maxTickets={selectedSlot?.availableCapacity || 10}
                  />
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleBack} className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={handleNext} 
                      className="flex-1"
                      disabled={Object.values(tickets).reduce((sum, count) => sum + count, 0) === 0}
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {currentStep === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <BookingForm
                    onSubmit={handleSubmit}
                    loading={loading}
                    error={error}
                  />
                  <Button variant="outline" onClick={handleBack} className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Tickets
                  </Button>
                </motion.div>
              )}

              {currentStep === 'confirmation' && bookingReference && (
                <motion.div
                  key="confirmation"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="mb-6">
                    <CheckCircle className="w-20 h-20 mx-auto text-green-600 mb-4" />
                    <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
                    <p className="text-lg text-muted-foreground">
                      Your visit has been successfully booked
                    </p>
                  </div>

                  <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-6 mb-6 inline-block">
                    <p className="text-sm text-muted-foreground mb-1">Booking Reference</p>
                    <p className="text-3xl font-bold text-primary">{bookingReference}</p>
                  </div>

                  <div className="space-y-3 max-w-md mx-auto">
                    <p className="text-sm text-muted-foreground">
                      A confirmation email has been sent to your email address with your booking details.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Please arrive 15 minutes before your scheduled time slot.
                    </p>
                  </div>

                  <div className="flex gap-3 mt-8 max-w-md mx-auto">
                    <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
                      Back to Home
                    </Button>
                    <Button onClick={() => window.location.reload()} className="flex-1">
                      Make Another Booking
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Summary Sidebar */}
          {currentStep !== 'confirmation' && (
            <div className="lg:col-span-1">
              <BookingSummary
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
                tickets={tickets}
                exhibitionName={exhibitionName}
                showName={showName}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
