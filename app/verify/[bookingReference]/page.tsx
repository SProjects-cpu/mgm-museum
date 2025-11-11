'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';
import { CheckCircle, XCircle, Calendar, Clock, User, Mail, Phone, Hash, CreditCard, Ticket } from 'lucide-react';

interface BookingDetails {
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string;
  booking_reference: string;
  ticket_number: string;
  payment_id: string;
  visit_date: string;
  visit_time: string;
  num_tickets: number;
  amount_paid: number;
  status: string;
  booking_timestamp: string;
  exhibition_name: string;
}

export default function VerifyTicketPage() {
  const params = useParams();
  const bookingReference = params.bookingReference as string;
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchBookingDetails() {
      try {
        const response = await fetch(`/api/verify/${bookingReference}`);
        
        if (!response.ok) {
          throw new Error('Booking not found');
        }

        const data = await response.json();
        setBooking(data.booking);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to verify ticket');
      } finally {
        setLoading(false);
      }
    }

    if (bookingReference) {
      fetchBookingDetails();
    }
  }, [bookingReference]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
        <Loader variant="classic" size="lg" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
        <Card className="w-full max-w-md border-red-500/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-500" />
              <CardTitle className="text-red-500">Ticket Not Found</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">{error || 'Invalid booking reference'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isConfirmed = booking.status === 'confirmed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 py-8">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Status Card */}
        <Card className={`border-2 ${isConfirmed ? 'border-green-500/50' : 'border-yellow-500/50'}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {isConfirmed ? (
                <CheckCircle className="w-10 h-10 text-green-500" />
              ) : (
                <XCircle className="w-10 h-10 text-yellow-500" />
              )}
              <div>
                <CardTitle className="text-2xl">
                  {isConfirmed ? 'Valid Ticket' : 'Pending Ticket'}
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">{booking.exhibition_name}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Booking Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visitor Info */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-400">Visitor Name</p>
                  <p className="font-semibold">{booking.visitor_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="font-semibold break-all">{booking.visitor_email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-400">Phone Number</p>
                  <p className="font-semibold">{booking.visitor_phone}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 my-4" />

            {/* Booking Info */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Hash className="w-5 h-5 text-purple-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-400">Booking Reference</p>
                  <p className="font-semibold font-mono">{booking.booking_reference}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Ticket className="w-5 h-5 text-purple-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-400">Ticket Number</p>
                  <p className="font-semibold font-mono">{booking.ticket_number}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-purple-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-400">Payment ID</p>
                  <p className="font-semibold font-mono text-sm">{booking.payment_id}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 my-4" />

            {/* Visit Info */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-green-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-400">Visit Date</p>
                  <p className="font-semibold">{booking.visit_date}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-green-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-400">Visit Time</p>
                  <p className="font-semibold">{booking.visit_time}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Ticket className="w-5 h-5 text-green-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-400">Number of Tickets</p>
                  <p className="font-semibold">{booking.num_tickets}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 my-4" />

            {/* Payment Info */}
            <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-200 font-medium">Amount Paid</span>
                <span className="text-2xl font-bold text-green-400">
                  ₹{Math.round(booking.amount_paid / 100)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-200 font-medium">Status</span>
                <span className={`font-semibold ${isConfirmed ? 'text-green-400' : 'text-yellow-400'}`}>
                  {booking.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-200 font-medium">Booked On</span>
                <span className="text-gray-100">{booking.booking_timestamp}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 pt-4">
          <p>MGM Museum - Ticket Verification</p>
          <p className="mt-1">Keep this ticket for entry</p>
        </div>
      </div>
    </div>
  );
}
