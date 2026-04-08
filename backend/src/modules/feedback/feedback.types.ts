import type { FeedbackResponse } from "@prisma/client";

export type FeedbackResponseApi = {
  id: string;
  user_id: string;
  feedback_text: string;
  score_result: number | null;
  score_explanation: number | null;
  score_comfort: number | null;
  score_booking: number | null;
  score_recommendation: number | null;
  created_at: string;
  period_bucket: string;
};

export function toFeedbackResponseApi(row: FeedbackResponse): FeedbackResponseApi {
  return {
    id: row.id,
    user_id: row.userId,
    feedback_text: row.feedbackText,
    score_result: row.scoreResult,
    score_explanation: row.scoreExplanation,
    score_comfort: row.scoreComfort,
    score_booking: row.scoreBooking,
    score_recommendation: row.scoreRecommendation,
    created_at: row.createdAt.toISOString(),
    period_bucket: row.periodBucket.toISOString().slice(0, 10),
  };
}

export type FeedbackRatingTrendApi = {
  key: string;
  label: string;
  avg: number | null;
  sampleSize: number;
};
