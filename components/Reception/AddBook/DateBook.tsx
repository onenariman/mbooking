"use client";

import * as React from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ru } from "date-fns/locale";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarSearch, ChevronDownIcon } from "lucide-react";
import { Label } from "@/components/ui/label";

dayjs.extend(utc);

type DateBookProps = {
  value: string | null; // ISO string (UTC)
  onChange: (val: string | null) => void;
};

export default function DateBook({ value, onChange }: DateBookProps) {
  const getCurrentTime = () => dayjs().format("HH:mm");
  const [open, setOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();
  const [time, setTime] = React.useState(getCurrentTime);

  React.useEffect(() => {
    if (open) {
      setTime(dayjs().format("HH:mm"));
    }
  }, [open]);

  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Синхронизация с внешним ISO
  React.useEffect(() => {
    if (!value) return;

    const local = dayjs(value).local();
    setSelectedDate(local.toDate());
    setTime(local.format("HH:mm"));
  }, [value]);

  // Объединяем дату и время
  const combined = React.useMemo(() => {
    if (!selectedDate) return null;

    const [hours, minutes] = time.split(":").map(Number);

    return dayjs(selectedDate)
      .hour(hours)
      .minute(minutes)
      .second(0)
      .millisecond(0);
  }, [selectedDate, time]);

  const isPastTime = React.useMemo(() => {
    if (!combined) return false;
    return combined.isBefore(dayjs());
  }, [combined]);

  const handleApply = () => {
    if (!combined) return;

    // 👉 ВАЖНО: сохраняем в UTC
    const isoUTC = combined.utc().toISOString();

    onChange(isoUTC);
    setOpen(false);
  };

  const renderLabel = () => {
    if (!combined) return "Выберите дату и время";
    return combined.format("DD.MM.YYYY HH:mm");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            <CalendarSearch className="h-4 w-4" />
            {renderLabel()}
          </span>
          <ChevronDownIcon className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-4 flex flex-col gap-4"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="space-y-2">
          <h4 className="font-medium">Дата и время</h4>
          <p className="text-sm text-muted-foreground">
            Выберите день и время записи
          </p>
        </div>

        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={{ before: today }}
          locale={ru}
          className="rounded-md border w-fit mx-auto"
        />

        <div className="flex items-center justify-center border gap-2 bg-gray-100 px-3 py-1 rounded-2xl">
          <Label className="text-xs text-muted-foreground">Время:</Label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-[100px] border-none bg-transparent focus-visible:ring-0 h-8"
          />
        </div>

        {combined && isPastTime && (
          <p className="text-red-500 text-center text-xs font-medium">
            ⚠ Время в прошлом
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1"
            disabled={!combined || isPastTime}
            onClick={handleApply}
          >
            Применить
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
