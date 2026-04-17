import { z } from "zod";
import { normalizePhone } from "@/src/validators/normalizePhone";

const phoneSchema = z
  .string()
  .transform((value) => normalizePhone(value))
  .refine((value) => /^7\d{10}$/.test(value), {
    message: "Телефон должен быть в формате 7XXXXXXXXXX",
  });

const innSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => /^(\d{10}|\d{12})$/.test(value), {
    message: "ИНН должен содержать 10 или 12 цифр",
  });

export const patchOwnerOrganizationSchema = z
  .object({
    full_name: z.string().trim().max(120).nullable().optional(),
    phone: z.union([phoneSchema, z.null()]).optional(),
    inn: z.union([innSchema, z.null()]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Нет полей для обновления",
  });

export type ZodPatchOwnerOrganization = z.infer<
  typeof patchOwnerOrganizationSchema
>;

