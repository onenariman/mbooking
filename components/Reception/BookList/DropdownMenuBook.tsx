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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/src/helpers/getErrorMessage";
import {
  useCompleteAppointment,
  useUpdateAppointment,
} from "@/src/hooks/appointments.hooks";
import { useDiscounts } from "@/src/hooks/discounts.hooks";
import { useCreateFeedbackToken } from "@/src/hooks/feedback.hooks";
import { formatAppointmentLabel } from "@/src/lib/appointments/formatAppointmentLabel";
import { notifyAppointmentPushEvent } from "@/src/lib/push/appointments";
import { isPastUtcIso } from "@/src/lib/time";
import {
  ZodAppointment,
  ZodAppointmentStatus,
} from "@/src/schemas/books/bookSchema";
import { formatPriceInput } from "@/src/validators/formatPriceInput";
import { normalizePhone } from "@/src/validators/normalizePhone";
import { DeleteBook } from "./DeleteBook";
import { EditBook } from "./EditBook";

interface DropdownMenuBookProps {
  book: ZodAppointment;
}

const parsePriceInput = (value: string) => {
  const normalized = value.replace(/\s/g, "");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

export default function DropdownMenuBook({ book }: DropdownMenuBookProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [finalAmount, setFinalAmount] = useState(book.amount?.toString() || "");
  const [serviceAmount, setServiceAmount] = useState(
    book.service_amount?.toString() || book.amount?.toString() || "",
  );
  const [extraAmount, setExtraAmount] = useState(
    book.extra_amount?.toString() || "",
  );

  const { mutateAsync: updateAppointment, isPending: isUpdatingAppointment } =
    useUpdateAppointment();
  const { mutateAsync: completeAppointment, isPending: isCompletingAppointment } =
    useCompleteAppointment();
  const { mutateAsync: createFeedbackToken, isPending: isCreatingToken } =
    useCreateFeedbackToken();
  const { data: activeDiscounts = [] } = useDiscounts({
    phone: book.applied_discount_id ? book.client_phone : null,
    isUsed: false,
  });

  const isPast = book.appointment_at ? isPastUtcIso(book.appointment_at) : false;
  const rawPhone = book.client_phone;
  const normalizedPhone = normalizePhone(rawPhone);
  const phone = normalizedPhone || rawPhone.trim();
  const whatsappPhone = normalizedPhone || rawPhone.replace(/\D/g, "");
  const appliedDiscount =
    activeDiscounts.find((discount) => discount.id === book.applied_discount_id) ??
    null;

  const reminderMessageText = useMemo(() => {
    if (!book.appointment_at) {
      return "Здравствуйте! Напоминаем о записи. Если есть вопросы, напишите или позвоните.";
    }

    const formatted = format(new Date(book.appointment_at), "dd MMMM HH:mm", {
      locale: ru,
    });

    return `Муминa Эксперт\n\nПривет. Напоминаю о записи на ${formatted}\n\nСообщение сгенерировано автоматически.`;
  }, [book.appointment_at]);

  const encodedReminderMessage = encodeURIComponent(reminderMessageText);
  const canComplete = isPast && book.status !== "completed";
  const canSetNoShow = isPast && book.status !== "no_show";
  const isUpdatingStatus = isUpdatingAppointment || isCompletingAppointment;

  const serviceAmountNumber = parsePriceInput(serviceAmount);
  const extraAmountNumber = parsePriceInput(extraAmount) ?? 0;
  const previewDiscountAmount =
    appliedDiscount && serviceAmountNumber !== null
      ? Math.round((serviceAmountNumber * appliedDiscount.discount_percent) / 100)
      : null;
  const previewFinalAmount =
    appliedDiscount && serviceAmountNumber !== null && previewDiscountAmount !== null
      ? Math.max(serviceAmountNumber - previewDiscountAmount, 0) + extraAmountNumber
      : null;

  const handleChangeStatus = async (status: ZodAppointmentStatus) => {
    if (status === book.status) {
      return;
    }

    try {
      const updatedAppointment = await updateAppointment({
        id: book.id,
        updates: { status },
      });

      if (status === "cancelled") {
        void notifyAppointmentPushEvent({
          appointmentId: updatedAppointment.id,
          appointmentLabel: formatAppointmentLabel(
            book.appointment_at,
            book.appointment_end,
          ),
          event: "cancelled",
        });
      }

      toast.success("Статус обновлен");
    } catch {
      toast.error("Ошибка обновления статуса");
    }
  };

  const handleComplete = async () => {
    try {
      const result = await (book.applied_discount_id
        ? appliedDiscount
          ? (() => {
              if (serviceAmountNumber === null) {
                toast.error("Введите стоимость услуги");
                return null;
              }

              return completeAppointment({
                id: book.id,
                extra_amount: extraAmountNumber,
                service_amount: serviceAmountNumber,
              });
            })()
          : (() => {
              const numericAmount = parsePriceInput(finalAmount);

              if (numericAmount === null) {
                toast.error("Введите итоговую стоимость");
                return null;
              }

              return completeAppointment({
                id: book.id,
                amount: numericAmount,
                ignore_discount: true,
              });
            })()
        : (() => {
            const numericAmount = parsePriceInput(finalAmount);

            if (numericAmount === null) {
              toast.error("Введите итоговую стоимость");
              return null;
            }

            return completeAppointment({
              id: book.id,
              amount: numericAmount,
            });
          })());

      if (!result) {
        return;
      }

      setShowCompleteDialog(false);

      try {
        await navigator.clipboard.writeText(result.feedback_url);
        toast.success("Запись успешно завершена", {
          description: "Ссылка на отзыв скопирована в буфер обмена",
        });
      } catch {
        toast.success("Запись успешно завершена", {
          description: result.feedback_url,
        });
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Ошибка завершения записи"));
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
        window.location.assign(`sms:${phone}?&body=${encodedFeedbackMessage}`);
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
            disabled={isUpdatingStatus || !canComplete}
            className="text-emerald-900 dark:text-emerald-200 focus:bg-emerald-500/12 focus:text-emerald-950 dark:focus:bg-emerald-500/18 dark:focus:text-emerald-50 focus:[&_svg]:text-emerald-600 dark:focus:[&_svg]:text-emerald-400"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Завершить...
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleChangeStatus("cancelled")}
            disabled={isUpdatingStatus || book.status === "cancelled"}
            className="text-amber-950 dark:text-amber-100 focus:bg-amber-500/14 focus:text-amber-950 dark:focus:bg-amber-500/20 dark:focus:text-amber-50 focus:[&_svg]:text-amber-600 dark:focus:[&_svg]:text-amber-400"
          >
            <XCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Отменить
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleChangeStatus("no_show")}
            disabled={isUpdatingStatus || !canSetNoShow}
            className="text-rose-950 dark:text-rose-100 focus:bg-rose-500/12 focus:text-rose-950 dark:focus:bg-rose-500/18 dark:focus:text-rose-50 focus:[&_svg]:text-rose-600 dark:focus:[&_svg]:text-rose-400"
          >
            <UserX className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            Не пришел
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <a href={`sms:${phone}?&body=${encodedReminderMessage}`}>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              Сообщение
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <a href={`tel:${phone}`}>
              <Phone className="h-4 w-4 text-muted-foreground" />
              Позвонить
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleSendFeedback}
            disabled={isCreatingToken || (!phone.trim() && !whatsappPhone)}
          >
            <Send className="h-4 w-4 text-muted-foreground" />
            Отзыв
          </DropdownMenuItem>

          <DropdownMenuItem asChild disabled={!whatsappPhone}>
            <a
              href={`https://wa.me/${whatsappPhone}?text=${encodedReminderMessage}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              WhatsApp
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowEdit(true)}>
            <Edit2Icon className="h-4 w-4 text-blue-500" />
            Изменить
          </DropdownMenuItem>

          <DropdownMenuItem variant="destructive" onClick={() => setShowDelete(true)}>
            <Trash2 />
            Удалить
          </DropdownMenuItem>

          {!isPast && (
            <>
              <DropdownMenuSeparator />
              <div className="flex items-center px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <Clock className="mr-1.5 h-3 w-3 text-muted-foreground" />
                Будущая запись
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Завершение процедуры</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {book.applied_discount_id ? (
              appliedDiscount ? (
                <>
                  <div className="rounded-2xl border bg-muted/40 p-3 text-sm">
                    <p className="font-semibold">
                      Применится скидка {appliedDiscount.discount_percent}%
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Скидка считается только от стоимости услуги. Товары и
                      расходники вводятся отдельно.
                    </p>
                    {appliedDiscount.note ? (
                      <p className="mt-2 text-muted-foreground">
                        Комментарий: {appliedDiscount.note}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="service-amount"
                      className="text-xs font-bold uppercase text-muted-foreground"
                    >
                      Стоимость услуги (₽)
                    </Label>
                    <Input
                      id="service-amount"
                      type="text"
                      inputMode="numeric"
                      value={serviceAmount}
                      onChange={(event) =>
                        setServiceAmount(formatPriceInput(event.target.value))
                      }
                      placeholder="0"
                      className="text-lg font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="extra-amount"
                      className="text-xs font-bold uppercase text-muted-foreground"
                    >
                      Товары и расходники (₽)
                    </Label>
                    <Input
                      id="extra-amount"
                      type="text"
                      inputMode="numeric"
                      value={extraAmount}
                      onChange={(event) =>
                        setExtraAmount(formatPriceInput(event.target.value))
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="rounded-2xl border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Скидка</span>
                      <span>
                        {previewDiscountAmount !== null
                          ? `-${previewDiscountAmount} ₽`
                          : "—"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between font-semibold">
                      <span>К оплате</span>
                      <span>
                        {previewFinalAmount !== null
                          ? `${previewFinalAmount} ₽`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-orange-300 bg-orange-50 p-3 text-sm text-orange-900">
                    Выбранная скидка больше недоступна. Визит можно завершить без
                    нее по итоговой стоимости.
                  </div>

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
                </>
              )
            ) : (
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
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={handleComplete}
              disabled={isUpdatingStatus}
              className="w-full rounded-xl"
            >
              {isCompletingAppointment ? (
                <Spinner className="mr-2" />
              ) : book.applied_discount_id && !appliedDiscount ? (
                "Завершить без скидки"
              ) : (
                "Подтвердить доход"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditBook book={book} open={showEdit} onOpenChange={setShowEdit} />
      <DeleteBook id={book.id} open={showDelete} onOpenChange={setShowDelete} />
    </>
  );
}
