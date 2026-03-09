"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useSubmitFeedback } from "@/src/hooks/feedback.hooks";

interface SubmitFeedbackFormProps {
  token: string;
}

export default function SubmitFeedbackForm({ token }: SubmitFeedbackFormProps) {
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { mutateAsync: submitFeedback, isPending } = useSubmitFeedback();

  const handleSubmit = async () => {
    if (isPending || isSubmitted) {
      return;
    }
    if (!token) {
      toast.error("Некорректная ссылка отзыва");
      return;
    }

    try {
      await submitFeedback({
        token,
        feedback_text: feedbackText,
      });
      setIsSubmitted(true);
      toast.success("Спасибо, отзыв отправлен");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка отправки";
      if (message.includes("Invalid or expired token")) {
        toast.error("Ссылка уже использована или истекла");
        return;
      }
      toast.error(message);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Анонимный отзыв</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSubmitted ? (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Отзыв получен. Эта ссылка больше не активна.
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="feedback-text">Что можно улучшить?</Label>
              <Textarea
                id="feedback-text"
                placeholder="Опишите, что стоит улучшить в обслуживании..."
                value={feedbackText}
                onChange={(event) => setFeedbackText(event.target.value)}
                className="min-h-32"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isPending || feedbackText.trim().length < 5 || !token}
              className="w-full"
            >
              {isPending ? <Spinner className="mr-2" /> : null}
              Отправить отзыв
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
