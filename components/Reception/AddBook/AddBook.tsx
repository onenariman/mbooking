"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { BookingOverlapError } from "@/src/api/receptions.api";
import { isPastUtcIso } from "@/src/lib/time";
import { useAddAppointment } from "@/src/hooks/appointments.hooks";
import { useCategories } from "@/src/hooks/categories.hooks";
import { useClients } from "@/src/hooks/clients.hooks";
import { useServices } from "@/src/hooks/services.hook";
import {
  createAppointmentSchema,
  ZodAppointmentStatus,
} from "@/src/schemas/books/bookSchema";
import { formatPriceInput } from "@/src/validators/formatPriceInput";
import DateBook from "./DateBook";
import SearchClient from "./SearchClient";
import SearchService from "./SearchService";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

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
  const [form, setForm] = useState<FormState>(initialState);

  const { data: clients = [] } = useClients();
  const { data: services = [] } = useServices();
  const { data: categories = [] } = useCategories();
  const { mutate: addAppointment, isPending } = useAddAppointment();

  const updateFormField = useCallback(
    <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const isTimeInvalid = useMemo(() => {
    if (!form.appointment_at) {
      return false;
    }

    return isPastUtcIso(form.appointment_at);
  }, [form.appointment_at]);

  const isSubmitDisabled = useMemo(() => {
    return (
      isPending ||
      isTimeInvalid ||
      !form.client_name ||
      !form.service_name ||
      !form.appointment_at
    );
  }, [
    form.appointment_at,
    form.client_name,
    form.service_name,
    isPending,
    isTimeInvalid,
  ]);

  const handleSubmit = () => {
    if (isPending || isTimeInvalid) {
      return;
    }

    if (!form.client_name || !form.service_name || !form.appointment_at) {
      toast.error("Заполните обязательные поля");
      return;
    }

    const service = services.find((item) => item.name === form.service_name);
    const category = categories.find((item) => item.id === service?.category_id);
    const categoryName = category?.category_name ?? "Без категории";

    const payload = {
      ...form,
      category_name: categoryName,
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
        setForm(initialState);
        setOpen(false);
      },
      onError: (error) => {
        if (error instanceof BookingOverlapError) {
          toast.error("Этот слот уже занят. Выберите другое время");
          return;
        }

        toast.error(error instanceof Error ? error.message : "Ошибка");
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="w-full shadow-lg" size="lg" variant="default">
          Добавить запись
        </Button>
      </SheetTrigger>
      <SheetContent
        side="top"
        className="mx-auto min-h-fit max-w-5xl overflow-y-auto rounded-b-[2.5rem] border-none bg-background px-6"
      >
        <SheetHeader className="pb-2 pt-4 text-white">
          <SheetTitle className="text-2xl">Новая запись</SheetTitle>
          <SheetDescription className="text-xs text-white">
            Детали визита
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-y-2 py-6">
          <DateBook
            value={form.appointment_at}
            onChange={(value) => updateFormField("appointment_at", value)}
          />

          <SearchClient
            clients={clients}
            getClient={(client) => {
              updateFormField("client_name", client.name);
              updateFormField("client_phone", client.phone);
            }}
          />

          <SearchService
            services={services}
            getService={(service) => updateFormField("service_name", service.name)}
          />

          <Input
            placeholder="Стоимость (₽)"
            className="placeholder:text-black"
            value={form.amount ?? ""}
            onChange={(event) => {
              const numeric = formatPriceInput(event.target.value).replace(/\s/g, "");
              updateFormField("amount", numeric ? Number(numeric) : null);
            }}
          />

          <Label>Комментарий</Label>
          <Textarea
            className="placeholder:text-black"
            placeholder="Заметки..."
            value={form.notes ?? ""}
            onChange={(event) => updateFormField("notes", event.target.value)}
          />
        </div>

        <SheetFooter className="flex flex-col gap-3 border-t pb-8 pt-4">
          <Button variant="default" onClick={handleSubmit} disabled={isSubmitDisabled}>
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

