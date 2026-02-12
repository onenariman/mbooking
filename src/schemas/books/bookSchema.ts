import { z } from "zod";

export const appointmentStatusSchema = z.enum([
  "booked",
  "completed",
  "cancelled",
  "no_show",
]);

export const appointmentSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  user_id: z.string(),
  client_id: z.string().nullable(),
  client_name: z.string(),
  client_phone: z.string(),
  service_name: z.string(),
  category_name: z.string(),
  appointment_at: z.string().nullable(),
  status: appointmentStatusSchema,
  amount: z.number().nullable(),
  notes: z.string().nullable(),
  updated_at: z.string(),
});

export const AppointmentArraySchema = z.array(appointmentSchema);

export type ZodAppointment = z.infer<typeof appointmentSchema>;
export type ZodAppointmentStatus = z.infer<typeof appointmentStatusSchema>;
