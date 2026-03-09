import { subDays, subMonths } from "date-fns";
import { createClient } from "@/src/utils/supabase/client";
import {
  ZodAiRecommendation,
  ZodRecommendationPeriod,
  ZodSubmitFeedback,
} from "@/src/schemas/feedback/feedbackSchema";

const supabase = createClient();

type PeriodRange = {
  from: string;
  to: string;
};

const toDateOnlyIso = (date: Date) => date.toISOString().slice(0, 10);

export const getPeriodRange = (period: ZodRecommendationPeriod): PeriodRange => {
  const now = new Date();
  const to = toDateOnlyIso(now);

  if (period === "week") {
    return { from: toDateOnlyIso(subDays(now, 7)), to };
  }
  if (period === "month") {
    return { from: toDateOnlyIso(subMonths(now, 1)), to };
  }
  if (period === "3m") {
    return { from: toDateOnlyIso(subMonths(now, 3)), to };
  }
  if (period === "6m") {
    return { from: toDateOnlyIso(subMonths(now, 6)), to };
  }
  if (period === "9m") {
    return { from: toDateOnlyIso(subMonths(now, 9)), to };
  }
  if (period === "12m") {
    return { from: toDateOnlyIso(subMonths(now, 12)), to };
  }

  return { from: toDateOnlyIso(subMonths(now, 1)), to };
};

const getCurrentUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw new Error(error.message);
  }
  const userId = data.user?.id;
  if (!userId) {
    throw new Error("Пользователь не авторизован");
  }
  return userId;
};

export const createFeedbackToken = async (expiresIn = "14 days") => {
  const { data, error } = await supabase.rpc("create_feedback_token", {
    p_expires_in: expiresIn,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as string;
};

export const submitFeedback = async (payload: ZodSubmitFeedback) => {
  const { data, error } = await supabase.rpc("submit_feedback", {
    p_token: payload.token,
    p_feedback_text: payload.feedback_text,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as string;
};

export const fetchRecommendations = async (
  period: ZodRecommendationPeriod,
): Promise<ZodAiRecommendation[]> => {
  const userId = await getCurrentUserId();
  const range = getPeriodRange(period);

  const { data, error } = await supabase
    .from("ai_recommendations")
    .select("*")
    .eq("user_id", userId)
    .eq("period_type", period)
    .gte("period_from", range.from)
    .lte("period_to", range.to)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ZodAiRecommendation[];
};

export const deleteRecommendation = async (recommendationId: string): Promise<void> => {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("ai_recommendations")
    .delete()
    .eq("id", recommendationId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
};

class InsufficientFeedbackError extends Error {
  code = "INSUFFICIENT_FEEDBACK" as const;

  constructor() {
    super("Недостаточно отзывов для рекомендаций");
    this.name = "InsufficientFeedbackError";
  }
}

export { InsufficientFeedbackError };

export const generateRecommendations = async (
  period: ZodRecommendationPeriod,
): Promise<ZodAiRecommendation> => {
  const response = await fetch("/api/recommendations/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ period }),
  });

  const payload = (await response.json()) as {
    code?: string;
    message?: string;
    data?: ZodAiRecommendation;
  };

  if (!response.ok) {
    if (payload.code === "INSUFFICIENT_FEEDBACK") {
      throw new InsufficientFeedbackError();
    }

    throw new Error(payload.message || "Ошибка генерации рекомендаций");
  }

  if (!payload.data) {
    throw new Error("Ответ сервера не содержит данных");
  }

  return payload.data;
};

