"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface FilterDateProps {
  onChange: (from: Date | null, to: Date | null) => void;
}

export function FilterDate({ onChange }: FilterDateProps) {
  // Текущие даты по умолчанию
  const [date1, setDate1] = React.useState<Date>(new Date());
  const [date2, setDate2] = React.useState<Date>(new Date());

  // функция для красивого отображения даты
  const formatDate = (date: Date) => date.toLocaleDateString("ru-RU"); // дд.мм.гггг

  return (
    <div className="flex items-center gap-x-2">
      {/* Первая дата */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">{formatDate(date1)}</Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date1}
            onSelect={(date) => date && setDate1(date)} // только обновляем state
            className="rounded-lg border"
          />
        </PopoverContent>
      </Popover>

      <span>—</span>

      {/* Вторая дата */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">{formatDate(date2)}</Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date2}
            onSelect={(date) => date && setDate2(date)} // только обновляем state
            className="rounded-lg border"
            captionLayout="label"
          />
        </PopoverContent>
      </Popover>

      {/* Кнопка "Показать" */}
      <Button size="sm" onClick={() => onChange(date1, date2)}>
        Применить
      </Button>
    </div>
  );
}
