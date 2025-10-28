import MuseumHero from "@/components/shared/museum-hero";
import { QuickBooking } from "@/components/shared/quick-booking";
import { FeaturedExhibitions } from "@/components/shared/featured-exhibitions";
import { StatsCounter } from "@/components/shared/stats-counter";
import { Testimonials } from "@/components/shared/testimonials";
import { StructuredData } from "@/components/shared/structured-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Welcome to MGM APJ Abdul Kalam Astrospace Science Centre & Club in Aurangabad. Explore interactive exhibitions, planetarium shows, and hands-on science experiences.",
};

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <div className="min-h-screen">
        <MuseumHero />
        <QuickBooking />
        <FeaturedExhibitions />
        <StatsCounter />
        <Testimonials />
      </div>
    </>
  );
}
