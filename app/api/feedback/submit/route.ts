import { NextResponse } from "next/server";
import { createClient } from "@/src/utils/supabase/server";
import { submitFeedbackSchema } from "@/src/schemas/feedback/feedbackSchema";
import { mapSupabaseError } from "@/src/helpers/getErrorMessage";

const toOptionalNumber = (value: number | null | undefined) =>
  value === null || value === undefined ? undefined : value;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = submitFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("submit_feedback", {
    p_token: parsed.data.token,
    p_feedback_text: parsed.data.feedback_text,
    p_score_result: toOptionalNumber(parsed.data.score_result),
    p_score_explanation: toOptionalNumber(parsed.data.score_explanation),
    p_score_comfort: toOptionalNumber(parsed.data.score_comfort),
    p_score_booking: toOptionalNumber(parsed.data.score_booking),
    p_score_recommendation: toOptionalNumber(parsed.data.score_recommendation),
  });

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  return NextResponse.json({ data });
}
