"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";

import { useClients } from "@/src/hooks/clients.hooks";
import { useServices } from "@/src/hooks/services.hook";
import { useCategories } from "@/src/hooks/categories.hooks";
import { useAddAppointment } from "@/src/hooks/appointments.hooks";

import SearchClient from "./SearchClient";
import SearchService from "./SearchService";
import DateBook from "./DateBook";

import {
  createAppointmentSchema,
  ZodAppointmentStatus,
} from "@/src/schemas/books/bookSchema";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { formatPriceInput } from "@/src/validators/formatPriceInput";

type FormState = {
  client_name: string | null;
  client_phone: string | null;
  service_name: string | null;
  appointment_at: string | null;
  amount: number | null;
  notes: string | null;
};

const initialState: FormState = {
  client_name: null,
  client_phone: null,
  service_name: null,
  appointment_at: null,
  amount: null,
  notes: null,
};

export default function AddBook() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialState);

  const { data: clients = [] } = useClients();
  const { data: services = [] } = useServices();
  const { data: categories = [] } = useCategories();

  // Используем наш обновленный хук с invalidateQueries
  const { mutate: addAppointment, isPending } = useAddAppointment();

  const category_name = useMemo(() => {
    if (!form.service_name) return "Без категории";
    const service = services.find((s) => s.name === form.service_name);
    const category = categories.find((c) => c.id === service?.category_id);
    return category?.category_name ?? "Без категории";
  }, [form.service_name, services, categories]);

  const resetForm = () => setForm(initialState);

  const handleSubmit = () => {
    if (isPending) return;

    // Валидация полей
    if (!form.client_name || !form.service_name || !form.appointment_at) {
      toast.error("Заполните обязательные поля: клиент, услуга и дата");
      return;
    }

    const payload = {
      ...form,
      category_name,
      status: "booked" as ZodAppointmentStatus,
    };

    const result = createAppointmentSchema.safeParse(payload);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    addAppointment(result.data, {
      onSuccess: () => {
        toast.success("Запись успешно создана");
        setOpen(false);
        resetForm();
        // Список обновится автоматически благодаря invalidateQueries в хуке
      },
      onError: (err: unknown) => {
        // Проверяем, является ли err объектом Error, чтобы безопасно прочитать message
        const message =
          err instanceof Error ? err.message : "Ошибка при сохранении";
        toast.error(message);
      },
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) resetForm();
      }}
    >
      <SheetTrigger asChild>
        <Button className="w-full shadow-md" size="lg">
          Добавить запись
        </Button>
      </SheetTrigger>

      <SheetContent
        side="top"
        className="overflow-y-auto max-h-[90vh] rounded-b-3xl"
      >
        <SheetHeader>
          <SheetTitle>Новая запись</SheetTitle>
          <SheetDescription>
            Введите данные клиента и время приема
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 flex flex-col gap-6">
          <DateBook
            value={form.appointment_at}
            onChange={(val) => setForm((p) => ({ ...p, appointment_at: val }))}
          />

          <SearchClient
            clients={clients}
            getClient={(c) =>
              setForm((p) => ({
                ...p,
                client_name: c.name,
                client_phone: c.phone,
              }))
            }
          />

          <SearchService
            services={services}
            getService={(s) => setForm((p) => ({ ...p, service_name: s.name }))}
          />

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase font-bold">
              Стоимость
            </Label>
            <Input
              placeholder="0"
              value={form.amount ?? ""}
              onChange={(e) => {
                const formatted = formatPriceInput(e.target.value);
                const numeric = formatted.replace(/\s/g, "");
                setForm((p) => ({
                  ...p,
                  amount: numeric ? Number(numeric) : null,
                }));
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase font-bold">
              Комментарий
            </Label>
            <Textarea
              className="resize-none"
              placeholder="Дополнительная информация..."
              value={form.notes ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
            />
          </div>
        </div>

        <SheetFooter className="flex flex-col gap-2">
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? <Spinner className="mr-2" /> : "Подтвердить запись"}
          </Button>
          <SheetClose asChild>
            <Button variant="ghost" className="w-full">
              Отмена
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
