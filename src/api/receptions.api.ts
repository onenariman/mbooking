import { createClient } from "@/src/utils/supabase/client";
import { ZodAppointment } from "../schemas/books/bookSchema";

const supabase = createClient();

/**
 * Получение всех записей
 */
export const fetchAppointments = async (): Promise<ZodAppointment[]> => {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("appointment_at", { ascending: true }); // Сортировка по времени записи

  if (error) {
    throw new Error(error.message);
  }

  return data as ZodAppointment[];
};

/**
 * Добавление новой записи
 * Принимает Partial, так как id и created_at генерируются базой
 */
export const addAppointment = async (
  appointment: Partial<ZodAppointment>,
): Promise<ZodAppointment> => {
  const { data, error } = await supabase
    .from("appointments")
    .insert([appointment])
    .select()
    .single();

  if (error) {
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
