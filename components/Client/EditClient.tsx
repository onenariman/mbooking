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

  const [name, setName] = useState(client.name ?? "");
  const [phone, setPhone] = useState(
    client.phone?.startsWith("7")
      ? client.phone.slice(1)
      : (client.phone ?? ""),
  );
  const [localError, setLocalError] = useState("");

  const submit = async () => {
    if (!name.trim() || phone.length < 10) {
      setLocalError("Проверьте правильность заполнения полей");
      return;
    }

    try {
      await mutateAsync({
        id: client.id,
        updates: {
          name: name.trim(),
          phone: `7${phone}`,
        },
      });

      onOpenChange(false);
      toast.success("Данные обновлены", {
        description: `Клиент ${name} успешно изменён`,
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
