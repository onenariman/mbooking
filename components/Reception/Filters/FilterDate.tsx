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
import { startOfLocalDayUtcRange } from "@/src/lib/time";

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
      const fromDate = range.from;
      const toDate = range.to || range.from;
      const fromRange = startOfLocalDayUtcRange(fromDate);
      const toRange = startOfLocalDayUtcRange(toDate);
      onChange(fromRange.from, toRange.to);
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
          size="lg"
        >
          <CalendarIcon className="h-4 w-4" />
          {renderLabel()}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-fit" align="center" sideOffset={-114}>
        <div className="p-4 flex flex-col gap-4">
          <div className="space-y-1">
            <h4 className="font-medium">Выберите период</h4>
            <p className="text-xs text-white">
              Записи будут отфильтрованы по этому диапазону.
            </p>
          </div>

          <Calendar
            mode="range"
            locale={ru}
            selected={range}
            onSelect={setRange}
            autoFocus
            className="rounded-md border shadow-sm mx-auto"
            buttonVariant="link"
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
