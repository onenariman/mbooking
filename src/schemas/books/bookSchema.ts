import { z } from "zod";

// Статусы записи
export const appointmentStatusSchema = z.enum([
  "booked",
  "completed",
  "cancelled",
  "no_show",
]);

// Полная схема записи (для получения из Supabase)
export const appointmentSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  user_id: z.string(),
  client_name: z.string(),
  client_phone: z.string(),
  service_name: z.string(),
  category_name: z.string(),
  appointment_at: z.string().nullable(),
  status: appointmentStatusSchema,
  amount: z.number().nullable(),
  notes: z.string().nullable(),
});

export const AppointmentArraySchema = z.array(appointmentSchema);

// -----------------------
// Схема для создания новой записи
export const createAppointmentSchema = z.object({
  client_name: z.string().min(1, "Имя клиента обязательно"),
  client_phone: z.string().min(1, "Телефон клиента обязателен"),
  service_name: z.string().min(1, "Услуга обязательна"),
  category_name: z.string().optional(), // если нет категории → "Без категории"
  appointment_at: z.string().min(1, "Дата и время обязательны"),
  status: appointmentStatusSchema.default("booked"),
  amount: z.number().nullable(),
  notes: z.string().nullable(),
});

export type ZodAppointment = z.infer<typeof appointmentSchema>;
export type ZodAppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export type ZodCreateAppointment = z.infer<typeof createAppointmentSchema>;
