"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { cn } from "@/src/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react"; // Добавил иконку для красоты

interface DateBookProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export default function DateBook({ value, onChange }: DateBookProps) {
  // Состояние для управления открытием поповера
  const [isOpened, setIsOpened] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? new Date(value) : new Date(),
  );

  const [time, setTime] = useState(() => {
    if (value) return dayjs(value).format("HH:mm");
    return dayjs().format("HH:mm");
  });

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const combinedISO = useMemo(() => {
    if (!selectedDate || !time) return null;
    const [h, m] = time.split(":").map(Number);
    const hours = Math.min(Math.max(isNaN(h) ? 0 : h, 0), 23);
    const minutes = Math.min(Math.max(isNaN(m) ? 0 : m, 0), 59);

    const result = dayjs(selectedDate)
      .hour(hours)
      .minute(minutes)
      .second(0)
      .millisecond(0);
    return result.isValid() ? result.toISOString() : null;
  }, [selectedDate, time]);

  const isPast = useMemo(() => {
    if (!combinedISO) return false;
    return dayjs(combinedISO).isBefore(dayjs().subtract(1, "minute"));
  }, [combinedISO]);

  useEffect(() => {
    if (combinedISO !== value) {
      onChangeRef.current?.(combinedISO);
    }
  }, [combinedISO, value]);

  return (
    <div className="space-y-2">
      <Label>Дата и время</Label>
      <Popover open={isOpened} onOpenChange={setIsOpened}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-medium",
              !selectedDate && "text-muted-foreground",
              isPast && "border-destructive/50 text-destructive",
            )}
          >
            {selectedDate
              ? `${format(selectedDate, "dd MMMM yyyy", { locale: ru })}, ${time}`
              : "Выбрать дату и время"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            defaultMonth={selectedDate}
            autoFocus
            locale={ru}
            disabled={{ before: new Date() }}
            className="rounded-md border-none"
          />

          <div className="flex items-center gap-2 mt-2 pt-2 border-t">
            <Input
              type="time"
              value={time}
              onKeyDown={(e) => e.preventDefault()}
              onChange={(e) => setTime(e.target.value)}
              className={cn(
                "cursor-pointer",
                isPast &&
                  "border-destructive text-destructive focus-visible:ring-destructive",
              )}
            />
            <Button
              type="button"
              className="h-10"
              onClick={() => setIsOpened(false)}
            >
              <Check />
              OK
            </Button>
          </div>

          {isPast ? (
            <p className="text-[10px] text-destructive text-center mt-2 font-semibold italic">
              Выбрано прошедшее время
            </p>
          ) : (
            <p className="text-[10px] text-green-500  text-center mt-2 font-semibold italic">
              Выбрано верно
            </p>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
