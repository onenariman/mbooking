import { subDays, subMonths } from "date-fns";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/src/utils/supabase/server";
import { getErrorMessage, mapSupabaseError } from "@/src/helpers/getErrorMessage";

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

type RatingsRow = {
  score_result: number | null;
  score_explanation: number | null;
  score_comfort: number | null;
  score_booking: number | null;
  score_recommendation: number | null;
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

const fetchScoresForRange = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  range: PeriodRange,
): Promise<RatingsRow[]> => {
  const { data, error } = await supabase
    .from("feedback_responses")
    .select(
      "score_result, score_explanation, score_comfort, score_booking, score_recommendation",
    )
    .eq("user_id", userId)
    .gte("created_at", `${range.from}T00:00:00.000Z`)
    .lte("created_at", `${range.to}T23:59:59.999Z`);

  if (error) {
    throw new Error(mapSupabaseError(error));
  }

  return (data ?? []) as RatingsRow[];
};

const calcAverage = (rows: RatingsRow[], key: keyof RatingsRow) => {
  const values = rows
    .map((row) => row[key])
    .filter((value): value is number => Number.isFinite(value));

  if (!values.length) {
    return { avg: null, count: 0 };
  }

  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    avg: Math.round(avg * 10) / 10,
    count: values.length,
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

  try {
    const range = resolveRange(parsed.data);
    const rows = await fetchScoresForRange(supabase, user.id, range);

    const keys = [
      "score_result",
      "score_explanation",
      "score_comfort",
      "score_booking",
      "score_recommendation",
    ] as const;

    const labels: Record<(typeof keys)[number], string> = {
      score_result: "Результат процедуры",
      score_explanation: "Объяснения мастера",
      score_comfort: "Комфорт процедуры",
      score_booking: "Удобство записи",
      score_recommendation: "Готовность рекомендовать",
    };

    const data = keys.map((key) => {
      const current = calcAverage(rows, key);

      return {
        key,
        label: labels[key],
        avg: current.avg,
        sampleSize: current.count,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "Ошибка расчета") },
      { status: 500 },
    );
  }
}
