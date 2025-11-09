"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  max?: number;
  size?: number;
  readonly?: boolean;
  className?: string;
}

export function StarRating({
  value,
  onChange,
  max = 5,
  size = 24,
  readonly = false,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleClick = (rating: number) => {
    if (!readonly) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, rating: number) => {
    if (readonly) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(rating);
    } else if (e.key === 'ArrowRight' && rating < max) {
      e.preventDefault();
      onChange(rating + 1);
    } else if (e.key === 'ArrowLeft' && rating > 1) {
      e.preventDefault();
      onChange(rating - 1);
    }
  };

  return (
    <div className={cn("flex gap-1", className)} role="radiogroup" aria-label="Rating">
      {Array.from({ length: max }, (_, i) => {
        const rating = i + 1;
        const isActive = rating <= (hoverValue ?? value);

        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            onMouseLeave={handleMouseLeave}
            onKeyDown={(e) => handleKeyDown(e, rating)}
            disabled={readonly}
            className={cn(
              "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded",
              !readonly && "cursor-pointer hover:scale-110",
              readonly && "cursor-default"
            )}
            aria-label={`${rating} star${rating !== 1 ? 's' : ''}`}
            aria-checked={rating === value}
            role="radio"
            tabIndex={readonly ? -1 : 0}
          >
            <Star
              size={size}
              className={cn(
                "transition-colors duration-200",
                isActive
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-gray-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
