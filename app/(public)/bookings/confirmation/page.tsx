'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';
import { toast } from 'sonner';

export default function BookingConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingIds = searchParams.get('ids')?.split(',') || [];
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (bookingIds.length === 0) {
        router.push('/');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            exhibitions:exhibition_id (name),
            shows:show_id (name),
            time_slots:time_slot_id (start_time, end_time, slot_date)
          `)
          .in('id', bookingIds);

        if (error) throw error;
        setBookings(data || []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [bookingIds, router]);

  const handleDownloadTicket = async (bookingId: string, bookingRef: string) => {
    setDownloadingId(bookingId);
    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to download your ticket');
        return;
      }

      // Call PDF generation API
      const response = await fetch(`/api/tickets/generate/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate ticket');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MGM-Ticket-${bookingRef}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Ticket downloaded successfully!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download ticket');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your booking details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl">Booking Confirmed!</CardTitle>
            <p className="text-muted-foreground mt-2">
              Your payment was successful and your booking has been confirmed.
            </p>
          </CardHeader>
          <CardContent>
            {bookings.map((booking) => (
              <div key={booking.id} className="mb-6 p-6 border rounded-lg bg-white shadow-sm">
                {/* Event Title */}
                <h3 className="text-lg font-bold mb-4 text-primary">
                  {booking.exhibitions?.name || booking.shows?.name || 'Museum Visit'}
                </h3>

                {/* Booking Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="font-semibold text-muted-foreground">Booking Reference:</div>
                  <div className="font-mono font-bold">{booking.booking_reference}</div>
                  
                  {booking.payment_id && (
                    <>
                      <div className="font-semibold text-muted-foreground">Payment ID:</div>
                      <div className="font-mono text-xs">{booking.payment_id}</div>
                    </>
                  )}
                  
                  <div className="font-semibold text-muted-foreground">Date:</div>
                  <div>
                    {booking.time_slots?.slot_date 
                      ? new Date(booking.time_slots.slot_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : new Date(booking.booking_date).toLocaleDateString()}
                  </div>
                  
                  {booking.time_slots && (
                    <>
                      <div className="font-semibold text-muted-foreground">Time:</div>
                      <div>
                        {new Date(`2000-01-01T${booking.time_slots.start_time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                        {' - '}
                        {new Date(`2000-01-01T${booking.time_slots.end_time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </div>
                    </>
                  )}
                  
                  <div className="font-semibold text-muted-foreground">Status:</div>
                  <div className="text-green-600 font-semibold uppercase">{booking.status}</div>
                  
                  <div className="font-semibold text-muted-foreground">Amount Paid:</div>
                  <div className="font-bold text-lg">₹{Number(booking.total_amount).toFixed(2)}</div>
                </div>

                {/* Download Button */}
                <Button
                  className="w-full mt-4"
                  onClick={() => handleDownloadTicket(booking.id, booking.booking_reference)}
                  disabled={downloadingId === booking.id}
                >
                  {downloadingId === booking.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Ticket...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Ticket
                    </>
                  )}
                </Button>
              </div>
            ))}

            <div className="mt-6 space-y-3">
              <Button className="w-full" onClick={() => router.push('/')}>
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-900">
              <p className="font-semibold mb-2">📋 What's Next?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Download your ticket using the button above</li>
                <li>A confirmation email has been sent to your email address</li>
                <li>Please arrive 15 minutes before your scheduled time</li>
                <li>Present your ticket (digital or printed) at the entrance</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
