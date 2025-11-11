'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Search, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import BlockLoader from '@/components/ui/block-loader';

interface Feedback {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  booking: {
    booking_reference: string;
    guest_name: string;
    guest_email: string;
    booking_date: string;
  };
  event: {
    name: string;
    type: string;
  };
}

export default function AdminFeedbacksPage() {
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  // Filters
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFeedbacks();
  }, [pagination.page, ratingFilter, eventTypeFilter]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (ratingFilter && ratingFilter !== 'all') params.append('rating', ratingFilter);
      if (eventTypeFilter && eventTypeFilter !== 'all') params.append('event_type', eventTypeFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/feedbacks?${params}`);

      const data = await response.json();

      if (data.success) {
        setFeedbacks(data.feedbacks || []);
        setPagination(data.pagination);
      } else {
        toast.error(data.message || 'Failed to load feedbacks');
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast.error('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchFeedbacks();
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={16}
            className={
              i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-gray-300'
            }
          />
        ))}
      </div>
    );
  };

  if (loading && feedbacks.length === 0) {
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Customer Feedbacks</h1>
        </div>

        {/* Filters Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by booking reference..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Rating Filter */}
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>

              {/* Event Type Filter */}
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="exhibition">Exhibitions</SelectItem>
                  <SelectItem value="show">Shows</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Feedbacks Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {pagination.total} {pagination.total === 1 ? 'Feedback' : 'Feedbacks'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feedbacks.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No feedbacks found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="p-4 border rounded-lg bg-white space-y-3"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          {renderStars(feedback.rating)}
                          <span className="text-sm text-muted-foreground">
                            {new Date(feedback.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <h3 className="font-semibold">{feedback.event.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {feedback.event.type === 'exhibition' ? 'Exhibition' : 'Show'}
                        </p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Booking Ref:</span>
                        <p className="font-mono font-medium">
                          {feedback.booking.booking_reference}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Customer:</span>
                        <p className="font-medium">{feedback.booking.guest_name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-medium text-xs">{feedback.booking.guest_email}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Visit Date:</span>
                        <p className="font-medium">
                          {new Date(feedback.booking.booking_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Comment */}
                    {feedback.comment && (
                      <div className="pt-2 border-t">
                        <p className="text-sm italic text-gray-700">"{feedback.comment}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.pages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.pages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
