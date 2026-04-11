"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { startOfLocalDayUtcRange } from "@/src/lib/time";
import { ZodAppointmentStatus } from "@/src/schemas/books/bookSchema";
import { Button } from "../ui/button";
import BookList from "./BookList/BookList";
import { FilterCategory } from "./Filters/FilterCategory";
import { FilterStatus } from "./Filters/FilterStatus";
import StatisticCard from "./Statistic/StatisticCard";
import { Skeleton } from "../ui/skeleton";

const AddBook = dynamic(() => import("./AddBook/AddBook"), {
  ssr: false,
  loading: () => (
    <Button disabled className="w-full bg-transparent" variant="ghost">
      <Skeleton className="h-11 w-full rounded-xl bg-muted/60" />
    </Button>
  ),
});

const FilterDate = dynamic(() => import("./Filters/FilterDate"), {
  ssr: false,
  loading: () => (
    <Button disabled className="w-full bg-transparent" variant="ghost">
      <Skeleton className="h-11 w-full rounded-xl bg-muted/60" />
    </Button>
  ),
});

interface DateRange {
  from: string | null;
  to: string | null;
}

export default function ReceptionComponents() {
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    startOfLocalDayUtcRange(new Date()),
  );
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<ZodAppointmentStatus | "all">("all");

  return (
    <div className="flex flex-col gap-4">
      <StatisticCard />

      <div className="flex flex-col gap-2">
        <FilterCategory value={category} onChange={setCategory} />
        <FilterStatus value={status} onChange={setStatus} />
      </div>

      <AddBook />
      <FilterDate onChange={(from, to) => setDateRange({ from, to })} />

      <BookList
        from={dateRange.from}
        to={dateRange.to}
        selectedCategory={category}
        selectedStatus={status}
      />
    </div>
  );
}
