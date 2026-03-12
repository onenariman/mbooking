import { differenceInCalendarDays, subDays, subMonths } from "date-fns";
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

export type FeedbackRatingsTrend = {
  key: string;
  label: string;
  avg: number | null;
  percent: number | null;
  delta: number | null;
  sampleSize: number;
  prevSampleSize: number;
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

const getPreviousRange = (range: PeriodRange): PeriodRange => {
  const fromDate = new Date(`${range.from}T00:00:00.000Z`);
  const toDate = new Date(`${range.to}T00:00:00.000Z`);
  const days = Math.max(1, differenceInCalendarDays(toDate, fromDate) + 1);
  const prevTo = subDays(fromDate, 1);
  const prevFrom = subDays(prevTo, days - 1);

  return {
    from: toDateOnlyIso(prevFrom),
    to: toDateOnlyIso(prevTo),
  };
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
    p_score_result: payload.score_result,
    p_score_explanation: payload.score_explanation,
    p_score_comfort: payload.score_comfort,
    p_score_booking: payload.score_booking,
    p_score_recommendation: payload.score_recommendation,
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

export const fetchRecommendationsByRange = async (
  from: string,
  to: string,
): Promise<ZodAiRecommendation[]> => {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("ai_recommendations")
    .select("*")
    .eq("user_id", userId)
    .eq("period_type", "custom")
    .eq("period_from", from)
    .eq("period_to", to)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ZodAiRecommendation[];
};

export type FeedbackResponseItem = {
  id: string;
  feedback_text: string;
  created_at: string;
  score_result: number | null;
  score_explanation: number | null;
  score_comfort: number | null;
  score_booking: number | null;
  score_recommendation: number | null;
};

export const fetchFeedbackResponses = async (
  period: ZodRecommendationPeriod,
): Promise<FeedbackResponseItem[]> => {
  const userId = await getCurrentUserId();
  const range = getPeriodRange(period);

  const { data, error } = await supabase
    .from("feedback_responses")
    .select(
      "id, user_id, feedback_text, created_at, period_bucket, score_result, score_explanation, score_comfort, score_booking, score_recommendation",
    )
    .eq("user_id", userId)
    .gte("created_at", `${range.from}T00:00:00.000Z`)
    .lte("created_at", `${range.to}T23:59:59.999Z`)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as FeedbackResponseItem[];
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


type RatingsRow = {
  score_result: number | null;
  score_explanation: number | null;
  score_comfort: number | null;
  score_booking: number | null;
  score_recommendation: number | null;
};

const fetchScoresForRange = async (
  userId: string,
  range: PeriodRange,
): Promise<RatingsRow[]> => {
  const { data, error } = await supabase
    .from("feedback_responses")
    .select(
      "score_result, score_explanation, score_comfort, score_booking, score_recommendation",
    )
    .eq("user_id", userId)
    .gte("created_at", `${range.from}T00:00:00.000Z`)
    .lte("created_at", `${range.to}T23:59:59.999Z`);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RatingsRow[];
};

const calcAverage = (rows: RatingsRow[], key: keyof RatingsRow) => {
  const values = rows
    .map((row) => row[key])
    .filter((value): value is number => Number.isFinite(value));

  if (!values.length) {
    return { avg: null, count: 0 };
  }

  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  const rounded = Math.round(avg * 10) / 10;
  return { avg: rounded, count: values.length };
};

export const fetchFeedbackRatingsTrend = async (
  period: ZodRecommendationPeriod,
): Promise<FeedbackRatingsTrend[]> => {
  const userId = await getCurrentUserId();
  const range = getPeriodRange(period);
  const prevRange = getPreviousRange(range);

  const [currentRows, prevRows] = await Promise.all([
    fetchScoresForRange(userId, range),
    fetchScoresForRange(userId, prevRange),
  ]);

  const keys = [
    "score_result",
    "score_explanation",
    "score_comfort",
    "score_booking",
    "score_recommendation",
  ] as const;

  const labels: Record<(typeof keys)[number], string> = {
    score_result: "Результат процедуры",
    score_explanation: "Объяснения мастера",
    score_comfort: "Комфорт процедуры",
    score_booking: "Удобство записи",
    score_recommendation: "Готовность рекомендовать",
  };

  return keys.map((key) => {
    const current = calcAverage(currentRows, key);
    const previous = calcAverage(prevRows, key);

    const delta =
      current.avg !== null && previous.avg !== null
        ? Math.round((current.avg - previous.avg) * 10) / 10
        : null;

    const percent =
      current.avg !== null ? Math.round((current.avg / 5) * 100) : null;

    return {
      key,
      label: labels[key],
      avg: current.avg,
      percent,
      delta,
      sampleSize: current.count,
      prevSampleSize: previous.count,
    };
  });
};
class InsufficientFeedbackError extends Error {
  code = "INSUFFICIENT_FEEDBACK" as const;

  constructor() {
    super("Недостаточно отзывов для рекомендаций");
    this.name = "InsufficientFeedbackError";
  }
}

export { InsufficientFeedbackError };

export type GenerateRecommendationsPayload =
  | { period: ZodRecommendationPeriod }
  | { from: string; to: string };

export const generateRecommendations = async (
  payload: GenerateRecommendationsPayload,
): Promise<ZodAiRecommendation> => {
  const response = await fetch("/api/recommendations/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responsePayload = (await response.json()) as {
    code?: string;
    message?: string;
    data?: ZodAiRecommendation;
  };

  if (!response.ok) {
    if (responsePayload.code === "INSUFFICIENT_FEEDBACK") {
      throw new InsufficientFeedbackError();
    }

    throw new Error(responsePayload.message || "Ошибка генерации рекомендаций");
  }

  if (!responsePayload.data) {
    throw new Error("Ответ сервера не содержит данных");
  }

  return responsePayload.data;
};









