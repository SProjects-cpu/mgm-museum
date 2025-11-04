'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBookingFlow } from '@/lib/hooks/useBookingFlow';
import { BookingCalendar } from '@/components/booking/BookingCalendar';
import { TimeSlotSelector } from '@/components/booking/TimeSlotSelector';
import { TicketTypeSelector } from '@/components/booking/TicketTypeSelector';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Calendar, Clock, Ticket, CreditCard, Loader2 } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { supabase } from '@/lib/supabase/config';
import { toast } from 'sonner';

export default function BookVisitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exhibitionId = searchParams.get('exhibitionId') || '';
  const exhibitionName = searchParams.get('exhibitionName') || 'Exhibition';
  const action = searchParams.get('action');
  const [addingToCart, setAddingToCart] = useState(false);
  const { addItem } = useCartStore();

  // Handle return from login
  useEffect(() => {
    if (action === 'checkout') {
      const pendingBooking = sessionStorage.getItem('pendingBooking');
      if (pendingBooking) {
        try {
          const data = JSON.parse(pendingBooking);
          // Restore booking state and proceed to checkout
          sessionStorage.removeItem('pendingBooking');
          toast.success('Login successful! Proceeding with your booking...');
          
          // Auto-trigger checkout after a brief delay
          setTimeout(() => {
            const checkoutBtn = document.querySelector('[data-checkout-btn]') as HTMLButtonElement;
            if (checkoutBtn) checkoutBtn.click();
          }, 1000);
        } catch (error) {
          console.error('Error restoring booking:', error);
        }
      }
    }
  }, [action]);

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

  const handleProceedToCheckout = async () => {
    if (!selectedDate || !selectedTimeSlot || selectedTickets.length === 0) {
      toast.error('Please complete all booking details');
      return;
    }

    setAddingToCart(true);
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Store booking data in sessionStorage for after login
        const bookingData = {
          exhibitionId,
          exhibitionName,
          selectedDate: selectedDate.toISOString(),
          selectedTimeSlot,
          selectedTickets,
          totalAmount,
        };
        sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
        
        toast.info('Please login to continue with your booking');
        router.push('/login?redirect=/book-visit&action=checkout');
        return;
      }
      // Convert selected tickets to the format expected by cart
      const tickets = {
        adult: selectedTickets.find(t => t.ticketType.toLowerCase() === 'adult')?.quantity || 0,
        child: selectedTickets.find(t => t.ticketType.toLowerCase() === 'child')?.quantity || 0,
        student: selectedTickets.find(t => t.ticketType.toLowerCase() === 'student')?.quantity || 0,
        senior: selectedTickets.find(t => t.ticketType.toLowerCase() === 'senior')?.quantity || 0,
      };

      const totalTickets = Object.values(tickets).reduce((sum, qty) => sum + qty, 0);

      // Create a full TimeSlot object for the cart
      const fullTimeSlot = {
        id: selectedTimeSlot.id,
        slotDate: selectedDate.toISOString().split('T')[0],
        startTime: selectedTimeSlot.startTime,
        endTime: selectedTimeSlot.endTime,
        capacity: selectedTimeSlot.totalCapacity,
        currentBookings: selectedTimeSlot.totalCapacity - selectedTimeSlot.availableCapacity,
        bufferCapacity: 5,
        availableCapacity: selectedTimeSlot.availableCapacity,
        active: true,
        itemType: 'exhibition' as const,
        itemId: exhibitionId,
        itemName: exhibitionName,
      };

      // Add to cart
      await addItem({
        exhibitionId: exhibitionId,
        exhibitionName: exhibitionName,
        timeSlotId: selectedTimeSlot.id,
        timeSlot: fullTimeSlot,
        bookingDate: selectedDate.toISOString().split('T')[0],
        tickets: tickets,
        totalTickets: totalTickets,
        subtotal: totalAmount,
      });

      toast.success('Added to cart! Redirecting to checkout...');
      
      // Redirect to checkout
      setTimeout(() => {
        router.push('/cart/checkout');
      }, 1000);
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast.error(error.message || 'Failed to add to cart');
      setAddingToCart(false);
    }
  };

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
              <h2 className="text-2xl font-bold mb-4">Review & Proceed to Payment</h2>
              <div className="space-y-4">
                <Card className="p-4 bg-muted">
                  <h3 className="font-semibold mb-2">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Exhibition:</span>
                      <span className="font-medium">{exhibitionName}</span>
                    </div>
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    Click "Proceed to Checkout" to add this booking to your cart and complete payment securely via Razorpay.
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
            onClick={step === 'payment' ? handleProceedToCheckout : goToNextStep}
            disabled={(step !== 'payment' && !canProceed) || (step === 'payment' && addingToCart)}
            data-checkout-btn={step === 'payment' ? 'true' : undefined}
          >
            {addingToCart ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding to Cart...
              </>
            ) : step === 'payment' ? (
              <>
                Proceed to Checkout
                <CreditCard className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
