"use client";

import { useState } from "react";
import dayjs from "dayjs";
import {
  ZodAppointment,
  ZodAppointmentStatus,
} from "@/src/schemas/books/bookSchema";
import { useUpdateAppointment } from "@/src/hooks/appointments.hooks";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  XCircle,
  UserX,
  Trash2,
  Phone,
  MessageCircle,
  Clock,
  Edit2Icon,
  EllipsisVertical,
} from "lucide-react";
import { EditBook } from "./EditBook";
import { DeleteBook } from "./DeleteBook";

export default function DropdownMenuBook({ book }: { book: ZodAppointment }) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { mutateAsync: updateStatus, isPending } = useUpdateAppointment();

  const isPast = book.appointment_at
    ? dayjs(book.appointment_at).isBefore(dayjs())
    : false;
  const phone = book.client_phone;

  const handleChangeStatus = async (status: ZodAppointmentStatus) => {
    if (status === book.status) return;
    try {
      await updateStatus({ id: book.id, updates: { status } });
      toast.success("Статус обновлён");
    } catch {
      toast.error("Ошибка обновления");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 rounded hover:bg-muted transition">
            <EllipsisVertical size={20} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem
            onClick={() => handleChangeStatus("completed")}
            disabled={isPending || !isPast}
          >
            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Завершить
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleChangeStatus("cancelled")}
            disabled={isPending}
          >
            <XCircle className="mr-2 h-4 w-4 text-orange-500" /> Отменить
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleChangeStatus("no_show")}
            disabled={isPending || !isPast}
          >
            <UserX className="mr-2 h-4 w-4 text-red-500" /> Не пришёл
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <a href={`tel:${phone}`}>
              <Phone className="mr-2 h-4 w-4" /> Позвонить
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="mr-2 h-4 w-4 text-green-500" /> WhatsApp
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowEdit(true)}>
            <Edit2Icon className="mr-2 h-4 w-4 text-blue-500" /> Изменить
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDelete(true)}
            className="text-red-500 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Удалить
          </DropdownMenuItem>

          {!isPast && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1 text-xs text-muted-foreground flex items-center">
                <Clock className="mr-1 h-3 w-3" /> Будущая запись
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Выносные компоненты (диалоги и шторки) */}
      <EditBook book={book} open={showEdit} onOpenChange={setShowEdit} />
      <DeleteBook id={book.id} open={showDelete} onOpenChange={setShowDelete} />
    </>
  );
}
