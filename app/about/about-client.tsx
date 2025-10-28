"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Telescope,
  FlaskConical,
  Atom,
  Users,
  Target,
  Award,
  BookOpen,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MUSEUM_INFO, EXHIBITION_CATEGORIES } from "@/lib/constants";

export function AboutClient() {
  const achievements = [
    {
      icon: Users,
      value: "50,000+",
      label: "Annual Visitors",
    },
    {
      icon: BookOpen,
      value: "100+",
      label: "School Programs",
    },
    {
      icon: Telescope,
      value: "8",
      label: "Interactive Galleries",
    },
    {
      icon: Award,
      value: "15+",
      label: "Years of Excellence",
    },
  ];

  const facilities = EXHIBITION_CATEGORIES.map((category) => ({
    title: category.label,
    description: category.description,
    icon: category.icon,
  }));

  return (
    <div className="min-h-screen py-12">
      <div className="container px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4" variant="secondary">
            About Us
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {MUSEUM_INFO.name}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Inspiring scientific curiosity and fostering discovery through
            interactive exhibitions and educational experiences
          </p>
        </motion.div>

        {/* Hero Image/Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <Card className="overflow-hidden">
            <div className="relative h-96 bg-gradient-space">
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 flex items-center justify-center text-white text-center p-8">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Opening Doors to the Mysterious World of Science
                  </h2>
                  <p className="text-lg opacity-90 max-w-2xl mx-auto">
                    Making science accessible, engaging, and fun for visitors of
                    all ages
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To open doors of the mysterious world of science to everyone.
                  Aurangabad is well known as Marathwada's financial capital, and
                  our mission is to add to the city's rich heritage by making
                  science education accessible and engaging through interactive
                  exhibitions and hands-on experiences.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Lightbulb className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Our Vision</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To be recognized as Marathwada's premier destination for science
                  education and innovation. We envision a future where every young
                  mind is equipped with technological advancements while
                  understanding the fundamental principles of science and its
                  applications in daily life.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* About Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-16"
        >
          <Card>
            <CardContent className="p-8 md:p-12">
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  Aurangabad is well known as Marathwada's financial capital, recognized on the
                  world map for its rich historical, cultural, and industrial significance.
                  MGM's APJ Abdul Kalam Astrospace Science Centre is an addition to
                  Aurangabad's diversified and rich heritage.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  The upcoming young generation is well equipped with technological
                  advancements, but it is necessary to make them aware of the basic
                  science and its applications in daily life. The main objective of our
                  science centre is to open doors of the mysterious world of science
                  to everyone.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Named after India's beloved "Missile Man" and former President
                  Dr. APJ Abdul Kalam, our centre embodies his vision of inspiring
                  young minds to pursue careers in science and technology. Through
                  various galleries and interactive exhibits, we serve this noble
                  purpose of making science education accessible and enjoyable.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-16"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Impact
            </h2>
            <p className="text-muted-foreground">
              Making a difference in science education across Marathwada
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              >
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <achievement.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                      {achievement.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {achievement.label}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Facilities */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mb-16"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Facilities
            </h2>
            <p className="text-muted-foreground">
              State-of-the-art galleries serving the purpose of science education
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {facilities.map((facility, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg transition-all group">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                      {/* Icon placeholder - will be replaced with actual icons */}
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <FlaskConical className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                      {facility.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {facility.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Educational Programs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-16"
        >
          <Card className="bg-gradient-primary text-white">
            <CardContent className="p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Educational Programs
                  </h2>
                  <p className="text-lg opacity-90 mb-6">
                    We offer specialized programs for schools, including guided
                    tours, workshops, and the annual "100 Hours of Astronomy"
                    event. Our educational initiatives are designed to complement
                    classroom learning with hands-on experiences.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="secondary" size="lg" asChild>
                      <Link href="/events">
                        View Programs
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-primary" asChild>
                      <Link href="/contact">Contact for Groups</Link>
                    </Button>
                  </div>
                </div>
                <div className="relative h-64 md:h-full min-h-[300px] rounded-lg overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80"
                    alt="Educational Programs"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-center"
        >
          <Card>
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Explore?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Book your tickets now and embark on a journey of scientific
                discovery
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/exhibitions">
                    Book Tickets
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/plan-visit">Plan Your Visit</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

