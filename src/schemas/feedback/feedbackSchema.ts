import { z } from "zod";

export const recommendationPeriodSchema = z.enum([
  "week",
  "month",
  "3m",
  "6m",
  "9m",
  "12m",
  "custom",
]);

export const feedbackTokenSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  token: z.string(),
  expires_at: z.string(),
  created_at: z.string(),
  used_at: z.string().nullable(),
  is_active: z.boolean(),
});

export const feedbackResponseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  feedback_text: z.string(),
  score_result: z.number().int().min(1).max(5).nullable(),
  score_explanation: z.number().int().min(1).max(5).nullable(),
  score_comfort: z.number().int().min(1).max(5).nullable(),
  score_booking: z.number().int().min(1).max(5).nullable(),
  score_recommendation: z.number().int().min(1).max(5).nullable(),
  created_at: z.string(),
  period_bucket: z.string(),
});

export const aiRecommendationSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  period_type: recommendationPeriodSchema,
  period_from: z.string(),
  period_to: z.string(),
  source_count: z.number().int().nonnegative(),
  summary: z.string(),
  model_name: z.string().nullable(),
  input_tokens: z.number().int().nullable(),
  output_tokens: z.number().int().nullable(),
  prompt_id: z.string().nullable().optional(),
  prompt_id_snapshot: z.string().nullable().optional(),
  prompt_name_snapshot: z.string().nullable().optional(),
  prompt_snapshot: z.string().nullable().optional(),
  created_at: z.string(),
});

export const aiRecommendationArraySchema = z.array(aiRecommendationSchema);
export const feedbackResponseArraySchema = z.array(feedbackResponseSchema);

export const recommendationJobStatusSchema = z.enum([
  "queued",
  "running",
  "succeeded",
  "failed",
]);

export const recommendationJobSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  period_type: recommendationPeriodSchema,
  period_from: z.string(),
  period_to: z.string(),
  prompt_id: z.string().nullable().optional(),
  status: recommendationJobStatusSchema,
  requested_at: z.string(),
  started_at: z.string().nullable(),
  finished_at: z.string().nullable(),
  result_id: z.string().nullable(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
  model_name: z.string().nullable(),
  input_tokens: z.number().int().nullable(),
  output_tokens: z.number().int().nullable(),
  source_count: z.number().int().nullable(),
  prompt_chars: z.number().int().nullable(),
  duration_ms: z.number().int().nullable(),
});

export const submitFeedbackSchema = z.object({
  token: z.string().min(1, "РўРѕРєРµРЅ РѕР±СЏР·Р°С‚РµР»РµРЅ"),
  feedback_text: z
    .string()
    .min(5, "РћС‚Р·С‹РІ СЃР»РёС€РєРѕРј РєРѕСЂРѕС‚РєРёР№")
    .max(1000, "РћС‚Р·С‹РІ СЃР»РёС€РєРѕРј РґР»РёРЅРЅС‹Р№"),
  score_result: z.number().int().min(1).max(5).nullable().optional(),
  score_explanation: z.number().int().min(1).max(5).nullable().optional(),
  score_comfort: z.number().int().min(1).max(5).nullable().optional(),
  score_booking: z.number().int().min(1).max(5).nullable().optional(),
  score_recommendation: z.number().int().min(1).max(5).nullable().optional(),
});

export const recommendationPromptSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  content: z.string(),
  is_default: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const recommendationPromptInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  content: z.string().trim().min(1).max(8000),
  is_default: z.boolean().optional(),
});

export const recommendationPromptArraySchema = z.array(
  recommendationPromptSchema,
);

export type ZodRecommendationPeriod = z.infer<typeof recommendationPeriodSchema>;
export type ZodFeedbackToken = z.infer<typeof feedbackTokenSchema>;
export type ZodFeedbackResponse = z.infer<typeof feedbackResponseSchema>;
export type ZodAiRecommendation = z.infer<typeof aiRecommendationSchema>;
export type ZodRecommendationJob = z.infer<typeof recommendationJobSchema>;
export type ZodSubmitFeedback = z.infer<typeof submitFeedbackSchema>;
export type ZodRecommendationPrompt = z.infer<typeof recommendationPromptSchema>;



