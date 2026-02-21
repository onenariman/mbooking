"use client";

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

interface BookListProps {
  from: string | null;
  to: string | null;
  selectedCategory: string; // Добавили проп
  selectedStatus: string; // Новый проп
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
  } = useAppointments({ from, to });

  // ФИЛЬТРАЦИЯ: Оставляем только те записи, которые подходят под категорию
  const filtered = appointments.filter((book) => {
    // 1. Фильтр по категории
    const matchCategory =
      selectedCategory === "all" || book.category_name === selectedCategory;

    // 2. Фильтр по статусу
    const matchStatus =
      selectedStatus === "all" || book.status === selectedStatus;

    // Запись проходит, если соответствует обоим фильтрам
    return matchCategory && matchStatus;
  });

  if (isLoading) return <p className="text-center text-sm">Загрузка...</p>;

  // Показываем отфильтрованные записи вместо всех
  if (filtered.length === 0)
    return <p className="text-center text-sm">Записи не найдены</p>;

  return (
    <Command>
      <CommandInput placeholder="Найти запись" />
      <CommandList>
        <CommandEmpty>Записи не найдены</CommandEmpty>
        <CommandGroup>
          {filtered.map((book: ZodAppointment) => (
            <CommandItem
              key={book.id}
              value={`${book.client_name} ${book.service_name}`}
              className="border my-2 rounded-md"
            >
              <ItemBook book={book} />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
