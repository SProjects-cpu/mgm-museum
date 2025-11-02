import { Metadata } from "next";
import { ExhibitionDetailClient } from "./exhibition-detail-client";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getExhibition(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/exhibitions/${slug}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.exhibition;
  } catch (error) {
    console.error('Error fetching exhibition:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const exhibition = await getExhibition(slug);
  
  if (!exhibition) {
    return {
      title: "Exhibition Not Found",
    };
  }

  return {
    title: exhibition.name,
    description: exhibition.short_description || exhibition.description?.substring(0, 160),
  };
}

export default async function ExhibitionDetailPage({ params }: Props) {
  const { slug } = await params;
  const exhibition = await getExhibition(slug);

  if (!exhibition) {
    notFound();
  }

  // Transform database format to component format
  const transformedExhibition = {
    id: exhibition.id,
    slug: exhibition.slug,
    name: exhibition.name,
    category: exhibition.category,
    description: exhibition.description,
    shortDescription: exhibition.short_description,
    durationMinutes: exhibition.duration_minutes,
    capacity: exhibition.capacity,
    images: exhibition.images || [],
    status: exhibition.status,
    featured: exhibition.featured,
    displayOrder: exhibition.display_order,
    createdAt: new Date(exhibition.created_at),
    updatedAt: new Date(exhibition.updated_at),
    pricing: (exhibition.pricing || []).map((p: any) => ({
      id: p.id,
      ticketType: p.ticket_type,
      price: parseFloat(p.price),
      active: p.active,
      validFrom: new Date(p.valid_from),
    })),
    contentSections: exhibition.contentSections || [],
    timeSlots: exhibition.timeSlots || [],
  };

  return <ExhibitionDetailClient exhibition={transformedExhibition} />;
}

