"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { useNotFound } from "@/lib/contexts/not-found-context";

export function ConditionalFooter() {
  const pathname = usePathname();
  const { isNotFound } = useNotFound();
  
  // Don't render footer on admin routes since admin has its own layout
  if (pathname.startsWith('/admin')) {
    return null;
  }
  
  // Don't render footer on 404 page
  if (isNotFound) {
    return null;
  }
  
  return <Footer />;
}

