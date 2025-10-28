"use client";

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FacebookIcon, InstagramIcon, LinkedinIcon, YoutubeIcon, Atom, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import { MUSEUM_INFO } from '@/lib/constants';

interface FooterLink {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
  label: string;
  links: FooterLink[];
}

const adminFooterLinks: FooterSection[] = [
  {
    label: 'Explore',
    links: [
      { title: 'Exhibitions', href: '/exhibitions' },
      { title: 'Planetarium Shows', href: '/shows' },
      { title: 'Events', href: '/events' },
      { title: 'Gallery', href: '/gallery' },
    ],
  },
  {
    label: 'Visit',
    links: [
      { title: 'Plan Your Visit', href: '/plan-visit' },
      { title: 'Timings & Tickets', href: '/plan-visit#timings' },
      { title: 'Group Bookings', href: '/plan-visit#groups' },
      { title: 'Accessibility', href: '/plan-visit#accessibility' },
    ],
  },
  {
    label: 'Learn',
    links: [
      { title: 'About Us', href: '/about' },
      { title: 'Educational Programs', href: '/about#programs' },
      { title: 'Research', href: '/about#research' },
      { title: 'FAQ', href: '/plan-visit#faq' },
    ],
  },
  {
    label: 'Connect',
    links: [
      { title: 'Facebook', href: MUSEUM_INFO.socialMedia.facebook, icon: FacebookIcon },
      { title: 'Instagram', href: MUSEUM_INFO.socialMedia.instagram, icon: InstagramIcon },
      { title: 'YouTube', href: 'https://youtube.com/@mgmmuseum', icon: YoutubeIcon },
      { title: 'LinkedIn', href: '#', icon: LinkedinIcon },
    ],
  },
];

type ViewAnimationProps = {
  delay?: number;
  children: React.ReactNode;
  className?: string;
};

function AnimatedContainer({ delay = 0, children, className }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.5,
        delay: shouldReduceMotion ? 0 : delay,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}

export function AdminFooter() {
  return (
    <footer className="relative w-full flex flex-col items-center justify-center border-t border-border/50 bg-background/95 backdrop-blur-sm px-4 py-8 lg:px-6 lg:py-12 mt-12">
      {/* Subtle top border effect */}
      <div className="bg-foreground/10 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

      <div className="container mx-auto max-w-7xl">
        <div className="grid w-full gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Museum Info */}
          <AnimatedContainer className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-primary rounded-lg">
                <Atom className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="font-bold text-base">{MUSEUM_INFO.shortName}</div>
                <div className="text-xs text-muted-foreground">Science Centre</div>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Inspiring scientific curiosity and discovery for all ages through interactive exhibitions and educational programs.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {MUSEUM_INFO.address.street}, {MUSEUM_INFO.address.city}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{MUSEUM_INFO.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{MUSEUM_INFO.email}</span>
              </div>
            </div>
          </AnimatedContainer>

          {/* Footer Links Grid */}
          <div className="mt-6 grid grid-cols-2 gap-6 lg:col-span-2 lg:mt-0">
            {adminFooterLinks.map((section, index) => (
              <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
                <div>
                  <h3 className="text-xs font-semibold text-foreground mb-3">{section.label}</h3>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    {section.links.map((link) => (
                      <li key={link.title}>
                        <Link
                          href={link.href}
                          className="hover:text-foreground inline-flex items-center transition-all duration-300 text-sm"
                        >
                          {link.icon && <link.icon className="me-2 size-4" />}
                          {link.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedContainer>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-6 border-t border-border/30 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="flex flex-wrap gap-4 sm:gap-6">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/sitemap" className="hover:text-foreground transition-colors">
                Sitemap
              </Link>
            </div>
            <div className="text-xs opacity-75">
              © {new Date().getFullYear()} {MUSEUM_INFO.name}. All rights reserved.
            </div>
          </div>
          <div className="mt-2 text-center text-xs text-muted-foreground">
            Open 9:30 AM - 5:30 PM (Closed Mondays)
          </div>
        </div>
      </div>
    </footer>
  );
}
