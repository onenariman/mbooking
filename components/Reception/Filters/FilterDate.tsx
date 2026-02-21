"use client";

import * as React from "react";
import { ru } from "date-fns/locale";
import { format, startOfDay, endOfDay } from "date-fns";
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
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  const handleApply = () => {
    if (!onChange) return;

    if (!range?.from) {
      onChange(null, null);
    } else {
      // Приводим к 00:00:00 и 23:59:59 именно локального дня
      const from = startOfDay(range.from).toISOString();
      const to = endOfDay(range.to || range.from).toISOString();
      onChange(from, to);
    }
    setOpen(false);
  };

  const renderLabel = () => {
    if (!range?.from) return <span>Фильтр по датам</span>;
    if (!range.to) return format(range.from, "dd.MM.yyyy", { locale: ru });

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

      <PopoverContent className="w-auto p-0" align="center">
        <div className="p-4 flex flex-col gap-4">
          <div className="space-y-1">
            <h4 className="font-medium">Выберите период</h4>
            <p className="text-xs text-muted-foreground">
              Записи будут отфильтрованы по этому диапазону.
            </p>
          </div>

          <Calendar
            mode="range"
            locale={ru}
            selected={range}
            onSelect={setRange}
            initialFocus
            className="rounded-md border shadow-sm"
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setRange(undefined);
                onChange?.(null, null);
                setOpen(false);
              }}
            >
              Сбросить
            </Button>

            <Button
              className="flex-1"
              disabled={!range?.from}
              onClick={handleApply}
            >
              Применить
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
