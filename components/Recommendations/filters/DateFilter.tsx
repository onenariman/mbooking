"use client";

import type { DateRange } from "react-day-picker";
import DateRangeFilter from "@/components/Charts/filters/DateRangeFilter";
import { Button } from "@/components/ui/button";

type DateFilterProps = {
  range: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  onSelectCurrentWeek: () => void;
  hasSelectedRange: boolean;
  isCurrentWeekSelected: boolean;
};

export default function DateFilter({
  range,
  onChange,
  onSelectCurrentWeek,
  hasSelectedRange,
  isCurrentWeekSelected,
}: DateFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Фильтр:</span>

      <Button
        variant={isCurrentWeekSelected ? "default" : "secondary"}
        onClick={onSelectCurrentWeek}
      >
        Текущая неделя
      </Button>
      <DateRangeFilter
        range={range}
        onChange={onChange}
        onResetToCurrentMonth={onSelectCurrentWeek}
        hasSelectedRange={hasSelectedRange}
        showSecondaryAction={false}
      />
    </div>
  );
}
