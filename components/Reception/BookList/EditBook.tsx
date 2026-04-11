"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { ZodAppointment } from "@/src/schemas/books/bookSchema";
import { useUpdateAppointment } from "@/src/hooks/appointments.hooks";
import { formatPriceInput } from "@/src/validators/formatPriceInput";
import { Spinner } from "@/components/ui/spinner";
import { BookingOverlapError } from "@/src/api/receptions.api";
import { getErrorMessage } from "@/src/helpers/getErrorMessage";
import { formatAppointmentLabel } from "@/src/lib/appointments/formatAppointmentLabel";
import { notifyAppointmentPushEvent } from "@/src/lib/push/appointments";
import DateBook from "../AddBook/DateBook";

export function EditBook({
  book,
  open,
  onOpenChange,
}: {
  book: ZodAppointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutateAsync: updateAppointment, isPending } = useUpdateAppointment();

  const [amount, setAmount] = useState<number | null>(book.amount);
  const [notes, setNotes] = useState<string>(book.notes ?? "");
  const [appointmentAt, setAppointmentAt] = useState<string | null>(
    book.appointment_at,
  );
  const [appointmentEnd, setAppointmentEnd] = useState<string | null>(
    book.appointment_end ?? null,
  );

  const isRangeInvalid = useMemo(() => {
    if (!appointmentAt || !appointmentEnd) {
      return false;
    }
    return new Date(appointmentEnd) <= new Date(appointmentAt);
  }, [appointmentAt, appointmentEnd]);

  const handleSave = async () => {
    try {
      const updatedAppointment = await updateAppointment({
        id: book.id,
        updates: {
          amount,
          notes,
          appointment_at: appointmentAt ?? undefined,
          appointment_end: appointmentEnd ?? undefined,
        },
      });
      const hasScheduleChanged =
        appointmentAt !== book.appointment_at ||
        appointmentEnd !== (book.appointment_end ?? null);

      if (hasScheduleChanged) {
        void notifyAppointmentPushEvent({
          appointmentId: updatedAppointment.id,
          appointmentLabel: formatAppointmentLabel(
            updatedAppointment.appointment_at,
            updatedAppointment.appointment_end,
          ),
          event: "rescheduled",
        });
      }
      toast.success("Запись обновлена");
      onOpenChange(false);
    } catch (error) {
      if (error instanceof BookingOverlapError) {
        toast.error("Этот слот уже занят. Выберите другое время");
        return;
      }
      toast.error(getErrorMessage(error, "Ошибка при сохранении"));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[min(92dvh,720px)] w-full max-w-lg overflow-y-auto rounded-t-3xl border-x-0 border-b-0 border-t bg-background px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 sm:max-w-2xl"
      >
        <SheetHeader className="space-y-1 border-b border-border/80 pb-4 text-left">
          <SheetTitle className="text-xl font-semibold text-foreground">
            Изменить запись
          </SheetTitle>
          <SheetDescription>
            Клиент: {book.client_name} ({book.service_name})
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 py-5">
          <DateBook
            startValue={appointmentAt}
            endValue={appointmentEnd}
            onChange={(start, end) => {
              setAppointmentAt(start);
              setAppointmentEnd(end);
            }}
          />

          <div className="space-y-2">
            <Label>Стоимость</Label>
            <Input
              value={amount ?? ""}
              onChange={(e) => {
                const formatted = formatPriceInput(e.target.value);
                const numeric = formatted.replace(/\s/g, "");
                setAmount(numeric ? Number(numeric) : null);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Заметки…"
            />
          </div>
        </div>

        <SheetFooter className="flex flex-col gap-2 border-t pt-4">
          <Button
            onClick={handleSave}
            disabled={isPending || isRangeInvalid}
            className="w-full"
          >
            {isPending ? <Spinner className="mr-2" /> : "Сохранить изменения"}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Отмена
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
