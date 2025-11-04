"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";
import { useRealtimeSync, useTableSync } from "@/lib/contexts/realtime-sync-context";
import { toast } from "sonner";

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  max_participants: number | null;
  registration_required: boolean;
  featured_image: string | null;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  booking_enabled: boolean;
  registeredCount: number;
}

export function EventsClient() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { isConnected } = useRealtimeSync();

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/events/public?${params}`);
      const data = await response.json();

      if (response.ok) {
        setEvents(data.events);
      } else {
        console.error('Failed to fetch events:', data.error);
        toast.error('Failed to load events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Listen to real-time updates for events (only if realtime enabled)
  useTableSync<Event>('events', (data, eventType) => {
    console.log('Event update received:', eventType, data);
    if (eventType === 'INSERT' && data) {
      // Add new event
      setEvents(prev => {
        if (prev.some(ev => ev.id === data.id)) {
          return prev;
        }
        return [...prev, data];
      });
      toast.success('New event added!', {
        description: data.title,
        duration: 3000,
      });
    } else if (eventType === 'UPDATE' && data) {
      // Update existing event
      setEvents(prev =>
        prev.map(ev => (ev.id === data.id ? { ...ev, ...data } : ev))
      );
    } else if (eventType === 'DELETE' && data) {
      // Remove deleted event
      setEvents(prev => prev.filter(ev => ev.id !== data.id));
      toast.info('Event removed', {
        description: data.title,
        duration: 3000,
      });
    }
  });

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'default';
      case 'ongoing':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="secondary">
              Events & Workshops
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Upcoming Events
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Loading events...
            </p>
          </div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-24 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="secondary">
              Events & Workshops
            </Badge>
            {isConnected && (
              <Badge variant="outline" className="text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Live Updates
              </Badge>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Upcoming Events
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join our special workshops, astronomy nights, and educational events
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-[150px]"
                >
                  <option value="all">All Events</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                </select>
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={fetchEvents}
                title="Refresh events"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {filteredEvents.length} of {events.length} events
          </p>
        </div>

        {/* Events List */}
        <div className="grid gap-6">
          {filteredEvents.map((event, index) => {
            const isFullyBooked =
              event.max_participants && event.registeredCount >= event.max_participants;
            const registrationProgress = event.max_participants
              ? (event.registeredCount / event.max_participants) * 100
              : 0;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Event Image */}
                      {event.featured_image && (
                        <div className="md:w-48 h-32 md:h-auto rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={event.featured_image}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Event Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                            <Badge variant={getStatusColor(event.status)}>
                              {event.status}
                            </Badge>
                          </div>
                        </div>

                        {event.description && (
                          <p className="text-muted-foreground mb-4 line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>{formatDate(new Date(event.event_date))}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>
                              {event.start_time} - {event.end_time}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{event.location}</span>
                          </div>
                          {event.max_participants && (
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="w-4 h-4 text-primary" />
                              <span>
                                {event.registeredCount} / {event.max_participants}{" "}
                                registered
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Registration Progress */}
                        {event.max_participants && (
                          <div className="mb-4">
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className={`rounded-full h-2 transition-all ${
                                  isFullyBooked ? "bg-red-500" : "bg-primary"
                                }`}
                                style={{
                                  width: `${Math.min(registrationProgress, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button disabled={isFullyBooked || (event.booking_enabled === false)}>
                            {isFullyBooked
                              ? "Fully Booked"
                              : event.registration_required
                              ? "Register Now"
                              : "Learn More"}
                          </Button>
                          {event.booking_enabled === false && (
                            <Badge variant="outline" className="ml-2">
                              Registration Closed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredEvents.length === 0 && !loading && (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-4">
              No events found matching your criteria
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
