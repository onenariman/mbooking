"use client";

import { Button } from "@/components/ui/button";
import { ZodAppointmentStatus } from "@/src/schemas/books/bookSchema";

type FilterStatusValue = ZodAppointmentStatus | "all";

interface FilterStatusProps {
  value: FilterStatusValue;
  onChange: (value: FilterStatusValue) => void;
}

const STATUS_OPTIONS: Array<{ label: string; value: FilterStatusValue }> = [
  { label: "Все", value: "all" },
  { label: "Запланировано", value: "booked" },
  { label: "Завершено", value: "completed" },
  { label: "Отменено", value: "cancelled" },
  { label: "Не пришёл", value: "no_show" },
];

export function FilterStatus({ value, onChange }: FilterStatusProps) {
  return (
    <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
      {STATUS_OPTIONS.map((status) => (
        <Button
          key={status.value}
          type="button"
          size="sm"
          variant={value === status.value ? "default" : "secondary"}
          onClick={() => onChange(status.value)}
          className="whitespace-nowrap rounded-full"
        >
          {status.label}
        </Button>
      ))}
    </div>
  );
}
