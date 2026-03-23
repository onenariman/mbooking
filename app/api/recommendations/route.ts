import { subDays, subMonths } from "date-fns";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/src/utils/supabase/server";
import { aiRecommendationArraySchema } from "@/src/schemas/feedback/feedbackSchema";
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

  let query = supabase
    .from("ai_recommendations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (parsed.data.period) {
    const range = getPeriodRange(parsed.data.period);
    query = query
      .eq("period_type", parsed.data.period)
      .gte("period_from", range.from)
      .lte("period_to", range.to);
  } else if (parsed.data.from && parsed.data.to) {
    query = query
      .eq("period_from", parsed.data.from)
      .eq("period_to", parsed.data.to);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  const parsedData = aiRecommendationArraySchema.safeParse(data ?? []);
  if (!parsedData.success) {
    return NextResponse.json(
      { message: "Данные рекомендаций не прошли валидацию" },
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
    .from("ai_recommendations")
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
      { message: "Рекомендация не найдена или недоступна для удаления" },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: true });
}
