"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
import { Check, CheckCheck } from "lucide-react";
import {
  formatUtcIsoTime,
  fromUtcIso,
  isPastUtcIso,
  toUtcIso,
} from "@/src/lib/time";

interface DateBookProps {
  startValue: string | null;
  endValue: string | null;
  onChange: (startValue: string | null, endValue: string | null) => void;
}

const addMinutesToTime = (time: string, minutesToAdd: number) => {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return time;
  }
  const total = hours * 60 + minutes + minutesToAdd;
  const nextHours = Math.floor((total % (24 * 60)) / 60);
  const nextMinutes = total % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
};

export default function DateBook({
  startValue,
  endValue,
  onChange,
}: DateBookProps) {
  const [isOpened, setIsOpened] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    startValue ? fromUtcIso(startValue) : new Date(),
  );

  const [startTime, setStartTime] = useState(() => {
    if (startValue) return formatUtcIsoTime(startValue);
    return format(new Date(), "HH:mm");
  });

  const [endTime, setEndTime] = useState(() => {
    if (endValue) return formatUtcIsoTime(endValue);
    const base = startValue
      ? formatUtcIsoTime(startValue)
      : format(new Date(), "HH:mm");
    return addMinutesToTime(base, 60);
  });

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const combinedStartISO = useMemo(() => {
    if (!selectedDate || !startTime) return null;
    return toUtcIso(selectedDate, startTime);
  }, [selectedDate, startTime]);

  const combinedEndISO = useMemo(() => {
    if (!selectedDate || !endTime) return null;
    return toUtcIso(selectedDate, endTime);
  }, [selectedDate, endTime]);

  const isPast = useMemo(() => {
    if (!combinedStartISO) return false;
    return isPastUtcIso(combinedStartISO);
  }, [combinedStartISO]);

  const isInvalidRange = useMemo(() => {
    if (!combinedStartISO || !combinedEndISO) return false;
    return new Date(combinedEndISO) <= new Date(combinedStartISO);
  }, [combinedStartISO, combinedEndISO]);

  useEffect(() => {
    if (combinedStartISO !== startValue || combinedEndISO !== endValue) {
      onChangeRef.current?.(combinedStartISO, combinedEndISO);
    }
  }, [combinedStartISO, combinedEndISO, startValue, endValue]);

  const labelText = selectedDate
    ? `${format(selectedDate, "dd MMMM yyyy", { locale: ru })}, ${startTime} - ${endTime}`
    : "Выбрать дату и время";

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
              (isPast || isInvalidRange) &&
                "border-destructive/50 text-destructive",
            )}
          >
            {labelText}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="bg-white">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            defaultMonth={selectedDate}
            autoFocus
            locale={ru}
            disabled={{ before: new Date() }}
            className="rounded-md border shadow-sm mx-auto"
            buttonVariant="link"
          />

          <div className="border-t pt-2 w-full">
            <div className="flex w-full items-end gap-2">
              <div className="flex flex-col items-center gap-y-1 w-fit">
                <Label className="text-xs text-black/60">Начало</Label>
                <Input
                  type="time"
                  value={startTime}
                  onKeyDown={(e) => e.preventDefault()}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={cn(
                    "cursor-pointer text-black w-fit",
                    (isPast || isInvalidRange) &&
                      "border-destructive text-destructive focus-visible:ring-destructive",
                  )}
                />
              </div>
              <div className="flex flex-col items-center gap-y-1 w-fit">
                <Label className="text-xs text-black/60">Конец</Label>
                <Input
                  type="time"
                  value={endTime}
                  onKeyDown={(e) => e.preventDefault()}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={cn(
                    "cursor-pointer text-black w-fit",
                    isInvalidRange &&
                      "border-destructive text-destructive focus-visible:ring-destructive",
                  )}
                />
              </div>
              <Button
                type="button"
                className="bg-blue-600 h-12 w-12 md:h-10 md:w-10"
                onClick={() => setIsOpened(false)}
                disabled={isInvalidRange}
              >
                <CheckCheck />
              </Button>
            </div>

            {isInvalidRange ? (
              <p className="text-[10px] text-destructive text-center mt-2 font-semibold italic">
                Время окончания должно быть позже начала
              </p>
            ) : isPast ? (
              <p className="text-[10px] text-destructive text-center mt-2 font-semibold italic">
                Выбрано прошедшее время
              </p>
            ) : (
              <p className="text-[10px] text-green-500 text-center mt-2 font-semibold italic">
                Выбрано верно
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
