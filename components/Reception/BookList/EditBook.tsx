"use client";

import { useState } from "react";
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

  // Локальное состояние полей (по аналогии с AddBook)
  const [amount, setAmount] = useState<number | null>(book.amount);
  const [notes, setNotes] = useState<string>(book.notes ?? "");

  const handleSave = async () => {
    try {
      await updateAppointment({
        id: book.id,
        updates: {
          amount,
          notes,
        },
      });
      toast.success("Запись обновлена");
      onOpenChange(false);
    } catch {
      toast.error("Ошибка при сохранении");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Изменить запись</SheetTitle>
          <SheetDescription>
            Клиент: {book.client_name} ({book.service_name})
          </SheetDescription>
        </SheetHeader>

        <div className=" px-6 flex flex-col gap-4">
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
            />
          </div>
        </div>

        <SheetFooter className="flex flex-col gap-2">
          <Button onClick={handleSave} disabled={isPending} className="w-full">
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
