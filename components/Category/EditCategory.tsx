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

import { ZodCategory } from "@/src/schemas/categories/categorySchema";
import { useUpdateCategory } from "@/src/hooks/categories.hooks";
import { getErrorMessage } from "@/src/helpers/getErrorMessage";

const EditCategory = ({
  category,
  open,
  onOpenChange,
}: {
  category: ZodCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { mutateAsync, isPending } = useUpdateCategory();

  const [name, setName] = useState(category.category_name ?? "");
  const [localError, setLocalError] = useState("");

  const submit = async () => {
    const trimmed = name.trim();

    if (trimmed.length < 2) {
      setLocalError("Проверьте правильность заполнения полей");
      return;
    }

    try {
      await mutateAsync({
        id: category.id,
        updates: { category_name: trimmed },
      });

      onOpenChange(false);
      setLocalError("");

      toast.success("Данные обновлены", {
        description: `Категория ${trimmed} успешно изменена`,
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
          <SheetTitle>Изменить категорию</SheetTitle>
          <SheetDescription>
            Внесите новые данные и нажмите сохранить.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 flex flex-col gap-y-2">
          <Label>Название категории</Label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (localError) setLocalError("");
            }}
          />

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
};

export default EditCategory;
