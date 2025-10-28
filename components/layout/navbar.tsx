"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { NAVIGATION_MENU, MUSEUM_INFO } from "@/lib/constants";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthModal } from "@/components/shared/auth-modal";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openLoginModal = () => {
    setAuthMode("login");
    setShowAuthModal(true);
    setIsMobileMenuOpen(false);
  };

  const openSignupModal = () => {
    setAuthMode("signup");
    setShowAuthModal(true);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "bg-background/80 backdrop-blur-xl shadow-2xl border-b border-border/50"
            : "bg-gradient-to-b from-black/20 to-transparent backdrop-blur-sm"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 group"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-primary/30">
                {/* Logo Image */}
                <Image
                  src="/Logo.png"
                  alt={`${MUSEUM_INFO.shortName} Logo`}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-110 group-hover:contrast-110"
                  priority
                />
                {/* Hover Overlay Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm" />
              </div>
              <div className="hidden md:block">
                <div className={cn(
                  "text-lg font-extrabold transition-colors",
                  isScrolled ? "text-foreground" : "text-white"
                )}>
                  {MUSEUM_INFO.shortName}
                </div>
                <div className={cn(
                  "text-xs font-medium transition-colors",
                  isScrolled ? "text-muted-foreground" : "text-white/80"
                )}>
                  Astrospace Science Centre
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {NAVIGATION_MENU.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2",
                    "after:w-0 after:h-0.5 after:bg-primary after:transition-all",
                    "hover:after:w-3/4"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={openLoginModal}
                className={cn(
                  "hover:bg-primary/10 transition-all duration-300",
                  !isScrolled && "text-white hover:text-white hover:bg-white/10"
                )}
              >
                Login
              </Button>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 group"
                asChild
              >
                <Link href="/exhibitions">
                  <span className="flex items-center gap-1">
                    Book Tickets
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-md hover:bg-accent transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-border animate-slideInDown">
              <div className="flex flex-col gap-2">
                {NAVIGATION_MENU.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-4 py-3 rounded-md text-sm font-medium hover:bg-accent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 px-4 pt-4 border-t border-border mt-2">
                  <Button variant="outline" size="sm" className="w-full" onClick={openLoginModal}>
                    Login
                  </Button>
                  <Button size="sm" className="w-full gradient-primary" asChild>
                    <Link href="/exhibitions">Book Tickets</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
}

