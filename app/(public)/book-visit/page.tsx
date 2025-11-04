'use client';

import { useSearchParams } from 'next/navigation';
import { useBookingFlow } from '@/lib/hooks/useBookingFlow';
import { BookingCalendar } from '@/components/booking/BookingCalendar';
import { TimeSlotSelector } from '@/components/booking/TimeSlotSelector';
import { TicketTypeSelector } from '@/components/booking/TicketTypeSelector';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Calendar, Clock, Ticket, CreditCard } from 'lucide-react';

export default function BookVisitPage() {
  const searchParams = useSearchParams();
  const exhibitionId = searchParams.get('exhibitionId') || '';
  const exhibitionName = searchParams.get('exhibitionName') || 'Exhibition';

  const {
    step,
    selectedDate,
    selectedTimeSlot,
    selectedTickets,
    selectDate,
    selectTimeSlot,
    selectTickets,
    goToNextStep,
    goToPreviousStep,
    totalAmount,
    canProceed,
    error,
    setError,
  } = useBookingFlow(exhibitionId);

  if (!exhibitionId) {
    return (
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Invalid Booking Request</h1>
          <p className="text-muted-foreground">
            Please select an exhibition to book
          </p>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 'date', label: 'Select Date', icon: Calendar },
    { id: 'time', label: 'Select Time', icon: Clock },
    { id: 'tickets', label: 'Select Tickets', icon: Ticket },
    { id: 'payment', label: 'Payment', icon: CreditCard },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Book Your Visit</h1>
          <p className="text-lg text-muted-foreground">{exhibitionName}</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center mb-2
                        ${isActive
                          ? 'bg-primary text-primary-foreground'
                          : isCompleted
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                        }
                      `}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-medium text-center">
                      {s.label}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        h-1 flex-1 mx-2
                        ${isCompleted ? 'bg-primary' : 'bg-muted'}
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="p-4 mb-6 bg-destructive/10 border-destructive">
            <div className="flex items-center justify-between">
              <p className="text-destructive">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </div>
          </Card>
        )}

        {/* Step Content */}
        <Card className="p-6 mb-6">
          {step === 'date' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Select Your Visit Date</h2>
              <BookingCalendar
                exhibitionId={exhibitionId}
                onDateSelect={selectDate}
                selectedDate={selectedDate || undefined}
              />
            </div>
          )}

          {step === 'time' && selectedDate && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Select Time Slot</h2>
              <p className="text-muted-foreground mb-4">
                Date: {selectedDate.toLocaleDateString()}
              </p>
              <TimeSlotSelector
                exhibitionId={exhibitionId}
                date={selectedDate}
                onSlotSelect={(id) => {
                  // This is a simplified version - in production, you'd fetch the full slot object
                  selectTimeSlot({
                    id,
                    startTime: '',
                    endTime: '',
                    totalCapacity: 0,
                    availableCapacity: 0,
                  });
                }}
                selectedSlotId={selectedTimeSlot?.id}
              />
            </div>
          )}

          {step === 'tickets' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Select Tickets</h2>
              <div className="mb-4 text-muted-foreground">
                <p>Date: {selectedDate?.toLocaleDateString()}</p>
                {selectedTimeSlot && (
                  <p>Time: {selectedTimeSlot.startTime} - {selectedTimeSlot.endTime}</p>
                )}
              </div>
              <TicketTypeSelector
                exhibitionId={exhibitionId}
                date={selectedDate || undefined}
                timeSlotId={selectedTimeSlot?.id}
                onTicketsChange={selectTickets}
              />
            </div>
          )}

          {step === 'payment' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Payment</h2>
              <div className="space-y-4">
                <Card className="p-4 bg-muted">
                  <h3 className="font-semibold mb-2">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{selectedDate?.toLocaleDateString()}</span>
                    </div>
                    {selectedTimeSlot && (
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span>{selectedTimeSlot.startTime} - {selectedTimeSlot.endTime}</span>
                      </div>
                    )}
                    {selectedTickets.map(ticket => (
                      <div key={ticket.ticketType} className="flex justify-between">
                        <span>{ticket.ticketType} x {ticket.quantity}:</span>
                        <span>₹{ticket.subtotal}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total:</span>
                      <span>₹{totalAmount}</span>
                    </div>
                  </div>
                </Card>
                <div className="text-center text-muted-foreground">
                  <p>Payment integration coming soon</p>
                  <p className="text-sm mt-2">
                    This will integrate with Razorpay for secure payments
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={step === 'date'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="text-lg font-bold">
            {totalAmount > 0 && `Total: ₹${totalAmount}`}
          </div>

          <Button
            onClick={goToNextStep}
            disabled={!canProceed}
          >
            {step === 'payment' ? 'Complete Booking' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
