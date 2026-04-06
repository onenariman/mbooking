"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { BookingOverlapError } from "@/src/api/receptions.api";
import { getErrorMessage } from "@/src/helpers/getErrorMessage";
import { useAddAppointment } from "@/src/hooks/appointments.hooks";
import { formatAppointmentLabel } from "@/src/lib/appointments/formatAppointmentLabel";
import { notifyAppointmentPushEvent } from "@/src/lib/push/appointments";
import { useCategories } from "@/src/hooks/categories.hooks";
import { useClients } from "@/src/hooks/clients.hooks";
import { useDiscounts } from "@/src/hooks/discounts.hooks";
import { useServices } from "@/src/hooks/services.hook";
import { isPastUtcIso } from "@/src/lib/time";
import {
  createAppointmentSchema,
  ZodAppointmentStatus,
} from "@/src/schemas/books/bookSchema";
import { formatPriceInput } from "@/src/validators/formatPriceInput";
import { formatPhoneDisplay } from "@/src/validators/normalizePhone";
import DateBook from "./DateBook";
import SearchClient from "./SearchClient";
import SearchService from "./SearchService";

interface FormState {
  applied_discount_id: string | null;
  amount: number | null;
  appointment_at: string | null;
  appointment_end: string | null;
  client_name: string | null;
  client_phone: string | null;
  notes: string | null;
  service_id: string | null;
  service_name: string | null;
}

const initialState: FormState = {
  applied_discount_id: null,
  amount: null,
  appointment_at: null,
  appointment_end: null,
  client_name: null,
  client_phone: null,
  notes: null,
  service_id: null,
  service_name: null,
};

export default function AddBook() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialState);

  const { data: clients = [] } = useClients();
  const { data: services = [] } = useServices();
  const { data: categories = [] } = useCategories();
  const {
    data: activeDiscounts = [],
    isLoading: isDiscountsLoading,
  } = useDiscounts({
    phone: form.client_phone,
    serviceId: form.service_id,
    isUsed: false,
  });
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

  const isRangeInvalid = useMemo(() => {
    if (!form.appointment_at || !form.appointment_end) {
      return false;
    }

    return new Date(form.appointment_end) <= new Date(form.appointment_at);
  }, [form.appointment_at, form.appointment_end]);

  const isSubmitDisabled = useMemo(() => {
    return (
      isPending ||
      isTimeInvalid ||
      isRangeInvalid ||
      !form.client_name ||
      !form.service_id ||
      !form.service_name ||
      !form.appointment_at ||
      !form.appointment_end
    );
  }, [
    form.appointment_at,
    form.appointment_end,
    form.client_name,
    form.service_id,
    form.service_name,
    isPending,
    isRangeInvalid,
    isTimeInvalid,
  ]);

  const selectedClientPhone = useMemo(() => {
    return form.client_phone ? formatPhoneDisplay(form.client_phone) : "";
  }, [form.client_phone]);

  const selectedDiscount = useMemo(() => {
    return activeDiscounts.find((discount) => discount.id === form.applied_discount_id);
  }, [activeDiscounts, form.applied_discount_id]);

  const handleSubmit = () => {
    if (isPending || isTimeInvalid) {
      return;
    }

    if (
      !form.client_name ||
      !form.service_id ||
      !form.service_name ||
      !form.appointment_at ||
      !form.appointment_end
    ) {
      toast.error("Заполните обязательные поля");
      return;
    }

    const service = services.find((item) => item.id === form.service_id);
    const category = categories.find(
      (item) => item.id === service?.category_id,
    );
    const categoryName = category?.category_name ?? "Без категории";

    const payload = {
      ...form,
      category_name: categoryName,
      status: "booked" as ZodAppointmentStatus,
    };

    const result = createAppointmentSchema.safeParse(payload);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Проверьте данные записи");
      return;
    }

    addAppointment(result.data, {
      onSuccess: (createdAppointment) => {
        void notifyAppointmentPushEvent({
          appointmentId: createdAppointment.id,
          appointmentLabel: formatAppointmentLabel(
            createdAppointment.appointment_at,
            createdAppointment.appointment_end,
          ),
          event: "created",
        });
        toast.success("Запись создана");
        setForm(initialState);
        setOpen(false);
      },
      onError: (error) => {
        if (error instanceof BookingOverlapError) {
          toast.error("Этот слот уже занят. Выберите другое время");
          return;
        }

        toast.error(getErrorMessage(error, "Ошибка"));
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
          <SheetDescription className="text-xs">Детали визита</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-y-2 py-6">
          <DateBook
            startValue={form.appointment_at}
            endValue={form.appointment_end}
            onChange={(start, end) => {
              updateFormField("appointment_at", start);
              updateFormField("appointment_end", end);
            }}
          />

          <SearchClient
            clients={clients}
            getClient={(client) => {
              setForm((prev) => ({
                ...prev,
                applied_discount_id: null,
                client_name: client.name,
                client_phone: client.phone,
              }));
            }}
          />

          <SearchService
            services={services}
            selectedServiceId={form.service_id}
            getService={(service) => {
              setForm((prev) => ({
                ...prev,
                applied_discount_id: null,
                amount: prev.amount ?? service.price ?? null,
                service_id: service.id,
                service_name: service.name,
              }));
            }}
          />

          {form.client_phone && form.service_id ? (
            isDiscountsLoading || activeDiscounts.length > 0 ? (
              <Alert>
                <AlertTitle>
                  {isDiscountsLoading
                    ? "Проверяем скидки клиента для выбранной услуги"
                    : `Найдены скидки на услугу: ${activeDiscounts.length}`}
                </AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>
                    {selectedClientPhone}
                    {isDiscountsLoading
                      ? " — загружаем доступные скидки."
                      : " — показаны только скидки, привязанные к выбранной услуге."}
                  </p>

                  {!isDiscountsLoading ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {activeDiscounts.map((discount) => (
                          <Badge key={discount.id} variant="destructive">
                            -{discount.discount_percent}%
                          </Badge>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="appointment-discount">
                          Скидка для этой записи
                        </Label>
                        <Select
                          value={form.applied_discount_id ?? "none"}
                          onValueChange={(value) =>
                            updateFormField(
                              "applied_discount_id",
                              value === "none" ? null : value,
                            )
                          }
                        >
                          <SelectTrigger id="appointment-discount" className="w-full">
                            <SelectValue placeholder="Без скидки" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Без скидки</SelectItem>
                            {activeDiscounts.map((discount) => (
                              <SelectItem key={discount.id} value={discount.id}>
                                {`-${discount.discount_percent}%`}
                                {discount.service_name_snapshot
                                  ? ` • ${discount.service_name_snapshot}`
                                  : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <p className="text-xs text-muted-foreground">
                          Скидка применяется только к услуге. Товары и расходники
                          добавляются позже при завершении визита.
                        </p>

                        {selectedDiscount ? (
                          <p className="text-xs text-muted-foreground">
                            Применится скидка {selectedDiscount.discount_percent}% на{" "}
                            {selectedDiscount.service_name_snapshot ?? form.service_name}.
                            {selectedDiscount.note
                              ? ` Комментарий: ${selectedDiscount.note}`
                              : ""}
                          </p>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </AlertDescription>
              </Alert>
            ) : null
          ) : null}

          <Input
            placeholder="Плановая стоимость услуги (₽)"
            className="placeholder:text-black"
            value={form.amount ?? ""}
            onChange={(event) => {
              const numeric = formatPriceInput(event.target.value).replace(
                /\s/g,
                "",
              );
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
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
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
