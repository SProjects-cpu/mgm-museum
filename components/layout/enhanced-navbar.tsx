"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { NotchNav } from "@/components/ui/notch-nav";
import { ScrollAwareNavbar } from "@/components/layout/scroll-aware-navbar";
import { NAVIGATION_MENU, MUSEUM_INFO } from "@/lib/constants";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthModal } from "@/components/shared/auth-modal";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [activeNavItem, setActiveNavItem] = useState("home");

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

  const handleNavChange = (value: string) => {
    setActiveNavItem(value);
    // Handle navigation if needed
    const item = NAVIGATION_MENU.find(item => item.value === value);
    if (item?.href) {
      window.location.href = item.href;
    }
  };

  // Convert navigation menu to NotchNav format
  const notchNavItems = NAVIGATION_MENU.map((item: any) => ({
    value: item.value || item.href.replace('/', '') || 'home',
    label: item.label,
    href: item.href
  }));

  return (
    <>
      <ScrollAwareNavbar>
        <nav
          className={cn(
            "transition-all duration-500",
            isScrolled
              ? "bg-background/80 backdrop-blur-xl shadow-2xl border-b border-border/50"
              : "bg-white/90 backdrop-blur-sm border-b border-border/20"
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
                    isScrolled ? "text-foreground" : "text-gray-900"
                  )}>
                    {MUSEUM_INFO.shortName}
                  </div>
                  <div className={cn(
                    "text-xs font-medium transition-colors",
                    isScrolled ? "text-muted-foreground" : "text-gray-600"
                  )}>
                    Astrospace Science Centre
                  </div>
                </div>
              </Link>

              {/* Desktop NotchNav */}
              <div className="hidden lg:block">
                <NotchNav
                  items={notchNavItems}
                  value={activeNavItem}
                  onValueChange={handleNavChange}
                  ariaLabel="Main Navigation"
                  className="mx-4"
                />
              </div>

              {/* Desktop Actions */}
              <div className="hidden lg:flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={openLoginModal}
                  className={cn(
                    "hover:bg-primary/10 transition-all duration-300",
                    isScrolled ? "text-foreground" : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
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
                className={cn(
                  "lg:hidden p-2 rounded-md hover:bg-black hover:text-white transition-colors",
                  isScrolled ? "text-foreground" : "text-gray-700"
                )}
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
                  {/* Mobile NotchNav */}
                  <div className="px-4 pb-4">
                    <NotchNav
                      items={notchNavItems}
                      value={activeNavItem}
                      onValueChange={handleNavChange}
                      ariaLabel="Mobile Navigation"
                    />
                  </div>
                  
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
      </ScrollAwareNavbar>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
}
