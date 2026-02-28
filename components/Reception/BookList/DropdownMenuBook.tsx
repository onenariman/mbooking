"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Edit2Icon,
  EllipsisVertical,
  MessageCircle,
  Phone,
  Trash2,
  UserX,
  XCircle,
} from "lucide-react";
import { isPastUtcIso } from "@/src/lib/time";
import { formatPriceInput } from "@/src/validators/formatPriceInput";
import { useUpdateAppointment } from "@/src/hooks/appointments.hooks";
import {
  ZodAppointment,
  ZodAppointmentStatus,
} from "@/src/schemas/books/bookSchema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { DeleteBook } from "./DeleteBook";
import { EditBook } from "./EditBook";

interface DropdownMenuBookProps {
  book: ZodAppointment;
}

export default function DropdownMenuBook({ book }: DropdownMenuBookProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [finalAmount, setFinalAmount] = useState(book.amount?.toString() || "");

  const { mutateAsync: updateAppointment, isPending } = useUpdateAppointment();

  const isPast = book.appointment_at
    ? isPastUtcIso(book.appointment_at)
    : false;
  const phone = book.client_phone;
  const whatsappPhone = phone.replace(/\D/g, "");

  const canComplete = isPast && book.status !== "completed";
  const canSetNoShow = isPast && book.status !== "no_show";

  const handleChangeStatus = async (status: ZodAppointmentStatus) => {
    if (status === book.status) {
      return;
    }

    try {
      await updateAppointment({ id: book.id, updates: { status } });
      toast.success("Статус обновлён");
    } catch {
      toast.error("Ошибка обновления");
    }
  };

  const handleComplete = async () => {
    const normalized = finalAmount.replace(/\s/g, "");
    const numericAmount = Number(normalized);

    if (!normalized || Number.isNaN(numericAmount)) {
      toast.error("Введите корректную сумму");
      return;
    }

    try {
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
          <Button variant="outline" size="icon">
            <EllipsisVertical size={20} className="text-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem
            onClick={() => setShowCompleteDialog(true)}
            disabled={isPending || !canComplete}
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
            disabled={isPending || !canSetNoShow}
          >
            <UserX className="mr-2 h-4 w-4 text-red-500" />
            Не пришёл
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <a href={`tel:${phone}`}>
              <Phone className="h-4 w-4" />
              Позвонить
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem asChild disabled={!whatsappPhone}>
            <a
              href={`https://wa.me/${whatsappPhone}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4 text-green-500" />
              WhatsApp
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowEdit(true)}>
            <Edit2Icon className="h-4 w-4 text-blue-500" />
            Изменить
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setShowDelete(true)}
            className="text-red-500 focus:bg-red-50 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            Удалить
          </DropdownMenuItem>

          {!isPast && (
            <>
              <DropdownMenuSeparator />
              <div className="flex items-center px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <Clock className="mr-1.5 h-3 w-3" />
                Будущая запись
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-[350px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Завершение процедуры</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="amount"
                className="text-xs font-bold uppercase text-muted-foreground"
              >
                Итоговая стоимость (₽)
              </Label>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                value={finalAmount}
                onChange={(event) =>
                  setFinalAmount(formatPriceInput(event.target.value))
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

      <EditBook book={book} open={showEdit} onOpenChange={setShowEdit} />
      <DeleteBook id={book.id} open={showDelete} onOpenChange={setShowDelete} />
    </>
  );
}
