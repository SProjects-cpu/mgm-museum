"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { Clock, Calendar, Users, Play, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

// Types for shows data
interface Show {
  id: string;
  slug: string;
  name: string;
  type: string;
  description: string;
  durationMinutes: number;
  thumbnailUrl: string;
  trailerUrl?: string;
  status: string;
  pricing: Array<{
    ticketType: string;
    price: number;
  }>;
  timeSlots?: Array<{
    id: string;
    startTime: string;
    endTime: string;
    capacity: number;
    availableSeats: number;
    active: boolean;
  }>;
}

const showTypes = [
  { id: "all", label: "All Shows" },
  { id: "planetarium", label: "Planetarium" },
  { id: "3d_theatre", label: "3D Theatre" },
  { id: "holography", label: "Holography" },
];

export function ShowsClient() {
  const [selectedType, setSelectedType] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch shows data from GraphQL API
  useEffect(() => {
    const fetchShows = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              query GetShows($type: String) {
                shows(type: $type) {
                  id
                  slug
                  name
                  type
                  description
                  durationMinutes
                  thumbnailUrl
                  status
                  pricing {
                    ticketType
                    price
                  }
                  timeSlots {
                    id
                    startTime
                    endTime
                    capacity
                    availableSeats
                    active
                  }
                }
              }
            `,
            variables: {
              type: selectedType === "all" ? null : selectedType
            }
          }),
        });

        const result = await response.json();

        if (result.errors) {
          console.error('GraphQL errors:', result.errors);
          // Still try to use partial data if available
          if (result.data?.shows) {
            setShows(result.data.shows);
            // Show warning but don't fail completely
            setError(`Warning: ${result.errors[0].message}`);
          } else {
            throw new Error(result.errors[0].message);
          }
        } else {
          setShows(result.data.shows || []);
        }
      } catch (err) {
        console.error('Error fetching shows:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch shows');
      } finally {
        setLoading(false);
      }
    };

    fetchShows();
  }, [selectedType]);

  const today = new Date().toISOString().split("T")[0];

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
          <Badge className="mb-4" variant="secondary">
            Shows & Entertainment
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Planetarium Shows
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Immersive experiences in our state-of-the-art planetarium and theatres.
            Book your seats for an unforgettable journey through space and science.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Date Selection */}
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={today}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              {/* Type Filter */}
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Show Type</label>
                <div className="flex flex-wrap gap-2">
                  {showTypes.map((type) => (
                    <Button
                      key={type.id}
                      variant={selectedType === type.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedType(type.id)}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader variant="spiral" size="lg" className="text-primary" />
            <span className="ml-2 text-muted-foreground">Loading shows...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">Error loading shows: {error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        )}

        {/* Shows Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {shows.map((show, index) => (
            <motion.div
              key={show.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 group overflow-hidden">
                {/* Thumbnail */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={show.thumbnailUrl}
                    alt={show.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform">
                      <Play className="w-8 h-8 text-primary ml-1" />
                    </button>
                  </div>

                  {/* Type Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge variant="secondary" className="bg-white/90 text-foreground capitalize">
                      {show.type.replace("_", " ")}
                    </Badge>
                  </div>

                  {/* Info Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-2xl font-bold mb-2">{show.name}</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {show.durationMinutes} mins
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        100 seats
                      </div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {show.description}
                  </p>

                  {/* Time Slots */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2">Today's Shows</h4>
                    <div className="flex flex-wrap gap-2">
                      {show.timeSlots?.map((timeSlot) => (
                        <Badge key={timeSlot.id} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                          {timeSlot.startTime}
                        </Badge>
                      )) || (
                        <p className="text-sm text-muted-foreground">No time slots available</p>
                      )}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b">
                    <div>
                      <div className="text-sm text-muted-foreground">Starting from</div>
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(show.pricing[0]?.price || 0)}
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button 
                    className="w-full group/btn"
                    onClick={() => {
                      const params = new URLSearchParams({
                        showId: show.id,
                        showName: show.name,
                      });
                      window.location.href = `/book-visit?${params.toString()}`;
                    }}
                  >
                    Select Time & Book
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Comfortable Seating</h3>
                  <p className="text-sm text-muted-foreground">
                    Reclining seats with optimal viewing angles
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Play className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">4K Projection</h3>
                  <p className="text-sm text-muted-foreground">
                    Crystal clear visuals on 360° dome
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Multiple Shows Daily</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose from convenient time slots
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}


