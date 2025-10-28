"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Calendar, Users, Ticket } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import { FallingPattern } from "@/components/ui/falling-pattern";

export function QuickBooking() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [date, setDate] = useState("");
  const [visitors, setVisitors] = useState("2");
  const [experience, setExperience] = useState("general");

  const today = new Date().toISOString().split("T")[0];

  const museumFeatures = [
    ["Interactive Exhibitions", "Planetarium Shows", "3D Theatre Experience"],
    ["Educational Programs", "Group Discounts", "Free Parking"],
    ["Accessibility Support", "Multilingual Guides", "Cafeteria Available"],
  ];

  return (
    <section className="py-32 bg-muted/50 relative overflow-hidden">
      <FallingPattern 
        className="absolute inset-0 z-0 [mask-image:radial-gradient(ellipse_at_center,transparent,var(--background))]" 
        color="rgb(var(--primary))"
        backgroundColor="rgb(var(--muted))"
        duration={200}
        density={0.8}
      />
      <div className="container px-4 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
            <h2 className="text-4xl font-semibold text-pretty lg:text-6xl">
              Book Your Science Adventure
            </h2>
            <p className="max-w-md text-muted-foreground lg:text-xl">
              Experience interactive science exhibits, planetarium shows, and educational programs
            </p>
            
            <div className="mx-auto flex w-full flex-col rounded-lg border p-6 sm:w-fit sm:min-w-80 bg-background shadow-xl">
              {/* Pricing Display */}
              <div className="flex justify-center mb-6">
                <span className="text-lg font-semibold">₹</span>
                <span className="text-6xl font-semibold">150</span>
                <span className="self-end text-muted-foreground">/person</span>
              </div>

              {/* Features List */}
              <div className="my-6">
                {museumFeatures.map((featureGroup, idx) => (
                  <div key={idx}>
                    <ul className="flex flex-col gap-3">
                      {featureGroup.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between gap-2 text-sm font-medium"
                        >
                          {feature} <Check className="inline size-4 shrink-0 text-green-600" />
                        </li>
                      ))}
                    </ul>
                    {idx < museumFeatures.length - 1 && (
                      <div className="my-6 h-px bg-border" />
                    )}
                  </div>
                ))}
              </div>

              {/* Booking Form */}
              <div className="space-y-4 mb-6">
                {/* Date Selection */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="w-4 h-4 text-primary" />
                    Select Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={today}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Closed on Mondays
                  </p>
                </div>

                {/* Visitors Selection */}
                <div className="space-y-2">
                  <Label htmlFor="visitors" className="flex items-center gap-2 text-sm font-medium">
                    <Users className="w-4 h-4 text-primary" />
                    Number of Visitors
                  </Label>
                  <select
                    id="visitors"
                    value={visitors}
                    onChange={(e) => setVisitors(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="1">1 Person</option>
                    <option value="2">2 People</option>
                    <option value="3">3 People</option>
                    <option value="4">4 People</option>
                    <option value="5">5 People</option>
                    <option value="10+">10+ People (Group)</option>
                  </select>
                </div>

                {/* Experience Selection */}
                <div className="space-y-2">
                  <Label htmlFor="experience" className="flex items-center gap-2 text-sm font-medium">
                    <Ticket className="w-4 h-4 text-primary" />
                    Experience Type
                  </Label>
                  <select
                    id="experience"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="general">General Admission</option>
                    <option value="planetarium">Planetarium Show</option>
                    <option value="3d_theatre">3D Theatre</option>
                    <option value="combo">Combo Package</option>
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <Button
                size="lg"
                className="w-full gradient-primary text-lg font-semibold"
                onClick={() => {
                  window.location.href = '/book-visit';
                }}
              >
                Find Available Tickets
              </Button>

              {/* Info Text */}
              <div className="mt-6 p-4 bg-accent/10 rounded-lg">
                <p className="text-sm text-center text-muted-foreground">
                  <strong>Opening Hours:</strong> 9:30 AM - 5:30 PM (Closed Mondays)
                  {" | "}
                  <Link href="/plan-visit" className="text-primary hover:underline">
                    View all details
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

