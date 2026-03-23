import { NextResponse } from "next/server";
import { createClient } from "@/src/utils/supabase/server";
import {
  recommendationRequestSchema,
  resolveRecommendationRange,
} from "@/src/server/recommendations";
import { getErrorMessage, mapSupabaseError } from "@/src/helpers/getErrorMessage";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = recommendationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректный запрос" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  }

  let resolved: ReturnType<typeof resolveRecommendationRange>;
  try {
    resolved = resolveRecommendationRange(parsed.data);
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "Некорректный диапазон") },
      { status: 400 },
    );
  }

  const { periodType, range } = resolved;
  const promptId = parsed.data.prompt_id ?? null;

  if (promptId) {
    const { data: prompts, error: promptError } = await supabase
      .from("recommendation_prompts")
      .select("id")
      .eq("id", promptId)
      .eq("user_id", user.id)
      .limit(1);

    if (promptError) {
      return NextResponse.json({ message: mapSupabaseError(promptError) }, { status: 500 });
    }

    if (!prompts || prompts.length === 0) {
      return NextResponse.json({ message: "Промпт не найден" }, { status: 404 });
    }
  }

  let existingQuery = supabase
    .from("recommendation_jobs")
    .select("*")
    .eq("user_id", user.id)
    .eq("period_from", range.from)
    .eq("period_to", range.to)
    .in("status", ["queued", "running"])
    .order("requested_at", { ascending: false })
    .limit(1);

  if (parsed.data.period) {
    existingQuery = existingQuery.eq("period_type", periodType);
  }

  if (promptId) {
    existingQuery = existingQuery.eq("prompt_id", promptId);
  } else {
    existingQuery = existingQuery.is("prompt_id", null);
  }

  const { data: existing, error: existingError } = await existingQuery;

  if (existingError) {
    return NextResponse.json({ message: mapSupabaseError(existingError) }, { status: 500 });
  }

  if (existing && existing.length > 0) {
    return NextResponse.json({ data: existing[0] });
  }

  const { data, error } = await supabase
    .from("recommendation_jobs")
    .insert({
      user_id: user.id,
      period_type: periodType,
      period_from: range.from,
      period_to: range.to,
      prompt_id: promptId,
      status: "queued",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  return NextResponse.json({ data });
}
