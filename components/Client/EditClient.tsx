"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";

import InputPhone from "../InputPhone";
import { ZodClient } from "@/src/schemas/clients/clientSchema";
import { useUpdateClient } from "@/src/hooks/clients.hooks";
import {
  formatPhoneDisplay,
  normalizePhone,
} from "@/src/validators/normalizePhone";

export function EditClient({
  client,
  open,
  onOpenChange,
}: {
  client: ZodClient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutateAsync, isPending } = useUpdateClient();
  const normalizedInitialPhone = normalizePhone(client.phone ?? "");

  const [name, setName] = useState(client.name ?? "");
  const [phone, setPhone] = useState(
    normalizedInitialPhone
      ? normalizedInitialPhone.slice(1)
      : (client.phone ?? "").replace(/\D/g, "").slice(-10),
  );
  const [localError, setLocalError] = useState("");

  const submit = async () => {
    if (!name.trim() || phone.length < 10) {
      setLocalError("Проверьте правильность заполнения полей");
      return;
    }

    try {
      const normalizedPhone = normalizePhone(phone);

      if (!normalizedPhone) {
        setLocalError("Введите корректный номер телефона");
        return;
      }

      await mutateAsync({
        id: client.id,
        updates: {
          name: name.trim(),
          phone: normalizedPhone,
        },
      });

      onOpenChange(false);
      toast.success("Данные обновлены", {
        description: `Клиент ${name.trim()} обновлен, ${formatPhoneDisplay(normalizedPhone)}`,
      });
    } catch {
      toast.error("Ошибка при сохранении");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Изменить клиента</SheetTitle>
          <SheetDescription>
            Внесите новые данные и нажмите сохранить.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 flex flex-col gap-y-2">
          <Label>Имя клиента</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <InputPhone value={phone} onChange={setPhone} />

          {localError && (
            <p className="text-sm text-destructive">{localError}</p>
          )}
        </div>

        <SheetFooter>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? "Сохранение..." : "Сохранить"}
          </Button>
          <SheetClose asChild>
            <Button variant="outline">Отмена</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
