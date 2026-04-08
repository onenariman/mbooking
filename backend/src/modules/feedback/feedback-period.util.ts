export type FeedbackPeriod = "week" | "month" | "3m" | "6m" | "9m" | "12m";

export type DateRange = { from: string; to: string };

const toDateOnlyIso = (date: Date): string => date.toISOString().slice(0, 10);

function subDaysUtc(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

function subMonthsUtc(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() - months);
  return d;
}

export function getPeriodRange(period: FeedbackPeriod): DateRange {
  const now = new Date();
  const to = toDateOnlyIso(now);

  if (period === "week") {
    return { from: toDateOnlyIso(subDaysUtc(now, 7)), to };
  }
  if (period === "month") {
    return { from: toDateOnlyIso(subMonthsUtc(now, 1)), to };
  }
  if (period === "3m") {
    return { from: toDateOnlyIso(subMonthsUtc(now, 3)), to };
  }
  if (period === "6m") {
    return { from: toDateOnlyIso(subMonthsUtc(now, 6)), to };
  }
  if (period === "9m") {
    return { from: toDateOnlyIso(subMonthsUtc(now, 9)), to };
  }
  return { from: toDateOnlyIso(subMonthsUtc(now, 12)), to };
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function parseFeedbackListQuery(params: {
  period?: string;
  from?: string;
  to?: string;
}): { ok: true; range: DateRange } | { ok: false; message: string } {
  const period = params.period as FeedbackPeriod | undefined;
  const from = params.from;
  const to = params.to;

  const hasPeriod = Boolean(period);
  const hasCustom = Boolean(from && to);

  if (hasPeriod === hasCustom) {
    return { ok: false, message: "Некорректные параметры" };
  }

  if (hasPeriod) {
    const allowed: FeedbackPeriod[] = [
      "week",
      "month",
      "3m",
      "6m",
      "9m",
      "12m",
    ];
    if (!allowed.includes(period!)) {
      return { ok: false, message: "Некорректные параметры" };
    }
    return { ok: true, range: getPeriodRange(period!) };
  }

  if (!DATE_ONLY.test(from!) || !DATE_ONLY.test(to!)) {
    return { ok: false, message: "Некорректные параметры" };
  }

  return { ok: true, range: { from: from!, to: to! } };
}
