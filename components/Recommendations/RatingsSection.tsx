"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeedbackRatingsTrend } from "@/src/hooks/feedback.hooks";
import { ZodRecommendationPeriod } from "@/src/schemas/feedback/feedbackSchema";
import FeedbackRatingsChart from "./FeedbackRatingsChart";
import RecommendationsBreadcrumb from "./RecommendationsBreadcrumb";

type PeriodOption = {
  value: ZodRecommendationPeriod;
  label: string;
};

const periodOptions: PeriodOption[] = [
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "3m", label: "3 месяца" },
  { value: "6m", label: "6 месяцев" },
  { value: "9m", label: "9 месяцев" },
  { value: "12m", label: "12 месяцев" },
];

export default function RatingsSection() {
  const [period, setPeriod] = useState<ZodRecommendationPeriod>("month");
  const { data: ratings = [], isLoading } = useFeedbackRatingsTrend(period);

  const periodLabel = useMemo(
    () => periodOptions.find((option) => option.value === period)?.label ?? period,
    [period],
  );

  const handlePeriodChange = (value: string) => {
    if (periodOptions.some((option) => option.value === value)) {
      setPeriod(value as ZodRecommendationPeriod);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <RecommendationsBreadcrumb current="Рейтинг по оценкам" />
      <Card>
        <CardHeader>
          <CardTitle>Рейтинг по оценкам</CardTitle>
          <CardDescription>
            Сравнение среднего рейтинга по вопросам за выбранный период.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Период:</span>
          <Tabs value={period} onValueChange={handlePeriodChange}>
            <TabsList className="flex flex-wrap gap-2 h-auto bg-transparent p-0">
              {periodOptions.map((option) => (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  className="h-8 px-3 text-xs"
                >
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
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
