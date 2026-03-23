import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRecommendationPrompt,
  deleteRecommendationPrompt,
  fetchRecommendationPrompts,
  updateRecommendationPrompt,
  type RecommendationPromptInput,
} from "@/src/api/recommendationPrompts.api";
import type { ZodRecommendationPrompt } from "@/src/schemas/feedback/feedbackSchema";
import { QUERY_OPTIONS } from "@/src/lib/queryConfig";

const PROMPTS_QUERY_KEY = ["recommendation-prompts"] as const;

export const useRecommendationPrompts = () =>
  useQuery({
    queryKey: PROMPTS_QUERY_KEY,
    queryFn: fetchRecommendationPrompts,
    ...QUERY_OPTIONS.reference,
  });

export const useCreateRecommendationPrompt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecommendationPromptInput) =>
      createRecommendationPrompt(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROMPTS_QUERY_KEY });
    },
  });
};

export const useUpdateRecommendationPrompt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<RecommendationPromptInput> }) =>
      updateRecommendationPrompt(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROMPTS_QUERY_KEY });
    },
  });
};

export const useDeleteRecommendationPrompt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecommendationPrompt(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: PROMPTS_QUERY_KEY });

      const previousPrompts =
        queryClient.getQueryData<ZodRecommendationPrompt[]>(PROMPTS_QUERY_KEY);

      queryClient.setQueryData<ZodRecommendationPrompt[]>(PROMPTS_QUERY_KEY, (old) =>
        old?.filter((prompt) => prompt.id !== id),
      );

      return { previousPrompts };
    },
    onError: (_error, _id, context) => {
      if (context?.previousPrompts) {
        queryClient.setQueryData(PROMPTS_QUERY_KEY, context.previousPrompts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROMPTS_QUERY_KEY });
    },
  });
};
