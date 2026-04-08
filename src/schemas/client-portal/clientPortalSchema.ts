import { z } from "zod";
import { normalizePhone } from "@/src/validators/normalizePhone";

const clientPhoneInputSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizePhone(value) : value),
  z.string().regex(/^7\d{10}$/, "Телефон должен быть в формате 7XXXXXXXXXX"),
);

export const clientInvitationPurposeSchema = z.enum([
  "activation",
  "password_reset",
]);

export const createClientInvitationSchema = z.object({
  client_id: z.string().uuid().optional(),
  client_user_id: z.string().uuid().optional(),
  client_phone: clientPhoneInputSchema,
  purpose: clientInvitationPurposeSchema.default("activation"),
  expires_in_hours: z.number().int().min(1).max(24 * 14).default(24 * 7),
});

export const activateClientInvitationSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Введите корректный email"),
    password: z
      .string()
      .min(8, "Пароль должен содержать не менее 8 символов")
      .max(72, "Пароль слишком длинный"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Пароли не совпадают",
    path: ["confirm_password"],
  });

export const clientSettingsSchema = z
  .object({
    notifications_enabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Нет полей для обновления",
  });

export type ZodCreateClientInvitation = z.infer<
  typeof createClientInvitationSchema
>;
export type ZodActivateClientInvitation = z.infer<
  typeof activateClientInvitationSchema
>;
export type ZodClientSettings = z.infer<typeof clientSettingsSchema>;
