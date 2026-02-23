"use client";

import { useState } from "react";
import { toast } from "sonner";
import { isPastUtcIso } from "@/src/lib/time";
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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  ZodAppointment,
  ZodAppointmentStatus,
} from "@/src/schemas/books/bookSchema";
import { useUpdateAppointment } from "@/src/hooks/appointments.hooks";
import { formatPriceInput } from "@/src/validators/formatPriceInput";
import { EditBook } from "./EditBook";
import { DeleteBook } from "./DeleteBook";
import { Spinner } from "@/components/ui/spinner";

export default function DropdownMenuBook({ book }: { book: ZodAppointment }) {
  // Состояния для модальных окон
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  // Состояние для ввода финальной суммы
  const [finalAmount, setFinalAmount] = useState(book.amount?.toString() || "");

  const { mutateAsync: updateAppointment, isPending } = useUpdateAppointment();

  const isPast = book.appointment_at ? isPastUtcIso(book.appointment_at) : false;
  const phone = book.client_phone;

  // Универсальная функция смены статуса (кроме завершения)
  const handleChangeStatus = async (status: ZodAppointmentStatus) => {
    if (status === book.status) return;
    try {
      await updateAppointment({ id: book.id, updates: { status } });
      toast.success("Статус обновлён");
    } catch {
      toast.error("Ошибка обновления");
    }
  };

  // Специальная функция для завершения записи с вводом суммы
  const handleComplete = async () => {
    try {
      const numericAmount = Number(finalAmount.replace(/\s/g, ""));
      await updateAppointment({
        id: book.id,
        updates: {
          status: "completed",
          amount: numericAmount,
        },
      });
      toast.success("Запись успешно завершена");
      setShowCompleteDialog(false);
    } catch {
      toast.error("Ошибка при сохранении суммы");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 rounded-md hover:bg-muted transition-colors outline-none">
            <EllipsisVertical size={20} className="text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-60">
          {/* Статусы */}
          <DropdownMenuItem
            onClick={() => setShowCompleteDialog(true)}
            disabled={isPending || book.status === "completed" || !isPast}
          >
            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
            Завершить...
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleChangeStatus("cancelled")}
            disabled={isPending || book.status === "cancelled"}
          >
            <XCircle className="mr-2 h-4 w-4 text-orange-500" />
            Отменить
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleChangeStatus("no_show")}
            disabled={isPending || book.status === "no_show" || !isPast}
          >
            <UserX className="mr-2 h-4 w-4 text-red-500" />
            Не пришёл
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Контакты */}
          <DropdownMenuItem asChild>
            <a href={`tel:${phone}`}>
              <Phone className="mr-2 h-4 w-4" /> Позвонить
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`https://wa.me/${phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="mr-2 h-4 w-4 text-green-500" /> WhatsApp
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Действия */}
          <DropdownMenuItem onClick={() => setShowEdit(true)}>
            <Edit2Icon className="mr-2 h-4 w-4 text-blue-500" /> Изменить
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setShowDelete(true)}
            className="text-red-500 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Удалить
          </DropdownMenuItem>

          {!isPast && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground flex items-center font-bold">
                <Clock className="mr-1.5 h-3 w-3" /> Будущая запись
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Диалог ввода суммы при завершении */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-[350px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Завершение процедуры</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="amount"
                className="text-xs uppercase text-muted-foreground font-bold"
              >
                Итоговая стоимость (₽)
              </Label>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                value={finalAmount}
                onChange={(e) =>
                  setFinalAmount(formatPriceInput(e.target.value))
                }
                placeholder="0"
                className="text-lg font-semibold"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleComplete}
              disabled={isPending}
              className="w-full rounded-xl"
            >
              {isPending ? <Spinner className="mr-2" /> : "Подтвердить доход"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Шторка редактирования и Диалог удаления */}
      <EditBook book={book} open={showEdit} onOpenChange={setShowEdit} />
      <DeleteBook id={book.id} open={showDelete} onOpenChange={setShowDelete} />
    </>
  );
}
