"use client";

import StatisticCard from "./Statistic/StatisticCard";
import { FilterCategory } from "./Filters/FilterCategory";
import { FilterStatus } from "./Filters/FilterStatus";
import AppointmentsList from "./Appointment/AppointmentsList";
import { Button } from "../ui/button";
import dynamic from "next/dynamic";
import { Spinner } from "../ui/spinner";

const AddBook = dynamic(() => import("./AddBook/AddBook"), {
  ssr: false,
  loading: () => (
    <Button disabled variant="destructive">
      Загрузка
      <Spinner />
    </Button>
  ),
});

const FilterDate = dynamic(() => import("./Filters/FilterDate"), {
  ssr: false,
  loading: () => (
    <Button disabled variant="secondary">
      Загрузка
      <Spinner />
    </Button>
  ),
});

const ReceptionComponents = () => {
  return (
    <div className="flex flex-col gap-y-4">
      <FilterCategory />
      <FilterStatus />
      <StatisticCard />
      <div className="flex flex-col gap-y-2">
        <AddBook />
        <FilterDate />
      </div>
      <AppointmentsList />
    </div>
  );
};

export default ReceptionComponents;
