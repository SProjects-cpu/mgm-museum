'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Calendar, Clock, Users, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BookingConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const bookingsParam = searchParams?.get('bookings');
    if (bookingsParam) {
      try {
        const parsedBookings = JSON.parse(bookingsParam);
        setBookings(Array.isArray(parsedBookings) ? parsedBookings : [parsedBookings]);
      } catch (error) {
        console.error('Error parsing bookings:', error);
      }
    }
  }, [searchParams]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDownloadTicket = (booking: any) => {
    // TODO: Implement PDF generation
    console.log('Download ticket for booking:', booking.booking_reference);
  };

  if (bookings.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No booking information found</p>
            <Button onClick={() => router.push('/')} className="mt-4">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <CheckCircle className="w-20 h-20 mx-auto text-green-600 mb-4" />
          <h1 className="text-4xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-lg text-muted-foreground">
            Your visit has been successfully booked
          </p>
        </motion.div>

        {/* Booking Details */}
        <div className="space-y-6">
          {bookings.map((booking, index) => (
            <motion.div
              key={booking.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  {/* Booking Reference */}
                  <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-4 mb-6">
                    <p className="text-sm text-muted-foreground mb-1">Booking Reference</p>
                    <p className="text-2xl font-bold text-primary">
                      {booking.booking_reference}
                    </p>
                  </div>

                  {/* Booking Info */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium">{formatDate(booking.booking_date)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium">
                          {booking.time_slot?.start_time} - {booking.time_slot?.end_time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Tickets</p>
                        <p className="font-medium">{booking.total_tickets} ticket(s)</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.adult_tickets > 0 && `${booking.adult_tickets} Adult `}
                          {booking.child_tickets > 0 && `${booking.child_tickets} Child `}
                          {booking.student_tickets > 0 && `${booking.student_tickets} Student `}
                          {booking.senior_tickets > 0 && `${booking.senior_tickets} Senior`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">MGM Museum</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadTicket(booking)}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Ticket
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Important Information */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <h3 className="font-bold mb-4">Important Information</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Please arrive 15 minutes before your scheduled time slot</li>
              <li>• Bring a valid ID for verification</li>
              <li>• Show your booking reference at the entrance</li>
              <li>• A confirmation email has been sent to your email address</li>
              <li>• For any queries, contact us at info@mgmmuseum.com</li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
            Back to Home
          </Button>
          <Button onClick={() => router.push('/book-visit')} className="flex-1">
            Make Another Booking
          </Button>
        </div>
      </div>
    </div>
  );
}
