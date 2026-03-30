import { z } from "zod";
import { normalizePhone } from "@/src/validators/normalizePhone";

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
  applied_discount_id: z.string().nullable().optional(),
  client_name: z.string(),
  client_phone: z.string(),
  service_id: z.string().nullable().optional(),
  service_name: z.string(),
  category_name: z.string(),
  appointment_at: z.string().nullable(),
  appointment_end: z.string().nullable(),
  status: appointmentStatusSchema,
  amount: z.number().nullable(),
  service_amount: z.number().nullable().optional(),
  extra_amount: z.number().nullable().optional(),
  discount_amount: z.number().nullable().optional(),
  notes: z.string().nullable(),
});

export const AppointmentArraySchema = z.array(appointmentSchema);

const appointmentPhoneInputSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizePhone(value) : value),
  z
    .string()
    .regex(/^7\d{10}$/, "Телефон клиента должен быть в формате 7XXXXXXXXXX"),
);

export const createAppointmentSchema = z
  .object({
    client_name: z.string().min(1, "Имя клиента обязательно"),
    client_phone: appointmentPhoneInputSchema,
    service_id: z.string().uuid("Выберите услугу"),
    service_name: z.string().min(1, "Услуга обязательна"),
    category_name: z.string().optional(),
    appointment_at: z.string().min(1, "Дата и время обязательны"),
    appointment_end: z.string().min(1, "Время окончания обязательно"),
    applied_discount_id: z.string().uuid().nullable().optional(),
    status: appointmentStatusSchema.default("booked"),
    amount: z.number().nullable(),
    notes: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.appointment_at || !data.appointment_end) {
      return;
    }

    const start = new Date(data.appointment_at);
    const end = new Date(data.appointment_end);

    if (!(end > start)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Время окончания должно быть позже начала",
        path: ["appointment_end"],
      });
    }
  });

export type ZodAppointment = z.infer<typeof appointmentSchema>;
export type ZodAppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export type ZodCreateAppointment = z.infer<typeof createAppointmentSchema>;
