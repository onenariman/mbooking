import { differenceInCalendarDays, subDays, subMonths } from "date-fns";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/src/utils/supabase/server";
import { getErrorMessage, mapSupabaseError } from "@/src/helpers/getErrorMessage";

const periodSchema = z.enum(["week", "month", "3m", "6m", "9m", "12m"]);

const requestSchema = z.object({
  period: periodSchema,
});

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

const getPreviousRange = (range: PeriodRange): PeriodRange => {
  const fromDate = new Date(`${range.from}T00:00:00.000Z`);
  const toDate = new Date(`${range.to}T00:00:00.000Z`);
  const days = Math.max(1, differenceInCalendarDays(toDate, fromDate) + 1);
  const prevTo = subDays(fromDate, 1);
  const prevFrom = subDays(prevTo, days - 1);

  return {
    from: toDateOnlyIso(prevFrom),
    to: toDateOnlyIso(prevTo),
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
  const rounded = Math.round(avg * 10) / 10;
  return { avg: rounded, count: values.length };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = requestSchema.safeParse({
    period: url.searchParams.get("period"),
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
    const range = getPeriodRange(parsed.data.period);
    const prevRange = getPreviousRange(range);

    const [currentRows, prevRows] = await Promise.all([
      fetchScoresForRange(supabase, user.id, range),
      fetchScoresForRange(supabase, user.id, prevRange),
    ]);

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
      const current = calcAverage(currentRows, key);
      const previous = calcAverage(prevRows, key);

      const delta =
        current.avg !== null && previous.avg !== null
          ? Math.round((current.avg - previous.avg) * 10) / 10
          : null;

      const percent =
        current.avg !== null ? Math.round((current.avg / 5) * 100) : null;

      return {
        key,
        label: labels[key],
        avg: current.avg,
        percent,
        delta,
        sampleSize: current.count,
        prevSampleSize: previous.count,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "Ошибка расчёта") },
      { status: 500 },
    );
  }
}
