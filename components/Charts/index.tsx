"use client";

import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AppointmentsByDayChart from "./charts/AppointmentsByDayChart";
import RevenueByServiceChart from "./charts/RevenueByServiceChart";
import CategoryFilter from "./filters/CategoryFilter";
import DateRangeFilter from "./filters/DateRangeFilter";
import { buildDateFilter } from "./lib/analytics";
import { currencyFormatter, getDefaultRange, getRangeLabel } from "./lib/constants";
import MetricsCards from "./metrics/MetricsCards";
import CategoriesSummary from "./summary/CategoriesSummary";
import RevenueLossCard from "./summary/RevenueLossCard";
import StatusSummary from "./summary/StatusSummary";
import type {
  AppointmentsByDayPoint,
  CategorySummaryRow,
  DateFilter,
  Metrics,
  RevenueByServicePoint,
  RevenueLossMetrics,
  StatusSummaryItem,
} from "./lib/types";
import { QUERY_OPTIONS } from "@/src/lib/queryConfig";

export default function ChartsSection() {
  const [range, setRange] = useState<DateRange | undefined>(() =>
    getDefaultRange(),
  );
  const [selectedCategory, setSelectedCategory] = useState("all");

  const dateFilter = useMemo(() => buildDateFilter(range), [range]);

  const hasSelectedRange = Boolean(range?.from);

  type ChartsOverviewResponse = {
    data: {
      dateFilter: DateFilter;
      categoryOptions: string[];
      activeCategory: string;
      overallMetrics: Metrics;
      selectedMetrics: Metrics;
      appointmentsByDay: AppointmentsByDayPoint[];
      revenueByService: RevenueByServicePoint[];
      statusSummary: StatusSummaryItem[];
      categoriesSummary: CategorySummaryRow[];
      revenueLossMetrics: RevenueLossMetrics;
    };
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["charts-overview", dateFilter.from, dateFilter.to, selectedCategory],
    queryFn: async (): Promise<ChartsOverviewResponse["data"]> => {
      const params = new URLSearchParams();
      if (dateFilter.from) params.set("from", dateFilter.from);
      if (dateFilter.to) params.set("to", dateFilter.to);
      params.set("category", selectedCategory);

      const response = await fetch(`/api/charts/overview?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const payload = (await response.json()) as {
        data?: ChartsOverviewResponse["data"];
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.message || "Не удалось загрузить аналитику");
      }
      if (!payload.data) {
        throw new Error("Ответ сервера не содержит данных");
      }
      return payload.data;
    },
    ...QUERY_OPTIONS.analytics,
  });

  const categoryOptions = data?.categoryOptions ?? ["all"];
  const activeCategory = data?.activeCategory ?? "all";
  const overallMetrics = data?.overallMetrics;
  const selectedMetrics = data?.selectedMetrics;
  const appointmentsByDay = data?.appointmentsByDay ?? [];
  const revenueByService = data?.revenueByService ?? [];
  const statusSummary = data?.statusSummary ?? [];
  const categoriesSummary = data?.categoriesSummary ?? [];
  const revenueLossMetrics = data?.revenueLossMetrics;

  const categoryLabel =
    activeCategory === "all" ? "все категории" : activeCategory;

  const metricsSubtitle = useMemo(() => {
    const period = getRangeLabel(range);
    if (activeCategory === "all") {
      return `${period}. Все категории.`;
    }
    if (overallMetrics) {
      return `${period}. Фильтр: «${activeCategory}». Выручка по всем категориям за период: ${currencyFormatter.format(overallMetrics.revenue)}.`;
    }
    return `${period}. Категория: «${activeCategory}».`;
  }, [range, activeCategory, overallMetrics]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !selectedMetrics || !revenueLossMetrics || !overallMetrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Статистика</CardTitle>
          <CardDescription>
            Не удалось загрузить аналитику. Попробуйте обновить страницу.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="space-y-3 pb-3">
          <div>
            <CardTitle className="text-lg">Период и категория</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Графики и цифры ниже считаются по выбранным фильтрам.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3">
            <DateRangeFilter
              range={range}
              onChange={setRange}
              onResetToCurrentMonth={() => setRange(getDefaultRange())}
              hasSelectedRange={hasSelectedRange}
            />
            <CategoryFilter
              categoryOptions={categoryOptions}
              activeCategory={activeCategory}
              onChange={setSelectedCategory}
            />
          </div>
        </CardHeader>
      </Card>

      <MetricsCards
        title="Ключевые показатели"
        subtitle={metricsSubtitle}
        metrics={selectedMetrics}
      />

      <AppointmentsByDayChart
        data={appointmentsByDay}
        categoryLabel={categoryLabel}
      />

      <RevenueByServiceChart
        data={revenueByService}
        categoryLabel={categoryLabel}
      />

      <StatusSummary statusSummary={statusSummary} categoryLabel={categoryLabel} />

      <RevenueLossCard
        metrics={revenueLossMetrics}
        categoryLabel={categoryLabel}
      />

      <CategoriesSummary
        categoriesSummary={categoriesSummary}
        activeCategory={activeCategory}
      />
    </div>
  );
}
