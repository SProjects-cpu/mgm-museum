'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle, ShoppingCart, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/lib/store/cart';

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
  const [cartItemAdded, setCartItemAdded] = useState(false);
  const [pricing, setPricing] = useState<Record<string, { price: number; currency: string }>>({});
  const [pricingLoading, setPricingLoading] = useState(false);
  
  // Cart store
  const { addItem } = useCartStore();

  // Fetch pricing when date is selected
  useEffect(() => {
    if (selectedDate && (exhibitionId || showId)) {
      fetchPricing();
    }
  }, [selectedDate, exhibitionId, showId]);

  const fetchPricing = async () => {
    setPricingLoading(true);
    try {
      const params = new URLSearchParams({
        date: selectedDate!.toISOString().split('T')[0],
      });
      if (exhibitionId) params.append('exhibitionId', exhibitionId);
      if (showId) params.append('showId', showId);

      const response = await fetch(`/api/pricing/current?${params}`);
      const data = await response.json();

      if (data.success) {
        setPricing(data.pricing);
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
      // Default to free admission if pricing fetch fails
      setPricing({
        adult: { price: 0, currency: 'INR' },
        child: { price: 0, currency: 'INR' },
        student: { price: 0, currency: 'INR' },
        senior: { price: 0, currency: 'INR' },
      });
    } finally {
      setPricingLoading(false);
    }
  };

  const calculateSubtotal = () => {
    let total = 0;
    Object.entries(tickets).forEach(([type, count]) => {
      if (pricing[type]) {
        total += pricing[type].price * count;
      }
    });
    return total;
  };

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
      // Calculate subtotal based on pricing
      const subtotal = calculateSubtotal();

      // Add item to cart with calculated pricing
      await addItem({
        timeSlotId: selectedSlot.id,
        exhibitionId,
        showId,
        exhibitionName,
        showName,
        bookingDate: selectedDate.toISOString().split('T')[0],
        timeSlot: selectedSlot,
        tickets,
        totalTickets,
        subtotal,
      });

      setCartItemAdded(true);
      setCurrentStep('confirmation');
      toast.success('Added to cart successfully!');
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
                    pricing={pricing}
                    pricingLoading={pricingLoading}
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
                  <div className="space-y-4">
                    <div className="bg-muted/50 border rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">Ready to add to cart?</p>
                      <p className="text-xs text-muted-foreground">
                        Your seats will be reserved for 15 minutes. You can review and complete your booking in the cart.
                      </p>
                    </div>
                    <Button 
                      onClick={() => handleSubmit({} as BookingFormData)} 
                      className="w-full"
                      disabled={loading}
                      size="lg"
                    >
                      {loading ? (
                        'Adding to Cart...'
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </div>
                  <Button variant="outline" onClick={handleBack} className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Tickets
                  </Button>
                </motion.div>
              )}

              {currentStep === 'confirmation' && cartItemAdded && (
                <motion.div
                  key="confirmation"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="mb-6">
                    <ShoppingCart className="w-20 h-20 mx-auto text-green-600 mb-4" />
                    <h2 className="text-3xl font-bold mb-2">Added to Cart!</h2>
                    <p className="text-lg text-muted-foreground">
                      Your booking has been added to your cart
                    </p>
                  </div>

                  <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-6 mb-6 inline-block">
                    <div className="flex items-center gap-2 text-orange-600 mb-2">
                      <Clock className="w-5 h-5" />
                      <p className="text-sm font-medium">Reserved for 15 minutes</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Complete your booking before the timer expires
                    </p>
                  </div>

                  <div className="space-y-3 max-w-md mx-auto">
                    <p className="text-sm text-muted-foreground">
                      Your seats have been temporarily reserved. Please proceed to checkout to confirm your booking.
                    </p>
                  </div>

                  <div className="flex gap-3 mt-8 max-w-md mx-auto">
                    <Button variant="outline" onClick={() => window.location.reload()} className="flex-1">
                      Continue Booking
                    </Button>
                    <Button onClick={() => router.push('/cart')} className="flex-1">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      View Cart
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
