import { z } from "zod";

export const discountSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  client_phone: z.string(),
  appointment_id: z.string().nullable(),
  expires_at: z.string().nullable(),
  feedback_token: z.string().nullable(),
  discount_percent: z.number().int().min(1).max(100),
  is_used: z.boolean(),
  note: z.string().nullable(),
  reserved_at: z.string().nullable(),
  reserved_for_appointment_id: z.string().nullable(),
  service_id: z.string().nullable(),
  service_name_snapshot: z.string().nullable(),
  source_type: z.enum(["feedback", "manual"]),
  used_at: z.string().nullable(),
  used_on_appointment_id: z.string().nullable(),
  created_at: z.string(),
});

export const discountArraySchema = z.array(discountSchema);

export const createDiscountSchema = z.object({
  client_phone: z.string().min(1, "Телефон клиента обязателен"),
  discount_percent: z.number().int().min(1).max(100),
  service_id: z.string().uuid("Выберите услугу для скидки"),
  note: z.string().trim().max(500).nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
});

export type ZodDiscount = z.infer<typeof discountSchema>;
export type ZodCreateDiscount = z.infer<typeof createDiscountSchema>;
