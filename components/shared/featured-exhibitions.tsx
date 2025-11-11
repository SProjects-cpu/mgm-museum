"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { formatCurrency } from "@/lib/utils";
import { FallingPattern } from "@/components/ui/falling-pattern";
import { getServiceSupabase } from "@/lib/supabase/client";

interface Exhibition {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  duration_minutes: number;
  images: string[];
  featured: boolean;
  category: string;
}

export function FeaturedExhibitions() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExhibitions();
  }, []);

  const fetchExhibitions = async () => {
    try {
      const supabase = getServiceSupabase();
      const { data, error } = await supabase
        .from('exhibitions')
        .select('*')
        .eq('status', 'active')
        .eq('featured', true)
        .order('display_order')
        .limit(4);

      if (!error && data) {
        setExhibitions(data);
      }
    } catch (error) {
      console.error('Error fetching exhibitions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 bg-background relative overflow-hidden">
      <FallingPattern 
        className="absolute inset-0 z-0 [mask-image:radial-gradient(ellipse_at_center,transparent,var(--background))]" 
        color="rgb(var(--accent))"
        backgroundColor="rgb(var(--background))"
        duration={180}
        density={1.2}
      />
      <div className="container px-4 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4" variant="secondary">
            Featured Experiences
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Current Exhibitions & Shows
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Immerse yourself in cutting-edge science and technology through our
            interactive exhibitions and spectacular shows
          </p>
        </motion.div>

        {loading ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Loading exhibitions...</p>
          </div>
        ) : exhibitions.length === 0 ? null : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {exhibitions.map((exhibition, index) => (
              <motion.div
                key={exhibition.id}
                ref={index === 0 ? ref : undefined}
                initial={{ opacity: 0, y: 50 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-full"
              >
                <Card className="group overflow-hidden h-full flex flex-col border-0 bg-card/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2">
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={
                        (Array.isArray(exhibition.images) && exhibition.images.length > 0)
                          ? exhibition.images[0]
                          : "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&q=80"
                      }
                      alt={exhibition.name}
                      className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-2 transition-all duration-700"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Featured Badge */}
                    <div className="absolute top-4 right-4">
                      <Badge className="backdrop-blur-md bg-red-500/90 border-red-400/50 shadow-lg">
                        Featured
                      </Badge>
                    </div>
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <Badge variant="outline" className="backdrop-blur-md bg-white/10 border-white/30 text-white shadow-lg">
                        {exhibition.category}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                      {exhibition.name}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 group-hover:text-foreground/80 transition-colors">
                      {exhibition.short_description || "Explore this amazing exhibition"}
                    </p>
                    
                    {/* Info Row with Modern Design */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-primary" />
                        </div>
                        {exhibition.duration_minutes} mins
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">Free Entry</div>
                        <div className="text-xl font-extrabold text-green-600">
                          FREE
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-6 pt-0">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        asChild
                        className="group/btn"
                      >
                        <Link href={`/exhibitions/${exhibition.slug}`}>
                          <span className="flex items-center justify-center gap-2">
                            Details
                          </span>
                        </Link>
                      </Button>
                      <Button
                        className="group/btn bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                        onClick={() => {
                          window.location.href = `/book-visit?exhibitionId=${exhibition.id}&exhibitionName=${encodeURIComponent(exhibition.name)}`;
                        }}
                      >
                        <span className="flex items-center justify-center gap-2">
                          Book Now
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform duration-300" />
                        </span>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12"
        >
          <Button size="lg" variant="outline" asChild>
            <Link href="/exhibitions">
              View All Exhibitions
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

