import { z } from "zod";
import { normalizePhone } from "@/src/validators/normalizePhone";

const clientPhoneInputSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizePhone(value) : value),
  z
    .string()
    .regex(/^7\d{10}$/, "Телефон должен быть в формате 7XXXXXXXXXX"),
);

export const clientSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  name: z
    .string()
    .min(1, "Имя обязательно")
    .max(255, "Имя слишком длинное"),
  phone: z
    .string()
    .min(1, "Телефон обязателен")
    .max(255, "Телефон слишком длинный"),
  user_id: z.string(),
});

export const clientInputSchema = z.object({
  name: clientSchema.shape.name,
  phone: clientPhoneInputSchema,
});

export const ClientArraySchema = z.array(clientSchema);

export type ZodClient = z.infer<typeof clientSchema>;
export type ZodClientInput = z.infer<typeof clientInputSchema>;
