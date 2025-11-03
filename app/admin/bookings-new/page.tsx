'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Users, DollarSign, TrendingUp, Search, Download, Filter, RefreshCw, Eye, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Booking {
  id: string;
  booking_reference: string;
  visitor_name: string;
  visitor_email: string;
  booking_date: string;
  total_tickets: number;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  amount_paid?: number;
  payment_timestamp?: string;
  refund_id?: string;
  refund_amount?: number;
  refund_status?: string;
  time_slot_id?: string;
  created_at: string;
  time_slot?: {
    slot_date: string;
    start_time: string;
    end_time: string;
  };
  exhibition?: {
    name: string;
  };
  show?: {
    name: string;
  };
  payment_order?: {
    razorpay_order_id: string;
    amount: number;
    currency: string;
    status: string;
    payment_id: string;
    created_at: string;
  };
}

interface BookingStats {
  totalBookings: number;
  todayBookings: number;
  totalRevenue: number;
  totalTickets: number;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats>({
    totalBookings: 0,
    todayBookings: 0,
    totalRevenue: 0,
    totalTickets: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter, paymentStatusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (paymentStatusFilter !== 'all') {
        params.append('paymentStatus', paymentStatusFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/bookings-new?${params}`);
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings || []);
        setStats(data.stats || stats);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchBookings();
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/bookings-new', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Booking status updated');
        fetchBookings();
      } else {
        toast.error(data.error || 'Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  const handleDownloadTicket = async (bookingReference: string) => {
    try {
      toast.info('Generating PDF...');
      const response = await fetch(`/api/pdf/generate?type=ticket&reference=${bookingReference}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
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
    } catch (error) {
      console.error('Error downloading ticket:', error);
      toast.error('Failed to download ticket');
    }
  };

  const handleRefund = async () => {
    if (!selectedBooking) return;

    setRefundLoading(true);
    try {
      const response = await fetch(`/api/admin/bookings/${selectedBooking.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: refundReason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Refund processed successfully');
        setShowRefundModal(false);
        setRefundReason('');
        fetchBookings();
      } else {
        toast.error(data.error || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
    } finally {
      setRefundLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      confirmed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
      completed: 'outline',
      no_show: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'outline',
      cancelled: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Bookings Management</h1>
        <p className="text-muted-foreground">
          View and manage all museum visit bookings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayBookings}</div>
            <p className="text-xs text-muted-foreground">Confirmed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">Upcoming visits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From paid exhibitions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Booking Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleSearch} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>

            <Button variant="outline" onClick={fetchBookings} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Bookings</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Tickets</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading bookings...</p>
                    </TableCell>
                  </TableRow>
                ) : bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <p className="text-muted-foreground">No bookings found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-xs">
                        {booking.booking_reference}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.visitor_name}</p>
                          <p className="text-xs text-muted-foreground">{booking.visitor_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatDate(booking.booking_date)}</p>
                          {booking.time_slot && (
                            <p className="text-xs text-muted-foreground">
                              {formatTime(booking.time_slot.start_time)} - {formatTime(booking.time_slot.end_time)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.exhibition?.name || booking.show?.name || 'General Admission'}
                      </TableCell>
                      <TableCell>{booking.total_tickets}</TableCell>
                      <TableCell>₹{booking.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getPaymentStatusBadge(booking.payment_status)}
                          {booking.payment_method && (
                            <p className="text-xs text-muted-foreground capitalize">
                              {booking.payment_method}
                            </p>
                          )}
                          {booking.razorpay_order_id && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {booking.razorpay_order_id.substring(0, 20)}...
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDetailsModal(true);
                            }}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Select
                            value={booking.status}
                            onValueChange={(value) => handleStatusChange(booking.id, value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="no_show">No Show</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadTicket(booking.booking_reference)}
                            title="Download Ticket PDF"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Complete information about this booking and payment
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking Information */}
              <div>
                <h3 className="font-semibold mb-3">Booking Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Reference</p>
                    <p className="font-mono">{selectedBooking.booking_reference}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Visitor Name</p>
                    <p>{selectedBooking.visitor_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p>{selectedBooking.visitor_email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p>{formatDate(selectedBooking.booking_date)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Time</p>
                    {selectedBooking.time_slot && (
                      <p>
                        {formatTime(selectedBooking.time_slot.start_time)} - {formatTime(selectedBooking.time_slot.end_time)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Experience</p>
                    <p>{selectedBooking.exhibition?.name || selectedBooking.show?.name || 'General Admission'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Tickets</p>
                    <p>{selectedBooking.total_tickets}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Amount</p>
                    <p className="font-semibold">₹{selectedBooking.total_amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created At</p>
                    <p>{formatDate(selectedBooking.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="font-semibold mb-3">Payment Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Payment Status</p>
                    <div className="mt-1">{getPaymentStatusBadge(selectedBooking.payment_status)}</div>
                  </div>
                  {selectedBooking.payment_method && (
                    <div>
                      <p className="text-muted-foreground">Payment Method</p>
                      <p className="capitalize">{selectedBooking.payment_method}</p>
                    </div>
                  )}
                  {selectedBooking.razorpay_order_id && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Razorpay Order ID</p>
                      <p className="font-mono text-xs">{selectedBooking.razorpay_order_id}</p>
                    </div>
                  )}
                  {selectedBooking.razorpay_payment_id && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Razorpay Payment ID</p>
                      <p className="font-mono text-xs">{selectedBooking.razorpay_payment_id}</p>
                    </div>
                  )}
                  {selectedBooking.amount_paid && (
                    <div>
                      <p className="text-muted-foreground">Amount Paid</p>
                      <p className="font-semibold">₹{(selectedBooking.amount_paid / 100).toFixed(2)}</p>
                    </div>
                  )}
                  {selectedBooking.payment_timestamp && (
                    <div>
                      <p className="text-muted-foreground">Payment Time</p>
                      <p>{formatDate(selectedBooking.payment_timestamp)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Order Details (if available) */}
              {selectedBooking.payment_order && (
                <div>
                  <h3 className="font-semibold mb-3">Payment Order Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Order Status</p>
                      <div className="mt-1">
                        <Badge>{selectedBooking.payment_order.status.toUpperCase()}</Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-semibold">
                        {selectedBooking.payment_order.currency} {(selectedBooking.payment_order.amount / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Order Created</p>
                      <p>{formatDate(selectedBooking.payment_order.created_at)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Refund Button */}
          {selectedBooking && selectedBooking.razorpay_payment_id && !selectedBooking.refund_id && (
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowDetailsModal(false);
                  setShowRefundModal(true);
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Process Refund
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Confirmation Modal */}
      <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              This will refund the payment and cancel the booking. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Booking Reference</p>
                <p className="font-mono text-xs">{selectedBooking.booking_reference}</p>
                <p className="text-sm font-medium mt-2">Amount to Refund</p>
                <p className="text-lg font-bold">₹{selectedBooking.total_amount.toFixed(2)}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refund-reason">Reason for Refund</Label>
                <Textarea
                  id="refund-reason"
                  placeholder="Enter reason for refund..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRefundModal(false);
                setRefundReason('');
              }}
              disabled={refundLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefund}
              disabled={refundLoading}
            >
              {refundLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Confirm Refund
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
