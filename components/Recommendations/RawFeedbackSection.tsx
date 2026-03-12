"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeedbackResponses } from "@/src/hooks/feedback.hooks";
import { ZodRecommendationPeriod } from "@/src/schemas/feedback/feedbackSchema";
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

const scoreLabels = [
  { key: "score_result", label: "Результат" },
  { key: "score_explanation", label: "Объяснения" },
  { key: "score_comfort", label: "Комфорт" },
  { key: "score_booking", label: "Запись" },
  { key: "score_recommendation", label: "Рекомендация" },
] as const;

export default function RawFeedbackSection() {
  const [period, setPeriod] = useState<ZodRecommendationPeriod>("month");
  const { data: feedback = [], isLoading } = useFeedbackResponses(period);

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
      <RecommendationsBreadcrumb current="Сырые отзывы" />
      <Card>
        <CardHeader>
          <CardTitle>Сырые отзывы</CardTitle>
          <CardDescription>
            Оригинальные комментарии клиентов за выбранный период.
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
          <span className="text-xs text-muted-foreground">
            Найдено: {feedback.length} за {periodLabel}
          </span>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
          Загружаем отзывы...
        </div>
      ) : feedback.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
          Нет отзывов за выбранный период.
        </div>
      ) : (
        <div className="grid gap-4">
          {feedback.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {format(new Date(item.created_at), "dd MMMM yyyy", {
                    locale: ru,
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm whitespace-pre-wrap">
                  {item.feedback_text}
                </p>
                <div className="grid gap-1 text-xs text-muted-foreground">
                  {scoreLabels.map((score) => {
                    const value = item[score.key];
                    return (
                      <div
                        key={score.key}
                        className="flex items-center justify-between"
                      >
                        <span>{score.label}</span>
                        <span>
                          {value === null || value === undefined
                            ? "—"
                            : `${value}/5`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
