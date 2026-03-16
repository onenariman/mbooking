import {
  recommendationJobSchema,
  ZodAiRecommendation,
  ZodRecommendationJob,
  ZodRecommendationPeriod,
  ZodSubmitFeedback,
} from "@/src/schemas/feedback/feedbackSchema";

export type FeedbackRatingsTrend = {
  key: string;
  label: string;
  avg: number | null;
  percent: number | null;
  delta: number | null;
  sampleSize: number;
  prevSampleSize: number;
};

export const createFeedbackToken = async (expiresIn = "14 days") => {
  const response = await fetch("/api/feedback/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn }),
  });
  const payload = (await response.json()) as { data?: string; message?: string };
  if (!response.ok) {
    throw new Error(payload.message || "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ С‚РѕРєРµРЅ");
  }
  if (!payload.data) {
    throw new Error("РћС‚РІРµС‚ СЃРµСЂРІРµСЂР° РЅРµ СЃРѕРґРµСЂР¶РёС‚ РґР°РЅРЅС‹С…");
  }
  return payload.data;
};

export const submitFeedback = async (payload: ZodSubmitFeedback) => {
  const response = await fetch("/api/feedback/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const responsePayload = (await response.json()) as {
    data?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(responsePayload.message || "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ РѕС‚Р·С‹РІ");
  }
  if (!responsePayload.data) {
    throw new Error("РћС‚РІРµС‚ СЃРµСЂРІРµСЂР° РЅРµ СЃРѕРґРµСЂР¶РёС‚ РґР°РЅРЅС‹С…");
  }
  return responsePayload.data;
};

export const fetchRecommendations = async (
  period: ZodRecommendationPeriod,
): Promise<ZodAiRecommendation[]> => {
  const params = new URLSearchParams({ period });
  const response = await fetch(`/api/recommendations?${params.toString()}`, {
    method: "GET",
  });
  const payload = (await response.json()) as {
    data?: ZodAiRecommendation[];
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЂРµРєРѕРјРµРЅРґР°С†РёРё");
  }
  return payload.data ?? [];
};

export const fetchRecommendationsByRange = async (
  from: string,
  to: string,
): Promise<ZodAiRecommendation[]> => {
  const params = new URLSearchParams({ from, to });
  const response = await fetch(`/api/recommendations?${params.toString()}`, {
    method: "GET",
  });
  const payload = (await response.json()) as {
    data?: ZodAiRecommendation[];
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЂРµРєРѕРјРµРЅРґР°С†РёРё");
  }
  return payload.data ?? [];
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
  const params = new URLSearchParams({ period });
  const response = await fetch(`/api/feedback/responses?${params.toString()}`, {
    method: "GET",
  });
  const payload = (await response.json()) as {
    data?: FeedbackResponseItem[];
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РѕС‚Р·С‹РІС‹");
  }
  return payload.data ?? [];
};

export const deleteRecommendation = async (
  recommendationId: string,
): Promise<void> => {
  const params = new URLSearchParams({ id: recommendationId });
  const response = await fetch(`/api/recommendations?${params.toString()}`, {
    method: "DELETE",
  });
  const payload = (await response.json()) as { data?: boolean; message?: string };
  if (!response.ok) {
    throw new Error(payload.message || "РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ СЂРµРєРѕРјРµРЅРґР°С†РёСЋ");
  }
};

export const fetchFeedbackRatingsTrend = async (
  period: ZodRecommendationPeriod,
): Promise<FeedbackRatingsTrend[]> => {
  const params = new URLSearchParams({ period });
  const response = await fetch(`/api/feedback/ratings?${params.toString()}`, {
    method: "GET",
  });
  const payload = (await response.json()) as {
    data?: FeedbackRatingsTrend[];
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РѕС†РµРЅРєРё");
  }
  return payload.data ?? [];
};

const parseRecommendationJob = (payload: unknown): ZodRecommendationJob => {
  const parsed = recommendationJobSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("РћС‚РІРµС‚ СЃРµСЂРІРµСЂР° РЅРµ СЃРѕРґРµСЂР¶РёС‚ РєРѕСЂСЂРµРєС‚РЅС‹С… РґР°РЅРЅС‹С…");
  }
  return parsed.data;
};

class InsufficientFeedbackError extends Error {
  code = "INSUFFICIENT_FEEDBACK" as const;

  constructor() {
    super("РќРµРґРѕСЃС‚Р°С‚РѕС‡РЅРѕ РѕС‚Р·С‹РІРѕРІ РґР»СЏ СЂРµРєРѕРјРµРЅРґР°С†РёР№");
    this.name = "InsufficientFeedbackError";
  }
}

export { InsufficientFeedbackError };

export type GenerateRecommendationsPayload =
  | { period: ZodRecommendationPeriod }
  | { from: string; to: string };

export const createRecommendationJob = async (
  payload: GenerateRecommendationsPayload,
): Promise<ZodRecommendationJob> => {
  const response = await fetch("/api/recommendations/jobs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responsePayload = (await response.json()) as {
    message?: string;
    data?: ZodRecommendationJob;
  };

  if (!response.ok) {
    throw new Error(responsePayload.message || "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ Р·Р°РґР°С‡Сѓ");
  }

  if (!responsePayload.data) {
    throw new Error("РћС‚РІРµС‚ СЃРµСЂРІРµСЂР° РЅРµ СЃРѕРґРµСЂР¶РёС‚ РґР°РЅРЅС‹С…");
  }

  return parseRecommendationJob(responsePayload.data);
};

export const fetchRecommendationJob = async (
  jobId: string,
): Promise<ZodRecommendationJob> => {
  const response = await fetch(`/api/recommendations/jobs/${jobId}`, {
    method: "GET",
  });

  const responsePayload = (await response.json()) as {
    message?: string;
    data?: ZodRecommendationJob;
  };

  if (!response.ok) {
    throw new Error(responsePayload.message || "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ Р·Р°РґР°С‡Сѓ");
  }

  if (!responsePayload.data) {
    throw new Error("РћС‚РІРµС‚ СЃРµСЂРІРµСЂР° РЅРµ СЃРѕРґРµСЂР¶РёС‚ РґР°РЅРЅС‹С…");
  }

  return parseRecommendationJob(responsePayload.data);
};

export const runRecommendationJob = async (
  jobId: string,
): Promise<ZodRecommendationJob> => {
  const response = await fetch(`/api/recommendations/jobs/${jobId}/run`, {
    method: "POST",
  });

  const responsePayload = (await response.json()) as {
    message?: string;
    data?: ZodRecommendationJob;
  };

  if (!response.ok) {
    throw new Error(responsePayload.message || "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РїСѓСЃС‚РёС‚СЊ Р·Р°РґР°С‡Сѓ");
  }

  if (!responsePayload.data) {
    throw new Error("РћС‚РІРµС‚ СЃРµСЂРІРµСЂР° РЅРµ СЃРѕРґРµСЂР¶РёС‚ РґР°РЅРЅС‹С…");
  }

  return parseRecommendationJob(responsePayload.data);
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitForRecommendationJob = async (
  jobId: string,
  options?: { timeoutMs?: number; intervalMs?: number },
): Promise<ZodRecommendationJob> => {
  const timeoutMs = options?.timeoutMs ?? 240_000;
  const intervalMs = options?.intervalMs ?? 2_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const job = await fetchRecommendationJob(jobId);
    if (job.status === "succeeded") {
      return job;
    }
    if (job.status === "failed") {
      if (job.error_code === "INSUFFICIENT_FEEDBACK") {
        throw new InsufficientFeedbackError();
      }
      throw new Error(job.error_message || "РћС€РёР±РєР° РіРµРЅРµСЂР°С†РёРё СЂРµРєРѕРјРµРЅРґР°С†РёР№");
    }
    await wait(intervalMs);
  }

  throw new Error("РџСЂРµРІС‹С€РµРЅРѕ РІСЂРµРјСЏ РѕР¶РёРґР°РЅРёСЏ РіРµРЅРµСЂР°С†РёРё");
};
export const generateRecommendations = async (
  payload: GenerateRecommendationsPayload,
): Promise<ZodRecommendationJob> => createRecommendationJob(payload);




