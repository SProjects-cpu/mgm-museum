// components/ui/navigation-menu.tsx
"use client";

import * as React from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Navigation } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NAVIGATION_MENU } from "@/lib/constants";
import { Tiles } from "@/components/ui/tiles";

const SCROLL_THRESHOLD = 100; // Hide after scrolling 100px down
const SCROLL_DEBOUNCE = 10; // Debounce scroll events

const containerVariants = {
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      damping: 25,
      stiffness: 300,
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  hidden: {
    y: -100,
    opacity: 0,
    transition: {
      type: "spring" as const,
      damping: 25,
      stiffness: 300,
      when: "afterChildren" as const,
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const logoVariants = {
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1, 
    transition: { type: "spring" as const, damping: 20, stiffness: 300 } 
  },
  hidden: { 
    opacity: 0, 
    x: -20, 
    scale: 0.9, 
    transition: { duration: 0.2 } 
  },
};

const itemVariants = {
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1, 
    transition: { type: "spring" as const, damping: 20, stiffness: 300 } 
  },
  hidden: { 
    opacity: 0, 
    x: -15, 
    scale: 0.95, 
    transition: { duration: 0.15 } 
  },
};

export function AnimatedNavFramer() {
  const [isVisible, setIsVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);
  const [isScrollingDown, setIsScrollingDown] = React.useState(false);
  
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const currentScrollY = latest;
    const scrollDifference = currentScrollY - lastScrollY;
    
    // Only trigger if scroll difference is significant
    if (Math.abs(scrollDifference) > SCROLL_DEBOUNCE) {
      if (currentScrollY > SCROLL_THRESHOLD) {
        // Scrolling down - hide navigation
        if (scrollDifference > 0 && !isScrollingDown) {
          setIsScrollingDown(true);
          setIsVisible(false);
        }
        // Scrolling up - show navigation
        else if (scrollDifference < 0 && isScrollingDown) {
          setIsScrollingDown(false);
          setIsVisible(true);
        }
      } else {
        // Near top - always show navigation
        setIsVisible(true);
        setIsScrollingDown(false);
      }
      
      setLastScrollY(currentScrollY);
    }
  });

  return (
    <motion.div 
      className="fixed top-4 left-0 right-0 z-50"
      initial="visible"
      animate={isVisible ? "visible" : "hidden"}
      variants={containerVariants}
    >
      <motion.nav
        className="flex items-center overflow-hidden rounded-full border bg-background/90 shadow-lg backdrop-blur-md h-10 sm:h-12 mx-auto max-w-fit px-2 sm:px-4 relative"
      >
        {/* Subtle tiles background for navbar */}
        <div className="absolute inset-0 opacity-10 -z-10">
          <Tiles 
            rows={3} 
            cols={20}
            tileSize="sm"
            className="w-full h-full"
          />
        </div>
        <motion.div
          variants={logoVariants}
          className="flex-shrink-0 flex items-center font-semibold pr-3"
        >
          <Navigation className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </motion.div>
        
        <motion.div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          {NAVIGATION_MENU.map((item) => (
            <motion.div
              key={item.value}
              variants={itemVariants}
            >
              <Link
                href={item.href}
                className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-white transition-colors px-1 sm:px-2 py-1 rounded-md hover:bg-black whitespace-nowrap"
              >
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.label.split(' ')[0]}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.nav>
    </motion.div>
  );
}
