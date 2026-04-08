import {
  recommendationJobSchema,
  ZodAiRecommendation,
  ZodRecommendationJob,
  ZodSubmitFeedback,
} from "@/src/schemas/feedback/feedbackSchema";
import {
  nestErrorMessage,
  nestOwnerFetch,
  nestPublicV1Fetch,
} from "@/src/utils/api/nestOwnerApi";

export type FeedbackRatingsTrend = {
  key: string;
  label: string;
  avg: number | null;
  sampleSize: number;
};

export type FeedbackTokenValidationResult = {
  valid: boolean;
  appointment_id: string | null;
};

export type SubmitFeedbackResult = {
  feedback_id: string;
  discount_percent: number | null;
};

function toYmd(s: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    return s;
  }
  return d.toISOString().slice(0, 10);
}

export const createFeedbackToken = async (expiresIn = "14 days") => {
  const response = await nestOwnerFetch("feedback/token", {
    method: "POST",
    body: JSON.stringify({ expiresIn }),
  });
  const payload = (await response.json()) as {
    data?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
  if (!payload.data) {
    throw new Error("Ответ сервера не содержит данных");
  }
  return payload.data;
};

export const validateFeedbackToken = async (
  token: string,
): Promise<FeedbackTokenValidationResult> => {
  const params = new URLSearchParams({ token });
  const response = await nestPublicV1Fetch(`feedback/validate?${params.toString()}`, {
    method: "GET",
  });
  const payload = (await response.json()) as {
    data?: FeedbackTokenValidationResult;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
  if (!payload.data) {
    throw new Error("Ответ сервера не содержит данных");
  }
  return payload.data;
};

export const submitFeedback = async (
  payload: ZodSubmitFeedback,
): Promise<SubmitFeedbackResult> => {
  const response = await nestPublicV1Fetch("feedback/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const responsePayload = (await response.json()) as {
    data?: SubmitFeedbackResult;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(
      responsePayload.message || (await nestErrorMessage(response)),
    );
  }
  if (!responsePayload.data) {
    throw new Error("Ответ сервера не содержит данных");
  }
  return responsePayload.data;
};

export const fetchRecommendations = async (
  from: string,
  to: string,
): Promise<ZodAiRecommendation[]> => {
  const params = new URLSearchParams({
    from: toYmd(from),
    to: toYmd(to),
  });
  const response = await nestOwnerFetch(`recommendations?${params.toString()}`, {
    method: "GET",
  });
  const payload = (await response.json()) as {
    data?: ZodAiRecommendation[];
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
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
  from: string,
  to: string,
): Promise<FeedbackResponseItem[]> => {
  const params = new URLSearchParams({
    from: toYmd(from),
    to: toYmd(to),
  });
  const response = await nestOwnerFetch(`feedback/responses?${params.toString()}`, {
    method: "GET",
  });
  const payload = (await response.json()) as {
    data?: FeedbackResponseItem[];
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
  return payload.data ?? [];
};

export const deleteFeedbackResponse = async (feedbackId: string): Promise<void> => {
  const params = new URLSearchParams({ id: feedbackId });
  const response = await nestOwnerFetch(`feedback/responses?${params.toString()}`, {
    method: "DELETE",
  });
  const payload = (await response.json()) as {
    data?: boolean;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
};

export const deleteRecommendation = async (
  recommendationId: string,
): Promise<void> => {
  const params = new URLSearchParams({ id: recommendationId });
  const response = await nestOwnerFetch(`recommendations?${params.toString()}`, {
    method: "DELETE",
  });
  const payload = (await response.json()) as {
    data?: boolean;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
};

export const fetchFeedbackRatingsTrend = async (
  from: string,
  to: string,
): Promise<FeedbackRatingsTrend[]> => {
  const params = new URLSearchParams({
    from: toYmd(from),
    to: toYmd(to),
  });
  const response = await nestOwnerFetch(`feedback/ratings?${params.toString()}`, {
    method: "GET",
  });
  const payload = (await response.json()) as {
    data?: FeedbackRatingsTrend[];
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
  return payload.data ?? [];
};

const parseRecommendationJob = (payload: unknown): ZodRecommendationJob => {
  const parsed = recommendationJobSchema.safeParse(payload);
  if (!parsed.success) {
    console.error("Job validation failed:", parsed.error);
    throw new Error("Ответ сервера не содержит корректных данных");
  }
  return parsed.data;
};

class InsufficientFeedbackError extends Error {
  code = "INSUFFICIENT_FEEDBACK" as const;

  constructor() {
    super("Недостаточно отзывов для рекомендаций");
    this.name = "InsufficientFeedbackError";
  }
}

export { InsufficientFeedbackError };

type BaseRecommendationsPayload = {
  promptId?: string | null;
};

export type GenerateRecommendationsPayload = {
  from: string;
  to: string;
} & BaseRecommendationsPayload;

export const createRecommendationJob = async (
  payload: GenerateRecommendationsPayload,
): Promise<ZodRecommendationJob> => {
  const { promptId, ...rest } = payload;
  const response = await nestOwnerFetch("recommendations/jobs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: toYmd(rest.from),
      to: toYmd(rest.to),
      ...(promptId ? { prompt_id: promptId } : {}),
    }),
  });

  const responsePayload = (await response.json()) as {
    message?: string;
    data?: unknown;
  };

  if (!response.ok) {
    console.error("API Error Response:", responsePayload);
    throw new Error(
      responsePayload.message || (await nestErrorMessage(response)),
    );
  }

  if (!responsePayload.data) {
    console.error("No data in response:", responsePayload);
    throw new Error("Ответ сервера не содержит данных");
  }

  const job = parseRecommendationJob(responsePayload.data);

  if (!job.id) {
    console.error("Job has no ID:", job);
    throw new Error("Сервер вернул задачу без ID");
  }

  return job;
};

export const fetchRecommendationJob = async (
  jobId: string,
): Promise<ZodRecommendationJob> => {
  if (!jobId || jobId.trim() === "") {
    throw new Error("ID задачи не установлен");
  }

  const response = await nestOwnerFetch(`recommendations/jobs/${jobId}`, {
    method: "GET",
  });

  const responsePayload = (await response.json()) as {
    message?: string;
    data?: unknown;
  };

  if (!response.ok) {
    console.error("API Error Response:", responsePayload);
    throw new Error(
      responsePayload.message || (await nestErrorMessage(response)),
    );
  }

  if (!responsePayload.data) {
    console.error("No data in response:", responsePayload);
    throw new Error("Ответ сервера не содержит данных");
  }

  return parseRecommendationJob(responsePayload.data);
};

export const runRecommendationJob = async (
  jobId: string,
): Promise<ZodRecommendationJob> => {
  if (!jobId || jobId.trim() === "") {
    throw new Error("ID задачи не установлен");
  }

  const response = await nestOwnerFetch(`recommendations/jobs/${jobId}/run`, {
    method: "POST",
  });

  const responsePayload = (await response.json()) as {
    message?: string;
    data?: unknown;
  };

  if (!response.ok) {
    console.error("API Error Response:", responsePayload);
    throw new Error(
      responsePayload.message || (await nestErrorMessage(response)),
    );
  }

  if (!responsePayload.data) {
    console.error("No data in response:", responsePayload);
    throw new Error("Ответ сервера не содержит данных");
  }

  return parseRecommendationJob(responsePayload.data);
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitForRecommendationJob = async (
  jobId: string,
  options?: { timeoutMs?: number; intervalMs?: number },
): Promise<ZodRecommendationJob> => {
  if (!jobId || jobId.trim() === "") {
    throw new Error("ID задачи не установлен");
  }

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
      throw new Error(job.error_message || "Ошибка генерации рекомендаций");
    }
    await wait(intervalMs);
  }

  throw new Error("Превышено время ожидания генерации");
};

export const generateRecommendations = async (
  payload: GenerateRecommendationsPayload,
): Promise<ZodRecommendationJob> => createRecommendationJob(payload);
