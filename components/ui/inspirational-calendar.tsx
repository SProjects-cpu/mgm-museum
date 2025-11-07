"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface CalendarDayProps {
  day: number | string;
  isHeader?: boolean;
  isAvailable?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  day,
  isHeader,
  isAvailable,
  isSelected,
  isDisabled,
  onClick,
}) => {
  const bgClass = isHeader
    ? ""
    : isSelected
    ? "bg-indigo-600 text-white"
    : isAvailable
    ? "bg-indigo-500 text-white hover:bg-indigo-600 cursor-pointer"
    : isDisabled
    ? "text-gray-300 cursor-not-allowed"
    : "text-gray-500";

  return (
    <div
      className={`col-span-1 row-span-1 flex h-8 w-8 items-center justify-center ${
        isHeader ? "" : "rounded-xl transition-all"
      } ${bgClass}`}
      onClick={!isHeader && !isDisabled && onClick ? onClick : undefined}
    >
      <span className={`font-medium ${isHeader ? "text-xs" : "text-sm"}`}>
        {day}
      </span>
    </div>
  );
};

interface InspirationalCalendarProps {
  currentMonth: string;
  currentYear: number;
  daysInMonth: number;
  firstDayOfWeek: number;
  availableDates?: string[]; // Array of date strings in format "YYYY-MM-DD"
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  title?: string;
  description?: string;
  showBookButton?: boolean;
  bookingLink?: string;
}

export function InspirationalCalendar({
  currentMonth,
  currentYear,
  daysInMonth,
  firstDayOfWeek,
  availableDates = [],
  selectedDate,
  onDateSelect,
  title = "Select Your Visit Date",
  description = "Choose an available date for your visit",
  showBookButton = false,
  bookingLink,
}: InspirationalCalendarProps) {
  const isDateAvailable = (day: number) => {
    const dateStr = `${currentYear}-${String(new Date(currentYear, new Date().getMonth(), 1).getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return availableDates.includes(dateStr);
  };

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === new Date().getMonth() &&
      selectedDate.getFullYear() === currentYear
    );
  };

  const isDateDisabled = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentYear, new Date().getMonth(), day);
    return checkDate < today || !isDateAvailable(day);
  };

  const handleDateClick = (day: number) => {
    if (onDateSelect && !isDateDisabled(day)) {
      const newDate = new Date(currentYear, new Date().getMonth(), day);
      onDateSelect(newDate);
    }
  };

  const renderCalendarDays = () => {
    let days: React.ReactNode[] = [
      ...dayNames.map((day, i) => (
        <CalendarDay key={`header-${day}`} day={day} isHeader />
      )),
      ...Array(firstDayOfWeek)
        .fill(null)
        .map((_, i) => (
          <div
            key={`empty-start-${i}`}
            className="col-span-1 row-span-1 h-8 w-8"
          />
        )),
      ...Array(daysInMonth)
        .fill(null)
        .map((_, i) => {
          const day = i + 1;
          return (
            <CalendarDay
              key={`date-${day}`}
              day={day}
              isAvailable={isDateAvailable(day)}
              isSelected={isDateSelected(day)}
              isDisabled={isDateDisabled(day)}
              onClick={() => handleDateClick(day)}
            />
          );
        }),
    ];
    return days;
  };

  const content = (
    <div className="group relative flex flex-col rounded-2xl border border-border bg-white dark:bg-gray-900 p-6 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 overflow-hidden transition-all">
      {bookingLink && (
        <div className="absolute bottom-4 right-6 z-[999] flex h-12 w-12 rotate-6 items-center justify-center rounded-full bg-white opacity-0 transition-all duration-300 ease-in-out group-hover:translate-y-[-8px] group-hover:rotate-0 group-hover:opacity-100 shadow-lg">
          <svg
            className="h-6 w-6 text-indigo-600"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.25 15.25V6.75H8.75"
            ></path>
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 7L6.75 17.25"
            ></path>
          </svg>
        </div>
      )}
      
      <div className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-tl from-indigo-400/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"></div>

      <div className="grid h-full gap-5">
        <div>
          <h2 className="mb-4 text-lg md:text-3xl font-semibold">{title}</h2>
          <p className="mb-2 text-xs md:text-md text-gray-600 dark:text-gray-400">
            {description}
          </p>
          {showBookButton && (
            <Button className="mt-3 rounded-2xl">Book Now</Button>
          )}
        </div>

        <div className="transition-all duration-500 ease-out">
          <div className="h-full w-full max-w-[550px] rounded-[24px] border border-gray-200 dark:border-gray-700 p-2 transition-colors duration-100 group-hover:border-indigo-400">
            <div
              className="h-full rounded-2xl border-2 border-gray-100/10 dark:border-gray-800/10 p-3"
              style={{ boxShadow: "0px 2px 1.5px 0px rgba(165, 174, 184, 0.32) inset" }}
            >
              <div className="flex items-center space-x-2">
                <p className="text-sm">
                  <span className="font-medium">
                    {currentMonth}, {currentYear}
                  </span>
                </p>
                <span className="h-1 w-1 rounded-full bg-gray-400">&nbsp;</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select available date
                </p>
              </div>
              <div className="mt-4 grid grid-cols-7 grid-rows-6 gap-2 px-4">
                {renderCalendarDays()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (bookingLink) {
    return bookingLink.startsWith("/") ? (
      <Link href={bookingLink} className="block">
        {content}
      </Link>
    ) : (
      <a
        href={bookingLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </a>
    );
  }

  return content;
}
