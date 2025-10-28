import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Event, EventRegistration } from "@/types";
import { slugify } from "@/lib/utils";

interface EventsState {
  events: Event[];
  registrations: EventRegistration[];
  addEvent: (event: Omit<Event, "id" | "createdAt">) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  registerForEvent: (registration: Omit<EventRegistration, "id" | "createdAt">) => void;
  getEventRegistrations: (eventId: string) => EventRegistration[];
  cancelRegistration: (id: string) => void;
}

const initialEvents: Event[] = [
  {
    id: "1",
    title: "100 Hours of Astronomy",
    slug: "100-hours-astronomy-2025",
    description: "Join us for our annual 100 Hours of Astronomy event!",
    eventDate: new Date("2025-04-15"),
    startTime: "18:00",
    endTime: "22:00",
    location: "Outdoor Science Park & Planetarium",
    maxParticipants: 200,
    registrationRequired: true,
    featuredImage: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80",
    status: "upcoming",
    createdAt: new Date("2024-12-01"),
    registeredCount: 87,
  },
  {
    id: "2",
    title: "National Science Day Celebration",
    slug: "science-day-2025",
    description: "Celebrate National Science Day with special exhibitions.",
    eventDate: new Date("2025-02-28"),
    startTime: "09:30",
    endTime: "17:30",
    location: "All Galleries",
    maxParticipants: 500,
    registrationRequired: false,
    featuredImage: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80",
    status: "upcoming",
    createdAt: new Date("2024-12-01"),
    registeredCount: 245,
  },
];

const initialRegistrations: EventRegistration[] = [];

export const useEventsStore = create<EventsState>()(
  persist(
    (set, get) => ({
      events: initialEvents,
      registrations: initialRegistrations,

      addEvent: (event) => {
        const id = Date.now().toString();
        const slug = slugify(event.title);
        const newEvent: Event = {
          ...event,
          id,
          slug,
          createdAt: new Date(),
        };
        set((state) => ({
          events: [...state.events, newEvent],
        }));
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, ...updates } : event
          ),
        }));
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        }));
      },

      registerForEvent: (registration) => {
        const id = Date.now().toString();
        const newRegistration: EventRegistration = {
          ...registration,
          id,
          status: "registered",
          createdAt: new Date(),
        };
        set((state) => ({
          registrations: [...state.registrations, newRegistration],
          events: state.events.map((event) =>
            event.id === registration.eventId
              ? {
                  ...event,
                  registeredCount: (event.registeredCount || 0) + 1,
                }
              : event
          ),
        }));
      },

      getEventRegistrations: (eventId) => {
        return get().registrations.filter((r) => r.eventId === eventId);
      },

      cancelRegistration: (id) => {
        const registration = get().registrations.find((r) => r.id === id);
        if (registration) {
          set((state) => ({
            registrations: state.registrations.map((r) =>
              r.id === id ? { ...r, status: "cancelled" as const } : r
            ),
            events: state.events.map((event) =>
              event.id === registration.eventId
                ? {
                    ...event,
                    registeredCount: Math.max(0, (event.registeredCount || 0) - 1),
                  }
                : event
            ),
          }));
        }
      },
    }),
    {
      name: "mgm-events-storage",
    }
  )
);

















