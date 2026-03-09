"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitFeedback } from "@/src/hooks/feedback.hooks";

interface SubmitFeedbackFormProps {
  token: string;
}

type SpeechRecognitionResultLike = {
  transcript: string;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type WindowWithSpeech = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

export default function SubmitFeedbackForm({ token }: SubmitFeedbackFormProps) {
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const { mutateAsync: submitFeedback, isPending } = useSubmitFeedback();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const w = window as WindowWithSpeech;
    const SpeechRecognition = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    queueMicrotask(() => {
      setIsSpeechSupported(true);
    });

    const recognition = new SpeechRecognition();
    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      const text = lastResult?.[0]?.transcript?.trim();
      if (!text) {
        return;
      }

      setFeedbackText((prev) => {
        const normalizedPrev = prev.trim();
        return normalizedPrev.length > 0
          ? `${normalizedPrev} ${text}`
          : text;
      });
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        toast.error("Доступ к микрофону запрещен");
      } else {
        toast.error("Не удалось распознать речь");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore stop errors on unmount
      }
      recognitionRef.current = null;
    };
  }, []);

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

  const toggleListening = () => {
    if (!isSpeechSupported || !recognitionRef.current) {
      toast.error("Голосовой ввод не поддерживается в этом браузере");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
      toast.info("Слушаю...");
    } catch {
      toast.error("Не удалось запустить голосовой ввод");
      setIsListening(false);
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
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {isSpeechSupported
                    ? "Можно надиктовать отзыв голосом"
                    : "Голосовой ввод недоступен в этом браузере"}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleListening}
                  disabled={!isSpeechSupported || isSubmitted}
                  className="gap-2"
                >
                  {isListening ? (
                    <>
                      <Square className="h-4 w-4" />
                      Остановить
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Голосом
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={
                isPending || isListening || feedbackText.trim().length < 5 || !token
              }
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
