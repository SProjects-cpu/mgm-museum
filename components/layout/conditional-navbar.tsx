"use client";

import { usePathname } from "next/navigation";
import { AnimatedNavFramer } from "@/components/ui/navigation-menu";
import { useNotFound } from "@/lib/contexts/not-found-context";

export function ConditionalNavbar() {
  const pathname = usePathname();
  const { isNotFound } = useNotFound();
  
  // Don't render navbar on admin routes
  if (pathname.startsWith('/admin')) {
    return null;
  }
  
  // Don't render navbar on 404 page
  if (isNotFound) {
    return null;
  }
  
  return <AnimatedNavFramer />;
}
