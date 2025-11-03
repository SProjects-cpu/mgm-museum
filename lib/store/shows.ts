import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Show } from "@/types";
import { slugify } from "@/lib/utils";

interface ShowsState {
  shows: Show[];
  addShow: (show: Omit<Show, "id" | "createdAt">) => void;
  updateShow: (id: string, updates: Partial<Show>) => void;
  deleteShow: (id: string) => void;
  getShowBySlug: (slug: string) => Show | undefined;
}

const initialShows: Show[] = [
  {
    id: "1",
    slug: "cosmos-journey",
    name: "Cosmos: A Journey Through Time",
    type: "planetarium",
    description: "Experience the birth and evolution of the universe in stunning 360° visuals.",
    durationMinutes: 45,
    thumbnailUrl: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&q=80",
    status: "active",
    createdAt: new Date("2024-01-01"),
    pricing: [
      { id: "sp1", ticketType: "adult", price: 100, active: true, validFrom: new Date() },
      { id: "sp2", ticketType: "child", price: 60, active: true, validFrom: new Date() },
      { id: "sp3", ticketType: "student", price: 75, active: true, validFrom: new Date() },
    ],
    timeSlots: [
      {
        id: "ts1",
        showId: "1",
        startTime: "10:00",
        endTime: "10:45",
        capacity: 100,
        active: true,
      },
      {
        id: "ts2",
        showId: "1",
        startTime: "13:00",
        endTime: "13:45",
        capacity: 100,
        active: true,
      },
      {
        id: "ts3",
        showId: "1",
        startTime: "16:00",
        endTime: "16:45",
        capacity: 100,
        active: true,
      },
    ],
  },
  {
    id: "2",
    slug: "our-solar-system",
    name: "Our Solar System",
    type: "planetarium",
    description: "Explore our cosmic neighborhood with detailed views of planets and moons.",
    durationMinutes: 40,
    thumbnailUrl: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800&q=80",
    status: "active",
    createdAt: new Date("2024-01-01"),
    pricing: [
      { id: "sp4", ticketType: "adult", price: 90, active: true, validFrom: new Date() },
      { id: "sp5", ticketType: "child", price: 50, active: true, validFrom: new Date() },
    ],
    timeSlots: [
      {
        id: "ts4",
        showId: "2",
        startTime: "11:00",
        endTime: "11:40",
        capacity: 100,
        active: true,
      },
      {
        id: "ts5",
        showId: "2",
        startTime: "14:00",
        endTime: "14:40",
        capacity: 100,
        active: true,
      },
    ],
  },
];

export const useShowsStore = create<ShowsState>()(
  persist(
    (set, get) => ({
      shows: initialShows,

      addShow: (show) => {
        const id = Date.now().toString();
        const slug = slugify(show.name);
        const newShow: Show = {
          ...show,
          id,
          slug,
          createdAt: new Date(),
        };
        set((state) => ({
          shows: [...state.shows, newShow],
        }));
      },

      updateShow: (id, updates) => {
        set((state) => ({
          shows: state.shows.map((show) =>
            show.id === id ? { ...show, ...updates } : show
          ),
        }));
      },

      deleteShow: (id) => {
        set((state) => ({
          shows: state.shows.filter((show) => show.id !== id),
        }));
      },

      getShowBySlug: (slug) => {
        return get().shows.find((show) => show.slug === slug);
      },
    }),
    {
      name: "mgm-shows-storage",
    }
  )
);

















