"use client";

import { Button } from "@/components/ui/button";
import { ZodAppointmentStatus } from "@/src/schemas/books/bookSchema";

// Определяем тип для фильтра (все статусы + вариант "all")
type FilterStatusValue = ZodAppointmentStatus | "all";

interface FilterStatusProps {
  value: FilterStatusValue;
  onChange: (value: FilterStatusValue) => void;
}

export function FilterStatus({ value, onChange }: FilterStatusProps) {
  const statuses: { label: string; value: FilterStatusValue }[] = [
    { label: "Все", value: "all" },
    { label: "Запланировано", value: "booked" },
    { label: "Завершено", value: "completed" },
    { label: "Отменено", value: "cancelled" },
    { label: "Не пришел", value: "no_show" },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {statuses.map((s) => (
        <Button
          key={s.value}
          type="button"
          size="sm"
          variant={value === s.value ? "default" : "secondary"}
          onClick={() => onChange(s.value)}
          className="whitespace-nowrap rounded-full"
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
}
