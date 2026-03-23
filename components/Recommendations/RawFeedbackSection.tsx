"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { startOfWeek } from "date-fns";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useDeleteFeedbackResponse,
  useFeedbackResponses,
} from "@/src/hooks/feedback.hooks";
import DeleteConfirmButton from "./DeleteConfirmButton";
import RecommendationsBreadcrumb from "./RecommendationsBreadcrumb";

const scoreOptions = [
  { key: "score_result", label: "Результат процедуры" },
  { key: "score_explanation", label: "Объяснения мастера" },
  { key: "score_comfort", label: "Комфорт процедуры" },
  { key: "score_booking", label: "Удобство записи" },
  { key: "score_recommendation", label: "Готовность рекомендовать" },
] as const;

type ScoreKey = (typeof scoreOptions)[number]["key"];

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

export default function RawFeedbackSection() {
  const [range, setRange] = useState<DateRange | undefined>(getCurrentWeekRange());
  const [scoreKey, setScoreKey] = useState<ScoreKey>("score_result");

  const currentWeekRange = useMemo(() => getCurrentWeekRange(), []);
  const hasRange = Boolean(range?.from && range?.to);
  const isCurrentWeekSelected = useMemo(
    () => isSameRange(range, currentWeekRange),
    [currentWeekRange, range],
  );

  const rangeLabel = getRangeLabel(range);
  const periodLabel = isCurrentWeekSelected ? "Текущая неделя" : rangeLabel;
  const selectedScoreLabel =
    scoreOptions.find((option) => option.key === scoreKey)?.label ?? scoreKey;

  const rangeKey = useMemo(() => {
    if (!hasDefinedRange(range)) {
      return null;
    }

    return {
      from: toDateOnlyIso(range.from),
      to: toDateOnlyIso(range.to),
    };
  }, [range]);

  const { data: feedback = [], isLoading } = useFeedbackResponses(
    rangeKey?.from ?? null,
    rangeKey?.to ?? null,
  );
  const { mutateAsync: deleteFeedback, isPending: isDeleting } =
    useDeleteFeedbackResponse();

  const filteredFeedback = useMemo(
    () =>
      feedback.filter((item) => item[scoreKey] !== null && item[scoreKey] !== undefined),
    [feedback, scoreKey],
  );

  return (
    <div className="flex flex-col gap-4 pb-8">
      <RecommendationsBreadcrumb current="Сырые отзывы" />

      <Card>
        <CardHeader>
          <CardTitle>Сырые отзывы</CardTitle>
          <CardDescription>
            Просмотр отзывов за текущую неделю или выбранный диапазон с фильтром
            по конкретной метрике.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
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
            <Select
              value={scoreKey}
              onValueChange={(value) => setScoreKey(value as ScoreKey)}
            >
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Выберите метрику" />
              </SelectTrigger>
              <SelectContent>
                {scoreOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <div>Выбранный диапазон: {periodLabel}</div>
            <div>Показатель: {selectedScoreLabel}</div>
            <div>Найдено отзывов: {filteredFeedback.length}</div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
          Загружаем отзывы...
        </div>
      ) : filteredFeedback.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
          Нет отзывов за выбранный диапазон и показатель.
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredFeedback.map((item) => {
            const selectedValue = item[scoreKey];

            return (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm">
                        {format(new Date(item.created_at), "dd MMMM yyyy", {
                          locale: ru,
                        })}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {selectedScoreLabel}:{" "}
                        {selectedValue === null || selectedValue === undefined
                          ? "н/д"
                          : `${selectedValue}/5`}
                      </CardDescription>
                    </div>
                    <DeleteConfirmButton
                      title="Удалить отзыв?"
                      description="Это действие нельзя отменить. Отзыв будет удален из базы данных."
                      onDelete={() => deleteFeedback(item.id)}
                      successMessage="Отзыв удален"
                      errorMessage="Ошибка удаления"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        disabled={isDeleting}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Удалить
                      </Button>
                    </DeleteConfirmButton>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm whitespace-pre-wrap">{item.feedback_text}</p>
                  <div className="grid gap-1 text-xs text-muted-foreground">
                    {scoreOptions.map((score) => {
                      const value = item[score.key];
                      return (
                        <div
                          key={score.key}
                          className="flex items-center justify-between"
                        >
                          <span>{score.label}</span>
                          <span>
                            {value === null || value === undefined ? "—" : `${value}/5`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
