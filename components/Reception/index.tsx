"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import StatisticCard from "./Statistic/StatisticCard";
import { FilterCategory } from "./Filters/FilterCategory";
import { FilterStatus } from "./Filters/FilterStatus";
import { FilterDate } from "./Filters/FilterDate";
import AppointmentsList from "./Appointment/AppointmentsList";

const AddBook = dynamic(() => import("./AddBook/AddBook"), {
  ssr: false,
});

const ReceptionComponents = () => {
  const [category, setCategory] = useState<
    "all" | "electro" | "cosmetology" | "massage" | "laser"
  >("all");
  const [status, setStatus] = useState<
    "all" | "pending" | "confirmed" | "cancelled"
  >("all");
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  return (
    <div className="w-full flex flex-col gap-y-2">
      <StatisticCard />
      <AddBook />
      <FilterCategory onChange={setCategory} />
      <FilterStatus onChange={setStatus} />
      <FilterDate
        onChange={(from, to) => {
          setDateFrom(from);
          setDateTo(to);
        }}
      />
      <AppointmentsList
        categoryFilter={category}
        statusFilter={status}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
    </div>
  );
};

export default ReceptionComponents;
