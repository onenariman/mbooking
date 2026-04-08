import {
  recommendationPromptArraySchema,
  recommendationPromptInputSchema,
  recommendationPromptSchema,
  ZodRecommendationPrompt,
} from "@/src/schemas/feedback/feedbackSchema";
import { nestErrorMessage, nestOwnerFetch } from "@/src/utils/api/nestOwnerApi";

export type RecommendationPromptInput = {
  name: string;
  content: string;
  is_default?: boolean;
};

export const fetchRecommendationPrompts = async (): Promise<
  ZodRecommendationPrompt[]
> => {
  const response = await nestOwnerFetch("recommendations/prompts", {
    method: "GET",
  });
  const payload = (await response.json()) as {
    data?: ZodRecommendationPrompt[];
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
  const parsed = recommendationPromptArraySchema.safeParse(payload.data ?? []);
  if (!parsed.success) {
    throw new Error("Данные промтов не прошли валидацию");
  }
  return parsed.data;
};

export const createRecommendationPrompt = async (
  input: RecommendationPromptInput,
): Promise<ZodRecommendationPrompt> => {
  const parsedInput = recommendationPromptInputSchema.safeParse(input);
  if (!parsedInput.success) {
    throw new Error(
      parsedInput.error.issues.map((issue) => issue.message).join(", "),
    );
  }

  const response = await nestOwnerFetch("recommendations/prompts", {
    method: "POST",
    body: JSON.stringify(parsedInput.data),
  });
  const payload = (await response.json()) as {
    data?: ZodRecommendationPrompt;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
  if (!payload.data) {
    throw new Error("Ответ сервера не содержит данных");
  }

  const parsed = recommendationPromptSchema.safeParse(payload.data);
  if (!parsed.success) {
    throw new Error("Ответ сервера не прошёл валидацию");
  }
  return parsed.data;
};

export const updateRecommendationPrompt = async (
  id: string,
  input: Partial<RecommendationPromptInput>,
): Promise<ZodRecommendationPrompt> => {
  const response = await nestOwnerFetch(`recommendations/prompts?id=${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as {
    data?: ZodRecommendationPrompt;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
  if (!payload.data) {
    throw new Error("Ответ сервера не содержит данных");
  }

  const parsed = recommendationPromptSchema.safeParse(payload.data);
  if (!parsed.success) {
    throw new Error("Ответ сервера не прошёл валидацию");
  }
  return parsed.data;
};

export const deleteRecommendationPrompt = async (id: string): Promise<void> => {
  const response = await nestOwnerFetch(`recommendations/prompts?id=${id}`, {
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
