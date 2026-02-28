"use client";

import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useAppointments } from "@/src/hooks/appointments.hooks";
import { useClients } from "@/src/hooks/clients.hooks";
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
import {
  buildAppointmentsByDay,
  buildCategoriesSummary,
  buildDateFilter,
  buildRevenueLossMetrics,
  buildRevenueByService,
  buildStatusSummary,
  calculateMetrics,
  normalizeCategoryName,
} from "./lib/analytics";
import { getDefaultRange } from "./lib/constants";
import MetricsCards from "./metrics/MetricsCards";
import CategoriesSummary from "./summary/CategoriesSummary";
import RecommendationsCard from "./summary/RecommendationsCard";
import RevenueLossCard from "./summary/RevenueLossCard";
import StatusSummary from "./summary/StatusSummary";

export default function ChartsSection() {
  const [range, setRange] = useState<DateRange | undefined>(() =>
    getDefaultRange(),
  );
  const [selectedCategory, setSelectedCategory] = useState("all");

  const dateFilter = useMemo(() => buildDateFilter(range), [range]);
  const { data: appointments = [], isLoading: isAppointmentsLoading } =
    useAppointments(dateFilter);
  const { data: clients = [], isLoading: isClientsLoading } = useClients();

  const hasSelectedRange = Boolean(range?.from);

  const categoryOptions = useMemo(() => {
    const categories = Array.from(
      new Set(
        appointments.map((item) => normalizeCategoryName(item.category_name)),
      ),
    ).sort((a, b) => a.localeCompare(b, "ru"));

    return ["all", ...categories];
  }, [appointments]);

  const activeCategory = categoryOptions.includes(selectedCategory)
    ? selectedCategory
    : "all";

  const selectedAppointments = useMemo(() => {
    if (activeCategory === "all") {
      return appointments;
    }

    return appointments.filter(
      (item) => normalizeCategoryName(item.category_name) === activeCategory,
    );
  }, [appointments, activeCategory]);

  const overallMetrics = useMemo(
    () => calculateMetrics(appointments, clients, dateFilter, false),
    [appointments, clients, dateFilter],
  );

  const selectedMetrics = useMemo(
    () =>
      calculateMetrics(
        selectedAppointments,
        clients,
        dateFilter,
        activeCategory !== "all",
      ),
    [selectedAppointments, clients, dateFilter, activeCategory],
  );

  const appointmentsByDay = useMemo(
    () => buildAppointmentsByDay(selectedAppointments),
    [selectedAppointments],
  );

  const revenueByService = useMemo(
    () => buildRevenueByService(selectedAppointments),
    [selectedAppointments],
  );

  const statusSummary = useMemo(
    () => buildStatusSummary(selectedMetrics),
    [selectedMetrics],
  );

  const categoriesSummary = useMemo(
    () =>
      buildCategoriesSummary(
        appointments,
        clients,
        dateFilter,
        overallMetrics.revenue,
      ),
    [appointments, clients, dateFilter, overallMetrics.revenue],
  );

  const revenueLossMetrics = useMemo(
    () => buildRevenueLossMetrics(selectedAppointments),
    [selectedAppointments],
  );

  const categoryLabel =
    activeCategory === "all" ? "все категории" : activeCategory;

  if (isAppointmentsLoading || isClientsLoading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      <Card>
        <CardHeader>
          <CardTitle>Фильтры аналитики</CardTitle>
          <CardDescription>
            Выберите период и категорию, чтобы увидеть детальную статистику, при
            этом общая сводка всегда показывается отдельно.
          </CardDescription>
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
        </CardHeader>
      </Card>

      <MetricsCards
        title="Общая статистика"
        subtitle="Все категории в выбранном периоде"
        metrics={overallMetrics}
      />

      <MetricsCards
        title={
          activeCategory === "all"
            ? "Статистика выбранной категории"
            : `Статистика категории: ${activeCategory}`
        }
        subtitle={
          activeCategory === "all"
            ? "Сейчас выбраны все категории"
            : "Детальные метрики только по выбранной категории"
        }
        metrics={selectedMetrics}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AppointmentsByDayChart
          data={appointmentsByDay}
          categoryLabel={categoryLabel}
        />
        <RevenueByServiceChart
          data={revenueByService}
          categoryLabel={categoryLabel}
        />
      </div>

      <StatusSummary
        statusSummary={statusSummary}
        categoryLabel={categoryLabel}
      />

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
