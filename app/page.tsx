import MuseumHero from "@/components/shared/museum-hero";
import { QuickBooking } from "@/components/shared/quick-booking";
import { FeaturedExhibitions } from "@/components/shared/featured-exhibitions";
import { StatsCounter } from "@/components/shared/stats-counter";
import { Testimonials } from "@/components/shared/testimonials";
import { StructuredData } from "@/components/shared/structured-data";
import ScrollReveal from "@/components/ui/scroll-reveal";
import type { Metadata } from "next";
import "@/components/ui/scroll-reveal.css";

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
        
        {/* Scroll Reveal Section */}
        <section className="py-20 bg-gradient-to-br from-background via-primary/5 to-background">
          <div className="container px-4">
            <ScrollReveal
              baseOpacity={0}
              enableBlur={true}
              baseRotation={5}
              blurStrength={10}
              containerClassName="text-center"
              textClassName="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary"
              as="h2"
            >
              Discover the wonders of science and technology at MGM Museum, where curiosity meets innovation and learning becomes an adventure
            </ScrollReveal>
          </div>
        </section>

        <QuickBooking />
        <FeaturedExhibitions />
        <StatsCounter />
        <Testimonials />
      </div>
    </>
  );
}
