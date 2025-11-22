'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, Home, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';
import { toast } from 'sonner';

export default function BookingConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingIds = searchParams.get('ids')?.split(',') || [];
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (bookingIds.length === 0) {
      toast.error('No booking IDs provided');
      router.push('/');
      return;
    }

    fetchBookings();
  }, [bookingIds]);

  const fetchBookings = async () => {
    try {
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          exhibitions (
            id,
            title,
            slug
          ),
          time_slots (
            id,
            slot_date,
            start_time,
            end_time
          )
        `)
        .in('id', bookingIds);

      if (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Failed to load booking details');
        return;
      }

      setBookings(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = async (bookingId: string) => {
    try {
      setDownloading(bookingId);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please login to download tickets');
        return;
      }

      const response = await fetch(`/api/bookings/${bookingId}/ticket`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to download ticket');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Ticket downloaded successfully');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download ticket');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-muted-foreground">
            Your payment was successful and your booking has been confirmed.
          </p>
        </div>

        {/* Booking Details */}
        <div className="space-y-4 mb-8">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {booking.exhibitions?.title || 'Booking'}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {booking.booking_reference}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(booking.booking_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Time</p>
                    <p className="font-medium">
                      {booking.time_slots?.start_time} - {booking.time_slots?.end_time}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium capitalize text-green-600">
                      {booking.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Amount Paid</p>
                    <p className="font-medium">₹{booking.total_amount}</p>
                  </div>
                </div>

                {booking.metadata?.tickets && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tickets</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(booking.metadata.tickets).map(([type, count]: [string, any]) => 
                        count > 0 ? (
                          <span key={type} className="px-3 py-1 bg-secondary rounded-full text-sm">
                            {count} {type.charAt(0).toUpperCase() + type.slice(1)}
                          </span>
                        ) : null
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => downloadTicket(booking.id)}
                  disabled={downloading === booking.id}
                  className="w-full"
                >
                  {downloading === booking.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Ticket
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* What's Next */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Download your ticket using the button above</li>
              <li>• A confirmation email has been sent to your email address</li>
              <li>• Please bring a printed or digital copy of your ticket</li>
              <li>• Arrive at least 15 minutes before your scheduled time</li>
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="flex-1"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <Button
            onClick={() => router.push('/bookings')}
            className="flex-1"
          >
            View All Bookings
          </Button>
        </div>
      </div>
    </div>
  );
}
