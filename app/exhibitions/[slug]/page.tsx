import { Metadata } from "next";
import { ExhibitionDetailClient } from "./exhibition-detail-client";
import { notFound } from "next/navigation";

// This would typically come from a database/API
const exhibitions = {
  "full-dome-planetarium": {
    id: "1",
    slug: "full-dome-planetarium",
    name: "Full Dome Digital Planetarium",
    category: "planetarium" as const,
    description: `Experience the most advanced digital planetarium in the Marathwada region. Our state-of-the-art Full Dome Digital Planetarium offers a truly immersive 360-degree experience that transports you through space and time.

    The planetarium features:
    - Ultra-high resolution projection system
    - 360-degree immersive dome experience
    - Multi-sensory audio system
    - Comfortable seating with optimal viewing angles
    - Live presentations by expert astronomers
    
    Our shows cover a wide range of topics including:
    - Journey through the solar system
    - Exploration of distant galaxies
    - The birth and death of stars
    - Black holes and cosmic mysteries
    - India's space missions and ISRO achievements
    
    Perfect for school groups, families, and space enthusiasts of all ages!`,
    shortDescription: "Experience the most advanced digital planetarium in Marathwada with 360° shows.",
    durationMinutes: 45,
    capacity: 100,
    images: [
      "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=1200&q=80",
      "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=1200&q=80",
      "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1200&q=80",
    ],
    status: "active" as const,
    featured: true,
    displayOrder: 1,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    pricing: [
      { id: "p1", ticketType: "adult" as const, price: 100, active: true, validFrom: new Date() },
      { id: "p2", ticketType: "child" as const, price: 60, active: true, validFrom: new Date() },
      { id: "p3", ticketType: "student" as const, price: 75, active: true, validFrom: new Date() },
      { id: "p4", ticketType: "senior" as const, price: 80, active: true, validFrom: new Date() },
    ],
  },
  // Add more exhibitions as needed
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const exhibition = exhibitions[slug as keyof typeof exhibitions];
  
  if (!exhibition) {
    return {
      title: "Exhibition Not Found",
    };
  }

  return {
    title: exhibition.name,
    description: exhibition.shortDescription,
  };
}

export default async function ExhibitionDetailPage({ params }: Props) {
  const { slug } = await params;
  const exhibition = exhibitions[slug as keyof typeof exhibitions];

  if (!exhibition) {
    notFound();
  }

  return <ExhibitionDetailClient exhibition={exhibition} />;
}

