import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFeedbackToken,
  fetchRecommendations,
  generateRecommendations,
  submitFeedback,
} from "@/src/api/feedback.api";
import {
  aiRecommendationArraySchema,
  submitFeedbackSchema,
  ZodAiRecommendation,
  ZodRecommendationPeriod,
} from "@/src/schemas/feedback/feedbackSchema";

const RECOMMENDATIONS_QUERY_KEY = ["ai-recommendations"] as const;

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

export const useCreateFeedbackToken = () => {
  return useMutation({
    mutationFn: (expiresIn?: string) => createFeedbackToken(expiresIn),
  });
};

export const useSubmitFeedback = () => {
  return useMutation({
    mutationFn: async (payload: { token: string; feedback_text: string }) => {
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
    mutationFn: (period: ZodRecommendationPeriod) => generateRecommendations(period),
    onSuccess: (_data, period) => {
      queryClient.invalidateQueries({
        queryKey: [...RECOMMENDATIONS_QUERY_KEY, period],
      });
    },
  });
};
