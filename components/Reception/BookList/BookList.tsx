"use client";

import { AlertCircle, RefreshCcw } from "lucide-react"; // Иконки для красоты
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";

import ItemBook from "./ItemBook";
import { useAppointments } from "@/src/hooks/appointments.hooks";
import { ZodAppointment } from "@/src/schemas/books/bookSchema";
import { Spinner } from "@/components/ui/spinner";

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
    refetch, // Достаем функцию перезапроса
  } = useAppointments({ from, to });

  // 1. Обработка загрузки (Skeleton или Spinner)
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <Spinner />
        <p className="text-sm text-muted-foreground">Загрузка записей...</p>
      </div>
    );
  }

  // 2. Улучшенная обработка ошибки
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed border-destructive/20 rounded-xl bg-destructive/5 gap-3">
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

  const filtered = appointments.filter((book) => {
    const matchCategory =
      selectedCategory === "all" || book.category_name === selectedCategory;
    const matchStatus =
      selectedStatus === "all" || book.status === selectedStatus;
    return matchCategory && matchStatus;
  });

  // 3. Состояние "Пусто" (дифференцируем: вообще нет данных или всё скрыто фильтрами)
  if (filtered.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed rounded-xl">
        <p className="text-sm text-muted-foreground">
          {appointments.length > 0
            ? "Нет записей, соответствующих фильтрам"
            : "На выбранный период записей не найдено"}
        </p>
      </div>
    );
  }

  return (
    <Command>
      <CommandInput placeholder="Поиск по имени клиента..." />
      <CommandList className="border-none">
        <CommandEmpty>Ничего не найдено</CommandEmpty>
        <CommandGroup>
          {filtered.map((book: ZodAppointment) => (
            <CommandItem
              key={book.id}
              value={`${book.client_name} ${book.service_name}`}
              className="backdrop-blur-md border-none rounded-xl p-4 shadow-md mt-2"
            >
              <ItemBook book={book} />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
