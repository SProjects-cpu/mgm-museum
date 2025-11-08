import { Metadata } from "next";
import { ExhibitionDetailClient } from "./exhibition-detail-client";
import { notFound } from "next/navigation";
import { getServiceSupabase } from "@/lib/supabase/config";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getExhibition(slug: string) {
  try {
    // Direct database query instead of fetch to avoid timeout
    const supabase = getServiceSupabase();
    
    const { data: exhibition, error } = await supabase
      .from('exhibitions')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (error || !exhibition) {
      console.error('Error fetching exhibition:', error);
      return null;
    }

    // Fetch content sections for this exhibition (for dynamic booking widget)
    const { data: contentSections } = await supabase
      .from('exhibition_content_sections')
      .select('*')
      .eq('exhibition_id', exhibition.id)
      .eq('active', true)
      .order('display_order');

    exhibition.contentSections = contentSections || [];

    return exhibition;
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

