"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarClock, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsufficientFeedbackError } from "@/src/api/feedback.api";
import {
  useDeleteRecommendation,
  useGenerateRecommendations,
  useRecommendations,
} from "@/src/hooks/feedback.hooks";
import { ZodRecommendationPeriod } from "@/src/schemas/feedback/feedbackSchema";

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

export default function RecommendationsSection() {
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
      await generateRecommendation(period);
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
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>Рекомендации ИИ</CardTitle>
            <CardDescription>
              Сводные рекомендации на основе анонимных отзывов клиентов.
            </CardDescription>
          </div>
          <Button className="gap-2" onClick={handleGenerate} disabled={isPending}>
            {isPending ? <Spinner className="mr-1" /> : <Sparkles className="h-4 w-4" />}
            {isPending ? "Генерация..." : "Сгенерировать рекомендации"}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Период анализа:
            </span>
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
              За выбранный период пока нет рекомендаций. Нажмите «Сгенерировать
              рекомендации», чтобы создать первую сводку.
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {recommendations.map((item, index) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger className="gap-3">
                    <div className="flex w-full flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(item.created_at), "dd MMMM yyyy", { locale: ru })}
                        </span>
                        {index === 0 && (
                          <Badge variant="default">Последняя</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {periodLabel}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => void handleDelete(item.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Удалить
                      </Button>
                    </div>
                    <p className="text-sm text-foreground">{item.summary}</p>
                    <div className="rounded-xl bg-muted/40 p-3 text-sm">
                      <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                        Источник данных
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Отзывов в периоде: {item.source_count}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
