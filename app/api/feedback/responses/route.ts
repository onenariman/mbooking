import { subDays, subMonths } from "date-fns";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/src/utils/supabase/server";
import { feedbackResponseArraySchema } from "@/src/schemas/feedback/feedbackSchema";
import { mapSupabaseError } from "@/src/helpers/getErrorMessage";

const periodSchema = z.enum(["week", "month", "3m", "6m", "9m", "12m"]);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const requestSchema = z
  .object({
    period: periodSchema.optional(),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
  })
  .refine(
    (data) =>
      (data.period && !data.from && !data.to) ||
      (!data.period && data.from && data.to),
    { message: "Некорректные параметры" },
  );

type Period = z.infer<typeof periodSchema>;

type PeriodRange = {
  from: string;
  to: string;
};

const toDateOnlyIso = (date: Date) => date.toISOString().slice(0, 10);

const getPeriodRange = (period: Period): PeriodRange => {
  const now = new Date();
  const to = toDateOnlyIso(now);

  if (period === "week") {
    return { from: toDateOnlyIso(subDays(now, 7)), to };
  }
  if (period === "month") {
    return { from: toDateOnlyIso(subMonths(now, 1)), to };
  }
  if (period === "3m") {
    return { from: toDateOnlyIso(subMonths(now, 3)), to };
  }
  if (period === "6m") {
    return { from: toDateOnlyIso(subMonths(now, 6)), to };
  }
  if (period === "9m") {
    return { from: toDateOnlyIso(subMonths(now, 9)), to };
  }

  return { from: toDateOnlyIso(subMonths(now, 12)), to };
};

const resolveRange = (data: z.infer<typeof requestSchema>): PeriodRange => {
  if (data.period) {
    return getPeriodRange(data.period);
  }

  return {
    from: data.from ?? "",
    to: data.to ?? "",
  };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = requestSchema.safeParse({
    period: url.searchParams.get("period") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректные параметры" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  }

  const range = resolveRange(parsed.data);

  const { data, error } = await supabase
    .from("feedback_responses")
    .select(
      "id, user_id, feedback_text, created_at, period_bucket, score_result, score_explanation, score_comfort, score_booking, score_recommendation",
    )
    .eq("user_id", user.id)
    .gte("created_at", `${range.from}T00:00:00.000Z`)
    .lte("created_at", `${range.to}T23:59:59.999Z`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  const parsedData = feedbackResponseArraySchema.safeParse(data ?? []);
  if (!parsedData.success) {
    return NextResponse.json(
      { message: "Данные отзывов не прошли валидацию" },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: parsedData.data });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
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

  const { data, error } = await supabase
    .from("feedback_responses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { message: "Отзыв не найден или недоступен для удаления" },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: true });
}
