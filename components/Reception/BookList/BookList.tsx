"use client";

import { useMemo } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
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
            {error instanceof Error
              ? error.message
              : "Произошла неизвестная ошибка"}
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
      <div className="rounded-xl border border-dashed py-10 text-center">
        <p className="text-sm text-muted-foreground">
          {appointments.length > 0
            ? "Нет записей, соответствующих фильтрам"
            : "На выбранный период записей не найдено"}
        </p>
      </div>
    );
  }

  return (
    <Command className="bg-transparent">
      <CommandInput
        className="text-base md:text-sm"
        placeholder="Поиск по имени клиента..."
      />
      <CommandList className="min-h-fit">
        <CommandEmpty>Ничего не найдено</CommandEmpty>
        <CommandGroup>
          {filteredAppointments.map((book) => (
            <CommandItem
              className="mt-3 w-full bg-background/70 rounded-4xl"
              key={book.id}
              value={`${book.client_name} ${book.service_name}`}
              variant="outline"
            >
              <ItemBook book={book} />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
