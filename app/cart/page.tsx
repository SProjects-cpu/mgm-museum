'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2, Eye, MessageSquare, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';
import { toast } from 'sonner';
import { FeedbackDialog } from '@/components/feedback/feedback-dialog';
import BlockLoader from '@/components/ui/block-loader';

interface CartItem {
  id: string;
  quantity: number;
  subtotal: number;
  date: string;
  time: string;
  exhibitions?: { name: string; slug: string };
  shows?: { name: string; slug: string };
  time_slots?: { start_time: string; end_time: string; slot_date: string };
}

interface ConfirmedBooking {
  id: string;
  booking_reference: string;
  booking_date: string;
  booking_time?: string;
  guest_name: string;
  total_amount: number;
  status: string;
  exhibitions?: { name: string; slug: string };
  shows?: { name: string; slug: string };
  time_slots?: { start_time: string; end_time: string; slot_date: string };
  has_feedback: boolean;
}

export default function CartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pendingItems, setPendingItems] = useState<CartItem[]>([]);
  const [confirmedBookings, setConfirmedBookings] = useState<ConfirmedBooking[]>([]);
  const [feedbackDialog, setFeedbackDialog] = useState<{
    open: boolean;
    bookingId: string;
    eventName: string;
  }>({ open: false, bookingId: '', eventName: '' });

  useEffect(() => {
    fetchCartData();
  }, []);

  const fetchCartData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/cart/bookings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPendingItems(data.pending || []);
        setConfirmedBookings(data.confirmed || []);
      } else {
        toast.error('Failed to load cart data');
      }
    } catch (error) {
      console.error('Error fetching cart data:', error);
      toast.error('Failed to load cart data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePending = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast.success('Item removed from cart');
      fetchCartData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to remove item');
    }
  };

  const handleProvideFeedback = (bookingId: string, eventName: string) => {
    setFeedbackDialog({
      open: true,
      bookingId,
      eventName,
    });
  };

  const handleFeedbackSuccess = () => {
    fetchCartData(); // Refresh to update has_feedback status
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <BlockLoader
          blockColor="bg-primary"
          borderColor="border-primary"
          size={80}
          gap={6}
          speed={1.2}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">My Cart</h1>
        </div>

        {/* Pending Bookings Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pending Bookings</span>
              <span className="text-sm font-normal text-muted-foreground">
                {pendingItems.length} {pendingItems.length === 1 ? 'item' : 'items'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No pending bookings</p>
                <Button onClick={() => router.push('/exhibitions')}>
                  Browse Exhibitions
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingItems.map((item) => {
                  const eventName = item.exhibitions?.name || item.shows?.name || 'Event';
                  const date = item.time_slots?.slot_date || item.date;
                  const time = item.time_slots
                    ? `${item.time_slots.start_time} - ${item.time_slots.end_time}`
                    : item.time;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-white"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{eventName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(date).toLocaleDateString()} • {time}
                        </p>
                        <p className="text-sm font-medium mt-1">
                          ₹{Number(item.subtotal).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push('/checkout')}
                        >
                          Checkout
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeletePending(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmed Bookings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Confirmed Bookings</span>
              <span className="text-sm font-normal text-muted-foreground">
                {confirmedBookings.length} {confirmedBookings.length === 1 ? 'booking' : 'bookings'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {confirmedBookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No confirmed bookings yet</p>
                <Button onClick={() => router.push('/exhibitions')}>
                  Book Your First Visit
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {confirmedBookings.map((booking) => {
                  const eventName = booking.exhibitions?.name || booking.shows?.name || 'Museum Visit';
                  const date = booking.time_slots?.slot_date || booking.booking_date;
                  const time = booking.time_slots
                    ? `${booking.time_slots.start_time} - ${booking.time_slots.end_time}`
                    : booking.booking_time || 'Time TBD';

                  return (
                    <div
                      key={booking.id}
                      className="p-4 border rounded-lg bg-white space-y-3"
                    >
                      {/* Event Info */}
                      <div>
                        <h3 className="font-semibold text-lg">{eventName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Booking Reference: <span className="font-mono font-medium">{booking.booking_reference}</span>
                        </p>
                      </div>

                      {/* Booking Details */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Date:</span>
                          <p className="font-medium">
                            {new Date(date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Time:</span>
                          <p className="font-medium">{time}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Guest:</span>
                          <p className="font-medium">{booking.guest_name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <p className="font-medium">₹{Number(booking.total_amount).toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/bookings/${booking.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        {booking.has_feedback ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Feedback Submitted
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleProvideFeedback(booking.id, eventName)}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Provide Feedback
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="mt-6">
          <Button variant="outline" onClick={() => router.push('/')}>
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={feedbackDialog.open}
        onOpenChange={(open) => setFeedbackDialog({ ...feedbackDialog, open })}
        bookingId={feedbackDialog.bookingId}
        eventName={feedbackDialog.eventName}
        onSuccess={handleFeedbackSuccess}
      />
    </div>
  );
}
