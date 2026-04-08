import { differenceInCalendarDays, subDays, subMonths } from "date-fns";

export const PRESET_PERIODS = [
  "week",
  "month",
  "3m",
  "6m",
  "9m",
  "12m",
] as const;

export type PresetPeriod = (typeof PRESET_PERIODS)[number];

export type PeriodRange = {
  from: string;
  to: string;
};

const toDateOnlyIso = (date: Date) => date.toISOString().slice(0, 10);

export function getPeriodRange(period: PresetPeriod): PeriodRange {
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
}

export function resolveRecommendationRange(data: {
  period?: PresetPeriod;
  from?: string;
  to?: string;
}): { periodType: string; range: PeriodRange; horizonLabel: string } {
  if (data.period) {
    const periodType = data.period;
    const range = getPeriodRange(periodType);
    const horizonLabel =
      periodType === "week"
        ? "7 дней"
        : periodType === "month"
          ? "30 дней"
          : "30 дней (из долгого периода, с фокусом на ближайший месяц)";
    return { periodType, range, horizonLabel };
  }

  const from = data.from ?? "";
  const to = data.to ?? "";
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T00:00:00.000Z`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new Error("Некорректный диапазон дат");
  }
  if (fromDate > toDate) {
    throw new Error("Дата начала позже даты окончания");
  }
  const days = Math.max(1, differenceInCalendarDays(toDate, fromDate) + 1);
  const horizonLabel = `${days} дней`;
  return { periodType: "custom", range: { from, to }, horizonLabel };
}

export function utcDateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}
