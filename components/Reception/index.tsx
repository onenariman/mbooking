"use client";

import { useState } from "react";
import { startOfDay, endOfDay } from "date-fns";

import StatisticCard from "./Statistic/StatisticCard";
import { FilterCategory } from "./Filters/FilterCategory";
import { FilterStatus } from "./Filters/FilterStatus";
import dynamic from "next/dynamic";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import BookList from "./BookList/BookList";
import { ZodAppointmentStatus } from "@/src/schemas/books/bookSchema";

// Динамический импорт компонентов
const AddBook = dynamic(() => import("./AddBook/AddBook"), {
  ssr: false,
  loading: () => (
    <Button disabled className="w-full">
      Загрузка <Spinner className="ml-2 h-4 w-4" />
    </Button>
  ),
});

const FilterDate = dynamic(() => import("./Filters/FilterDate"), {
  ssr: false,
  loading: () => (
    <Button disabled variant="outline" className="w-full">
      Загрузка <Spinner className="ml-2 h-4 w-4" />
    </Button>
  ),
});

export default function ReceptionComponents() {
  const [dateRange, setDateRange] = useState<{
    from: string | null;
    to: string | null;
  }>({
    from: startOfDay(new Date()).toISOString(),
    to: endOfDay(new Date()).toISOString(),
  });

  // 1. Добавляем состояние категории
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<ZodAppointmentStatus | "all">("all");

  return (
    <div className="flex flex-col gap-4">
      <StatisticCard />

      {/* Сетка фильтров */}
      <div className="flex flex-col gap-2">
        <FilterCategory value={category} onChange={setCategory} />
        <FilterStatus value={status} onChange={setStatus} />
      </div>

      <AddBook />
      <FilterDate onChange={(from, to) => setDateRange({ from, to })} />

      {/* Передаем всё в список */}
      <BookList
        from={dateRange.from}
        to={dateRange.to}
        selectedCategory={category}
        selectedStatus={status}
      />
    </div>
  );
}
