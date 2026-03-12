"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsufficientFeedbackError } from "@/src/api/feedback.api";
import {
  useDeleteRecommendation,
  useGenerateRecommendations,
  useRecommendations,
} from "@/src/hooks/feedback.hooks";
import { ZodRecommendationPeriod } from "@/src/schemas/feedback/feedbackSchema";
import RecommendationsList from "./RecommendationsList";
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

export default function QuickRecommendationsSection() {
  const [period, setPeriod] = useState<ZodRecommendationPeriod>("month");
  const { data: recommendations = [], isLoading } = useRecommendations(period);
  const { mutateAsync: generateRecommendation, isPending } =
    useGenerateRecommendations();
  const { mutateAsync: deleteRecommendation, isPending: isDeleting } =
    useDeleteRecommendation();

  const periodLabel = useMemo(
    () => periodOptions.find((option) => option.value === period)?.label ?? period,
    [period],
  );

  const handleGenerate = async () => {
    try {
      await generateRecommendation({ period });
      toast.success("Рекомендации обновлены");
    } catch (error) {
      if (error instanceof InsufficientFeedbackError) {
        toast.error("Минимум 3 отзыва нужно для генерации");
        return;
      }
      toast.error(error instanceof Error ? error.message : "Ошибка генерации");
    }
  };

  const handlePeriodChange = (value: string) => {
    if (periodOptions.some((option) => option.value === value)) {
      setPeriod(value as ZodRecommendationPeriod);
    }
  };

  const handleDelete = async (recommendationId: string) => {
    const confirmed = window.confirm("Удалить эту рекомендацию?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteRecommendation(recommendationId);
      toast.success("Рекомендация удалена");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка удаления");
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <RecommendationsBreadcrumb current="Быстрые рекомендации" />
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>Быстрые рекомендации</CardTitle>
            <CardDescription>
              Сводные рекомендации на основе отзывов за выбранный период.
            </CardDescription>
          </div>
          <Button className="gap-2" onClick={handleGenerate} disabled={isPending}>
            {isPending ? <Spinner className="mr-1" /> : <Sparkles className="h-4 w-4" />}
            {isPending ? "Генерация..." : "Сгенерировать рекомендации"}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Период анализа:</span>
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
          </div>
          <div className="text-xs text-muted-foreground">
            Совет: для устойчивых рекомендаций желательно минимум 3 отзыва за
            период.
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              Загружаем рекомендации...
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              За выбранный период пока нет рекомендаций. Нажмите
              «Сгенерировать рекомендации», чтобы создать первую сводку.
            </div>
          ) : (
            <RecommendationsList
              recommendations={recommendations}
              periodLabel={periodLabel}
              isDeleting={isDeleting}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
