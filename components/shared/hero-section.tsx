"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Users, Globe } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import dynamic from "next/dynamic";
import { Suspense, useState } from "react";

// Lazy load the 3D scene for better performance
const SpaceScene = dynamic(() => import("./space-scene").then(mod => mod.SpaceScene), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 animate-pulse" />
});

export function HeroSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [show3D, setShow3D] = useState(true);

  const stats = [
    { icon: Users, label: "Interactive Exhibits", value: "50+" },
    { icon: Globe, label: "Themed Galleries", value: "8" },
    { icon: Calendar, label: "Planetarium Shows", value: "360°" },
  ];

  return (
    <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* 3D Background Scene (Optional) */}
      {show3D && (
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <Suspense fallback={<div className="w-full h-full bg-gradient-to-br from-blue-600/10 to-purple-600/10" />}>
            <SpaceScene />
          </Suspense>
        </div>
      )}
      
      {/* Animated Background with Modern Effects */}
      <div className="absolute inset-0">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-purple-600/20" />
        
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />
        
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
        
        {/* Enhanced Stars */}
        <div className="absolute inset-0 opacity-40">
          <div className="stars"></div>
        </div>
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 py-20">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center text-white"
        >
          {/* Main Heading with Modern Typography */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-6xl lg:text-8xl font-extrabold mb-8 leading-[1.1] tracking-tight"
          >
            Explore the Wonders of{" "}
            <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500 animate-gradient-x">
              Science & Space
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl lg:text-2xl mb-8 text-white/90 max-w-3xl mx-auto"
          >
            Discover interactive exhibitions, planetarium shows, and hands-on
            experiences that inspire curiosity and learning at MGM APJ Abdul Kalam
            Astrospace Science Centre, Aurangabad.
          </motion.p>

          {/* Modern CTA Buttons with Glass Effect */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-2xl shadow-blue-500/50 group relative overflow-hidden"
              asChild
            >
              <Link href="/book-visit">
                <span className="relative z-10 flex items-center gap-2">
                  Book Your Visit
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </Button>
            <Button
              size="lg"
              className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm bg-white/5 shadow-xl"
              asChild
            >
              <Link href="/plan-visit">Plan Your Visit</Link>
            </Button>
          </motion.div>

          {/* Modern Stats with Glass Morphism */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group relative flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <stat.icon className="w-7 h-7" />
                </div>
                <div className="relative z-10 text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                  {stat.value}
                </div>
                <div className="relative z-10 text-sm font-medium text-white/90 text-center">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/50 rounded-full p-1"
        >
          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-white rounded-full mx-auto"
          />
        </motion.div>
      </motion.div>

      <style jsx>{`
        .stars {
          background: radial-gradient(2px 2px at 20px 30px, white, transparent),
            radial-gradient(2px 2px at 60px 70px, white, transparent),
            radial-gradient(1px 1px at 50px 50px, white, transparent),
            radial-gradient(1px 1px at 130px 80px, white, transparent),
            radial-gradient(2px 2px at 90px 10px, white, transparent);
          background-size: 200px 200px;
          animation: twinkle 3s infinite;
        }

        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}

