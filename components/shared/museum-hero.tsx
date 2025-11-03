"use client";

import Hero from "@/components/ui/animated-shader-hero";
import { useRouter } from "next/navigation";

// Museum-specific Hero Component
const MuseumHero: React.FC = () => {
  const router = useRouter();

  const handleBookVisit = () => {
    router.push('/plan-visit');
  };

  const handleExploreExhibitions = () => {
    router.push('/exhibitions');
  };

  return (
    <Hero
      trustBadge={{
        text: "Discover the wonders of science and technology",
        icons: ["🔬", "🚀", "🌟"]
      }}
      headline={{
        line1: "MGM Science",
        line2: "Centre Museum"
      }}
      subtitle="Experience interactive exhibits, cutting-edge technology, and immersive learning adventures that inspire curiosity and ignite the imagination of visitors of all ages."
      buttons={{
        primary: {
          text: "Plan Your Visit",
          onClick: handleBookVisit
        },
        secondary: {
          text: "Explore Exhibitions",
          onClick: handleExploreExhibitions
        }
      }}
      className="museum-hero"
    />
  );
};

export default MuseumHero;
