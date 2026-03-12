"use client";

import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
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
import DateRangeFilter from "@/components/Charts/filters/DateRangeFilter";
import { getDefaultRange, getRangeLabel } from "@/components/Charts/lib/constants";
import { InsufficientFeedbackError } from "@/src/api/feedback.api";
import {
  useDeleteRecommendation,
  useGenerateRecommendations,
  useRecommendationsByRange,
} from "@/src/hooks/feedback.hooks";
import RecommendationsList from "./RecommendationsList";
import RecommendationsBreadcrumb from "./RecommendationsBreadcrumb";

const toDateOnlyIso = (date: Date) => date.toISOString().slice(0, 10);

export default function RangeRecommendationsSection() {
  const [range, setRange] = useState<DateRange | undefined>(getDefaultRange());
  const { mutateAsync: generateRecommendation, isPending } =
    useGenerateRecommendations();
  const { mutateAsync: deleteRecommendation, isPending: isDeleting } =
    useDeleteRecommendation();

  const hasRange = Boolean(range?.from && range?.to);
  const rangeLabel = getRangeLabel(range);

  const rangeKey = useMemo(() => {
    if (!range?.from || !range?.to) return null;
    return {
      from: toDateOnlyIso(range.from),
      to: toDateOnlyIso(range.to),
    };
  }, [range]);

  const { data: recommendations = [], isLoading } = useRecommendationsByRange(
    rangeKey?.from ?? null,
    rangeKey?.to ?? null,
  );

  const handleGenerate = async () => {
    if (!rangeKey) {
      toast.error("Выберите диапазон дат");
      return;
    }

    try {
      await generateRecommendation({ from: rangeKey.from, to: rangeKey.to });
      toast.success("Рекомендации обновлены");
    } catch (error) {
      if (error instanceof InsufficientFeedbackError) {
        toast.error("Минимум 3 отзыва нужно для генерации");
        return;
      }
      toast.error(error instanceof Error ? error.message : "Ошибка генерации");
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
      <RecommendationsBreadcrumb current="Рекомендации по датам" />
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>Рекомендации по датам</CardTitle>
            <CardDescription>
              Сводные рекомендации на основе отзывов за выбранный диапазон.
            </CardDescription>
          </div>
          <Button className="gap-2" onClick={handleGenerate} disabled={isPending}>
            {isPending ? <Spinner className="mr-1" /> : <Sparkles className="h-4 w-4" />}
            {isPending ? "Генерация..." : "Сгенерировать рекомендации"}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <DateRangeFilter
            range={range}
            onChange={setRange}
            onResetToCurrentMonth={() => setRange(getDefaultRange())}
            hasSelectedRange={hasRange}
          />
          <div className="text-xs text-muted-foreground">
            Выбранный диапазон: {rangeLabel}
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              Загружаем рекомендации...
            </div>
          ) : !rangeKey ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              Выберите диапазон дат, чтобы увидеть рекомендации.
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              За выбранный диапазон пока нет рекомендаций. Нажмите
              «Сгенерировать рекомендации», чтобы создать первую сводку.
            </div>
          ) : (
            <RecommendationsList
              recommendations={recommendations}
              periodLabel={rangeLabel}
              isDeleting={isDeleting}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
