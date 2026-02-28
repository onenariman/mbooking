import { format, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import type { ChartConfig } from "@/components/ui/chart";
import type { StatusKey } from "./types";

export const currencyFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

export const percentFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export const statusLabels: Record<StatusKey, string> = {
  booked: "Запланировано",
  completed: "Завершено",
  cancelled: "Отменено",
  no_show: "Не пришли",
};

export const appointmentsChartConfig = {
  appointments: {
    label: "Все записи",
    color: "var(--chart-1)",
  },
  completed: {
    label: "Завершено",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export const revenueChartConfig = {
  revenue: {
    label: "Выручка",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export const getDefaultRange = (): DateRange => {
  const now = new Date();
  return {
    from: startOfMonth(now),
    to: now,
  };
};

export const getRangeLabel = (range: DateRange | undefined) => {
  if (!range?.from) {
    return "Весь период";
  }

  if (!range.to) {
    return format(range.from, "dd.MM.yyyy", { locale: ru });
  }

  return `${format(range.from, "dd.MM.yyyy", { locale: ru })} - ${format(range.to, "dd.MM.yyyy", { locale: ru })}`;
};
