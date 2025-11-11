'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/lib/store/cart';
import { supabase } from '@/lib/supabase/config';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getCartTotal, getTotalTickets, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    termsAccepted: false,
  });

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => {
      setError('Failed to load payment gateway. Please refresh the page.');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Get user data and handle pending booking
  useEffect(() => {
    let isMounted = true;
    
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!isMounted) return;
        
        if (user) {
          setFormData(prev => ({
            ...prev,
            email: user.email || '',
          }));
          
          // Check for pending booking from book-visit flow
          const pendingBooking = sessionStorage.getItem('pendingBooking');
          if (pendingBooking) {
            // IMMEDIATELY remove from sessionStorage to prevent infinite loop
            sessionStorage.removeItem('pendingBooking');
            
            try {
              const data = JSON.parse(pendingBooking);
              console.log('Processing pending booking:', data);
              toast.loading('Adding booking to cart...', { id: 'add-booking' });
              
              // Wait a bit for session to be fully established
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              if (!isMounted) return;
              
              // Validate required data
              if (!data.exhibitionId || !data.selectedTimeSlot || !data.selectedTickets) {
                throw new Error('Invalid booking data. Please try booking again.');
              }
              
              // Safely handle date - ensure it's a valid date string
              let bookingDate: string;
              if (data.selectedDate) {
                try {
                  // Handle both string and Date object
                  const dateObj = typeof data.selectedDate === 'string' 
                    ? new Date(data.selectedDate) 
                    : data.selectedDate;
                  
                  if (isNaN(dateObj.getTime())) {
                    throw new Error('Invalid date');
                  }
                  
                  bookingDate = dateObj.toISOString().split('T')[0];
                } catch (e) {
                  console.error('Date parsing error:', e);
                  throw new Error('Invalid booking date. Please try booking again.');
                }
              } else {
                throw new Error('Booking date is required. Please try booking again.');
              }
              
              const tickets = {
                adult: data.selectedTickets.find((t: any) => t.ticketType.toLowerCase() === 'adult')?.quantity || 0,
                child: data.selectedTickets.find((t: any) => t.ticketType.toLowerCase() === 'child')?.quantity || 0,
                student: data.selectedTickets.find((t: any) => t.ticketType.toLowerCase() === 'student')?.quantity || 0,
                senior: data.selectedTickets.find((t: any) => t.ticketType.toLowerCase() === 'senior')?.quantity || 0,
              };

              const totalTickets = Object.values(tickets).reduce((sum: number, qty) => sum + (qty as number), 0);

              if (totalTickets === 0) {
                throw new Error('No tickets selected. Please try booking again.');
              }

              const fullTimeSlot = {
                id: data.selectedTimeSlot.id,
                slotDate: bookingDate,
                startTime: data.selectedTimeSlot.startTime,
                endTime: data.selectedTimeSlot.endTime,
                capacity: data.selectedTimeSlot.totalCapacity,
                currentBookings: data.selectedTimeSlot.totalCapacity - data.selectedTimeSlot.availableCapacity,
                bufferCapacity: 5,
                availableCapacity: data.selectedTimeSlot.availableCapacity,
                active: true,
                itemType: 'exhibition' as const,
                itemId: data.exhibitionId,
                itemName: data.exhibitionName,
              };

              console.log('Adding to cart with data:', {
                exhibitionId: data.exhibitionId,
                timeSlotId: data.selectedTimeSlot.id,
                tickets,
                totalTickets,
              });

              // Add to cart
              await useCartStore.getState().addItem({
                exhibitionId: data.exhibitionId,
                exhibitionName: data.exhibitionName,
                timeSlotId: data.selectedTimeSlot.id,
                timeSlot: fullTimeSlot,
                bookingDate: bookingDate,
                tickets: tickets,
                totalTickets: totalTickets,
                subtotal: data.totalAmount,
              });

              if (!isMounted) return;
              
              console.log('Booking successfully added to cart');
              toast.success('Booking added to cart!', { id: 'add-booking' });
            } catch (error: any) {
              console.error('Error adding pending booking:', error);
              console.error('Error details:', error.message, error.stack);
              
              if (!isMounted) return;
              
              toast.error(error.message || 'Failed to add booking. Please try again.', { id: 'add-booking' });
              
              setTimeout(() => {
                if (isMounted) {
                  try {
                    const bookingData = JSON.parse(pendingBooking);
                    router.push('/book-visit?exhibitionId=' + (bookingData.exhibitionId || ''));
                  } catch {
                    router.push('/cart');
                  }
                }
              }, 2000);
            }
          } else if (items.length === 0) {
            // Only redirect if no pending booking and cart is empty
            toast.error('Your cart is empty');
            setTimeout(() => {
              if (isMounted) router.push('/cart');
            }, 1000);
          }
        } else {
          toast.error('Please login to continue');
          router.replace('/login?redirect=/cart/checkout');
        }
      } catch (error) {
        console.error('Error in getUser:', error);
        if (isMounted) {
          toast.error('An error occurred. Please refresh the page.');
        }
      }
    };
    
    getUser();
    
    return () => {
      isMounted = false;
    };
  }, [router, items.length]);

  const totalAmount = getCartTotal();
  const totalTickets = getTotalTickets();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.termsAccepted) {
      setError('Please accept the terms and conditions');
      return;
    }

    if (totalAmount > 0 && !razorpayLoaded) {
      setError('Payment gateway is still loading. Please wait...');
      return;
    }

    setLoading(true);

    try {
      // For free admission, skip payment
      if (totalAmount === 0) {
        toast.success('Processing your free booking...');
        // TODO: Create bookings without payment
        router.push('/bookings/confirmation');
        return;
      }

      // Create payment order
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          cartItems: items.map(item => ({
            exhibitionId: item.exhibitionId,
            showId: item.showId,
            timeSlotId: item.timeSlotId,
            bookingDate: item.bookingDate,
            tickets: item.tickets,
            totalTickets: item.totalTickets,
            subtotal: item.subtotal,
            exhibitionName: item.exhibitionName,
            showName: item.showName,
          })),
          userDetails: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create payment order');
      }

      if (data.isFree) {
        toast.success('Processing your free booking...');
        router.push('/bookings/confirmation');
        return;
      }

      // Initialize Razorpay
      initializeRazorpay(data);
    } catch (error: any) {
      console.error('Checkout error:', error);
      setError(error.message || 'Failed to process checkout');
      toast.error(error.message || 'Failed to process checkout');
      setLoading(false);
    }
  };

  const initializeRazorpay = (orderData: any) => {
    if (!window.Razorpay) {
      setError('Payment gateway not loaded. Please refresh the page.');
      setLoading(false);
      return;
    }

    const options = {
      key: orderData.razorpayKeyId,
      amount: orderData.amountInPaise,
      currency: orderData.currency,
      name: 'MGM Museum',
      description: `Booking for ${items.length} item(s)`,
      order_id: orderData.orderId,
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone,
      },
      theme: {
        color: '#3b82f6',
      },
      handler: async function (response: any) {
        await verifyPayment(response);
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
          toast.info('Payment cancelled. Your cart has been preserved.');
        },
        escape: false,
        backdropclose: false,
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        handlePaymentFailure(response.error);
      });
      rzp.open();
    } catch (error: any) {
      console.error('Razorpay initialization error:', error);
      setError('Failed to initialize payment. Please try again.');
      setLoading(false);
    }
  };

  const handlePaymentFailure = async (error: any) => {
    setLoading(false);
    const errorMessage = error.description || error.reason || 'Payment failed';
    setError(errorMessage);
    toast.error(errorMessage);

    // Log failure to backend
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch('/api/payment/failure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            error: {
              code: error.code,
              description: error.description,
              reason: error.reason,
              metadata: error.metadata,
            },
          }),
        });
      }
    } catch (logError) {
      console.error('Failed to log payment failure:', logError);
    }
  };

  const verifyPayment = async (response: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session expired. Please login again.');
      }

      toast.loading('Verifying payment...', { id: 'verify-payment' });

      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      const data = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(data.message || 'Payment verification failed');
      }

      console.log('Payment verification response:', data);

      // Validate bookings exist
      if (!data.bookings || data.bookings.length === 0) {
        console.error('No bookings returned from payment verification:', data);
        throw new Error('No bookings were created. Please contact support.');
      }

      toast.success('Payment successful! Redirecting...', { id: 'verify-payment' });
      
      // Clear cart after successful payment
      await clearCart();
      
      // Redirect to confirmation page
      const bookingIds = data.bookings.map((b: any) => b.id).join(',');
      console.log('Redirecting to confirmation with booking IDs:', bookingIds);
      router.push(`/bookings/confirmation?ids=${bookingIds}`);
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast.error(error.message || 'Payment verification failed', { id: 'verify-payment' });
      setError(error.message || 'Payment verification failed. Please contact support with your payment details.');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/cart')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-4xl font-bold">Checkout</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {!razorpayLoaded && totalAmount > 0 && (
                    <Alert>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertDescription>Loading payment gateway...</AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, termsAccepted: checked as boolean })
                      }
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I accept the terms and conditions and privacy policy
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        {totalAmount === 0 ? 'Confirm Booking' : `Pay ₹${Math.round(totalAmount)}`}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{items.length}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Tickets</span>
                  <span className="font-medium">{totalTickets}</span>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-primary">
                    ₹{Math.round(totalAmount)}
                  </span>
                </div>

                {totalAmount === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
                    Free admission! No payment required.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
