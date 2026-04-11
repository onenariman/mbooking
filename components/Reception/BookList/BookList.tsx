"use client";

import { useMemo } from "react";
import { AlertCircle, CalendarSearch, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Spinner } from "@/components/ui/spinner";
import { useAppointments } from "@/src/hooks/appointments.hooks";
import ItemBook from "./ItemBook";
import { getErrorMessage } from "@/src/helpers/getErrorMessage";

interface BookListProps {
  from: string | null;
  to: string | null;
  selectedCategory: string;
  selectedStatus: string;
}

export default function BookList({
  from,
  to,
  selectedCategory,
  selectedStatus,
}: BookListProps) {
  const {
    data: appointments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAppointments({ from, to });

  const filteredAppointments = useMemo(() => {
    return appointments.filter((book) => {
      const matchesCategory =
        selectedCategory === "all" || book.category_name === selectedCategory;
      const matchesStatus =
        selectedStatus === "all" || book.status === selectedStatus;

      return matchesCategory && matchesStatus;
    });
  }, [appointments, selectedCategory, selectedStatus]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10">
        <Spinner />
        <p className="text-sm text-muted-foreground">Загрузка записей...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-destructive/20 bg-destructive/5 px-4 py-10">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div className="text-center">
          <p className="font-semibold text-destructive">
            Не удалось загрузить данные
          </p>
          <p className="text-xs text-muted-foreground">
            {getErrorMessage(error, "Произошла неизвестная ошибка")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCcw size={14} />
          Повторить попытку
        </Button>
      </div>
    );
  }

  if (filteredAppointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/15 px-5 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CalendarSearch className="size-7 opacity-90" strokeWidth={1.75} />
        </div>
        <p className="text-sm font-medium text-foreground">
          {appointments.length > 0
            ? "Нет записей по фильтрам"
            : "На этот период записей нет"}
        </p>
        <p className="max-w-[260px] text-xs leading-relaxed text-muted-foreground">
          {appointments.length > 0
            ? "Смените категорию, статус или даты."
            : "Выберите другой диапазон дат или создайте новую запись."}
        </p>
      </div>
    );
  }

  return (
    <Command className="rounded-2xl border border-border/60 bg-muted/10 p-2 shadow-sm md:p-2.5">
      <CommandInput
        className="text-base md:text-sm"
        placeholder="Поиск по имени или услуге…"
      />
      <CommandList className="max-h-[min(70vh,520px)]">
        <CommandEmpty className="py-10 text-sm text-muted-foreground">
          Ничего не найдено
        </CommandEmpty>
        <CommandGroup className="p-0 pt-2">
          {filteredAppointments.map((book) => (
            <CommandItem
              className="mb-2 w-full rounded-2xl border border-border/70 bg-transparent px-0 py-0 last:mb-0 data-[selected=true]:border-border data-[selected=true]:bg-muted/30 aria-selected:bg-muted/25"
              key={book.id}
              value={`${book.client_name} ${book.service_name}`}
              variant="default"
            >
              <div className="w-full p-3.5 md:p-4">
                <ItemBook book={book} />
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
