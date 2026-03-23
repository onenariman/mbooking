import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFeedbackToken,
  deleteFeedbackResponse,
  deleteRecommendation,
  fetchFeedbackRatingsTrend,
  fetchFeedbackResponses,
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
  ZodSubmitFeedback,
} from "@/src/schemas/feedback/feedbackSchema";
import { QUERY_OPTIONS } from "@/src/lib/queryConfig";

const RECOMMENDATIONS_QUERY_KEY = ["ai-recommendations"] as const;
const RATINGS_QUERY_KEY = ["feedback-ratings"] as const;
const FEEDBACK_QUERY_KEY = ["feedback-responses"] as const;

export const useRecommendations = (from: string | null, to: string | null) => {
  return useQuery({
    queryKey: [...RECOMMENDATIONS_QUERY_KEY, from, to],
    queryFn: async (): Promise<ZodAiRecommendation[]> => {
      if (!from || !to) {
        return [];
      }

      const rawData = await fetchRecommendations(from, to);
      const parsed = aiRecommendationArraySchema.safeParse(rawData);
      if (!parsed.success) {
        console.error("Zod validation failed:", parsed.error.issues);
        throw new Error("Данные рекомендаций не прошли валидацию");
      }
      return parsed.data;
    },
    enabled: Boolean(from && to),
    ...QUERY_OPTIONS.recommendations,
  });
};

export const useFeedbackRatingsTrend = (from: string | null, to: string | null) => {
  return useQuery({
    queryKey: [...RATINGS_QUERY_KEY, from, to],
    queryFn: () => {
      if (!from || !to) {
        return [];
      }
      return fetchFeedbackRatingsTrend(from, to);
    },
    enabled: Boolean(from && to),
    ...QUERY_OPTIONS.feedback,
  });
};

export const useFeedbackResponses = (from: string | null, to: string | null) => {
  return useQuery({
    queryKey: [...FEEDBACK_QUERY_KEY, from, to],
    queryFn: async (): Promise<ZodFeedbackResponse[]> => {
      if (!from || !to) {
        return [];
      }

      const rawData = await fetchFeedbackResponses(from, to);
      const parsed = feedbackResponseArraySchema.safeParse(rawData);
      if (!parsed.success) {
        console.error("Zod validation failed:", parsed.error.issues);
        throw new Error("Данные отзывов не прошли валидацию");
      }
      return parsed.data;
    },
    enabled: Boolean(from && to),
    ...QUERY_OPTIONS.feedback,
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
  return useMutation({
    mutationFn: (payload: GenerateRecommendationsPayload) =>
      generateRecommendations(payload),
  });
};

export const useDeleteRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recommendationId: string) => deleteRecommendation(recommendationId),
    onMutate: async (recommendationId: string) => {
      await queryClient.cancelQueries({
        queryKey: RECOMMENDATIONS_QUERY_KEY,
      });

      const previousRecommendations = queryClient.getQueriesData<ZodAiRecommendation[]>({
        queryKey: RECOMMENDATIONS_QUERY_KEY,
      });

      queryClient.setQueriesData<ZodAiRecommendation[]>(
        { queryKey: RECOMMENDATIONS_QUERY_KEY },
        (old) => old?.filter((item) => item.id !== recommendationId),
      );

      return { previousRecommendations };
    },
    onError: (_error, _recommendationId, context) => {
      context?.previousRecommendations.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: RECOMMENDATIONS_QUERY_KEY,
      });
    },
  });
};

export const useDeleteFeedbackResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feedbackId: string) => deleteFeedbackResponse(feedbackId),
    onMutate: async (feedbackId: string) => {
      await queryClient.cancelQueries({
        queryKey: FEEDBACK_QUERY_KEY,
      });

      const previousFeedback = queryClient.getQueriesData<ZodFeedbackResponse[]>({
        queryKey: FEEDBACK_QUERY_KEY,
      });

      queryClient.setQueriesData<ZodFeedbackResponse[]>(
        { queryKey: FEEDBACK_QUERY_KEY },
        (old) => old?.filter((item) => item.id !== feedbackId),
      );

      return { previousFeedback };
    },
    onError: (_error, _feedbackId, context) => {
      context?.previousFeedback.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: FEEDBACK_QUERY_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: RATINGS_QUERY_KEY,
      });
    },
  });
};
