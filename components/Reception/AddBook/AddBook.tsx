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
  appointment_at: string | null; // ISO string
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
  const { mutate: addAppointment, isPending } = useAddAppointment();

  // Вычисляем категорию автоматически
  const category_name = useMemo(() => {
    if (!form.service_name) return "Без категории";

    const service = services.find((s) => s.name === form.service_name);
    const category = categories.find((c) => c.id === service?.category_id);

    return category?.category_name ?? "Без категории";
  }, [form.service_name, services, categories]);

  const resetForm = () => setForm(initialState);

  const handleOpenChange = (state: boolean) => {
    setOpen(state);
    if (!state) resetForm();
  };

  const handleSubmit = () => {
    if (isPending) return;

    // ✅ Проверка обязательных полей
    if (
      !form.client_name?.trim() ||
      !form.client_phone?.trim() ||
      !form.service_name?.trim() ||
      !form.appointment_at?.trim()
    ) {
      toast.error("Заполните все обязательные поля: клиент, услуга и дата");
      return;
    }

    const payload = {
      ...form,
      category_name,
      status: "booked" as ZodAppointmentStatus,
    };

    // ✅ Валидация через createAppointmentSchema
    const result = createAppointmentSchema.safeParse(payload);

    if (!result.success) {
      const msg = result.error.issues.map((i) => i.message).join(", ");
      toast.error(msg);
      return;
    }

    console.log("Payload для Supabase:", result.data);

    addAppointment(result.data, {
      onSuccess: () => {
        toast.success("Запись успешно создана");
        setOpen(false);
        resetForm();
      },
      onError: (error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Неизвестная ошибка";
        toast.error(message);
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button className="w-full">Добавить запись</Button>
      </SheetTrigger>

      <SheetContent
        side="top"
        className="overflow-y-auto max-h-screen px-5"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Новая запись</SheetTitle>
          <SheetDescription>Заполните обязательные поля</SheetDescription>
        </SheetHeader>

        <div className="py-4 flex flex-col gap-5">
          {/* Дата и время */}
          <DateBook
            value={form.appointment_at}
            onChange={(val) =>
              setForm((prev) => ({ ...prev, appointment_at: val || null }))
            }
          />

          {/* Клиент */}
          <SearchClient
            clients={clients}
            getClient={(client) =>
              setForm((prev) => ({
                ...prev,
                client_name: client.name,
                client_phone: client.phone,
              }))
            }
          />

          {/* Услуга */}
          <SearchService
            services={services}
            getService={(service) =>
              setForm((prev) => ({ ...prev, service_name: service.name }))
            }
          />

          {/* Стоимость */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs italic">
              Стоимость (если отличается)
            </Label>
            <Input
              value={form.amount ?? ""}
              onChange={(e) => {
                const formatted = formatPriceInput(e.target.value);
                const numeric = formatted.replace(/\s/g, "");
                setForm((prev) => ({
                  ...prev,
                  amount: numeric ? Number(numeric) : null,
                }));
              }}
            />
          </div>

          {/* Комментарий */}
          <Textarea
            className="resize-none"
            placeholder="Комментарий"
            value={form.notes ?? ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, notes: e.target.value || null }))
            }
          />
        </div>

        <SheetFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Сохраняем...
              </>
            ) : (
              "Сохранить запись"
            )}
          </Button>

          <SheetClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Отмена
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
