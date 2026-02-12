"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarSearch, ChevronDownIcon } from "lucide-react";
import { formatDate } from "@/src/helpers/formatDate";

const DateBook = () => {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  return (
    <div>
      <FieldGroup className="flex-row">
        <Field>
          {/* <FieldLabel htmlFor="date-picker-optional">Дата</FieldLabel> */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                id="date-picker-optional"
                className="w-32 justify-between font-normal"
              >
                <span className="flex items-center gap-x-2 font-medium">
                  <CalendarSearch />
                  {date ? formatDate(date) : "Выбрать дату"}
                </span>
                <ChevronDownIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="start"
            >
              <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                defaultMonth={date}
                onSelect={(date) => {
                  setDate(date);
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </Field>
        <Field className="w-fit">
          {/* <FieldLabel htmlFor="time-picker-optional">Время</FieldLabel> */}
          <Input
            type="time"
            id="time-picker-optional"
            defaultValue="10:30"
            className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          />
        </Field>
      </FieldGroup>
    </div>
  );
};

export default DateBook;
