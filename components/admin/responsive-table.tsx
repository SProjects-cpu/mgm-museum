"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponsiveTableProps {
  children: React.ReactNode;
  cardView?: React.ReactNode;
  defaultView?: "table" | "card";
  className?: string;
}

export function ResponsiveTable({
  children,
  cardView,
  defaultView = "table",
  className,
}: ResponsiveTableProps) {
  const [view, setView] = useState<"table" | "card">(defaultView);

  return (
    <div className={cn("space-y-4", className)}>
      {/* View Toggle */}
      <div className="flex justify-end lg:hidden">
        <div className="inline-flex rounded-lg border p-1 gap-1">
          <Button
            variant={view === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("table")}
            className="h-8 px-3"
          >
            <TableIcon className="w-4 h-4 mr-2" />
            Table
          </Button>
          <Button
            variant={view === "card" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("card")}
            className="h-8 px-3"
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Cards
          </Button>
        </div>
      </div>

      {/* Desktop: Always show table */}
      <div className="hidden lg:block">{children}</div>

      {/* Mobile: Toggle between table and card view */}
      <div className="lg:hidden">
        {view === "table" ? (
          <div className="overflow-x-auto">{children}</div>
        ) : (
          cardView || children
        )}
      </div>
    </div>
  );
}















