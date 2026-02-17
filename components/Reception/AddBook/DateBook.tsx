"use client";

import * as React from "react";
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

type DateBookProps = {
  value: string | null; // локальная дата в формате "YYYY-MM-DDTHH:mm:00"
  onChange: (val: string | null) => void;
};

export default function DateBook({ value, onChange }: DateBookProps) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>();
  const [time, setTime] = React.useState("12:00");

  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // синхронизация с внешним value
  React.useEffect(() => {
    if (!value) return;
    const dt = new Date(value);
    setDate(dt);
    setTime(
      `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`,
    );
  }, [value]);

  // Генерация локальной строки для хранения без UTC смещения
  const getLocalISOString = (date: Date, time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`; // локальное время без Z
  };

  const selectedDateTime = React.useMemo(() => {
    if (!date || !time) return null;
    return getLocalISOString(date, time);
  }, [date, time]);

  const isPastTime = React.useMemo(() => {
    if (!date || !time) return false;
    const [hours, minutes] = time.split(":").map(Number);
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d.getTime() < new Date().getTime();
  }, [date, time]);

  const handleApply = () => {
    if (!selectedDateTime || isPastTime) return;
    onChange(selectedDateTime); // сохраняем локальное время в форме
    setOpen(false);
  };

  const renderLabel = () => {
    if (!selectedDateTime) return "Выберите дату и время";
    const [datePart, timePart] = selectedDateTime.split("T");
    const [yyyy, mm, dd] = datePart.split("-");
    return `${dd}.${mm}.${yyyy} ${timePart.slice(0, 5)}`;
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
          <h4 className="font-medium leading-none">Дата и время</h4>
          <p className="text-sm text-muted-foreground">
            Выберите день и время записи.
          </p>
        </div>

        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={{ before: today }}
          locale={ru}
          className="rounded-md border w-fit mx-auto"
        />

        <div className="flex items-center justify-center border gap-2 bg-gray-100 px-3 py-1 rounded-4xl">
          <Label className="text-xs text-muted-foreground">Время:</Label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-[100px] border-none bg-transparent focus-visible:ring-0 h-8"
          />
        </div>

        {selectedDateTime && isPastTime && (
          <p className="text-red-500 text-center text-xs font-medium">
            ⚠️ Время в прошлом
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1"
            disabled={!selectedDateTime || isPastTime}
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
