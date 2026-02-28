import { eachDayOfInterval, endOfDay, format, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import type { ZodAppointment } from "@/src/schemas/books/bookSchema";
import type { ZodClient } from "@/src/schemas/clients/clientSchema";
import type {
  AppointmentsByDayPoint,
  CategorySummaryRow,
  DateFilter,
  Metrics,
  RevenueLossMetrics,
  RevenueByServicePoint,
  StatusSummaryItem,
} from "./types";

export const normalizeCategoryName = (name?: string | null) =>
  name && name.trim().length > 0 ? name : "Без категории";

export const buildDateFilter = (range: DateRange | undefined): DateFilter => {
  if (!range?.from) {
    return { from: null, to: null };
  }

  return {
    from: startOfDay(range.from).toISOString(),
    to: endOfDay(range.to ?? range.from).toISOString(),
  };
};

const getDateBounds = (dateFilter: DateFilter) => ({
  fromTs: dateFilter.from ? Date.parse(dateFilter.from) : null,
  toTs: dateFilter.to ? Date.parse(dateFilter.to) : null,
});

const isClientInDateRange = (
  client: ZodClient,
  fromTs: number | null,
  toTs: number | null,
) => {
  const createdAtTs = Date.parse(client.created_at);
  if (Number.isNaN(createdAtTs)) {
    return false;
  }

  if (fromTs === null || toTs === null) {
    return true;
  }

  return createdAtTs >= fromTs && createdAtTs <= toTs;
};

export const calculateMetrics = (
  appointments: ZodAppointment[],
  clients: ZodClient[],
  dateFilter: DateFilter,
  restrictNewClientsToAppointments: boolean,
): Metrics => {
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter((item) => item.status === "completed");
  const bookedAppointments = appointments.filter((item) => item.status === "booked").length;
  const cancelledAppointments = appointments.filter(
    (item) => item.status === "cancelled" || item.status === "no_show",
  ).length;
  const noShowAppointments = appointments.filter((item) => item.status === "no_show").length;

  const revenue = completedAppointments.reduce((acc, item) => acc + (item.amount ?? 0), 0);
  const averageCheck = completedAppointments.length > 0 ? revenue / completedAppointments.length : 0;
  const conversionToCompleted =
    totalAppointments > 0 ? (completedAppointments.length / totalAppointments) * 100 : 0;

  const phoneCounter = appointments.reduce<Record<string, number>>((acc, item) => {
    if (!item.client_phone) {
      return acc;
    }

    acc[item.client_phone] = (acc[item.client_phone] ?? 0) + 1;
    return acc;
  }, {});

  const phones = new Set(Object.keys(phoneCounter));
  const uniqueClientsCount = phones.size;
  const repeatClientsCount = Object.values(phoneCounter).filter((count) => count > 1).length;
  const { fromTs, toTs } = getDateBounds(dateFilter);

  const newClientsCount = clients.filter((client) => {
    if (!isClientInDateRange(client, fromTs, toTs)) {
      return false;
    }

    if (!restrictNewClientsToAppointments) {
      return true;
    }

    return phones.has(client.phone);
  }).length;

  return {
    totalAppointments,
    bookedAppointments,
    cancelledAppointments,
    completedAppointmentsCount: completedAppointments.length,
    noShowAppointments,
    revenue,
    averageCheck,
    conversionToCompleted,
    repeatClientsCount,
    uniqueClientsCount,
    newClientsCount,
  };
};

export const buildAppointmentsByDay = (
  appointments: ZodAppointment[],
): AppointmentsByDayPoint[] => {
  if (appointments.length === 0) {
    return [];
  }

  const sortedAppointments = [...appointments].sort((a, b) => {
    const first = Date.parse(a.appointment_at ?? a.created_at);
    const second = Date.parse(b.appointment_at ?? b.created_at);
    return first - second;
  });

  const firstDate = sortedAppointments[0]?.appointment_at ?? sortedAppointments[0]?.created_at;
  const lastItem = sortedAppointments[sortedAppointments.length - 1];
  const lastDate = lastItem?.appointment_at ?? lastItem?.created_at;

  if (!firstDate || !lastDate) {
    return [];
  }

  const interval = eachDayOfInterval({
    start: startOfDay(new Date(firstDate)),
    end: startOfDay(new Date(lastDate)),
  });

  const grouped = interval.reduce<Record<string, AppointmentsByDayPoint>>((acc, day) => {
    const dateKey = format(day, "yyyy-MM-dd");
    acc[dateKey] = {
      dateKey,
      label: format(day, "dd MMM", { locale: ru }),
      appointments: 0,
      completed: 0,
    };
    return acc;
  }, {});

  for (const item of sortedAppointments) {
    const dateSource = item.appointment_at ?? item.created_at;
    const dateKey = format(new Date(dateSource), "yyyy-MM-dd");

    if (!grouped[dateKey]) {
      continue;
    }

    grouped[dateKey].appointments += 1;
    if (item.status === "completed") {
      grouped[dateKey].completed += 1;
    }
  }

  return Object.values(grouped);
};

export const buildRevenueByService = (
  appointments: ZodAppointment[],
  limit = 6,
): RevenueByServicePoint[] => {
  const grouped = appointments.reduce<Record<string, number>>((acc, item) => {
    if (item.status !== "completed") {
      return acc;
    }

    const amount = item.amount ?? 0;
    const serviceName = item.service_name || "Без названия";

    acc[serviceName] = (acc[serviceName] ?? 0) + amount;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([service, revenue]) => ({
      service,
      revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
};

export const buildStatusSummary = (metrics: Metrics): StatusSummaryItem[] => [
  { key: "booked", value: metrics.bookedAppointments },
  { key: "completed", value: metrics.completedAppointmentsCount },
  { key: "cancelled", value: metrics.cancelledAppointments },
  { key: "no_show", value: metrics.noShowAppointments },
];

export const buildCategoriesSummary = (
  appointments: ZodAppointment[],
  clients: ZodClient[],
  dateFilter: DateFilter,
  overallRevenue: number,
): CategorySummaryRow[] => {
  const grouped = appointments.reduce<Record<string, ZodAppointment[]>>((acc, item) => {
    const category = normalizeCategoryName(item.category_name);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([category, categoryAppointments]) => {
      const metrics = calculateMetrics(categoryAppointments, clients, dateFilter, true);
      const revenueShare = overallRevenue > 0 ? (metrics.revenue / overallRevenue) * 100 : 0;

      return {
        category,
        totalAppointments: metrics.totalAppointments,
        completedAppointments: metrics.completedAppointmentsCount,
        revenue: metrics.revenue,
        revenueShare,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
};

export const buildRevenueLossMetrics = (
  appointments: ZodAppointment[],
): RevenueLossMetrics => {
  const completedAppointments = appointments.filter((item) => item.status === "completed");
  const cancelledAppointments = appointments.filter((item) => item.status === "cancelled");
  const noShowAppointments = appointments.filter((item) => item.status === "no_show");

  const actualRevenue = completedAppointments.reduce(
    (acc, item) => acc + (item.amount ?? 0),
    0,
  );
  const cancelledLossRevenue = cancelledAppointments.reduce(
    (acc, item) => acc + (item.amount ?? 0),
    0,
  );
  const noShowLossRevenue = noShowAppointments.reduce(
    (acc, item) => acc + (item.amount ?? 0),
    0,
  );

  const lostRevenue = cancelledLossRevenue + noShowLossRevenue;
  const plannedRevenue = actualRevenue + lostRevenue;
  const planCompletionRate =
    plannedRevenue > 0 ? (actualRevenue / plannedRevenue) * 100 : 0;
  const lossRate = plannedRevenue > 0 ? (lostRevenue / plannedRevenue) * 100 : 0;

  const lostAppointments = [...cancelledAppointments, ...noShowAppointments];
  const pricedLostAppointmentsCount = lostAppointments.filter(
    (item) => item.amount !== null,
  ).length;
  const lostAppointmentsCount = lostAppointments.length;
  const unpricedLostAppointmentsCount =
    lostAppointmentsCount - pricedLostAppointmentsCount;

  return {
    plannedRevenue,
    actualRevenue,
    lostRevenue,
    cancelledLossRevenue,
    noShowLossRevenue,
    planCompletionRate,
    lossRate,
    lostAppointmentsCount,
    pricedLostAppointmentsCount,
    unpricedLostAppointmentsCount,
  };
};
