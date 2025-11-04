'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  Users, 
  Download, 
  Loader2, 
  AlertCircle,
  MapPin,
  CreditCard,
  QrCode,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/config';

interface Booking {
  id: string;
  booking_reference: string;
  booking_date: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone?: string;
  adult_tickets: number;
  child_tickets: number;
  student_tickets: number;
  senior_tickets: number;
  total_tickets: number;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method?: string;
  created_at: string;
  time_slot?: {
    start_time: string;
    end_time: string;
  };
  exhibition?: {
    name: string;
    description?: string;
  };
  show?: {
    name: string;
    description?: string;
  };
  tickets?: Array<{
    id: string;
    ticket_number: string;
    qr_code: string;
    status: string;
  }>;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingTicket, setDownloadingTicket] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login to view your bookings');
        router.push('/login');
        return;
      }
      setUser(user);
      fetchBookings();
    };

    checkAuth();
  }, [router]);

  const fetchBookings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/user/bookings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast.error(error.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTicket = async (bookingId: string, bookingReference: string) => {
    setDownloadingTicket(bookingId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please login to download tickets');
        return;
      }

      const response = await fetch(`/api/tickets/generate?bookingId=${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate ticket');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${bookingReference}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Ticket downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading ticket:', error);
      toast.error(error.message || 'Failed to download ticket');
    } finally {
      setDownloadingTicket(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'free':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">My Bookings</h1>
          <Card>
            <CardContent className="py-20 text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">No bookings yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven't made any bookings. Start exploring our exhibitions and shows!
              </p>
              <Button onClick={() => router.push('/exhibitions')}>
                Browse Exhibitions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground">
            View and manage your museum bookings
          </p>
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
          {bookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-2">
                        {booking.exhibition?.name || booking.show?.name}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <Badge className={getPaymentStatusColor(booking.payment_status)}>
                          {booking.payment_status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Booking Reference</p>
                      <p className="text-lg font-bold text-primary">
                        {booking.booking_reference}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                      <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="font-medium">₹{booking.total_amount.toFixed(2)}</p>
                        {booking.payment_method && (
                          <p className="text-xs text-muted-foreground capitalize">
                            {booking.payment_method}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* QR Code Section */}
                  {booking.tickets && booking.tickets.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <QrCode className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Quick Access</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {booking.tickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="bg-muted p-2 rounded-lg text-center"
                          >
                            <img
                              src={ticket.qr_code}
                              alt={`QR Code for ${ticket.ticket_number}`}
                              className="w-24 h-24 mx-auto"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {ticket.ticket_number}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    {booking.status === 'confirmed' && booking.payment_status === 'paid' && (
                      <Button
                        variant="default"
                        onClick={() => handleDownloadTicket(booking.id, booking.booking_reference)}
                        disabled={downloadingTicket === booking.id}
                      >
                        {downloadingTicket === booking.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Download Ticket
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/bookings/confirmation?ids=${booking.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Button variant="outline" onClick={() => router.push('/')}>
            Back to Home
          </Button>
          <Button onClick={() => router.push('/exhibitions')}>
            Make Another Booking
          </Button>
        </div>
      </div>
    </div>
  );
}
