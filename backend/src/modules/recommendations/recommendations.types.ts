import type {
  AiRecommendation,
  RecommendationJob,
  RecommendationPrompt,
} from "@prisma/client";

export function toAiRecommendationResponse(row: AiRecommendation) {
  return {
    id: row.id,
    user_id: row.userId,
    period_type: row.periodType,
    period_from: row.periodFrom.toISOString().slice(0, 10),
    period_to: row.periodTo.toISOString().slice(0, 10),
    source_count: row.sourceCount,
    summary: row.summary,
    model_name: row.modelName,
    input_tokens: row.inputTokens,
    output_tokens: row.outputTokens,
    prompt_id: row.promptId,
    prompt_id_snapshot: row.promptIdSnapshot,
    prompt_name_snapshot: row.promptNameSnapshot,
    prompt_snapshot: row.promptSnapshot,
    created_at: row.createdAt.toISOString(),
  };
}

export function toJobResponse(job: RecommendationJob) {
  return {
    id: job.id,
    user_id: job.userId,
    period_type: job.periodType,
    period_from: job.periodFrom.toISOString().slice(0, 10),
    period_to: job.periodTo.toISOString().slice(0, 10),
    prompt_id: job.promptId,
    status: job.status,
    requested_at: job.requestedAt.toISOString(),
    started_at: job.startedAt?.toISOString() ?? null,
    finished_at: job.finishedAt?.toISOString() ?? null,
    result_id: job.resultId,
    error_code: job.errorCode,
    error_message: job.errorMessage,
    model_name: job.modelName,
    input_tokens: job.inputTokens,
    output_tokens: job.outputTokens,
    source_count: job.sourceCount,
    prompt_chars: job.promptChars,
    duration_ms: job.durationMs,
  };
}

export function toPromptResponse(row: RecommendationPrompt) {
  return {
    id: row.id,
    user_id: row.userId,
    name: row.name,
    content: row.content,
    is_default: row.isDefault,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}
