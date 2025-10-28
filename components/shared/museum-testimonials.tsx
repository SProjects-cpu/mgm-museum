import { TestimonialsSection } from "@/components/ui/testimonials-with-marquee"

const museumTestimonials = [
  {
    author: {
      name: "Dr. Priya Sharma",
      handle: "@priya_astrophysics",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face"
    },
    text: "The planetarium shows at MGM Museum are absolutely breathtaking! My students were completely mesmerized by the cosmic journey. The interactive exhibits make complex scientific concepts accessible to everyone.",
    href: "https://twitter.com/priya_astrophysics"
  },
  {
    author: {
      name: "Rajesh Kumar",
      handle: "@rajesh_spacefan",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    text: "As a space enthusiast, I've visited many science centers, but MGM Museum stands out. The ISRO gallery and holography theatre provide an immersive experience that brings space exploration to life.",
    href: "https://twitter.com/rajesh_spacefan"
  },
  {
    author: {
      name: "Anita Desai",
      handle: "@anita_educator",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"
    },
    text: "The mathematics and physics labs are incredible! My children learned more in one visit than weeks of classroom study. The hands-on approach makes learning fun and memorable.",
    href: "https://twitter.com/anita_educator"
  },
  {
    author: {
      name: "Vikram Singh",
      handle: "@vikram_engineer",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    text: "The 3D theatre experience was mind-blowing! The quality of content and technology used is world-class. Perfect for families looking to explore science in an engaging way.",
    href: "https://twitter.com/vikram_engineer"
  },
  {
    author: {
      name: "Meera Patel",
      handle: "@meera_scientist",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    },
    text: "The outdoor science park is fantastic! It's wonderful to see children so excited about learning. The museum perfectly balances education with entertainment.",
    href: "https://twitter.com/meera_scientist"
  },
  {
    author: {
      name: "Arjun Reddy",
      handle: "@arjun_tech",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
    },
    text: "The Aditya Solar Observatory exhibit is fascinating! It's amazing how the museum makes complex astronomical concepts so accessible. A must-visit for anyone interested in space science.",
    href: "https://twitter.com/arjun_tech"
  }
]

export function MuseumTestimonialsSection() {
  return (
    <TestimonialsSection
      title="What Our Visitors Say"
      description="Discover why thousands of visitors choose MGM APJ Abdul Kalam Astrospace Science Centre for their science education journey"
      testimonials={museumTestimonials}
    />
  )
}
