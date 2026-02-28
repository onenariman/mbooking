"use client";

import type { ComponentProps } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  ZodAppointment,
  ZodAppointmentStatus,
} from "@/src/schemas/books/bookSchema";
import DropdownMenuBook from "./DropdownMenuBook";

interface ItemProps {
  book: ZodAppointment;
}

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const statusLabels: Record<ZodAppointmentStatus, string> = {
  booked: "Запланировано",
  completed: "Завершено",
  cancelled: "Отменено",
  no_show: "Не пришёл",
};

const statusToBadgeVariant: Record<ZodAppointmentStatus, BadgeVariant> = {
  booked: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "outline",
};

const ItemBook = ({ book }: ItemProps) => {
  return (
    <div className="flex w-full items-center justify-between text-foreground p-2">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-col items-start">
          <span>{book.client_name}</span>
          <span className="text-muted-foreground">{book.service_name}</span>
        </div>

        {book.appointment_at && (
          <div className="flex items-center gap-x-1 text-sm text-muted-foreground">
            <span>
              {format(new Date(book.appointment_at), "dd MMMM HH:mm", {
                locale: ru,
              })}
            </span>
          </div>
        )}

        <div className="flex items-center gap-x-2">
          <Badge variant={statusToBadgeVariant[book.status]}>
            {statusLabels[book.status]}
          </Badge>

          {book.amount !== null && (
            <Badge
              className="text-sm"
              variant={statusToBadgeVariant[book.status]}
            >
              {book.amount.toLocaleString("ru-RU")} ₽
            </Badge>
          )}
        </div>
      </div>

      <div className="ml-3 shrink-0">
        <DropdownMenuBook book={book} />
      </div>
    </div>
  );
};

export default ItemBook;
