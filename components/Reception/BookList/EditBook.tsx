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
      await updateAppointment({
        id: book.id,
        updates: {
          amount,
          notes,
          appointment_at: appointmentAt ?? undefined,
          appointment_end: appointmentEnd ?? undefined,
        },
      });
      toast.success("Р—Р°РїРёСЃСЊ РѕР±РЅРѕРІР»РµРЅР°");
      onOpenChange(false);
    } catch (error) {
      if (error instanceof BookingOverlapError) {
        toast.error("Р­С‚РѕС‚ СЃР»РѕС‚ СѓР¶Рµ Р·Р°РЅСЏС‚. Р’С‹Р±РµСЂРёС‚Рµ РґСЂСѓРіРѕРµ РІСЂРµРјСЏ");
        return;
      }
      toast.error(getErrorMessage(error, "РћС€РёР±РєР° РїСЂРё СЃРѕС…СЂР°РЅРµРЅРёРё"));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>РР·РјРµРЅРёС‚СЊ Р·Р°РїРёСЃСЊ</SheetTitle>
          <SheetDescription>
            РљР»РёРµРЅС‚: {book.client_name} ({book.service_name})
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 flex flex-col gap-4">
          <DateBook
            startValue={appointmentAt}
            endValue={appointmentEnd}
            onChange={(start, end) => {
              setAppointmentAt(start);
              setAppointmentEnd(end);
            }}
          />

          <div className="space-y-2">
            <Label>РЎС‚РѕРёРјРѕСЃС‚СЊ</Label>
            <Input
              value={amount ?? ""}
              onChange={(e) => {
                const formatted = formatPriceInput(e.target.value);
                const numeric = formatted.replace(/\\s/g, "");
                setAmount(numeric ? Number(numeric) : null);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>РљРѕРјРјРµРЅС‚Р°СЂРёР№</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <SheetFooter className="flex flex-col gap-2">
          <Button
            onClick={handleSave}
            disabled={isPending || isRangeInvalid}
            className="w-full"
          >
            {isPending ? <Spinner className="mr-2" /> : "РЎРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ"}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            РћС‚РјРµРЅР°
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}


