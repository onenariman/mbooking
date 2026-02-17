"use client";

import * as React from "react";
import { ru } from "date-fns/locale";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

type Props = {
  onChange?: (fromISO: string | null, toISO: string | null) => void;
};

export default function FilterDate({ onChange }: Props) {
  const [open, setOpen] = React.useState(false);
  const [range, setRange] = React.useState<DateRange | undefined>();

  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  /**
   * Приводим дату к началу дня (локально)
   */
  const startOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  /**
   * Приводим дату к концу дня (локально)
   */
  const endOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const handleApply = () => {
    if (!onChange) return;

    if (!range?.from) {
      onChange(null, null);
      setOpen(false);
      return;
    }

    const from = startOfDay(range.from);
    const to = range.to ? endOfDay(range.to) : endOfDay(range.from);

    onChange(from.toISOString(), to.toISOString());
    setOpen(false);
  };

  const renderLabel = () => {
    if (!range?.from) {
      return <span>Фильтр по датам</span>;
    }

    if (!range.to) {
      return format(range.from, "dd.MM.yyyy", { locale: ru });
    }

    return (
      <>
        {format(range.from, "dd.MM.yyyy", { locale: ru })} –{" "}
        {format(range.to, "dd.MM.yyyy", { locale: ru })}
      </>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-center w-full font-normal"
          type="button"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {renderLabel()}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0"
        align="center"
        side="bottom"
        sideOffset={-400} // Небольшой отступ от кнопки
        avoidCollisions={false}
      >
        <div className="p-4 flex flex-col gap-4">
          <div className="space-y-1">
            <h4 className="font-medium leading-none">Выберите период</h4>
            <p className="text-xs text-muted-foreground">
              Диапазон дат для фильтрации записей.
            </p>
          </div>

          <Calendar
            mode="range"
            locale={ru}
            defaultMonth={range?.from ?? today}
            selected={range}
            onSelect={setRange}
            className="rounded-md border shadow-sm"
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Отмена
            </Button>

            <Button
              className="flex-1"
              disabled={!range?.from}
              onClick={handleApply}
            >
              ОК
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
