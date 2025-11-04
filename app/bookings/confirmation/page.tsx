'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';

export default function BookingConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingIds = searchParams.get('ids')?.split(',') || [];
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (bookingIds.length === 0) {
        router.push('/');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .in('id', bookingIds);

        if (error) throw error;
        setBookings(data || []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [bookingIds, router]);

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
              <div key={booking.id} className="mb-4 p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-semibold">Booking Reference:</div>
                  <div>{booking.booking_reference}</div>
                  
                  <div className="font-semibold">Date:</div>
                  <div>{new Date(booking.booking_date).toLocaleDateString()}</div>
                  
                  <div className="font-semibold">Status:</div>
                  <div className="text-green-600 font-semibold">{booking.status}</div>
                  
                  <div className="font-semibold">Amount:</div>
                  <div>₹{booking.total_amount}</div>
                </div>
              </div>
            ))}

            <div className="mt-6 space-y-3">
              <Button className="w-full" onClick={() => router.push('/')}>
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/bookings')}>
                View My Bookings
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-900">
              <p className="font-semibold mb-2">What's Next?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>A confirmation email has been sent to your email address</li>
                <li>You can view your tickets in the "My Bookings" section</li>
                <li>Please arrive 15 minutes before your scheduled time</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
