"use client";

import { useState, useMemo, useCallback } from "react";
import dayjs from "dayjs";
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

// ЯВНОЕ ОПРЕДЕЛЕНИЕ ТИПОВ (решает твою ошибку)
interface FormState {
  client_name: string | null;
  client_phone: string | null;
  service_name: string | null;
  appointment_at: string | null;
  amount: number | null;
  notes: string | null;
}

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

  // Указываем тип FormState для useState
  const [form, setForm] = useState<FormState>(initialState);

  const { data: clients = [] } = useClients();
  const { data: services = [] } = useServices();
  const { data: categories = [] } = useCategories();
  const { mutate: addAppointment, isPending } = useAddAppointment();

  const handleDateChange = useCallback((val: string | null) => {
    setForm((prev) =>
      prev.appointment_at === val ? prev : { ...prev, appointment_at: val },
    );
  }, []);

  const isTimeInvalid = useMemo(() => {
    if (!form.appointment_at) return false;
    return dayjs(form.appointment_at).isBefore(dayjs().subtract(1, "minute"));
  }, [form.appointment_at]);

  const handleSubmit = () => {
    if (isPending || isTimeInvalid) return;
    if (!form.client_name || !form.service_name || !form.appointment_at) {
      toast.error("Заполните обязательные поля");
      return;
    }

    const service = services.find((s) => s.name === form.service_name);
    const category = categories.find((c) => c.id === service?.category_id);
    const category_name = category?.category_name ?? "Без категории";

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
        toast.success("Запись создана");
        setOpen(false);
        setForm(initialState);
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Ошибка"),
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="w-full shadow-lg" size="lg">
          Добавить запись
        </Button>
      </SheetTrigger>
      <SheetContent
        side="top"
        className="overflow-y-auto min-h-fit rounded-b-[2.5rem] px-6 border-none bg-background max-w-5xl mx-auto"
      >
        <SheetHeader className="pt-2 pb-4 text-left border-b">
          <SheetTitle className="text-2xl font-black text-primary">
            Новая запись
          </SheetTitle>
          <SheetDescription className="text-sm opacity-60">
            Детали визита
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 flex flex-col gap-y-2">
          <DateBook value={form.appointment_at} onChange={handleDateChange} />

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
          <Input
            placeholder="Стоимость (₽)"
            value={form.amount ?? ""}
            onChange={(e) => {
              const numeric = formatPriceInput(e.target.value).replace(
                /\s/g,
                "",
              );
              setForm((p) => ({
                ...p,
                amount: numeric ? Number(numeric) : null,
              }));
            }}
          />
          <Label>Комментарий</Label>
          <Textarea
            placeholder="Заметки..."
            value={form.notes ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          />
        </div>

        <SheetFooter className="pt-4 pb-8 flex flex-col gap-3 border-t">
          <Button onClick={handleSubmit} disabled={isPending || isTimeInvalid}>
            {isPending ? <Spinner className="mr-2" /> : "Забронировать визит"}
          </Button>

          <SheetClose asChild>
            <Button variant="outline" className="w-full">
              Отмена
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
