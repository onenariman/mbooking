"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Edit2Icon,
  EllipsisVertical,
  MessageCircle,
  Phone,
  Send,
  Trash2,
  UserX,
  XCircle,
} from "lucide-react";
import { isPastUtcIso } from "@/src/lib/time";
import { formatPriceInput } from "@/src/validators/formatPriceInput";
import { useUpdateAppointment } from "@/src/hooks/appointments.hooks";
import { useCreateFeedbackToken } from "@/src/hooks/feedback.hooks";
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
import { getErrorMessage } from "@/src/helpers/getErrorMessage";

interface DropdownMenuBookProps {
  book: ZodAppointment;
}

export default function DropdownMenuBook({ book }: DropdownMenuBookProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [finalAmount, setFinalAmount] = useState(book.amount?.toString() || "");

  const { mutateAsync: updateAppointment, isPending } = useUpdateAppointment();
  const { mutateAsync: createFeedbackToken, isPending: isCreatingToken } =
    useCreateFeedbackToken();

  const isPast = book.appointment_at ? isPastUtcIso(book.appointment_at) : false;
  const phone = book.client_phone;
  const whatsappPhone = phone.replace(/\D/g, "");

  const reminderMessageText = useMemo(() => {
    if (!book.appointment_at) {
      return "Здравствуйте! Напоминаем о записи. Если есть вопросы, напишите или позвоните.";
    }

    const formatted = format(new Date(book.appointment_at), "dd MMMM HH:mm", {
      locale: ru,
    });

    return `Мумина Эксперт\n\nПривет. Напоминаю о записи на ${formatted}\n\nСообщение сгенерировано автоматически.`;
  }, [book.appointment_at]);

  const encodedReminderMessage = encodeURIComponent(reminderMessageText);

  const canComplete = isPast && book.status !== "completed";
  const canSetNoShow = isPast && book.status !== "no_show";

  const handleChangeStatus = async (status: ZodAppointmentStatus) => {
    if (status === book.status) {
      return;
    }

    try {
      await updateAppointment({ id: book.id, updates: { status } });
      toast.success("Статус обновлен");
    } catch {
      toast.error("Ошибка обновления статуса");
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

  const handleSendFeedback = async () => {
    try {
      const token = await createFeedbackToken("14 days");
      const appBaseUrl = (
        process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      ).replace(/\/$/, "");
      const feedbackLink = `${appBaseUrl}/feedback/${token}`;
      const feedbackMessage = [
        "Пожалуйста, оставьте анонимный отзыв.",
        "",
        feedbackLink,
        "",
        "Спасибо!",
      ].join("\n");
      const encodedFeedbackMessage = encodeURIComponent(feedbackMessage);

      if (whatsappPhone) {
        window.open(
          `https://wa.me/${whatsappPhone}?text=${encodedFeedbackMessage}`,
          "_blank",
          "noopener,noreferrer",
        );
        toast.success("Ссылка на отзыв открыта в WhatsApp");
        return;
      }

      if (phone.trim()) {
        window.location.href = `sms:${phone}?&body=${encodedFeedbackMessage}`;
        toast.success("Ссылка на отзыв добавлена в SMS");
        return;
      }

      await navigator.clipboard.writeText(feedbackLink);
      toast.success("Ссылка на отзыв скопирована");
    } catch (error) {
      toast.error(getErrorMessage(error, "Ошибка отправки ссылки"));
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
            Не пришел
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <a href={`sms:${phone}?&body=${encodedReminderMessage}`}>
              <MessageCircle className="h-4 w-4 text-blue-500" />
              Сообщение
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <a href={`tel:${phone}`}>
              <Phone className="h-4 w-4" />
              Позвонить
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleSendFeedback}
            disabled={isCreatingToken || (!phone.trim() && !whatsappPhone)}
          >
            <Send className="h-4 w-4 text-foreground" />
            Отзыв
          </DropdownMenuItem>

          <DropdownMenuItem asChild disabled={!whatsappPhone}>
            <a
              href={`https://wa.me/${whatsappPhone}?text=${encodedReminderMessage}`}
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
