import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFeedbackToken,
  deleteRecommendation,
  fetchFeedbackRatingsTrend,
  fetchFeedbackResponses,
  fetchRecommendationsByRange,
  fetchRecommendations,
  GenerateRecommendationsPayload,
  generateRecommendations,
  submitFeedback,
} from "@/src/api/feedback.api";
import {
  aiRecommendationArraySchema,
  feedbackResponseArraySchema,
  submitFeedbackSchema,
  ZodAiRecommendation,
  ZodFeedbackResponse,
  ZodRecommendationPeriod,
  ZodSubmitFeedback,
} from "@/src/schemas/feedback/feedbackSchema";

const RECOMMENDATIONS_QUERY_KEY = ["ai-recommendations"] as const;
const RATINGS_QUERY_KEY = ["feedback-ratings"] as const;
const FEEDBACK_QUERY_KEY = ["feedback-responses"] as const;
const RANGE_RECOMMENDATIONS_QUERY_KEY = ["ai-recommendations-range"] as const;

export const useRecommendations = (period: ZodRecommendationPeriod) => {
  return useQuery({
    queryKey: [...RECOMMENDATIONS_QUERY_KEY, period],
    queryFn: async (): Promise<ZodAiRecommendation[]> => {
      const rawData = await fetchRecommendations(period);
      const parsed = aiRecommendationArraySchema.safeParse(rawData);
      if (!parsed.success) {
        console.error("Zod validation failed:", parsed.error.issues);
        throw new Error("Данные рекомендаций не прошли валидацию");
      }
      return parsed.data;
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });
};

export const useFeedbackRatingsTrend = (period: ZodRecommendationPeriod) => {
  return useQuery({
    queryKey: [...RATINGS_QUERY_KEY, period],
    queryFn: () => fetchFeedbackRatingsTrend(period),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });
};

export const useFeedbackResponses = (period: ZodRecommendationPeriod) => {
  return useQuery({
    queryKey: [...FEEDBACK_QUERY_KEY, period],
    queryFn: async (): Promise<ZodFeedbackResponse[]> => {
      const rawData = await fetchFeedbackResponses(period);
      const parsed = feedbackResponseArraySchema.safeParse(rawData);
      if (!parsed.success) {
        console.error("Zod validation failed:", parsed.error.issues);
        throw new Error("Данные отзывов не прошли валидацию");
      }
      return parsed.data;
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });
};

export const useRecommendationsByRange = (from: string | null, to: string | null) => {
  return useQuery({
    queryKey: [...RANGE_RECOMMENDATIONS_QUERY_KEY, from, to],
    queryFn: async (): Promise<ZodAiRecommendation[]> => {
      if (!from || !to) {
        return [];
      }
      const rawData = await fetchRecommendationsByRange(from, to);
      const parsed = aiRecommendationArraySchema.safeParse(rawData);
      if (!parsed.success) {
        console.error("Zod validation failed:", parsed.error.issues);
        throw new Error("Данные рекомендаций не прошли валидацию");
      }
      return parsed.data;
    },
    enabled: Boolean(from && to),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });
};

export const useCreateFeedbackToken = () => {
  return useMutation({
    mutationFn: (expiresIn?: string) => createFeedbackToken(expiresIn),
  });
};

export const useSubmitFeedback = () => {
  return useMutation({
    mutationFn: async (payload: ZodSubmitFeedback) => {
      const parsed = submitFeedbackSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error(parsed.error.issues.map((issue) => issue.message).join(", "));
      }
      return submitFeedback(parsed.data);
    },
  });
};

export const useGenerateRecommendations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GenerateRecommendationsPayload) =>
      generateRecommendations(payload),
    onSuccess: (_data, payload) => {
      if ("period" in payload) {
        queryClient.invalidateQueries({
          queryKey: [...RECOMMENDATIONS_QUERY_KEY, payload.period],
        });
        return;
      }
      queryClient.invalidateQueries({
        queryKey: RANGE_RECOMMENDATIONS_QUERY_KEY,
      });
    },
  });
};

export const useDeleteRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recommendationId: string) => deleteRecommendation(recommendationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: RECOMMENDATIONS_QUERY_KEY,
      });
    },
  });
};
