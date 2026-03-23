"use client";

import type { DateRange } from "react-day-picker";
import DateFilter from "./DateFilter";
import ListPromptFilter from "./ListPromptFilter";
import type { RecommendationPromptFilterOption } from "./types";

type RecommendationsFiltersProps = {
  range: DateRange | undefined;
  onRangeChange: (range: DateRange | undefined) => void;
  onSelectCurrentWeek: () => void;
  hasSelectedRange: boolean;
  isCurrentWeekSelected: boolean;
  listPromptFilterValue: string;
  onListPromptFilterChange: (value: string) => void;
  listPromptOptions: RecommendationPromptFilterOption[];
  isListPromptFilterDisabled?: boolean;
};

export default function RecommendationsFilters({
  range,
  onRangeChange,
  onSelectCurrentWeek,
  hasSelectedRange,
  isCurrentWeekSelected,
  listPromptFilterValue,
  onListPromptFilterChange,
  listPromptOptions,
  isListPromptFilterDisabled,
}: RecommendationsFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center items-start gap-2">
      <DateFilter
        range={range}
        onChange={onRangeChange}
        onSelectCurrentWeek={onSelectCurrentWeek}
        hasSelectedRange={hasSelectedRange}
        isCurrentWeekSelected={isCurrentWeekSelected}
      />
      <ListPromptFilter
        value={listPromptFilterValue}
        onChange={onListPromptFilterChange}
        options={listPromptOptions}
        disabled={isListPromptFilterDisabled}
      />
    </div>
  );
}
