"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Tiles } from "@/components/ui/tiles";

interface ConditionalMainProps {
  children: React.ReactNode;
}

export function ConditionalMain({ children }: ConditionalMainProps) {
  const pathname = usePathname();
  
  // Don't add top padding on admin routes since there's no navbar
  const hasNavbar = !pathname.startsWith('/admin');
  
  // Define sections that should have the tiles background
  const sectionsWithTilesBackground = [
    '/',
    '/exhibitions',
    '/shows',
    '/events',
    '/plan-visit',
    '/gallery',
    '/about',
    '/contact'
  ];
  
  // Check if current path should have tiles background
  const shouldHaveTilesBackground = sectionsWithTilesBackground.includes(pathname);
  
  return (
    <main className={cn(
      "min-h-screen relative",
      hasNavbar ? "pt-20" : ""
    )}>
      {/* Tiles Background for specified sections */}
      {shouldHaveTilesBackground && (
        <div className="fixed inset-0 -z-10 opacity-30">
          <Tiles 
            rows={50} 
            cols={8}
            tileSize="md"
            className="w-full h-full"
          />
        </div>
      )}
      {children}
    </main>
  );
}
