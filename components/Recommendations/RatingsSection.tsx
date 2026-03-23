"use client";

import { startOfWeek } from "date-fns";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import DateRangeFilter from "@/components/Charts/filters/DateRangeFilter";
import { getRangeLabel } from "@/components/Charts/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFeedbackRatingsTrend } from "@/src/hooks/feedback.hooks";
import FeedbackRatingsChart from "./FeedbackRatingsChart";
import RecommendationsBreadcrumb from "./RecommendationsBreadcrumb";

const toDateOnlyIso = (date: Date) => date.toISOString().slice(0, 10);
type DefinedDateRange = { from: Date; to: Date };

const getCurrentWeekRange = (): DefinedDateRange => {
  const now = new Date();
  return {
    from: startOfWeek(now, { weekStartsOn: 1 }),
    to: now,
  };
};

const hasDefinedRange = (
  range: DateRange | undefined,
): range is DefinedDateRange => Boolean(range?.from && range?.to);

const isSameRange = (left: DateRange | undefined, right: DefinedDateRange) => {
  if (!hasDefinedRange(left)) {
    return false;
  }

  return (
    toDateOnlyIso(left.from) === toDateOnlyIso(right.from) &&
    toDateOnlyIso(left.to) === toDateOnlyIso(right.to)
  );
};

export default function RatingsSection() {
  const [range, setRange] = useState<DateRange | undefined>(getCurrentWeekRange());

  const currentWeekRange = useMemo(() => getCurrentWeekRange(), []);
  const hasRange = Boolean(range?.from && range?.to);
  const isCurrentWeekSelected = useMemo(
    () => isSameRange(range, currentWeekRange),
    [currentWeekRange, range],
  );

  const rangeLabel = getRangeLabel(range);
  const periodLabel = isCurrentWeekSelected ? "Текущая неделя" : rangeLabel;

  const rangeKey = useMemo(() => {
    if (!hasDefinedRange(range)) {
      return null;
    }

    return {
      from: toDateOnlyIso(range.from),
      to: toDateOnlyIso(range.to),
    };
  }, [range]);

  const { data: ratings = [], isLoading } = useFeedbackRatingsTrend(
    rangeKey?.from ?? null,
    rangeKey?.to ?? null,
  );

  return (
    <div className="flex flex-col gap-4 pb-8">
      <RecommendationsBreadcrumb current="Рейтинг по оценкам" />

      <Card>
        <CardHeader>
          <CardTitle>Рейтинг по оценкам</CardTitle>
          <CardDescription>
            Сводка по оценкам за текущую неделю или выбранный диапазон.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Фильтр:</span>
          <Button
            variant={isCurrentWeekSelected ? "default" : "secondary"}
            onClick={() => setRange(getCurrentWeekRange())}
          >
            Текущая неделя
          </Button>
          <DateRangeFilter
            range={range}
            onChange={setRange}
            onResetToCurrentMonth={() => setRange(getCurrentWeekRange())}
            hasSelectedRange={hasRange}
            showSecondaryAction={false}
          />
        </CardContent>
      </Card>

      <FeedbackRatingsChart
        data={ratings}
        isLoading={isLoading}
        periodLabel={periodLabel}
      />
    </div>
  );
}
