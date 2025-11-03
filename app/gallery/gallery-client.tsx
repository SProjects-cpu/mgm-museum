"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Mock gallery data
const galleryItems = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=400&q=80",
    title: "Planetarium Dome",
    category: "exhibitions",
    date: "2024-11-15",
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&q=80",
    title: "ISRO Gallery",
    category: "exhibitions",
    date: "2024-11-10",
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&q=80",
    title: "Science Park",
    category: "exhibitions",
    date: "2024-11-08",
  },
  {
    id: "4",
    url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80",
    title: "Student Workshop",
    category: "events",
    date: "2024-11-05",
  },
  {
    id: "5",
    url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&q=80",
    title: "Robotics Lab",
    category: "workshops",
    date: "2024-11-01",
  },
  {
    id: "6",
    url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80",
    title: "Holography Demo",
    category: "exhibitions",
    date: "2024-10-28",
  },
  {
    id: "7",
    url: "https://images.unsplash.com/photo-1506443432602-ac2fcd6f54e0?w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1506443432602-ac2fcd6f54e0?w=400&q=80",
    title: "Solar Observatory",
    category: "exhibitions",
    date: "2024-10-25",
  },
  {
    id: "8",
    url: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&q=80",
    title: "Astronomy Night",
    category: "events",
    date: "2024-10-20",
  },
  {
    id: "9",
    url: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=400&q=80",
    title: "Math Lab",
    category: "exhibitions",
    date: "2024-10-15",
  },
  {
    id: "10",
    url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&q=80",
    title: "Science Day",
    category: "events",
    date: "2024-10-10",
  },
  {
    id: "11",
    url: "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=400&q=80",
    title: "3D Theatre",
    category: "exhibitions",
    date: "2024-10-05",
  },
  {
    id: "12",
    url: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&q=80",
    title: "Marine Life Exhibit",
    category: "workshops",
    date: "2024-09-28",
  },
];

const categories = [
  { id: "all", label: "All Photos" },
  { id: "exhibitions", label: "Exhibitions" },
  { id: "events", label: "Events" },
  { id: "workshops", label: "Workshops" },
];

export function GalleryClient() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredItems = galleryItems.filter((item) =>
    selectedCategory === "all" || item.category === selectedCategory
  );

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const goToPrevious = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const goToNext = () => {
    if (lightboxIndex !== null && lightboxIndex < filteredItems.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

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
            Gallery
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Photo Gallery
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore moments captured at our science centre, showcasing our
            exhibitions, events, and visitor experiences
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Masonry Gallery Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="break-inside-avoid"
            >
              <Card className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300">
                <div
                  className="relative overflow-hidden"
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="text-center text-white">
                      <ZoomIn className="w-8 h-8 mx-auto mb-2" />
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm opacity-80 capitalize">{item.category}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
              onClick={closeLightbox}
            >
              {/* Close Button */}
              <button
                className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                onClick={closeLightbox}
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Navigation Buttons */}
              {lightboxIndex > 0 && (
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
              )}

              {lightboxIndex < filteredItems.length - 1 && (
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              )}

              {/* Image */}
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="max-w-7xl max-h-[90vh] w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={filteredItems[lightboxIndex].url}
                  alt={filteredItems[lightboxIndex].title}
                  className="w-full h-full object-contain"
                />
                <div className="text-center mt-4 text-white">
                  <h3 className="text-xl font-semibold mb-1">
                    {filteredItems[lightboxIndex].title}
                  </h3>
                  <p className="text-sm opacity-80">
                    {lightboxIndex + 1} / {filteredItems.length}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


