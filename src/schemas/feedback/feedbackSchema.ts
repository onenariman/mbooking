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
  created_at: z.string(),
});

export const aiRecommendationArraySchema = z.array(aiRecommendationSchema);
export const feedbackResponseArraySchema = z.array(feedbackResponseSchema);

export const submitFeedbackSchema = z.object({
  token: z.string().min(1, "Токен обязателен"),
  feedback_text: z
    .string()
    .min(5, "Отзыв слишком короткий")
    .max(3000, "Отзыв слишком длинный"),
});

export type ZodRecommendationPeriod = z.infer<typeof recommendationPeriodSchema>;
export type ZodFeedbackToken = z.infer<typeof feedbackTokenSchema>;
export type ZodFeedbackResponse = z.infer<typeof feedbackResponseSchema>;
export type ZodAiRecommendation = z.infer<typeof aiRecommendationSchema>;
export type ZodSubmitFeedback = z.infer<typeof submitFeedbackSchema>;
