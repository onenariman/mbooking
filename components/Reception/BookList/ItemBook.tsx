"use client";

import {
  ZodAppointment,
  ZodAppointmentStatus,
} from "@/src/schemas/books/bookSchema";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import DropdownMenuBook from "./DropdownMenuBook";
import { Badge } from "@/components/ui/badge";

interface ItemProps {
  book: ZodAppointment;
}

const statusLabels: Record<ZodAppointmentStatus, string> = {
  booked: "Запланировано",
  completed: "Завершено",
  cancelled: "Отменено",
  no_show: "Не пришёл",
};

const ItemBook = ({ book }: ItemProps) => {
  return (
    <div className="w-full flex justify-between items-start p-1">
      <div className="flex flex-col gap-1">
        {/* Имя и услуга */}
        <div className="flex flex-col items-start">
          <span className="font-semibold leading-none text-sm md:text-base">
            {book.client_name}
          </span>
          <span className="text-xs md:text-sm text-muted-foreground">
            {book.service_name}
          </span>
        </div>

        {/* Дата и время */}
        <div className="flex items-center gap-x-1 text-[11px] md:text-xs text-green-600 font-medium">
          {book.appointment_at && (
            <span>
              {format(new Date(book.appointment_at), "dd MMMM HH:mm", {
                locale: ru,
              })}
            </span>
          )}
        </div>

        {/* Статус и Цена */}
        <div className="flex items-center gap-x-2 mt-1">
          {/* Здесь variant={book.status} теперь работает идеально! */}
          <Badge variant={book.status}>{statusLabels[book.status]}</Badge>

          {book.amount !== null && (
            <span className="text-sm font-bold text-foreground">
              {book.amount.toLocaleString("ru-RU")} ₽
            </span>
          )}
        </div>
      </div>

      {/* Меню действий */}
      <DropdownMenuBook book={book} />
    </div>
  );
};

export default ItemBook;
