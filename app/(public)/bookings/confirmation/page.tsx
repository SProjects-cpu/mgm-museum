'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';
import { toast } from 'sonner';
import { formatDateForDisplay } from '@/lib/utils/date-helpers';

export default function BookingConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingIds = searchParams.get('ids')?.split(',') || [];
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Dismiss any lingering toasts when page loads
  useEffect(() => {
    toast.dismiss();
  }, []);

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
        
        console.log('Fetched bookings with dates:', data?.map(b => ({
          id: b.id,
          booking_date: b.booking_date,
          booking_time: b.booking_time,
          slot_date: b.time_slots?.slot_date,
        })));

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
    const downloadStartTime = Date.now();
    setDownloadingId(bookingId);

    // Track download start
    console.log('[ANALYTICS] Client Download Started:', {
      event: 'client_download_start',
      bookingId,
      bookingReference: bookingRef,
      timestamp: new Date().toISOString(),
      userAgent: window.navigator.userAgent,
    });

    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to download your ticket');
        
        // Track authentication error
        console.error('[ANALYTICS] Client Download Error:', {
          event: 'client_download_error',
          bookingId,
          bookingReference: bookingRef,
          errorMessage: 'No active session',
          timestamp: new Date().toISOString(),
        });
        
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
        const errorMessage = errorData.message || 'Failed to generate ticket';
        
        // Track API error
        console.error('[ANALYTICS] Client Download Error:', {
          event: 'client_download_error',
          bookingId,
          bookingReference: bookingRef,
          errorMessage,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        });
        
        throw new Error(errorMessage);
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

      // Track successful download
      const downloadTime = Date.now() - downloadStartTime;
      console.log('[ANALYTICS] Client Download Complete:', {
        event: 'client_download_complete',
        bookingId,
        bookingReference: bookingRef,
        downloadTimeMs: downloadTime,
        timestamp: new Date().toISOString(),
      });

      toast.success('Ticket downloaded successfully!');
    } catch (error) {
      console.error('Download failed:', error);
      
      // Track download error
      console.error('[ANALYTICS] Client Download Error:', {
        event: 'client_download_error',
        bookingId,
        bookingReference: bookingRef,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
      
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
                    {(() => {
                      // Extract time_slots from array if needed
                      const timeSlot = Array.isArray(booking.time_slots) ? booking.time_slots[0] : booking.time_slots;
                      // Priority 1: Use slot_date from time_slots (most accurate)
                      const dateToUse = timeSlot?.slot_date || booking.booking_date;
                      // Use date helper to format without timezone conversion
                      return formatDateForDisplay(dateToUse);
                    })()}
                  </div>
                  
                  <div className="font-semibold text-muted-foreground">Time:</div>
                  <div>
                    {(() => {
                      // Extract time_slots from array if needed
                      const timeSlot = Array.isArray(booking.time_slots) ? booking.time_slots[0] : booking.time_slots;
                      
                      // Priority 1: Use time_slots data if available
                      if (timeSlot?.start_time && timeSlot?.end_time) {
                        const startTime = new Date(`2000-01-01T${timeSlot.start_time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        });
                        const endTime = new Date(`2000-01-01T${timeSlot.end_time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        });
                        return `${startTime} - ${endTime}`;
                      }
                      
                      // Priority 2: Use booking_time fallback
                      if (booking.booking_time) {
                        const [start, end] = booking.booking_time.split('-');
                        const startTime = new Date(`2000-01-01T${start}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        });
                        const endTime = new Date(`2000-01-01T${end}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        });
                        return `${startTime} - ${endTime}`;
                      }
                      
                      // Fallback: Museum hours
                      return '10:00 AM - 6:00 PM';
                    })()}
                  </div>
                  
                  <div className="font-semibold text-muted-foreground">Status:</div>
                  <div className="text-green-600 font-semibold uppercase">{booking.status}</div>
                  
                  <div className="font-semibold text-muted-foreground">Amount Paid:</div>
                  <div className="font-bold text-lg">₹{Math.round(Number(booking.total_amount))}</div>
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
