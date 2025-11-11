"use client";

import { DatePicker, parseDate } from "@ark-ui/react/date-picker";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface ArkCalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  availableDates?: string[]; // Array of "YYYY-MM-DD" strings
  minDate?: Date;
}

export default function ArkCalendar({
  selectedDate,
  onDateSelect,
  availableDates = [],
  minDate,
}: ArkCalendarProps) {
  const handleValueChange = (details: any) => {
    if (details.value && details.value[0] && onDateSelect) {
      // Convert Ark UI date to JavaScript Date using UTC to prevent timezone shifts
      const selectedValue = details.value[0];
      const jsDate = new Date(
        Date.UTC(selectedValue.year, selectedValue.month - 1, selectedValue.day)
      );
      onDateSelect(jsDate);
    }
  };

  const isDateAvailable = (date: any) => {
    if (!date) return false;
    const dateStr = `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
    return availableDates.includes(dateStr);
  };

  const isDateDisabled = (date: any) => {
    if (!date) return true;
    
    // Check if date is in the past - use UTC to prevent timezone issues
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const checkDate = new Date(Date.UTC(date.year, date.month - 1, date.day));
    
    if (checkDate < today) return true;
    if (minDate && checkDate < minDate) return true;
    
    // Check if date is not in available dates
    return !isDateAvailable(date);
  };

  const defaultValue = selectedDate
    ? [parseDate(selectedDate)]
    : [parseDate(new Date())];

  return (
    <DatePicker.Root
      inline
      defaultValue={defaultValue}
      timeZone={Intl.DateTimeFormat().resolvedOptions().timeZone}
      onValueChange={handleValueChange}
      isDateUnavailable={(date) => isDateDisabled(date)}
    >
      <DatePicker.Content className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 inline-block">
        <DatePicker.View view="day">
          <DatePicker.Context>
            {(api) => (
              <>
                <DatePicker.ViewControl className="flex items-center justify-between mb-4">
                  <DatePicker.PrevTrigger className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-700 dark:text-gray-300">
                    <ChevronLeftIcon className="w-5 h-5" />
                  </DatePicker.PrevTrigger>
                  <DatePicker.ViewTrigger className="text-base font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1.5 rounded-md transition-colors">
                    <DatePicker.RangeText />
                  </DatePicker.ViewTrigger>
                  <DatePicker.NextTrigger className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-700 dark:text-gray-300">
                    <ChevronRightIcon className="w-5 h-5" />
                  </DatePicker.NextTrigger>
                </DatePicker.ViewControl>
                <DatePicker.Table className="w-full border-separate border-spacing-1">
                  <DatePicker.TableHead>
                    <DatePicker.TableRow>
                      {api.weekDays.map((weekDay, id) => (
                        <DatePicker.TableHeader
                          key={id}
                          className="text-sm font-semibold text-gray-600 dark:text-gray-400 w-10 h-8 text-center"
                        >
                          {weekDay.narrow}
                        </DatePicker.TableHeader>
                      ))}
                    </DatePicker.TableRow>
                  </DatePicker.TableHead>
                  <DatePicker.TableBody>
                    {api.weeks.map((week, id) => (
                      <DatePicker.TableRow key={id}>
                        {week.map((day, id) => {
                          const disabled = isDateDisabled(day);
                          const available = isDateAvailable(day);
                          
                          return (
                            <DatePicker.TableCell
                              key={id}
                              value={day}
                              className="p-0"
                            >
                              <DatePicker.TableCellTrigger
                                className={`
                                  relative w-10 h-10 text-sm font-medium rounded-lg transition-all
                                  flex items-center justify-center
                                  ${
                                    disabled
                                      ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                      : available
                                      ? "text-white bg-indigo-500 hover:bg-indigo-600 cursor-pointer"
                                      : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                                  }
                                  data-selected:bg-indigo-700 data-selected:text-white data-selected:ring-2 data-selected:ring-indigo-500 data-selected:ring-offset-2
                                  dark:data-selected:bg-indigo-600 dark:data-selected:ring-indigo-400
                                  data-today:after:content-[''] data-today:after:absolute data-today:after:bottom-1 
                                  data-today:after:w-1 data-today:after:h-1 data-today:after:bg-gray-900 
                                  data-today:after:rounded-full dark:data-today:after:bg-gray-300
                                  data-selected:data-today:after:bg-white dark:data-selected:data-today:after:bg-white
                                  data-disabled:opacity-40 data-disabled:cursor-not-allowed
                                `}
                              >
                                {day.day}
                              </DatePicker.TableCellTrigger>
                            </DatePicker.TableCell>
                          );
                        })}
                      </DatePicker.TableRow>
                    ))}
                  </DatePicker.TableBody>
                </DatePicker.Table>
              </>
            )}
          </DatePicker.Context>
        </DatePicker.View>

        <DatePicker.View view="month">
          <DatePicker.Context>
            {(api) => (
              <>
                <DatePicker.ViewControl className="flex items-center justify-between mb-4">
                  <DatePicker.PrevTrigger className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-700 dark:text-gray-300">
                    <ChevronLeftIcon className="w-5 h-5" />
                  </DatePicker.PrevTrigger>
                  <DatePicker.ViewTrigger className="text-base font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1.5 rounded-md transition-colors">
                    <DatePicker.RangeText />
                  </DatePicker.ViewTrigger>
                  <DatePicker.NextTrigger className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-700 dark:text-gray-300">
                    <ChevronRightIcon className="w-5 h-5" />
                  </DatePicker.NextTrigger>
                </DatePicker.ViewControl>
                <DatePicker.Table className="w-full border-separate border-spacing-1">
                  <DatePicker.TableBody>
                    {api
                      .getMonthsGrid({ columns: 4, format: "short" })
                      .map((months, id) => (
                        <DatePicker.TableRow key={id}>
                          {months.map((month, id) => (
                            <DatePicker.TableCell key={id} value={month.value}>
                              <DatePicker.TableCellTrigger className="w-20 h-12 text-sm text-gray-900 dark:text-gray-100 hover:bg-indigo-50 hover:rounded-lg dark:hover:bg-gray-700 rounded-lg transition-colors data-selected:bg-indigo-600 data-selected:text-white data-selected:rounded-lg dark:data-selected:bg-indigo-500 flex items-center justify-center font-medium">
                                {month.label}
                              </DatePicker.TableCellTrigger>
                            </DatePicker.TableCell>
                          ))}
                        </DatePicker.TableRow>
                      ))}
                  </DatePicker.TableBody>
                </DatePicker.Table>
              </>
            )}
          </DatePicker.Context>
        </DatePicker.View>

        <DatePicker.View view="year">
          <DatePicker.Context>
            {(api) => (
              <>
                <DatePicker.ViewControl className="flex items-center justify-between mb-4">
                  <DatePicker.PrevTrigger className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-700 dark:text-gray-300">
                    <ChevronLeftIcon className="w-5 h-5" />
                  </DatePicker.PrevTrigger>
                  <DatePicker.ViewTrigger className="text-base font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1.5 rounded-md transition-colors">
                    <DatePicker.RangeText />
                  </DatePicker.ViewTrigger>
                  <DatePicker.NextTrigger className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-700 dark:text-gray-300">
                    <ChevronRightIcon className="w-5 h-5" />
                  </DatePicker.NextTrigger>
                </DatePicker.ViewControl>
                <DatePicker.Table className="w-full border-separate border-spacing-1">
                  <DatePicker.TableBody>
                    {api.getYearsGrid({ columns: 4 }).map((years, id) => (
                      <DatePicker.TableRow key={id}>
                        {years.map((year, id) => (
                          <DatePicker.TableCell key={id} value={year.value}>
                            <DatePicker.TableCellTrigger className="w-20 h-12 text-sm text-gray-900 dark:text-gray-100 hover:bg-indigo-50 hover:rounded-lg dark:hover:bg-gray-700 rounded-lg transition-colors data-selected:bg-indigo-600 data-selected:text-white data-selected:rounded-lg dark:data-selected:bg-indigo-500 flex items-center justify-center font-medium">
                              {year.label}
                            </DatePicker.TableCellTrigger>
                          </DatePicker.TableCell>
                        ))}
                      </DatePicker.TableRow>
                    ))}
                  </DatePicker.TableBody>
                </DatePicker.Table>
              </>
            )}
          </DatePicker.Context>
        </DatePicker.View>
      </DatePicker.Content>
    </DatePicker.Root>
  );
}
