"use client";

import Link from "next/link";
import { startOfWeek } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getRangeLabel } from "@/components/Charts/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  InsufficientFeedbackError,
  runRecommendationJob,
  waitForRecommendationJob,
} from "@/src/api/feedback.api";
import {
  useDeleteRecommendation,
  useGenerateRecommendations,
  useRecommendations,
} from "@/src/hooks/feedback.hooks";
import { useRecommendationPrompts } from "@/src/hooks/recommendationPrompts.hooks";
import { getErrorMessage } from "@/src/helpers/getErrorMessage";
import type { ZodAiRecommendation } from "@/src/schemas/feedback/feedbackSchema";
import PromptSelect from "./PromptSelect";
import RecommendationsBreadcrumb from "./RecommendationsBreadcrumb";
import RecommendationsList from "./RecommendationsList";
import RecommendationsFilters from "./filters/RecommendationsFilters";
import type { RecommendationPromptFilterOption } from "./filters/types";

const toDateOnlyIso = (date: Date) => date.toISOString().slice(0, 10);
const ALL_PROMPTS_FILTER_VALUE = "all";
const SYSTEM_PROMPT_FILTER_VALUE = "system";
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

const getRecommendationPromptLabel = (recommendation: ZodAiRecommendation) => {
  const snapshotName = recommendation.prompt_name_snapshot?.trim();
  if (snapshotName) {
    return snapshotName;
  }

  return recommendation.prompt_id_snapshot
    ? "Пользовательский промпт"
    : "Системный";
};

const getRecommendationPromptFilterValue = (
  recommendation: ZodAiRecommendation,
) => {
  if (!recommendation.prompt_id_snapshot) {
    return SYSTEM_PROMPT_FILTER_VALUE;
  }

  const snapshotName = recommendation.prompt_name_snapshot?.trim() ?? "";
  return `prompt:${recommendation.prompt_id_snapshot}:${snapshotName}`;
};

export default function RecommendationsSection() {
  const [range, setRange] = useState<DateRange | undefined>(
    getCurrentWeekRange(),
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptId, setPromptId] = useState<string | null>(null);
  const [promptFilter, setPromptFilter] = useState(ALL_PROMPTS_FILTER_VALUE);
  const queryClient = useQueryClient();

  const { mutateAsync: generateRecommendation, isPending } =
    useGenerateRecommendations();
  const { mutateAsync: deleteRecommendation, isPending: isDeleting } =
    useDeleteRecommendation();
  const { data: prompts = [], isLoading: isPromptsLoading } =
    useRecommendationPrompts();

  const isBusy = isPending || isGenerating;
  const hasRange = Boolean(range?.from && range?.to);
  const currentWeekRange = useMemo(() => getCurrentWeekRange(), []);
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

  const { data: recommendations = [], isLoading } = useRecommendations(
    rangeKey?.from ?? null,
    rangeKey?.to ?? null,
  );

  const promptFilterOptions = useMemo<
    RecommendationPromptFilterOption[]
  >(() => {
    const options: RecommendationPromptFilterOption[] = [
      {
        value: ALL_PROMPTS_FILTER_VALUE,
        label: "Все промпты",
      },
    ];
    const seenValues = new Set<string>([ALL_PROMPTS_FILTER_VALUE]);

    for (const recommendation of recommendations) {
      const value = getRecommendationPromptFilterValue(recommendation);
      if (seenValues.has(value)) {
        continue;
      }

      seenValues.add(value);
      options.push({
        value,
        label: getRecommendationPromptLabel(recommendation),
      });
    }

    return options;
  }, [recommendations]);

  const filteredRecommendations = useMemo(() => {
    if (promptFilter === ALL_PROMPTS_FILTER_VALUE) {
      return recommendations;
    }

    return recommendations.filter(
      (recommendation) =>
        getRecommendationPromptFilterValue(recommendation) === promptFilter,
    );
  }, [promptFilter, recommendations]);

  useEffect(() => {
    if (promptId !== null) {
      return;
    }

    const defaultPrompt = prompts.find((item) => item.is_default);
    setPromptId(defaultPrompt?.id ?? "system");
  }, [prompts, promptId]);

  useEffect(() => {
    const hasSelectedOption = promptFilterOptions.some(
      (option) => option.value === promptFilter,
    );

    if (!hasSelectedOption) {
      setPromptFilter(ALL_PROMPTS_FILTER_VALUE);
    }
  }, [promptFilter, promptFilterOptions]);

  const handleSetCurrentWeek = () => {
    setRange(getCurrentWeekRange());
  };

  const handleGenerate = async () => {
    if (!rangeKey) {
      toast.error("Выберите диапазон дат");
      return;
    }

    try {
      setIsGenerating(true);
      const job = await generateRecommendation({
        from: rangeKey.from,
        to: rangeKey.to,
        promptId: promptId && promptId !== "system" ? promptId : undefined,
      });

      if (job.status === "succeeded") {
        await queryClient.invalidateQueries({
          queryKey: ["ai-recommendations", rangeKey.from, rangeKey.to],
        });
        toast.success("Рекомендации обновлены");
        return;
      }

      if (job.status === "queued") {
        runRecommendationJob(job.id).catch((error) => {
          console.error("Failed to start recommendation job", error);
        });
      }

      toast.info("Запрос на генерацию принят");
      await waitForRecommendationJob(job.id);
      await queryClient.invalidateQueries({
        queryKey: ["ai-recommendations", rangeKey.from, rangeKey.to],
      });
      toast.success("Рекомендации обновлены");
    } catch (error) {
      if (error instanceof InsufficientFeedbackError) {
        toast.error("Минимум 3 отзыва нужно для генерации");
        return;
      }

      toast.error(getErrorMessage(error, "Ошибка генерации"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (recommendationId: string) => {
    await deleteRecommendation(recommendationId);
  };

  return (
    <div className="flex flex-col gap-4">
      <RecommendationsBreadcrumb current="Рекомендации" showRoot={false} />

      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="space-y-1">
            <CardTitle>Рекомендации</CardTitle>
            <CardDescription>
              Быстрый пресет текущей недели и произвольный диапазон через
              календарь на одном экране.
            </CardDescription>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <PromptSelect
              prompts={prompts}
              value={promptId ?? "system"}
              onChange={setPromptId}
              isLoading={isPromptsLoading}
            />
            <Button onClick={handleGenerate} disabled={isBusy}>
              {isBusy ? (
                <Spinner className="mr-1" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isBusy ? "Генерация..." : "Сгенерировать рекомендации"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <RecommendationsFilters
            range={range}
            onRangeChange={setRange}
            onSelectCurrentWeek={handleSetCurrentWeek}
            hasSelectedRange={hasRange}
            isCurrentWeekSelected={isCurrentWeekSelected}
            listPromptFilterValue={promptFilter}
            onListPromptFilterChange={setPromptFilter}
            listPromptOptions={promptFilterOptions}
            isListPromptFilterDisabled={
              isLoading || recommendations.length === 0
            }
          />

          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <div>Выбранный диапазон: {rangeLabel}</div>
            <div>Для генерации желательно минимум 3 отзыва за период.</div>
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
          ) : filteredRecommendations.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              Для выбранного промпта в этом диапазоне рекомендаций пока нет.
            </div>
          ) : (
            <RecommendationsList
              recommendations={filteredRecommendations}
              periodLabel={periodLabel}
              isDeleting={isDeleting}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Отчеты</CardTitle>
          <CardDescription>
            Рейтинг по оценкам и сырые отзывы пока остаются на отдельных
            страницах.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/recommendations/ratings">Рейтинг по оценкам</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/recommendations/raw">Сырые отзывы</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/recommendations/prompts">Промпты</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
