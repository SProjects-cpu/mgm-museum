"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  MoreVertical,
  Eye,
  Settings
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EventDialog } from "@/components/admin/event-dialog";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

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
  created_at: string;
  updated_at: string;
}

export default function EventsManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/admin/events?${params}`);
      const data = await response.json();

      if (response.ok) {
        setEvents(data.events);
      } else {
        toast.error(data.error || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [statusFilter]);

  const handleToggleBooking = async (eventId: string, currentStatus: boolean) => {
    try {
      // Find the event to get its current status
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      // Toggle between upcoming and cancelled
      const newStatus = event.status === 'cancelled' ? 'upcoming' : 'cancelled';

      const response = await fetch(`/api/admin/events/${eventId}/toggle-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        fetchEvents(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to update event status');
      }
    } catch (error) {
      console.error('Error toggling booking:', error);
      toast.error('Failed to update event status');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        fetchEvents(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'default';
      case 'ongoing': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mt-6">
          <div>
            <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Events Management</h1>
            <p className="text-muted-foreground">Manage workshops and special events</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mt-6">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Events Management</h1>
          <p className="text-muted-foreground">Manage workshops and special events</p>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Events</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <EventDialog mode="create" onSuccess={fetchEvents} />
        </div>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground mb-4">
              {statusFilter === 'all' 
                ? 'Create your first event to get started.'
                : `No ${statusFilter} events found.`
              }
            </p>
            <EventDialog mode="create" onSuccess={fetchEvents} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => {
            const isFullyBooked = event.max_participants && event.registeredCount >= event.max_participants;
            const registrationProgress = event.max_participants 
              ? (event.registeredCount / event.max_participants) * 100 
              : 0;

            return (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{event.title}</h3>
                          {!event.booking_enabled && (
                            <Badge variant="outline" className="text-xs">
                              Booking Disabled
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {formatDate(new Date(event.event_date))} • {event.start_time} - {event.end_time}
                        </p>
                        <p className="text-sm text-muted-foreground">{event.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {event.max_participants && (
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm mb-1">
                            <Users className="w-4 h-4" />
                            <span className="font-semibold">
                              {event.registeredCount} / {event.max_participants}
                            </span>
                          </div>
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div 
                              className={`rounded-full h-2 ${
                                isFullyBooked ? 'bg-red-500' : 'bg-primary'
                              }`}
                              style={{ width: `${Math.min(registrationProgress, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <Badge variant={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a href={`/events`} target="_blank" className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              View on Site
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <EventDialog 
                            mode="edit" 
                            event={event} 
                            onSuccess={fetchEvents}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Event
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuItem
                            onClick={() => handleToggleBooking(event.id, event.booking_enabled)}
                          >
                            {event.booking_enabled ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Disable Booking
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Enable Booking
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}




