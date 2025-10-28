"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Users, Star, Calendar, Award } from "lucide-react";
import gsap from "gsap";

const stats = [
  {
    id: 1,
    icon: Users,
    value: 50000,
    suffix: "+",
    label: "Happy Visitors",
    description: "Annually",
  },
  {
    id: 2,
    icon: Star,
    value: 50,
    suffix: "+",
    label: "Interactive Exhibits",
    description: "Hands-on experiences",
  },
  {
    id: 3,
    icon: Calendar,
    value: 360,
    suffix: "°",
    label: "Full Dome Experience",
    description: "Immersive planetarium",
  },
  {
    id: 4,
    icon: Award,
    value: 8,
    suffix: "",
    label: "Themed Galleries",
    description: "Diverse attractions",
  },
];

export function StatsCounter() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });
  
  const [counted, setCounted] = useState(false);

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container px-4 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Our Impact in Numbers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of visitors who have discovered the joy of science at MGM Science Centre
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard
              key={stat.id}
              stat={stat}
              index={index}
              inView={inView}
              counted={counted}
              setCounted={setCounted}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface StatCardProps {
  stat: typeof stats[0];
  index: number;
  inView: boolean;
  counted: boolean;
  setCounted: (value: boolean) => void;
}

function StatCard({ stat, index, inView, counted, setCounted }: StatCardProps) {
  const valueRef = useRef<HTMLDivElement>(null);
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (inView && !counted && valueRef.current) {
      // GSAP counter animation
      gsap.to({ val: 0 }, {
        val: stat.value,
        duration: 2.5,
        delay: index * 0.2,
        ease: "power2.out",
        onUpdate: function() {
          setAnimatedValue(Math.floor(this.targets()[0].val));
        },
        onComplete: () => {
          setAnimatedValue(stat.value);
          if (index === stats.length - 1) {
            setCounted(true);
          }
        }
      });
    }
  }, [inView, counted, stat.value, index, setCounted]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -10, scale: 1.05 }}
      className="group"
    >
      <Card className="h-full hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 border-2 border-transparent hover:border-primary/30 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm relative overflow-hidden">
        {/* Glow Effect on Hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <CardContent className="p-8 text-center relative z-10">
          {/* Animated Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={inView ? { scale: 1, rotate: 0 } : {}}
            transition={{ duration: 0.8, delay: index * 0.1 + 0.2, type: "spring" }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500"
          >
            <stat.icon className="w-8 h-8 text-primary group-hover:text-accent transition-colors duration-500" />
          </motion.div>

          {/* Animated Value */}
          <div className="mb-2">
            <div className="text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-[size:200%] animate-gradient-x">
              <span ref={valueRef}>{animatedValue.toLocaleString()}</span>
              <span>{stat.suffix}</span>
            </div>
          </div>

          {/* Label */}
          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
            {stat.label}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
            {stat.description}
          </p>

          {/* Decorative Line */}
          <motion.div
            initial={{ width: 0 }}
            animate={inView ? { width: "60%" } : {}}
            transition={{ duration: 0.8, delay: index * 0.1 + 0.4 }}
            className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent mt-4 mx-auto rounded-full"
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}






