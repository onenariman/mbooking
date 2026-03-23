"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarClock, Trash2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ZodAiRecommendation } from "@/src/schemas/feedback/feedbackSchema";
import DeleteConfirmButton from "./DeleteConfirmButton";

type RecommendationsListProps = {
  recommendations: ZodAiRecommendation[];
  periodLabel: string;
  isDeleting: boolean;
  onDelete: (id: string) => Promise<void>;
};

export default function RecommendationsList({
  recommendations,
  periodLabel,
  isDeleting,
  onDelete,
}: RecommendationsListProps) {
  const getPromptBadgeLabel = (item: ZodAiRecommendation) => {
    const snapshotName = item.prompt_name_snapshot?.trim();
    if (snapshotName) {
      return snapshotName;
    }

    return item.prompt_id_snapshot ? "Пользовательский промпт" : "Системный";
  };

  const renderSummary = (summary: string) => {
    const sectionTitles = new Set([
      "Сводка",
      "Сильные стороны",
      "Зоны роста",
      "План действий",
      "Быстрая победа",
      "Скрипт напоминания",
      "Скрипт при задержке",
    ]);

    return summary.split("\n").map((line, idx) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        return <div key={`${idx}-spacer`} className="h-2" />;
      }

      const isHeading =
        sectionTitles.has(trimmedLine) || trimmedLine.startsWith("Приоритет:");

      return (
        <p
          key={`${idx}-${trimmedLine}`}
          className={
            isHeading
              ? "mt-2 whitespace-pre-wrap text-sm font-semibold leading-relaxed"
              : "whitespace-pre-wrap text-sm leading-relaxed"
          }
        >
          {line}
        </p>
      );
    });
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      {recommendations.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger className="gap-3">
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {format(new Date(item.created_at), "dd MMMM yyyy", {
                    locale: ru,
                  })}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(item.created_at), "HH:mm")}
                </span>
                <Badge variant="secondary">{getPromptBadgeLabel(item)}</Badge>
              </div>
              <span className="text-xs text-muted-foreground">{periodLabel}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            <div className="flex justify-end">
              <DeleteConfirmButton
                title="Удалить рекомендацию?"
                description="Это действие нельзя отменить. Рекомендация будет удалена из списка."
                onDelete={() => onDelete(item.id)}
                successMessage="Рекомендация удалена"
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
            <div className="text-foreground">{renderSummary(item.summary)}</div>
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
  );
}
