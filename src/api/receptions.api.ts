import { createClient } from "@/src/utils/supabase/client";
import {
  ZodAppointment,
  ZodCreateAppointment,
} from "../schemas/books/bookSchema";

const supabase = createClient();

// -----------------------
// Ошибка при пересечении записи
export class BookingOverlapError extends Error {
  code = "BOOKING_OVERLAP" as const;

  constructor(message = "Выбранный слот уже занят") {
    super(message);
    this.name = "BookingOverlapError";
  }
}

// -----------------------
// Получение записей с фильтром по дате
export const fetchAppointments = async ({
  from,
  to,
}: {
  from: string | null;
  to: string | null;
}): Promise<ZodAppointment[]> => {
  let query = supabase
    .from("appointments")
    .select("*")
    .order("appointment_at", { ascending: true });

  if (from) query = query.gte("appointment_at", from);
  if (to) query = query.lte("appointment_at", to);

  const { data, error } = await query;

  if (error) throw error;
  if (!data) return [];

  // Приводим status к enum Zod
  return data.map((item) => ({
    ...item,
    status: item.status as "booked" | "completed" | "cancelled" | "no_show",
  }));
};

// -----------------------
// Добавление новой записи
export const addAppointment = async (
  appointment: ZodCreateAppointment,
): Promise<ZodAppointment> => {
  const appointmentData = {
    ...appointment,
    category_name: appointment.category_name || "Без категории",
    status: appointment.status || "booked",
  };

  const { data, error } = await supabase
    .from("appointments")
    .insert([appointmentData])
    .select()
    .single();

  if (error) {
    if (error.code === "23P01" || error.code === "23505") {
      throw new BookingOverlapError();
    }
    throw new Error(error.message);
  }

  if (!data) throw new Error("Не удалось создать запись, data = null");

  return {
    ...data,
    status: data.status as "booked" | "completed" | "cancelled" | "no_show",
  };
};

// -----------------------
// Удаление записи по ID
export const deleteAppointment = async (
  id: string,
): Promise<ZodAppointment[]> => {
  const { data, error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)
    .select(); // возвращаем массив удалённых записей

  if (error) throw new Error(error.message);
  if (!data) return [];

  return data.map((item) => ({
    ...item,
    status: item.status as "booked" | "completed" | "cancelled" | "no_show",
  }));
};

// -----------------------
// Обновление записи (можно передавать только нужные поля)
export const updateAppointment = async (
  id: string,
  updates: Partial<ZodCreateAppointment>,
): Promise<ZodAppointment> => {
  const updatesData = {
    ...updates,
    ...(updates.category_name === undefined
      ? {}
      : { category_name: updates.category_name || "Без категории" }),
    ...(updates.status === undefined
      ? {}
      : { status: updates.status || "booked" }),
  };

  const { data, error } = await supabase
    .from("appointments")
    .update(updatesData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Не удалось обновить запись, data = null");

  return {
    ...data,
    status: data.status as "booked" | "completed" | "cancelled" | "no_show",
  };
};
