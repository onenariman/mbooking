"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const ratingScale = [1, 2, 3, 4, 5] as const;

type QuizleQuestion<Key extends string> = {
  key: Key;
  label: string;
};

type QuizleProps<Key extends string> = {
  questions: readonly QuizleQuestion<Key>[];
  ratings: Record<Key, number | null>;
  onRate: (key: Key, value: number) => void;
  disabled?: boolean;
};

export default function Quizle<Key extends string>({
  questions,
  ratings,
  onRate,
  disabled = false,
}: QuizleProps<Key>) {
  const total = questions.length;
  const [currentIndex, setCurrentIndex] = useState(0);

  const answeredCount = useMemo(
    () =>
      questions.reduce(
        (acc, question) =>
          Number.isFinite(ratings[question.key]) ? acc + 1 : acc,
        0,
      ),
    [questions, ratings],
  );

  const maxIndex = Math.max(total - 1, 0);
  const safeIndex = Math.min(currentIndex, maxIndex);
  const progress = total ? Math.round(((safeIndex + 1) / total) * 100) : 0;
  const isLast = safeIndex === total - 1;
  const currentQuestion = questions[safeIndex];
  const currentValue = currentQuestion ? ratings[currentQuestion.key] : null;

  const handleSelect = (value: string) => {
    if (!currentQuestion) {
      return;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return;
    }
    onRate(currentQuestion.key, numeric);
    if (safeIndex < total - 1) {
      setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
    }
  };

  const handleBack = () => {
    setCurrentIndex((prev) => Math.max(Math.min(prev, maxIndex) - 1, 0));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(Math.min(prev, maxIndex) + 1, maxIndex));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Вопрос {Math.min(safeIndex + 1, Math.max(total, 1))} из {total}
          </span>
          <span>
            Ответили: {answeredCount}/{total}
          </span>
        </div>
        <Progress value={progress} />
      </div>

      {!currentQuestion ? (
        <div className="text-sm text-muted-foreground">Нет вопросов</div>
      ) : (
        <div className="space-y-4">
          <div className="text-base font-medium">{currentQuestion.label}</div>
          <ToggleGroup
            type="single"
            value={currentValue ? String(currentValue) : ""}
            onValueChange={handleSelect}
            disabled={disabled}
            variant="outline"
            size="lg"
            className="flex flex-wrap gap-2"
            aria-label={currentQuestion.label}
          >
            {ratingScale.map((value) => (
              <ToggleGroupItem
                key={value}
                value={String(value)}
                aria-label={`Оценка ${value}`}
                className="h-12 w-12 min-w-0 border p-0 text-base font-semibold transition-colors !rounded-full hover:border-sky-300 hover:text-sky-700 data-[state=on]:border-sky-600 data-[state=on]:bg-sky-600 data-[state=on]:text-white"
              >
                {value}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="text-xs text-muted-foreground">
            Вопросы можно пропустить — это не обязательно.
          </div>

          <div className="flex items-center justify-between text-sm">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={disabled || currentIndex === 0}
            >
              Назад
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleNext}
              disabled={disabled || isLast}
            >
              {currentValue ? "Дальше" : "Пропустить"}
            </Button>
          </div>
          {isLast ? <div className="text-sm text-primary">Готово</div> : null}
        </div>
      )}
    </div>
  );
}
