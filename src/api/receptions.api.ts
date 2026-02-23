import { createClient } from "@/src/utils/supabase/client";
import { ZodAppointment } from "../schemas/books/bookSchema";

const supabase = createClient();

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
}: {
  from: string | null;
  to: string | null;
}) => {
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

  if (error) throw error;

  return data;
};

export const addAppointment = async (
  appointment: Partial<ZodAppointment>,
): Promise<ZodAppointment> => {
  const { data, error } = await supabase
    .from("appointments")
    .insert([appointment])
    .select()
    .single();

  if (error) {
    if (error.code === "23P01" || error.code === "23505") {
      throw new BookingOverlapError();
    }

    throw new Error(error.message);
  }

  return data as ZodAppointment;
};

/**
 * Удаление записи по ID
 */
export const deleteAppointment = async (id: string) => {
  const { data, error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Обновление записи (например, смена статуса или времени)
 */
export const updateAppointment = async (
  id: string,
  updates: Partial<ZodAppointment>,
) => {
  const { data, error } = await supabase
    .from("appointments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ZodAppointment;
};
