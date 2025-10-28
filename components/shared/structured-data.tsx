"use client";

import Script from "next/script";
import { MUSEUM_INFO } from "@/lib/constants";

interface StructuredDataProps {
  type?: "Organization" | "Event" | "Product" | "Place";
  data?: Record<string, any>;
}

export function StructuredData({ type = "Organization", data }: StructuredDataProps) {
  const baseOrganizationData = {
    "@context": "https://schema.org",
    "@type": "Museum",
    name: MUSEUM_INFO.name,
    alternateName: MUSEUM_INFO.shortName,
    url: MUSEUM_INFO.website,
    logo: `${MUSEUM_INFO.website}/logo.png`,
    image: `${MUSEUM_INFO.website}/og-image.jpg`,
    description: "Experience interactive science exhibitions, planetarium shows, and hands-on learning at MGM APJ Abdul Kalam Astrospace Science Centre in Aurangabad, Maharashtra.",
    telephone: MUSEUM_INFO.phone,
    email: MUSEUM_INFO.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jalgaon Road, Behind Siddharth Garden",
      addressLocality: "Aurangabad",
      addressRegion: "Maharashtra",
      postalCode: "431003",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "19.8763",
      longitude: "75.3433",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "09:30",
        closes: "17:30",
      },
    ],
    priceRange: "₹50-₹100",
    sameAs: [
      MUSEUM_INFO.socialMedia.facebook,
      MUSEUM_INFO.socialMedia.twitter,
      MUSEUM_INFO.socialMedia.instagram,
      MUSEUM_INFO.socialMedia.youtube,
    ],
  };

  const structuredData = type === "Organization" 
    ? { ...baseOrganizationData, ...data }
    : data;

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// Event Structured Data
export function EventStructuredData({ event }: { event: any }) {
  const eventData = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.eventDate,
    endDate: event.endTime,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: MUSEUM_INFO.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: "Jalgaon Road, Behind Siddharth Garden",
        addressLocality: "Aurangabad",
        addressRegion: "Maharashtra",
        postalCode: "431003",
        addressCountry: "IN",
      },
    },
    organizer: {
      "@type": "Organization",
      name: MUSEUM_INFO.name,
      url: MUSEUM_INFO.website,
    },
  };

  return (
    <Script
      id="event-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(eventData) }}
    />
  );
}

// Product Structured Data (for bookable experiences)
export function ProductStructuredData({ exhibition }: { exhibition: any }) {
  const productData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: exhibition.name,
    description: exhibition.description,
    image: exhibition.images,
    brand: {
      "@type": "Organization",
      name: MUSEUM_INFO.name,
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: exhibition.pricing?.[0]?.price || 50,
      highPrice: exhibition.pricing?.[exhibition.pricing.length - 1]?.price || 100,
      offerCount: exhibition.pricing?.length || 1,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "1234",
    },
  };

  return (
    <Script
      id="product-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productData) }}
    />
  );
}

