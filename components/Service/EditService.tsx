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

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";

import { useUpdateServices } from "@/src/hooks/services.hook";
import { ZodService } from "@/src/schemas/services/serviceSchema";
import { useCategories } from "@/src/hooks/categories.hooks";
import { formatPriceInput } from "@/src/validators/formatPriceInput";
import { getErrorMessage } from "@/src/helpers/getErrorMessage";

export function EditService({
  service,
  open,
  onOpenChange,
}: {
  service: ZodService;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutateAsync, isPending } = useUpdateServices();
  const { data: categories = [] } = useCategories();

  const [name, setName] = useState(service.name ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(
    service.category_id ?? null,
  );
  const [price, setPrice] = useState<number | null>(service.price ?? null);
  const [localError, setLocalError] = useState("");

  const submit = async () => {
    if (!name.trim()) {
      setLocalError("Введите название услуги");
      return;
    }

    try {
      await mutateAsync({
        id: service.id,
        updates: {
          name: name.trim(),
          category_id: categoryId,
          price,
        },
      });

      onOpenChange(false);

      toast.success("Данные обновлены", {
        description: `Услуга ${name} успешно изменена`,
      });
    } catch (error: unknown) {
      toast.error("Ошибка при сохранении", {
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Изменить услугу</SheetTitle>
          <SheetDescription>
            Внесите новые данные и нажмите «Сохранить».
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 flex flex-col gap-y-4">
          {/* Название */}
          <div className="flex flex-col gap-y-1">
            <Label>Название услуги</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* Цена */}
          <div className="flex flex-col gap-y-1">
            <Label>Цена</Label>
            <Input
              placeholder="Стоимость услуги"
              value={price ?? ""}
              onChange={(e) => {
                const formatted = formatPriceInput(e.target.value);
                setPrice(formatted === "" ? null : Number(formatted));
              }}
            />
          </div>

          {/* Категория */}
          <div className="flex flex-col gap-y-1">
            <Label>Категория</Label>
            <Select
              value={categoryId ?? undefined}
              onValueChange={setCategoryId}
            >
              <SelectTrigger className="w-full">
                <div className="input-like">
                  {categoryId
                    ? categories.find((c) => c.id === categoryId)?.category_name
                    : "Выберите категорию"}
                </div>
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Категории</SelectLabel>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.category_name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {localError && (
            <p className="text-sm text-destructive">{localError}</p>
          )}
        </div>

        <SheetFooter className="flex gap-x-2">
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
