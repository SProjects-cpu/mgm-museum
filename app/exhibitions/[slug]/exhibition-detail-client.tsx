"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Star,
  Share2,
  Heart,
  Info,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { EXHIBITION_CATEGORY_LABELS, TICKET_TYPE_LABELS } from "@/types";
import type { Exhibition } from "@/types";

interface Props {
  exhibition: Exhibition;
}

export function ExhibitionDetailClient({ exhibition }: Props) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === exhibition.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? exhibition.images.length - 1 : prev - 1
    );
  };

  const today = new Date().toISOString().split("T")[0];

  // Get booking widget content from database or use defaults
  const bookingWidget = exhibition.contentSections?.find(
    (section: any) => section.section_type === 'booking_widget'
  );
  
  const widgetTitle = bookingWidget?.title || 'Book Your Visit';
  const widgetDescription = bookingWidget?.content || 'Select your preferred date and time';
  const widgetFeatures = bookingWidget?.images || [
    'Instant confirmation',
    'Free cancellation up to 24 hours',
    'Mobile ticket accepted'
  ];

  // Get pricing display content from database or use defaults
  const pricingDisplay = exhibition.contentSections?.find(
    (section: any) => section.section_type === 'pricing_display'
  );
  
  const pricingTitle = pricingDisplay?.title || 'Starting from';
  const pricingFooter = pricingDisplay?.content || 'per person';
  const showPrice = pricingDisplay?.metadata?.showPrice !== false;

  return (
    <div className="min-h-screen py-12">
      <div className="container px-4">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/exhibitions" className="hover:text-primary">Exhibitions</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{exhibition.name}</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="overflow-hidden">
                <div className="relative h-96 md:h-[500px] group">
                  <img
                    src={exhibition.images[currentImageIndex]}
                    alt={`${exhibition.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Navigation Arrows */}
                  {exhibition.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Image Indicators */}
                  {exhibition.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {exhibition.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentImageIndex
                              ? "bg-white w-8"
                              : "bg-white/50"
                          }`}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge variant="secondary" className="bg-white/90 text-foreground">
                      {EXHIBITION_CATEGORY_LABELS[exhibition.category as keyof typeof EXHIBITION_CATEGORY_LABELS]}
                    </Badge>
                    {exhibition.featured && (
                      <Badge variant="destructive">Featured</Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                      aria-label="Share"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button
                      className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                      aria-label="Add to favorites"
                    >
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Title and Quick Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {exhibition.name}
              </h1>
              <div className="flex flex-wrap gap-6 text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{exhibition.durationMinutes} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>Capacity: {exhibition.capacity} people</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-warning text-warning" />
                  <span>4.8 (1,234 reviews)</span>
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    About This Exhibition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                    {exhibition.description}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pricing */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Prices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {exhibition.pricing?.map((price) => (
                      <div
                        key={price.ticketType}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <span className="font-medium">
                          {TICKET_TYPE_LABELS[price.ticketType]}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(price.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    * Prices are inclusive of all taxes. Special group discounts
                    available for 10+ people.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="sticky top-24"
            >
              <Card className="shadow-xl border-2">
                <CardHeader>
                  <CardTitle>{widgetTitle}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {widgetDescription}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Price Display - Editable from Admin Panel */}
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">
                      {pricingTitle}
                    </div>
                    {showPrice && (
                      <div className="text-3xl font-bold text-primary">
                        {formatCurrency(exhibition.pricing?.[0]?.price || 0)}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {pricingFooter}
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
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
                    <p className="text-xs text-muted-foreground">
                      Museum closed on Mondays
                    </p>
                  </div>

                  {/* Available Time Slots */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Available Times</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["10:00 AM", "1:00 PM", "4:00 PM", "7:00 PM"].map((time) => (
                        <button
                          key={time}
                          className="py-2 px-3 border border-input rounded-md hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors text-sm font-medium"
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Book Button */}
                  <Button 
                    size="lg" 
                    className="w-full gradient-primary"
                    onClick={() => {
                      const params = new URLSearchParams({
                        exhibitionId: exhibition.id,
                        exhibitionName: exhibition.name,
                      });
                      window.location.href = `/book-visit?${params.toString()}`;
                    }}
                  >
                    Book Now
                    <ArrowRight className="w-5 h-5" />
                  </Button>

                  {/* Info - Dynamic features from admin panel */}
                  <div className="space-y-2 pt-4 border-t text-sm text-muted-foreground">
                    {widgetFeatures.map((feature: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Card */}
              <Card className="mt-4">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-2">Need Help?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Have questions about this exhibition?
                  </p>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/contact">Contact Us</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

