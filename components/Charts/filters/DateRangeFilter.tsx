"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { ru } from "date-fns/locale";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getRangeLabel } from "../lib/constants";

type DateRangeFilterProps = {
  range: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  onResetToCurrentMonth: () => void;
  hasSelectedRange: boolean;
};

export default function DateRangeFilter({
  range,
  onChange,
  onResetToCurrentMonth,
  hasSelectedRange,
}: DateRangeFilterProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start">
            <CalendarRange className="h-4 w-4" />
            {getRangeLabel(range)}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-fit">
          <div className="flex flex-col gap-4">
            <Calendar
              mode="range"
              locale={ru}
              selected={range}
              onSelect={onChange}
              className="mx-auto rounded-md border"
              buttonVariant="link"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  onChange(undefined);
                  setCalendarOpen(false);
                }}
              >
                Сбросить
              </Button>
              <Button className="flex-1" onClick={() => setCalendarOpen(false)}>
                Применить
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="secondary"
        onClick={onResetToCurrentMonth}
        disabled={!hasSelectedRange}
      >
        Текущий месяц
      </Button>
    </div>
  );
}
