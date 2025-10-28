import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Exhibition } from "@/types";
import { slugify } from "@/lib/utils";

interface ExhibitionsState {
  exhibitions: Exhibition[];
  addExhibition: (exhibition: Omit<Exhibition, "id" | "createdAt" | "updatedAt">) => void;
  updateExhibition: (id: string, updates: Partial<Exhibition>) => void;
  deleteExhibition: (id: string) => void;
  getExhibitionBySlug: (slug: string) => Exhibition | undefined;
  toggleFeatured: (id: string) => void;
  updateStatus: (id: string, status: Exhibition["status"]) => void;
}

// Initial mock data
const initialExhibitions: Exhibition[] = [
  {
    id: "1",
    slug: "full-dome-planetarium",
    name: "Full Dome Digital Planetarium",
    category: "planetarium",
    description: `Experience the most advanced digital planetarium in the Marathwada region. Our state-of-the-art Full Dome Digital Planetarium offers a truly immersive 360-degree experience.`,
    shortDescription: "Experience the most advanced digital planetarium in Marathwada with 360° shows.",
    durationMinutes: 45,
    capacity: 100,
    images: [
      "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=1200&q=80",
      "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=1200&q=80",
    ],
    status: "active",
    featured: true,
    displayOrder: 1,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    pricing: [
      { id: "p1", ticketType: "adult", price: 100, active: true, validFrom: new Date() },
      { id: "p2", ticketType: "child", price: 60, active: true, validFrom: new Date() },
      { id: "p3", ticketType: "student", price: 75, active: true, validFrom: new Date() },
      { id: "p4", ticketType: "senior", price: 80, active: true, validFrom: new Date() },
    ],
  },
  {
    id: "2",
    slug: "astro-gallery-isro",
    name: "Astro Gallery & ISRO Exhibition",
    category: "astro_gallery",
    description: "Discover India's space exploration journey with real spacecraft models and ISRO achievements.",
    shortDescription: "Discover India's space exploration journey with real spacecraft models.",
    durationMinutes: 60,
    capacity: 150,
    images: ["https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=1200&q=80"],
    status: "active",
    featured: true,
    displayOrder: 2,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    pricing: [
      { id: "p5", ticketType: "adult", price: 80, active: true, validFrom: new Date() },
      { id: "p6", ticketType: "child", price: 50, active: true, validFrom: new Date() },
    ],
  },
  {
    id: "3",
    slug: "3d-science-theatre",
    name: "3D Science Theatre",
    category: "3d_theatre",
    description: "The most powerful 3D film experience with science shows.",
    shortDescription: "The most powerful 3D film experience.",
    durationMinutes: 30,
    capacity: 80,
    images: ["https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=1200&q=80"],
    status: "active",
    featured: true,
    displayOrder: 3,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    pricing: [
      { id: "p7", ticketType: "adult", price: 75, active: true, validFrom: new Date() },
      { id: "p8", ticketType: "child", price: 45, active: true, validFrom: new Date() },
    ],
  },
  {
    id: "4",
    slug: "holography-theatre",
    name: "Holography Theatre",
    category: "holography",
    description: "Witness the science of holography with fully three-dimensional images.",
    shortDescription: "Fully three-dimensional holographic images.",
    durationMinutes: 40,
    capacity: 60,
    images: ["https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&q=80"],
    status: "active",
    featured: false,
    displayOrder: 4,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    pricing: [
      { id: "p9", ticketType: "adult", price: 90, active: true, validFrom: new Date() },
      { id: "p10", ticketType: "child", price: 55, active: true, validFrom: new Date() },
    ],
  },
  {
    id: "5",
    slug: "solar-observatory",
    name: "Aditya Solar Observatory",
    category: "solar_observatory",
    description: "Observe the sun safely with specialized equipment.",
    shortDescription: "Safe solar observation with specialized equipment.",
    durationMinutes: 30,
    capacity: 50,
    images: ["https://images.unsplash.com/photo-1506443432602-ac2fcd6f54e0?w=1200&q=80"],
    status: "active",
    featured: false,
    displayOrder: 5,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    pricing: [
      { id: "p11", ticketType: "adult", price: 60, active: true, validFrom: new Date() },
    ],
  },
  {
    id: "6",
    slug: "outdoor-science-park",
    name: "Outdoor Science Park",
    category: "science_park",
    description: "Interactive outdoor exhibits demonstrating scientific principles.",
    shortDescription: "Interactive outdoor scientific exhibits.",
    durationMinutes: 60,
    capacity: 200,
    images: ["https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=1200&q=80"],
    status: "active",
    featured: false,
    displayOrder: 6,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    pricing: [
      { id: "p12", ticketType: "adult", price: 50, active: true, validFrom: new Date() },
    ],
  },
  {
    id: "7",
    slug: "mathematics-lab",
    name: "Mathematics Laboratory",
    category: "math_lab",
    description: "Interactive math models and hands-on activities.",
    shortDescription: "Interactive math learning.",
    durationMinutes: 45,
    capacity: 40,
    images: ["https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=1200&q=80"],
    status: "active",
    featured: false,
    displayOrder: 7,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    pricing: [
      { id: "p13", ticketType: "adult", price: 50, active: true, validFrom: new Date() },
    ],
  },
  {
    id: "8",
    slug: "basic-physics-lab",
    name: "Basic Physics Laboratory",
    category: "physics_lab",
    description: "Hands-on physics experiments and demonstrations.",
    shortDescription: "Hands-on physics experiments.",
    durationMinutes: 45,
    capacity: 40,
    images: ["https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&q=80"],
    status: "active",
    featured: false,
    displayOrder: 8,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    pricing: [
      { id: "p14", ticketType: "adult", price: 50, active: true, validFrom: new Date() },
    ],
  },
];

export const useExhibitionsStore = create<ExhibitionsState>()(
  persist(
    (set, get) => ({
      exhibitions: initialExhibitions,

      addExhibition: (exhibition) => {
        const id = Date.now().toString();
        const slug = slugify(exhibition.name);
        const newExhibition: Exhibition = {
          ...exhibition,
          id,
          slug,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          exhibitions: [...state.exhibitions, newExhibition],
        }));
      },

      updateExhibition: (id, updates) => {
        set((state) => ({
          exhibitions: state.exhibitions.map((ex) =>
            ex.id === id
              ? { ...ex, ...updates, updatedAt: new Date() }
              : ex
          ),
        }));
      },

      deleteExhibition: (id) => {
        set((state) => ({
          exhibitions: state.exhibitions.filter((ex) => ex.id !== id),
        }));
      },

      getExhibitionBySlug: (slug) => {
        return get().exhibitions.find((ex) => ex.slug === slug);
      },

      toggleFeatured: (id) => {
        set((state) => ({
          exhibitions: state.exhibitions.map((ex) =>
            ex.id === id ? { ...ex, featured: !ex.featured, updatedAt: new Date() } : ex
          ),
        }));
      },

      updateStatus: (id, status) => {
        set((state) => ({
          exhibitions: state.exhibitions.map((ex) =>
            ex.id === id ? { ...ex, status, updatedAt: new Date() } : ex
          ),
        }));
      },
    }),
    {
      name: "mgm-exhibitions-storage",
    }
  )
);

















