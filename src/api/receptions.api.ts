import { createClient } from "@/src/utils/supabase/client";
import {
  ZodAppointment,
  ZodAppointmentStatus,
  ZodCreateAppointment,
} from "../schemas/books/bookSchema";

const supabase = createClient();
const DEFAULT_CATEGORY = "Без категории";

type DateFilter = {
  from: string | null;
  to: string | null;
};

type AppointmentRowLike = Omit<ZodAppointment, "status"> & {
  status: string;
};

const normalizeAppointment = (appointment: AppointmentRowLike): ZodAppointment => ({
  ...appointment,
  status: appointment.status as ZodAppointmentStatus,
});

export class BookingOverlapError extends Error {
  code = "BOOKING_OVERLAP" as const;

  constructor(message = "Выбранный слот уже занят") {
    super(message);
    this.name = "BookingOverlapError";
  }
}

export const fetchAppointments = async ({
  from,
  to,
}: DateFilter): Promise<ZodAppointment[]> => {
  let query = supabase
    .from("appointments")
    .select("*")
    .order("appointment_at", { ascending: true });

  if (from) {
    query = query.gte("appointment_at", from);
  }
  if (to) {
    query = query.lte("appointment_at", to);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }
  if (!data) {
    return [];
  }

  return data.map((item) => normalizeAppointment(item as AppointmentRowLike));
};

export const addAppointment = async (
  appointment: ZodCreateAppointment,
): Promise<ZodAppointment> => {
  const appointmentData = {
    ...appointment,
    category_name: appointment.category_name || DEFAULT_CATEGORY,
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

  if (!data) {
    throw new Error("Не удалось создать запись: пустой ответ от сервера");
  }

  return normalizeAppointment(data as AppointmentRowLike);
};

export const deleteAppointment = async (
  id: string,
): Promise<ZodAppointment[]> => {
  const { data, error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return [];
  }

  return data.map((item) => normalizeAppointment(item as AppointmentRowLike));
};

export const updateAppointment = async (
  id: string,
  updates: Partial<ZodCreateAppointment>,
): Promise<ZodAppointment> => {
  const updatesData = {
    ...updates,
    ...(updates.category_name === undefined
      ? {}
      : { category_name: updates.category_name || DEFAULT_CATEGORY }),
    ...(updates.status === undefined ? {} : { status: updates.status || "booked" }),
  };

  const { data, error } = await supabase
    .from("appointments")
    .update(updatesData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("Не удалось обновить запись: пустой ответ от сервера");
  }

  return normalizeAppointment(data as AppointmentRowLike);
};

