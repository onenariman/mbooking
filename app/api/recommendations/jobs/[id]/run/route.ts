import { NextResponse } from "next/server";
import { createClient } from "@/src/utils/supabase/server";
import {
  buildPrompt,
  buildPromptFromTemplate,
  MIN_FEEDBACK_COUNT,
  normalizeSummary,
  runLlm,
} from "@/src/server/recommendations";
import { mapLlmError, mapSupabaseError } from "@/src/helpers/getErrorMessage";

type FeedbackRow = {
  feedback_text: string | null;
  score_result: number | null;
  score_explanation: number | null;
  score_comfort: number | null;
  score_booking: number | null;
  score_recommendation: number | null;
};

type FeedbackItem = {
  text: string;
  scores: {
    score_result: number | null;
    score_explanation: number | null;
    score_comfort: number | null;
    score_booking: number | null;
    score_recommendation: number | null;
  };
};

const toStartIso = (date: string) => `${date}T00:00:00.000Z`;
const toEndIso = (date: string) => `${date}T23:59:59.999Z`;

const getHorizonLabel = (periodType: string, from: string, to: string) => {
  if (periodType === "week") return "7 дней";
  if (periodType === "month") return "30 дней";
  if (periodType !== "custom") {
    return "30 дней (из долгого периода, с фокусом на ближайший месяц)";
  }

  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T00:00:00.000Z`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return "период";
  }
  const days = Math.max(
    1,
    Math.floor((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1,
  );
  return `${days} дней`;
};

const isMeaningfulFeedback = (item: FeedbackItem) => {
  const hasText = item.text.trim().length > 0;
  const hasScore = Object.values(item.scores).some(
    (value) => typeof value === "number",
  );
  return hasText || hasScore;
};

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: jobId } = await params;
  if (!jobId) {
    return NextResponse.json({ message: "Не задан id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabase
    .from("recommendation_jobs")
    .update({ status: "running", started_at: startedAt })
    .eq("id", jobId)
    .eq("user_id", user.id)
    .eq("status", "queued")
    .select("*")
    .limit(1);

  if (claimError) {
    return NextResponse.json({ message: mapSupabaseError(claimError) }, { status: 500 });
  }

  const job = claimed?.[0];
  if (!job) {
    const { data, error } = await supabase
      .from("recommendation_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .limit(1);

    if (error) {
      return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ message: "Задача не найдена" }, { status: 404 });
    }

    return NextResponse.json({ data: data[0] });
  }

  const updateJob = async (patch: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from("recommendation_jobs")
      .update(patch)
      .eq("id", jobId)
      .eq("user_id", user.id)
      .select("*")
      .limit(1);

    if (error) {
      return { error, data: null as typeof data | null };
    }

    return { error: null, data: data?.[0] ?? null };
  };

  const jobStart = Date.now();
  const periodType = job.period_type as string;
  const periodFrom = job.period_from as string;
  const periodTo = job.period_to as string;
  const promptId = job.prompt_id as string | null | undefined;

  let promptTemplate: string | null = null;
  let promptNameSnapshot = "Системный";
  if (promptId) {
    const { data: prompts, error: promptError } = await supabase
      .from("recommendation_prompts")
      .select("id, name, content")
      .eq("id", promptId)
      .eq("user_id", user.id)
      .limit(1);

    if (promptError) {
      const { data: failedJob, error } = await updateJob({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_code: "DB_ERROR",
        error_message: mapSupabaseError(promptError),
        duration_ms: Date.now() - jobStart,
      });

      if (error) {
        return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
      }

      return NextResponse.json({ data: failedJob });
    }

    if (!prompts || prompts.length === 0) {
      const { data: failedJob, error } = await updateJob({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_code: "PROMPT_NOT_FOUND",
        error_message: "Промпт не найден",
        duration_ms: Date.now() - jobStart,
      });

      if (error) {
        return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
      }

      return NextResponse.json({ data: failedJob });
    }

    promptNameSnapshot = prompts[0]?.name ?? "Пользовательский промпт";
    promptTemplate = prompts[0]?.content ?? null;
  }

  const { data: feedbackRows, error: feedbackError } = await supabase
    .from("feedback_responses")
    .select(
      "feedback_text, score_result, score_explanation, score_comfort, score_booking, score_recommendation",
    )
    .eq("user_id", user.id)
    .gte("created_at", toStartIso(periodFrom))
    .lte("created_at", toEndIso(periodTo))
    .order("created_at", { ascending: false });

  if (feedbackError) {
    const { data: failedJob, error } = await updateJob({
      status: "failed",
      finished_at: new Date().toISOString(),
      error_code: "DB_ERROR",
      error_message: mapSupabaseError(feedbackError),
      duration_ms: Date.now() - jobStart,
    });

    if (error) {
      return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
    }

    return NextResponse.json({ data: failedJob });
  }

  const feedbackItems: FeedbackItem[] = (feedbackRows ?? []).map((row) => {
    const item = row as FeedbackRow;
    return {
      text: item.feedback_text ?? "",
      scores: {
        score_result: item.score_result,
        score_explanation: item.score_explanation,
        score_comfort: item.score_comfort,
        score_booking: item.score_booking,
        score_recommendation: item.score_recommendation,
      },
    };
  });

  const meaningfulFeedback = feedbackItems.filter(isMeaningfulFeedback);
  if (meaningfulFeedback.length < MIN_FEEDBACK_COUNT) {
    const { data: failedJob, error } = await updateJob({
      status: "failed",
      finished_at: new Date().toISOString(),
      error_code: "INSUFFICIENT_FEEDBACK",
      error_message: "Недостаточно отзывов для рекомендаций",
      source_count: meaningfulFeedback.length,
      duration_ms: Date.now() - jobStart,
    });

    if (error) {
      return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
    }

    return NextResponse.json({ data: failedJob });
  }

  const horizonLabel = getHorizonLabel(periodType, periodFrom, periodTo);
  const promptPayload = {
    periodType,
    from: periodFrom,
    to: periodTo,
    horizonLabel,
    feedback: meaningfulFeedback,
  };
  const prompt = promptTemplate
    ? buildPromptFromTemplate(promptPayload, promptTemplate)
    : buildPrompt(promptPayload);

  const promptChars = prompt.length;
  let llmResult;
  try {
    llmResult = await runLlm(prompt);
  } catch (error) {
    const { data: failedJob, error: updateError } = await updateJob({
      status: "failed",
      finished_at: new Date().toISOString(),
      error_code: "LLM_ERROR",
      error_message: mapLlmError(error),
      source_count: meaningfulFeedback.length,
      prompt_chars: promptChars,
      duration_ms: Date.now() - jobStart,
    });

    if (updateError) {
      return NextResponse.json({ message: mapSupabaseError(updateError) }, { status: 500 });
    }

    return NextResponse.json({ data: failedJob });
  }

  const summary = normalizeSummary(llmResult.responseText);

  const { data: recommendation, error: recommendationError } = await supabase
    .from("ai_recommendations")
    .insert({
      user_id: user.id,
      period_type: periodType,
      period_from: periodFrom,
      period_to: periodTo,
      prompt_id: promptId ?? null,
      prompt_id_snapshot: promptId ?? null,
      prompt_name_snapshot: promptNameSnapshot,
      prompt_snapshot: promptTemplate ?? null,
      source_count: meaningfulFeedback.length,
      summary,
      model_name: llmResult.modelName,
      input_tokens: llmResult.inputTokens,
      output_tokens: llmResult.outputTokens,
    })
    .select("*")
    .single();

  if (recommendationError || !recommendation) {
    const { data: failedJob, error } = await updateJob({
      status: "failed",
      finished_at: new Date().toISOString(),
      error_code: "DB_ERROR",
      error_message: mapSupabaseError(recommendationError),
      source_count: meaningfulFeedback.length,
      prompt_chars: promptChars,
      duration_ms: Date.now() - jobStart,
    });

    if (error) {
      return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
    }

    return NextResponse.json({ data: failedJob });
  }

  const { data: finishedJob, error: updateError } = await updateJob({
    status: "succeeded",
    finished_at: new Date().toISOString(),
    result_id: recommendation.id,
    model_name: llmResult.modelName,
    input_tokens: llmResult.inputTokens,
    output_tokens: llmResult.outputTokens,
    source_count: meaningfulFeedback.length,
    prompt_chars: promptChars,
    duration_ms: Date.now() - jobStart,
  });

  if (updateError) {
    return NextResponse.json({ message: mapSupabaseError(updateError) }, { status: 500 });
  }

  return NextResponse.json({ data: finishedJob });
}
