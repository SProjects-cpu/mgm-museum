"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { Clock, Search, Filter, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { EXHIBITION_CATEGORY_LABELS } from "@/types";
// import { useRealtimeSync, useTableSync } from "@/lib/contexts/realtime-sync-context"; // DISABLED
import { toast } from "sonner";

interface Exhibition {
  id: string;
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  durationMinutes: number;
  images: string[];
  status: string;
  featured: boolean;
  pricing: Array<{ ticketType: string; price: number }>;
}

export function ExhibitionsClient() {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  // const { isConnected } = useRealtimeSync(); // DISABLED
  const isConnected = false;

  const categories = [
    { id: "all", label: "All Exhibitions" },
    ...Object.entries(EXHIBITION_CATEGORY_LABELS).map(([id, label]) => ({
      id,
      label,
    })),
  ];

  // Fetch exhibitions from API
  const fetchExhibitions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/exhibitions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setExhibitions(data.exhibitions);
      } else {
        console.error('Failed to fetch exhibitions:', data.error);
        toast.error('Failed to load exhibitions');
      }
    } catch (error) {
      console.error('Error fetching exhibitions:', error);
      toast.error('Failed to load exhibitions');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  // Initial fetch
  useEffect(() => {
    fetchExhibitions();
  }, [fetchExhibitions]);

  // Listen to real-time updates for exhibitions - DISABLED
  // useTableSync<Exhibition>('exhibitions', (data, eventType) => {
  //   console.log('Exhibition update received:', eventType, data);
  //   if (eventType === 'INSERT' && data) {
  //     // Add new exhibition
  //     setExhibitions(prev => {
  //       // Check if it already exists
  //       if (prev.some(ex => ex.id === data.id)) {
  //         return prev;
  //       }
  //       return [...prev, data];
  //     });
  //     toast.success('New exhibition added!', {
  //       description: data.name,
  //       duration: 3000,
  //     });
  //   } else if (eventType === 'UPDATE' && data) {
  //     // Update existing exhibition
  //     setExhibitions(prev =>
  //       prev.map(ex => (ex.id === data.id ? { ...ex, ...data } : ex))
  //     );
  //   } else if (eventType === 'DELETE' && data) {
  //     // Remove deleted exhibition
  //     setExhibitions(prev => prev.filter(ex => ex.id !== data.id));
  //     toast.info('Exhibition removed', {
  //       description: data.name,
  //       duration: 3000,
  //     });
  //   }
  // });

  const filteredExhibitions = exhibitions.filter((exhibition) => {
    const matchesSearch = exhibition.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || exhibition.category === selectedCategory;
    return matchesSearch && matchesCategory && exhibition.status === 'active';
  });

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="secondary">
              Exhibitions
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Explore Our Exhibitions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Loading exhibitions...
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-full animate-pulse">
                <div className="h-56 bg-muted"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-6 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="secondary">
              Exhibitions
            </Badge>
            {isConnected && (
              <Badge variant="outline" className="text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Live Updates
              </Badge>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Explore Our Exhibitions
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover interactive science exhibitions designed to inspire
            curiosity and foster learning for all ages
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search exhibitions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-[200px]"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={fetchExhibitions}
                title="Refresh exhibitions"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {filteredExhibitions.length} of {exhibitions.length}{" "}
            exhibitions
          </p>
        </div>

        {/* Exhibition Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExhibitions.map((exhibition, index) => (
            <motion.div
              key={exhibition.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 group overflow-hidden">
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={exhibition.images[0] || "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80"}
                    alt={exhibition.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {exhibition.featured && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="destructive">Featured</Badge>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <CardContent className="p-6">
                  <div className="mb-2">
                    <Badge variant="outline" className="text-xs">
                      {
                        EXHIBITION_CATEGORY_LABELS[
                          exhibition.category as keyof typeof EXHIBITION_CATEGORY_LABELS
                        ]
                      }
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {exhibition.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {exhibition.shortDescription}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {exhibition.durationMinutes} mins
                    </div>
                    <div className="text-lg font-bold text-primary">
                      From {formatCurrency(exhibition.pricing[0]?.price || 0)}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-6 pt-0">
                  <Button className="w-full group/btn" variant="outline" asChild>
                    <Link href={`/exhibitions/${exhibition.slug}`}>
                      View Details
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {filteredExhibitions.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground mb-4">
              No exhibitions found matching your criteria
            </p>
            <Button onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
