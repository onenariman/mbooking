import { NextResponse } from "next/server";
import { getErrorMessage, mapSupabaseError } from "@/src/helpers/getErrorMessage";
import { submitFeedbackSchema } from "@/src/schemas/feedback/feedbackSchema";
import { supabaseAdmin } from "@/src/utils/supabase/admin";

const toOptionalNumber = (value: number | null | undefined) =>
  value === null || value === undefined ? undefined : value;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = submitFeedbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });
  }

  const { data: tokenRow, error: tokenError } = await supabaseAdmin
    .from("feedback_tokens")
    .select("token")
    .eq("token", parsed.data.token)
    .maybeSingle();

  if (tokenError) {
    return NextResponse.json({ message: mapSupabaseError(tokenError) }, { status: 500 });
  }

  if (!tokenRow) {
    return NextResponse.json(
      { message: "Invalid or expired token" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin.rpc("submit_feedback", {
    p_token: parsed.data.token,
    p_feedback_text: parsed.data.feedback_text,
    p_score_result: toOptionalNumber(parsed.data.score_result),
    p_score_explanation: toOptionalNumber(parsed.data.score_explanation),
    p_score_comfort: toOptionalNumber(parsed.data.score_comfort),
    p_score_booking: toOptionalNumber(parsed.data.score_booking),
    p_score_recommendation: toOptionalNumber(parsed.data.score_recommendation),
  });

  if (error) {
    const message = getErrorMessage(error);

    if (
      message.includes("Invalid or expired token") ||
      message.includes("Feedback text too long")
    ) {
      return NextResponse.json({ message }, { status: 400 });
    }

    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  const { data: discountRow, error: discountError } = await supabaseAdmin
    .from("client_discounts")
    .select("discount_percent")
    .eq("feedback_token", parsed.data.token)
    .maybeSingle();

  if (discountError) {
    return NextResponse.json(
      { message: mapSupabaseError(discountError) },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: {
      feedback_id: data,
      discount_percent: discountRow?.discount_percent ?? null,
    },
  });
}
